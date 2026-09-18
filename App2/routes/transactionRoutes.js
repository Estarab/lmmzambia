const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const router = express.Router();

// POST: Create a transaction (sale)
router.post('/', async (req, res) => {
  try {
    const { items, paymentMethod, amountReceived, username } = req.body;

     if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in transaction' });
    }

    let total = 0;

    // Validate stock availability
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });

      if (product.stockKg < item.qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${product.stockKg} kg`,
        });
      }
    }

    // Deduct stock and calculate total
    for (let item of items) {
      const product = await Product.findById(item.productId);
      product.stockKg -= item.qty;
      await product.save();

      total += item.qty * product.pricePerKg;
    }

    // Create transaction
    const transaction = new Transaction({
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty,
        unitPrice: i.pricePerKg,
        total: i.qty * i.pricePerKg,
      })),
      total,
      paymentMethod,
      amountReceived,
      change: amountReceived - total,
      username, 
      date: new Date(),
    });

    await transaction.save();
    res.status(201).json(transaction);

  } catch (err) {
    console.error('Transaction error:', err);
    res.status(500).json({ message: 'Failed to process transaction' });
  }
});

// GET: All transactions (for daily report)
router.get('/', async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ date: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

module.exports = router;




// const express = require('express');
// const Transaction = require('../models/Transaction');
// const Product = require('../models/Product');
// const router = express.Router();

// // POST: Create a transaction (sale)
// router.post('/', async (req, res) => {
//   try {
//     const { items, paymentMethod, amountReceived } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({ message: 'No items in transaction' });
//     }

//     let total = 0;

//     // Validate stock availability
//     for (let item of items) {
//       const product = await Product.findById(item.productId);
//       if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });

//       if (product.stockKg < item.quantityKg) {
//         return res.status(400).json({
//           message: `Not enough stock for ${product.name}. Available: ${product.stockKg} kg`,
//         });
//       }
//     }

//     // Deduct stock and calculate total
//     for (let item of items) {
//       const product = await Product.findById(item.productId);
//       product.stockKg -= item.quantityKg;
//       await product.save();

//       total += item.quantityKg * product.pricePerKg;
//     }

//     // Create transaction
//     const transaction = new Transaction({
//       items: items.map(i => ({
//         name: i.name,
//         quantityKg: i.quantityKg,
//         pricePerKg: i.pricePerKg,
//         total: i.quantityKg * i.pricePerKg
//       })),
//       total,
//       paymentMethod,
//       amountReceived,
//       changeGiven: amountReceived - total,
//       createdAt: new Date(),
//     });

//     await transaction.save();
//     res.status(201).json(transaction);

//   } catch (err) {
//     console.error('Transaction error:', err);
//     res.status(500).json({ message: 'Failed to process transaction' });
//   }
// });

// // GET: All transactions (for daily report)
// router.get('/', async (req, res) => {
//   try {
//     const txs = await Transaction.find().sort({ createdAt: -1 });
//     res.json(txs);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch transactions' });
//   }
// });

// module.exports = router;





// const express = require('express');
// const Transaction = require('../models/Transaction');
// const Product = require('../models/Product');
// const router = express.Router();

// router.post('/', async (req, res) => {
//   const { items } = req.body;

//   let total = 0;

//   for (let item of items) {
//     const product = await Product.findById(item.productId);
//     product.stockKg -= item.quantityKg;
//     await product.save();

//     total += item.quantityKg * product.pricePerKg;
//   }

//   const transaction = new Transaction({
//     items: items.map(i => ({
//       name: i.name,
//       quantityKg: i.quantityKg,
//       pricePerKg: i.pricePerKg,
//       total: i.quantityKg * i.pricePerKg
//     })),
//     total
//   });

//   await transaction.save();
//   res.json(transaction);
// });

// router.get('/', async (req, res) => {
//   const txs = await Transaction.find();
//   res.json(txs);
// });

// module.exports = router;
