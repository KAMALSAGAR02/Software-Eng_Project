const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: String,
  severity: String,
  source_ip: String,
  destination_ip: String,
  timestamp: Number,
  details: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
