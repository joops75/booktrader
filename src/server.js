var express  = require('express')
var app = express()
var port   = process.env.PORT || 3000
var mongoose = require('mongoose')
  mongoose.Promise = global.Promise
var passport = require('passport')
var flash  = require('connect-flash')

var morgan = require('morgan')
var bodyParser = require('body-parser')
var session = require('express-session')

require("dotenv").load()

mongoose.connect(process.env.MONGO_URI, {useMongoClient: true}) // mongoose >= 4.11.0 requires the 'useMongoClient' option

require('./config/passport.js')(passport)

app.use(morgan('dev'))
// app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/public', express.static(__dirname + '/public'))

app.set("views", __dirname + "/views") //don't need 'path' module to join paths correctly
app.set('view engine', 'ejs')

app.use(session({
  secret: 'tradathonathon',
  resave: false,
	saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

require('./app/routes.js')(app, passport)

app.listen(port)
