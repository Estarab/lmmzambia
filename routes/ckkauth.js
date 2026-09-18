const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CKKUser = require('../models/CKKUser');

const router = express.Router();
const JWT_SECRET = 'abnation'; // Use env vars in production

// Signup route
router.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const existing = await CKKUser.findOne({ username });
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const ckkuser = new CKKUser({ username, password: hashed, role });

  await ckkuser.save();
  res.status(201).json({ message: 'User created' });
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ckkuser = await CKKUser.findOne({ username });

  if (!ckkuser) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, ckkuser.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: ckkuser._id, role: ckkuser.role }, JWT_SECRET, {
    expiresIn: '1d'
  });

  res.json({ token, role: ckkuser.role });
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, ckkuser) => {
    if (err) return res.sendStatus(403);
    req.ckkuser = ckkuser; // user info from token payload
    next();
  });
};

// Get current logged-in user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const ckkuser = await CKKUser.findById(req.ckkuser.id).select('-password');
    if (!ckkuser) return res.status(404).json({ message: 'User not found' });
    res.json(ckkuser);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
