const express = require('express');
const Alert = require('../models/Alert');
const router = express.Router();

// Fetch historical alerts with pagination and filtering
router.get('/', async (req, res) => {
  const { limit = 100, skip = 0, severity } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;

  try {
    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
    
    const total = await Alert.countDocuments(filter);
    
    res.json({ alerts, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

module.exports = router;
