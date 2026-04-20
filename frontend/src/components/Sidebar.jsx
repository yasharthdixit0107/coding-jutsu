import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: 'white',
    textDecoration: 'none',
    backgroundColor: isActive ? '#32324a' : 'transparent',
    transition: 'background-color 0.2s',
  });

  const dot = (color) => (
    <span style={{ 
      height: '8px', 
      width: '8px', 
      backgroundColor: color, 
      borderRadius: '50%', 
      display: 'inline-block',
      marginRight: '12px'
    }}></span>
  );

  return (
    <div style={{ width: '220px', backgroundColor: '#1e1e2e', color: 'white', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #32324a' }}>
        <div style={{
          width: '24px',
          height: '28px',
          backgroundColor: 'white',
          clipPath: 'polygon(50% 0%, 100% 15%, 100% 75%, 50% 100%, 0% 75%, 0% 15%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
           <div style={{ width: '12px', height: '14px', backgroundColor: '#1e1e2e', clipPath: 'polygon(50% 0%, 100% 15%, 100% 75%, 50% 100%, 0% 75%, 0% 15%)' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>DLP Shield</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
        <NavLink to="/" style={navStyle}>{dot('#3b82f6')} Dashboard</NavLink>
        <NavLink to="/scanner" style={navStyle}>{dot('#10b981')} Live Scanner</NavLink>
        <NavLink to="/incidents" style={navStyle}>{dot('#f97316')} Incidents</NavLink>
        <NavLink to="/policies" style={navStyle}>{dot('#a855f7')} Policies</NavLink>
      </nav>
    </div>
  );
}
