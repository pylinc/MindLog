const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connect = require('./Config/db');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.json());

//database connection
connect();

app.listen(PORT, ()=>{
    console.log(`Server is running on port: ${PORT}`);
});