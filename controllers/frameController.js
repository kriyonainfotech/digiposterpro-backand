const css = require('css');
const Frame = require('../models/frame');
const cloudinary = require('cloudinary').v2;
const getPublicIdFromUrl = (url) => {
  if (typeof url === 'string') {
    const regex = /\/(?:v\d+\/)?([^\/]+)\/([^\/]+)\.[a-z]+$/;
    const match = url.match(regex);
    if (match) {
      return `${match[1]}/${match[2]}`; // captures folder and file name without versioning or extension
    }
    console.error("Could not match regex for publicId extraction:", url);
    return null;
  } else if (Array.isArray(url) && url.length > 0) {
    // Handle case where url is an array by extracting the first element
    return getPublicIdFromUrl(url[0]);
  } else {
    console.error("The provided URL is not a valid string or non-empty array:", url);
    return null;
  }
};
const convertCssToJson = async (req, res) => {
  try {
       const cssText = req.body.cssText;
    console.log(req.body);
    
    if (!cssText) {
      return res.status(400).send({ success: false, message: 'CSS text is required.' });
    }
 
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required.' });
    }

    const imageurl = req.file.path;


    // Parse the CSS text into a structured JSON object
    const parsedCSS = css.parse(cssText);
    const jsonOutput = {};

    // Convert the parsed CSS into a more usable JSON structure
    parsedCSS.stylesheet.rules.forEach((rule) => {
      if (rule.type === 'rule') {
        rule.selectors.forEach((selector) => {
          if (!jsonOutput[selector]) jsonOutput[selector] = {};

          rule.declarations.forEach((declaration) => {
            jsonOutput[selector][declaration.property] = declaration.value;
          });
        });
      }
    });
    const frame = new Frame({
        imageUrl:imageurl,
      jsonData: jsonOutput,
    });

    await frame.save();

    res.status(200).json({
      success: true,
      message: 'CSS converted and saved successfully.',
      data: frame,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ success: false, message: 'Server error.' });
  }
};
const getFrameJson = async (req, res) => {
    try {
      
      const frames = await Frame.find();
  
      if (!frames || frames.length === 0) {
        return res.status(404).json({ success: false, message: 'No frames found.' });
      }
      res.status(200).json({
        success: true,
        data: frames,
      });
    } catch (error) {
      console.error('Error fetching frames:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching frames.',
      });
    }
};
const deleteframe = async(req,res) => {
  try {
    const { frameId } = req.body;

    if (!frameId) {
      return res.status(400).json({
        success: false,
        message: 'Frame ID is required.',
      });
    }
    const frame = await Frame.findById(frameId);

    if (!frame) {
      return res.status(404).json({
        success: false,
        message: 'Frame not found.',
      });
    }
    const publicId = frame.imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
    await Frame.findByIdAndDelete(frameId);
    res.status(200).json({
      success: true,
      message: 'Frame and associated image deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting frame:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
}
const namegenrate = async(req,res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address provided.",
      });
    }

    // Extract the part before the '@' symbol
    const username = email.split("@")[0];

    // Split the username into first and last names based on logic
    const [firstName, ...lastNameParts] = username.match(/[a-zA-Z]+/g); // Extract only alphabetic characters
    const lastName = lastNameParts.join(" "); // Join remaining parts as the last name

    res.status(200).json({
      success: true,
      firstName: firstName || "Unknown",
      lastName: lastName || "Unknown",
    });
  } catch (error) {
    console.error("Error splitting email:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the email.",
    });
  }
}
const getTotalFrameCount = async (req, res) => {
  try {
    const frameCount = await Frame.countDocuments();
    res.status(200).send({ success: true, count: frameCount });
  } catch (error) {
    console.error("Error fetching total user count:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};
module.exports = {
  convertCssToJson,getFrameJson,deleteframe,namegenrate,getTotalFrameCount
};