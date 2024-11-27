const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['business', 'daily', 'festival'],
    required: true
  },
  thumbnail: {
    url: { type: String },
  },
  images: [
    { 
      url: {
        type: String,
        required: true
      },
      index: {
        type: Number,
        required: true
      }
    }
  ],
  index: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
