import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/auth';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'User' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, { username: formData.username, password: formData.password });
        localStorage.setItem('siem_token', res.data.token);
        localStorage.setItem('siem_user', res.data.username);
        localStorage.setItem('siem_role', res.data.role);
        navigate('/dashboard');
      } else {
        const res = await axios.post(`${API_URL}/register`, formData);
        setSuccessMsg(res.data.message);
        setIsLogin(true); // Switch back to login view so they can wait
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-slate-950 to-red-900/10 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-4 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CyberShield SIEM</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLogin ? 'Sign in to access the dashboard' : 'Request access to the platform'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type="text" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="analyst_01"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-12 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-blue-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Requested Role</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              >
                <option value="User">User (Basic Access)</option>
                <option value="Analyst">Analyst (Threat Viewer)</option>
                <option value="Admin">Admin (System Manager)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex justify-center mt-4"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'Authenticate' : 'Request Access'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {setIsLogin(!isLogin); setError(''); setSuccessMsg('');}}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Need an account? Register" : "Already have access? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
