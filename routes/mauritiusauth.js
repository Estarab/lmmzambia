// routes/mauritiusauth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MauritiusUser = require('../models/MauritiusUser');

const router = express.Router();
const JWT_SECRET = 'abnation'; // Use environment variable in production

// =======================
// Signup route
// =======================
router.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const existing = await MauritiusUser.findOne({ username });
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const mauritiususer = new MauritiusUser({ username, password: hashed, role });

  await mauritiususer.save();
  res.status(201).json({ message: 'User created' });
});

// =======================
// Login route
// =======================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const mauritiususer = await MauritiusUser.findOne({ username });

  if (!mauritiususer)
    return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, mauritiususer.password);
  if (!match)
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: mauritiususer._id, role: mauritiususer.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: mauritiususer.role });
});

// =======================
// Middleware: Authenticate JWT
// =======================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, mauritiususer) => {
    if (err) return res.sendStatus(403);
    req.mauritiususer = mauritiususer; // user info from token payload
    next();
  });
};

// =======================
// Get current logged-in user
// =======================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const mauritiususer = await MauritiusUser.findById(req.mauritiususer.id).select('-password');
    if (!mauritiususer)
      return res.status(404).json({ message: 'User not found' });
    res.json(mauritiususer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// Dashboard route (protected)
// =======================
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.mauritiususer.id;
    const role = req.mauritiususer.role;

    const user = await MauritiusUser.findById(userId).select('-password');

    res.json({
      message: 'Dashboard data fetched successfully',
      userId,
      role,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



// const express = require('express');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const MauritiusUser = require('../models/MauritiusUser');

// const router = express.Router();
// const JWT_SECRET = 'abnation'; // Use env vars in production

// // Signup route
// router.post('/signup', async (req, res) => {
//   const { username, password, role } = req.body;

//   if (!username || !password || !role) {
//     return res.status(400).json({ message: 'All fields required' });
//   }

//   const existing = await MauritiusUser.findOne({ username });
//   if (existing) {
//     return res.status(409).json({ message: 'User already exists' });
//   }

//   const hashed = await bcrypt.hash(password, 10);
//   const mauritiususer = new MauritiusUser({ username, password: hashed, role });

//   await mauritiususer.save();
//   res.status(201).json({ message: 'User created' });
// });

// // Login route
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const mauritiususer = await MauritiusUser.findOne({ username });

//   if (!mauritiususer) return res.status(401).json({ message: 'Invalid credentials' });

//   const match = await bcrypt.compare(password, mauritiususer.password);
//   if (!match) return res.status(401).json({ message: 'Invalid credentials' });

//   const token = jwt.sign({ id: mauritiususer._id, role: mauritiususer.role }, JWT_SECRET, {
//     expiresIn: '1d'
//   });

//   res.json({ token, role: mauritiususer.role });
// });

// // Middleware to authenticate token
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer token

//   if (!token) return res.sendStatus(401);

//   jwt.verify(token, JWT_SECRET, (err, mauritiususer) => {
//     if (err) return res.sendStatus(403);
//     req.mauritiususer = mauritiususer; // user info from token payload
//     next();
//   });
// };

// // Get current logged-in user info
// router.get('/me', authenticateToken, async (req, res) => {
//   try {
//     const mauritiususer = await MauritiusUser.findById(req.mauritiususer.id).select('-password');
//     if (!mauritiususer) return res.status(404).json({ message: 'User not found' });
//     res.json(mauritiususer);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;