import React, { useState } from 'react';
import { scanText, scanFile } from '../services/api';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

const DEMO_TEXT = `CONFIDENTIAL HR RECORD
Employee: Priya Mehta | ID: EMP-4521
Aadhaar: 9876 5432 1098
PAN: BCDFE9876G
Card: 4532 1234 5678 9010 CVV: 234
Email: priya.mehta@company.com
Salary: Rs 1,20,000 per month
api_key=sk-proj-xK92mNvLpQ34rTyU8wZmN
Token: eyJhbGciOiJIUzI1NiJ9.payload.sig`;

export default function Scanner() {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);

  const handleScanText = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setOriginalPreview(text);
    try {
      const res = await scanText(text);
      setResults(res);
    } catch (err) {
      if (err.response && err.response.data) {
        setResults(err.response.data);
      } else {
         console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFile = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await scanFile(formData);
      setOriginalPreview(res.text_preview);
      setResults(res);
    } catch (err) {
      if (err.response && err.response.data) {
        setResults(err.response.data);
      } else {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;
    
    let bg = '#10b981', label = 'SAFE';
    if (results.action === 'BLOCK' || results.action === 'blocked') { bg = '#ef4444'; label = 'BLOCKED'; }
    if (results.action === 'MASK' || results.action === 'masked') { bg = '#f97316'; label = 'MASKED'; }
    if (results.action === 'ALERT' || results.action === 'alerted') { bg = '#eab308'; label = 'ALERT'; }

    const score = results.risk_score || 0;
    let meterColor = '#10b981';
    if (score > 30) meterColor = '#f97316';
    if (score > 60) meterColor = '#ef4444';

    return (
      <div style={{ marginTop: '30px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <span style={{ backgroundColor: bg, color: 'white', fontSize: '24px', fontWeight: 'bold', padding: '8px 20px', borderRadius: '8px' }}>
              {label}
            </span>
          </div>
          <div style={{ width: '40%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>Risk Score Meter</span>
              <span style={{ color: meterColor }}>{score}/100</span>
            </div>
            <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, backgroundColor: meterColor, transition: 'width 0.5s ease-out' }}></div>
            </div>
          </div>
        </div>

        {results.findings && results.findings.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Findings Detected</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {results.findings.map((f, i) => (
                 <div key={i} style={{ backgroundColor: '#f1f5f9', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', border: '1px solid #cbd5e1' }}>
                    <strong>{f.type}</strong> x{f.count || 1}
                 </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
             <h4 style={{ margin: '0 0 10px 0' }}>Original Input</h4>
             <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace' }}>
               {originalPreview || text}
             </div>
          </div>
          <div style={{ flex: 1 }}>
             <h4 style={{ margin: '0 0 10px 0' }}>Masked Output</h4>
             <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace' }}>
               {results.masked_text || results.masked_content || "No masking applied."}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', color: '#1e1e2e', marginTop: 0 }}>Live DLP Scanner</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button 
          onClick={() => { setActiveTab('text'); setResults(null); }}
          style={{ padding: '12px 24px', backgroundColor: activeTab === 'text' ? '#3b82f6' : 'white', color: activeTab === 'text' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Scan Text
        </button>
        <button 
          onClick={() => { setActiveTab('file'); setResults(null); }}
          style={{ padding: '12px 24px', backgroundColor: activeTab === 'file' ? '#3b82f6' : 'white', color: activeTab === 'file' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Scan File
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        {activeTab === 'text' ? (
          <div>
            <textarea 
               value={text} 
               onChange={(e) => setText(e.target.value)}
               placeholder="Paste text or JSON payload here..."
               style={{ width: '100%', boxSizing: 'border-box', minHeight: '160px', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setText(DEMO_TEXT)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
                 Demo Breach
               </button>
               <button onClick={handleScanText} disabled={isLoading} style={{ padding: '10px 24px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 {isLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Scan Now
               </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
              <input 
                type="file" 
                id="fileUpload"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <label htmlFor="fileUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <UploadCloud size={48} color="#94a3b8" />
                <span style={{ fontSize: '18px', color: '#475569', fontWeight: 600 }}>Drop PDF, DOCX or TXT here</span>
                <span style={{ color: '#94a3b8' }}>or click to browse from local drive</span>
              </label>
            </div>
            {selectedFile && (
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#334155' }}>
                <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
            <button onClick={handleScanFile} disabled={!selectedFile || isLoading} style={{ padding: '10px 24px', backgroundColor: selectedFile ? '#3b82f6' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: selectedFile ? 'pointer' : 'not-allowed', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
               {isLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Scan File
            </button>
          </div>
        )}
      </div>

      {renderResults()}
    </div>
  );
}
