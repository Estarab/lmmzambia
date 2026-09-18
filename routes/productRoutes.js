const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  returnStock, 
  recordReturnedStock,
  reprocessStock,
   getTransactions ,
   getReprocessLogs

} = require('../controllers/productController');



// GET /api/products - get all products
router.get('/', getProducts);

// GET /api/products/barcode/:code - get product by barcode
router.get('/barcode/:code', getProductByBarcode); // ⬅️ Add this line

// POST /api/products - create new product
router.post('/', createProduct);

// 🔁 Return stock route
router.post('/return', returnStock);

router.post('/record-returned', recordReturnedStock);

// 🔄 Reprocess returned stock into another product
router.post('/reprocess', reprocessStock);

router.get('/reprocess-logs', getReprocessLogs);



// GET /api/products/transactions - get stock transactions with optional date filters
router.get('/transactions', getTransactions);  // <-- new endpoint



// PUT /api/products/:id - update a product
router.put('/:id', updateProduct);

// DELETE /api/products/:id - delete a product
router.delete('/:id', deleteProduct);

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const {
//   getProducts,
//   createProduct,
//   updateProduct,
//   deleteProduct,
// } = require('../controllers/productController');

// // GET /api/products - get all products
// router.get('/', getProducts);

// // POST /api/products - create new product
// router.post('/', createProduct);

// // PUT /api/products/:id - update a product
// router.put('/:id', updateProduct);

// // DELETE /api/products/:id - delete a product
// router.delete('/:id', deleteProduct);

// module.exports = router;






