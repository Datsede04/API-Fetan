const express = require("express");
const router = express.Router();
const customer = require("../model/customer");
const station = require("../model/station");
const multer = require("multer");
const path = require("path");
const paymentRate = require("../model/paymentRate");
const config = require("../config/config");
const jwt = require("jwt-simple");

// **********************************
// tet router

router.get("/t", async (req, res) => {
  // let test = new paymentRate();
  // test.save();
  res.send("Test it now");
});

// ************************************************
// Multer for image upload

var storage = multer.diskStorage({
  destination: "./upload",
  filename: (req, file, cb) => {
    console.log(file);
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

var upload = multer({ storage: storage });

//***************************************************** */
// Registoring customer //

router.post("/register", isLoggedIn, async (req, res) => {
  const { name, barcode, id, phone, customer_type } = req.body;
  try {
    let check = await customer.findOne({ barcode });
    let check1 = await customer.findOne({ id });

    if (check || check1) {
      return res
        .status(400)
        .json({ msg: "The customer is already registered" });
    }

    try {
      console.log(phone);
      if (phone.length == 10) {
        parseInt(phone);
      } else {
        return res.status(403).json({ msg: "phone number is invalid" });
      }
    } catch (err) {
      return res.status(403).json({ msg: "phone number is invalid" });
    }
    let new_customer = new customer({
      name,
      phone,
      id,
      barcode,
      customer_type,
    });

    new_customer.save(function (err, obj) {
      if (err) {
        console.log("err", err);
        return res
          .status(401)
          .json({ msg: "There was an error please check your inputs" });
      }
      res.status(200).json({ msg: "Successfully registered the Customer" });
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send("There was an error");
  }
});

// // **********************************************************//
// Start the timer
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

router.post("/start", isLoggedIn, async (req, res) => {
  try {
    const { barcode, station_Id, issport } = req.body;
    var check = { barcode: barcode };
    var check1 = { station_Id: station_Id };

    let user = await customer.find(check);
    let hosts = await station.find(check1);
    //  ||console.log(customer)

    // if (!user[0]) {
    //   return res.status(400).json({ msg: "The Customer is not registered" });
    // }
    // if (user[0].isBanned) {
    //   return res.status(400).json({ msg: "The Customer is Banned" });
    // }

    if (user[0].current_using) {
      return res
        .status(400)
        .json({ msg: "The Customer is already using a bike" });
    }

    if (!(user[0].creadit == 0)) {
      return res.status(400).json({
        msg: "You have to pay the credit first",
        amount: user[0].creadit,
      });
    }

    if (!(hosts[0].total_bick > 0)) {
      return res.status(400).json({ msg: "No bick avilable" });
    }

    if (issport == "true" && user[0].customer_type == "3") {
      return res.status(400).json({ msg: "Not available for Guest" });
    }

    let time = Date.now();
    let num_of_bick = hosts[0].total_bick - 1;

    const obj = {
      start_time: time,
      current_using: true,
      issport: issport,
    };

    const obj_station = {
      total_bick: num_of_bick,
    };

    let updated = await customer.findOneAndUpdate(check, obj, { new: true });

    let updatestation = await station.findOneAndUpdate(check1, obj_station, {
      new: true,
    });

    if (updated && updatestation) res.json({ msg: "The Timer has Started" });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

// // **********************************************************//
// // Stop the timer

router.post("/stop", isLoggedIn, async (req, res) => {
  try {
    const { barcode, station_Id } = req.body;
    var check = { barcode: barcode };
    var check1 = { station_Id: station_Id };
    let user = await customer.find(check);
    let host = await station.find(check1);

    if (!host) {
      return res.status(400).json({ msg: "The Station is not Avilable" });
    }

    if (!user[0]) {
      return res.status(400).json({ msg: "The User is not registered" });
    }

    if (user[0].isBanned) {
      return res.status(400).json({ msg: "The Customer is Banned" });
    }

    if (!user[0].current_using) {
      return res.status(400).json({ msg: "The Customer is not using" });
    }

    let num_of_bick = host[0].total_bick + 1;
    let time = Date.now();
    let timeused = (time - user[0].start_time) / 1000;
    let timeforcal = timeused % 60;

    console.log("Time used", timeused);

    if (timeforcal > 30) {
      timeused = parseInt(timeused / 60) + 1;
    } else {
      timeused = parseInt(timeused / 60);
    }

    let creadit = 0;

    console.log(user[0]);
    if (user[0].issport == true) {
      console.log("from if ");
      let rate = await paymentRate.find();
      creadit = 1 + rate[0].Special_Rate * timeused;
    } else if (user[0].customer_type == "1") {
      if (timeused <= 5) {
        creadit = 2;
      } else {
        let rate = await paymentRate.find();
        creadit = 2 + rate[0].Rate1 * (timeused - 5);
      }
    } else if (user[0].customer_type == "2") {
      // for staff
      let rate = await paymentRate.find();
      creadit = 1 + rate[0].Rate2 * timeused;
    } else if (user[0].customer_type == "3") {
      //for Gust
      let rate = await paymentRate.find();
      creadit = 1 + rate[0].Rate3 * timeused;
    }

    // let creadit = 0.5 * timeused + 1;
    let num_service = user[0].number_services_used + 1;
    let houre = user[0].Number_of_houres + timeused / 60;

    const obj = {
      start_time: 0,
      current_using: false,
      issport: false,
      number_services_used: num_service,
      Number_of_houres: houre,
      creadit,
    };

    const obj_station = {
      total_bick: num_of_bick,
    };

    let updated = await customer.findOneAndUpdate(check, obj, { new: true });

    let updatestation = await station.findOneAndUpdate(check1, obj_station, {
      new: true,
    });

    if (updated && updatestation) {
      res.json({ creadit: creadit, time: timeused });
    } else {
      console.log("error /stop");
    }
  } catch (err) {
    // console.log(err);
    return res.status(500).send("Server Error");
  }
});

// ***************************************************
// show it the current user was using the bick or not

router.post("/was_it", isLoggedIn, async (req, res) => {
  try {
    const { barcode, station_Id } = req.body;

    let check = { barcode: barcode };
    let check1 = { station_Id: station_Id };

    let user = await customer.find(check);
    let host = await station.find(check1);
    if (!user[0]) {
      return res.status(400).json({ msg: "The Customer is not registered" });
    }
    if (user[0].isBanned) {
      return res.status(400).json({ msg: "The Customer is Banned" });
    }
    if (user && host) {
      res.json({ msg: `${user[0].current_using}` });
    }
  } catch (err) {
    return res.status(400).json({ msg: "server error" });
  }
});

// *****************************************************
// payment accepting

router.post("/paid", isLoggedIn, async (req, res) => {
  try {
    const { barcode, ispaid, paidAmount, station_Id } = req.body;
    var check = { barcode: barcode };
    var check1 = { station_Id: station_Id };
    let user = await customer.find(check);
    var creadit_on_customer = user[0].creadit;
    let host = await station.find(check1);
    var daily_money = host[0].daily_income;

    if (ispaid == "true") {
      daily_money += parseFloat(paidAmount);
      creadit_on_customer -= parseFloat(paidAmount);
    } else {
      creadit_on_customer += paidAmount;
    }

    const obj = {
      creadit: creadit_on_customer,
    };

    const obj_station = {
      daily_income: daily_money,
    };

    let updated = await customer.findOneAndUpdate(check, obj, { new: true });
    let updatestation = await station.findOneAndUpdate(check1, obj_station, {
      new: true,
    });

    if (updated && updatestation) {
      res.json(updated);
    } else {
      res.json({ msg: "error" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error bro");
  }
});

// *************************************************************************************
// get the amount of the creadit

router.get("/creadit_left", isLoggedIn, async (req, res) => {
  try {
    const { barcode, station_Id } = req.body;
    let check = { barcode: barcode };
    let check1 = { station_Id: station_Id };
    let user = await customer.find(check);
    let host = await station.find(check1);

    if (!host) {
      return res.status(400).json({ error: [{ msg: "In valid Station" }] });
    }

    if (!user) {
      return res
        .status(400)
        .json({ error: [{ msg: "The customer is not registered" }] });
    }

    res.json({ msg: user[0].creadit });
  } catch (err) {
    return res.status(500).json({ msg: "Server Error" });
  }
});

// *************************************************************************************
// pay creadit

router.post("/pay_creadit", isLoggedIn, async (req, res) => {
  try {
    const { barcode, paidAmount, station_Id } = req.body;
    let check = { barcode: barcode };
    let check1 = { station_Id: station_Id };
    let user = await customer.find(check);

    var creadit_left = user[0].creadit - parseFloat(paidAmount);
    let host = await station.find(check1);
    var daily_money = host[0].daily_income;

    if (!user) {
      return res
        .status(400)
        .json({ error: [{ msg: "The customer is not registered" }] });
    }
    if (user[0].creadit == 0) {
      return res
        .status(400)
        .json({ error: [{ msg: "The user creadit is 0" }] });
    }

    if (creadit_left < 0 || creadit_left == 0) {
      creadit_left = 0;
      daily_money += user[0].creadit;
    }
    if (user[0].creadit > paidAmount) {
      daily_money += parseFloat(paidAmount);
    }

    const obj = {
      creadit: creadit_left,
    };
    const obj_station = {
      daily_income: daily_money,
    };

    let updated = await customer.findOneAndUpdate(check, obj, { new: true });
    let updatestation = await station.findOneAndUpdate(check1, obj_station, {
      new: true,
    });

    if (updated && updatestation) {
      res.json({ msg: "paid" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error bro", err.message);
  }
});

// **************************************************************************
// Show the Custom to the station

router.post("/who", async (req, res) => {
  try {
    let check = { barcode: req.body.barcode };
    let found = await customer.find(check);

    res.status(200).json(found[0]);
  } catch (err) {
    return res.status(500).send("Error bro", err.message);
  }
});

router.put("/ban", isLoggedIn, async (req, res) => {
  try {
    let obj = { isBanned: true };
    let filter = { id: req.body.id, current_using: false };
    let cheker = await customer.findOne(filter);

    if (cheker) {
      await customer.findOneAndUpdate(filter, obj, function (err, doc) {
        if (err) {
          return res.status(500).json({ msg: "Banning Customer Failed" });
        }
        return res.status(200).json({ msg: "Customer has been Banned" });
      });
    } else {
      return res.status(500).json({ msg: "Banning Customer Failed" });
    }
  } catch (err) {
    res.status(500).send("Server Error" + err.message);
  }
});
// **********************************************
// unbanne a customer

router.put("/unban", isLoggedIn, async (req, res) => {
  try {
    let obj = { isBanned: false };
    let filter = { id: req.body.id, current_using: false };
    let cheker = await customer.findOne(filter);

    if (cheker) {
      await customer.findOneAndUpdate(
        filter,
        obj,
        {
          new: true,
        },
        function (err, doc) {
          if (err) {
            return res
              .status(500)
              .json({ msg: "Unbanning the Customer Failed" });
          }
          return res
            .status(200)
            .json({ msg: "The Customer has been Successfully Unbanned" });
        }
      );
    } else {
      return res.status(500).json({ msg: " Customer not registerd" });
    }
  } catch (err) {
    res.status(500).send("Server Error" + err.message);
  }
});

// // ************************************************
// // maintenace requested
// router.post("/maintenance", async (req, res) => {
// });

// ************************************************
// login route

router.post("/login_station", async (req, res) => {
  await station.findOne(
    {
      station_Id: req.body.station_Id,
      is_active: true,
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
// Logout route

router.get("/logout_station", isLoggedIn, async (req, res) => {
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
      //console.log(err);
      return res.json({ success: "false" });
    }

    //console.log(decodedtoken.is_admin)
    if (decodedtoken.is_admin == "false") {
      console.log("jhfjsdhgjhs");
      return next();
    } else {
      return res.json({ success: "false Station" });
    }
  } else {
    console.log(err);
    return res.json({ success: "false" });
  }
}

module.exports = router;
