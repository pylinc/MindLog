const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const{THEMES,VALIDATION,DEFAULTS,REGEX,ERROR_MESSAGE} = require('./Config/constant');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:true,
        trim:true,
        minlength:[VALIDATION.USERNAME.MIN_LENGTH,`Username must be atleast ${VALIDATION.USERNAME.MIN_LENGTH} characters`],
        maxlength:[VALIDATION.USERNAME.MAX_LENTH,`Username cannot exceed ${VALIDATION.USERNAME.MAX_LENTH} characters`],
        match:[REGEX.USERNAME,'Username can only contain Letter,numbers,underscores and hyphes'],
        lowercase:true
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        unique:true,
        trim:true,
        lowercase,
        match:[REGEX.EMAIL,'please provide a valid email address']
    },
    password:{
        type:String,
        required:[true,'Password is required'],
        minlength:[VALIDATION.MIN_LENGTH,`Password should contain minimum ${VALIDATION.MIN_LENGTH} character`],
        maxlength:[VALIDATION.MIN_LENGTH,`Password cannot exceed ${VALIDATION.MIN_LENGTH} characters`],
        select:false, // do not include password in quaries by default
    },
    profile:{
        firstName:{
            type:String,
            trim:true,
            maxlength:[20,`First Name cannot exceed 20 characters`],
            required:true,
        },
        lastName:{
            type:String,
            trim:true,
            maxlength:[20,'Last Name cannot exceed 20 characters'],
        },
        bio:{
            type:String,
            maxLength:[500,'Bio Cannot exceed 500 characters'],
        },
        avatar:{
            type:String,
            required:true,
        }
    },
    preferences:{
        theme:{
            type:String,
            enum:{
                values:Object.values(THEMES)
            },
            default:DEFAULTS.THEME
        },
        timezone:{
            type:String,
            default:DEFAULT.TIMEZONE
        },
        reminderTime: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be in HH:MM format (e.g., 09:00)']
        }
    },
    isActive:{
        type:Boolean,
        default:true,
    },
},{
    timestamps:true
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });


userSchema.pre("save",async function(){
    if(!this.isModified("password")){
        return next();
    }
    try{
        this.password = await bcrypt.hash(this.password,10);
        next();
    }catch(err){
        next(err);
    }
});

userSchema.methods.comparePassword = async function(pass){
    try{
        return await bcrypt.compare(pass,this.password);
    }catch(error){
        throw new Error('Password Comparison failed');
    }
}

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

userSchema.statics.findByEmail = function(){
    return  this.findOne({email:this.email.toLowerCase()}).select('+password');
}

userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});


module.exports = mongoose.model("User",userSchema);
