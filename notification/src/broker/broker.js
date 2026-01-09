const amqplib = require("amqplib");

let connection = null;
let channel = null;

const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

async function connectRabbitMQ(retries = MAX_RETRIES) {
  if (channel) return channel;

  try {
    console.log("Connecting to RabbitMQ...");
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log("Connected to RabbitMQ");

    connection.on("error", () => {
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed. Reconnecting...");
      connection = null;
      channel = null;
    });

    return channel;
  } catch (err) {
    console.log(`RabbitMQ not ready. Retries left: ${retries}`);
    if (retries === 0) throw err;

    await new Promise(res => setTimeout(res, RETRY_DELAY));
    return connectRabbitMQ(retries - 1);
  }
}

async function publishToQueue(queueName, data = {}) {
  const ch = await connectRabbitMQ(); // 🔥 GUARANTEED channel

  await ch.assertQueue(queueName, { durable: true });
  ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
    persistent: true
  });

  console.log("Message sent:", queueName, data);
}

async function subscribeToQueue(queueName, callback) {
  const ch = await connectRabbitMQ(); // 🔥 GUARANTEED channel

  await ch.assertQueue(queueName, { durable: true });

  ch.consume(queueName, async msg => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      await callback(data);
      ch.ack(msg);
    } catch (err) {
      console.error("Message handling failed:", err);
      ch.nack(msg, false, false);
    }
  });
}

module.exports = {
  connectRabbitMQ,
  publishToQueue,
  subscribeToQueue
};
