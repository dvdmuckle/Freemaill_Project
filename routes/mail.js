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
/////// FUNCTIONS THAT WILL HELP SOME PROCESS //////////////////
////////////////////////////////////////////////////////////////

function encryptPWD(password){
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

/////// THE ROUTE FUNCTIONS ////////////////////////////////////
////////////////////////////////////////////////////////////////

router.get('/profile', function(req, res, next){
  res.render('profile', {user : req.user});
});

router.get('/changePassword', function(req, res, next){

  res.render('changePassword', {user: req.user});
});

router.post('/changePassword', function(req, res, next){

  //Checking to see if the password match here.
  var username = req.user.username;
  var userpass = req.user.password;
  var newuserpass = req.body.current;
  var matched = true;//bcrypt.compareSync(newuserpass, userpass);

  console.log(newuserpass);
  console.log("password match is " + matched);
  client.query( 'SELECT * FROM mailusers WHERE username = $1', [username], function(err, result){
    if(err)
    {
      console.log("Unable to Query SELECT");
      next(err);
    }
    if(result.rows.length > 0)
    {
      console.log("user exist");

      if(matched)
      {
        if((req.body.new1 != "") && (req.body.new1 == req.body.new2))
        {
          var newencrypted = req.body.new1 //;encryptPWD(req.body.new1);
          //Sets new password to Username
          client.query('UPDATE mailusers SET password = $2 WHERE username = $1', [username, newencrypted], function(err, result){
            if(err)
            {
              console.log("Unable to Query UPDATE");
              next(err);
            }

          });

          //Updates the page to refllect what happened
          res.render('changePassword', {user:req.user , success: true});
        }
        else {
          res.render('changePassword', {user:req.user , notcorrect: true});
        }
      }
      else {
        res.render('changePassword', {user:req.user , nomatch: true});
      }
    }
    else{
      console.log("error checking is needed");
      res.render('changePassword', {user: req.user, noentry: true});
    }
  });
});

module.exports = router;
