const Category = require('../models/category')
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
const Addcategory = async (req, res) => {
    try {
      const { category, type } = req.body;
      console.log(req.body);
      
      if (!category || !type || !req.files) {
        return res.status(400).json({ success: false, message: "All fields are required." });
      }
  
      // Check if the category already exists
      const existCategory = await Category.findOne({ category });
      if (existCategory) {
        return res.status(400).json({ success: false, message: "Category already exists." });
      }
      const lastCategory = await Category.findOne().sort({ index: -1 });
    const nextIndex = lastCategory ? lastCategory.index + 1 : 1;
  
      // Map files to store each as an object with url and index
      const images = req.files.map((file, index) => ({
        url: file.path,
        index: index
      }));
  
      // Create and save the new category
      const cate = new Category({
        category,
        type,
        images,
        index:nextIndex 
      });
      await cate.save();
  
      return res.status(201).json({ success: true, message: "Category added successfully", cate });
    } catch (error) {
      console.error("Error in Addcategory:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        if (categories.length === 0) {
            return res.status(404).send({ success: false, message: "No categories found." });
        }
        return res.status(200).send({ success: true, categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send({ success: false, message: "Server error" });
    }
};
const updateCategory = async (req, res) => {
  try {
    const { category, type, categoryId } = req.body;

    // Fetch the existing category by ID
    const categorys = await Category.findById(categoryId);
    if (!categorys) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Delete old images from Cloudinary if new ones are uploaded
    if (req.files && req.files.length > 0) {
      for (let image of categorys.images) {
        const publicId = getPublicIdFromUrl(image.url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Update with new images
      categorys.images = req.files.map((file, index) => ({
        url: file.path,
        index: index
      }));
    }

    // Update category details
    categorys.category = category || categorys.category;
    categorys.type = type || categorys.type;

    // Save the updated category
    await categorys.save();

    return res.status(200).json({ success: true, message: "Category updated successfully", categorys });
  } catch (error) {
    console.error("Error in updateCategory:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log(categoryId);
    

    const categories = await Category.findById(categoryId);
    if (!categories) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Delete each image from Cloudinary
    for (let image of categories.images) {
      const publicId = getPublicIdFromUrl(image.url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Delete the category from the database
    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
const getCategoryBycategory = async(req,res) => {
  try {
    const {categoryId} = req.body
    const category = await Category.findById(categoryId)
    if(!category) return res.status(404).json({success:false,message:"Category not found"
      })
      return res.status(200).json({success:true,message:"Category found",category})
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
}
const addImageToCategory = async(req,res) => {
  try {
    const { categoryId } = req.body;
    
    // Ensure that files have been uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images uploaded." });
    }

    // Find the category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    // Map the uploaded files to create image objects with URLs
    const uploadedImages = req.files.map(file => ({
      url: file.path, // Path from cloud storage (Cloudinary or local storage)
      index: category.images.length // Ensure images are appended in order
    }));

    // Add the new images to the category
    category.images.push(...uploadedImages);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Images added successfully.",
      newImages: uploadedImages
    });
  } catch (error) {
    console.error("Error in addImageToCategory:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
const Imagedelete = async (req, res) => {
  const { imageId, categoryId } = req.body.data;
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }


    const image = category.images.find(img => img._id.toString() === imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    
    const publicId = getPublicIdFromUrl(image.url);
    console.log("Public ID to delete:", publicId); 

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Invalid public ID' });
    }

    const result = await cloudinary.uploader.destroy(publicId);  
    console.log("Cloudinary delete response:", result); 

    if (result.result !== "ok") {
      throw new Error("Failed to delete image from Cloudinary");
    }

    category.images = category.images.filter(img => img._id.toString() !== imageId);
    await category.save();
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the image' });
  }
};
const updateimageorder = async(req,res) => {
  const { categoryId, updatedImages } = req.body;

  try {
    // Find the category by ID and update its images array
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.images = updatedImages; // Update the images array in the category
    await category.save(); // Save the updated category

    return res.status(200).json({ success: true, message: 'Image order updated' });
  } catch (error) {
    console.error("Error updating image order:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
const getTotalTemplateCount = async(req,res) => {
  try {
    const templateCount = await Category.countDocuments();
    res.status(200).send({ success: true, templateCount });
  } catch (error) {
    console.error("Error fetching total user count:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
}
const updateCategoryOrder = async (req, res) => {
  try {
    const { updatedCategories } = req.body;
    console.log(req.body);
    const bulkOps = updatedCategories.map((category) => ({
      updateOne: {
        filter: { _id: category._id },
        update: { $set: { index: category.index } },
      },
    }));

    // Perform bulk update
    await Category.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Category order updated successfully." });
  } catch (error) {
    console.error("Error updating category order:", error);
    res.status(500).json({ success: false, message: "Failed to update category order.", error });
  }
};
const updatethumbnail = async(req,res) => {
  try {
    const { categoryId } = req.body;

    // Validate request data
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is required.',
      });
    }

    // Upload the new thumbnail to Cloudinary
  

    // Update the category's thumbnail
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { thumbnail: { url: req.file.path } },
      { new: true } // Returns the updated document
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Send the response
    res.status(200).json({
      success: true,
      message: 'Thumbnail updated successfully.',
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error in Addcategory:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
const getDummyCategories = async(req,res) => {
  try {
    const dummycategories = ['Good Morning','Business']
    return res.status(200).send({
      success: true,
      message: 'Categories retrieved successfully.',
      categories: dummycategories
    })
  } catch (error) {
    console.error("Error in dummycategories:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { 
    Addcategory,getCategories,updateCategory,deleteCategory,getCategoryBycategory,addImageToCategory,Imagedelete,updateimageorder,getTotalTemplateCount,updateCategoryOrder,updatethumbnail,getDummyCategories
}