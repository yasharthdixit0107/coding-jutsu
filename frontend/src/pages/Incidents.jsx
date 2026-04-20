import React, { useEffect, useState } from 'react';
import { getIncidents } from '../services/api';

export default function Incidents() {
  const [data, setData] = useState({ incidents: [], total: 0, page: 1, limit: 20 });
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await getIncidents(page, 20, filter);
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchIncidents();
  }, [page, filter]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  const getActionColor = (action) => {
    if(action === 'blocked' || action === 'BLOCK') return '#ef4444';
    if(action === 'masked' || action === 'MASK') return '#f97316';
    if(action === 'alerted' || action === 'ALERT') return '#eab308';
    return '#10b981';
  };

  const getScoreColor = (score) => {
    if(score > 60) return '#ef4444';
    if(score > 30) return '#f97316';
    return '#10b981';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#1e1e2e' }}>Incident Logs</h1>
        <select 
          value={filter} 
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
        >
          <option value="All">All</option>
          <option value="blocked">Blocked</option>
          <option value="masked">Masked</option>
          <option value="alerted">Alerted</option>
        </select>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px' }}>ID</th>
              <th style={{ padding: '16px 20px' }}>Time</th>
              <th style={{ padding: '16px 20px' }}>Channel</th>
              <th style={{ padding: '16px 20px' }}>Action</th>
              <th style={{ padding: '16px 20px' }}>Risk Score</th>
              <th style={{ padding: '16px 20px' }}>Top Finding</th>
              <th style={{ padding: '16px 20px' }}></th>
            </tr>
          </thead>
          <tbody>
            {data.incidents.map((inc) => (
              <tr key={inc._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: '#64748b' }}>{inc._id.substring(0,8)}</td>
                <td style={{ padding: '16px 20px' }}>{new Date(inc.timestamp).toLocaleString('en-GB').slice(0, 16)}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{inc.channel}</span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ backgroundColor: getActionColor(inc.action_taken), color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {inc.action_taken}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 'bold', color: getScoreColor(inc.risk_score) }}>{inc.risk_score}</td>
                <td style={{ padding: '16px 20px' }}>{inc.findings && inc.findings.length > 0 ? inc.findings[0].type : 'N/A'}</td>
                <td style={{ padding: '16px 20px' }}>
                  <button onClick={() => setModalData(inc)} style={{ backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {data.incidents.length === 0 && (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No incidents match this filter.</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: page === 1 ? '#e2e8f0' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            Previous
          </button>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Page {page} of {totalPages}</span>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)}
            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: page >= totalPages ? '#e2e8f0' : 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            Next
          </button>
        </div>
      </div>

      {modalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
           <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h2 style={{ margin: 0 }}>Incident Details</h2>
               <button onClick={() => setModalData(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
             </div>
             
             <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
               <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                 <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Timestamp</p>
                 <strong>{new Date(modalData.timestamp).toLocaleString()}</strong>
               </div>
               <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                 <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Risk Score</p>
                 <strong style={{ color: getScoreColor(modalData.risk_score), fontSize: '18px' }}>{modalData.risk_score}</strong>
               </div>
             </div>

             <h4>Original Preview (First 100 chars)</h4>
             <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
               {modalData.original_preview}
             </div>

             {modalData.masked_content && (
                <>
                  <h4>Masked Preview</h4>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                    {modalData.masked_content}
                  </div>
                </>
             )}

             <h4>All Findings</h4>
             <ul style={{ paddingLeft: '20px', margin: 0 }}>
               {modalData.findings.map((f, i) => (
                 <li key={i} style={{ marginBottom: '8px' }}><strong>{f.type}</strong> (Count: {f.count || 1})</li>
               ))}
             </ul>
           </div>
        </div>
      )}
    </div>
  );
}
