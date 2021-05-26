// local strategy is here for the implementation of passport local

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
//these are for token-based auth
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

const config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate())); //arg to LocalStrat is a verify func which it requires
// User.auth() compares the pword and uname agst those stored locally
// if we werent using the pport loc mong plugin wed need to supply siome other verific meth

//these r req bc using sesion-based auth
passport.serializeUser(User.serializeUser());//recieve data abt user from req obj, convert it to store in the session data
passport.deserializeUser(User.deserializeUser()); //after auth, user data is taken from session and added to the req obj

///////////////////////////////////////////////////////////////

exports.getToken = function(user) {//user obj will contain an id for user doc
    return jwt.sign(user, config.secretKey, {expiresIn: 3600});
    // sign is part of jwt api will take these args
};

// configuring for jwt strategy for pport
const opts = {};//options for jwt strategy
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); //long meth specifies how jwt shd be extracted from incoming rew msg. this is the simplest meth for sending web token
opts.secretOrKey = config.secretKey; //gives strat the key w which well assign the token

exports.jwtPassport = passport.use(
    new JwtStrategy(
        opts, //obj we created above w config options
        (jwt_payload, done) => { //verify callback func. pretty much same as in jwt-payload docs. done is a callback func written in pport-jwt module
            console.log('JWT payload:', jwt_payload);
            User.findOne({_id: jwt_payload._id}, (err, user) => { //find user
                if (err) {
                    return done(err, false); //done will access user doc so ti can load info from it to the req obj
                } else if (user) {
                    return done(null, user);
                } else {
                    return done(null, false); //no err & no user
                }//cd add code in this else to prompt user to make a acct
            });
        }
    )
);

exports.verifyUser = passport.authenticate('jwt', {session: false}); //part of tokens too