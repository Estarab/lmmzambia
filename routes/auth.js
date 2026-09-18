const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = 'abnation'; // Use env vars in production

// Signup route
router.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed, role });

  await user.save();
  res.status(201).json({ message: 'User created' });
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: '1d'
  });

  res.json({ token, role: user.role });
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user info from token payload
    next();
  });
};

// Get current logged-in user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



// const express = require('express');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const router = express.Router();
// const JWT_SECRET = 'abnation'; // Use env vars in production

// // Signup route
// router.post('/signup', async (req, res) => {
//   const { username, password, role } = req.body;

//   if (!username || !password || !role) {
//     return res.status(400).json({ message: 'All fields required' });
//   }

//   const existing = await User.findOne({ username });
//   if (existing) {
//     return res.status(409).json({ message: 'User already exists' });
//   }

//   const hashed = await bcrypt.hash(password, 10);
//   const user = new User({ username, password: hashed, role });

//   await user.save();
//   res.status(201).json({ message: 'User created' });
// });

// // Login route
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const user = await User.findOne({ username });

//   if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) return res.status(401).json({ message: 'Invalid credentials' });

//   const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
//     expiresIn: '1d'
//   });

//   res.json({ token, role: user.role });
// });

// module.exports = router;
