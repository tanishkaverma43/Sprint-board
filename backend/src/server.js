require('dotenv').config();
const app = require('./app');
const { checkConnection } = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await checkConnection();
    console.log('Connected to PostgreSQL.');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL. Is the database running and migrated?');
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Agile Sprint Board API listening on http://localhost:${PORT}`);
  });
}

start();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
