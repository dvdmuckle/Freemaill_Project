var express = require('express');
var router = express.Router();

var env = require('dotenv').config();
const Client = require('pg').Client;
const client = new Client({
  connectionString: process.env.DATABASE_URL
});
client.connect(); //connect to database

var passport = require('passport');
var bcrypt = require('bcryptjs');

// FUNCTION TO CHECK THINGS

function loggedIn(req, res, next) {
  if (req.user) {
    next(); // req.user exists, go to the next function (right after loggedIn)
  } else {
    res.render('login'); // user doesn't exists redirect to localhost:3000/login
  }
}

function notLoggedIn(req, res, next) {
  if (!req.user) {
    next();
  } else {
    res.redirect('/mail/profile');
  }
}

function encryptPWD(password){
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

//  ACTUAL ROUTES FUNCTION //
router.get('/', loggedIn, function(req, res, next) {

  res.render('profile', { user: req.user}); //display profile.hbs
});

/////////////////////////////////////////////////////////////////////

router.get('/login', notLoggedIn, function(req, res){
    //req.flash('error') is mapped to 'message' from passport middleware
    res.render('login', {errorMessage: req.flash('error')});
});

router.post('/login',
  // This is where authentication happens - app.js
  // authentication locally (not using passport-google, passport-twitter, passport-github...)
  passport.authenticate('local', { failureRedirect: 'login', failureFlash:true }),
  function(req, res,next) {
    res.redirect('/mail/profile'); // Successful. redirect to localhost:3000/mail/profile
});

/////////////////////////////////////////////////////////////////////

router.get('/logout', function(req, res){
    req.logout(); //passport provide it
    res.redirect('/'); // Successful. redirect to localhost:3000/users
});

/////////////////////////////////////////////////////////////////////

router.get('/signup', function(req, res, next){
  if(req.user) {
    return res.redirect('/');
  }
  res.render('signup');
});

router.post('/signup', function(req, res, next){



  //Checking to see if the password match here.
  var username = req.body.username;
  var userpass = req.body.password1;
  var newuserpass = req.body.password2;
  var matched = false;

   console.log(username);
  //Checks to see if ther are any users with that username already.
  client.query( 'SELECT * FROM mailUsers WHERE username = $1', [username], function(err, result){
    if(err)
    {
      console.log("Unable to Query SELECT");
      next(err);
    }

    //If the username is taken, show an error
    if(result.rows.length > 0)
    {
      console.log("user exist");


      res.render('signup', {exist: true})
    }
    //If username is still available, check for the password match
    else
    {
        //Checking to see if the password match
        if((req.body.password1 != "") && (req.body.password1 == req.body.password2))
        {

          var newencrypted = encryptPWD(req.body.password1);
          console.log("Checking Password");
          client.query('INSERT INTO mailUsers(firstname, lastname, username, password, sex, moderator_status) VALUES ($1,$2,$3,$4,$5,$6)', [req.body.firstName, req.body.lastName, req.body.username, newencrypted, req.body.sex, 'User'], function(err, result){
            if(err)
            {
              console.log("Unable to Query UPDATE");
              next(err);
            }
            else{
              res.render('profile', {successful_login : true , username: username});
            }
          });
        }
        else{
            res.render('signup', {NoPassword: true});
        }
    }
  });

});

/////////////////////////////////////////////////////////////////////


module.exports = router;
