const { subscribeToQueue } = require("./broker");
const { sendEmail } = require("../email");


module.exports = function () {

    subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {

        const roleMessages = {
            user: `
                <h2 style="color:#2c3e50;">Welcome to Our Community 🎉</h2>
                <p>We're thrilled to have you as part of our platform.</p>
                <p>Discover amazing products, enjoy seamless shopping, and get exclusive deals curated just for you.</p>

                <a href="${process.env.FRONTEND_URL}"
                style="
                    display:inline-block;
                    padding:12px 24px;
                    background:#4f46e5;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:600;
                    margin-top:16px;
                ">
                Start Exploring
                </a>
            `,
            seller: `
                <h2 style="color:#2c3e50;">Welcome Aboard, Seller 🚀</h2>
                <p>We're excited to have you join us as a seller.</p>
                <p>List your products, manage orders, and grow your business with powerful tools built for you.</p>

                <a href="${process.env.SELLER_DASHBOARD_URL}"
                style="
                    display:inline-block;
                    padding:12px 24px;
                    background:#16a34a;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:600;
                    margin-top:16px;
                ">
                Go to Seller Dashboard
                </a>
            `
        };

        const emailHTMLTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8" />
        <title>Welcome Email</title>
        </head>
        <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td align="center">

                <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#ffffff; margin:30px auto; border-radius:10px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                    <td style="background:#111827; padding:20px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0;">Welcome to Our Service</h1>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:30px; color:#374151;">
                    <p style="font-size:16px;">Hi <strong>${data.firstname}</strong>,</p>

                    ${roleMessages[data.role] || ""}

                    <p style="margin-top:30px;">
                        If you have any questions, feel free to reach out to our support team.
                    </p>

                    <p>
                        Cheers,<br/>
                        <strong>The Our Service Team</strong>
                    </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#f9fafb; padding:15px; text-align:center; font-size:12px; color:#6b7280;">
                    © ${new Date().getFullYear()} Our Service. All rights reserved.
                    </td>
                </tr>

                </table>

            </td>
            </tr>
        </table>

        </body>
        </html>
        `;


        await sendEmail(data.email, "Welcome to Our Service", "Thank you for registering with us!", emailHTMLTemplate);

    })

    subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
        const emailHTMLTemplate = `
        <h1>Payment Initiated</h1>
        <p>Dear ${data.username},</p>
        <p>Your payment of ${data.currency} ${data.amount} for the order ID: ${data.orderId} has been initiated.</p>
        <p>We will notify you once the payment is completed.</p>
        <p>Best regards,<br/>The Team</p>
        `;
        await sendEmail(data.email, "Payment Initiated", "Your payment is being processed", emailHTMLTemplate);
    }
)

    subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
        const emailHTMLTemplate = `
        <h1>Payment Successful!</h1>
        <p>Dear ${data.username},</p>
        <p>We have received your payment of ${data.currency} ${data.amount} for the order ID: ${data.orderId}.</p>
        <p>Thank you for your purchase!</p>
        <p>Best regards,<br/>The Team</p>
        `;
        await sendEmail(data.email, "Payment Successful", "We have received your payment", emailHTMLTemplate);
    })


    subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
        const emailHTMLTemplate = `
        <h1>Payment Failed</h1>
        <p>Dear ${data.username},</p>
        <p>Unfortunately, your payment for the order ID: ${data.orderId} has failed.</p>
        <p>Please try again or contact support if the issue persists.</p>
        <p>Best regards,<br/>The Team</p>
        `;
        await sendEmail(data.email, "Payment Failed", "Your payment could not be processed", emailHTMLTemplate);
    })

    subscribeToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", async (data) => {
        const emailHTMLTemplate = `
        <h1>New Product Available!</h1>
        <p>Dear ${data.username},</p>
        <p>Check it out and enjoy exclusive launch offers!</p>
        <p>Best regards,<br/>The Team</p>
        `;
        await sendEmail(data.email, "New Product Launched", "Check out our latest product", emailHTMLTemplate);
    })

};