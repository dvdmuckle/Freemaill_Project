var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var mail = require('./routes/mail');

var app = express();

// new stuff starts here
var session = require('express-session');
var flash = require('express-flash');
var env = require('dotenv').config();

const Client = require('pg').Client;
const client = new Client({
  connectionString: process.env.DATABASE_URL
});
client.connect(); //connect to database

// javascript password encryption (https://www.npmjs.com/package/bcryptjs)
var bcrypt = require('bcryptjs');
//  authentication middleware
var passport = require('passport');
// authentication locally (not using passport-google, passport-twitter, passport-github...)
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
    usernameField: 'username', // form field
    passwordField: 'password'
  },
  function(username, password, done) {
    client.query('SELECT * FROM mailusers WHERE username = $1', [username], function(err, result) {
      if (err) {
        console.log("app.js: SQL error");
        return done(null,false, {message: 'OOPS! sql error'});
      }
      if (result.rows.length > 0) {

        var matched = true;//bcrypt.compareSync(password, result.rows[0].password);

        if (matched) {
          console.log("Successful login, ", result.rows[0]);
          return done(null, result.rows[0]);
        }
      }
      console.log("Bad username or password", result.rows[0]);
      // returning to passport
      // message is passport key
      return done(null, false, {message: 'You entered a BAD USERNAME or PASSWORD'});
    });
  })
);

// Store user information into session
passport.serializeUser(function(user, done) {
  //return done(null, user.id);
  return done(null, user);
});

// Get user information out of session
passport.deserializeUser(function(id, done) {
  return done(null, id);
});

// Use the session middleware
// configure session object to handle cookie
// req.flash() requires sessions
app.use(session({
  secret: 'FinalProject',
  resave:false,
  saveUninitialized: true,
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// new stuff ends here




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/mail', mail);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
