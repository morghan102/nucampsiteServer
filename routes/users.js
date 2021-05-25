const express = require('express');
const User = require('../models/user');

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
  User.findOne({username: req.body.username}) //mke sure they arent already a user. f1 returns a prom
  .then(user => { //either will get a user back or null
      if (user) {
          const err = new Error(`User ${req.body.username} already exists!`);
          err.status = 403;
          return next(err);
      } else {
          User.create({ //prom
              username: req.body.username,
              password: req.body.password})
          .then(user => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({status: 'Registration Successful!', user: user});
          })
          .catch(err => next(err));
      }
  })
  .catch(err => next(err));// if find1 returns rejected prom
});

router.post('/login', (req, res, next) => {
  if(!req.session.user) { //already logged in?
      const authHeader = req.headers.authorization;

      if (!authHeader) {
          const err = new Error('You are not authenticated!');
          res.setHeader('WWW-Authenticate', 'Basic');
          err.status = 401;
          return next(err);
      }
    
      const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
      const username = auth[0];
      const password = auth[1];
    
      User.findOne({username: username}) //checks un agst docs in the db. if find mathcing un & p, successful login!
      .then(user => {
          if (!user) {
              const err = new Error(`User ${username} does not exist!`);
              err.status = 401;
              return next(err);
          } else if (user.password !== password) {
              const err = new Error('Your password is incorrect!');
              err.status = 401;
              return next(err);
          } else if (user.username === username && user.password === password) {
              req.session.user = 'authenticated';
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/plain');
              res.end('You are authenticated!')
          }
      })
      .catch(err => next(err));
  } else { //yes logged in
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('You are already authenticated!');
  }
});

//logout
router.get('/logout', (req, res, next) => {
  if (req.session) {
      req.session.destroy();
      res.clearCookie('session-id');
      res.redirect('/');//sends user back to root path
  } else {
      const err = new Error('You are not logged in!');
      err.status = 401;
      return next(err);
  }
});


module.exports = router;
