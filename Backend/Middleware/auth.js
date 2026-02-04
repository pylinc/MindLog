const User = require('../Models/user');
const {HTTP_STATUS,ERROR_MESSAGES} = require('../Config/constant');
const jwt = require('jsonwebtoken');

require('dotenv').config();

exports.authMiddleware = async(req,res,next)=>{
    try{
        let token = null;
        
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            token = req.headers.authorization.split(' ')[1];
        }
        else if(req.cookies.token){
            token = req.cookies.token;
        }

        if(!token){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message:ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
        const userId = decoded.id;

        const user = await User.findById(userId).select('-password');
        
        if(!user){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message:ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        if(!user.isActive){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message:'Account is inactive'
            });
        }

        req.user = user;
        
        req.userId = userId;
        
        next();
    }catch(error){
        console.error('Auth Middleware Error:', error);
        
        if(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message:ERROR_MESSAGES.INVALID_TOKEN,
            });
        }
        
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message:ERROR_MESSAGES.UNAUTHORIZED,
        });
    }
}