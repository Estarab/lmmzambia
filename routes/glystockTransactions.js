// routes/stockTransactions.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/glystockTransactionController');

router.post('/', ctrl.create);
router.get('/', ctrl.list);

module.exports = router;
