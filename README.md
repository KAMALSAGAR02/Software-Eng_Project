# CyberShield: Advanced Threat Detection SIEM

CyberShield is a comprehensive Security Information and Event Management (SIEM) platform that combines real-time network traffic analysis, Machine Learning anomaly detection, and automated threat mitigation using Cloudflare and VirusTotal. 

## 🚀 Features

- **Real-Time Network Sniffing**: Captures and processes live network packets using PyShark.
- **Machine Learning Inference**: Detects zero-day anomalies, DoS attacks, and Port Scans using a trained XGBoost model.
- **Live Threat Dashboard**: Visualizes incoming threats, packet volumes, and severities in real-time using WebSockets and Recharts.
- **Automated Mitigation**: Integrates with the Cloudflare API to apply instant IP blocks and WAF rules straight from the dashboard.
- **VirusTotal Scanner**: Built-in OSINT scanner to verify URLs, IPs, and file hashes against global threat databases.
- **Alert Notifications**: Pushes critical threat alerts directly to administrators via Telegram.

## 🏗️ Architecture

The platform is split into three main microservices:

1. **Frontend (`/frontend`)**: 
   - Built with React, Vite, TailwindCSS, and Lucide React.
   - Provides the Analyst Dashboard, Admin Panel, Historical Data Analyzer, and Threat Scanner.
2. **Backend (`/backend`)**:
   - Built with Node.js, Express, and MongoDB.
   - Handles JWT Authentication, REST APIs, WebSocket broadcasting (`socket.io`), and VirusTotal/Telegram integrations.
3. **ML Engine (`/ml_engine`)**:
   - Built with Python, PyShark, and scikit-learn/XGBoost.
   - `sniffer.py`: Captures raw packets and pushes features to an Upstash Redis queue.
   - `inference.py`: Consumes the queue, runs the XGBoost model, and publishes alerts.

## ⚙️ Prerequisites

- **Node.js** (v16+)
- **Python** (3.8+)
- **Wireshark / TShark** (Required for PyShark packet capture)
- **MongoDB Atlas** Account
- **Upstash Redis** Account
- **Cloudflare** Account with API Token
- **VirusTotal** API Key

## 🛠️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_upstash_redis_url
VT_API_KEY=your_virustotal_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
ADMIN_DEFAULT_PASSWORD=Admin123!
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in `frontend/`:
```env
VITE_CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### 3. ML Engine Setup
```bash
cd ml_engine
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```
Set the Redis URL in your environment before running Python scripts:
```bash
export REDIS_URL="your_upstash_redis_url" # Windows: set REDIS_URL=...
```

## 🚀 Running the Application

You can start the entire stack using the provided batch file (Windows):
```bash
start_siem.bat
```

Alternatively, run each service manually in separate terminals:
1. `npm start` (in `backend/`)
2. `npm run dev` (in `frontend/`)
3. `python sniffer.py` & `python inference.py` (in `ml_engine/`)

## 🛡️ Role-Based Access Control

- **Admin**: Full access. Can configure users, view all dashboards, and resolve Critical/High severity incidents using Cloudflare.
- **Analyst**: Read-only dashboard access. Can only resolve Medium/Low severity incidents.

## 📄 License
MIT License
