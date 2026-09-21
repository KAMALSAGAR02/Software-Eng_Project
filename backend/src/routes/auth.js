const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'User',
      status: 'pending' // ALWAYS pending for normal reg
    });
    await newUser.save();
    
    // We do NOT log them in automatically anymore.
    res.status(201).json({ message: 'Registration successful! Please wait for Admin approval.' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Account pending Admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Account access has been rejected.' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token, username: user.username, role: user.role });

  } catch (err) {
    console.error('Login error:', err.message);
    // Return a detailed error message for easier debugging (e.g., MongoDB IP whitelist issue)
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
