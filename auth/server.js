require('dotenv').config();
const app = require('./src/app');
const { connectToDatabase } = require('./src/db/db');
const { connect } = require('./src/broker/broker');


connectToDatabase();
connect();


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
