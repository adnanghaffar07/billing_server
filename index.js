const express = require("express");
// require("./db");


const app = express();
const path = require("path");
const cors = require("cors"); 
const PORT = process.env.PORT || 4000; 
const routes = require('./routes/routes');  
const bodyParser = require('body-parser');
const { AppError, errorHandler } = require('./utils/errorHandling'); 
/************** Middlewares ****************/
app.use(express.static(path.resolve('./public')));
app.use(express.json({limit: '10kb'}));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('public'));
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	next();
});
let corsOptions = {
    origin: '*',
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
app.use(cors(corsOptions));
 
/************** Routes ****************/
app.use('/' ,routes); /*** Application Route ***/ 

 
app.use((req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server.`, 404);
  next(err);
});
// Use the custom error handling middleware
app.use(errorHandler);
/*** Listen to Port ***/
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
module.exports = app;


