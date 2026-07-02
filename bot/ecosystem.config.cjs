module.exports = {
  apps: [
    {
      name: "nexis-forum-bot",
      cwd: __dirname,
      script: "npm",
      args: "start",
      autorestart: true,
      max_restarts: 50,
      restart_delay: 10000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
