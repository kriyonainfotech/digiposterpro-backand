const UserModel = require('../models/user')
const jwt = require('jsonwebtoken')
const IsAuthnticated = async(req,res,next) => {
   try {
    const token = req.cookie.token
    if(!token) {
        return res.status(401).json({message: 'Unauthorized'})
    }
    next()
   } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error", error });
   }
}
const ISUser = async(req,res,next) => {
    try {
      const token = req.cookies.token;  
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "You need to log in to access this resource."
          })
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message : 'User not found. Please log in again.'
          })
      }
      req.user = user;
      next();
    }
    catch(error) {
      console.log(error);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again."
      });
    }
}
module.exports = {
    IsAuthnticated,ISUser
}