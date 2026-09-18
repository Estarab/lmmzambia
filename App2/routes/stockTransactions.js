// routes/stockTransactions.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockTransactionController');

router.post('/', ctrl.create);
router.get('/', ctrl.list);

module.exports = router;
