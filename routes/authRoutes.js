const express = require('express')
const router = express.Router()
const { loginUser, verifyOtp, SentOtp, completeRegistration, forgotPassword, verifyForgotPasswordOtp, resetPassword, isLoggedin, loginUseradmin, CheckAuth, getUserByid, getTotalUserCount, deleteUser, updateSingleField, updateProfilePic, updateUser } = require('../controllers/authController')
const { IsAuthnticated, ISUser } = require('../middleware/authmiddleware')
const multer = require('multer')
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users', 
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [
        {
          crop: 'fill',
          gravity: 'center',
          quality: 'auto:best', // Automatically optimizes quality while maintaining visual fidelity
        }
      ]
  },
});
const upload = multer({ storage: storage });
router.post('/sentOtp',SentOtp)
router.post('/registerUser',completeRegistration)
router.post('/loginUser',loginUser)
router.post('/verifyOtp',verifyOtp)
router.post('/forgotPassword',forgotPassword)
router.post('/verifyForgotPasswordOtp',verifyForgotPasswordOtp)
router.post('/resetPassword',resetPassword)
router.post('/isLoggedin',isLoggedin)
router.post('/loginUseradmin',loginUseradmin)
router.get('/check-auth',ISUser,CheckAuth)
router.post('/getUserById',getUserByid)
router.get('/getTotalUserCount',getTotalUserCount)
router.delete('/deleteUser',deleteUser)
router.post('/updateSingleField',updateSingleField)
router.post('/updateProfilePic',upload.single('profilePic'),updateProfilePic)
router.post('/updateUser',upload.single('profilePic'),updateUser)
module.exports = router