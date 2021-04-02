const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');


const router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find({}, (err, users) => {
    if(err){
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({ err });
    }
    else{
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    }
  });
});

router.post('/signup', (req, res, next) => {
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if(err){
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({ err: err });
    }
    else{
      if(req.body.firstname)
        user.firstname = req.body.firstname;
      if(req.body.lastname)
        user.lastname = req.body.lastname;

      user.save((err, user) => {
        if(err){
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({ err });
          return;
        }
        passport.authenticate('local')(req, res, () => {
          var token = authenticate.getToken({ _id: req.user._id});
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ success: true, token: token, status: 'Registration Successful and have been logged in!' });
        });
      });      
    }
  });
});

// When the user logged in the server will create a token and send it to client
router.post('/login', passport.authenticate('local'), (req, res) => {
  // create token and send it to client
  var token = authenticate.getToken({ _id: req.user._id});  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token, status: 'You are successfully logged in!' });
});

router.get('/logout', (req, res, next) => {
  if(req.session){
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }else{
    let err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }

  
  // req.logout();
  // res.statusCode = 200;
  // res.setHeader('Content-Type', 'application/json');
  // res.json({ success: true, status: 'You are successfully logged in!' });
  // res.redirect('/');
})

module.exports = router;
// {"success":true,"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDY0ZGFiNjZjYjJkMjI1OTgyNmZiOTkiLCJpYXQiOjE2MTcyNzgxNzMsImV4cCI6MTYxNzI4MTc3M30.dYttjtJPb2aZaICylvtmioIaPb7xMpvX0ixCVmMJbIc","status":"You are successfully logged in!"}
// Authorization: bearer <token>
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDY1Y2M5YjkxMjk4YTE4ODRiNDUwNTAiLCJpYXQiOjE2MTcyODQ0NjksImV4cCI6MTYxNzI4ODA2OX0.T-NCe54a0mte0tdgHuCzI29QoESgiW2phLa6lg0y2m4
