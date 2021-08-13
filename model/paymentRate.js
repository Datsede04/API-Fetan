const mongoose = require("mongoose");
const RateSchema = new mongoose.Schema({
  ID: {
    type: String,
    default: "1",
    unique: true,
  },
  Rate1: {
    type: Number,
    default: "1",
  },
  Rate2: {
    type: Number,
    default: "2",
  },
  Rate3: {
    type: Number,
    default: "3",
  },
  Special_Rate:{
    type:Number,
    default:"5"
  }
});

module.exports = Rate = mongoose.model("Rate", RateSchema);
