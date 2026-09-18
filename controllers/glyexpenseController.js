const GlyExpense = require('../models/GlyExpense');

// Create a new expense
const createGlyExpense = async (req, res) => {
  try {
    const { title, amount } = req.body;
    const username = req.body.username || 'Unknown';

    if (!title || !amount) {
      return res.status(400).json({ message: 'Title and amount are required' });
    }

    const glyexpense = new GlyExpense({
      title,
      amount,
      username,
      category: req.body.category || 'General',
      date: req.body.date || new Date(),
      notes: req.body.notes || '',
    });

    await glyexpense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all expenses
const getGlyExpenses = async (req, res) => {
  try {
    const glyexpenses = await GlyExpense.find().sort({ date: -1 });
    res.status(200).json(glyexpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGlyExpense,
  getGlyExpenses,
};
