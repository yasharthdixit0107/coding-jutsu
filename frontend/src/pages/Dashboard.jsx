import React, { useEffect, useState } from 'react';
import { getStats } from '../services/api';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertCircle, Shield, CheckCircle, EyeOff } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div style={{ padding: '20px' }}>Loading dashboard...</div>;

  const lineData = Object.entries(stats.incidents_by_day || {})
    .reverse() 
    .map(([date, count]) => ({ date, count }));

  const pieData = Object.entries(stats.top_data_types || {})
    .map(([name, value]) => ({ name, value }));

  const Card = ({ title, value, color, icon: Icon }) => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flex: 1, display: 'flex', justifyContent: 'space-between', borderLeft: `6px solid ${color}` }}>
      <div>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#1e1e2e' }}>{value}</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', textTransform: 'uppercase', fontWeight: 600 }}>{title}</p>
      </div>
      <div style={{ color, opacity: 0.8 }}><Icon size={40} /></div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', color: '#1e1e2e', marginTop: 0 }}>DLP Dashboard</h1>
      
      {/* Row 1 - Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <Card title="Total Incidents" value={stats.total} color="#3b82f6" icon={AlertCircle} />
        <Card title="Blocked" value={stats.blocked} color="#ef4444" icon={Shield} />
        <Card title="Masked" value={stats.masked} color="#f97316" icon={EyeOff} />
        <Card title="Alerted" value={stats.alerted} color="#10b981" icon={CheckCircle} />
      </div>

      {/* Row 2 - Charts */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', height: '350px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Incidents last 7 days</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>By data type</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 - Table */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Recent Incidents</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
              <th style={{ padding: '12px' }}>Time</th>
              <th style={{ padding: '12px' }}>Channel</th>
              <th style={{ padding: '12px' }}>Action</th>
              <th style={{ padding: '12px' }}>Risk Score</th>
              <th style={{ padding: '12px' }}>Type Found</th>
            </tr>
          </thead>
          <tbody>
            {(stats.incidents || []).slice(0, 5).map((inc, i) => {
              let badgeColor = '#ef4444';
              if (inc.action_taken === 'masked') badgeColor = '#f97316';
              if (inc.action_taken === 'alerted' || inc.action_taken === 'allowed') badgeColor = '#10b981';
              
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>{new Date(inc.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '12px', textTransform: 'capitalize' }}>{inc.channel}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: badgeColor, color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {inc.action_taken}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{inc.risk_score}</td>
                  <td style={{ padding: '12px' }}>{inc.findings && inc.findings.length > 0 ? inc.findings[0].type : 'None'}</td>
                </tr>
              )
            })}
            {(!stats.incidents || stats.incidents.length === 0) && (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Latest occurrences populate here real-time.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Row 4 - Compliance */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {['GDPR Compliant', 'India DPDP Act 2023', 'PCI-DSS'].map((badge, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ecfdf5', color: '#065f46', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold' }}>
            <CheckCircle size={20} />
            {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
