const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// const productRoutes = require('./routes/productRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const glytransactionRoutes = require('./routes/glytransactionRoutes');
const authRoutes = require('./routes/auth');
const ckkauthRoutes = require('./routes/ckkauth');
const salesRoutes = require('./routes/sales');
const stockTxRoutes = require('./routes/stockTransactions');
const glystockTxRoutes = require('./routes/glystockTransactions');
const expenseRoutes = require('./routes/expenseRoutes'); 
const glyexpenseRoutes = require('./routes/glyexpenseRoutes'); 
const ckkexpenseRoutes = require('./routes/ckkexpenseRoutes'); 
const ckkincomeRoutes = require('./routes/ckkincomeRoutes');
const productionProductRoutes = require('./routes/productionProductRoutes');

const registrationRoutes = require("./routes/registrationRoutes");

const mauritiusAuthRoutes = require('./routes/mauritiusauth');



const ecommerceUserRoutes = require('./routes/ecommerce/EUserRoutes');
const ecommerceAdminRoutes = require('./routes/ecommerce/EAdminRoutes');

const ecommerceProductRoutes = require('./routes/ecommerce/EProductRoutes');




// const businessRoutes  = require('./routes/businessRoutes.js');



const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));





app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/glytransactions', glytransactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ckkauth', ckkauthRoutes);
app.use('/api/sales', salesRoutes);


app.use('/api/stock-transactions', stockTxRoutes);
app.use('/api/glystock-transactions', glystockTxRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/glyexpenses', glyexpenseRoutes);
app.use('/api/ckkexpenses', ckkexpenseRoutes);
app.use('/api/ckkincomes', ckkincomeRoutes);



app.use('/api/production-products', productionProductRoutes);



// E-commerce API routes
app.use('/api/ecommerce/users', ecommerceUserRoutes);
app.use('/api/ecommerce/admins', ecommerceAdminRoutes);

app.use('/api/ecommerce/products', ecommerceProductRoutes);


app.use("/api/registrations", registrationRoutes);
app.use('/api/mauritius/auth', mauritiusAuthRoutes);





// app.use('/api/businesses', businessRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
