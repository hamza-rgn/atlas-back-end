const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  clt_fullname: {
    type: String,
    required: true
  },
  clt_tel: {
    type: String,
    required: true
  },
  clt_address: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  city: {
    type: String,
    required: true
  },
  landingpage_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandingPage'
  },
  user_note: {
    type: String
  },
  status: {
    type: String,
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);