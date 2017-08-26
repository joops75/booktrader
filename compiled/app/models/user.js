'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
  local: {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    city: String,
    state: String,
    country: String,
    email: String,
    books: Array,
    isbns: Array,
    requestsTo: Array,
    borrowingFrom: Array
  }
});

userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
//# sourceMappingURL=user.js.map
