const User = require('../Models/user');
const {HTTP_STATUS,ERROR_MESSAGES} = require('../Config/constant');
const jwt = require('jsonwebtoken');

require('dotenv').config();

exports.authMiddleware = async(req,res,next)=>{
    try{
        
        const token  = req.cookies.token;

        if(!token){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                message:ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        const decode = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decode.id;
        next();
    }catch(error){
        console.log(error);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            message:ERROR_MESSAGES.INVALID_TOKEN,
        });
    }
}