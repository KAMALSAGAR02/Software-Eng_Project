import { useState } from 'react'
import axios from 'axios'
import { Search, ShieldAlert, AlertTriangle, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const API_URL = 'http://localhost:5000/api'

export default function ThreatScanner() {
  const [scanType, setScanType] = useState('url')
  const [scanPayload, setScanPayload] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!scanPayload) return
    setIsScanning(true)
    setScanResult(null)
    try {
      const res = await axios.post(`${API_URL}/scan`, { type: scanType, payload: scanPayload })
      setScanResult(res.data)
    } catch (err) {
      setScanResult({ error: 'Scan failed. Check API connection or key.' })
    } finally {
      setIsScanning(false)
    }
  }

  const getChartData = () => {
    if (!scanResult || scanResult.error) return []
    return [
      { name: 'Malicious', value: scanResult.stats.malicious || 0, color: '#ef4444' },
      { name: 'Suspicious', value: scanResult.stats.suspicious || 0, color: '#eab308' },
      { name: 'Harmless', value: scanResult.stats.harmless || 0, color: '#10b981' },
      { name: 'Undetected', value: scanResult.stats.undetected || 0, color: '#64748b' }
    ]
  }

  return (
    <div className="p-4 md:p-8 font-sans h-full overflow-y-auto">
      <header className="mb-8 pb-4 border-b border-slate-800/60 backdrop-blur-sm">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 tracking-tight">
          <Search className="text-blue-500 w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Threat Intelligence Scanner
          </span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Scan URLs, IPs, and Hashes against global threat databases
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-100 relative z-10">
              <ShieldAlert className="text-blue-400 w-6 h-6" /> Initialize Scan
            </h2>
            <form onSubmit={handleScan} className="flex gap-4 relative z-10">
              <select 
                value={scanType} 
                onChange={(e) => setScanType(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="url">URL Scanner</option>
                <option value="ip">IP Scanner</option>
                <option value="hash">Hash Scanner</option>
              </select>
              <input 
                type="text" 
                value={scanPayload}
                onChange={(e) => setScanPayload(e.target.value)}
                placeholder={`Enter suspicious ${scanType.toUpperCase()} here...`}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                required
              />
              <button 
                type="submit" 
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center min-w-[120px]"
              >
                {isScanning ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Scan Target'}
              </button>
            </form>
          </div>

          {scanResult && !scanResult.error && (
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-lg font-semibold mb-6 text-slate-200">Analysis Distribution</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#475569" fontSize={12} />
                    <Tooltip 
                      cursor={{ fill: '#0f172a' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-6">
          {scanResult && (
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl h-full flex flex-col animate-in fade-in slide-in-from-right-4">
              <h2 className="text-lg font-semibold mb-4 border-b border-slate-800/80 pb-4 text-slate-200">
                Scan Report Summary
              </h2>
              {scanResult.error ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <p className="text-sm">{scanResult.error}</p>
                </div>
              ) : (
                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Target Identity</p>
                    <p className="text-sm text-slate-300 font-mono break-all bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                      {scanResult.target}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Overall Risk Level</p>
                    <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold w-full ${
                      scanResult.risk_score === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 
                      scanResult.risk_score === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    }`}>
                      {scanResult.risk_score} Risk
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/10 text-center">
                      <p className="text-red-400 text-2xl font-black">{scanResult.stats.malicious || 0}</p>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Malicious</p>
                    </div>
                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/10 text-center">
                      <p className="text-yellow-400 text-2xl font-black">{scanResult.stats.suspicious || 0}</p>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Suspicious</p>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/10 text-center">
                      <p className="text-emerald-400 text-2xl font-black">{scanResult.stats.harmless || 0}</p>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Harmless</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                      <p className="text-slate-300 text-2xl font-black">{scanResult.stats.undetected || 0}</p>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Undetected</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
