const amqplib = require("amqplib");

let connection = null;
let channel = null;

const RETRY_DELAY = 5000;
const MAX_RETRIES = 10;

async function connect(retries = MAX_RETRIES) {
  if (connection && channel) return channel;

  try {
    console.log("Connecting to RabbitMQ...");
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log("Connected to RabbitMQ");

    connection.on("error", err => {
      console.error("RabbitMQ connection error:", err);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed. Reconnecting...");
      connection = null;
      channel = null;
    });

    return channel;
  } catch (err) {
    console.error(`RabbitMQ not ready. Retries left: ${retries}`);

    if (retries === 0) {
      throw new Error("RabbitMQ connection failed after retries");
    }

    await new Promise(res => setTimeout(res, RETRY_DELAY));
    return connect(retries - 1);
  }
}

async function publishToQueue(queueName, data = {}) {
  const ch = await connect();

  await ch.assertQueue(queueName, { durable: true });
  ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
    persistent: true
  });

  console.log("Message sent:", queueName, data);
}

async function subscribeToQueue(queueName, callback) {
  const ch = await connect();

  await ch.assertQueue(queueName, { durable: true });

  ch.consume(queueName, async msg => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      await callback(data);
      ch.ack(msg);
    } catch (err) {
      console.error("Message processing failed:", err);
      ch.nack(msg, false, false); // dead-letter candidate
    }
  });
}

module.exports = {
  connect,
  publishToQueue,
  subscribeToQueue
};
