const express = require('express')
const ConnectDb = require('./config/db')
const dotenv = require('dotenv')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path')
const app = express()
dotenv.config()
ConnectDb()
const corsOptions = {
    origin: 'http://localhost:5173',  // Update with your client URL
    credentials: true, // This allows cookies to be sen 
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')))
app.use('/',require('./routes/indexRoutes'))
app.listen(process.env.PORT,(err)=>{
    if(err) console.log(err)
    console.log(`Server Running On The Port = ${process.env.PORT}`);
})