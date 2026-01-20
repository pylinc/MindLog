const mongoose = require('mongoose');
require('dotenv').config();

const connect = ()=>{
    mongoose.connect(process.env.MONGO_URL)
    .then(console.log("DB Connection Successfull"))
    .catch((err)=>{
        console.log("Error while establishing connection with database");
        console.error(err);
        process.exit(1);
    });
}

module.exports = connect;