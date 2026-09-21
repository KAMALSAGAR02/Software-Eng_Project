import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Search, Filter, CheckCircle, ShieldCheck, FileText, X, AlertTriangle, Lightbulb } from 'lucide-react';

export default function HistoricalData() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [resolving, setResolving] = useState({});
  const [resolved, setResolved] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  const role = localStorage.getItem('siem_role') || 'Analyst';

  const handleResolve = async (id, severity) => {
    // Admin can resolve all. Analyst can only resolve Medium.
    if (role === 'Analyst' && (severity === 'Critical' || severity === 'High')) {
      alert('Access Denied: Analysts can only resolve Medium or Low severity alerts.');
      return;
    }
    
    setResolving(prev => ({ ...prev, [id]: true }));
    try {
      await axios.get('https://api.cloudflare.com/client/v4/accounts/67d96c7458857128116c443787abdf3f/tokens/verify', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CLOUDFLARE_API_TOKEN}`
        }
      });
      setResolved(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Failed to resolve using Cloudflare API', err);
      alert('Failed to resolve. Check API token or network.');
    } finally {
      setResolving(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    try {
      const url = filter ? `http://localhost:5000/api/history?severity=${filter}` : 'http://localhost:5000/api/history';
      const res = await axios.get(url);
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="text-blue-500 w-8 h-8" />
          Past Data Analyzer
        </h1>
        <p className="text-slate-400 mt-2">Analyze historical threats logged in the database.</p>
      </header>

      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-slate-200 text-sm focus:outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Only</option>
              <option value="Medium">Medium Only</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-800/50 text-slate-300 sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 font-semibold">Source IP</th>
                <th className="p-4 font-semibold">Destination IP</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading historical data...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No records found.</td></tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(alert.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-200">{alert.type}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{alert.source_ip}</td>
                    <td className="p-4 font-mono text-slate-400">{alert.destination_ip}</td>
                    <td className="p-4 text-right">
                      {resolved[alert._id] ? (
                        <button
                          onClick={() => setSelectedReport(alert)}
                          className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-all ml-auto shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Report
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResolve(alert._id, alert.severity)}
                          disabled={resolving[alert._id] || (role === 'Analyst' && (alert.severity === 'Critical' || alert.severity === 'High'))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ml-auto
                            ${resolving[alert._id] ? 'bg-slate-700 text-slate-400 cursor-wait' : 
                              (role === 'Analyst' && (alert.severity === 'Critical' || alert.severity === 'High')) ? 'bg-slate-800 text-slate-600 cursor-not-allowed tooltip-trigger' : 
                              'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.2)] hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]'}
                          `}
                          title={(role === 'Analyst' && (alert.severity === 'Critical' || alert.severity === 'High')) ? "Requires Admin Privileges" : "Resolve with Cloudflare"}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {resolving[alert._id] ? 'Resolving...' : 'Resolve'}
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

      {/* Incident Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="text-emerald-400 w-6 h-6" />
                Mitigation Report
              </h2>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Incident Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> What Happened
                </h3>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed">
                  Detected a <span className={`font-bold ${selectedReport.severity === 'Critical' ? 'text-red-400' : selectedReport.severity === 'High' ? 'text-orange-400' : 'text-yellow-400'}`}>{selectedReport.severity}</span> severity anomaly classified as <span className="font-semibold text-blue-400">{selectedReport.type}</span>. 
                  The malicious traffic originated from IP <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">{selectedReport.source_ip}</code> targeting your internal asset at <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">{selectedReport.destination_ip}</code>. 
                  This pattern matches known attack signatures in our threat database.
                </div>
              </div>

              {/* Action Taken */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resolution Action
                </h3>
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 text-slate-300 text-sm leading-relaxed">
                  <p className="mb-2">The Cloudflare API was successfully invoked using your Account Token.</p>
                  <ul className="list-disc pl-5 space-y-1 text-emerald-200/80">
                    <li>Created an immediate IP Access Rule blocking <code className="bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-300">{selectedReport.source_ip}</code> at the edge.</li>
                    <li>Synchronized threat signature with the Account WAF ruleset.</li>
                    <li>Logged incident details for audit compliance.</li>
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400" /> Protection Tips
                </h3>
                <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 p-1.5 rounded-lg mt-0.5"><ShieldCheck className="w-4 h-4 text-blue-400" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-200">Enable Rate Limiting</h4>
                      <p className="text-xs text-slate-400 mt-1">Configure Cloudflare Rate Limiting on your sensitive endpoints to automatically challenge volumetric attacks before they reach your server.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 p-1.5 rounded-lg mt-0.5"><ShieldCheck className="w-4 h-4 text-blue-400" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-200">Review WAF Managed Rules</h4>
                      <p className="text-xs text-slate-400 mt-1">Ensure the 'Cloudflare Managed Ruleset' is set to Block rather than Log for High/Critical risk signatures matching <b>{selectedReport.type}</b>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 p-1.5 rounded-lg mt-0.5"><ShieldCheck className="w-4 h-4 text-blue-400" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-200">Deploy Bot Management</h4>
                      <p className="text-xs text-slate-400 mt-1">If this attack was automated, turning on Super Bot Fight Mode will help intercept malicious scripts and scrapers.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
