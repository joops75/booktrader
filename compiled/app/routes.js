'use strict';

var path = require('path');
var directory = __dirname;
var folder;
if (directory.split('\\').length > 1) {
  //indicates address is split by back slashes (windows environment)
  var arr = directory.split('\\');
  folder = arr[arr.length - 2];
} else {
  //indicates address is split by forward slashes (linux environment)
  var arr = directory.split('/');
  folder = arr[arr.length - 2];
}

var BooksHandler = require(process.cwd() + '/' + folder + "/app/controllers/booksHandler.server.js");

module.exports = function (app, passport) {
  var booksHandler = new BooksHandler();

  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/myBooks',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/myBooks',
    failureRedirect: '/signup',
    failureFlash: true
  }));

  app.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile.ejs', { user: req.user });
  });

  app.route('/settings').get(isLoggedIn, function (req, res) {
    res.render('settings.ejs', {
      user: req.user,
      message: req.flash('settingsMessage')
    });
  }).post(isLoggedIn, passport.authenticate('details-update', {
    successRedirect: '/profile',
    failureRedirect: '/settings',
    failureFlash: true
  }));

  app.get('/password', isLoggedIn, function (req, res) {
    res.render('password.ejs', {
      user: req.user,
      message: req.flash('passwordMessage')
    });
  });

  app.post('/password', isLoggedIn, passport.authenticate('password-update', {
    successRedirect: '/profile',
    failureRedirect: '/password',
    failureFlash: true
  }));

  app.get('/myBooks', isLoggedIn, function (req, res) {
    res.render('books.ejs', {
      username: req.user.local.username,
      city: req.user.local.city,
      state: req.user.local.state,
      country: req.user.local.country,
      page: 'myBooks'
    });
  });

  app.get('/searchBooks', isLoggedIn, function (req, res) {
    res.render('books.ejs', {
      username: req.user.local.username,
      city: req.user.local.city,
      state: req.user.local.state,
      country: req.user.local.country,
      page: 'searchBooks'
    });
  });

  app.get('/myRequestsAndBorrowings', isLoggedIn, function (req, res) {
    res.render('books.ejs', {
      username: req.user.local.username,
      city: req.user.local.city,
      state: req.user.local.state,
      country: req.user.local.country,
      page: 'myRequestsAndBorrowings'
    });
  });

  app.route('/api/updateOneUser').post(isLoggedIn, booksHandler.updateOneUser);

  app.route('/api/getMyBooks').get(isLoggedIn, booksHandler.getMyBooks);

  app.route('/api/getUserBooks').post(isLoggedIn, booksHandler.getUserBooks);

  app.route('/api/filteredSearch').post(isLoggedIn, booksHandler.filteredSearch);

  app.route('/api/updateTwoUsers').post(isLoggedIn, booksHandler.updateTwoUsers);

  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
//# sourceMappingURL=routes.js.map
