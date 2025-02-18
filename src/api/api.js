const express = require('express');

const app = express();

const userRoutes = require('./routes/userRoutes');
const osRoutes = require('./routes/osRoutes');

app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/os', osRoutes);

module.exports = app;