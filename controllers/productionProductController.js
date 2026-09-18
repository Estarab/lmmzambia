const ProductionProduct = require('../models/ProductionProduct');

// GET all production products
exports.getAllProductionProducts = async (req, res) => {
  try {
    const products = await ProductionProduct.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch production products' });
  }
};

// CREATE production product
exports.createProductionProduct = async (req, res) => {
  try {
    const { name, recipe } = req.body;

    // Validation
    if (!name || !recipe || !Array.isArray(recipe) || recipe.length === 0) {
      return res.status(400).json({ message: 'Product name and recipe required' });
    }

    // Validate each ingredient
    for (let i = 0; i < recipe.length; i++) {
      const r = recipe[i];
      if (!r.materialName || r.qtyPerUnit == null || r.pricePerUnit == null) {
        return res.status(400).json({ message: 'All ingredient fields are required' });
      }
    }

    const newProduct = new ProductionProduct({
      name,
      unit: 'kg',
      recipe: recipe.map((r) => ({
        materialId: r.materialId || null, // optional if you track IDs
        materialName: r.materialName,
        qtyPerUnit: Number(r.qtyPerUnit),
        pricePerUnit: Number(r.pricePerUnit),
      })),
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create production product' });
  }
};
