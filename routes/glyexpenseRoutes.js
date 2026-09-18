const express = require('express');
const { createGlyExpense, getGlyExpenses } = require('../controllers/glyexpenseController');

const router = express.Router();

router.post('/', createGlyExpense);
router.get('/', getGlyExpenses);

module.exports = router;
