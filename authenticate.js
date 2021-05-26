// local strategy is here for the implementation of passport local

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');

exports.local = passport.use(new LocalStrategy(User.authenticate())); //arg to LocalStrat is a verify func which it requires
// User.auth() compares the pword and uname agst those stored locally
// if we werent using the pport loc mong plugin wed need to supply siome other verific meth

//these r req bc using sesion-based auth
passport.serializeUser(User.serializeUser());//recieve data abt user from req obj, convert it to store in the session data
passport.deserializeUser(User.deserializeUser()); //after auth, user data is taken from session and added to the req obj