module.exports = {
  apps: [{
    name: 'hathor-imports',
    cwd: './backend',
    script: 'server.js',
    
    // Modo cluster para aproveitar múltiplos cores
    instances: 'max',
    exec_mode: 'cluster',
    
    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    
    env_development: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    
    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Restart automático
    autorestart: true,
    max_memory_restart: '1G',
    
    // Não assistir arquivos em produção
    watch: false,
    
    // Ignorar arquivos
    ignore_watch: ['node_modules', 'logs', '.git'],
    
    // Tempo de espera antes de matar o processo
    kill_timeout: 5000,
    
    // Tempo de espera antes de considerar o app iniciado
    listen_timeout: 10000,
    
    // Número máximo de restarts em 1 minuto
    max_restarts: 10,
    min_uptime: '10s',
    
    // Cron para restart (opcional - descomente se necessário)
    // cron_restart: '0 3 * * *', // Restart diário às 3h
    
    // Variáveis de ambiente adicionais
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      LOG_LEVEL: 'info'
    }
  }],
  
  // Configuração de deploy (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'seu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/hathorimports.git',
      path: '/var/www/hathorimports',
      'post-deploy': 'cd backend && npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git'
    }
  }
};

// Made with Bob
