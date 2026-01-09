const express = require('express');
const app = express();
const cookie = require('cookie-parser');
const cartRoutes = require('./routes/cart.routes');

app.use(express.json());
app.use(cookie());
app.use(express.urlencoded({ extended: true }));


app.use('/api/cart', cartRoutes);

module.exports = app;