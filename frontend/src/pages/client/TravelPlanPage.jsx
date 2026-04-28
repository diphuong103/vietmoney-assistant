import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import travelPlanApi from '../../api/travelPlanApi';
import dayjs from 'dayjs';

/* ── Constants ─────────────────────────────────────────────────────────── */
const CURRENCIES = ['VND', 'USD', 'KRW', 'JPY', 'CNY', 'EUR'];

const EMPTY_PLAN_FORM = {
  title: '', destination: '', startDate: '', endDate: '',
  budget: '', currency: 'VND', numberOfPeople: '1',
};

const EMPTY_ITEM_FORM = {
  timeSlot: '', location: '', description: '', estimatedCost: '',
};

/* ── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: t.type === 'success' ? '#22c55e' : t.type === 'error' ? '#ef4444' : '#3b82f6',
          color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: 320,
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

const smInput = { ...inputStyle, padding: '8px 10px', fontSize: 13 };

/* ── Helpers ────────────────────────────────────────────────────────────── */
function calcProgress(plan) {
  if (!plan.startDate || !plan.endDate) return 0;
  const start = dayjs(plan.startDate), end = dayjs(plan.endDate), now = dayjs();
  if (now.isBefore(start)) return 0;
  if (now.isAfter(end))    return 100;
  return Math.round((now.diff(start, 'day') / (end.diff(start, 'day') || 1)) * 100);
}

function normalizeItem(item) {
  return {
    id:           item.id,
    timeSlot:     item.timeSlot      ?? item.time     ?? '',
    location:     item.location      ?? '',
    description:  item.description   ?? item.activity ?? '',
    estimatedCost:item.estimatedCost ?? item.cost     ?? '',
  };
}

function normalizeScheduleFromApi(grouped) {
  const result = {};
  Object.keys(grouped).forEach(k => {
    result[parseInt(k)] = (grouped[k] ?? []).map(normalizeItem);
  });
  return result;
}

function normalizeScheduleFromAi(itinerary) {
  const result = {};
  Object.keys(itinerary).forEach(k => {
    result[parseInt(k)] = (itinerary[k] ?? []).map(item => ({
      id:           null,
      timeSlot:     item.time      ?? item.timeSlot      ?? '',
      location:     item.location  ?? '',
      description:  item.activity  ?? item.description   ?? '',
      estimatedCost:item.cost      ?? item.estimatedCost ?? '',
    }));
  });
  return result;
}

// Tính số ngày từ startDate → endDate
function calcDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const diff = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
  return Math.max(diff, 1);
}

/* ─────────────────────────────────────────────────────────────────────────
   Item Form Modal — dùng cho cả Thêm và Sửa
───────────────────────────────────────────────────────────────────────── */
function ItemFormModal({ dayNumber, dateLabel, initialData, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initialData ?? EMPTY_ITEM_FORM);
  const isEdit = !!initialData?.id;

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)', borderRadius: 20,
          border: '1px solid var(--border)', width: '100%', maxWidth: 440,
          padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
              {isEdit ? '✏️ Sửa hoạt động' : '➕ Thêm hoạt động'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Ngày {dayNumber}{dateLabel ? ` · ${dateLabel}` : ''}
            </div>
          </div>
          <button onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Giờ + Địa điểm */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                🕐 Giờ *
              </label>
              <input
                type="time"
                value={form.timeSlot}
                onChange={f('timeSlot')}
                style={smInput}
                placeholder="08:00"
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                📍 Địa điểm *
              </label>
              <input
                value={form.location}
                onChange={f('location')}
                style={smInput}
                placeholder="VD: Hồ Hoàn Kiếm"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              📝 Mô tả hoạt động
            </label>
            <textarea
              value={form.description}
              onChange={f('description')}
              rows={3}
              style={{ ...smInput, resize: 'vertical', lineHeight: 1.5 }}
              placeholder="VD: Dạo bộ quanh hồ, chụp ảnh, thưởng thức cà phê trứng"
            />
          </div>

          {/* Chi phí */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              💸 Chi phí dự kiến
            </label>
            <input
              value={form.estimatedCost}
              onChange={f('estimatedCost')}
              style={smInput}
              placeholder="VD: 150,000đ hoặc 2 người: 300,000đ"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px', background: 'var(--bg3)',
              color: 'var(--muted)', border: 'none', borderRadius: 10,
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.timeSlot || !form.location.trim()}
            style={{
              flex: 2, padding: '11px',
              background: (saving || !form.timeSlot || !form.location.trim()) ? 'var(--bg3)' : 'var(--accent)',
              color: (saving || !form.timeSlot || !form.location.trim()) ? 'var(--muted)' : '#000',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
              fontFamily: 'Syne, sans-serif',
              cursor: (saving || !form.timeSlot || !form.location.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '⏳ Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm hoạt động'}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [form,      setForm]      = useState(EMPTY_PLAN_FORM);

  const [selectedPlan,    setSelectedPlan]    = useState(null);
  const [scheduleByDay,   setScheduleByDay]   = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // Modal state: { mode: 'add'|'edit', dayNumber, item? }
  const [modal,       setModal]       = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Confirm delete
  const [deletingItemId, setDeletingItemId] = useState(null);

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

  /* ── Load schedule từ DB khi chọn plan ──────────────────────────────── */
  const loadSchedule = useCallback(async (plan) => {
    if (!plan) return;
    setScheduleLoading(true);
    try {
      const res        = await travelPlanApi.getSchedule(plan.id);
      const grouped    = res.data?.data?.scheduleByDay ?? {};
      const normalized = normalizeScheduleFromApi(grouped);

      // Nếu DB chưa có → tạo khung trống theo số ngày
      if (Object.keys(normalized).length === 0 && plan.startDate && plan.endDate) {
        const days = calcDays(plan.startDate, plan.endDate);
        const empty = {};
        for (let d = 1; d <= days; d++) empty[d] = [];
        setScheduleByDay(empty);
      } else {
        setScheduleByDay(normalized);
      }
    } catch (err) {
      console.error('getSchedule:', err);
      // Tạo khung trống theo ngày
      if (plan.startDate && plan.endDate) {
        const days = calcDays(plan.startDate, plan.endDate);
        const empty = {};
        for (let d = 1; d <= days; d++) empty[d] = [];
        setScheduleByDay(empty);
      } else {
        setScheduleByDay({});
      }
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;
    setScheduleByDay({});
    setAiSummary('');
    setModal(null);
    loadSchedule(selectedPlan);
  }, [selectedPlan]);

  /* ── Plan form helpers ───────────────────────────────────────────────── */
  const openCreate = () => { setForm(EMPTY_PLAN_FORM); setEditingId(null); setShowForm(true); };
  const openEdit   = (plan, e) => {
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
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_PLAN_FORM); };

  /* ── Plan CRUD ───────────────────────────────────────────────────────── */
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
    try { await travelPlanApi.delete(id); } catch (err) { console.error(err); }
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

      if (data?.itinerary && Object.keys(data.itinerary).length > 0) {
        const normalized = normalizeScheduleFromAi(data.itinerary);
        setScheduleByDay(normalized);
        const summaryText = [
          data.summary,
          data.totalEstimatedCost ? `Tổng dự kiến: ${data.totalEstimatedCost}` : '',
        ].filter(Boolean).join(' | ');
        setAiSummary(summaryText);
        showToast(`✨ AI đã tạo lịch ${Object.keys(normalized).length} ngày!`);
      } else {
        // Reload từ DB (AI xử lý xong nhưng response bị timeout)
        await loadSchedule(selectedPlan);
        showToast('✨ AI đã tạo xong! Đang hiển thị kết quả.');
      }
    } catch (err) {
      console.error('aiSuggest:', err);
      // Timeout → thử reload từ DB
      try {
        await loadSchedule(selectedPlan);
        showToast('✨ AI đã tạo! Dữ liệu đã được tải từ server.');
      } catch {
        showToast('AI gặp lỗi, vui lòng thử lại.', 'error');
      }
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Schedule Item CRUD (gọi API thật) ──────────────────────────────── */

  // Mở modal Thêm
  const openAddModal = (dayNumber) => {
    setModal({ mode: 'add', dayNumber, item: { ...EMPTY_ITEM_FORM } });
  };

  // Mở modal Sửa
  const openEditModal = (dayNumber, item) => {
    setModal({ mode: 'edit', dayNumber, item: { ...item } });
  };

  // Lưu (Thêm hoặc Sửa)
  const handleSaveItem = async (formData) => {
    if (!modal) return;
    setModalSaving(true);

    const payload = {
      dayNumber:     modal.dayNumber,
      timeSlot:      formData.timeSlot,
      location:      formData.location.trim(),
      description:   formData.description?.trim() || '',
      estimatedCost: formData.estimatedCost?.trim() || '',
    };

    try {
      if (modal.mode === 'add') {
        // POST → API tạo mới
        const res  = await travelPlanApi.addItem(selectedPlan.id, payload);
        const saved = normalizeItem(res.data?.data ?? payload);

        setScheduleByDay(prev => ({
          ...prev,
          [modal.dayNumber]: [...(prev[modal.dayNumber] ?? []), saved],
        }));
        showToast('Đã thêm hoạt động!');

      } else {
        // PUT → API cập nhật
        const res   = await travelPlanApi.updateItem(selectedPlan.id, modal.item.id, payload);
        const saved = normalizeItem(res.data?.data ?? { id: modal.item.id, ...payload });

        setScheduleByDay(prev => ({
          ...prev,
          [modal.dayNumber]: prev[modal.dayNumber].map(it =>
            it.id === modal.item.id ? saved : it
          ),
        }));
        showToast('Đã cập nhật hoạt động!');
      }

      setModal(null);
    } catch (err) {
      console.error('saveItem:', err);
      showToast('Lưu thất bại, vui lòng thử lại.', 'error');
    } finally {
      setModalSaving(false);
    }
  };

  // Xóa item
  const handleDeleteItem = async (dayNumber, item) => {
    if (!window.confirm(`Xóa hoạt động "${item.location}"?`)) return;
    setDeletingItemId(item.id);
    try {
      if (item.id) {
        await travelPlanApi.deleteItem(selectedPlan.id, item.id);
      }
      setScheduleByDay(prev => ({
        ...prev,
        [dayNumber]: prev[dayNumber].filter(it => it !== item),
      }));
      showToast('Đã xóa hoạt động.');
    } catch (err) {
      console.error('deleteItem:', err);
      showToast('Xóa thất bại, vui lòng thử lại.', 'error');
    } finally {
      setDeletingItemId(null);
    }
  };

  /* ════════════════════════════════════════════════════════════════════════
     RENDER — Detail View
  ════════════════════════════════════════════════════════════════════════ */
  if (selectedPlan) {
    const totalDays   = calcDays(selectedPlan.startDate, selectedPlan.endDate) || Object.keys(scheduleByDay).length;
    const dayItems    = Array.from({ length: totalDays }, (_, i) => i + 1);
    const hasSchedule = Object.values(scheduleByDay).some(d => d.length > 0);

    return (
      <div className="page active" id="page-plans-detail">
        <Toast toasts={toasts} />

        {/* Item Form Modal */}
        {modal && (
          <ItemFormModal
            dayNumber={modal.dayNumber}
            dateLabel={
              selectedPlan.startDate
                ? dayjs(selectedPlan.startDate).add(modal.dayNumber - 1, 'day').format('DD/MM/YYYY')
                : null
            }
            initialData={modal.mode === 'edit' ? modal.item : null}
            onSave={handleSaveItem}
            onCancel={() => setModal(null)}
            saving={modalSaving}
          />
        )}

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
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>
                📍 {selectedPlan.destination}
              </span>
            )}
            {selectedPlan.budget && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>
                💰 {selectedPlan.budget} {selectedPlan.currency || 'VND'}
              </span>
            )}
            {selectedPlan.numberOfPeople && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>
                👨‍👩‍👧‍👦 {selectedPlan.numberOfPeople} người
              </span>
            )}
            {selectedPlan.startDate && selectedPlan.endDate && (
              <span style={{ background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)' }}>
                📅 {dayjs(selectedPlan.startDate).format('DD/MM')} – {dayjs(selectedPlan.endDate).format('DD/MM/YYYY')}
                {totalDays > 0 && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>({totalDays} ngày)</span>}
              </span>
            )}
          </div>

          {/* AI Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,242,61,0.1), rgba(61,242,200,0.1))',
            border: '1px solid rgba(200,242,61,0.3)',
            borderRadius: 16, padding: 16, marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: aiSummary ? 10 : 12, textAlign: 'center' }}>
              AI dựa vào <b>địa điểm</b>, <b>ngân sách</b> và <b>thời gian</b> để tạo lịch trình tối ưu.
              Hoặc bạn có thể <b style={{ color: 'var(--text)' }}>tự thêm từng hoạt động</b> theo từng ngày bên dưới.
            </p>

            {aiSummary && (
              <div style={{
                background: 'rgba(200,242,61,0.12)', border: '1px solid rgba(200,242,61,0.4)',
                borderRadius: 10, padding: '8px 14px', marginBottom: 12,
                fontSize: 13, color: 'var(--text)', lineHeight: 1.6,
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
            </div>
          </div>

          {/* Schedule Loading */}
          {scheduleLoading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Đang tải lịch trình...</div>
            </div>
          )}

          {/* AI Loading */}
          {!scheduleLoading && aiLoading && (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              background: 'var(--bg2)', border: '1px solid rgba(200,242,61,0.3)',
              borderRadius: 16, marginBottom: 16,
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>AI đang phân tích...</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Đang lên lịch tại <b style={{ color: 'var(--text)' }}>{selectedPlan.destination}</b>
              </p>
            </div>
          )}

          {/* Schedule days — LUÔN HIỆN dù rỗng (để user thêm thủ công) */}
          {!scheduleLoading && (
            <>
              {totalDays > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--muted)', fontSize: 12, letterSpacing: 1, margin: 0 }}>
                    LỊCH TRÌNH CHI TIẾT — {totalDays} NGÀY
                  </h4>
                  {!hasSchedule && !aiLoading && (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Chưa có hoạt động · Bấm <b style={{ color: 'var(--accent)' }}>+ Thêm</b> hoặc dùng AI
                    </span>
                  )}
                </div>
              )}

              {dayItems.map(day => {
                const items      = scheduleByDay[day] ?? [];
                const dateLabel  = selectedPlan.startDate
                  ? dayjs(selectedPlan.startDate).add(day - 1, 'day').format('DD/MM/YYYY (ddd)')
                  : null;

                return (
                  <div key={day} style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: 16, marginBottom: 14,
                  }}>
                    {/* Day header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: items.length > 0 ? 14 : 0,
                      borderBottom: items.length > 0 ? '1px solid var(--border)' : 'none',
                      paddingBottom: items.length > 0 ? 12 : 0,
                    }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
                          Ngày {day}
                        </span>
                        {dateLabel && (
                          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
                            {dateLabel}
                          </span>
                        )}
                        {items.length > 0 && (
                          <span style={{
                            fontSize: 11, color: 'var(--accent)', marginLeft: 8,
                            background: 'rgba(200,242,61,0.15)', padding: '2px 7px', borderRadius: 10,
                          }}>
                            {items.length} hoạt động
                          </span>
                        )}
                      </div>

                      {/* Nút thêm */}
                      <button
                        onClick={() => openAddModal(day)}
                        disabled={aiLoading}
                        style={{
                          background: 'rgba(200,242,61,0.15)', color: 'var(--accent)',
                          border: '1px solid rgba(200,242,61,0.4)', borderRadius: 12,
                          padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        ＋ Thêm
                      </button>
                    </div>

                    {/* Items list */}
                    {items.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: '16px 0',
                        color: 'var(--muted)', fontSize: 13,
                      }}>
                        Chưa có hoạt động nào.
                        <span
                          onClick={() => openAddModal(day)}
                          style={{ color: 'var(--accent)', cursor: 'pointer', marginLeft: 4 }}
                        >
                          + Thêm ngay
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {items.map((item, idx) => (
                          <div key={item.id ?? idx} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            padding: '10px 12px', borderRadius: 12,
                            background: 'var(--bg3)',
                            border: deletingItemId === item.id ? '1px solid #ef4444' : '1px solid transparent',
                            transition: 'border 0.2s',
                          }}>
                            {/* Time */}
                            <div style={{
                              width: 44, flexShrink: 0, fontSize: 12,
                              color: 'var(--accent)', fontWeight: 700,
                              marginTop: 2, fontFamily: 'monospace',
                            }}>
                              {item.timeSlot || '--:--'}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                                {item.location}
                              </div>
                              {item.description && (
                                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, lineHeight: 1.4 }}>
                                  {item.description}
                                </div>
                              )}
                              {item.estimatedCost && (
                                <div style={{ fontSize: 12, color: 'var(--accent3)', fontWeight: 600 }}>
                                  💸 {item.estimatedCost}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                              <button
                                onClick={() => openEditModal(day, item)}
                                style={{
                                  background: 'rgba(59,130,246,0.15)', border: 'none',
                                  color: 'var(--blue)', borderRadius: 8,
                                  width: 28, height: 28, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13,
                                }}
                                title="Sửa"
                              >✏️</button>
                              <button
                                onClick={() => handleDeleteItem(day, item)}
                                disabled={deletingItemId === item.id}
                                style={{
                                  background: 'rgba(239,68,68,0.15)', border: 'none',
                                  color: '#ef4444', borderRadius: 8,
                                  width: 28, height: 28, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13,
                                }}
                                title="Xóa"
                              >
                                {deletingItemId === item.id ? '⏳' : '🗑️'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Không có ngày nào (chưa set startDate/endDate) */}
              {totalDays === 0 && !aiLoading && (
                <div style={{
                  textAlign: 'center', padding: '32px 20px',
                  background: 'var(--bg2)', border: '1px dashed var(--border)',
                  borderRadius: 16, color: 'var(--muted)',
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Chưa có ngày đi</p>
                  <p style={{ fontSize: 13 }}>
                    Hãy cập nhật <b>ngày bắt đầu</b> và <b>ngày kết thúc</b> để tạo khung lịch trình.
                  </p>
                </div>
              )}
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
            <input placeholder="Tên kế hoạch * (VD: Hà Nội Tuần Trăng Mật)"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
            <input placeholder="Điểm đến * (VD: Hà Nội, Đà Nẵng, Phú Quốc...)"
              value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ngày bắt đầu</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ngày kết thúc</label>
                <input type="date" value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Ngân sách (VD: 15,000,000)"
                value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} style={{ ...inputStyle, flex: 2 }} />
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Số người đi:</span>
              <input type="number" min="1" max="50" placeholder="1"
                value={form.numberOfPeople} onChange={e => setForm(f => ({ ...f, numberOfPeople: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <button onClick={handleSubmit} disabled={saving}
              style={{
                padding: '11px', background: saving ? 'var(--bg3)' : 'var(--accent)',
                color: saving ? 'var(--muted)' : '#000', border: 'none', borderRadius: 10,
                cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14,
                fontFamily: 'Syne, sans-serif', marginTop: 4,
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
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {plan.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {plan.startDate && plan.endDate
                        ? `${dayjs(plan.startDate).format('DD/MM')} – ${dayjs(plan.endDate).format('DD/MM/YYYY')} · ${calcDays(plan.startDate, plan.endDate)} ngày`
                        : 'Chưa xác định thời gian'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    <button onClick={e => openEdit(plan, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 15, padding: '4px 6px' }}>✏️</button>
                    <button onClick={e => handleDelete(plan.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent3)', fontSize: 15, padding: '4px 6px' }}>🗑️</button>
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