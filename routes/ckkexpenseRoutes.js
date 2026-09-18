




const express = require('express');
const { createCKKExpense, getCKKExpenses } = require('../controllers/ckkexpenseController');

const router = express.Router();

router.post('/', createCKKExpense);
router.get('/', getCKKExpenses);

module.exports = router;
