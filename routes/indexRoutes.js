const express = require('express')
const router = express.Router()
router.use('/auth',require('./authRoutes'))
router.use('/category',require('./categoryRoutes'))
router.use('/frame',require('./frameRoutes'))
router.use('/banner',require('./bannerRoutes'))
router.use('/feedback',require('./feedbackRoutes'))
module.exports = router