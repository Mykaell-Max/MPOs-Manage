const express = require('express');
const cors = require('cors');

const app = express();

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRegistrationRoutes');

app.use(express.json());
app.use(cors());

app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes)

module.exports = app;