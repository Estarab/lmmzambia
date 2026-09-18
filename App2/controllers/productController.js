const Product = require('../app2models/Product');
const StockTransaction = require('../models/StockTransaction');
const ReprocessLog = require('../models/ReprocessLog'); 


// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// GET product by barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ code: req.params.code });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product by barcode' });
  }
};

// CREATE or update product
exports.createProduct = async (req, res) => {
  try {
    const { name, pricePerKg, stockKg, code, stockType } = req.body;

    if (!name || pricePerKg == null || stockKg == null || !code) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Product.findOne({ code });

    if (existing) {
      if (stockType === 'new') {
        existing.stockKg += stockKg;
      } else if (stockType === 'returned') {
        existing.stockreturnKg = (existing.stockreturnKg || 0) + stockKg;
      }

      existing.pricePerKg = pricePerKg;
      await existing.save();

      await StockTransaction.create({
        productId: existing._id,
        type: stockType === 'new' ? 'Products-Received' : 'Products-Returned',
        quantity: stockKg,
        pricePerKg,
        date: new Date(),
      });

      return res.status(200).json({ message: 'Product updated', product: existing });
    }

    // Create new product
    const newProduct = new Product({
      name,
      code,
      pricePerKg,
      stockKg: stockType === 'new' ? stockKg : 0,
      stockreturnKg: stockType === 'returned' ? stockKg : 0,
    });

    await newProduct.save();

    await StockTransaction.create({
      productId: newProduct._id,
      type: stockType === 'new' ? 'Products-Received' : 'Products-Returned',
      quantity: stockKg,
      pricePerKg,
      date: new Date(),
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// UPDATE product by ID
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pricePerKg, stockKg, code } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (name != null) product.name = name;
    if (pricePerKg != null) product.pricePerKg = pricePerKg;
    if (stockKg != null) product.stockKg = stockKg;
    if (code != null) product.code = code;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// DELETE product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// RETURN stock (move from stockKg to stockreturnKg) with note
exports.returnStock = async (req, res) => {
  try {
    const { code, returnAmount, note } = req.body;

    if (!code || returnAmount == null) {
      return res.status(400).json({ message: 'Product code and return amount are required' });
    }

    const product = await Product.findOne({ code });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stockKg < returnAmount) return res.status(400).json({ message: 'Not enough stock to return' });

    product.stockKg -= returnAmount;
    product.stockreturnKg = (product.stockreturnKg || 0) + returnAmount;

    // Append the note onto the product for history
    if (note) {
      const timestamp = new Date().toLocaleString();
      product.notes = product.notes
        ? `${product.notes}\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`;
    }

    await product.save();

    await StockTransaction.create({
      productId: product._id,
      type: 'Products-Returned',
      quantity: returnAmount,
      date: new Date(),
      note: note || '',
    });

    res.json({ message: 'Stock returned successfully', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to return stock' });
  }
};

// RECORD returned stock back into stockKg (for processed items)
exports.recordReturnedStock = async (req, res) => {
  try {
    const { code, stockKg } = req.body;

    if (!code || stockKg == null) return res.status(400).json({ message: 'Code and stock amount are required' });

    const product = await Product.findOne({ code });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stockreturnKg < stockKg) return res.status(400).json({ message: 'Not enough returned stock to re-add' });

    product.stockKg += stockKg;
    product.stockreturnKg -= stockKg;

    await product.save();

    await StockTransaction.create({
      productId: product._id,
      type: 'Returned-Products-Received',
      quantity: stockKg,
      date: new Date(),
    });

    res.json({ message: 'Returned stock recorded successfully', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record returned stock' });
  }
};

// REPROCESS returned stock into a different product

exports.reprocessStock = async (req, res) => {
  const { fromCode, toCode, amount } = req.body;

  try {
    const fromProduct = await Product.findOne({ code: fromCode });
    const toProduct = await Product.findOne({ code: toCode });

    if (!fromProduct || !toProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if ((fromProduct.stockreturnKg || 0) < amount) {
      return res.status(400).json({ message: 'Insufficient returned stock to reprocess' });
    }

    fromProduct.stockreturnKg -= amount;
    await fromProduct.save();

    toProduct.stockKg += amount;
    await toProduct.save();

    // Save reprocess log
    await ReprocessLog.create({ fromCode, toCode, amount });

    res.json({ message: 'Stock reprocessed and logged successfully', fromProduct, toProduct });
  } catch (err) {
    console.error('Reprocess error:', err);
    res.status(500).json({ message: 'Server error during reprocessing' });
  }
};




// GET transactions with optional date filters + server-side pagination + type filter
exports.getTransactions = async (req, res) => {
  const { start, end, page = 1, limit = 30, type } = req.query;
  const filter = {};

  if (start) filter.date = { $gte: new Date(start) };
  if (end) {
    filter.date = filter.date || {};
    filter.date.$lte = new Date(end);
  }
  if (type && type !== 'All') filter.type = type;

  try {
    const totalRecords = await StockTransaction.countDocuments(filter);

    const transactions = await StockTransaction.find(filter)
      .populate('productId', 'name code pricePerKg')
      .sort({ date: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      transactions,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};


exports.reprocessStock = async (req, res) => {
  const { fromCode, toCode, amount } = req.body;

  try {
    const fromProduct = await Product.findOne({ code: fromCode });
    const toProduct = await Product.findOne({ code: toCode });

    if (!fromProduct || !toProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (fromProduct.stockKg < amount) {
      return res.status(400).json({ message: 'Insufficient stock to reprocess' });
    }

    // Deduct from source
    fromProduct.stockKg -= amount;
    await fromProduct.save();

    // Add to target
    toProduct.stockKg += amount;
    await toProduct.save();

    // Save reprocess log
    await ReprocessLog.create({ fromCode, toCode, amount });

    res.json({ message: 'Stock reprocessed and logged successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during reprocessing' });
  }
};

exports.getReprocessLogs = async (req, res) => {
  try {
    const logs = await ReprocessLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Failed to fetch reprocess logs:', err);
    res.status(500).json({ message: 'Failed to fetch reprocess logs' });
  }
};




// import React, { useState } from 'react';
// import { View, TextInput, Button, StyleSheet, Text, Modal, Platform, Alert } from 'react-native';
// import { Picker } from '@react-native-picker/picker';

// export default function ProductForm({ onSubmit, initialValues, onActionComplete }) {
//   const safeValues = initialValues || {};
//   const [name, setName] = useState(safeValues.name || '');
//   const [code, setCode] = useState(safeValues.code || '');
//   const [pricePerKg, setPricePerKg] = useState(safeValues.pricePerKg !== undefined ? String(safeValues.pricePerKg) : '');
//   const [stockKg, setStockKg] = useState(safeValues.stockKg !== undefined ? String(safeValues.stockKg) : '');
//   const [stockType, setStockType] = useState('new'); // 'new' or 'returned'

//   const [returnModalVisible, setReturnModalVisible] = useState(false);
//   const [returnAmount, setReturnAmount] = useState('');
//   const [returnNote, setReturnNote] = useState('');

//   const [reprocessModalVisible, setReprocessModalVisible] = useState(false);
//   const [fromCode, setFromCode] = useState('');
//   const [toCode, setToCode] = useState('');
//   const [reprocessAmount, setReprocessAmount] = useState('');

//   const API = 'https://butcherypos300725.onrender.com/api';

//   const safeRefresh = () => {
//     if (typeof onActionComplete === 'function') onActionComplete();
//   };

//   const handleSubmit = async () => {
//     if (!name || !code || !pricePerKg || !stockKg) {
//       alert('Please fill in all fields');
//       return;
//     }

//     if (stockType === 'returned') {
//       try {
//         const response = await fetch(`${API}/products/record-returned`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ code: code.trim(), stockKg: parseFloat(stockKg) }),
//         });

//         const data = await response.json();
//         if (!response.ok) {
//           alert(data.message || 'Failed to record returned stock');
//           return;
//         }
//         alert('Returned stock recorded successfully');
//         safeRefresh();
//       } catch (error) {
//         console.error('Error recording returned stock:', error);
//         alert('Error recording returned stock');
//       }
//     } else {
//       await onSubmit({
//         name,
//         code,
//         pricePerKg: parseFloat(pricePerKg),
//         stockKg: parseFloat(stockKg),
//         stockType,
//       });
//       safeRefresh();
//     }

//     setName('');
//     setCode('');
//     setPricePerKg('');
//     setStockKg('');
//     setStockType('new');
//   };

//   const handleReturnStock = async () => {
//     if (!code || !returnAmount) {
//       alert('Please enter product code and return amount');
//       return;
//     }

//     try {
//       const response = await fetch(`${API}/products/return`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           code: code.trim(),
//           returnAmount: parseFloat(returnAmount),
//           note: returnNote.trim(),
//         }),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         alert(data.message || 'Failed to return stock');
//       } else {
//         alert('Stock returned successfully');
//         setReturnModalVisible(false);
//         setReturnAmount('');
//         setReturnNote('');
//         setCode('');
//         safeRefresh();
//       }
//     } catch (error) {
//       console.error('Error returning stock:', error);
//       alert('Error returning stock');
//     }
//   };

//   const handleReprocessStock = async () => {
//     if (!fromCode || !toCode || !reprocessAmount) {
//       alert('Please fill in all fields for reprocessing');
//       return;
//     }

//     try {
//       const response = await fetch(`${API}/products/reprocess`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           fromCode: fromCode.trim(),
//           toCode: toCode.trim(),
//           amount: parseFloat(reprocessAmount),
//         }),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         alert(data.message || 'Failed to reprocess stock');
//       } else {
//         alert('Stock reprocessed successfully');
//         setReprocessModalVisible(false);
//         setFromCode('');
//         setToCode('');
//         setReprocessAmount('');
//         safeRefresh();
//       }
//     } catch (error) {
//       console.error('Error reprocessing stock:', error);
//       alert('Error reprocessing stock');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Add Product</Text>

//       {/* Product Form */}
//       <View style={styles.row}>
//         <View style={styles.inputWrapper}>
//           <Text>Product Name</Text>
//           <TextInput value={name} onChangeText={setName} placeholder="Product Name" style={styles.input} />
//         </View>
//         <View style={styles.inputWrapper}>
//           <Text>Product Code</Text>
//           <TextInput value={code} onChangeText={setCode} placeholder="Product Code" style={styles.input} />
//         </View>
//         <View style={styles.inputWrapper}>
//           <Text>Price</Text>
//           <TextInput value={pricePerKg} onChangeText={setPricePerKg} keyboardType="numeric" placeholder="Price per unit" style={styles.input} />
//         </View>
//       </View>

//       <View style={styles.row}>
//         <View style={styles.inputWrapper}>
//           <Text>Stock (kg)</Text>
//           <TextInput value={stockKg} onChangeText={setStockKg} keyboardType="numeric" placeholder="Stock (kg)" style={styles.input} />
//         </View>
//         <View style={styles.inputWrapper}>
//           <Text>Stock Type</Text>
//           <Picker selectedValue={stockType} onValueChange={setStockType} style={styles.picker}>
//             <Picker.Item label="New Stock Received" value="new" />
//             <Picker.Item label="Returned Stock Received" value="returned" />
//           </Picker>
//         </View>
//         <View style={styles.inputWrapper} />
//       </View>

//       <Button title="Save Product" onPress={handleSubmit} color="#5C4033" />

//       {/* Return Stock Button */}
//       <View style={{ marginTop: 20 }}>
//         <Button title="Return Stock" onPress={() => setReturnModalVisible(true)} color="red" />
//       </View>

//       {/* Reprocess Stock Button */}
//       <View style={{ marginTop: 20 }}>
//         <Button title="Reprocess Returned Stock" onPress={() => setReprocessModalVisible(true)} color="orange" />
//       </View>

//       {/* Return Stock Modal */}
//       <Modal visible={returnModalVisible} animationType="slide" onRequestClose={() => setReturnModalVisible(false)}>
//         <View style={styles.modalContainer}>
//           <Text style={styles.title}>Return Stock</Text>
//           <Text>Product Code</Text>
//           <TextInput value={code} onChangeText={setCode} placeholder="Product Code" style={styles.input} />
//           <Text>Quantity to Return (kg)</Text>
//           <TextInput value={returnAmount} onChangeText={setReturnAmount} placeholder="Return Amount" keyboardType="numeric" style={styles.input} />
//           <Text>Reason for Return</Text>
//           <TextInput
//             value={returnNote}
//             onChangeText={setReturnNote}
//             placeholder="e.g. Damaged, expired, customer return..."
//             style={styles.input}
//           />
//           <Button title="Submit Return" onPress={handleReturnStock} color="red" />
//           <View style={{ marginTop: 10 }}>
//             <Button title="Cancel" onPress={() => { setReturnModalVisible(false); setReturnNote(''); }} />
//           </View>
//         </View>
//       </Modal>

//       {/* Reprocess Stock Modal */}
//       <Modal visible={reprocessModalVisible} animationType="slide" onRequestClose={() => setReprocessModalVisible(false)}>
//         <View style={styles.modalContainer}>
//           <Text style={styles.title}>Reprocess Returned Stock</Text>
//           <Text>From Product Code</Text>
//           <TextInput value={fromCode} onChangeText={setFromCode} placeholder="Source Product Code" style={styles.input} />
//           <Text>To Product Code</Text>
//           <TextInput value={toCode} onChangeText={setToCode} placeholder="Target Product Code" style={styles.input} />
//           <Text>Amount (kg)</Text>
//           <TextInput value={reprocessAmount} onChangeText={setReprocessAmount} placeholder="Amount to reprocess" keyboardType="numeric" style={styles.input} />
//           <Button title="Submit Reprocess" onPress={handleReprocessStock} color="orange" />
//           <View style={{ marginTop: 10 }}>
//             <Button title="Cancel" onPress={() => setReprocessModalVisible(false)} />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { marginVertical: 10, paddingHorizontal: 20, paddingVertical: 10 },
//   title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold', color: '#5C4033' },
//   input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5, borderRadius: 6 },
//   picker: { marginVertical: 5, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: Platform.OS === 'web' ? 10 : 0 },
//   modalContainer: { flex: 1, padding: 20, justifyContent: 'center' },
//   row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 5 },
//   inputWrapper: { flexBasis: '30%', minWidth: '30%', marginVertical: 5 },
// });




