const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connetDB = async () => {
  try {
    await mongoose.connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    console.log("MongooseDB Connected...");
  } catch (err) {
    console.log(err.message);
    // Exit process with faiure
    process.exit(1);
  }
};
module.exports = connetDB;
