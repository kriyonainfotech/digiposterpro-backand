const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  address: {
    type :String,
  },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  isLoggedin:{
    type:Boolean,
    default:false
  },
  lastLoginTime: { type: Date },
  businessCategory: {
    type: String,
    enum: ["Retail", "Services", "IT", "Healthcare", "Education", "Other"], // Enum field
    required: false,
  },
  logo: { type: String ,required:false},
  businessName : {
    type:String
  },
  profilePic: {
    type: String,
    default:"https://res.cloudinary.com/dd7cx04dq/image/upload/v1732107807/zw6u1oafepbxhjmqoveh.jpg"
  }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);