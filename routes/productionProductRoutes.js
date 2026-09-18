const express = require('express');
const router = express.Router();
const ProductionProduct = require('../models/ProductionProduct');

router.post('/', async (req, res) => {
  try {
    const product = await ProductionProduct.create(req.body);
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  const products = await ProductionProduct.find().sort({ createdAt: -1 });
  res.json(products);
});

module.exports = router;
