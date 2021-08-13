const express = require("express");
const passport = require("passport");
const connectDB = require("./config/db");
const app = express();

// Connect Database
connectDB();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use("/photos", express.static("upload"));

app.get("/", (req, res) => {
  res.send("running");
});

app.use("/s", require("./routes/station"));
app.use("/a", require("./routes/admin"));
app.use(passport.initialize());
require("./config/passport")(passport);

app.use(passport.initialize());
require("./config/passport_station")(passport);

app.all("*", (req, res) => {
  res.send("404 Not Found");
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
