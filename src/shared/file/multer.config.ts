import { diskStorage } from 'multer';
import { Request } from 'express';
import * as fs from 'fs';
import { join } from 'path';

export function multerUploadConfig() {
  return {
    storage: diskStorage({
      destination: (req: Request, file, cb) => {
        const now = new Date();
        const folder = join(
          process.cwd(),
          'uploads',
          `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
        );
        fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
      },
      filename: (req: Request, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}-${sanitized}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req: Request, file, cb) => {
      const allowedTypes = ['application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não permitido!'), false);
      }
    },
    limits: {
      fileSize: 1 * 1024 * 1024, // 5MB
    },
  };
}
