const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const StationSchema = new mongoose.Schema({
  createdby: {
    type: String,
    required: true,
  },
  created_Date: {
    type: Number,
    default: Date.now,
  },
  station_Id: {
    type: String,
    required: true,
    unique: true,
  },
  total_bick: {
    type: Number,
    required: true,
  },
  daily_income: {
    type: Number,
    default: 0,
  },
  total_income: {
    type: Number,
    default: 0,
  },
  maintenace_request: {
    type: Number,
    default: 0,
  },
  password: {
    type: String,
    required: true,
  },
  is_active: {
    type: String,
    default: true,
  },
  status_changedby: {
    type: String,
    default: "new",
  },
  is_admin: {
    type: String,
    default: false,
  },
});

StationSchema.pre("save", function (next) {
  var station = this;
  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(station.password, salt, function (err, hash) {
        if (err) {
          return next();
        }
        station.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

StationSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb();
    }
    cb(null, isMatch);
  });
};

module.exports = station = mongoose.model("station", StationSchema);
