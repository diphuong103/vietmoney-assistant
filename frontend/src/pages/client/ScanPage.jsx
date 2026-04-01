import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';

const DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000];

export default function ScanPage() {
  const navigate = useNavigate();
  const [mode, setMode]             = useState('realtime'); // 'realtime' | 'upload'
  const [detected, setDetected]     = useState(false);
  const [resultAmount, setResult]   = useState('₫500,000');
  const [resultConverted, setConv]  = useState('≈ $19.67 USD · ₩26,455 KRW');
  const [showResult, setShowResult] = useState(false);

  const simulateScan = () => {
    const denom = DENOMINATIONS[Math.floor(Math.random() * DENOMINATIONS.length)];
    const usd   = (denom / 25420).toFixed(2);
    setResult(`₫${denom.toLocaleString()}`);
    setConv(`≈ $${usd} USD`);
    setDetected(true);
    setShowResult(true);
    setTimeout(() => { setDetected(false); setShowResult(false); }, 3000);
  };

  return (
    <div className="page active" id="page-scan">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Scan"
        actions={<button className="icon-btn">⚙️</button>}
      />

      <div className="scan-hero">
        {/* Mode Toggle */}
        <div className="scan-mode-toggle">
          <button
            className={`toggle-btn${mode === 'realtime' ? ' active' : ''}`}
            onClick={() => setMode('realtime')}
          >Real-time</button>
          <button
            className={`toggle-btn${mode === 'upload' ? ' active' : ''}`}
            onClick={() => setMode('upload')}
          >Upload Photo</button>
        </div>

        {/* Camera Viewport */}
        <div className="camera-viewport" id="camera-vp">
          <div className="camera-bg" />
          <div className="camera-noise" />
          <div className="cam-corner tl"><span className="cam-label">FOCUS</span></div>
          <div className="cam-corner tr"><span className="cam-label">AI</span></div>

          <div className={`scan-frame${detected ? ' detected' : ''}`} id="scan-frame">
            <div className="frame-corner tl" />
            <div className="frame-corner tr" />
            <div className="frame-corner bl" />
            <div className="frame-corner br" />
            {!detected && <div className="scan-line" />}
          </div>

          <div className={`detected-pulse${detected ? ' active' : ''}`} />

          <div className={`scan-result-overlay${showResult ? ' show' : ''}`}>
            <div className="result-label">DETECTED</div>
            <div className="result-amount">{resultAmount}</div>
            <div className="result-converted">{resultConverted}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="scan-controls">
          <button className="scan-btn-secondary" title="Flash">⚡</button>
          <button className="scan-btn-main" onClick={simulateScan} title="Capture">📷</button>
          <button className="scan-btn-secondary" title="History" onClick={() => navigate('/scan/history')}>🕐</button>
        </div>

        <div className="scan-tip">Point at Vietnamese Dong · Tap to scan</div>
      </div>
    </div>
  );
}
