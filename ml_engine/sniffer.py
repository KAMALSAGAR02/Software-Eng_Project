import pyshark
import json
import redis
import time
import os

# Configure Redis connection (Upstash Cloud Redis credentials)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

try:
    r = redis.from_url(REDIS_URL)
    r.ping() # test connection
except Exception as e:
    print(f"Redis connection failed: {e}")

def extract_features(packet):
    """
    Extracts the 6 required features for the Minor Project phase.
    Features: Packet Length, Protocol, TTL, TCP Flags, Source Port, Destination Port
    """
    try:
        features = {}
        
        # Packet Length
        features['packet_length'] = int(packet.length)
        
        # Protocol (TCP=6, UDP=17, ICMP=1)
        if hasattr(packet, 'tcp'):
            features['protocol'] = 6
            features['src_port'] = int(packet.tcp.srcport)
            features['dst_port'] = int(packet.tcp.dstport)
            features['tcp_flags'] = str(packet.tcp.flags)
        elif hasattr(packet, 'udp'):
            features['protocol'] = 17
            features['src_port'] = int(packet.udp.srcport)
            features['dst_port'] = int(packet.udp.dstport)
            features['tcp_flags'] = "N/A"
        else:
            features['protocol'] = int(packet.ip.proto) if hasattr(packet, 'ip') else 0
            features['src_port'] = 0
            features['dst_port'] = 0
            features['tcp_flags'] = "N/A"

        # TTL
        if hasattr(packet, 'ip'):
            features['ttl'] = int(packet.ip.ttl)
            features['src_ip'] = packet.ip.src
            features['dst_ip'] = packet.ip.dst
        else:
            features['ttl'] = 0
            features['src_ip'] = "Unknown"
            features['dst_ip'] = "Unknown"

        return features
    except AttributeError:
        # Ignore packets that don't have standard IP headers
        return None

def start_sniffing(interface='Wi-Fi'):
    """
    Starts live packet capture using PyShark and pushes features to Redis.
    """
    print(f"Starting packet capture on interface: {interface}...")
    # Explicitly pass tshark_path to bypass the TSharkNotFoundException bug on Windows
    capture = pyshark.LiveCapture(
        interface=interface, 
        tshark_path=r"C:\Program Files\Wireshark\tshark.exe"
    )
    
    for packet in capture.sniff_continuously():
        features = extract_features(packet)
        if features:
            # Publish to Redis Queue for the ML model to consume
            try:
                r.lpush('ml_feature_queue', json.dumps(features))
                # print(f"Captured & queued: {features['src_ip']} -> {features['dst_ip']} | Length: {features['packet_length']}")
            except Exception as e:
                pass

if __name__ == "__main__":
    # Ensure TShark is installed in your system for PyShark to work.
    start_sniffing()
