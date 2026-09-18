// controllers/stockTransactionController.js
const StockTransaction = require('../models/StockTransaction');

exports.create = async (req, res) => {
  try {
    const { type, productId, productName, quantity, unitPrice, notes } = req.body;
    if (!type || !productId || !quantity || !unitPrice) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const total = quantity * unitPrice;
    const stockTx = new StockTransaction({ type, productId, productName, quantity, unitPrice, total, notes });
    await stockTx.save();
    res.status(201).json(stockTx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record stock transaction' });
  }
};

exports.list = async (req, res) => {
  try {
    const { type, productId, from, to } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (productId) filter.productId = productId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const records = await StockTransaction.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch stock transactions' });
  }
};
