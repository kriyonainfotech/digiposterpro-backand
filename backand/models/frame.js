const mongoose = require('mongoose');

// Define the schema
const FrameSchema = new mongoose.Schema(
  {
    jsonData: {
      type: Object, // JSON data
      required: true,
    },
    imageUrl: {
      type: String, // URL or path of the image
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set to current date
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create the model
module.exports = mongoose.model('Frame', FrameSchema);


