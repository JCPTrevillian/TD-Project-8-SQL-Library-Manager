var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var books = require('./routes/books');
const { sequelize } = require('./models');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/books', books);


(async () => {

  await sequelize.sync();

  try {
    await sequelize.authenticate();
    console.log('Connection to the database successful!');
  } catch(error) {
    console.error('Error connecting to the database: ', error);
  }

})()

 // error handlers 

//404
 app.use((req, res) => {
  console.log('404 error handler');
  const err = new Error();
  err.status = 404;
  err.message = "Page does not exist." 
  res.render('not-found', { err });
})

//500
app.use((err,req,res,next) => {
  console.log("500 global error handler")
  
  if (!err.status) {        
    err.status = 500;
    err.message = 'Something went wrong on the server.'
    res.render('error', { err })
   } else {
    res.status(err.status || 500)
    res.render('error', { err })
   }
});

module.exports = app;
