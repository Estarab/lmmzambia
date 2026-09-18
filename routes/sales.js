const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale'); // Make sure you have this model

// GET all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

module.exports = router;
