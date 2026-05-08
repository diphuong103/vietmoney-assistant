import { useEffect, useState, useCallback, useRef } from "react";
import wikiAdminApi from "../../api/wikiAdminApi";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ICONS = [
  "🍜","🚗","🏨","🛍️","🎭","📦","✈️","🍺","🏥","📱","💇","🎯",
  "🍕","☕","🛵","🎮","🛒","💊","📚","🐶","🎁","💼","💵","📈",
];

const DEFAULT_COLORS = [
  "rgba(242,196,61,0.12)", "rgba(61,143,242,0.12)", "rgba(200,242,61,0.12)",
  "rgba(242,61,200,0.12)", "rgba(61,242,200,0.12)", "rgba(255,255,255,0.06)",
  "rgba(242,100,61,0.12)", "rgba(140,61,242,0.12)",
];

const ITEMS_PER_CAT_PAGE = 10; // số item mỗi trang cho mỗi category

const EMPTY_CATEGORY = { name: "", icon: "📦", color: DEFAULT_COLORS[0], displayOrder: 0 };
const EMPTY_UNIT     = { name: "", displayOrder: 0 };
const EMPTY_COUNTRY  = { code: "", name: "", currencyCode: "" };
const EMPTY_CITY     = { countryId: "", name: "", normalizedName: "", province: "", isPopular: false };
const EMPTY_PRICE    = {
  countryId: "", city: "", categoryId: "", unitId: "",
  item: "", minPrice: "", maxPrice: "", note: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val, sym = "") {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (isNaN(n)) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M " + sym;
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k " + sym;
  return n + " " + sym;
}

const S = {
  input: {
    background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: 10, color: "var(--text)",
    padding: "9px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  },
  label: {
    fontSize: 11, color: "var(--muted)", textTransform: "uppercase",
    letterSpacing: 1, display: "block", marginBottom: 5, fontWeight: 600,
  },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--bg3)", borderRadius: 14, padding: 4, marginBottom: 28, flexWrap: "wrap" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: 1, minWidth: 80, padding: "9px 12px", borderRadius: 10, cursor: "pointer",
          fontWeight: 600, fontSize: 12, transition: "all 0.15s", border: "none",
          background: active === t.key ? "var(--bg2)" : "transparent",
          color: active === t.key ? "var(--text)" : "var(--muted)",
          boxShadow: active === t.key ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
          fontFamily: "inherit",
        }}>{t.icon} {t.label}</button>
      ))}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, onAdd, addLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, margin: 0 }}>{icon} {title}</h2>
        {subtitle && <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {onAdd && (
        <button onClick={onAdd} className="submit-form-btn"
          style={{ width: "auto", padding: "9px 16px", fontSize: 12, marginTop: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 15 }}>+</span> {addLabel}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 14,
    }}>
      <div style={{ fontSize: 38, marginBottom: 10 }}>{icon}</div>{msg}
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, desc, loading }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 24, padding: 28, width: "90%", maxWidth: 360, margin: "auto", textAlign: "center",
      }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
        <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: desc }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose}
            style={{ padding: "10px 22px", borderRadius: 10, cursor: "pointer", background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", fontWeight: 600, fontSize: 13 }}>
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: "10px 22px", borderRadius: 10, cursor: "pointer", background: "rgba(242,61,110,0.15)", color: "var(--accent3)", border: "1px solid rgba(242,61,110,0.4)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            {loading ? <Spinner size={13} /> : "Xoá"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FormModal({ open, onClose, title, icon, children, onSubmit, loading, submitLabel = "Lưu" }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 24, padding: 28, width: "90%", maxWidth: 480, margin: "auto",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
        <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 700, margin: "0 0 20px" }}>{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", fontWeight: 600, fontSize: 13 }}>
            Huỷ
          </button>
          <button onClick={onSubmit} disabled={loading} className="submit-form-btn"
            style={{ width: "auto", padding: "10px 22px", fontSize: 13, marginTop: 0, display: "flex", alignItems: "center", gap: 7 }}>
            {loading ? <Spinner size={13} /> : submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function Row({ children }) {
  const count = Array.isArray(children) ? children.filter(Boolean).length : 1;
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 10 }}>{children}</div>;
}

function DeleteBtn({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: "5px 10px", fontSize: 12, borderRadius: 8, cursor: "pointer", background: "rgba(242,61,110,0.08)", color: "var(--accent3)", border: "1px solid rgba(242,61,110,0.2)", fontWeight: 600, display: "flex", alignItems: "center" }}>
      {loading ? <Spinner size={12} /> : "🗑️"}
    </button>
  );
}

function Table({ headers, children }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--bg3)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
            {headers.map((h, i) => <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, mono, muted }) {
  return (
    <td style={{
      padding: "11px 16px", fontSize: mono ? 13 : 14,
      fontFamily: mono ? "DM Mono, monospace" : "inherit",
      color: muted ? "var(--muted)" : "var(--text)",
      fontWeight: mono ? 600 : 400,
      borderTop: "1px solid var(--border)",
    }}>{children}</td>
  );
}

function IconPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {DEFAULT_ICONS.map(ic => (
        <button key={ic} onClick={() => onChange(ic)} style={{
          width: 34, height: 34, borderRadius: 8, fontSize: 16, cursor: "pointer",
          border: "none", background: value === ic ? "var(--accent)" : "var(--bg3)",
          transition: "all 0.12s", transform: value === ic ? "scale(1.1)" : "scale(1)",
        }}>{ic}</button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {DEFAULT_COLORS.map((c, i) => (
        <button key={i} onClick={() => onChange(c)} style={{
          width: 28, height: 28, borderRadius: "50%", cursor: "pointer",
          background: c.replace("0.12", "0.55"),
          border: value === c ? "2px solid var(--accent)" : "1px solid var(--border)",
          transition: "all 0.12s", transform: value === c ? "scale(1.15)" : "scale(1)",
        }} />
      ))}
    </div>
  );
}

// Phân trang nhỏ cho mỗi category
function CatPager({ total, page, onPage }) {
  const totalPages = Math.ceil(total / ITEMS_PER_CAT_PAGE);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 8, justifyContent: "flex-end" }}>
      <button disabled={page === 0} onClick={() => onPage(page - 1)}
        style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--muted)", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 12 }}>‹</button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button key={i} onClick={() => onPage(i)}
          style={{ padding: "4px 9px", borderRadius: 7, border: "1px solid var(--border)", fontSize: 12, cursor: "pointer",
            background: page === i ? "var(--accent)" : "var(--bg3)",
            color: page === i ? "#000" : "var(--muted)" }}>{i + 1}</button>
      ))}
      <button disabled={page === totalPages - 1} onClick={() => onPage(page + 1)}
        style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--muted)", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", fontSize: 12 }}>›</button>
      <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>{total} mục</span>
    </div>
  );
}

// ─── Hook: load data ──────────────────────────────────────────────────────────

function useLoad(fn, deps = []) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fn();
      setData(r?.data?.data ?? r?.data ?? []);
    } catch { setData([]); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload, setData };
}

// ─── PRICES TAB ───────────────────────────────────────────────────────────────

function PricesTab({ categories, units, countries, currencies }) {
  // ── Bộ lọc ──
  const [filterCountryId, setFilterCountryId] = useState("");
  const [filterCity, setFilterCity]           = useState(""); // "" = tất cả
  const [catFilter, setCatFilter]             = useState("All");
  const [search, setSearch]                   = useState("");

  // Tiền tệ tự động theo quốc gia
  const selectedCountry = countries.find(c => String(c.id) === String(filterCountryId));
  const countryCurrencyCode = selectedCountry?.currencyCode ?? "VND";
  const currencyObj = currencies.find(c => c.code === countryCurrencyCode);
  const currSym = currencyObj?.symbol ?? countryCurrencyCode;

  // Cities của quốc gia đang chọn
  const { data: availableCities, loading: loadingCities } = useLoad(
    () => filterCountryId
      ? wikiAdminApi.getCities(filterCountryId)
      : Promise.resolve({ data: { data: [] } }),
    [filterCountryId]
  );

  // ── Prices ──
  const [prices, setPrices]               = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const loadRef = useRef(0); // tránh race condition khi load nhiều city

  const loadPrices = useCallback(async () => {
    if (!filterCountryId) { setPrices([]); return; }

    const token = ++loadRef.current;
    setLoadingPrices(true);

    try {
      if (filterCity) {
        // Lọc theo 1 city
        const r = await wikiAdminApi.getPrices(filterCity, countryCurrencyCode);
        if (token !== loadRef.current) return;
        setPrices(r?.data?.data ?? []);
      } else {
        // Tất cả cities của quốc gia → gọi song song
        const cities = availableCities.length > 0
          ? availableCities
          : (await wikiAdminApi.getCities(filterCountryId).then(r => r?.data?.data ?? []));

        const results = await Promise.all(
          cities.map(c =>
            wikiAdminApi.getPrices(c.name, countryCurrencyCode)
              .then(r => r?.data?.data ?? [])
              .catch(() => [])
          )
        );
        if (token !== loadRef.current) return;
        setPrices(results.flat());
      }
    } catch {
      if (token !== loadRef.current) return;
      setPrices([]);
      toast.error("Không thể tải bảng giá.");
    } finally {
      if (token === loadRef.current) setLoadingPrices(false);
    }
  }, [filterCountryId, filterCity, countryCurrencyCode, availableCities]);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  // Reset city khi đổi quốc gia
  const handleCountryChange = (id) => {
    setFilterCountryId(id);
    setFilterCity("");
    setCatFilter("All");
  };

  // ── Phân trang theo category ──
  const [catPages, setCatPages] = useState({});
  const getCatPage = (cat) => catPages[cat] ?? 0;
  const setCatPage = (cat, p) => setCatPages(prev => ({ ...prev, [cat]: p }));

  // Reset pages khi dữ liệu thay đổi
  useEffect(() => { setCatPages({}); }, [prices, catFilter, search]);

  // ── Add modal ──
  const [addOpen, setAddOpen]       = useState(false);
  const [form, setForm]             = useState(EMPTY_PRICE);
  const [addLoading, setAddLoading] = useState(false);
  const [formCities, setFormCities] = useState([]);

  useEffect(() => {
    if (!form.countryId) { setFormCities([]); return; }
    wikiAdminApi.getCities(form.countryId)
      .then(r => setFormCities(r?.data?.data ?? []))
      .catch(() => setFormCities([]));
  }, [form.countryId]);

  // Tiền tệ của quốc gia trong form thêm giá
  const formCountry = countries.find(c => String(c.id) === String(form.countryId));
  const formCurrencyCode = formCountry?.currencyCode ?? "VND";
  const formCurrencyObj  = currencies.find(c => c.code === formCurrencyCode);
  const formCurrSym      = formCurrencyObj?.symbol ?? formCurrencyCode;

  const openAdd = () => { setForm(EMPTY_PRICE); setAddOpen(true); };

  const handleAdd = async () => {
    if (!form.city || !form.item.trim() || !form.categoryId || !form.unitId)
      return toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
    setAddLoading(true);
    try {
      // Giá nhập theo tiền tệ quốc gia, convert sang VND để lưu
      const rate = formCurrencyObj?.rateToVnd ?? 1;
      const toVnd = (v) => v ? Math.round(Number(v) * rate) : null;

      await wikiAdminApi.createPrice({
        city: form.city,
        item: form.item.trim(),
        categoryId: +form.categoryId,
        unitId: +form.unitId,
        minPrice: toVnd(form.minPrice),
        maxPrice: toVnd(form.maxPrice),
        note: form.note.trim(),
      });
      toast.success("Đã thêm mục giá!");
      setAddOpen(false);
      loadPrices();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? "Thêm thất bại.");
    } finally { setAddLoading(false); }
  };

  // ── Delete ──
  const [delModal, setDelModal]     = useState({ open: false, item: null });
  const [delLoading, setDelLoading] = useState(false);

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await wikiAdminApi.deletePrice(delModal.item.id);
      toast.success("Đã xoá mục giá.");
      setDelModal({ open: false, item: null });
      loadPrices();
    } catch { toast.error("Xoá thất bại."); }
    finally { setDelLoading(false); }
  };

  // ── Build maps ──
  const catMap = {};
  categories.forEach((c, i) => {
    catMap[c.name] = { bg: c.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length], icon: c.icon || "📦" };
  });

  // ── Filter + group ──
  const uniqueCats = [...new Set(prices.map(p => p.category))];

  const filtered = prices.filter(p => {
    const mc = catFilter === "All" || p.category === catFilter;
    const ms = !search.trim() || p.item.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const grouped = uniqueCats.reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  // ── Stats ──
  const totalFiltered = filtered.length;

  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { icon: "📦", label: "Tổng mục giá",  val: totalFiltered,                      col: "var(--accent)" },
          { icon: "🗂️", label: "Danh mục",       val: Object.keys(grouped).length,        col: "var(--accent2)" },
          { icon: "🌍", label: "Quốc gia",       val: selectedCountry?.name ?? "—",       col: "var(--blue)" },
          { icon: "💱", label: "Tiền tệ",        val: countryCurrencyCode + " " + currSym, col: "var(--gold,#F2C43D)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 17, fontWeight: 700, color: s.col, wordBreak: "break-all" }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>

        {/* Quốc gia */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={S.label}>Quốc gia</span>
          <select value={filterCountryId} onChange={e => handleCountryChange(e.target.value)}
            style={{ ...S.input, width: 160 }}>
            <option value="">-- Chọn quốc gia --</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Khu vực / City — chỉ hiện khi đã chọn quốc gia */}
        {filterCountryId && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={S.label}>Khu vực</span>
            <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setCatFilter("All"); }}
              style={{ ...S.input, width: 170 }}
              disabled={loadingCities}>
              <option value="">— Tất cả khu vực —</option>
              {availableCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Tiền tệ — hiển thị readonly theo quốc gia */}
        {filterCountryId && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={S.label}>Tiền tệ</span>
            <div style={{
              ...S.input, width: 130, display: "flex", alignItems: "center", gap: 6,
              background: "var(--bg3)", opacity: 0.85, cursor: "default",
            }}>
              <span style={{ fontSize: 16 }}>💱</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{countryCurrencyCode}</span>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>{currSym}</span>
            </div>
          </div>
        )}

        {/* Category pills */}
        {filterCountryId && uniqueCats.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end", paddingBottom: 1, flex: "1 1 100%" }}>
            {["All", ...uniqueCats].map(cat => {
              const cs = catMap[cat] || {};
              const active = catFilter === cat;
              return (
                <button key={cat} onClick={() => setCatFilter(cat)} style={{
                  padding: "7px 14px", fontSize: 12, borderRadius: 20, cursor: "pointer",
                  fontWeight: 600, transition: "all 0.15s", border: "none",
                  background: active ? (cat === "All" ? "var(--accent)" : cs.bg || "var(--bg3)") : "var(--bg3)",
                  color: active && cat === "All" ? "#000" : active ? "var(--text)" : "var(--muted)",
                  outline: active && cat !== "All" ? "1px solid var(--border)" : "none",
                }}>{cat === "All" ? "Tất cả" : `${cs.icon || ""} ${cat}`}</button>
              );
            })}
          </div>
        )}

        {/* Search + Add */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "flex-end" }}>
          <input type="text" placeholder="🔍 Tìm món..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, width: 180 }} />
          <button onClick={openAdd} className="submit-form-btn"
            style={{ width: "auto", padding: "9px 16px", fontSize: 12, marginTop: 0, whiteSpace: "nowrap" }}>
            + Thêm mục
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {!filterCountryId ? (
        <EmptyState icon="🌍" msg="Chọn quốc gia để xem bảng giá." />
      ) : loadingPrices ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📭" msg="Không có dữ liệu cho bộ lọc hiện tại." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {Object.entries(grouped).map(([cat, items]) => {
            const cs    = catMap[cat] || { bg: "rgba(255,255,255,0.05)", icon: "📦" };
            const page  = getCatPage(cat);
            const start = page * ITEMS_PER_CAT_PAGE;
            const slice = items.slice(start, start + ITEMS_PER_CAT_PAGE);

            return (
              <div key={cat}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: cs.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{cs.icon}</div>
                  <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>{cat}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: cs.bg, fontWeight: 700 }}>{items.length}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>

                <Table headers={["Tên món", "Khu vực", `Thấp nhất (${currSym})`, `Cao nhất (${currSym})`, "Đơn vị", "Ghi chú", ""]}>
                  {slice.map(p => (
                    <tr key={p.id}>
                      <Td><span style={{ fontWeight: 600 }}>{p.item}</span></Td>
                      <Td muted><span style={{ fontSize: 12 }}>{p.city || "—"}</span></Td>
                      <Td mono><span style={{ color: "var(--accent2)" }}>{fmt(p.minPrice, currSym)}</span></Td>
                      <Td mono><span style={{ color: "var(--accent)" }}>{fmt(p.maxPrice, currSym)}</span></Td>
                      <Td muted>{p.unit || "—"}</Td>
                      <Td muted>
                        <span style={{ display: "block", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.note || "—"}
                        </span>
                      </Td>
                      <td style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                        <DeleteBtn onClick={() => setDelModal({ open: true, item: p })} />
                      </td>
                    </tr>
                  ))}
                </Table>

                <CatPager total={items.length} page={page} onPage={p => setCatPage(cat, p)} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      <FormModal open={addOpen} onClose={() => setAddOpen(false)} icon="➕" title="Thêm mục giá mới"
        onSubmit={handleAdd} loading={addLoading} submitLabel="Thêm mới">

        <Row>
          <Field label="Quốc gia *">
            <select style={S.input} value={form.countryId}
              onChange={e => setForm({ ...form, countryId: e.target.value, city: "" })}>
              <option value="">-- Chọn quốc gia --</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Khu vực *">
            <select style={S.input} value={form.city} disabled={!form.countryId}
              onChange={e => setForm({ ...form, city: e.target.value })}>
              <option value="">-- Chọn khu vực --</option>
              {formCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
        </Row>

        {/* Hiển thị tiền tệ của quốc gia đang chọn */}
        {form.countryId && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>💱</span>
            <span>Giá nhập theo <strong>{formCurrencyCode}</strong> ({formCurrSym}) — tiền tệ của {formCountry?.name}</span>
          </div>
        )}

        <Row>
          <Field label="Danh mục *">
            <select style={S.input} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">-- Danh mục --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Đơn vị *">
            <select style={S.input} value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })}>
              <option value="">-- Đơn vị --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </Row>

        <Field label="Tên món *">
          <input style={S.input} placeholder="Ví dụ: Phở bò, Bún bò, ..." value={form.item}
            onChange={e => setForm({ ...form, item: e.target.value })} />
        </Field>

        <Row>
          <Field label={`Giá thấp nhất (${formCurrencyCode})`}>
            <input style={S.input} type="number" placeholder="30000" value={form.minPrice}
              onChange={e => setForm({ ...form, minPrice: e.target.value })} />
          </Field>
          <Field label={`Giá cao nhất (${formCurrencyCode})`}>
            <input style={S.input} type="number" placeholder="60000" value={form.maxPrice}
              onChange={e => setForm({ ...form, maxPrice: e.target.value })} />
          </Field>
        </Row>

        <Field label="Ghi chú">
          <input style={S.input} placeholder="Ghi chú thêm..." value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })} />
        </Field>
      </FormModal>

      <ConfirmModal open={delModal.open} onClose={() => setDelModal({ open: false, item: null })}
        onConfirm={handleDelete} loading={delLoading}
        title="Xoá mục giá?"
        desc={`Bạn chắc chắn muốn xoá <strong>${delModal.item?.item}</strong>? Hành động này không thể hoàn tác.`} />
    </>
  );
}

// ─── CATEGORIES TAB ──────────────────────────────────────────────────────────

function CategoriesTab({ categories, onRefresh }) {
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState(EMPTY_CATEGORY);
  const [loading, setLoading]       = useState(false);
  const [delModal, setDelModal]     = useState({ open: false, item: null });
  const [delLoading, setDelLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) return toast.error("Tên danh mục không được để trống.");
    setLoading(true);
    try {
      await wikiAdminApi.createCategory({ ...form, name: form.name.trim() });
      toast.success("Đã thêm danh mục!"); setOpen(false); setForm(EMPTY_CATEGORY); onRefresh();
    } catch (e) { toast.error(e?.response?.data?.message ?? "Thêm thất bại."); }
    finally { setLoading(false); }
  };

  const handleDel = async () => {
    setDelLoading(true);
    try {
      await wikiAdminApi.deleteCategory(delModal.item.id);
      toast.success("Đã xoá danh mục."); setDelModal({ open: false, item: null }); onRefresh();
    } catch { toast.error("Xoá thất bại."); }
    finally { setDelLoading(false); }
  };

  return (
    <>
      <SectionHeader icon="🗂️" title="Danh mục giá"
        subtitle="Quản lý danh mục hiển thị trong bảng giá"
        onAdd={() => { setForm(EMPTY_CATEGORY); setOpen(true); }} addLabel="Thêm danh mục" />

      {categories.length === 0 ? <EmptyState icon="🗂️" msg="Chưa có danh mục nào." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {categories.map(cat => (
            <div key={cat.id} style={{
              background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: cat.color || "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                  {cat.icon || "📦"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>order: {cat.displayOrder ?? 0}</div>
                </div>
              </div>
              <DeleteBtn onClick={() => setDelModal({ open: true, item: cat })} />
            </div>
          ))}
        </div>
      )}

      <FormModal open={open} onClose={() => setOpen(false)} icon="🗂️" title="Thêm danh mục mới"
        onSubmit={handleAdd} loading={loading} submitLabel="Thêm mới">
        <Field label="Tên danh mục *">
          <input style={S.input} placeholder="Ví dụ: Food, Transport..." value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Row>
          <Field label="Icon (emoji)"><IconPicker value={form.icon} onChange={v => setForm({ ...form, icon: v })} /></Field>
          <Field label="Màu nền"><ColorPicker value={form.color} onChange={v => setForm({ ...form, color: v })} /></Field>
        </Row>
        <Field label="Thứ tự hiển thị">
          <input style={S.input} type="number" placeholder="0" value={form.displayOrder}
            onChange={e => setForm({ ...form, displayOrder: +e.target.value })} />
        </Field>
      </FormModal>

      <ConfirmModal open={delModal.open} onClose={() => setDelModal({ open: false, item: null })}
        onConfirm={handleDel} loading={delLoading}
        title="Xoá danh mục?"
        desc={`Danh mục <strong>${delModal.item?.name}</strong> sẽ bị ẩn.`} />
    </>
  );
}

// ─── UNITS TAB ────────────────────────────────────────────────────────────────

function UnitsTab({ units, onRefresh }) {
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState(EMPTY_UNIT);
  const [loading, setLoading]       = useState(false);
  const [delModal, setDelModal]     = useState({ open: false, item: null });
  const [delLoading, setDelLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) return toast.error("Tên đơn vị không được để trống.");
    setLoading(true);
    try {
      await wikiAdminApi.createUnit({ name: form.name.trim(), displayOrder: form.displayOrder });
      toast.success("Đã thêm đơn vị!"); setOpen(false); setForm(EMPTY_UNIT); onRefresh();
    } catch (e) { toast.error(e?.response?.data?.message ?? "Thêm thất bại."); }
    finally { setLoading(false); }
  };

  const handleDel = async () => {
    setDelLoading(true);
    try {
      await wikiAdminApi.deleteUnit(delModal.item.id);
      toast.success("Đã xoá đơn vị."); setDelModal({ open: false, item: null }); onRefresh();
    } catch { toast.error("Xoá thất bại."); }
    finally { setDelLoading(false); }
  };

  return (
    <>
      <SectionHeader icon="📏" title="Đơn vị tính"
        subtitle="Quản lý đơn vị tính cho các mục giá"
        onAdd={() => { setForm(EMPTY_UNIT); setOpen(true); }} addLabel="Thêm đơn vị" />

      {units.length === 0 ? <EmptyState icon="📏" msg="Chưa có đơn vị nào." /> : (
        <Table headers={["#", "Tên đơn vị", "Thứ tự hiển thị", ""]}>
          {units.map((u, i) => (
            <tr key={u.id}>
              <Td muted mono>{i + 1}</Td>
              <Td><span style={{ fontWeight: 600 }}>{u.name}</span></Td>
              <Td mono muted>{u.displayOrder ?? 0}</Td>
              <td style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                <DeleteBtn onClick={() => setDelModal({ open: true, item: u })} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <FormModal open={open} onClose={() => setOpen(false)} icon="📏" title="Thêm đơn vị mới"
        onSubmit={handleAdd} loading={loading} submitLabel="Thêm mới">
        <Field label="Tên đơn vị *">
          <input style={S.input} placeholder="Ví dụ: bowl, đêm, người, ..." value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Thứ tự hiển thị">
          <input style={S.input} type="number" placeholder="0" value={form.displayOrder}
            onChange={e => setForm({ ...form, displayOrder: +e.target.value })} />
        </Field>
      </FormModal>

      <ConfirmModal open={delModal.open} onClose={() => setDelModal({ open: false, item: null })}
        onConfirm={handleDel} loading={delLoading}
        title="Xoá đơn vị?"
        desc={`Đơn vị <strong>${delModal.item?.name}</strong> sẽ bị xoá.`} />
    </>
  );
}

// ─── COUNTRIES TAB ────────────────────────────────────────────────────────────

function CountriesTab({ countries, onRefresh }) {
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState(EMPTY_COUNTRY);
  const [loading, setLoading]       = useState(false);
  const [delModal, setDelModal]     = useState({ open: false, item: null });
  const [delLoading, setDelLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.currencyCode.trim())
      return toast.error("Vui lòng điền đầy đủ thông tin.");
    setLoading(true);
    try {
      await wikiAdminApi.createCountry({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        currencyCode: form.currencyCode.trim().toUpperCase(),
      });
      toast.success("Đã thêm quốc gia!"); setOpen(false); setForm(EMPTY_COUNTRY); onRefresh();
    } catch (e) { toast.error(e?.response?.data?.message ?? "Thêm thất bại."); }
    finally { setLoading(false); }
  };

  const handleDel = async () => {
    setDelLoading(true);
    try {
      await wikiAdminApi.deleteCountry(delModal.item.id);
      toast.success("Đã xoá quốc gia."); setDelModal({ open: false, item: null }); onRefresh();
    } catch { toast.error("Xoá thất bại."); }
    finally { setDelLoading(false); }
  };

  return (
    <>
      <SectionHeader icon="🌍" title="Quốc gia"
        subtitle="Danh sách quốc gia trong hệ thống"
        onAdd={() => { setForm(EMPTY_COUNTRY); setOpen(true); }} addLabel="Thêm quốc gia" />

      {countries.length === 0 ? <EmptyState icon="🌍" msg="Chưa có quốc gia nào." /> : (
        <Table headers={["Mã", "Tên quốc gia", "Mã tiền tệ", ""]}>
          {countries.map(c => (
            <tr key={c.id}>
              <Td>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(61,143,242,0.1)", color: "var(--blue)" }}>
                  {c.code}
                </span>
              </Td>
              <Td><span style={{ fontWeight: 600 }}>{c.name}</span></Td>
              <Td>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(200,242,61,0.1)", color: "var(--accent)" }}>
                  {c.currencyCode}
                </span>
              </Td>
              <td style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                <DeleteBtn onClick={() => setDelModal({ open: true, item: c })} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <FormModal open={open} onClose={() => setOpen(false)} icon="🌍" title="Thêm quốc gia mới"
        onSubmit={handleAdd} loading={loading} submitLabel="Thêm mới">
        <Row>
          <Field label="Mã quốc gia * (ISO 2)">
            <input style={S.input} placeholder="VN" maxLength={2} value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })} />
          </Field>
          <Field label="Mã tiền tệ *">
            <input style={S.input} placeholder="VND" maxLength={5} value={form.currencyCode}
              onChange={e => setForm({ ...form, currencyCode: e.target.value })} />
          </Field>
        </Row>
        <Field label="Tên quốc gia *">
          <input style={S.input} placeholder="Việt Nam" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
      </FormModal>

      <ConfirmModal open={delModal.open} onClose={() => setDelModal({ open: false, item: null })}
        onConfirm={handleDel} loading={delLoading}
        title="Xoá quốc gia?"
        desc={`Quốc gia <strong>${delModal.item?.name}</strong> và các thành phố liên quan sẽ bị xoá.`} />
    </>
  );
}

// ─── CITIES TAB ───────────────────────────────────────────────────────────────

function CitiesTab({ countries }) {
  const [filterCountryId, setFilterCountryId] = useState("");
  const { data: cities, loading, reload } = useLoad(
    () => filterCountryId
      ? wikiAdminApi.getCities(filterCountryId)
      : Promise.resolve({ data: { data: [] } }),
    [filterCountryId]
  );

  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState(EMPTY_CITY);
  const [addLoading, setAddLoading] = useState(false);
  const [delModal, setDelModal]     = useState({ open: false, item: null });
  const [delLoading, setDelLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.countryId || !form.name.trim()) return toast.error("Chọn quốc gia và nhập tên thành phố.");
    setAddLoading(true);
    try {
      await wikiAdminApi.createCity({
        countryId: +form.countryId,
        name: form.name.trim(),
        normalizedName: form.normalizedName.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
        province: form.province.trim(),
        isPopular: form.isPopular,
      });
      toast.success("Đã thêm thành phố!"); setOpen(false); setForm(EMPTY_CITY);
      if (String(form.countryId) === String(filterCountryId)) reload();
    } catch (e) { toast.error(e?.response?.data?.message ?? "Thêm thất bại."); }
    finally { setAddLoading(false); }
  };

  const handleDel = async () => {
    setDelLoading(true);
    try {
      await wikiAdminApi.deleteCity(delModal.item.id);
      toast.success("Đã xoá thành phố."); setDelModal({ open: false, item: null }); reload();
    } catch { toast.error("Xoá thất bại."); }
    finally { setDelLoading(false); }
  };

  return (
    <>
      <SectionHeader icon="🏙️" title="Thành phố"
        subtitle="Quản lý danh sách thành phố theo từng quốc gia"
        onAdd={() => { setForm(EMPTY_CITY); setOpen(true); }} addLabel="Thêm thành phố" />

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Lọc theo quốc gia</label>
        <select style={{ ...S.input, maxWidth: 280 }} value={filterCountryId}
          onChange={e => setFilterCountryId(e.target.value)}>
          <option value="">-- Chọn quốc gia để xem thành phố --</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      {!filterCountryId ? (
        <EmptyState icon="🌍" msg="Chọn quốc gia để xem các thành phố." />
      ) : loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>
      ) : cities.length === 0 ? (
        <EmptyState icon="🏙️" msg="Quốc gia này chưa có thành phố nào." />
      ) : (
        <Table headers={["Tên thành phố", "Normalized", "Tỉnh/Khu vực", "Phổ biến", "Quốc gia", ""]}>
          {cities.map(c => (
            <tr key={c.id}>
              <Td><span style={{ fontWeight: 600 }}>{c.name}</span></Td>
              <Td mono muted>{c.normalizedName}</Td>
              <Td muted>{c.province || "—"}</Td>
              <Td>{c.isPopular ? <span style={{ fontSize: 16 }}>⭐</span> : <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>}</Td>
              <Td muted>{c.countryName}</Td>
              <td style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                <DeleteBtn onClick={() => setDelModal({ open: true, item: c })} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <FormModal open={open} onClose={() => setOpen(false)} icon="🏙️" title="Thêm thành phố mới"
        onSubmit={handleAdd} loading={addLoading} submitLabel="Thêm mới">
        <Field label="Quốc gia *">
          <select style={S.input} value={form.countryId}
            onChange={e => setForm({ ...form, countryId: e.target.value })}>
            <option value="">-- Chọn quốc gia --</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </Field>
        <Row>
          <Field label="Tên thành phố *">
            <input style={S.input} placeholder="Da Nang" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Tỉnh / Khu vực">
            <input style={S.input} placeholder="Quảng Nam" value={form.province}
              onChange={e => setForm({ ...form, province: e.target.value })} />
          </Field>
        </Row>
        <Field label="Normalized Name (tự động nếu để trống)">
          <input style={S.input} placeholder="da-nang" value={form.normalizedName}
            onChange={e => setForm({ ...form, normalizedName: e.target.value })} />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })}
            style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>⭐ Đánh dấu là thành phố phổ biến</span>
        </label>
      </FormModal>

      <ConfirmModal open={delModal.open} onClose={() => setDelModal({ open: false, item: null })}
        onConfirm={handleDel} loading={delLoading}
        title="Xoá thành phố?"
        desc={`Thành phố <strong>${delModal.item?.name}</strong> sẽ bị xoá.`} />
    </>
  );
}

// ─── CURRENCIES TAB ───────────────────────────────────────────────────────────

function CurrenciesTab({ currencies }) {
  return (
    <>
      <SectionHeader icon="💱" title="Tiền tệ hỗ trợ"
        subtitle="Danh sách tiền tệ và tỷ giá quy đổi sang VND (read-only)" />

      {currencies.length === 0 ? <EmptyState icon="💱" msg="Chưa có dữ liệu tiền tệ." /> : (
        <Table headers={["Mã", "Ký hiệu", "Tỷ giá → VND", "Tên"]}>
          {currencies.map(c => (
            <tr key={c.code}>
              <Td>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: c.code === "VND" ? "rgba(200,242,61,0.12)" : "rgba(61,143,242,0.1)", color: c.code === "VND" ? "var(--accent)" : "var(--blue)" }}>
                  {c.code}
                </span>
              </Td>
              <Td mono>{c.symbol}</Td>
              <Td mono><span style={{ color: "var(--accent2)" }}>{c.rateToVnd?.toLocaleString("vi-VN") ?? "1"}</span></Td>
              <Td muted>{c.name || "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "prices",     label: "Bảng giá",  icon: "💰" },
  { key: "categories", label: "Danh mục",  icon: "🗂️" },
  { key: "units",      label: "Đơn vị",    icon: "📏" },
  { key: "countries",  label: "Quốc gia",  icon: "🌍" },
  { key: "cities",     label: "Thành phố", icon: "🏙️" },
  { key: "currencies", label: "Tiền tệ",   icon: "💱" },
];

export default function PriceWikiAdmin() {
  const [tab, setTab] = useState("prices");

  const { data: categories, loading: loadCat,     reload: reloadCat }     = useLoad(() => wikiAdminApi.getCategories());
  const { data: units,      loading: loadUnit,    reload: reloadUnit }    = useLoad(() => wikiAdminApi.getUnits());
  const { data: countries,  loading: loadCountry, reload: reloadCountry } = useLoad(() => wikiAdminApi.getCountries());
  const { data: currencies, loading: loadCur }                            = useLoad(() => wikiAdminApi.getCurrencies());

  const metaLoading = loadCat || loadUnit || loadCountry || loadCur;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, margin: 0 }}>
          💰 Price Wiki Admin
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "5px 0 0" }}>
          Quản lý bảng giá tham khảo — danh mục, đơn vị, quốc gia, thành phố, tiền tệ
        </p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {metaLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spinner size={32} /></div>
      ) : (
        <>
          {tab === "prices"     && <PricesTab categories={categories} units={units} countries={countries} currencies={currencies} />}
          {tab === "categories" && <CategoriesTab categories={categories} onRefresh={reloadCat} />}
          {tab === "units"      && <UnitsTab units={units} onRefresh={reloadUnit} />}
          {tab === "countries"  && <CountriesTab countries={countries} onRefresh={reloadCountry} />}
          {tab === "cities"     && <CitiesTab countries={countries} />}
          {tab === "currencies" && <CurrenciesTab currencies={currencies} />}
        </>
      )}
    </div>
  );
}