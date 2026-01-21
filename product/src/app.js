const express = require('express');
const app = express();
const cookie = require('cookie-parser');
const productRoutes = require('./routes/product.routes');
const cors = require('cors');

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5000",
      "http://localhost:5173",
      "http://43.205.191.46:5173"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());

app.use('/api/products', productRoutes);



module.exports = app;