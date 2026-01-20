const express = require('express');
const app = express();
const cookie = require('cookie-parser');
const productRoutes = require('./routes/product.routes');
const cors = require('cors');

app.use(cors({
  origin: [
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());

app.use('/api/products', productRoutes);



module.exports = app;