var User = require('../models/user')
var refreshMessage = 'Error, please refresh page'

function booksHandler() {
  this.updateOneUser = function(req, res) {
    var user = req.body.user
    var userStringifiedOriginal = req.body.userStringifiedOriginal
    if (!user.local.books) user.local.books = []
    if (!user.local.isbns) user.local.isbns = []
    User.findOne({ 'local.username' : req.user.local.username })
      .exec(function(err, result) {
        if (err) throw err
        if (JSON.stringify(result) !== userStringifiedOriginal) {
          res.end(refreshMessage)
        } else {
        User.findOneAndUpdate({ 'local.username' : req.user.local.username }, { 'local.books' : user.local.books, 'local.isbns' : user.local.isbns },  { new : true })
          .exec(function(err, doc) {
            if (err) throw err
            res.json(doc)
          })
        }
      })
  }
  this.getMyBooks = function(req, res) {
    User.findOne({ 'local.username' : req.user.local.username })
      .exec(function(err, user) {
        if (err) throw err
        res.json([user])
      })
  }
  this.getUserBooks = function(req, res) {
    User.findOne({ 'local.username' : req.body.username })
      .exec(function(err, user) {
        if (err) throw err
        res.json([user])
      })
  }
  this.filteredSearch = function(req, res) {
    var searchFilterArray = req.body.searchFilterArray
    User.find({ "$or" : searchFilterArray })
      .exec(function(err, users) {
        if (err) throw err
        res.json(users)
      })
  }
  this.updateTwoUsers = function(req, res) {
    var userA = req.body.userA
    var userAStringifiedOriginal = req.body.userAStringifiedOriginal
    var userB = req.body.userB
    var userBStringifiedOriginal = req.body.userBStringifiedOriginal
    User.find({ "$or": [{ 'local.username' : userA.local.username }, { 'local.username' : userB.local.username }] })
      .exec(function(err, users) {
        if (err) throw err
        if ((JSON.stringify(users[0]) !== userAStringifiedOriginal && JSON.stringify(users[0]) !== userBStringifiedOriginal) || (JSON.stringify(users[1]) !== userBStringifiedOriginal && JSON.stringify(users[1]) !== userAStringifiedOriginal)) {
          res.end(refreshMessage)
        } else {
          User.findOneAndUpdate({ 'local.username' : userA.local.username }, { 'local' : userA.local },  { new : true })
            .exec(function(err, docA) {
              if (err) throw err
              User.findOneAndUpdate({ 'local.username' : userB.local.username }, { 'local' : userB.local },  { new : true })
                .exec(function(err, docB) {
                  if (err) throw err
                  res.json([docA, docB])
                })
            })
        }
      })
  }
}

module.exports = booksHandler
