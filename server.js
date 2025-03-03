const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

// Initialize app
const app = express();
app.use(express.json());
app.use(cors());

// log all requests for debugging purposes
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);

  // capture the original send method
  const originalSend = res.send;

  // override the send method to log the response
  res.send = function (body) {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', body);
    originalSend.call(this, body);
  };

  next();
});

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.log('Error connecting to MongoDB:', err);
});

const cues = require('./routes/cue');
app.use('/cues', cues);

const orders = require('./routes/order');
app.use('/admin/orders', orders);

const materials = require('./routes/material');
app.use('/admin/materials', materials);

const accessories = require('./routes/accessory');
app.use('/admin/accessories', accessories);

const analytics = require('./routes/analytic');
app.use('/admin/analytics', analytics);

const accounts = require('./routes/authorization');
app.use('/account', accounts);

const adminOnly = require('./routes/admin');
app.use('/admin', adminOnly);

// Sample route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
