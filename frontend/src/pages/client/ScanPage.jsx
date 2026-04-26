import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import scanApi from '../../api/scanApi';
// Thêm vào đầu file
import { scanWithImgBB } from '../../services/scanWithImgBB';

// Thay callRealtimeScan và scanUploadItem theo nội dung file ScanPage_patch.js

// ── Zoom levels ───────────────────────────────────────────────────────────────
const ZOOM_LEVELS = [1.0, 0.75, 0.55];
const ZOOM_LABELS = ['1×', '0.75×', '0.55×'];

// ── Màu theo loại tiền ────────────────────────────────────────────────────────
const CURRENCY_COLOR = {
  VND: '#c8f23d', USD: '#60d960', SGD: '#4db8ff',
  MYR: '#ff9f43', THB: '#a29bfe', IDR: '#fd79a8', PHP: '#ffeaa7',
};
const CURRENCY_FLAG = {
  VND: '🇻🇳', USD: '🇺🇸', SGD: '🇸🇬',
  MYR: '🇲🇾', THB: '🇹🇭', IDR: '🇮🇩', PHP: '🇵🇭',
};
const getCurrencyColor = (currency, isFake) =>
  isFake ? '#ff6b6b' : (CURRENCY_COLOR[currency] ?? '#ffffff');

// ── Responsive hook ───────────────────────────────────────────────────────────
const useBreakpoint = () => {
  const [bp, setBp] = useState(() => {
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return bp;
};

export default function ScanPage() {
  const navigate = useNavigate();
  const bp       = useBreakpoint();

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef  = useRef(null);

  const [mode, setMode]               = useState('realtime');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [flashOn, setFlashOn]         = useState(false);
  const [zoomIdx, setZoomIdx]         = useState(0);

  // ── Realtime scan state ───────────────────────────────────────────────────
  const [scanning, setScanning]     = useState(false);
  const [detected, setDetected]     = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanError, setScanError]   = useState('');
  const [result, setResult]         = useState(null);

  // ── Upload state ──────────────────────────────────────────────────────────
  const [uploadFiles, setUploadFiles]         = useState([]);
  const [dragOver, setDragOver]               = useState(false);
  const [activeUploadIdx, setActiveUploadIdx] = useState(null);

  // ── Breakpoint flags (tên rõ ràng hơn) ───────────────────────────────────
  const isDesktop = bp === 'desktop';
  const isMobile  = bp === 'mobile';

  // ── Responsive viewport size ──────────────────────────────────────────────
  const viewportStyle = (() => {
    if (isMobile)  return { aspectRatio: '4/3', maxHeight: '56vw', minHeight: 220 };
    if (bp === 'tablet') return { aspectRatio: '16/9', maxHeight: 420 };
    return { height: 420, maxHeight: 420, aspectRatio: 'unset' };
  })();

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(''); setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
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
      if (err.name === 'NotAllowedError')
        setCameraError('Camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.');
      else if (err.name === 'NotFoundError')
        setCameraError('Không tìm thấy camera trên thiết bị này.');
      else
        setCameraError('Không thể mở camera. ' + err.message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (mode === 'realtime') startCamera(); else stopCamera();
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  // ── Zoom / Flash ──────────────────────────────────────────────────────────
  const cycleZoom   = () => setZoomIdx(i => (i + 1) % ZOOM_LEVELS.length);
  const zoomScale   = ZOOM_LEVELS[zoomIdx];
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track.getCapabilities?.()?.torch) {
      const next = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setFlashOn(next);
    }
  };

  // ── Realtime scan API ─────────────────────────────────────────────────────
  const callRealtimeScan = async (blob) => {
  setScanning(true); setScanError(''); setResult(null); setDetected(false); setShowResult(false);
  try {
    // blob là Blob từ canvas.toBlob() — đúng type, không cần FormData
    const { result: data } = await scanWithImgBB(blob, 'capture.jpg');
    setResult(data); setDetected(true); setShowResult(true);
    setTimeout(() => { setDetected(false); setShowResult(false); }, 6000);
  } catch (err) {
    setScanError(err.response?.data?.message ?? err.message ?? 'Scan thất bại');
  } finally {
    setScanning(false);
  }
};

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => { if (blob) callRealtimeScan(blob); }, 'image/jpeg', 0.85);
  };

  // ── Upload helpers ────────────────────────────────────────────────────────
  const scanUploadItem = async (item) => {
  setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'scanning' } : f));
  try {
    // item.file là File object từ input[type=file] — đúng type
    const { result: data, imageUrl } = await scanWithImgBB(item.file, item.file.name);
    setUploadFiles(prev => prev.map(f =>
      f.id === item.id ? { ...f, status: 'done', result: { ...data, imageUrl } } : f
    ));
    setActiveUploadIdx(item.id);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? 'Scan thất bại';
    setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: msg } : f));
  }
};

  const addFiles = (fileList) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newItems = Array.from(fileList)
      .filter(f => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024)
      .map(f => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        preview: URL.createObjectURL(f),
        status: 'idle',
        result: null,
        error: '',
      }));
    if (!newItems.length) return;
    setUploadFiles(prev => [...prev, ...newItems]);
    // FIX: auto-select ảnh đầu tiên được thêm vào nếu chưa có active
    setActiveUploadIdx(prev => prev ?? newItems[0].id);
    newItems.forEach(item => scanUploadItem(item));
  };

  const retryItem = (item) => {
    setUploadFiles(prev => prev.map(f =>
      f.id === item.id ? { ...f, status: 'idle', result: null, error: '' } : f
    ));
    scanUploadItem({ ...item, status: 'idle' });
  };

  const removeItem = (id) => {
    setUploadFiles(prev => {
      URL.revokeObjectURL(prev.find(f => f.id === id)?.preview);
      const next = prev.filter(f => f.id !== id);
      // FIX: nếu xóa item đang active → chọn item tiếp theo
      if (activeUploadIdx === id) {
        const idx = prev.findIndex(f => f.id === id);
        const nextItem = next[idx] ?? next[idx - 1] ?? null;
        setActiveUploadIdx(nextItem?.id ?? null);
      }
      return next;
    });
  };

  const clearAll = () => {
    uploadFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setUploadFiles([]);
    setActiveUploadIdx(null);
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDrop      = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = ()  => setDragOver(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getConverted = (r) => {
    if (!r?.valueVnd) return '';
    return `$${(r.valueVnd / 25420).toFixed(2)} USD · ₩${Math.round(r.valueVnd / 18.9).toLocaleString()} KRW`;
  };

  const mainColor  = result ? getCurrencyColor(result.currencyType, result.isFake) : '#c8f23d';
  const activeItem = uploadFiles.find(f => f.id === activeUploadIdx);
  const thumbSize  = bp === 'tablet' ? 88 : 72;

  return (
    <div className="page active" id="page-scan">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Scan"
        actions={<button className="icon-btn" onClick={() => navigate('/scan/history')}>🕐</button>}
      />

      {/* ── Outer container ── */}
      <div style={{
        width: '100%',
        maxWidth: isDesktop ? 1100 : bp === 'tablet' ? 720 : '100%',
        margin: '0 auto',
        padding: isMobile ? '0 0 24px' : '0 16px 32px',
      }}>
        <div className="scan-hero">

          {/* ── Mode Toggle ── */}
          <div className="scan-mode-toggle">
            <button
              className={`toggle-btn${mode === 'realtime' ? ' active' : ''}`}
              onClick={() => { setMode('realtime'); setScanError(''); setResult(null); }}
            >📸 Real-time</button>
            <button
              className={`toggle-btn${mode === 'upload' ? ' active' : ''}`}
              onClick={() => setMode('upload')}
            >📁 Upload Photo</button>
          </div>

          {/* ════════════════════════════════════════════
              REALTIME MODE
          ════════════════════════════════════════════ */}
          {mode === 'realtime' && (
            <>
              <div style={{
                display: isDesktop ? 'grid' : 'flex',
                gridTemplateColumns: isDesktop ? '1fr 320px' : undefined,
                flexDirection: isDesktop ? undefined : 'column',
                gap: isDesktop ? 20 : 0,
                alignItems: 'flex-start',
                width: '100%',
              }}>
                {/* ── Camera Viewport ── */}
                <div
                  className="camera-viewport"
                  id="camera-vp"
                  style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 20, background: 'var(--bg2)', ...viewportStyle }}
                >
                  <video ref={videoRef} autoPlay playsInline muted style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '100%', height: '100%', objectFit: 'cover',
                    borderRadius: 20, zIndex: 0,
                    transform: `translate(-50%, -50%) scale(${zoomScale})`,
                    transition: 'transform 0.3s ease',
                    display: cameraReady ? 'block' : 'none',
                  }} />

                  {!cameraReady && !cameraError && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: 'var(--bg2)', borderRadius: 20, zIndex: 1 }}>
                      <div style={{ fontSize: 36, animation: 'pulse 1.5s infinite' }}>📷</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Đang mở camera...</div>
                    </div>
                  )}

                  {cameraError && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, background: 'var(--bg2)', borderRadius: 20, zIndex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 36 }}>⚠️</div>
                      <div style={{ color: 'var(--accent3)', fontSize: 13, lineHeight: 1.5 }}>{cameraError}</div>
                      <button onClick={startCamera} style={{ marginTop: 8, padding: '8px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Thử lại</button>
                    </div>
                  )}

                  {/* Banner trên */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(180deg,rgba(10,10,20,0.85) 0%,rgba(10,10,20,0) 100%)', padding: '10px 14px 24px', zIndex: 5, borderRadius: '20px 20px 0 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>MONEY DETECTOR</span>
                      {result && !scanning && (
                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, fontWeight: 700, color: mainColor, background: `${mainColor}22`, padding: '2px 8px', borderRadius: 6 }}>
                          {CURRENCY_FLAG[result.currencyType] ?? ''} {result.isFake ? 'VND GIẢ' : result.currencyType}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: isMobile ? 18 : 22, fontWeight: 700, color: scanning ? '#888' : (result ? mainColor : 'rgba(255,255,255,0.3)'), lineHeight: 1.2 }}>
                      {scanning ? '🔍 Đang nhận diện...' : result ? result.denomination : (cameraReady ? 'Scanning...' : '—')}
                      {result && !scanning && (
                        <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 10, color: 'rgba(255,255,255,0.5)' }}>{(result.confidence * 100).toFixed(1)}%</span>
                      )}
                    </div>
                    {result && !scanning && result.valueVnd && (
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>≈ {getConverted(result)}</div>
                    )}
                  </div>

                  {/* FAKE banner */}
                  {result?.isFake && showResult && (
                    <div style={{ position: 'absolute', top: 70, left: 0, right: 0, zIndex: 6, background: 'rgba(20,20,180,0.88)', borderTop: '2px solid #ff6b6b', borderBottom: '1px solid #ff6b6b', padding: '8px 14px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>!! TIỀN GIẢ / VÀNG MÃ — KHÔNG SỬ DỤNG !!</span>
                    </div>
                  )}

                  {/* Scan frame */}
                  <div className={`scan-frame${detected ? ' detected' : ''}`}>
                    <div className="frame-corner tl" /><div className="frame-corner tr" />
                    <div className="frame-corner bl" /><div className="frame-corner br" />
                    {!detected && !scanning && cameraReady && <div className="scan-line" />}
                  </div>
                  <div className={`detected-pulse${detected ? ' active' : ''}`} />

                  {/* Zoom label */}
                  {cameraReady && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 7 }}>
                      <span className="cam-label">{ZOOM_LABELS[zoomIdx]}</span>
                    </div>
                  )}

                  {/* Result panel trong viewport — chỉ mobile/tablet */}
                  {!isDesktop && result && showResult && (
                    <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 8, background: 'rgba(10,10,20,0.82)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', minWidth: 160 }}>
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 1 }}>RESULT</div>
                      {(() => {
                        const color = getCurrencyColor(result.currencyType, result.isFake);
                        const pct   = Math.round(result.confidence * 100);
                        return (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color, fontWeight: 700 }}>{result.denomination}</span>
                              <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#c8f23d', marginLeft: 8 }}>{pct}%</span>
                            </div>
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Scan error */}
                  {scanError && !scanning && (
                    <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'rgba(220,50,50,0.9)', borderRadius: 12, padding: '10px 14px', zIndex: 9, textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontSize: 13 }}>⚠️ {scanError}</div>
                    </div>
                  )}

                  {/* Loading */}
                  {scanning && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 20, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 30, animation: 'pulse 0.8s infinite' }}>🔍</div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>AI đang nhận diện...</div>
                    </div>
                  )}

                  <div style={{ position: 'absolute', bottom: 10, left: 12, zIndex: 4, fontFamily: 'DM Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                    {isMobile ? 'Nhấn 📷 để quét' : 'Press 📷 to capture'}
                  </div>
                </div>

                {/* ── Desktop: result panel + controls bên phải ── */}
                {isDesktop && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                      background: 'var(--bg2)',
                      border: `1px solid ${result ? `${mainColor}44` : 'var(--border)'}`,
                      borderRadius: 16, padding: 16, minHeight: 220,
                      display: 'flex', flexDirection: 'column',
                      justifyContent: result ? 'flex-start' : 'center',
                      alignItems: result ? 'flex-start' : 'center',
                    }}>
                      {!result && !scanning && (
                        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                          <div style={{ fontSize: 32, marginBottom: 10 }}>💵</div>
                          <div style={{ fontSize: 13 }}>Kết quả nhận diện sẽ hiện ở đây</div>
                        </div>
                      )}
                      {scanning && (
                        <div style={{ textAlign: 'center', width: '100%', color: 'var(--muted)' }}>
                          <div style={{ fontSize: 32, marginBottom: 10, animation: 'pulse 0.8s infinite' }}>🔍</div>
                          <div style={{ fontSize: 13 }}>AI đang phân tích...</div>
                        </div>
                      )}
                      {result && !scanning && (() => {
                        const color = getCurrencyColor(result.currencyType, result.isFake);
                        const pct   = Math.round(result.confidence * 100);
                        return (
                          <div style={{ width: '100%' }}>
                            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 }}>SCAN RESULT</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{result.denomination}</div>
                                {result.valueVnd && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>≈ {getConverted(result)}</div>}
                              </div>
                              {result.isFake && (
                                <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                                  <div style={{ fontSize: 16 }}>⚠️</div>
                                  <div style={{ fontSize: 10, color: '#ff6b6b', fontWeight: 700 }}>FAKE</div>
                                </div>
                              )}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Độ chính xác</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'DM Mono,monospace' }}>{pct}%</span>
                              </div>
                              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s', boxShadow: `0 0 8px ${color}66` }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: result.isFake ? 10 : 0 }}>
                              <span style={{ fontSize: 11, padding: '3px 10px', background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 20, color }}>
                                {CURRENCY_FLAG[result.currencyType] ?? ''} {result.currencyType}
                              </span>
                              <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)' }}>
                                {result.authenticity === 'real' ? '✅ Thật' : '❌ Giả'}
                              </span>
                              <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)', fontFamily: 'DM Mono,monospace' }}>
                                {result.className}
                              </span>
                            </div>
                            {result.isFake && (
                              <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '8px 10px' }}>
                                <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, lineHeight: 1.5 }}>{result.warningMessage}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Controls desktop — nằm dưới result card */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button className="scan-btn-secondary" onClick={cycleZoom} style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{ZOOM_LABELS[zoomIdx]}</button>
                      <button
                        className="scan-btn-main"
                        onClick={handleCapture}
                        disabled={scanning || !cameraReady}
                        style={{ opacity: scanning ? 0.5 : 1, flex: 2, fontSize: 14, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {scanning ? '⏳ Scanning...' : '📷 Capture'}
                      </button>
                      <button className="scan-btn-secondary" onClick={toggleFlash} style={{ opacity: flashOn ? 1 : 0.6, flex: 1 }}>
                        {flashOn ? '🔦' : '⚡'}
                      </button>
                    </div>
                    <div className="scan-tip" style={{ textAlign: 'center' }}>
                      {scanning ? 'AI đang phân tích...' : result
                        ? `✅ ${result.currencyType} · ${(result.confidence * 100).toFixed(1)}%`
                        : 'Hướng camera vào tờ tiền · Nhấn Capture'}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls mobile/tablet */}
              {!isDesktop && (
                <>
                  <div className="scan-controls">
                    <button className="scan-btn-secondary" onClick={cycleZoom} style={{ fontSize: 13, fontWeight: 700 }}>{ZOOM_LABELS[zoomIdx]}</button>
                    <button className="scan-btn-main" onClick={handleCapture} disabled={scanning || !cameraReady} style={{ opacity: scanning ? 0.5 : 1 }}>
                      {scanning ? '⏳' : '📷'}
                    </button>
                    <button className="scan-btn-secondary" onClick={toggleFlash} style={{ opacity: flashOn ? 1 : 0.6 }}>
                      {flashOn ? '🔦' : '⚡'}
                    </button>
                  </div>
                  <div className="scan-tip">
                    {scanning ? 'AI đang phân tích...' : result
                      ? `✅ ${result.currencyType} · ${(result.confidence * 100).toFixed(1)}%`
                      : 'Hướng camera vào tờ tiền · Nhấn 📷 để quét'}
                  </div>
                </>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════
              UPLOAD MODE
          ════════════════════════════════════════════ */}
          {mode === 'upload' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Drop Zone */}
              <div
                ref={dropZoneRef}
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 16,
                  padding: isMobile ? '20px 16px' : '32px 24px',
                  textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(200,242,61,0.06)' : 'var(--bg2)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: isMobile ? 32 : 44, marginBottom: 10 }}>🖼️</div>
                <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {isMobile ? 'Nhấn để chọn ảnh' : 'Kéo thả ảnh vào đây hoặc nhấn để chọn'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  {!isMobile && 'Hỗ trợ '}JPG, PNG, WEBP · Tối đa 10MB {!isMobile && '· Nhiều ảnh cùng lúc'}
                </div>
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  {['JPG', 'PNG', 'WEBP', '≤10MB'].map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)' }}>{t}</span>
                  ))}
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple
                style={{ display: 'none' }}
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />

              {/* File list */}
              {uploadFiles.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {uploadFiles.length} ảnh đã chọn
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>
                        · {uploadFiles.filter(f => f.status === 'done').length} xong
                      </span>
                    </span>
                    <button onClick={clearAll} style={{ background: 'none', border: 'none', color: 'var(--accent3)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      Xóa tất cả
                    </button>
                  </div>

                  {/* ── Desktop: 2-column ── */}
                  {isDesktop ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'flex-start' }}>

                      {/* Left: list dọc */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
                        {uploadFiles.map(item => {
                          const r      = item.result;
                          const color  = r ? getCurrencyColor(r.currencyType, r.isFake) : 'var(--muted)';
                          const active = activeUploadIdx === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setActiveUploadIdx(item.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                                background: active ? 'rgba(200,242,61,0.06)' : 'var(--bg2)',
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                                <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {item.status === 'scanning' && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: 'pulse 0.8s infinite' }}>🔍</div>
                                )}
                                {item.status === 'done' && (
                                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: r?.isFake ? 'rgba(220,50,50,0.85)' : 'rgba(74,222,128,0.85)', fontSize: 9, fontWeight: 700, color: '#000', textAlign: 'center', padding: '1px 0' }}>
                                    {r?.isFake ? 'FAKE' : '✓'}
                                  </div>
                                )}
                                {item.status === 'error' && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,50,50,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚠️</div>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.file.name}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                                  {item.status === 'scanning' && '🔍 Đang phân tích...'}
                                  {item.status === 'done' && r && (
                                    <span style={{ color, fontFamily: 'DM Mono,monospace', fontWeight: 700 }}>
                                      {r.denomination} · {Math.round(r.confidence * 100)}%
                                    </span>
                                  )}
                                  {item.status === 'error' && <span style={{ color: '#ff6b6b' }}>Lỗi scan</span>}
                                  {item.status === 'idle' && 'Chờ xử lý...'}
                                </div>
                              </div>
                              <button onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 2, flexShrink: 0 }}>✕</button>
                            </div>
                          );
                        })}
                        {/* Add more */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 12, border: '2px dashed var(--border)', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, background: 'var(--bg2)' }}
                        >
                          <span style={{ fontSize: 18 }}>+</span> Thêm ảnh
                        </div>
                      </div>

                      {/* Right: detail card */}
                      <div>
                        {activeItem ? (
                          <UploadDetailCard item={activeItem} getConverted={getConverted} retryItem={retryItem} />
                        ) : (
                          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                            <div style={{ fontSize: 36, marginBottom: 10 }}>👆</div>
                            <div style={{ fontSize: 13 }}>Chọn một ảnh để xem kết quả chi tiết</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── Mobile / Tablet: thumbnail scroll + card dọc ── */
                    <>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                        {uploadFiles.map(item => (
                          <div key={item.id} onClick={() => setActiveUploadIdx(item.id)} style={{
                            position: 'relative', flexShrink: 0,
                            width: thumbSize, height: thumbSize,
                            borderRadius: 10, overflow: 'hidden',
                            border: `2px solid ${activeUploadIdx === item.id ? 'var(--accent)' : 'var(--border)'}`,
                            cursor: 'pointer', transition: 'border 0.2s',
                          }}>
                            <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {item.status === 'scanning' && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, animation: 'pulse 0.8s infinite' }}>🔍</div>
                            )}
                            {item.status === 'done' && (
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: item.result?.isFake ? 'rgba(220,50,50,0.85)' : 'rgba(74,222,128,0.85)', fontSize: 10, fontWeight: 700, color: '#000', textAlign: 'center', padding: '2px 0' }}>
                                {item.result?.isFake ? 'FAKE' : '✓'}
                              </div>
                            )}
                            {item.status === 'error' && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,50,50,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚠️</div>
                            )}
                            <button onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', lineHeight: '18px', textAlign: 'center', padding: 0 }}>✕</button>
                          </div>
                        ))}
                        <div onClick={() => fileInputRef.current?.click()} style={{
                          flexShrink: 0, width: thumbSize, height: thumbSize, borderRadius: 10,
                          border: '2px dashed var(--border)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 22, background: 'var(--bg2)',
                        }}>+</div>
                      </div>
                      {activeItem && <UploadDetailCard item={activeItem} getConverted={getConverted} retryItem={retryItem} />}
                    </>
                  )}
                </>
              )}

              {uploadFiles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>
                  Chưa có ảnh nào — kéo thả hoặc nhấn vào ô trên để thêm
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
}

// ── UploadDetailCard component ────────────────────────────────────────────────
function UploadDetailCard({ item, getConverted, retryItem }) {
  if (!item) return null;
  const r     = item.result;
  const color = r ? getCurrencyColor(r.currencyType, r.isFake) : '#c8f23d';
  const pct   = r ? Math.round(r.confidence * 100) : 0;

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${r?.isFake ? 'rgba(255,107,107,0.4)' : 'var(--border)'}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Preview */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <img src={item.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

        {item.status === 'scanning' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 36, animation: 'pulse 0.8s infinite' }}>🔍</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>AI đang phân tích ảnh...</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{item.file.name}</div>
          </div>
        )}

        {item.status === 'done' && r?.isFake && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(20,20,180,0.9)', borderBottom: '2px solid #ff6b6b', padding: '8px 14px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
              !! TIỀN GIẢ / VÀNG MÃ — KHÔNG SỬ DỤNG !!
            </span>
          </div>
        )}

        {item.status === 'done' && r && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 12px', border: `1px solid ${color}44` }}>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
              {CURRENCY_FLAG[r.currencyType] ?? ''} {r.currencyType}
            </div>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>
              {r.denomination}
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      {item.status === 'done' && r && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, wordBreak: 'break-all' }}>📎 {item.file.name}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'DM Mono,monospace', color }}>{r.denomination}</div>
              {r.valueVnd && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>≈ {getConverted(r)}</div>}
            </div>
            {r.isFake && (
              <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>⚠️</div>
                <div style={{ fontSize: 10, color: '#ff6b6b', fontWeight: 700, marginTop: 2 }}>FAKE</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Độ chính xác</span>
              <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'DM Mono,monospace' }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${color}66` }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 20, color }}>
              {CURRENCY_FLAG[r.currencyType] ?? ''} {r.currencyType}
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)' }}>
              {r.authenticity === 'real' ? '✅ Thật' : '❌ Giả'}
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)', fontFamily: 'DM Mono,monospace' }}>
              {r.className}
            </span>
          </div>

          {r.isFake && (
            <div style={{ marginTop: 12, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 13, color: '#ff6b6b', fontWeight: 600, lineHeight: 1.5 }}>{r.warningMessage}</div>
            </div>
          )}
        </div>
      )}

      {item.status === 'error' && (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>😞</div>
          <div style={{ fontSize: 13, color: 'var(--accent3)', marginBottom: 12 }}>{item.error}</div>
          <button onClick={() => retryItem(item)} style={{ padding: '8px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            🔄 Thử lại
          </button>
        </div>
      )}
    </div>
  );
}