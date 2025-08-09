#!/usr/bin/env node
/**
 * Baixa vendor-<platform>-<arch>.tar.gz de um Release do GitHub
 * e extrai para vendor/<platform>-<arch>/...
 *
 * Requer envs:
 * - REPO_SLUG: "owner/repo"  (ex.: "vitorric/read-pdf2llm")
 * - VENDOR_RELEASE_TAG: tag do release (ex.: "vendor-v1")
 * - GITHUB_TOKEN: token do GitHub (no Actions já vem em secrets.GITHUB_TOKEN)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_SLUG = process.env.REPO_SLUG || 'vitorric/read-pdf2llm';
const TAG = process.env.VENDOR_RELEASE_TAG || 'vendor-v1';
const TOKEN = process.env.GITHUB_TOKEN;

if (!REPO_SLUG || !TAG || !TOKEN) {
  console.error('Missing envs. Need REPO_SLUG, VENDOR_RELEASE_TAG, GITHUB_TOKEN');
  process.exit(1);
}

function mapPlatform(p) {
  if (p === 'linux') return 'linux';
  if (p === 'darwin') return 'darwin';
  if (p === 'win32') return 'win32';
  throw new Error('Unsupported platform: ' + p);
}
function mapArch(a) {
  if (a === 'x64') return 'x64';
  if (a === 'arm64') return 'arm64';
  throw new Error('Unsupported arch: ' + a);
}

const platform = mapPlatform(process.platform);
const arch = mapArch(process.arch);
const assetName = `vendor-${platform}-${arch}.tar.gz`;
const apiUrl = `https://api.github.com/repos/${REPO_SLUG}/releases/tags/${TAG}`;

function ghGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'fetch-vendor-script',
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        ghGet(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`GET ${url} -> ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log(`Fetching release: ${apiUrl}`);
  const rel = JSON.parse((await ghGet(apiUrl)).toString('utf8'));
  const asset = (rel.assets || []).find(a => a.name === assetName);
  if (!asset) {
    console.error(`Asset not found: ${assetName}`);
    process.exit(2);
  }
  console.log(`Downloading ${asset.name} ...`);
  const buf = await ghGet(asset.browser_download_url);
  const tmp = path.join(process.cwd(), asset.name);
  fs.writeFileSync(tmp, buf);
  console.log(`Saved: ${tmp} (${buf.length} bytes)`);

  const outDir = path.join(process.cwd(), 'vendor', `${platform}-${arch}`);
  fs.mkdirSync(outDir, { recursive: true });

  const tar = spawnSync('tar', ['-xzf', tmp, '-C', outDir]);
  if (tar.status !== 0) {
    console.error('tar extract failed:', tar.stderr?.toString() || tar.stdout?.toString());
    process.exit(3);
  }
  fs.unlinkSync(tmp);
  console.log(`Extracted to ${outDir}`);
})();
