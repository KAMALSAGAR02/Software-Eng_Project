# CyberShield SIEM Architecture

Below is the complete system architecture flowchart demonstrating the data flow between the Frontend, Node.js Backend API, the Python Machine Learning engine, and all external endpoints.

```mermaid
graph TD
    %% Styles
    classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff,stroke-width:2px,rx:10px,ry:10px;
    classDef backend fill:#10b981,stroke:#047857,color:#fff,stroke-width:2px,rx:10px,ry:10px;
    classDef database fill:#f59e0b,stroke:#b45309,color:#fff,stroke-width:2px,rx:10px,ry:10px;
    classDef ml fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px,rx:10px,ry:10px;
    classDef external fill:#ef4444,stroke:#b91c1c,color:#fff,stroke-width:2px,rx:10px,ry:10px;
    classDef queue fill:#f43f5e,stroke:#be123c,color:#fff,stroke-width:2px;

    %% Frontend
    subgraph "Frontend Client (React)"
        UI_Dash[Dashboard & Visualizations]:::frontend
        UI_Scan[Threat Intel Scanner]:::frontend
    end

    %% Backend
    subgraph "Backend Node.js API Endpoints"
        API_Main[Express Server]:::backend
        API_Auth[/api/auth]:::backend
        API_Scan[/api/scan]:::backend
        API_Hist[/api/history]:::backend
    end

    %% ML Engine
    subgraph "Python Detection Engine"
        Py_Sniff[Packet Sniffer / pyshark]:::ml
        Py_Inf[Inference Engine]:::ml
        Py_Model[(ML Predictive Model)]:::ml
    end

    %% Brokers
    subgraph "Upstash Redis Message Broker"
        Redis_Queue[Queue: ml_feature_queue]:::queue
        Redis_PubSub[Pub/Sub: siem_alerts]:::queue
    end

    %% Database
    subgraph "Persistent Storage"
        MongoDB[(MongoDB Atlas)]:::database
    end

    %% External
    subgraph "External Endpoints"
        VT_API[VirusTotal API]:::external
        TG_API[Telegram Bot API]:::external
    end

    %% Flow: Frontend to Backend
    UI_Scan -->|HTTP POST| API_Scan
    UI_Dash -->|WebSockets| API_Main
    API_Scan -->|Query URL/Hash| VT_API

    %% Flow: ML Engine
    Py_Sniff -->|Extract Packet Features| Redis_Queue
    Redis_Queue -->|Consume Features| Py_Inf
    Py_Inf <-->|Predict Anomaly| Py_Model
    Py_Inf -->|Publish High/Critical Alert| Redis_PubSub

    %% Flow: Backend Processing
    Redis_PubSub -->|Subscribe| API_Main
    API_Main -->|Store Historical Data| MongoDB
    API_Main -->|Push Real-time UI Alert| UI_Dash
    API_Main -->|Trigger Admin Notification| TG_API

```

## Endpoint Overview
- **`/api/scan`**: Receives URLs/Hashes from the frontend and fetches threat intelligence from the VirusTotal API.
- **`/api/auth`**: Handles User/Admin registration and authentication via JWT.
- **`/api/history`**: Retrieves paginated historical threat data from MongoDB.
- **`/api/admin`**: Manages user roles and system administration.

## ML Pipeline
1. `sniffer.py` captures live network packets, extracts key features (packet length, protocol, ports).
2. Features are buffered into **Upstash Redis**.
3. `inference.py` pulls features, runs them through the `.pkl` Predictive Model, and publishes anomalies as JSON back to Redis.
4. The Node.js backend broadcasts these anomalies to the frontend via WebSockets and to administrators via Telegram.
