const express = require('express');
// const { createIncome, getIncomes } = require('../controllers/incomeController');
const { getCKKIncomes, createCKKIncome } = require('../controllers/ckkincomeController');

const router = express.Router();

// Create income (expects body to include: title, amount, business, username, category, notes)
router.post('/', createCKKIncome);

// Get incomes (optional query param: ?business=BusinessName)
router.get('/', getCKKIncomes);

module.exports = router;