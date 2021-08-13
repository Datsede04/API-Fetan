var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;

var station = require("../model/station");
var config = require("./config");
module.exports = function (passport) {
  var opts = {};

  opts.secretOrKey = config.secret;
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

  passport.use(
    new JwtStrategy(opts, function (jwt_playload, done) {
      station.find(
        {
          id: jwt_playload.id,
        },
        function (err, user) {
          if (err) {
            return done(err, false);
          }
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        }
      );
    })
  );
};
