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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/signup', function(req, res, next)
{
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


      res .render('signup', {exist: true})
    }
    //If username is still available, check for the password match
    else
    {
        //Checking to see if the password match
        if((req.body.password1 != "") && (req.body.password1 == req.body.password2))
        {
          var newencrypted = req.body.password1;//encryptPWD(req.body.new1);
          console.log("Checking Password");
          client.query('INSERT INTO mailUsers(firstname, lastname, username, password, sex, moderator_status) VALUES ($1,$2,$3,$4,$5,$6)', [req.body.firstName, req.body.lastName, req.body.username, newencrypted, req.body.sex, 'User'], function(err, result){
            if(err)
            {
              console.log("Unable to Query UPDATE");
              next(err);
            }
            else{
              res.send("The Sign Up happened");
            }
          });
        }
        else{
            res.render('signup', {NoPassword: true});
        }
    }
  });

});


module.exports = router;
