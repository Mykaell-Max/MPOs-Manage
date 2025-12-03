const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const apiRoutes = require('./api/routes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'MPOs API',
      version: '1.0.0',
      description: 'Documentação da API MPOs',
    },
  },
  apis: ['./src/api/routes/*.js'], // Caminho dos arquivos das rotas
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Rota da documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

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