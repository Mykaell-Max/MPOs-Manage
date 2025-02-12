const express = require("express");

const api = express();

const operatorRoutes = require('../api/routes/operatorRoutes');
const osRoutes = require('../api/routes/osRoutes');

api.use(express.json());

api.use('/api/operator', operatorRoutes);
api.use('/api/os', osRoutes);

api.listen(8888, () => {console.log('Service running...')});