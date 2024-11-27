const Banner = require('../models/banner')
const Addbanner = async (req, res) => {
    try {
      // Check if a file is uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Banner image is required.',
        });
      }
  
      // Upload the image to Cloudinary (already done via multer storage)
      const uploadedImage = req.file;
  
      // Save the banner to the database
      const newBanner = new Banner({
        image: {
          url: uploadedImage.path, // Cloudinary file path
        },
      });
  
      await newBanner.save();
  
      // Send success response
      res.status(201).json({
        success: true,
        message: 'Banner added successfully.',
        banner: newBanner,
      });
    } catch (error) {
      console.error('Error in Addbanner:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
      });
    }
}
const getbanner = async(req,res) => {
    try {
        const banner = await Banner.find({})
        res.status(200).json({
            success: true,
            message: 'Banner fetched successfully.',
            banner: banner
            })
    } catch (error) {
        console.error('Error in Addbanner:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
      });
    }
}
module.exports = {
    Addbanner,getbanner
}