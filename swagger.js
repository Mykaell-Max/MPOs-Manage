const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'MPOs API',
    description: 'Documentação da API MPOs',
  },
  host: 'localhost:3000',
  schemes: ['http', 'https'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
