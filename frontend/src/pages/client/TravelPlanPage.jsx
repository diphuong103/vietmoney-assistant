import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import travelPlanApi from '../../api/travelPlanApi';
import dayjs from 'dayjs';

const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hội An', 'Huế', 'Nha Trang', 'Phú Quốc', 'Hạ Long', 'Cần Thơ', 'Đà Lạt'];

export default function TravelPlanPage({ embedded = false }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', destination: '', startDate: '', endDate: '', budget: '',
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await travelPlanApi.getMyPlans();
      setPlans(res.data?.data ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.destination) return;
    try {
      await travelPlanApi.createPlan({
        title: form.title,
        destination: form.destination,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        budget: form.budget || null,
      });
      setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '' });
      setShowForm(false);
      fetchPlans();
    } catch {
      // toast auto
    }
  };

  const handleDelete = async (id) => {
    try {
      await travelPlanApi.deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch { /* toast auto */ }
  };

  const calcProgress = (plan) => {
    if (!plan.startDate || !plan.endDate) return 0;
    const start = dayjs(plan.startDate);
    const end = dayjs(plan.endDate);
    const now = dayjs();
    if (now.isBefore(start)) return 0;
    if (now.isAfter(end)) return 100;
    const total = end.diff(start, 'day') || 1;
    const elapsed = now.diff(start, 'day');
    return Math.round((elapsed / total) * 100);
  };

  /* ── styles ─────────── */
  const inputStyle = {
    width: '100%', background: 'var(--bg3)',
    border: '1px solid var(--border)', borderRadius: 10,
    color: 'var(--text)', padding: '10px 12px', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const content = (
    <>
      {/* Create form toggle (embedded header) */}
      {embedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            className="icon-btn"
            onClick={() => setShowForm(v => !v)}
            style={{ fontSize: 18 }}
          >{showForm ? '✕' : '➕'}</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{
          marginBottom: 12, padding: 16,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>
            ✈️ Kế hoạch mới
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Tiêu đề (vd: Đà Nẵng 3N2Đ)"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={inputStyle}
            />
            <select
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">-- Chọn điểm đến --</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} />
              <input type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} />
            </div>
            <input
              placeholder="Ngân sách (vd: 5,000,000đ)"
              value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              style={inputStyle}
            />
            <button
              onClick={handleCreate}
              style={{
                padding: '11px', background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, fontFamily: 'Syne, sans-serif',
              }}
            >Tạo kế hoạch</button>
          </div>
        </div>
      )}

      <div className="plans-container" style={{ padding: embedded ? '0' : '12px 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, animation: 'pulse 1.5s infinite' }}>✈️</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải...</div>
          </div>
        )}

        {!loading && plans.length === 0 && !showForm && (
          <div style={{
            textAlign: 'center', padding: 40, color: 'var(--muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>✈️</span>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Chưa có kế hoạch nào</p>
            <p style={{ fontSize: 13 }}>Bấm ➕ để tạo kế hoạch du lịch mới.</p>
          </div>
        )}

        {plans.map((plan) => {
          const progress = calcProgress(plan);
          return (
            <div className="plan-card" key={plan.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 16, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="plan-title" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                    {plan.title}
                  </div>
                  <div className="plan-date" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {plan.startDate && plan.endDate
                      ? `${dayjs(plan.startDate).format('DD/MM')} – ${dayjs(plan.endDate).format('DD/MM/YYYY')}`
                      : 'Chưa xác định'}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(plan.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent3)', fontSize: 14 }}
                  title="Xóa"
                >🗑️</button>
              </div>
              <div className="plan-info" style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                <span>📍 {plan.destination}</span>
              </div>
              {plan.budget && (
                <div className="plan-budget" style={{ marginTop: 6, fontSize: 13 }}>
                  Ngân sách: <b style={{ color: 'var(--accent)' }}>{plan.budget}</b>
                </div>
              )}
              <div className="plan-progress" style={{ marginTop: 10 }}>
                <div className="progress-bar" style={{
                  background: 'var(--bg3)', borderRadius: 4, height: 4, overflow: 'hidden',
                }}>
                  <div className="progress-fill" style={{
                    width: `${progress}%`, height: '100%',
                    background: 'var(--accent)', borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div className="progress-label" style={{
                  fontSize: 11, color: 'var(--muted)', marginTop: 4,
                }}>
                  {progress === 0 ? 'Chưa bắt đầu' : progress === 100 ? 'Đã kết thúc' : `Đang diễn ra ${progress}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <div className="page active" id="page-plans">
      <Navbar
        title={<>Travel<span style={{ color: 'var(--accent)' }}>Plans</span></>}
        actions={
          <button
            className="icon-btn"
            onClick={() => setShowForm(v => !v)}
            style={{ fontSize: 18 }}
          >{showForm ? '✕' : '➕'}</button>
        }
      />
      {content}
    </div>
  );
}
