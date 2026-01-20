require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');

connectDB();

const PORT = process.env.PORT || 3001;

connect();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})