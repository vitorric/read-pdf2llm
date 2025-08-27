export interface ConfigEnv {
  port: number;
}

const getEnvVar = (name: string, required = true) => {
  const envVar = process.env[name] || '';
  if (required && !envVar) throw new Error(`Missing required env var ${name}`);
  return envVar;
};

export default (): ConfigEnv => {
  return {
    port: parseInt(getEnvVar('PORT'), 10),
  };
};
