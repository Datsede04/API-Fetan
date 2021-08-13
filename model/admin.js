const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  created_Date: {
    type: Number,
    default: Date.now,
  },
  is_admin: {
    type: String,
    default: true,
  }
});

AdminSchema.pre("save", function (next) {
  var admin = this;
  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(admin.password, salt, function (err, hash) {
        if (err) {
          return next();
        }
        admin.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

AdminSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb();
    }
    cb(null, isMatch);
  });
};

module.exports = Admin = mongoose.model("Admin", AdminSchema);
