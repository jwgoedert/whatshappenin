const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const Event = require('./server/controllers/events');
const Path = require('path');
const User = require('./server/models/user.js');
require('dotenv').config();
// connect to the database and load models
require('./server/models').connect(process.env.EPMONGO || process.env.MONGO_KEY, function(err, success){
  if(err){
    console.err(err, 'mongo err');
  } else {
    console.log('mongo success')
  }
});

// hello me
const app = express();
// tell the app to look for static files in these directories
app.use(express.static('./server/static/'));
app.use(express.static('./client/dist/'));
// tell the app to parse HTTP body messages
app.use(bodyParser.urlencoded({ extended: false }));
// pass the passport middleware
app.use(passport.initialize());
app.use(passport.session());

// load passport strategies
const localSignupStrategy = require('./server/passport/local-signup');
const localLoginStrategy = require('./server/passport/local-login');

passport.use('local-signup', localSignupStrategy);
passport.use('local-login', localLoginStrategy);

// pass the authorization checker middleware
const authCheckMiddleware = require('./server/middleware/auth-check');

app.use('/api', authCheckMiddleware);

// routes
const authRoutes = require('./server/routes/auth');
const apiRoutes = require('./server/routes/api');

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.get('/googlekey', (req, res) => {
  res.status(200).json(process.env.GOOGLE_MAP);
});

app.post('/makeevent', (req, res) => {
  console.log(req.body, 'event body');
  Event.createEvent(req.body);
  res.send('event made');
});

app.post('/makeevent', (req, res) => {
  console.log(req.body, 'event body');
  req.body.attendees = {};
  Event.createEvent(req.body);
});

/**
 * Route to get events for both user, and events page
 * @param req.body, if it contains the username, then get
 * that user's events
 * @return Sets the state detailbox to the clicked event
 */
app.get('/events', (req, res) => {
  if (!req.body.username) {
    Event.findAll().then(events => res.send(events));
  } else {
    res.json(Event.findUserevent(req.body.username));
  }
});

app.post('/addAttendee', (req, res) => {
  console.log(req.params);
  Event.findOneandUpdate({ title: req.params.title }, { attendees: { [req.param.username]: true } });
});

app.get('*', (req, res) => {
  res.sendFile(Path.resolve(__dirname, './server/static/index.html'));
});


// start the server
app.listen(process.env.PORT || 3000, (err, success) => {
  if (err) {
    console.log(err, 'error in listen');
  } else {
    console.log(`listening on ${process.env.PORT}`);
  }
});
