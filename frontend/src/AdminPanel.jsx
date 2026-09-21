import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ShieldCheck, XCircle, Plus } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating a user
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'User' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${id}`, { status });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/users', newUser);
      setMsg('User created successfully!');
      setNewUser({ username: '', password: '', role: 'User' });
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Failed to create user. Username might exist.');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="text-blue-500 w-8 h-8" />
          Admin Control Panel
        </h1>
        <p className="text-slate-400 mt-2">Manage analysts, approve registrations, and assign roles.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-6 text-slate-200">Registered Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="p-3 font-semibold rounded-tl-lg">Username</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id} className="border-b border-slate-800/50">
                      <td className="p-3 font-medium text-slate-200">{u.username}</td>
                      <td className="p-3 text-slate-400">{u.role}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          u.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2">
                        {u.status !== 'approved' && (
                          <button onClick={() => updateStatus(u._id, 'approved')} className="text-emerald-400 hover:bg-emerald-400/10 p-1.5 rounded transition">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        {u.status !== 'rejected' && (
                          <button onClick={() => updateStatus(u._id, 'rejected')} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Form */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 h-fit">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
            <Plus className="w-5 h-5 text-blue-400" /> Create New User
          </h2>
          {msg && <p className="mb-4 text-sm text-emerald-400 bg-emerald-500/10 p-2 rounded">{msg}</p>}
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Username</label>
              <input 
                type="text" required
                value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Password</label>
              <input 
                type="password" required
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Role</label>
              <select 
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="User">User</option>
                <option value="Analyst">Analyst</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors">
              Create & Approve
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
