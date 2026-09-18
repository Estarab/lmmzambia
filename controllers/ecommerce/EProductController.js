const EProduct = require('../../models/ecommerce/Product');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Helper: Upload an image to Cloudinary
const uploadToCloudinary = async (file) => {
  const res = await cloudinary.uploader.upload(file, {
    folder: 'ecommerce_products',
  });
  return res.secure_url; // Return the Cloudinary URL
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, category, subcategory,description, price, stock, images } = req.body;

    if (!images || images.length === 0)
      return res.status(400).json({ error: 'No images provided' });

    if (images.length > 5)
      return res.status(400).json({ error: 'Max 5 images allowed' });

    // Upload images to Cloudinary
    const uploadedUrls = await Promise.all(images.map(img => uploadToCloudinary(img)));

    const product = new EProduct({
      name,
      category,
      subcategory,
      description,
      price,
      stock,
      images: uploadedUrls,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await EProduct.find().sort({ dateCreated: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { images, ...rest } = req.body;
    let uploadedUrls = images || [];

    // If new images are provided as Base64/local files, upload them
    if (images && images.length) {
      uploadedUrls = await Promise.all(images.map(img => uploadToCloudinary(img)));
    }

    const product = await EProduct.findByIdAndUpdate(
      req.params.id,
      { ...rest, images: uploadedUrls },
      { new: true }
    );

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await EProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// const EProduct = require('../../models/ecommerce/Product');

// // Create product
// exports.createProduct = async (req, res) => {
//   try {
//     const { name, category, description, price, stock, images } = req.body;
//     if (images.length > 5) return res.status(400).json({ error: 'Max 5 images allowed' });

//     const product = new EProduct({ name, category, description, price, stock, images });
//     await product.save();
//     res.status(201).json(product);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Get all products
// exports.getProducts = async (req, res) => {
//   try {
//     const products = await EProduct.find().sort({ dateCreated: -1 });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Update product
// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await EProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!product) return res.status(404).json({ error: 'Product not found' });
//     res.json(product);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Delete product
// exports.deleteProduct = async (req, res) => {
//   try {
//     const product = await EProduct.findByIdAndDelete(req.params.id);
//     if (!product) return res.status(404).json({ error: 'Product not found' });
//     res.json({ message: 'Product deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
