const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const historyRoutes = require('./routes/history');

const Alert = require('./models/Alert');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json());

const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB Connection & Seeding
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas!');
    
    // Auto-seed the SuperAdmin (Kamal)
    try {
      const adminExists = await User.findOne({ username: 'Kamal' });
      if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!', salt);
        await User.create({
          username: 'Kamal',
          password: hashedPassword,
          role: 'Admin',
          status: 'approved'
        });
        console.log('SuperAdmin Kamal seeded successfully.');
      }
    } catch (error) {
      console.error('Failed to seed SuperAdmin:', error);
    }
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);

// Health Check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'success' }));

// --- Phase 3 & 7: Advanced Threat Scanner (VirusTotal) ---
const scanVirusTotal = async (endpoint, payload, type) => {
  const headers = {
    'x-apikey': process.env.VT_API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  
  try {
    let analysisId;
    
    if (type === 'url') {
      const base64Url = Buffer.from(payload).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      try {
        const reportRes = await axios.get(`https://www.virustotal.com/api/v3/urls/${base64Url}`, { headers });
        return reportRes.data.data.attributes.last_analysis_stats;
      } catch (e) {
        if (e.response && e.response.status === 404) {
          const params = new URLSearchParams();
          params.append('url', payload);
          const submitRes = await axios.post(`https://www.virustotal.com/api/v3/urls`, params, { headers });
          analysisId = submitRes.data.data.id;
          
          let reportRes;
          let status = 'queued';
          for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 3000));
            reportRes = await axios.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, { headers });
            status = reportRes.data.data.attributes.status;
            if (status === 'completed') {
              return reportRes.data.data.attributes.stats;
            }
          }
          return reportRes.data.data.attributes.stats;
        } else {
          throw e;
        }
      }
    } else if (type === 'ip') {
      const res = await axios.get(`https://www.virustotal.com/api/v3/ip_addresses/${payload}`, { headers });
      return res.data.data.attributes.last_analysis_stats;
    } else if (type === 'hash') {
      const res = await axios.get(`https://www.virustotal.com/api/v3/files/${payload}`, { headers });
      return res.data.data.attributes.last_analysis_stats;
    }
  } catch (error) {
    throw error;
  }
};

app.post('/api/scan', async (req, res) => {
  const { type, payload } = req.body; // type: 'url', 'ip', or 'hash'
  if (!payload || !type) return res.status(400).json({ error: 'Type and payload required' });

  try {
    const stats = await scanVirusTotal(type, payload, type);
    res.status(200).json({
      target: payload,
      type,
      stats: stats,
      risk_score: stats.malicious > 0 ? 'High' : (stats.suspicious > 0 ? 'Medium' : 'Low')
    });
  } catch (error) {
    console.error('VT API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: `Failed to scan ${type}.` });
  }
});


// --- Phase 4 & 5: Real-time Redis Engine & Notifications ---
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

const { createClient } = require('redis');
const { sendTelegramAlert, sendEmailAlert } = require('./services/notifier');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error', err));

const startRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Upstash Redis for live alerts!');
    
    await redisClient.subscribe('siem_alerts', async (message) => {
      try {
        const alertData = JSON.parse(message);
        
        // 1. Push to WebSockets
        io.emit('new_alert', alertData);
        
        // 2. Telegram Alert
        sendTelegramAlert(alertData);
        
        // 3. Simulated Email Alert via Console
        sendEmailAlert(alertData);
        
        // 4. Save to MongoDB for Historical Analysis
        await Alert.create({
          type: alertData.type,
          severity: alertData.severity,
          source_ip: alertData.source_ip,
          destination_ip: alertData.destination_ip,
          timestamp: alertData.timestamp,
          details: alertData.details
        });
        
      } catch (err) {
        console.error('Failed to parse/save Redis alert', err);
      }
    });
  } catch (err) {
    console.error('Redis Connection Failed:', err);
  }
};

startRedis();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
