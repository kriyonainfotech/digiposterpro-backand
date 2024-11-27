const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      ref: 'User', // Assuming you have a User model
    },
    text: {
      type: String,
      required: true,
      trim: true, // Removes leading and trailing whitespace
      maxlength: 500, // Example: limit text to 500 characters
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
