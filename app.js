var express = require('express');
var stylus = require('stylus');
var nib = require('nib');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Linking to passport
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var session = require('express-session');
var configDB = require('./config/database.js');
var mongoose = require('mongoose');

// Linking to Mongo
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27020/mushrooms');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
// tAdded by Raji- To include stylus - RAJI
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// console.log(views);
app.set('view engine', 'jade');

// EDIT BY MUTHU RAJI

// uncomment after placing your favicon in public
//app.use(favicon(__dirname + 'public/favicon.ico'));
app.use(logger('dev'));
app.use('/img', express.static('/public/img'));

app.use(stylus.middleware( //added by RAJI
  { src: path.join(__dirname, '/public'),
  compile: compile //added by RAJI
  }
));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
mongoose.connect(configDB.url); //connect to the configDB

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console

// required for passport
app.use(session({ secret: 'ilovemushrooms' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./routes/index.js')(app, passport); // load our routes and pass in our app and fully configured passport

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.get('/', function (req, res) {
  res.render('index',
  { title : 'Home' }
  );
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
