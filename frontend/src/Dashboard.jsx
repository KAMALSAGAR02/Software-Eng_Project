import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { Activity, ShieldAlert, WifiHigh, AlertTriangle, CheckCircle, Clock, LogOut, User } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const SOCKET_URL = 'http://localhost:5000'

const COLORS = {
  Critical: '#ef4444', 
  High: '#f97316',     
  Medium: '#eab308'    
}

function Dashboard() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [chartData, setChartData] = useState([])
  const username = localStorage.getItem('siem_user') || 'Analyst'

  const handleLogout = () => {
    localStorage.removeItem('siem_token')
    localStorage.removeItem('siem_user')
    localStorage.removeItem('siem_role')
    navigate('/login')
  }

  useEffect(() => {
    const socket = io(SOCKET_URL)

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    socket.on('new_alert', (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 50))
      
      setChartData(prev => {
        const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const newData = [...prev, { time: timeStr, packet_length: data.details.packet_length }]
        return newData.slice(-20) 
      })
    })

    return () => socket.disconnect()
  }, [])

  const getSeverityData = () => {
    const counts = { Critical: 0, High: 0, Medium: 0 }
    alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++ })
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }))
  }

  return (
    <div className="p-4 md:p-8 font-sans h-full overflow-y-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-800/60 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 tracking-tight">
            <ShieldAlert className="text-red-500 w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Threat Detection SIEM
            </span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Real-time Network Monitoring & Analysis
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold ml-2">Engine Status</span>
            {isConnected ? (
              <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-xl text-sm font-medium border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active
              </span>
            ) : (
              <span className="bg-red-500/10 text-red-400 px-4 py-1.5 rounded-xl text-sm font-medium border border-red-500/20">
                Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: URL Scanner & Charts */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Top Row: Quick Stats */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col justify-center">
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-950 p-6 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Total Alerts Detected</p>
                <p className="text-5xl font-black text-white drop-shadow-md">{alerts.length}</p>
              </div>
              <div className="flex-1 bg-slate-950 p-6 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Network Interface</p>
                <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2 mt-2 drop-shadow-md">
                  <WifiHigh className="w-6 h-6" /> Active Stream
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Line Chart: Traffic Anomaly Volume */}
            <div className="md:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-200">
                <Activity className="text-blue-400 w-5 h-5" /> Traffic Anomaly Size (Bytes)
              </h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#475569" fontSize={12} tickFormatter={(val) => `${val}b`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="packet_length" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#0f172a' }}
                      activeDot={{ r: 6, fill: '#60a5fa' }}
                      isAnimationActive={false} // Disable animation for live streaming feel
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Severity Distribution */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col">
              <h2 className="text-lg font-semibold mb-2 text-slate-200">Severity Distribution</h2>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getSeverityData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {getSeverityData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {Object.keys(COLORS).map(key => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[key] }}></div>
                    <span className="text-slate-400">{key}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Threat Feed */}
        <div className="xl:col-span-4 h-full">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl h-full flex flex-col max-h-[800px]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800/80 pb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                <Clock className="w-5 h-5 text-indigo-400" /> Live Threat Feed
              </h2>
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-1 rounded-full border border-indigo-500/20">
                Latest 50
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <div className="relative">
                    <ShieldAlert className="w-12 h-12 text-slate-700" />
                    <div className="absolute inset-0 bg-slate-400 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <p className="text-sm">Listening for network anomalies...</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className="group bg-slate-950/50 border border-slate-800 hover:border-slate-600 p-4 rounded-xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Left Accent Bar based on severity */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      alert.severity === 'Critical' ? 'bg-red-500' : 
                      alert.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}></div>
                    
                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            alert.severity === 'Critical' ? 'text-red-400' : 
                            alert.severity === 'High' ? 'text-orange-400' : 'text-yellow-400'
                          }`}>
                            {alert.severity} Risk
                          </span>
                          <span className="font-semibold text-slate-200 text-sm">{alert.type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-900 px-2 py-1 rounded">
                          {new Date(alert.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-400 border border-slate-800 mt-2 flex justify-between items-center group-hover:bg-slate-800 transition-colors">
                        <span>{alert.source_ip}</span>
                        <span className="text-slate-600">→</span>
                        <span>{alert.destination_ip}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
