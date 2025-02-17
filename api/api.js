const express = require("express");

const api = express();

const userRoutes = require('../api/routes/userRoutes');
const osRoutes = require('../api/routes/osRoutes');

api.use(express.json());

api.use('/api/user', userRoutes);
api.use('/api/os', osRoutes);

api.listen(8888, () => {console.log('Service running...')});