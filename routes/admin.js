const express = require("express");
const router = express.Router();
const station = require("../model/station");
const paymentRate = require("../model/paymentRate");
const admin = require("../model/admin");
const config = require("../config/config");
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");

// ************************************************
// test route to /admin
router.get("/admin", (req, res) => {
  res.json({ msg: "test" });
});

// ************************************************
// Creat New Station

router.post("/create", isLoggedIn, async (req, res) => {
  const { createdby, station_Id, total_bick, password } = req.body;
  try {
    let new_station = new station({
      createdby,
      station_Id,
      total_bick,
      password,
    });
    new_station.save(function (err, obj) {
      if (err) {
        return res.json({ msg: "Please Try again" });
      }
      res.json({ msg: "Successfully Created New Station" });
    });
  } catch (e) {
    console.log("Error", e.message);
    return res.status(500).send("There was an error, Please Try Again");
  }
});

// ************************************************
// To Update The rating Amount of money

router.post("/set_rate", isLoggedIn, async (req, res) => {
  try {
    const { Rate1, Rate2, Rate3, Rate4 } = req.body;

    console.log("From Rates ", Rate1, Rate2, Rate3, Rate4);

    let check = { ID: "1" };
    let filterd = await paymentRate.find(check);

    let _Rate1 = Rate1 || filterd[0].Rate1 || 1;
    let _Rate2 = Rate2 || filterd[0].Rate2 || 2;
    let _Rate3 = Rate3 || filterd[0].Rate3 || 3;
    let _Special_Rate = Rate4 || filterd[0].Special_Rate || 4;

    let obj = {
      Rate1: _Rate1,
      Rate2: _Rate2,
      Rate3: _Rate3,
      Special_Rate: _Special_Rate,
    };

    let updated = await paymentRate.findOneAndUpdate(check, obj, { new: true });

    if (updated) {
      res.json({ msg: "Successfully Updated the Fee" });
    }
  } catch (e) {
    return res
      .status(500)
      .json({ msg: "There was an Error in Updating the Fee" });
  }
});

// ***********************************************
// To Get The rating

router.get("/get_rate", isLoggedIn, async (req, res) => {
  try {
    let check = { ID: "1" };
    let updated = await paymentRate.find(check);
    res.json(updated[0]);
  } catch (err) {
    return res.status(500).json({ msg: "There was an Error" });
  }
});

// ************************************************
// Fetch All Stations

router.get("/all_stations", isLoggedIn, async (req, res) => {
  let filterd = await station
    .find()
    .select({ station_Id: 1, total_bick: 1, daily_income: 1, is_active: 1 });
  res.status(200).json(filterd);
});

// ************************************************
// Fetch all Active Station

router.get("/active_stations", isLoggedIn, async (req, res) => {
  let filter = { is_active: true };
  let filterd = await station.find(filter).select({
    station_Id: 1,
    total_bick: 1,
    daily_income: 1,
    assigned_bike: 1,
    total_income: 1,
  });

  res.status(200).json(filterd);
});

// ************************************************
// Total revenu generated per Day

router.get("/Total_daily", async (req, res) => {
  let total = 0;
  let filterd = await station.find().select({ daily_income: 1 });
  filterd.forEach((val) => {
    total += val.daily_income;
  });

  res.status(200).json({ Total: total });
});

// ************************************************
// Detail about single station

router.post("/detail_station", isLoggedIn, async (req, res) => {
  const { station_Id } = req.body;
  let result;
  let filter = { station_Id: station_Id };
  let filterd = await station.find(filter);
  if (filterd[0]) {
    result = filterd[0];
  } else {
    result = { msg: "No Data" };
  }
  res.status(200).json(result);
});

// ************************************************
// Create New Admin

router.post("/create_admin", isLoggedIn, async (req, res) => {
  const { email, password } = req.body;
  const filter = { email: req.body.email };
  try {
    let check = await admin.findOne(filter);
    if (check) {
      return res.status(400).json({ msg: "Already registered" });
    }
    let new_admin = new admin({
      email,
      password,
    });

    await new_admin.save(function (err, obj) {
      if (err) {
        console.log(err);
        return res.json({ msg: "Please Try Again" });
      }
      res.json({ msg: "Successfully Registered New Admin" });
    });
  } catch (e) {
    console.log("Error", e.message);
    return res.status(500).send("Please Try Again");
  }
});

// ************************************************
// login route

router.post("/login_admin", async (req, res) => {
  await admin.findOne(
    {
      email: req.body.email,
    },
    function (err, result) {
      if (err) throw err;
      if (!result) {
        res.status(403).send({ msg: "auth faild" });
      } else {
        result.comparePassword(req.body.password, function (err, isMatch) {
          if (isMatch && !err) {
            var token = jwt.encode(result, config.secret);
            res.json({ token: token });
          } else {
            return res.status(403).send({ msg: "auth faild" });
          }
        });
      }
    }
  );
});

// ************************************************
// update station password

router.put("/update_station_password", isLoggedIn, async (req, res) => {
  try {
    var token = req.headers.authorization.split(" ")[1];
    let decodedtoken = jwt.decode(token, config.secret);

    let { station_Id, newpassword } = req.body;
    let filter = { station_Id: station_Id };

    let cheker = await station.findOne(filter);

    console.log(cheker);

    if (cheker) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          console.log(err);
        }
        bcrypt.hash(newpassword, salt, function (err, hash) {
          if (err) {
            return res.status(500).json({ msg: "error" });
          }

          let newpass = hash || cheker.password;
          let obj = {
            password: newpass,
            status_changedby: decodedtoken.email,
          };
          station.findOneAndUpdate(
            filter,
            obj,
            {
              new: true,
            },
            function (err, doc) {
              if (err) {
                return res
                  .status(500)
                  .json({ msg: "Please Try Again", error: err.message });
              }
              return res
                .status(200)
                .json({ msg: "The Station was Updated Successfully" });
            }
          );
        });
      });
    } else {
      return res
        .status(500)
        .json({ msg: "The is No Station with this Station ID" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Updating the Station failed", error: err.message });
  }
});

router.put("/update_station_bike", isLoggedIn, async (req, res) => {
  try {
    var token = req.headers.authorization.split(" ")[1];
    let decodedtoken = jwt.decode(token, config.secret);
    const { station_Id, no_bick } = req.body;
    let filter = { station_Id: station_Id };

    let filterd = await station.find(filter);
    if (filterd[0]) {
      let bik = filterd[0].total_bick;
      bik += parseInt(no_bick);
      let obj = {
        total_bick: bik,
        status_changedby: decodedtoken.email,
      };
      station.findOneAndUpdate(
        filter,
        obj,
        {
          new: true,
        },
        function (err, doc) {
          if (err) {
            return res
              .status(500)
              .json({ msg: "Please Try Again", error: err.message });
          }
          return res
            .status(200)
            .json({ msg: "The Station was Updated Successfully" });
        }
      );
    }
  } catch (err) {
    res.status(500).json({ msg: "There Was an error" });
  }
});
// ***********************************************
// update admin password

router.put("/update_admin", isLoggedIn, async (req, res) => {
  try {
    var token = req.headers.authorization.split(" ")[1];
    let decodedtoken = jwt.decode(token, config.secret);
    let new_password = req.body.new_password;
    let filter = { email: decodedtoken.email };

    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return res.status(500).json({ success: "False", error: err.message });
      }
      bcrypt.hash(new_password, salt, function (err, hash) {
        if (err) {
          return res.status(500).json({ msg: "error" });
        }
        new_password = hash;
        let obj = {
          password: new_password,
        };
        admin.findOneAndUpdate(
          filter,
          obj,
          {
            new: true,
          },
          function (err, doc) {
            if (err) {
              return res
                .status(500)
                .json({ success: "False", error: err.message });
            }
            return res.status(200).json({ success: "True" });
          }
        );
      });
    });
  } catch (err) {
    return res.status(500).json({ success: "False", error: err.message });
  }
});

// ************************************************
// Accepting daily money

router.post("/accepting_money", isLoggedIn, async (req, res) => {
  try {
    const { station_Id, money } = req.body;
    const filter = { station_Id: station_Id };
    let check = await station.findOne(filter);
    if (check) {
      let total = check.total_income + parseInt(money);
      let remain = check.daily_income - parseInt(money);

      if (remain < 0) {
        return res.status(200).json({ msg: "Payment amount exceeded" });
      }
      let obj = {
        total_income: total,
        daily_income: remain,
      };

      station.findOneAndUpdate(filter, obj, { new: true }, function (err, doc) {
        if (err) {
          console.log(err);
          return res.status(500).json({ msg: "There was an error" });
        }
        return res.status(200).json({ msg: "Successully Recieved payment" });
      });
    } else {
      return res.status(200).json({ msg: "staion dosenot exists" });
    }
  } catch (err) {
    return res.status(500).json({ msg: "server broken out" });
  }
});

// ************************************************
// delete station (soft delete)

router.put("/delete_station", isLoggedIn, async (req, res) => {
  try {
    var token = req.headers.authorization.split(" ")[1];
    let decodedtoken = jwt.decode(token, config.secret);
    const { station_Id } = req.body;
    const filter = { station_Id: station_Id };
    let check = await station.findOne(filter);
    if (check) {
      let obj = { status_changedby: decodedtoken.email, is_active: false };

      station.findOneAndUpdate(filter, obj, { new: true }, function (err, doc) {
        if (err) {
          return res.status(500).json({ msg: "Deleting the Station Failed" });
        }
        return res.status(200).json({ msg: "Station deleted Successfully" });
      });
    } else {
      return res.status(200).json({ msg: "Station does not exists" });
    }
  } catch (err) {
    return res.status(500).json({ msg: "There was an Error" });
  }
});

// ************************************************
// Logout route

router.get("/logout_admin", isLoggedIn, async (req, res) => {
  req.logout();
  res.json({ msg: "loged out" });
});

// ************************************************
// authentication middleware

function isLoggedIn(req, res, next) {
  var decodedtoken;
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    var token = req.headers.authorization.split(" ")[1];
    try {
      decodedtoken = jwt.decode(token, config.secret);
    } catch (err) {
      // console.log(err);
      return res.json({ msg: "false auth1" });
    }
    //console.log(decodedtoken.is_admin == "true")
    if (decodedtoken.is_admin == "true") {
      return next();
    } else {
      return res.json({ msg: "false auth2" });
    }
  } else {
    return res.json({ msg: "false auth3" });
  }
}

module.exports = router;
