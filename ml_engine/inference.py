import json
import redis
import time
import os

import joblib
import pandas as pd

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

try:
    r = redis.from_url(REDIS_URL)
    r.ping()
    print("Connected to Redis for inference.")
except Exception as e:
    print(f"Redis connection failed: {e}")

def load_models():
    print("Loading ML models...")
    xgb_model = None
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'xgboost_model.pkl')
        xgb_model = joblib.load(model_path)
        print("XGBoost model loaded successfully.")
    except Exception as e:
        print("Could not load XGBoost model (Did you run train_model.py?). Falling back to basic rules.")
    return xgb_model

def run_inference():
    print("Starting ML inference engine...")
    xgb_model = load_models()
    
    while True:
        try:
            item = r.brpop('ml_feature_queue', timeout=1)
            if item:
                queue_name, data = item
                features = json.loads(data)
                
                is_anomaly = False
                alert_type = "None"
                severity = "Low"
                
                # Use ML Model if available
                if xgb_model:
                    # Prepare features in the exact order trained: ['packet_length', 'protocol', 'ttl', 'src_port', 'dst_port']
                    df = pd.DataFrame([{
                        'packet_length': features.get('packet_length', 0),
                        'protocol': features.get('protocol', 6),
                        'ttl': features.get('ttl', 64),
                        'src_port': features.get('src_port', 0),
                        'dst_port': features.get('dst_port', 0)
                    }])
                    
                    prediction = xgb_model.predict(df)[0]
                    if prediction == 1:
                        is_anomaly = True
                        alert_type = "DoS Attack Detected (ML)"
                        severity = "Critical"
                    elif prediction == 2:
                        is_anomaly = True
                        alert_type = "Port Scan Detected (ML)"
                        severity = "High"
                else:
                    # Fallback Rule-based logic
                    if features.get('packet_length', 0) > 1500:
                        is_anomaly = True
                        alert_type = "Large Packet Anomaly (Rule)"
                        severity = "High"
                
                if is_anomaly:
                    alert = {
                        "type": alert_type,
                        "source_ip": features.get('src_ip', 'Unknown'),
                        "destination_ip": features.get('dst_ip', 'Unknown'),
                        "severity": severity,
                        "timestamp": time.time(),
                        "details": features
                    }
                    r.publish('siem_alerts', json.dumps(alert))
                    print(f"Alert generated: {alert['type']} from {alert['source_ip']}")

        except Exception as e:
            time.sleep(1)

if __name__ == "__main__":
    run_inference()
