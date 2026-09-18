





const CKKIncome = require('../models/CKKIncome');

// Create a new expe
const createCKKIncome = async (req, res) => {
  try {
    const { title, amount, business, category, notes, date } = req.body;
    const username = req.body.username || 'Unknown';

    if (!title || !amount || !business) {
      return res.status(400).json({ message: 'Title, amount, and business are required' });
    }

    const ckkincome = new CKKIncome({
      title,
      amount,
      username,
      business, // <-- store selected business
      category: category || 'General',
      date: date || new Date(),
      notes: notes || '',
    });

    await ckkincome.save();
    res.status(201).json(ckkincome);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all incomes (optionally filter by business)
const getCKKIncomes = async (req, res) => {
  try {
    const { business } = req.query;

    const filter = business ? { business } : {};

    const ckkincomes = await CKKIncome.find(filter).sort({ date: -1 });
    res.status(200).json(ckkincomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCKKIncome,
  getCKKIncomes,
};
