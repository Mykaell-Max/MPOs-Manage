const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const apiRoutes = require('./api/routes');

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger-output.json');
const { SwaggerTheme } = require('swagger-themes');
const theme = new SwaggerTheme();

const app = express();

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile, {
    docExpansion: 'none',
    defaultModelsExpandDepth: -1,
    deepLinking: true,
    filter: true,
    customCss: `
      ${theme.getBuffer('dark')}   /* aplica o tema dark */
      
      /* Afasta a visão geral */
      body { zoom: 0.75; }  /* zoom menor = mais rotas visíveis */
      
      /* Ajustes finos em blocos de endpoint */
      .swagger-ui .opblock-summary { font-size: 0.9em; padding: 8px; }
    `,
  })
);

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// app.get('/ping', (req, res) => {
//   res.status(200).json({ message: 'pong' });
// });

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error(err.stack);
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

module.exports = app;