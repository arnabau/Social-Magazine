/**
* @package   Social Magazine
* @author    Arnaldo Baumanis
* @copyright 2019
* @license   This project is licensed under the MIT License
*/

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const csrf = require('csurf');
const app = express();
const sanitizeHTML = require('sanitize-html');

// Traditional HTML form submit
app.use(express.urlencoded({ extended: false }));
// JSON data
app.use(express.json());

app.use('/api', require('./router-api'));

/**
 * Create a session middleware with the given options.
 * Session data is not saved in the cookie itself, just the session ID.
 * Options:
 *  secret: Secret used to sign the session ID cookie. This can be either a string for a single secret, or an array of multiple secrets
 *  resave: Forces the session to be saved back to the session store
 *  saveUninitialized: Forces a session that is "uninitialized" to be saved to the store
 */
let sessionOptions = session({
  secret: 'Javascript is cool',
  store: new MongoStore({ client: require('./db') }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
});

app.use(sessionOptions);
app.use(flash());

app.use(function (req, res, next) {
  // make our markdown function available from within ejs templates
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), { allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {} });
  };

  // make all flash messages available from all templates
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');

  // make current user id available on the req object
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }
  // make user session available from within view templates
  res.locals.user = req.session.user;
  // make app name available from within view templates
  res.locals.appName = process.env.APP_NAME;
  next();
});

const router = require('./router');

app.use(express.static('public'));
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(csrf());
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', router);

app.use(function (err, req, res, next) {
  if (err) {
    if (err.code == 'EBADCSRFTOKEN') {
      req.flash('errors', 'Cross site request forgery detected');
      req.session.save(() => res.redirect('/'));
    } else {
      res.render('404');
    }
  }
});

const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next);
});

io.on('connection', function (socket) {
  if (socket.request.session.user) {
    let user = socket.request.session.user;
    socket.emit('welcome', { username: user.username, avatar: user.avatar });

    socket.on('chatMessageFromBrowser', function (data) {
      socket.broadcast.emit('chatMessageFromServer', {
        message: sanitizeHTML(data.message, { allowedTags: [], allowedAttributes: {} }),
        username: user.username,
        avatar: user.avatar
      });
    });
  }
});

module.exports = server;