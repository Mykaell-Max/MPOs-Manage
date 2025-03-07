const express = require('express');
const cors = require('cors');

const app = express();

const userRoutes = require('./routes/userRoutes');
const osRoutes = require('./routes/osRoutes');

app.use(express.json());
app.use(cors());

app.use('/api/user', userRoutes);
app.use('/api/os', osRoutes);

module.exports = app;