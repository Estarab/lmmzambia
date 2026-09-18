




const CKKExpense = require('../models/CKKExpense');

// Create a new expense
const createCKKExpense = async (req, res) => {
  try {
    const { title, amount, business, category, notes, date } = req.body;
    const username = req.body.username || 'Unknown';

    if (!title || !amount || !business) {
      return res.status(400).json({ message: 'Title, amount, and business are required' });
    }

    const ckkexpense = new CKKExpense({
      title,
      amount,
      username,
      business, // <-- store selected business
      category: category || 'General',
      date: date || new Date(),
      notes: notes || '',
    });

    await ckkexpense.save();
    res.status(201).json(ckkexpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all expenses (optionally filter by business)
const getCKKExpenses = async (req, res) => {
  try {
    const { business } = req.query;

    const filter = business ? { business } : {};

    const ckkexpenses = await CKKExpense.find(filter).sort({ date: -1 });
    res.status(200).json(ckkexpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCKKExpense,
  getCKKExpenses,
};
