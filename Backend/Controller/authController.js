const { HTTP_STATUS, VALIDATION, REGEX, ERROR_MESSAGES,JWT} = require('../Config/constant');
const user = require('../Models/user');

require('dotenv').config();

exports.signUp = async(req,res)=>{
    try{
        const{username,email,password,firstName,lastName} = req.body;

        // check if all the data is given by the user
        if(!username || !email || !password || !firstName){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Provide username, email, password and first name",
            });
        }

        // if user already exist
        const existingUser = await user.findByEmail(email);
        // console.log(existingUser);
        if(existingUser){
            return res.status(HTTP_STATUS.CONFLICT).json({
                success:false,
                message:"Email is alredy present. Login",
            });
        }

        // if username is taken
        const usernamePresent = await user.findOne({
            username:username.toLowerCase()
        })

        if(usernamePresent){
            return res.status(HTTP_STATUS.CONFLICT).json({
                success:false,
                message:"Username already Taken.",
            });
        }

        // create new user
        const newUser = await user.create({
            username,
            email,
            password,
            profile:{
                firstName,
                lastName,
                avatar:"https://ui-avatars.com/api/?name="+firstName+"+"+lastName
            }
        });

        //create a token to directly login the user

        const token = newUser.generateToken();

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                profile: newUser.profile,
                preferences: newUser.preferences,
                createdAt: newUser.createdAt
            }
        });

    }catch(error){
        console.error("Register error: ",error);

        if(error.name === 'ValidationError'){
            const messages = Object.values(error.errors).map(val => val.message);
             return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: messages.join(', ')
            });
        }

        // Duplicate Key Error (e.g., username or email already taken)
        if(error.code === 11000){
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: ERROR_MESSAGES.USER_ALREADY_EXISTS
            });
        }

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
            error: error.message
        });
    }
}

exports.login = async(req,res)=>{
    try{
        
        const{identifier,password} = req.body;
    
        if(!identifier || !password){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Enter the details",
            });
        }
        
        const query = identifier.includes("@") ? { email: identifier.toLowerCase() } : { username: identifier.toLowerCase() };

        const User = await user.findOne(query).select("+password");

        if(!User){
            console.log("Login failed: User not found for query:", query);
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.USER_NOT_FOUND,
            });
        }

        if(!User.isActive){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success:false,
                message:"Account is Deactivated",
            });
        }
    
        const checkPass = await User.comparePassword(password);
        
        if(!checkPass){
            console.log("Login failed: Password mismatch for user:", User.email);
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success:false,
                message:ERROR_MESSAGES.INVALID_CREDENTIALS
            });
        }
    
        const token = User.generateToken();
        User.password = undefined;
    
        const options = {
            expires: new Date(Date.now()+ 7*60*60*1000),
            sameSite:"Lax",
            httpOnly:true,
        }
        return res.cookie("token",token,options).status(HTTP_STATUS.OK).json({
            success:true,
            message:"Login Success",
            token,
            User,
        });
    }
    catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.currentUser = async(req,res)=>{
    try{
        const currentUser = await user.findById(req.user);

        if(!currentUser){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.USER_NOT_FOUND,
            });
        }
        res.status(200).json({
            success: true,
            username:currentUser.username,
            email:currentUser.email,
            profile:currentUser.profile,
            preferences:currentUser.preferences,
            createdAt:currentUser.createdAt
        });
    }
    catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.updateUser = async(req,res)=>{

    try{

        const {firstName, lastName,bio,avatar} =req.body;
    
        if(!firstName){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Enter the first name",
            });
        }
    
        const userId = req.user;
    
        const updateUser = await user.findByIdAndUpdate(userId,{
            $set:{
                profile:{
                    firstName,
                    lastName,
                    bio,
                    avatar,
                    updatedAt:Date.now(),
                }
            }
        });
    
        if(!updateUser){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.USER_NOT_FOUND,
            });
        }
    
    
        res.status(HTTP_STATUS.OK).json({
            success:true,
            message:"User updated successfully",
            updateUser,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.updatePrefrences = async(req,res)=>{
    try{
        const {theme,timeZone,remainderTime}= req.body;
        if(!theme || !timeZone || !remainderTime){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Enter the details",
            });
        }

        const userId = req.user;

        const updateUser = await user.findByIdAndUpdate(userId,{
            $set:{
                preferences:{
                    theme,
                    timeZone,
                    remainderTime,
                    updatedAt:Date.now(),
                }
            }
        });

        if(!updateUser){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.USER_NOT_FOUND,
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success:true,
            message:"User updated successfully",
            
        });

    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.changePassword = async (req,res)=>{
    try{
        const {currentPassword, newPassword} = req.body;
        if(!currentPassword || !newPassword){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Enter the details",
            });
        }
        if(newPassword.length < VALIDATION.PASSWORD.MIN_LENGTH || newPassword.length > VALIDATION.PASSWORD.MAX_LENGTH){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Password length should be between 6 and 10",
            });
        }
        const userId = req.user;
        const User = await user.findById(userId).select("+password");
        if(!User){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.USER_NOT_FOUND,
            });
        }
        const checkPass = await User.comparePassword(currentPassword);
        if(!checkPass){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success:false,
                message:ERROR_MESSAGES.INVALID_CREDENTIALS,
            });
        }
        User.password = newPassword;
        await User.save();
        res.status(HTTP_STATUS.OK).json({
            success:true,
            message:"Password changed successfully",
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
}
exports.logout = async (req,res)=>{
    try{
        
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
        });
        return res.status(200).json({
            success:true,
            message:"Logout Successfully",
        });
        
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
}