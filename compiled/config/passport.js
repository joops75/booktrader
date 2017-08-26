'use strict';

var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  passport.use('local-signup', new LocalStrategy({ //must receive fields named as 'username' and 'password' in post data or else code is not executed
    passReqToCallback: true
  }, function (req, username, password, done) {
    process.nextTick(function () {
      User.findOne({ 'local.username': username }, function (err, user) {
        if (err) return done(err);
        if (user) {
          return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
        } else if (!req.body.firstName || !req.body.lastName || !req.body.city || !req.body.state || !req.body.country || !req.body.email) {
          return done(null, false, req.flash('signupMessage', 'Form incomplete.'));
        } else {
          var newUser = new User();
          newUser.local.username = username;
          newUser.local.password = newUser.generateHash(password);
          newUser.local.firstName = req.body.firstName;
          newUser.local.lastName = req.body.lastName;
          newUser.local.city = req.body.city.toUpperCase();
          newUser.local.state = req.body.state.toUpperCase();
          newUser.local.country = req.body.country.toUpperCase();
          newUser.local.email = req.body.email;
          newUser.local.books = [];
          newUser.local.isbns = [];
          newUser.local.requestsTo = [];
          newUser.local.borrowingFrom = [];
          newUser.save(function (err) {
            if (err) throw err;
            return done(null, newUser);
          });
        }
      });
    });
  }));

  passport.use('local-login', new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, done) {
    User.findOne({ 'local.username': username }, { 'local.books': false, 'local.isbns': false }, function (err, user) {
      if (err) return done(err);
      if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));
      if (!user.validPassword(password)) return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
      return done(null, user);
    });
  }));

  passport.use('password-update', new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, done) {
    if (!req.user.validPassword(password)) return done(null, false, req.flash('passwordMessage', 'Oops! Wrong password.'));
    if (!req.body.newPassword) return done(null, false, req.flash('passwordMessage', 'new password field is blank.'));
    var newPassword = req.user.generateHash(req.body.newPassword);
    User.findOneAndUpdate({ 'local.username': username }, { 'local.password': newPassword }, { new: true }, function (err, user) {
      if (err) return done(err);
      return done(null, user);
    });
  }));

  passport.use('details-update', new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, done) {
    if (!req.body.firstName || !req.body.lastName || !req.body.city || !req.body.state || !req.body.country || !req.body.email) {
      return done(null, false, req.flash('settingsMessage', 'Form incomplete.'));
    }
    User.findOneAndUpdate({ 'local.username': username }, {
      'local.firstName': req.body.firstName,
      'local.lastName': req.body.lastName,
      'local.city': req.body.city.toUpperCase(),
      'local.state': req.body.state.toUpperCase(),
      'local.country': req.body.country.toUpperCase(),
      'local.email': req.body.email
    }, { new: true }, function (err, user) {
      if (err) return done(err);
      return done(null, user);
    });
  }));
};
//# sourceMappingURL=passport.js.map
