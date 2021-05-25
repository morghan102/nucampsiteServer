var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const FileStore = require('session-file-store')(session);//2 args cuz the 1st require is returning another func that takes session as a param

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const campsiteRouter = require('./routes/campsiteRouter');
const promotionRouter = require('./routes/promotionRouter');
const partnerRouter = require('./routes/partnerRouter');




// this chunk is all we need to connect ot the mongoose server
const mongoose = require('mongoose');

const url = 'mongodb://localhost:27017/nucampsite';
const connect = mongoose.connect(url, { //this is ezxactly what we did during the mongoose exercises
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

connect.then(() => console.log('Connected correctly to server'),
  err => console.log(err) //this 2nd arg exists as an alternative to .catch emthod. catch is  better?
);





var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser('12345-67890-09876-54321')); //key that makes it signed cookies. for encryption
// can be errors if use both sessions and cookie parser bc sessions has its own cookies thing
app.use(session({
  name: 'session-id', // val of name dsnt matter
  secret: '12345-67890-09876-54321',
  saveUninitialized: false, //new sess created and no u/d made results in no u/d. and no cookie gets sent to the client. prevents empty sess files and cookies to be made
  resave: false, //missed exactly what this does, but basically sess wont be deleted while client is still making req
  store: new FileStore() //save sess info to servers hard disk instd of just the running app memory
}));

//put here so sers can access these routes before authentication
app.use('/', indexRouter);
app.use('/users', usersRouter);


function auth(req, res, next) { //custom middleware. all mw must have req and res as params, next is opt
  console.log(req.session);//sess mw auto adds a session prop to req
  // if (!req.signedCookies.user) { //if cookie isnt signed properly, this property will return false
  if (!req.session.user) {
    // const authHeader = req.headers.authorization; getting rid of this bc this is getting checked in user.js of models or router or ~
    // if (!authHeader) {//if user hasnt given the authorization
    const err = new Error('You are not authenticated!');
    // res.setHeader('WWW-Authenticate', 'Basic');//this is being done in user router now. this is what will be sent back to client asking for auth needed
    err.status = 401;
    return next(err);//and it is sent here


// dont need any of this anymore!!!    (    
  //buffer is a global node class, dont have to require it bc its global
    // const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');//parses usern and pword into a str from its base64 encoding
    // const user = auth[0];
    // const pass = auth[1];
    // // VERY basic authentication which we will improve l8r
    // if (user === 'admin' && pass === 'password') {
    //   // res.cookie('user', 'admin', { signed: true }); //makes new cookie. makes property of 'user' on the sgned cookie obj
    //   //'admin' will be stored in name str. 3rd arg is opt - this as true makes the signed cookie
    //   req.session.user = 'admin'; //saving to sess that username is admin
    //   return next(); // authorized
    // } else {
    //   const err = new Error('You are not authenticated!');
    //   res.setHeader('WWW-Authenticate', 'Basic');
    //   err.status = 401;
    //   return next(err);
    // })


  } else {
    // if (req.signedCookies.user === 'admin') {
    if (req.session.user === 'authenticated') { //checks for this val bc thats what we set in user router for successful login
      return next();
    } else {
      const err = new Error('You are not authenticated!');
      err.status = 401;
      return next(err);
    }
  }
}

app.use(auth); //we're putting the authentication above this so users cant access static data from the server b4 authentication
app.use(express.static(path.join(__dirname, 'public')));

app.use('/campsites', campsiteRouter);
app.use('/promotions', promotionRouter);
app.use('/partners', partnerRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
