import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import os

def generate_synthetic_data(samples=10000):
    """
    Generates a synthetic dataset mimicking the 6 features we extract from PyShark.
    This is for demonstration/minor project purposes until you download the real CICIDS2017 dataset.
    """
    print(f"Generating {samples} synthetic network flow records...")
    np.random.seed(42)
    
    # 0 = Normal, 1 = DoS/DDoS, 2 = Port Scan
    labels = np.random.choice([0, 1, 2], size=samples, p=[0.8, 0.1, 0.1])
    
    data = []
    for label in labels:
        if label == 0: # Normal Traffic
            data.append([
                np.random.randint(40, 1500), # packet_length
                np.random.choice([6, 17]),   # protocol (TCP/UDP)
                np.random.randint(64, 128),  # ttl
                np.random.randint(1024, 65535), # src_port
                np.random.choice([80, 443, 22]), # dst_port
            ])
        elif label == 1: # DoS (High packet volume, specific ports)
            data.append([
                np.random.randint(1000, 1500), 
                6,   
                np.random.randint(30, 60),  
                np.random.randint(1024, 65535), 
                80, 
            ])
        elif label == 2: # Port Scan (Small packets, random high ports)
            data.append([
                np.random.randint(40, 100), 
                6,   
                np.random.randint(60, 100),  
                np.random.randint(1024, 65535), 
                np.random.randint(1, 65535), 
            ])
            
    df = pd.DataFrame(data, columns=['packet_length', 'protocol', 'ttl', 'src_port', 'dst_port'])
    return df, labels

def train_xgboost():
    print("--- Phase 6: XGBoost Model Training ---")
    
    X, y = generate_synthetic_data()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric='mlogloss'
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating Model...")
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, preds, target_names=['Normal', 'DoS', 'Port Scan']))
    
    model_path = os.path.join(os.path.dirname(__file__), 'xgboost_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved successfully to: {model_path}")

if __name__ == "__main__":
    train_xgboost()
