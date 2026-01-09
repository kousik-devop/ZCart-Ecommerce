const express = require('express');
const app = express();
const cookie = require('cookie-parser');
const productRoutes = require('./routes/product.routes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());

app.use('/api/products', productRoutes);



module.exports = app;