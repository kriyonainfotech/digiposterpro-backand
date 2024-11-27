const mongoose = require('mongoose');
const BannerSchema = new mongoose.Schema({
  image: {
    url: { type: String },
  },
 
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);