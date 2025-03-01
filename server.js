const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

// Initialize app
const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.log('Error connecting to MongoDB:', err);
});

const products = require('./routes/product')
app.use('/products', products)

const orders = require('./routes/order')
app.use('/orders', orders)

const analytics = require('./routes/analytic')
app.use('/analytics', analytics)

const accounts = require('./routes/authorization')
app.use('/account', accounts)

const adminOnly = requre('.routes/admin')
app.use('/admin', adminOnly)

// Sample route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
