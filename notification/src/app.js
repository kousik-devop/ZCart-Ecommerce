const express = require("express");
const { connectRabbitMQ } = require("./broker/broker");
const setListeners = require("./broker/listners");

const app = express();

async function startService() {
  try {
    // 🔥 Wait until RabbitMQ is fully ready
    await connectRabbitMQ();

    // 🔥 Now it is safe to register consumers
    await setListeners();

    console.log("Notification listeners initialized");
  } catch (err) {
    console.error("Failed to start notification service:", err);
    process.exit(1); // fail fast if broker never comes up
  }
}

startService();

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Notification service is running"
  });
});

module.exports = app;
