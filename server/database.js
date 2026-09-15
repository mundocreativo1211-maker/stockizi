const { Pool } = require('pg');

function readConfig(env) {
  const port = Number(env.PGPORT || 5432);
  const apiPort = Number(env.API_PORT || 3000);
  for (const value of [port, apiPort]) {
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      throw new Error('Revisá PGPORT y API_PORT: deben ser puertos entre 1 y 65535.');
    }
  }
  if (!['127.0.0.1', 'localhost', '::1'].includes(env.PGHOST || '127.0.0.1')) {
    throw new Error('Esta primera versión solo consulta PostgreSQL local.');
  }
  if (!env.PGDATABASE || !env.PGUSER || !env.PGPASSWORD) {
    throw new Error('Completá PGDATABASE, PGUSER y PGPASSWORD en .env. No compartas la contraseña.');
  }
  if (env.PGUSER === 'postgres') {
    throw new Error('Usá el usuario stockizi_reader, no el administrador postgres.');
  }
  return {
    apiPort,
    database: {
      host: env.PGHOST || '127.0.0.1', port,
      database: env.PGDATABASE, user: env.PGUSER, password: env.PGPASSWORD,
      max: 5, connectionTimeoutMillis: 3000, statement_timeout: 5000,
      // El rol de consulta conserva su protección. Solo el editor puede escribir.
      options: `-c default_transaction_read_only=${env.PGUSER === 'stockizi_editor' ? 'off' : 'on'}`,
    },
  };
}

function createDatabase(config) {
  // Pool reutiliza unas pocas conexiones en vez de abrir una por cada consulta.
  const pool = new Pool(config);
  pool.on('error', () => console.error('Se perdió una conexión a PostgreSQL.'));
  return pool;
}

module.exports = { readConfig, createDatabase };
