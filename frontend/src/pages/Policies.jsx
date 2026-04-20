import React, { useEffect, useState } from 'react';
import { getPolicies, updatePolicy } from '../services/api';

export default function Policies() {
  const [policies, setPolicies] = useState({});
  const [toast, setToast] = useState(null);

  const fetchPolicies = async () => {
    try {
      const data = await getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (dataType, action) => {
    try {
      await updatePolicy(dataType, action);
      showToast('Policy updated');
      fetchPolicies();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const friendlyName = (name) => {
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getBadgeBg = (action) => {
    if(action === 'BLOCK') return '#ef4444';
    if(action === 'MASK') return '#f97316';
    if(action === 'ALERT') return '#eab308';
    return '#10b981';
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
          {toast.message}
        </div>
      )}

      <h1 style={{ marginBottom: '24px', color: '#1e1e2e', marginTop: 0 }}>Enforcement Policies</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Modify the default actions applied natively at the DLP gateway layer when structural types are detected inside stream channels.</p>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px' }}>Data Type</th>
              <th style={{ padding: '16px 24px' }}>Current Action</th>
              <th style={{ padding: '16px 24px' }}>Configuration Tuning</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(policies).map(([type, currentAction]) => {
              return (
                <tr key={type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: '#334155' }}>{friendlyName(type)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ backgroundColor: getBadgeBg(currentAction), color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {currentAction}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select 
                      defaultValue={currentAction}
                      id={`select-${type}`}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                      <option value="BLOCK">BLOCK</option>
                      <option value="MASK">MASK</option>
                      <option value="ALERT">ALERT</option>
                      <option value="ALLOW">ALLOW</option>
                    </select>
                    <button 
                      onClick={() => handleSave(type, document.getElementById(`select-${type}`).value)}
                      style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Save
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
