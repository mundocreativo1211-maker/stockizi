const { readConfig, createDatabase } = require('./database');
const { createApi } = require('./app');

async function start() {
  const config = readConfig(process.env);
  const database = createDatabase(config.database);
  try {
    // Comprueba conexión y permiso SELECT sin traer ni modificar productos.
    await database.query('SELECT id FROM public.products LIMIT 0');
  } catch {
    await database.end();
    console.error('No se pudo conectar. Revisá PGDATABASE, PGUSER y PGPASSWORD en .env, el servicio PostgreSQL y los permisos del usuario configurado.');
    process.exitCode = 1;
    return;
  }
  const server = createApi(database);
  server.on('error', async error => {
    console.error(error.code === 'EADDRINUSE' ? 'El puerto de la API está ocupado.' : 'No se pudo iniciar la API.');
    await database.end();
    process.exitCode = 1;
  });
  // No usar 0.0.0.0: aún faltan autenticación y despliegue seguro para otros equipos.
  server.listen(config.apiPort, '127.0.0.1', () => {
    console.log(`Productos: http://127.0.0.1:${config.apiPort}/api/products`);
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => { await database.end(); });
    server.closeIdleConnections();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch(error => {
  // Los errores de configuración se generan sin incluir los valores secretos.
  console.error(error.message);
  process.exitCode = 1;
});
