import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Sidebar from './Sidebar';
import AdminPanel from './AdminPanel';
import HistoricalData from './HistoricalData';
import ThreatScanner from './ThreatScanner';

function ProtectedRoute({ children, reqRole }) {
  const token = localStorage.getItem('siem_token');
  const role = localStorage.getItem('siem_role');
  
  if (!token) return <Navigate to="/login" replace />;
  if (reqRole && role !== reqRole) return <Navigate to="/dashboard" replace />;
  
  return <Sidebar>{children}</Sidebar>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoricalData /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><ThreatScanner /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute reqRole="Admin"><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
