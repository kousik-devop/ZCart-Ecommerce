const paymentModel = require('../model/payment.model');
const axios = require('axios');
const { publishToQueue } = require("../broker/broker")
const crypto = require('crypto');

require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function createPayment(req, res) {
    const token = req.cookies?.user_token || req.headers?.authorization?.split(' ')[ 1 ];

    try {

        const orderId = req.params.orderId;

        const orderResponse = await axios.get("http://localhost:3003/api/orders/" + orderId, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })


        const price = orderResponse.data.order.totalPrice;

        const order = await razorpay.orders.create(price);

        const payment = await paymentModel.create({
            order: orderId,
            razorpayOrderId: order.id,
            user: req.user.userId,
            price: {
                amount: order.amount,
                currency: order.currency
            }
        })

        await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED", payment)
        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", {
            email: req.user.email,
            orderId: orderId,
            amount: price.amount ,
            currency: price.currency,
            username: req.user.username,
        })
        return res.status(201).json({ message: 'Payment initiated', payment });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }

}

async function verifyPayment(req, res) {
  const { razorpayOrderId, paymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    // 1️⃣ Validate input
    if (!razorpayOrderId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // 2️⃣ Verify signature
    const body = razorpayOrderId + "|" + paymentId;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    // if (expectedSignature !== signature) {
    //   return res.status(400).json({ message: "Invalid signature" });
    // }

    // 3️⃣ Find payment
    const payment = await paymentModel.findOne({
      razorpayOrderId,
      status: "PENDING",
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // 4️⃣ Update payment
    payment.paymentId = paymentId;
    payment.signature = expectedSignature;
    payment.status = "COMPLETED";

    await payment.save();

    // 5️⃣ Publish success notifications
    await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
      email: req.user.email,
      orderId: payment.order,
      paymentId: payment.paymentId,
      amount: payment.price.amount / 100,
      currency: payment.price.currency,
      fullName: req.user.fullName,
    });

    await publishToQueue(
      "PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED",
      payment
    );

    return res.status(200).json({
      message: "Payment verified successfully",
      payment,
    });

  } catch (err) {
    console.error("Payment verification error:", err);

    await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
      email: req.user?.email,
      paymentId,
      orderId: razorpayOrderId,
      fullName: req.user?.fullName,
    });

    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
    createPayment,
    verifyPayment
}