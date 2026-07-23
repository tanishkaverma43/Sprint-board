const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const tasksRoutes = require('./routes/tasks.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:4200',
  'https://sprint-board-main.vercel.app',
  'https://sprint-board-of38.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json());

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/tasks', tasksRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;