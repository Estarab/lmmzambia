// controllers/transactionController.js
const Transaction = require('../models/Transaction');

exports.createTransaction = async (req, res) => {
  try {
    const { items, total, amountReceived, change, paymentMethod, username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const transaction = new Transaction({
      items,
      total,
      amountReceived,
      change,
      paymentMethod,
      username,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};
