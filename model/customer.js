const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema({
  photo: {
    type: String,
  },
  phone: {
    type: Number,
  },
  name: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
  },
  customer_type: {
    type: String,
    required: true,
  },
  number_services_used: {
    type: Number,
    default: 0,
  },
  Number_of_houres: {
    type: Number,
    default: 0,
  },
  Amount_of_money: {
    type: Number,
    default: 0,
  },
  start_time: {
    type: Number,
    default: 0,
  },
  current_using: {
    type: Boolean,
    default: false,
  },
  creadit: {
    type: Number,
    default: 0,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  issport: {
    type: Boolean,
    default: false,
  },
});

module.exports = customer = mongoose.model("customer", customerSchema)