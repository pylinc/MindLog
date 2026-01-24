const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connect = require('./Config/db');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.json());

const authRoutes = require("./Routes/authRoute");
app.use("/api",authRoutes);
//database connection
connect();

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload passed.', error: err.message });
    }
    next(err);
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port: ${PORT}`);
});