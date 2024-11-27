const UserModel = require('../models/user')
const nodemailer = require('nodemailer');
const OtpModel = require('../models/otp')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Update if using a different provider
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.EMAIL_PASSWORD // Your email password or app password
  }
});
const cloudinary = require("cloudinary").v2;
const SentOtp = async (req, res) => {
  try {
      const { email,mobileNumber } = req.body;
      console.log(email);

      // Generate OTP and expiration time
      const otp = crypto.randomInt(100000, 999999);
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

      // Check if OTP entry already exists for this email
      let otpEntry = await OtpModel.findOne({ email });
      if (otpEntry) {
          // Update the OTP and expiration time
          otpEntry.otp = otp;
          otpEntry.otpExpires = otpExpires;
      } else {
          // Create new OTP entry
          otpEntry = new OtpModel({ email, otp, otpExpires,mobileNumber });
      }
      await otpEntry.save();

      // Send OTP via email
      const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: 'Verify Your Email',
          text: `Your OTP for verification is ${otp}. This code is valid for 10 minutes.`
      };
      await transporter.sendMail(mailOptions);

      res.status(200).send({ success: true, message: "OTP sent to email" });
  } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).send({ success: false, message: "Server error" });
  }
};
const verifyOtp = async (req, res) => {
  try {
      const { email, otp } = req.body;

      // Find OTP entry
      const otpEntry = await OtpModel.findOne({ email, otp });
      if (!otpEntry) {
          return res.status(400).send({ success: false, message: "Invalid OTP" });
      }
      // Check if OTP has expired
      if (otpEntry.otpExpires < Date.now()) {
          await OtpModel.deleteOne({ email }); // Clean up expired OTP
          return res.status(400).send({ success: false, message: "OTP has expired" });
      }
       let userMobileNumber = otpEntry.mobileNumber
      // Create user in UserModel
      const newUser = new UserModel({
          email,
          mobileNumber:userMobileNumber,
          isVerified: true,
      });
      await newUser.save();

      // Delete OTP entry after successful verification
      await OtpModel.deleteOne({ email });

      res.status(200).send({ success: true, message: "User created and verified successfully" });
  } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).send({ success: false, message: "Server error" });
  }
};
const completeRegistration = async (req, res) => {
  try {
    const { email, password, mobileNumber, address,businessName,profilePic } = req.body;
    console.log(req.body);

    // Check if the user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new UserModel({
      email,
      password: hashedPassword,
      mobileNumber,
      address,
      businessName,
      profilePic,
      isVerified: true,
      isLoggedin: true,
      lastLoginTime: new Date(),
    });

    await user.save();
    console.log(user);
    
    res.status(201).send({ success: true, message: "User registered successfully" ,user});
  } catch (error) {
    console.error("Error completing registration:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};
const loginUser = async(req,res) => {
    try {
      const { email, password } = req.body;
  
      // Check if user with the provided email exists
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(400).send({ success: false, message: "Invalid email or password" });
      }
  
      // Compare provided password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).send({ success: false, message: "Invalid email or password" });
      }
      user.isLoggedin = true;
      user.lastLoginTime = new Date();
      await user.save();
      console.log(user);
      
      res.status(200).send({ success: true, message: "Login successful", user });
    } catch (error) {
      console.error("Error during user Login:", error);
      res.status(500).send({ success: false, message: "Server error" });
    }
}
const loginUseradmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user with the provided email exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send({ success: false, message: "Invalid email or password" });
    }

    // Compare provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send({ success: false, message: "Invalid email or password" });
    }

    // Update user login status and timestamp
    user.isLoggedin = true;
    user.lastLoginTime = new Date();
    await user.save();

    // Create a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET, // Ensure you have a secret key in your environment variables
      { expiresIn: '1h' } // Set token expiration
    );

    // Set the token in a cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 3 * 60 * 60 * 1000 // 3 hours in milliseconds
    });
    

    // Send success response
    res.status(200).send({ success: true, message: "Login successful", user });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999);
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Check if an OTP entry already exists for the email
    const existingOtp = await OtpModel.findOne({ email });

    if (existingOtp) {
      // Update existing OTP record
      await OtpModel.updateOne({ email }, { otp, otpExpires });
    } else {
      // Create a new OTP record
      await OtpModel.create({ email, otp, otpExpires });
    }

    // Send OTP to user's email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Verify Your Email',
      text: `Your OTP for verification is ${otp}. This code is valid for 10 minutes.`
    };
    await transporter.sendMail(mailOptions);

    res.status(200).send({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error", error });
  }
};
const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OtpModel.findOne({ email, otp });

    if (!record || record.otpExpires < Date.now()) {
      return res.status(400).send({success: false, message: "Invalid or expired OTP" });
    }

    res.status(200).send({success: true, message: "OTP verified" });
  } catch (error) {
    res.status(500).send({success: false, message: "Server error", error });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const numericOtp = parseInt(otp, 10);
    const record = await OtpModel.findOne({ email });;


    // Check if the OTP record exists
    if (!record) {
      return res.status(400).send({ success: false, message: "OTP does not match" });
    }
    console.log(record.otp);
    console.log(numericOtp);
    
    // Check if OTP matches
    if (record.otp !== numericOtp) {
      return res.status(400).send({ success: false, message: "Incorrect OTP" });
    }

    // Check if OTP is expired
    if (record.otpExpires < Date.now()) {
      await OtpModel.deleteOne({ email, otp }); // Optionally delete expired OTP
      return res.status(400).send({ success: false, message: "OTP expired" });
    }

    // Hash the new password and update it in the user model
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updateOne({ email }, { password: hashedPassword });

    // Delete OTP after successful password reset
    await OtpModel.deleteOne({ email, otp });

    res.status(200).send({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error", error });
  }
};
const isLoggedin = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).send({ success: false, message: "UserId is required." });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found." });
    }

    // Check if lastLoginTime is more than 24 hours ago
    const hoursSinceLogin = (Date.now() - new Date(user.lastLoginTime)) / (1000 * 60 * 60);
    if (hoursSinceLogin >= 24) {
      // Update `isLoggedin` to false if 24 hours have passed
      user.isLoggedin = false;
      await user.save();
      return res.status(400).send({ success: false, message: "User session expired. Please log in again." });
    }
    // const minutesSinceLogin = (Date.now() - new Date(user.lastLoginTime)) / (1000 * 60);
    
    
    // if (minutesSinceLogin >= 1) {
    //   // Update `isLoggedin` to false if 5 minutes have passed
    //   user.isLoggedin = false;
    //   await user.save();
    //   return res.status(400).send({ success: false, message: "User session expired. Please log in again." });
    // }

    // If within 24 hours and `isLoggedin` is true
    if (user.isLoggedin) {
      return res.status(200).send({ success: true, message: "User is logged in." });
    } else {
      return res.status(400).send({ success: false, message: "User is not logged in." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error", error });
  }
};
const CheckAuth = async(req,res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User is authenticated',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error", error });
  }
}
const getUserByid = async(req,res) => {
  try {
    const {userId} = req.body
    if(!userId){
      return res.status(400).send({ success: false, message: "User ID is required" });
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found"
    });
    }
    return res.status(200).send({ success: true, message: "User found", user
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error", error });
  }
}
const getTotalUserCount = async (req, res) => {
  try {
    // Count the total number of users
    const userCount = await UserModel.countDocuments();

    res.status(200).send({ success: true, count: userCount });
  } catch (error) {
    console.error("Error fetching total user count:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;


    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const updateProfilePic = async (req, res) => {
  try {
    const { userId } = req.body; // User ID from the route parameter
    const profilepic = req.file ? req.file.path : null; // Check if file is uploaded
    console.log(req.body);
    
    // Validate that   file is uploaded
    if (!profilepic) {
      return res.status(400).json({ success: false, message: "Profile picture is required" });
    }

    // Upload image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(profilepic);

    // Update the user's profilePic field with the Cloudinary URL
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { profilePic: cloudinaryResponse.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const updateUser = async (req, res) => {
  try {
    const { userId, email, password, mobileNumber, address, businessName, businessCategory } = req.body;
    let profilepicUrl = null;

    if (req.file) {
      // Upload image to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path);
      profilepicUrl = cloudinaryResponse.secure_url;
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (address) updateData.address = address;
    if (businessName) updateData.businessName = businessName;
    if (businessCategory) updateData.businessCategory = businessCategory;
    if (profilepicUrl) updateData.profilePic = profilepicUrl;

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const updateSingleField = async (req, res) => {
  try {
    const { userId } = req.body; // User ID from the route parameter
    const { field, value } = req.body; // Field to update and its new value
    

    // Validate input
    
    if (!field || value === undefined) {
      return res.status(400).json({ success: false, message: "Field and value are required" });
    }

    // Check if the field exists in the schema
    const schemaFields = ["businessName", "email", "password", "mobileNumber", "address", "profilePic", "businessName", "businessCategory", "logo"];
    if (!schemaFields.includes(field)) {
      return res.status(400).json({ success: false, message: "Invalid field for update" });
    }



    // Update the field dynamically
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { [field]: value },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating field:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = {
  SentOtp,loginUser,verifyOtp,completeRegistration,forgotPassword,verifyForgotPasswordOtp,resetPassword,isLoggedin,loginUseradmin,CheckAuth,getUserByid,getTotalUserCount,deleteUser,updateSingleField,updateProfilePic,updateUser
}