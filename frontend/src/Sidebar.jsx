import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, Users, LogOut, ShieldAlert, Search } from 'lucide-react';

export default function Sidebar({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem('siem_role') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('siem_token');
    localStorage.removeItem('siem_user');
    localStorage.removeItem('siem_role');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Historical Data', path: '/history', icon: History },
    { name: 'Threat Scanner', path: '/scanner', icon: Search }
  ];

  if (role === 'Admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: Users });
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-blue-500 w-6 h-6" />
            CyberShield
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">{role} PORTAL</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        {children}
      </div>

    </div>
  );
}
