const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const paymentRoutes = require('./routes/payment.routes');
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
    res.status(200).json({
        message: "Payment service is running"
    });
})

app.use('/api/payments', paymentRoutes);

module.exports = app;