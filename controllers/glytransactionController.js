// controllers/transactionController.js
const GlyTransaction = require('../models/GlyTransaction');

exports.createGlyTransaction = async (req, res) => {
  try {
    const { items, total, amountReceived, change, paymentMethod, username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const glytransaction = new GlyTransaction({
      items,
      total,
      amountReceived,
      change,
      paymentMethod,
      username,
    });

    await glytransaction.save();
    res.status(201).json(glytransaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
};

exports.getGlyTransactions = async (req, res) => {
  try {
    const glytransactions = await GlyTransaction.find().sort({ date: -1 });
    res.json(glytransactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};
