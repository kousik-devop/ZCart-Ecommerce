const express = require('express');
const cookieParser = require('cookie-parser');
const sellerRoutes = require('./routes/seller.routes');
const app = express();

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
app.use(cookieParser());


app.get('/', (req, res) => {
    res.status(200).json({ message: 'Seller Dashboard Service is running.' });
});

app.use("/api/seller/dashboard", sellerRoutes);


module.exports = app;
