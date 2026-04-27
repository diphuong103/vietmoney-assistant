import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import travelPlanApi from '../../api/travelPlanApi';
import dayjs from 'dayjs';

/* ── Constants ─────────────────────────────────────────────────────────── */
const CURRENCIES = ['VND', 'USD', 'KRW', 'JPY', 'CNY', 'EUR'];

const EMPTY_FORM = {
  title: '', destination: '', startDate: '', endDate: '',
  budget: '', currency: 'VND', numberOfPeople: '1',
};

/* ── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: t.type === 'success' ? '#22c55e' : t.type === 'error' ? '#ef4444' : '#3b82f6',
          color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: 300,
        }}>
          {t.type === 'success' ? '✅ ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}{t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

/* ── Shared styles ──────────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%', background: 'var(--bg3)',
  border: '1px solid var(--border)', borderRadius: 10,
  color: 'var(--text)', padding: '10px 12px', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
function calcProgress(plan) {
  if (!plan.startDate || !plan.endDate) return 0;
  const start = dayjs(plan.startDate);
  const end   = dayjs(plan.endDate);
  const now   = dayjs();
  if (now.isBefore(start)) return 0;
  if (now.isAfter(end))    return 100;
  return Math.round((now.diff(start, 'day') / (end.diff(start, 'day') || 1)) * 100);
}

// Chuẩn hoá 1 item từ DB field names → frontend field names
function normalizeItem(item) {
  return {
    id:       item.id,
    time:     item.timeSlot      ?? item.time     ?? '',
    location: item.location      ?? '',
    activity: item.description   ?? item.activity ?? '',
    cost:     item.estimatedCost ?? item.cost     ?? '',
  };
}

// Chuẩn hoá scheduleByDay từ API getSchedule (DB)
function normalizeScheduleFromApi(grouped) {
  const result = {};
  Object.keys(grouped).forEach(k => {
    result[parseInt(k)] = grouped[k].map(normalizeItem);
  });
  return result;
}

// Chuẩn hoá scheduleByDay từ AI suggest response
function normalizeScheduleFromAi(itinerary) {
  const result = {};
  Object.keys(itinerary).forEach(k => {
    const day = parseInt(k);
    result[day] = (itinerary[k] ?? []).map(item => ({
      time:     item.time      ?? item.timeSlot      ?? '',
      location: item.location  ?? '',
      activity: item.activity  ?? item.description   ?? '',
      cost:     item.cost      ?? item.estimatedCost ?? '',
    }));
  });
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function TravelPlanPage({ embedded = false }) {
  const { toasts, show: showToast } = useToast();

  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);

  const [selectedPlan,    setSelectedPlan]    = useState(null);
  const [scheduleByDay,   setScheduleByDay]   = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const [editingTask, setEditingTask] = useState(null);
  const [taskForm,    setTaskForm]    = useState({ time: '', location: '', activity: '', cost: '' });

  /* ── Fetch plans list ────────────────────────────────────────────────── */
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await travelPlanApi.getAll();
      setPlans(res.data?.data ?? []);
    } catch (err) {
      console.error('fetchPlans:', err);
      showToast('Không tải được danh sách kế hoạch', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Load schedule khi chọn 1 plan ──────────────────────────────────── */
  useEffect(() => {
    if (!selectedPlan) return;
    setScheduleByDay({});
    setAiSummary('');
    setEditingTask(null);
    setScheduleLoading(true);

    travelPlanApi.getSchedule(selectedPlan.id)
      .then(res => {
        const grouped    = res.data?.data?.scheduleByDay ?? {};
        const normalized = normalizeScheduleFromApi(grouped);
        setScheduleByDay(normalized);
      })
      .catch(err => {
        console.error('getSchedule:', err);
        setScheduleByDay({});
      })
      .finally(() => setScheduleLoading(false));
  }, [selectedPlan]);

  /* ── Form helpers ────────────────────────────────────────────────────── */
  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };

  const openEdit = (plan, e) => {
    e.stopPropagation();
    setForm({
      title:          plan.title          || '',
      destination:    plan.destination    || '',
      startDate:      plan.startDate      || '',
      endDate:        plan.endDate        || '',
      budget:         plan.budget         || '',
      currency:       plan.currency       || 'VND',
      numberOfPeople: String(plan.numberOfPeople ?? 1),
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  /* ── CRUD ────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!form.title.trim())       { showToast('Vui lòng nhập tên kế hoạch', 'error'); return; }
    if (!form.destination.trim()) { showToast('Vui lòng nhập điểm đến', 'error'); return; }

    const payload = {
      title:          form.title.trim(),
      destination:    form.destination.trim(),
      startDate:      form.startDate  || null,
      endDate:        form.endDate    || null,
      budget:         form.budget     || null,
      currency:       form.currency,
      numberOfPeople: parseInt(form.numberOfPeople) || 1,
    };

    setSaving(true);
    try {
      if (editingId) {
        const res     = await travelPlanApi.update(editingId, payload);
        const updated = res.data?.data ?? { id: editingId, ...payload };
        setPlans(prev => prev.map(p => p.id === editingId ? updated : p));
        showToast('Đã cập nhật kế hoạch!');
      } else {
        const res     = await travelPlanApi.create(payload);
        const created = res.data?.data ?? { id: String(Date.now()), ...payload };
        setPlans(prev => [created, ...prev]);
        showToast('Đã tạo kế hoạch mới!');
      }
      closeForm();
    } catch (err) {
      console.error('submit:', err);
      showToast('Lưu thất bại, vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;
    try { await travelPlanApi.delete(id); } catch (err) { console.error('delete:', err); }
    setPlans(prev => prev.filter(p => p.id !== id));
    showToast('Đã xóa kế hoạch.');
  };

  /* ── AI Suggest ──────────────────────────────────────────────────────── */
  const handleAiSuggest = async () => {
    if (!selectedPlan?.destination) { showToast('Kế hoạch cần có điểm đến!', 'error'); return; }
    if (!selectedPlan?.budget)      { showToast('Kế hoạch cần có ngân sách!', 'error'); return; }

    setAiLoading(true);
    setAiSummary('');

    try {
      const res  = await travelPlanApi.aiSuggest(selectedPlan.id);
      const data = res.data?.data;

      if (!data?.itinerary || Object.keys(data.itinerary).length === 0) {
        showToast('AI không tạo được lịch trình, thử lại nhé.', 'error');
        return;
      }

      // Chuẩn hoá → set state → render ngay lập tức
      const normalized = normalizeScheduleFromAi(data.itinerary);
      setScheduleByDay(normalized);

      const summaryText = [
        data.summary,
        data.totalEstimatedCost ? `Tổng dự kiến: ${data.totalEstimatedCost}` : '',
      ].filter(Boolean).join(' | ');
      setAiSummary(summaryText);

      showToast(`✨ AI đã tạo lịch ${Object.keys(normalized).length} ngày! Chỉnh sửa tùy ý rồi bấm Lưu.`);
    } catch (err) {
      console.error('aiSuggest:', err);
      showToast('AI gặp lỗi, vui lòng thử lại.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Save itinerary ──────────────────────────────────────────────────── */
  const handleSaveItinerary = async () => {
    if (!selectedPlan) return;
    if (Object.keys(scheduleByDay).length === 0) {
      showToast('Chưa có lịch trình. Hãy dùng AI tạo trước!', 'error');
      return;
    }
    setSavingItinerary(true);
    try {
      const payload = {
        title:          selectedPlan.title,
        destination:    selectedPlan.destination,
        startDate:      selectedPlan.startDate,
        endDate:        selectedPlan.endDate,
        budget:         selectedPlan.budget,
        currency:       selectedPlan.currency || 'VND',
        numberOfPeople: parseInt(selectedPlan.numberOfPeople) || 1,
        itinerary:      scheduleByDay,
      };
      const res     = await travelPlanApi.update(selectedPlan.id, payload);
      const updated = res.data?.data ?? { ...selectedPlan };
      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? updated : p));
      setSelectedPlan(updated);
      showToast('Đã lưu lịch trình thành công!');
    } catch (err) {
      console.error('saveItinerary:', err);
      showToast('Lưu thất bại, vui lòng thử lại.', 'error');
    } finally {
      setSavingItinerary(false);
    }
  };

  /* ── Task CRUD ───────────────────────────────────────────────────────── */
  const startEditTask = (day, idx, task) => { setEditingTask({ day, idx }); setTaskForm({ ...task }); };

  const saveTask = () => {
    if (!editingTask) return;
    const { day, idx } = editingTask;
    setScheduleByDay(prev => {
      const next = { ...prev, [day]: [...prev[day]] };
      next[day][idx] = { ...taskForm };
      return next;
    });
    setEditingTask(null);
  };

  const addTaskToDay = (day) => {
    setScheduleByDay(prev => ({
      ...prev,
      [day]: [...(prev[day] ?? []), { time: '', location: 'Địa điểm mới', activity: 'Hoạt động mới', cost: '0đ' }],
    }));
  };

  const deleteTask = (day, idx) => {
    setScheduleByDay(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }));
  };

  /* ════════════════════════════════════════════════════════════════════════
     RENDER — Detail View
  ════════════════════════════════════════════════════════════════════════ */
  if (selectedPlan) {
    const dayItems  = Object.keys(scheduleByDay).map(Number).sort((a, b) => a - b);
    const hasSchedule = dayItems.length > 0;

    return (
      <div className="page active" id="page-plans-detail">
        <Toast toasts={toasts} />

        {!embedded && (
          <Navbar
            title={
              <>
                <span style={{ color: 'var(--muted)', cursor: 'pointer' }} onClick={() => setSelectedPlan(null)}>Plans / </span>
                <span style={{ color: 'var(--accent)' }}>{selectedPlan.title}</span>
              </>
            }
            actions={<button className="icon-btn" onClick={() => setSelectedPlan(null)}>✕</button>}
          />
        )}

        <div style={{ padding: embedded ? '0' : '16px 20px', overflowY: 'auto', flex: 1, paddingBottom: 100 }}>
          {embedded && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={() => setSelectedPlan(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 24, marginRight: 10, cursor: 'pointer' }}>←</button>
              <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif' }}>{selectedPlan.title}</h3>
            </div>
          )}

          {/* Info badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {selectedPlan.destination && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>📍 {selectedPlan.destination}</span>
            )}
            {selectedPlan.budget && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>💰 {selectedPlan.budget} {selectedPlan.currency || 'VND'}</span>
            )}
            {selectedPlan.numberOfPeople && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>👨‍👩‍👧‍👦 {selectedPlan.numberOfPeople} người</span>
            )}
            {selectedPlan.startDate && selectedPlan.endDate && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>
                📅 {dayjs(selectedPlan.startDate).format('DD/MM')} – {dayjs(selectedPlan.endDate).format('DD/MM/YYYY')}
              </span>
            )}
          </div>

          {/* AI Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,242,61,0.1), rgba(61,242,200,0.1))',
            border: '1px solid rgba(200,242,61,0.3)',
            borderRadius: 16, padding: 16, marginBottom: 24, textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: aiSummary ? 10 : 12 }}>
              AI dựa vào <b>địa điểm</b>, <b>ngân sách</b> và <b>thời gian</b> để tạo lịch trình tối ưu.
            </p>

            {aiSummary && (
              <div style={{
                background: 'rgba(200,242,61,0.12)', border: '1px solid rgba(200,242,61,0.4)',
                borderRadius: 10, padding: '8px 14px', marginBottom: 12,
                fontSize: 13, color: 'var(--text)', textAlign: 'left', lineHeight: 1.6,
              }}>
                💡 {aiSummary}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleAiSuggest} disabled={aiLoading}
                style={{
                  background: aiLoading ? 'var(--bg3)' : 'var(--accent)',
                  color: aiLoading ? 'var(--muted)' : '#000',
                  fontWeight: 700, padding: '10px 20px', borderRadius: 24, fontSize: 14,
                  fontFamily: 'Syne, sans-serif', border: 'none',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  boxShadow: aiLoading ? 'none' : '0 4px 12px rgba(200,242,61,0.35)',
                  transition: 'all 0.2s',
                }}>
                {aiLoading ? '⏳ AI đang lên lịch...' : '✨ AI Lên Lịch Tự Động'}
              </button>

              <button onClick={handleSaveItinerary} disabled={savingItinerary || !hasSchedule}
                style={{
                  background: (savingItinerary || !hasSchedule) ? 'var(--bg3)' : 'rgba(61,143,242,0.9)',
                  color: (savingItinerary || !hasSchedule) ? 'var(--muted)' : '#fff',
                  fontWeight: 700, padding: '10px 20px', borderRadius: 24, fontSize: 14,
                  fontFamily: 'Syne, sans-serif', border: 'none',
                  cursor: (savingItinerary || !hasSchedule) ? 'not-allowed' : 'pointer',
                  boxShadow: hasSchedule ? '0 4px 12px rgba(61,143,242,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>
                {savingItinerary ? '⏳ Đang lưu...' : '💾 Lưu Lịch Trình'}
              </button>
            </div>
          </div>

          {/* Schedule loading */}
          {scheduleLoading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Đang tải lịch trình...</div>
            </div>
          )}

          {/* AI đang xử lý */}
          {!scheduleLoading && aiLoading && (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              background: 'var(--bg2)', border: '1px solid rgba(200,242,61,0.3)',
              borderRadius: 16, color: 'var(--muted)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>AI đang phân tích...</p>
              <p style={{ fontSize: 13 }}>
                Đang lên lịch tại <b>{selectedPlan.destination}</b> với ngân sách <b>{selectedPlan.budget} {selectedPlan.currency || 'VND'}</b>
              </p>
            </div>
          )}

          {/* Empty — chưa có schedule và không đang loading */}
          {!scheduleLoading && !aiLoading && !hasSchedule && (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              background: 'var(--bg2)', border: '1px dashed var(--border)',
              borderRadius: 16, color: 'var(--muted)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Chưa có lịch trình</p>
              <p style={{ fontSize: 13 }}>
                Bấm <b style={{ color: 'var(--accent)' }}>✨ AI Lên Lịch Tự Động</b> để tạo gợi ý ngay!
              </p>
            </div>
          )}

          {/* Schedule list */}
          {!scheduleLoading && !aiLoading && hasSchedule && (
            <>
              <h4 style={{ fontFamily: 'Syne, sans-serif', marginBottom: 16, color: 'var(--muted)', fontSize: 12, letterSpacing: 1 }}>
                LỊCH TRÌNH CHI TIẾT — {dayItems.length} NGÀY
              </h4>

              {dayItems.map(day => (
                <div key={day} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>

                  {/* Day header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
                      Ngày {day}
                      {selectedPlan.startDate && (
                        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>
                          ({dayjs(selectedPlan.startDate).add(day - 1, 'day').format('DD/MM/YYYY')})
                        </span>
                      )}
                    </div>
                    <button onClick={() => addTaskToDay(day)}
                      style={{ background: 'rgba(200,242,61,0.15)', color: 'var(--accent)', border: '1px solid rgba(200,242,61,0.3)', borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      + Thêm
                    </button>
                  </div>

                  {/* Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(scheduleByDay[day] ?? []).map((task, idx) => {
                      const isEditing = editingTask?.day === day && editingTask?.idx === idx;

                      if (isEditing) {
                        return (
                          <div key={idx} style={{ background: 'var(--bg3)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                              <input style={{ ...inputStyle, flex: 1, padding: '6px 10px' }}
                                placeholder="Giờ (08:00)" value={taskForm.time}
                                onChange={e => setTaskForm(f => ({ ...f, time: e.target.value }))} />
                              <input style={{ ...inputStyle, flex: 2, padding: '6px 10px' }}
                                placeholder="Địa điểm" value={taskForm.location}
                                onChange={e => setTaskForm(f => ({ ...f, location: e.target.value }))} />
                            </div>
                            <input style={{ ...inputStyle, marginBottom: 8, padding: '6px 10px' }}
                              placeholder="Hoạt động" value={taskForm.activity}
                              onChange={e => setTaskForm(f => ({ ...f, activity: e.target.value }))} />
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input style={{ ...inputStyle, flex: 1, padding: '6px 10px' }}
                                placeholder="Chi phí (150,000đ)" value={taskForm.cost}
                                onChange={e => setTaskForm(f => ({ ...f, cost: e.target.value }))} />
                              <button onClick={saveTask}
                                style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Cập nhật
                              </button>
                              <button onClick={() => setEditingTask(null)}
                                style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                                Hủy
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 44, flexShrink: 0, fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>
                            {task.time || '--:--'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{task.location}</div>
                            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{task.activity}</div>
                            <div style={{ fontSize: 12, color: 'var(--accent3)', fontWeight: 500 }}>💸 {task.cost}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                            <button onClick={() => startEditTask(day, idx, task)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--blue)', fontSize: 13, padding: '2px 4px', cursor: 'pointer' }} title="Sửa">✏️</button>
                            <button onClick={() => deleteTask(day, idx)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent3)', fontSize: 13, padding: '2px 4px', cursor: 'pointer' }} title="Xóa">🗑️</button>
                          </div>
                        </div>
                      );
                    })}

                    {(scheduleByDay[day] ?? []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--muted)', fontSize: 13 }}>
                        Chưa có hoạt động. Bấm <b>+ Thêm</b> để thêm.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER — List & Form
  ════════════════════════════════════════════════════════════════════════ */
  const content = (
    <>
      <Toast toasts={toasts} />

      {embedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button className="icon-btn" onClick={() => showForm ? closeForm() : openCreate()} style={{ fontSize: 18 }}>
            {showForm ? '✕' : '➕'}
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: 12, padding: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>
            ✈️ {editingId ? 'Sửa kế hoạch' : 'Kế hoạch mới'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <input
              placeholder="Tên kế hoạch * (VD: Hà Nội Tuần Trăng Mật)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={inputStyle}
            />

            {/* Input tự gõ — không giới hạn dropdown */}
            <input
              placeholder="Điểm đến * (VD: Hà Nội, Đà Nẵng, Phú Quốc, Sapa...)"
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ngày bắt đầu</label>
                <input type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ngày kết thúc</label>
                <input type="date" value={form.endDate} min={form.startDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Ngân sách (VD: 15,000,000)"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                style={{ ...inputStyle, flex: 2 }}
              />
              <select value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Số người đi:</span>
              <input type="number" min="1" max="50" placeholder="1"
                value={form.numberOfPeople}
                onChange={e => setForm(f => ({ ...f, numberOfPeople: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} />
            </div>

            <button onClick={handleSubmit} disabled={saving}
              style={{
                padding: '11px', background: saving ? 'var(--bg3)' : 'var(--accent)',
                color: saving ? 'var(--muted)' : '#000',
                border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 14, fontFamily: 'Syne, sans-serif', marginTop: 4,
              }}>
              {saving ? '⏳ Đang lưu...' : editingId ? 'Cập nhật kế hoạch' : 'Tạo kế hoạch'}
            </button>
          </div>
        </div>
      )}

      {(!showForm || !embedded) && (
        <div style={{ padding: embedded ? '0' : '12px 20px', paddingBottom: embedded ? 20 : 100 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              <div style={{ fontSize: 28 }}>✈️</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải...</div>
            </div>
          )}

          {!loading && plans.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 48 }}>✈️</span>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Chưa có kế hoạch nào</p>
              <p style={{ fontSize: 13 }}>Bấm ➕ để tạo kế hoạch du lịch mới.</p>
            </div>
          )}

          {plans.map(plan => {
            const progress = calcProgress(plan);
            return (
              <div key={plan.id}
                onClick={() => { if (!showForm) setSelectedPlan(plan); }}
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {plan.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {plan.startDate && plan.endDate
                        ? `${dayjs(plan.startDate).format('DD/MM')} – ${dayjs(plan.endDate).format('DD/MM/YYYY')}`
                        : 'Chưa xác định thời gian'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    <button onClick={e => openEdit(plan, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 15, padding: '4px 6px' }} title="Sửa">✏️</button>
                    <button onClick={e => handleDelete(plan.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent3)', fontSize: 15, padding: '4px 6px' }} title="Xóa">🗑️</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
                  {plan.destination && <span>📍 {plan.destination}</span>}
                  {plan.numberOfPeople && <span>👨‍👩‍👧‍👦 {plan.numberOfPeople} người</span>}
                </div>

                {plan.budget && (
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    Ngân sách: <b style={{ color: 'var(--accent)' }}>{plan.budget} {plan.currency || 'VND'}</b>
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#22c55e' : 'var(--accent)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  {progress > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                      {progress === 100 ? '✅ Đã hoàn thành' : `${progress}% thời gian đã qua`}
                    </div>
                  )}
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
          <button className="icon-btn" onClick={() => showForm ? closeForm() : openCreate()} style={{ fontSize: 18 }}>
            {showForm ? '✕' : '➕'}
          </button>
        }
      />
      {content}
    </div>
  );
}