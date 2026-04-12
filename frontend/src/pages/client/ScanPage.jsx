import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';

const DENOMINATIONS = [
  { value: 500000, label: '₫500,000', usdRate: 25420 },
  { value: 200000, label: '₫200,000', usdRate: 25420 },
  { value: 100000, label: '₫100,000', usdRate: 25420 },
  { value:  50000, label: '₫50,000',  usdRate: 25420 },
  { value:  20000, label: '₫20,000',  usdRate: 25420 },
  { value:  10000, label: '₫10,000',  usdRate: 25420 },
];

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode]             = useState('realtime'); // 'realtime' | 'upload'
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detected, setDetected]     = useState(false);
  const [resultAmount, setResult]   = useState('');
  const [resultConverted, setConv]  = useState('');
  const [showResult, setShowResult] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [flashOn, setFlashOn]       = useState(false);

  // ── Start camera ──────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError('');
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // camera sau
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Không tìm thấy camera trên thiết bị này.');
      } else {
        setCameraError('Không thể mở camera. ' + err.message);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (mode === 'realtime') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  // ── Toggle flash (nếu thiết bị hỗ trợ) ──────────────
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const caps = track.getCapabilities?.();
    if (caps?.torch) {
      const newFlash = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: newFlash }] });
      setFlashOn(newFlash);
    }
  };

  // ── Simulate scan result ──────────────────────────────
  const showScanResult = () => {
    const denom = DENOMINATIONS[Math.floor(Math.random() * DENOMINATIONS.length)];
    const usd = (denom.value / denom.usdRate).toFixed(2);
    const krw = Math.round(denom.value / 18.9);
    setResult(denom.label);
    setConv(`≈ $${usd} USD · ₩${krw.toLocaleString()} KRW`);
    setDetected(true);
    setShowResult(true);
    setTimeout(() => { setDetected(false); setShowResult(false); }, 4000);
  };

  // ── Capture from camera ────────────────────────────────
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImg(dataUrl);
    // Mock scan result (không gọi AI API)
    showScanResult();
  };

  // ── Upload photo ───────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImg(ev.target.result);
      showScanResult();
    };
    reader.readAsDataURL(file);
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
            onClick={() => { setMode('realtime'); setCapturedImg(null); }}
          >📸 Real-time</button>
          <button
            className={`toggle-btn${mode === 'upload' ? ' active' : ''}`}
            onClick={() => setMode('upload')}
          >📁 Upload Photo</button>
        </div>

        {/* Camera Viewport */}
        <div className="camera-viewport" id="camera-vp">
          {mode === 'realtime' ? (
            <>
              {/* Live camera feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  borderRadius: 20, zIndex: 0,
                  display: cameraReady ? 'block' : 'none',
                }}
              />

              {/* Loading state */}
              {!cameraReady && !cameraError && (
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 12,
                  background: 'var(--bg2)', borderRadius: 20, zIndex: 1,
                }}>
                  <div style={{ fontSize: 36, animation: 'pulse 1.5s infinite' }}>📷</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>Đang mở camera...</div>
                </div>
              )}

              {/* Camera error */}
              {cameraError && (
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 12, padding: 24,
                  background: 'var(--bg2)', borderRadius: 20, zIndex: 1,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 36 }}>⚠️</div>
                  <div style={{ color: 'var(--accent3)', fontSize: 13, lineHeight: 1.5 }}>
                    {cameraError}
                  </div>
                  <button
                    onClick={startCamera}
                    style={{
                      marginTop: 8, padding: '8px 20px', background: 'var(--accent)',
                      color: '#000', border: 'none', borderRadius: 10,
                      cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                  >Thử lại</button>
                </div>
              )}
            </>
          ) : (
            /* Upload mode */
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12,
                background: capturedImg ? 'transparent' : 'var(--bg2)',
                borderRadius: 20, cursor: 'pointer', zIndex: 1,
              }}
            >
              {capturedImg ? (
                <img src={capturedImg} alt="Captured" style={{
                  width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20,
                }} />
              ) : (
                <>
                  <div style={{ fontSize: 48, opacity: 0.5 }}>🖼️</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                    Nhấn để chọn ảnh từ thiết bị
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>
                    JPG, PNG — tối đa 10MB
                  </div>
                </>
              )}
            </div>
          )}

          {/* Scan frame overlay */}
          <div className="cam-corner tl"><span className="cam-label">FOCUS</span></div>
          <div className="cam-corner tr"><span className="cam-label">AI</span></div>

          <div className={`scan-frame${detected ? ' detected' : ''}`} id="scan-frame">
            <div className="frame-corner tl" />
            <div className="frame-corner tr" />
            <div className="frame-corner bl" />
            <div className="frame-corner br" />
            {!detected && mode === 'realtime' && cameraReady && <div className="scan-line" />}
          </div>

          <div className={`detected-pulse${detected ? ' active' : ''}`} />

          <div className={`scan-result-overlay${showResult ? ' show' : ''}`}>
            <div className="result-label">DETECTED</div>
            <div className="result-amount">{resultAmount}</div>
            <div className="result-converted">{resultConverted}</div>
          </div>
        </div>

        {/* Hidden elements */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Controls */}
        <div className="scan-controls">
          <button className="scan-btn-secondary" title="Flash" onClick={toggleFlash}
            style={{ opacity: flashOn ? 1 : 0.6 }}>
            {flashOn ? '🔦' : '⚡'}
          </button>
          <button className="scan-btn-main" onClick={mode === 'realtime' ? handleCapture : () => fileInputRef.current?.click()} title="Capture">
            {mode === 'realtime' ? '📷' : '📁'}
          </button>
          <button className="scan-btn-secondary" title="History" onClick={() => navigate('/scan/history')}>🕐</button>
        </div>

        <div className="scan-tip">
          {mode === 'realtime'
            ? 'Point at Vietnamese Dong · Tap 📷 to scan'
            : 'Select a photo of Vietnamese Dong'
          }
        </div>
      </div>
    </div>
  );
}
