/**
 * pm2 process file — single instance only (no cluster).
 *
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup   # optional: survive reboot
 *
 * Note: with one instance, `pm2 reload` has no zero-downtime benefit; `pm2 restart` is fine.
 */
module.exports = {
  apps: [
    {
      name: 'math-valley',
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '--env-file-if-exists=.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        SERVE_STATIC: '1',
      },
    },
  ],
}
