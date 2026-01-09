require('dotenv').config('../env/order.env');
const app = require('./src/app');
const connectDB = require('./src/db/db');
const { connect } = require('./src/broker/broker');

connect();
connectDB();

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});