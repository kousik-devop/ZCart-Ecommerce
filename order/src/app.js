const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const orderRoutes = require("./routes/order.routes")
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
app.use(cookieParser());


app.get('/', (req, res) => {
    res.status(200).json({
        message: "Order service is running"
    });
})

app.use("/api/orders", orderRoutes)

module.exports = app;