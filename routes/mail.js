//////////// IMPORTS & DEFINING VARIABLES ///////////////////////////////////////////
var express = require('express');
var router = express.Router();
var env = require('dotenv').config();
var passport = require('passport');
var bcrypt = require('bcryptjs');
const Client = require('pg').Client;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});
client.connect(); //connect to database

/////// FUNCTIONS THAT WILL HELP SOME PROCESS //////////////////
////////////////////////////////////////////////////////////////

//Function that encrypts a password for me
function encryptPWD(password){
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

/////// THE ROUTE FUNCTIONS ////////////////////////////////////
////////////////////////////////////////////////////////////////

//First page of mail recieved by user
router.get('/profile', function(req, res, next){

  if(req.user)
  {
    client.query('SELECT * FROM messages WHERE recipient=$1',[req.user.username], function(err,result){
      console.log('it works');

      if (err) {
        res.render('profile', {rows: false, user: req.user} ); // throw error to error.hbs.
      }
      else if (result.rows.length > 0) {
        console.log("Found some messages");
        console.log(result.rows);
        //The result.rows.reverse is a javascript code that just reverses the array of the result to show most recent message first
        res.render('profile', {rows: result.rows.reverse(), user: req.user} );
      }
      else{
        res.render('profile', {rows: false, user: req.user} );
        console.log("Oops? Something really bad happened");
      }
    });

  }
  else {
    res.render('profile', {rows: false, user: req.user} );
  }
});

//The page of mail sent by user
router.get('/outbox', function(req, res, next){

  if(req.user)
  {
    client.query('SELECT * FROM messages WHERE sender=$1',[req.user.username], function(err,result){
      console.log('it works');

      if (err) {
        console.log("mail.js: sql error ");
        next(err); // throw error to error.hbs.
      }
      else if (result.rows.length > 0) {
        console.log("Found some messages");
        console.log(result.rows.reverse());
        res.render('outbox', {rows: result.rows, user: req.user} );
      }
      else{
        res.render('outbox', {rows: false, user: req.user} );
        console.log("Oops? Something really bad happened");
      }
    });
  }
  else {
    res.render('profile', {rows: false, user: req.user} );
  }
});

//The page of mail sent and recieved by the user that were deleted
router.get('/trash', function(req, res, next){

  if(req.user)
  {
    client.query('SELECT * FROM messages WHERE recipient=$1 OR sender=$1',[req.user.username], function(err,result){
      console.log('it works');

      if (err) {
        console.log("mail.js: sql error ");
        next(err); // throw error to error.hbs.
      }
      else if (result.rows.length > 0) {
        console.log("Found some messages");
        console.log(result.rows.reverse());
        res.render('trash', {rows: result.rows, user: req.user} );
      }
      else{
        res.render('trash', {rows: false, user: req.user} );
        console.log("Oops? Something really bad happened");
      }
    });
  }
  else {
    res.render('profile', {rows: false, user: req.user} );
  }
});

//The Iframe page route for mail sent process and confirmation
router.post('/sent', function(req, res, next){

  client.query('Select to_char(current_timestamp,\'Day, Mon DD,YYYY HH12:MI\')', function(err, date){

    client.query('INSERT INTO messages(sender, recipient, body, subject,read_status, in_trash, date_sent) VALUES ($1,$2,$3,$4,$5,$6,$7)',[req.body.from,req.body.to,req.body.message_body,req.body.subject,false,false,date.rows[0].to_char], function(err,result){

      console.log("This sent box work");

      if (err) {
        res.render('message_sent', {sent: false})
      }
      else {
        res.render('message_sent', {sent: true})
      }
    });
  });
});

//Loads the createmail.hbs template that enables you to create a new message from nothing.(Not a reply)
router.get('/createmail', function(req, res, next){
    res.render('createmail', {user: req.user});
});

//The Iframe page route to get the blank reading page (Initially done when first login, cause no mail is clicked on)
router.get('/reading_page', function(req, res, next){

  res.render('reading_page', {rows: false});
});

//Iframe page: Once mail is clicked on, It passes the ID number of the message and retrieves the body and subject.
router.post('/reading_page', function(req, res, next){

  client.query('SELECT * FROM messages WHERE messageid=$1',[req.body.message_id_number], function(err,result){
    console.log('iframe works');

    if (err) {

      res.render('reading_page', {rows: false, user: req.user} );
    }
    else if (result.rows.length > 0) {
      console.log("Found some messages");
      console.log(result.rows);
      res.render('reading_page', {rows:result.rows});
    }
    else{
      console.log(req.body.message_id_number);
      res.render('reading_page', {rows: false, user: req.user} );
      console.log("Oops? Something really bad happened");
    }
  });
});

//Retrieves the change Password form from the changePassword.hbs template
router.get('/changePassword', function(req, res, next){

  res.render('changePassword', {user: req.user});
});

//Execute the administrative work of error checking current password and assuring the new password is correctly inputed.
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
