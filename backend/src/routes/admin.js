const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Fetch all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve, Reject, or Change Role
router.put('/users/:id', async (req, res) => {
  const { status, role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin creates user directly (pre-approved)
router.post('/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'User',
      status: 'approved'
    });
    
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;
