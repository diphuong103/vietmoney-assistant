import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import travelPlanApi from '../../api/travelPlanApi';
import dayjs from 'dayjs';

const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hội An', 'Huế', 'Nha Trang', 'Phú Quốc', 'Hạ Long', 'Cần Thơ', 'Đà Lạt'];
const CURRENCIES = ['VND', 'USD', 'KRW', 'JPY', 'CNY', 'EUR'];

// ── Mock Initial Schedules ──────────────────────────────────────────────────
const mockScheduleData = [
  { time: '08:00', location: 'Khách sạn', cost: '0đ', activity: 'Ăn sáng tại khách sạn, chuẩn bị khởi hành.' },
  { time: '09:30', location: 'Bảo tàng & Di tích', cost: '150,000đ', activity: 'Tham quan khám phá lịch sử địa phương.' },
  { time: '12:00', location: 'Nhà hàng địa phương', cost: '300,000đ', activity: 'Ăn trưa đặc sản.' },
  { time: '14:30', location: 'Bãi biển / Chợ', cost: '200,000đ', activity: 'Tự do tham quan, mua sắm đồ lưu niệm.' },
  { time: '19:00', location: 'Phố đi bộ', cost: '500,000đ', activity: 'Ăn tối và dạo phố về đêm.' },
];

export default function TravelPlanPage({ embedded = false }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State Cho Kế Hoạch Chi Tiết 
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [scheduleByDay, setScheduleByDay] = useState({});
  const [savingItinerary, setSavingItinerary] = useState(false);

  // Inline Edit Task State
  const [editingTask, setEditingTask] = useState(null); // { day, idx }
  const [taskForm, setTaskForm] = useState({ time: '', location: '', activity: '', cost: '' });

  // Form State
  const [form, setForm] = useState({
    title: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'VND', numberOfPeople: '1'
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await travelPlanApi.getMyPlans();
      setPlans(res.data?.data ?? []);
    } catch {
      // Mock data in case API fails
      if (plans.length === 0) {
        setPlans([
          { id: '1', title: 'Đà Nẵng 3N2Đ', destination: 'Đà Nẵng', startDate: '2026-05-10', endDate: '2026-05-12', budget: '5,000,000', currency: 'VND', numberOfPeople: '2' },
          { id: '2', title: 'Hội An Cuối Tuần', destination: 'Hội An', startDate: '2026-06-05', endDate: '2026-06-06', budget: '2,000,000', currency: 'VND', numberOfPeople: '4' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  // Khi chọn một plan, load itinerary từ API hoặc khởi tạo mock schedule
  useEffect(() => {
    if (selectedPlan) {
      const start = dayjs(selectedPlan.startDate);
      const end = dayjs(selectedPlan.endDate);
      const daysCount = (selectedPlan.startDate && selectedPlan.endDate) ? end.diff(start, 'day') + 1 : 3;
      const dayArr = Array.from({ length: daysCount > 0 ? daysCount : 1 }).map((_, i) => i + 1);

      // Nếu plan đã có itinerary từ DB → load
      let savedItinerary = null;
      if (selectedPlan.itinerary) {
        try {
          savedItinerary = typeof selectedPlan.itinerary === 'string'
            ? JSON.parse(selectedPlan.itinerary)
            : selectedPlan.itinerary;
        } catch { savedItinerary = null; }
      }

      const initial = {};
      dayArr.forEach(d => {
        initial[d] = savedItinerary && savedItinerary[d]
          ? JSON.parse(JSON.stringify(savedItinerary[d]))
          : JSON.parse(JSON.stringify(mockScheduleData));
      });
      setScheduleByDay(initial);
      setEditingTask(null);
    }
  }, [selectedPlan]);

  const handleCreateOrUpdate = async () => {
    if (!form.title.trim() || !form.destination) return;
    try {
      const payload = {
        title: form.title,
        destination: form.destination,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        budget: form.budget || null,
        currency: form.currency || 'VND',
        numberOfPeople: parseInt(form.numberOfPeople) || 1,
      };
      if (editingId) {
        try {
          const res = await travelPlanApi.updatePlan(editingId, payload);
          const updated = res.data?.data ?? { id: editingId, ...payload };
          setPlans(prev => prev.map(p => p.id === editingId ? updated : p));
        } catch {
          setPlans(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p));
        }
      } else {
        try {
          const res = await travelPlanApi.createPlan(payload);
          const created = res.data?.data ?? { id: Date.now().toString(), ...payload };
          setPlans(prev => [created, ...prev]);
        } catch {
          setPlans(prev => [{ id: Date.now().toString(), ...payload }, ...prev]);
        }
      }
      setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'VND', numberOfPeople: '1' });
      setShowForm(false);
      setEditingId(null);
    } catch { }
  };

  // Lưu lịch trình chi tiết qua API
  const handleSaveItinerary = async () => {
    if (!selectedPlan) return;
    setSavingItinerary(true);
    try {
      const payload = {
        title: selectedPlan.title,
        destination: selectedPlan.destination,
        startDate: selectedPlan.startDate,
        endDate: selectedPlan.endDate,
        budget: selectedPlan.budget,
        currency: selectedPlan.currency || 'VND',
        numberOfPeople: parseInt(selectedPlan.numberOfPeople) || 1,
        itinerary: JSON.stringify(scheduleByDay),
      };
      const res = await travelPlanApi.updatePlan(selectedPlan.id, payload);
      const updated = res.data?.data ?? { ...selectedPlan, itinerary: JSON.stringify(scheduleByDay) };
      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? updated : p));
      setSelectedPlan(updated);
      alert('✅ Đã lưu lịch trình thành công!');
    } catch {
      alert('❌ Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSavingItinerary(false);
    }
  };

  const handleEdit = (plan, e) => {
    e.stopPropagation();
    setForm({
      title: plan.title || '',
      destination: plan.destination || '',
      startDate: plan.startDate || '',
      endDate: plan.endDate || '',
      budget: plan.budget || '',
      currency: plan.currency || 'VND',
      numberOfPeople: plan.numberOfPeople || '1'
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;
    try {
      await travelPlanApi.deletePlan(id);
    } catch { }
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleViewDetail = (plan) => {
    setSelectedPlan(plan);
  };

  // Schedule task edit hooks
  const startEditTask = (day, idx, task) => {
    setEditingTask({ day, idx });
    setTaskForm({ ...task });
  };

  const saveTask = () => {
    if (!editingTask) return;
    const { day, idx } = editingTask;
    setScheduleByDay(prev => {
      const next = { ...prev };
      next[day] = [...next[day]];
      next[day][idx] = { ...taskForm };
      return next;
    });
    setEditingTask(null);
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

  // ── Render Schedule Detail View ───────────────────────────────────────────
  if (selectedPlan) {
    const dayItems = Object.keys(scheduleByDay).map(Number);

    return (
      <div className="page active" id="page-plans-detail">
        {!embedded && (
          <Navbar
            title={<><span style={{ color: 'var(--muted)', cursor: 'pointer' }} onClick={() => setSelectedPlan(null)}>Plans / </span><span style={{ color: 'var(--accent)' }}>{selectedPlan.title}</span></>}
            actions={<button className="icon-btn" onClick={() => setSelectedPlan(null)}>✕</button>}
          />
        )}

        <div style={{ padding: embedded ? '0' : '16px 20px', overflowY: 'auto', flex: 1, paddingBottom: 100 }}>
          {embedded && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={() => setSelectedPlan(null)} style={{ background: 'none', color: 'var(--text)', fontSize: 24, marginRight: 10 }}>←</button>
              <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif' }}>{selectedPlan.title}</h3>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>📍 {selectedPlan.destination}</span>
            {selectedPlan.budget && <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>💰 {selectedPlan.budget} {selectedPlan.currency}</span>}
            <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>👨‍👩‍👧‍👦 {selectedPlan.numberOfPeople} Người</span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(200,242,61,0.1), rgba(61,242,200,0.1))',
            border: '1px solid rgba(200,242,61,0.3)',
            borderRadius: 16, padding: 16, marginBottom: 24, textAlign: 'center'
          }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Hệ thống sẽ dựa vào thời gian, địa điểm và ngân sách để tự động tạo lịch trình phù hợp nhất.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{
                background: 'var(--accent)', color: '#000', fontWeight: 700,
                padding: '10px 20px', borderRadius: 24, fontSize: 14, fontFamily: 'Syne, sans-serif',
                boxShadow: '0 4px 12px rgba(200,242,61,0.3)'
              }}>
                ✨ AI Lên Lịch Tự Động
              </button>
              <button
                onClick={handleSaveItinerary}
                disabled={savingItinerary}
                style={{
                  background: savingItinerary ? 'var(--bg3)' : 'rgba(61,143,242,0.9)', color: '#fff', fontWeight: 700,
                  padding: '10px 20px', borderRadius: 24, fontSize: 14, fontFamily: 'Syne, sans-serif',
                  boxShadow: '0 4px 12px rgba(61,143,242,0.3)', border: 'none', cursor: savingItinerary ? 'not-allowed' : 'pointer'
                }}>
                {savingItinerary ? '⏳ Đang lưu...' : '💾 Lưu Lịch Trình'}
              </button>
            </div>
          </div>

          <h4 style={{ fontFamily: 'Syne, sans-serif', marginBottom: 16, color: 'var(--muted)' }}>LỊCH TRÌNH CHI TIẾT</h4>

          {dayItems.map(day => (
            <div key={day} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 16, marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Ngày {day}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={{ background: 'rgba(61,143,242,0.15)', color: 'var(--blue)', border: 'none', borderRadius: 12, padding: '4px 8px', fontSize: 11, fontWeight: 600 }}>
                    🔔 Nhắc nhở
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {scheduleByDay[day].map((task, idx) => {
                  const isEditing = editingTask?.day === day && editingTask?.idx === idx;

                  if (isEditing) {
                    return (
                      <div key={idx} style={{ background: 'var(--bg3)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input style={{ ...inputStyle, flex: 1, padding: '6px 10px' }} placeholder="Giờ" value={taskForm.time} onChange={e => setTaskForm({ ...taskForm, time: e.target.value })} />
                          <input style={{ ...inputStyle, flex: 2, padding: '6px 10px' }} placeholder="Địa điểm" value={taskForm.location} onChange={e => setTaskForm({ ...taskForm, location: e.target.value })} />
                        </div>
                        <input style={{ ...inputStyle, marginBottom: 8, padding: '6px 10px' }} placeholder="Hoạt động" value={taskForm.activity} onChange={e => setTaskForm({ ...taskForm, activity: e.target.value })} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input style={{ ...inputStyle, flex: 1, padding: '6px 10px' }} placeholder="Chi phí dự kiến" value={taskForm.cost} onChange={e => setTaskForm({ ...taskForm, cost: e.target.value })} />
                          <button onClick={saveTask} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}>Cập nhật</button>
                          <button onClick={() => setEditingTask(null)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none' }}>Hủy</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} style={{ display: 'flex', gap: 12, position: 'relative' }} className="schedule-task-item">
                      <div style={{ width: 40, flexShrink: 0, fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                        {task.time}
                      </div>
                      <div style={{ flex: 1, paddingRight: 24 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{task.location}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{task.activity}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent3)' }}>Dự kiến: {task.cost}</div>
                      </div>
                      {/* Nút sửa nhanh */}
                      <button
                        onClick={() => startEditTask(day, idx, task)}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', color: 'var(--blue)', fontSize: 14, padding: 4 }}
                        title="Chỉnh sửa lịch trình ngày này"
                      >✏️</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      </div>
    );
  }

  // ── Render Plans List & Form ──────────────────────────────────────────────
  const content = (
    <>
      {/* Create form toggle (embedded header) */}
      {embedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            className="icon-btn"
            onClick={() => { setShowForm(v => !v); setEditingId(null); setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'VND', numberOfPeople: '1' }) }}
            style={{ fontSize: 18 }}
          >{showForm ? '✕' : '➕'}</button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{
          marginBottom: 12, padding: 16,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>
            ✈️ {editingId ? 'Sửa kế hoạch' : 'Kế hoạch mới'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Tên plan (vd: Đà Nẵng 3N2Đ)"
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

            {/* Row Ngân sách & Loại tiền tệ */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Ngân sách dự kiến (vd: 5,000,000)"
                value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                style={{ ...inputStyle, flex: 2 }}
              />
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Số người đi cùng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', width: 110 }}>Số người đii:</span>
              <input
                type="number" min="1"
                placeholder="Số người"
                value={form.numberOfPeople} onChange={e => setForm(f => ({ ...f, numberOfPeople: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            <button
              onClick={handleCreateOrUpdate}
              style={{
                padding: '11px', background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, fontFamily: 'Syne, sans-serif',
                marginTop: 4
              }}
            >{editingId ? 'Cập nhật' : 'Tạo kế hoạch'}</button>
          </div>
        </div>
      )}

      {/* CHỈ Hiển thị list plan bên ngoài nếu Không Mở form */}
      {!showForm && (
        <div className="plans-container" style={{ padding: embedded ? '0' : '12px 20px', paddingBottom: embedded ? 20 : 100 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              <div style={{ fontSize: 28, animation: 'pulse 1.5s infinite' }}>✈️</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải...</div>
            </div>
          )}

          {!loading && plans.length === 0 && (
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
              <div className="plan-card" key={plan.id} onClick={() => handleViewDetail(plan)} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 16, margin: '0 0 12px 0', cursor: 'pointer',
                transition: 'background 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="plan-title" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                      {plan.title}
                    </div>
                    <div className="plan-date" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {plan.startDate && plan.endDate
                        ? `${dayjs(plan.startDate).format('DD/MM')} – ${dayjs(plan.endDate).format('DD/MM/YYYY')}`
                        : 'Chưa xác định thời gian'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => handleEdit(plan, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 14 }}
                      title="Sửa"
                    >✏️</button>
                    <button
                      onClick={(e) => handleDelete(plan.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent3)', fontSize: 14 }}
                      title="Xóa"
                    >🗑️</button>
                  </div>
                </div>

                <div className="plan-info" style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                  <span>📍 {plan.destination}</span>
                  {plan.numberOfPeople && <span>👨‍👩‍👧‍👦 {plan.numberOfPeople}</span>}
                </div>

                {plan.budget && (
                  <div className="plan-budget" style={{ marginTop: 6, fontSize: 13 }}>
                    Ngân sách: <b style={{ color: 'var(--accent)' }}>{plan.budget} {plan.currency || 'VND'}</b>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
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
            onClick={() => { setShowForm(v => !v); setEditingId(null); setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'VND', numberOfPeople: '1' }) }}
            style={{ fontSize: 18 }}
          >{showForm ? '✕' : '➕'}</button>
        }
      />
      {content}
    </div>
  );
}
