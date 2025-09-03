const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');


// Initialize app
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:3000',  //Update for production and if your domain is different for testing.
  credentials: true                 //Needed to store and send cookies.
}));

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

const accessories = require('./routes/accessory');
app.use('/accessories', accessories);

const materials = require('./routes/material');
app.use('/materials', materials);

const users = require('./routes/userRoutes');
app.use('/user', users);

const adminCues = require('./routes/admin/cue');
app.use('/admin/cues', adminCues);

const adminAccessories = require('./routes/admin/accessory');
app.use('/admin/accessories', adminAccessories);

const adminMaterials = require('./routes/admin/material');
app.use('/admin/materials', adminMaterials);

const adminOnly = require('./routes/admin/admin');
app.use('/admin', adminOnly);

const orders = require('./routes/admin/order');
app.use('/admin/orders', orders);

const analytics = require('./routes/admin/analytic');
app.use('/admin/analytics', analytics);

const accounts = require('./routes/authorization');
app.use('/account', accounts);

const cart = require('./routes/cart');
app.use('/cart', cart);

const image =  require('./routes/admin/image');
app.use('/admin/image', image);

const payment = require('./routes/payment');
app.use('/order/payment', payment);

const search = require('./routes/search');
app.use('/search', search);

const scripts = require('./routes/admin/scripts');
app.use('/scripts', scripts);

// Sample route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
