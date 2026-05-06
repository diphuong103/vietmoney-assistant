import { useState, useEffect, useCallback } from "react";
import wikiAdminApi from "../api/wikiAdminApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ICONS = [
  "🍜","🚗","🏨","🛍️","🎭","📦","✈️","🍺","🏥","📱","💇","🎯",
  "🍕","☕","🛵","🎮","🛒","💊","📚","🐶","🎁","💼","💵","📈",
  "🏠","🌐","⚽","🎨","✍️","🔧","🎵","📸","🎬","🧴","💆","🩺",
];

const DEFAULT_COLORS = [
  "rgba(242,196,61,0.15)",  "rgba(61,143,242,0.15)", "rgba(200,242,61,0.15)",
  "rgba(242,61,200,0.15)",  "rgba(61,242,200,0.15)", "rgba(255,255,255,0.08)",
  "rgba(242,100,61,0.15)",  "rgba(140,61,242,0.15)",
];

const TABS = [
  { id: "category", label: "Categories", icon: "🏷️" },
  { id: "unit",     label: "Units",      icon: "📐" },
  { id: "country",  label: "Countries",  icon: "🌍" },
  { id: "city",     label: "Cities",     icon: "🏙️" },
  { id: "price",    label: "Prices",     icon: "💰" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

  .wa-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(8,8,18,0.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: wa-fade-in 0.18s ease;
  }
  @keyframes wa-fade-in { from { opacity:0 } to { opacity:1 } }
  @keyframes wa-slide-up { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }

  .wa-modal {
    font-family: 'Sora', sans-serif;
    background: #0f0f1a;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    width: 100%; max-width: 640px;
    max-height: 92vh;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
    animation: wa-slide-up 0.22s ease;
  }

  /* Header */
  .wa-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 26px 0;
    flex-shrink: 0;
  }
  .wa-header-title {
    font-size: 16px; font-weight: 700; color: #f0f0ff;
    display: flex; align-items: center; gap: 8px;
  }
  .wa-header-badge {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    background: rgba(99,102,241,0.2); color: #818cf8;
    border: 1px solid rgba(99,102,241,0.3);
    padding: 2px 8px; border-radius: 99px;
  }
  .wa-close {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5); cursor: pointer; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .wa-close:hover { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }

  /* Tabs */
  .wa-tabs {
    display: flex; gap: 4px;
    padding: 16px 26px 0;
    flex-shrink: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .wa-tabs::-webkit-scrollbar { display:none }
  .wa-tab {
    padding: 7px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
    background: transparent; cursor: pointer;
    font-size: 12px; font-weight: 600; letter-spacing: 0.02em;
    color: rgba(255,255,255,0.4);
    white-space: nowrap;
    transition: all 0.15s;
    font-family: 'Sora', sans-serif;
  }
  .wa-tab:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }
  .wa-tab.active {
    background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4);
    color: #a5b4fc;
  }

  /* Divider */
  .wa-divider {
    height: 1px; background: rgba(255,255,255,0.06);
    margin: 16px 26px 0;
    flex-shrink: 0;
  }

  /* Scroll body */
  .wa-body {
    flex: 1; overflow-y: auto;
    padding: 20px 26px;
    display: flex; flex-direction: column; gap: 24px;
  }
  .wa-body::-webkit-scrollbar { width: 3px; }
  .wa-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  /* Section */
  .wa-section { display: flex; flex-direction: column; gap: 12px; }
  .wa-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
    display: flex; align-items: center; gap: 8px;
  }
  .wa-section-label::after { content:''; flex:1; height:1px; background: rgba(255,255,255,0.06); }

  /* List items */
  .wa-list { display: flex; flex-direction: column; gap: 6px; }
  .wa-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    transition: background 0.12s;
  }
  .wa-item:hover { background: rgba(255,255,255,0.06); }
  .wa-item-dot {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .wa-item-info { flex: 1; min-width: 0; }
  .wa-item-name { font-size: 13px; font-weight: 500; color: #e0e0f0; }
  .wa-item-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 1px; }
  .wa-item-del {
    width: 28px; height: 28px; border-radius: 8px;
    border: 1px solid transparent; background: transparent;
    color: rgba(255,255,255,0.3); cursor: pointer; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s; flex-shrink: 0;
  }
  .wa-item-del:hover { background: rgba(239,68,68,0.12); color: #f87171; border-color: rgba(239,68,68,0.25); }
  .wa-empty {
    text-align: center; color: rgba(255,255,255,0.25);
    font-size: 13px; padding: 20px;
    border: 1px dashed rgba(255,255,255,0.08); border-radius: 12px;
  }

  /* Icon picker */
  .wa-icon-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .wa-icon-btn {
    width: 38px; height: 38px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    font-size: 17px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s; flex-shrink: 0;
  }
  .wa-icon-btn:hover { background: rgba(255,255,255,0.09); transform: scale(1.08); }
  .wa-icon-btn.sel { border-color: #6366f1; background: rgba(99,102,241,0.18); transform: scale(1.1); }

  /* Color picker */
  .wa-color-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .wa-color-dot {
    width: 30px; height: 30px; border-radius: 50%;
    cursor: pointer; border: 2px solid transparent;
    transition: all 0.12s; flex-shrink: 0;
  }
  .wa-color-dot.sel { border-color: #fff; transform: scale(1.15); }
  .wa-color-dot:hover:not(.sel) { transform: scale(1.1); }

  /* Form fields */
  .wa-form { display: flex; flex-direction: column; gap: 10px; }
  .wa-row { display: flex; gap: 8px; align-items: flex-end; }
  .wa-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
  .wa-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; }
  .wa-input, .wa-select {
    height: 40px; border-radius: 10px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: #e0e0f0; padding: 0 12px; font-size: 13px;
    outline: none; transition: border-color 0.15s; width: 100%;
    font-family: 'Sora', sans-serif;
  }
  .wa-input::placeholder { color: rgba(255,255,255,0.25); }
  .wa-input:focus, .wa-select:focus { border-color: rgba(99,102,241,0.5); }
  .wa-select option { background: #1a1a2e; }
  .wa-preview-icon {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center; font-size: 19px;
  }

  /* Submit button */
  .wa-submit {
    height: 40px; padding: 0 20px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 13px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.03em; white-space: nowrap;
    transition: all 0.15s; font-family: 'Sora', sans-serif;
    flex-shrink: 0;
  }
  .wa-submit:hover { opacity: 0.88; transform: scale(0.98); }
  .wa-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* Error */
  .wa-error {
    font-size: 12px; color: #f87171;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px; padding: 8px 12px;
  }

  /* Loading */
  .wa-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2); border-top-color: #a5b4fc;
    animation: wa-spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes wa-spin { to { transform: rotate(360deg) } }
`;

// ─── Utility ──────────────────────────────────────────────────────────────────

const useLoad = (fn, deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    try { const r = await fn(); setData(r.data?.data ?? r.data ?? []); }
    catch { setData([]); }
    finally { setLoading(false); }
  }, deps); // eslint-disable-line
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
};

const Toast = ({ msg }) => msg ? (
  <div style={{
    position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
    background:"rgba(30,30,50,0.96)", border:"1px solid rgba(99,102,241,0.4)",
    color:"#a5b4fc", padding:"10px 20px", borderRadius:12, fontSize:13,
    fontWeight:600, zIndex:9999, whiteSpace:"nowrap",
    boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
    animation:"wa-slide-up 0.2s ease",
  }}>{msg}</div>
) : null;

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function CategoryPanel({ toast }) {
  const { data: cats, loading, reload } = useLoad(() => wikiAdminApi.getCategories());
  const [icon, setIcon]   = useState("🍜");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [name, setName]   = useState("");
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);

  const add = async () => {
    if (!name.trim()) return setErr("Name is required");
    setBusy(true); setErr("");
    try {
      await wikiAdminApi.createCategory({ name: name.trim(), icon, color });
      setName(""); toast("✅ Category added");
      reload();
    } catch (e) {
      setErr(e?.response?.data?.message ?? "Failed");
    } finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this category?")) return;
    try { await wikiAdminApi.deleteCategory(id); reload(); toast("🗑 Deleted"); }
    catch { toast("❌ Error"); }
  };

  return (
    <div className="wa-section">
      <div className="wa-section-label">Existing Categories</div>
      <div className="wa-list">
        {loading ? <Spinner /> : cats.length === 0 ? (
          <div className="wa-empty">No categories yet</div>
        ) : cats.map(c => (
          <div className="wa-item" key={c.id}>
            <div className="wa-item-dot" style={{ background: c.color }}>{c.icon}</div>
            <div className="wa-item-info">
              <div className="wa-item-name">{c.name}</div>
              <div className="wa-item-sub">Order: {c.displayOrder ?? 0}</div>
            </div>
            <button className="wa-item-del" onClick={() => del(c.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="wa-section-label">Add Category</div>
      <div className="wa-form">
        <div>
          <div className="wa-label" style={{marginBottom:6}}>Pick Icon</div>
          <div className="wa-icon-grid">
            {DEFAULT_ICONS.map(ic => (
              <button key={ic} className={`wa-icon-btn ${icon === ic ? "sel" : ""}`} onClick={() => setIcon(ic)}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="wa-label" style={{marginBottom:6}}>Pick Color</div>
          <div className="wa-color-row">
            {DEFAULT_COLORS.map((c,i) => (
              <div key={i} className={`wa-color-dot ${color === c ? "sel" : ""}`}
                style={{ background: c.replace("0.15","0.6"), border: color===c?"2px solid #a5b4fc":"2px solid rgba(255,255,255,0.12)" }}
                onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="wa-row">
          <div className="wa-preview-icon" style={{ background: color }}>{icon}</div>
          <div className="wa-field">
            <input className="wa-input" placeholder="Category name..." value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          </div>
          <button className="wa-submit" onClick={add} disabled={busy}>
            {busy ? <span className="wa-spinner" /> : "Add"}
          </button>
        </div>
        {err && <div className="wa-error">{err}</div>}
      </div>
    </div>
  );
}

function UnitPanel({ toast }) {
  const { data: units, loading, reload } = useLoad(() => wikiAdminApi.getUnits());
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);

  const add = async () => {
    if (!name.trim()) return setErr("Name is required");
    setBusy(true); setErr("");
    try {
      await wikiAdminApi.createUnit({ name: name.trim(), displayOrder: order ? +order : 0 });
      setName(""); setOrder(""); toast("✅ Unit added"); reload();
    } catch (e) { setErr(e?.response?.data?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this unit?")) return;
    try { await wikiAdminApi.deleteUnit(id); reload(); toast("🗑 Deleted"); }
    catch { toast("❌ Error"); }
  };

  return (
    <div className="wa-section">
      <div className="wa-section-label">Existing Units</div>
      <div className="wa-list">
        {loading ? <Spinner /> : units.length === 0 ? (
          <div className="wa-empty">No units yet</div>
        ) : units.map(u => (
          <div className="wa-item" key={u.id}>
            <div className="wa-item-dot" style={{ background:"rgba(99,102,241,0.15)" }}>📐</div>
            <div className="wa-item-info">
              <div className="wa-item-name">{u.name}</div>
              <div className="wa-item-sub">Order: {u.displayOrder ?? 0}</div>
            </div>
            <button className="wa-item-del" onClick={() => del(u.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="wa-section-label">Add Unit</div>
      <div className="wa-form">
        <div className="wa-row">
          <div className="wa-field">
            <div className="wa-label">Unit Name</div>
            <input className="wa-input" placeholder="e.g. bowl, plate, night..." value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          </div>
          <div className="wa-field" style={{maxWidth:90}}>
            <div className="wa-label">Order</div>
            <input className="wa-input" type="number" placeholder="0" value={order} onChange={e => setOrder(e.target.value)} />
          </div>
          <button className="wa-submit" onClick={add} disabled={busy}>
            {busy ? <span className="wa-spinner" /> : "Add"}
          </button>
        </div>
        {err && <div className="wa-error">{err}</div>}
      </div>
    </div>
  );
}

function CountryPanel({ toast }) {
  const { data: countries, loading, reload } = useLoad(() => wikiAdminApi.getCountries());
  const [form, setForm] = useState({ code:"", name:"", currencyCode:"" });
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.currencyCode.trim())
      return setErr("All fields are required");
    setBusy(true); setErr("");
    try {
      await wikiAdminApi.createCountry({ code: form.code.trim().toUpperCase(), name: form.name.trim(), currencyCode: form.currencyCode.trim().toUpperCase() });
      setForm({ code:"", name:"", currencyCode:"" }); toast("✅ Country added"); reload();
    } catch (e) { setErr(e?.response?.data?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this country?")) return;
    try { await wikiAdminApi.deleteCountry(id); reload(); toast("🗑 Deleted"); }
    catch { toast("❌ Error"); }
  };

  return (
    <div className="wa-section">
      <div className="wa-section-label">Countries ({countries.length})</div>
      <div className="wa-list">
        {loading ? <Spinner /> : countries.length === 0 ? (
          <div className="wa-empty">No countries yet</div>
        ) : countries.map(c => (
          <div className="wa-item" key={c.id}>
            <div className="wa-item-dot" style={{ background:"rgba(59,130,246,0.15)" }}>🌍</div>
            <div className="wa-item-info">
              <div className="wa-item-name">{c.name}</div>
              <div className="wa-item-sub">{c.code} · {c.currencyCode}</div>
            </div>
            <button className="wa-item-del" onClick={() => del(c.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="wa-section-label">Add Country</div>
      <div className="wa-form">
        <div className="wa-row">
          <div className="wa-field" style={{maxWidth:80}}>
            <div className="wa-label">Code</div>
            <input className="wa-input" placeholder="VN" value={form.code} onChange={e => set("code", e.target.value)} />
          </div>
          <div className="wa-field">
            <div className="wa-label">Country Name</div>
            <input className="wa-input" placeholder="Vietnam" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="wa-field" style={{maxWidth:90}}>
            <div className="wa-label">Currency</div>
            <input className="wa-input" placeholder="VND" value={form.currencyCode} onChange={e => set("currencyCode", e.target.value)} />
          </div>
        </div>
        <button className="wa-submit" style={{alignSelf:"flex-start"}} onClick={add} disabled={busy}>
          {busy ? <span className="wa-spinner" /> : "Add Country"}
        </button>
        {err && <div className="wa-error">{err}</div>}
      </div>
    </div>
  );
}

function CityPanel({ toast }) {
  const { data: countries } = useLoad(() => wikiAdminApi.getCountries());
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const { data: cities, loading, reload } = useLoad(
    () => selectedCountryId ? wikiAdminApi.getCities(selectedCountryId) : Promise.resolve({ data: { data: [] } }),
    [selectedCountryId]
  );
  const [form, setForm]   = useState({ name:"", normalizedName:"", province:"", isPopular: false });
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = async () => {
    if (!selectedCountryId) return setErr("Please select a country first");
    if (!form.name.trim()) return setErr("City name is required");
    setBusy(true); setErr("");
    try {
      await wikiAdminApi.createCity({
        countryId: +selectedCountryId,
        name: form.name.trim(),
        normalizedName: form.normalizedName.trim() || form.name.trim().toLowerCase(),
        province: form.province.trim(),
        isPopular: form.isPopular,
      });
      setForm({ name:"", normalizedName:"", province:"", isPopular: false });
      toast("✅ City added"); reload();
    } catch (e) { setErr(e?.response?.data?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this city?")) return;
    try { await wikiAdminApi.deleteCity(id); reload(); toast("🗑 Deleted"); }
    catch { toast("❌ Error"); }
  };

  return (
    <div className="wa-section">
      {/* Filter */}
      <div className="wa-field">
        <div className="wa-label">Filter by Country</div>
        <select className="wa-select" value={selectedCountryId} onChange={e => setSelectedCountryId(e.target.value)}>
          <option value="">-- Select a country --</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      <div className="wa-section-label">Cities {selectedCountryId ? `(${cities.length})` : ""}</div>
      <div className="wa-list">
        {!selectedCountryId ? (
          <div className="wa-empty">Select a country to view its cities</div>
        ) : loading ? <Spinner /> : cities.length === 0 ? (
          <div className="wa-empty">No cities for this country</div>
        ) : cities.map(c => (
          <div className="wa-item" key={c.id}>
            <div className="wa-item-dot" style={{ background:"rgba(16,185,129,0.15)" }}>🏙️</div>
            <div className="wa-item-info">
              <div className="wa-item-name">{c.name} {c.isPopular ? "⭐" : ""}</div>
              <div className="wa-item-sub">{c.province || "—"} · {c.normalizedName}</div>
            </div>
            <button className="wa-item-del" onClick={() => del(c.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="wa-section-label">Add City</div>
      <div className="wa-form">
        <div className="wa-field">
          <div className="wa-label">Country *</div>
          <select className="wa-select" value={selectedCountryId} onChange={e => setSelectedCountryId(e.target.value)}>
            <option value="">-- Select country --</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div className="wa-row">
          <div className="wa-field">
            <div className="wa-label">City Name *</div>
            <input className="wa-input" placeholder="Da Nang" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="wa-field">
            <div className="wa-label">Province</div>
            <input className="wa-input" placeholder="Quang Nam" value={form.province} onChange={e => set("province", e.target.value)} />
          </div>
        </div>
        <div className="wa-row">
          <div className="wa-field">
            <div className="wa-label">Normalized Name</div>
            <input className="wa-input" placeholder="da-nang (auto if empty)" value={form.normalizedName} onChange={e => set("normalizedName", e.target.value)} />
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,0.55)", fontSize:12, fontWeight:600, whiteSpace:"nowrap", paddingBottom:2, cursor:"pointer" }}>
            <input type="checkbox" checked={form.isPopular} onChange={e => set("isPopular", e.target.checked)}
              style={{ accentColor:"#6366f1", width:15, height:15 }} />
            Popular ⭐
          </label>
        </div>
        <button className="wa-submit" style={{alignSelf:"flex-start"}} onClick={add} disabled={busy || !selectedCountryId}>
          {busy ? <span className="wa-spinner" /> : "Add City"}
        </button>
        {err && <div className="wa-error">{err}</div>}
      </div>
    </div>
  );
}

function PricePanel({ toast }) {
  const { data: categories } = useLoad(() => wikiAdminApi.getCategories());
  const { data: units }      = useLoad(() => wikiAdminApi.getUnits());
  const { data: countries }  = useLoad(() => wikiAdminApi.getCountries());

  const [selectedCountryId, setSelectedCountryId] = useState("");
  const { data: cities } = useLoad(
    () => selectedCountryId ? wikiAdminApi.getCities(selectedCountryId) : Promise.resolve({ data: { data: [] } }),
    [selectedCountryId]
  );
  const { data: currencies } = useLoad(() => wikiAdminApi.getCurrencies());

  const [form, setForm] = useState({
    city:"", item:"", categoryId:"", unitId:"",
    minPrice:"", maxPrice:"", note:"",
  });
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);

  // For viewing existing prices
  const [priceCity, setPriceCity]     = useState("");
  const [priceCurrency, setPriceCurrency] = useState("VND");
  const [prices, setPrices]           = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadPrices = async () => {
    if (!priceCity) return;
    setLoadingPrices(true);
    try {
      const r = await wikiAdminApi.getPrices(priceCity, priceCurrency);
      setPrices(r.data?.data ?? []);
    } catch { setPrices([]); }
    finally { setLoadingPrices(false); }
  };

  const add = async () => {
    if (!form.city || !form.item.trim() || !form.categoryId || !form.unitId)
      return setErr("City, item, category, and unit are required");
    setBusy(true); setErr("");
    try {
      await wikiAdminApi.createPrice({
        city: form.city,
        item: form.item.trim(),
        categoryId: +form.categoryId,
        unitId: +form.unitId,
        minPrice: form.minPrice ? +form.minPrice : null,
        maxPrice: form.maxPrice ? +form.maxPrice : null,
        note: form.note.trim(),
      });
      setForm({ city:"", item:"", categoryId:"", unitId:"", minPrice:"", maxPrice:"", note:"" });
      toast("✅ Price added");
    } catch (e) { setErr(e?.response?.data?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this price?")) return;
    try { await wikiAdminApi.deletePrice(id); loadPrices(); toast("🗑 Deleted"); }
    catch { toast("❌ Error"); }
  };

  return (
    <div className="wa-section">
      {/* View prices */}
      <div className="wa-section-label">View Prices</div>
      <div className="wa-row" style={{alignItems:"flex-end"}}>
        <div className="wa-field">
          <div className="wa-label">City (text)</div>
          <input className="wa-input" placeholder="e.g. Da Nang" value={priceCity} onChange={e => setPriceCity(e.target.value)} />
        </div>
        <div className="wa-field" style={{maxWidth:110}}>
          <div className="wa-label">Currency</div>
          <select className="wa-select" value={priceCurrency} onChange={e => setPriceCurrency(e.target.value)}>
            {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            {currencies.length === 0 && <option value="VND">VND</option>}
          </select>
        </div>
        <button className="wa-submit" onClick={loadPrices} disabled={!priceCity || loadingPrices}>
          {loadingPrices ? <span className="wa-spinner" /> : "Load"}
        </button>
      </div>

      <div className="wa-list">
        {prices.length === 0 ? (
          <div className="wa-empty">No prices loaded</div>
        ) : prices.map(p => (
          <div className="wa-item" key={p.id}>
            <div className="wa-item-dot" style={{background:"rgba(245,158,11,0.15)"}}>💰</div>
            <div className="wa-item-info">
              <div className="wa-item-name">{p.item}</div>
              <div className="wa-item-sub">{p.category} · {p.minPrice?.toLocaleString()} – {p.maxPrice?.toLocaleString()} {priceCurrency} / {p.unit}</div>
            </div>
            <button className="wa-item-del" onClick={() => del(p.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Add price */}
      <div className="wa-section-label">Add Price</div>
      <div className="wa-form">
        {/* Country → City */}
        <div className="wa-row">
          <div className="wa-field">
            <div className="wa-label">Country *</div>
            <select className="wa-select" value={selectedCountryId} onChange={e => { setSelectedCountryId(e.target.value); set("city",""); }}>
              <option value="">-- Select country --</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="wa-field">
            <div className="wa-label">City *</div>
            <select className="wa-select" value={form.city} onChange={e => set("city", e.target.value)} disabled={!selectedCountryId}>
              <option value="">-- Select city --</option>
              {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Category + Unit */}
        <div className="wa-row">
          <div className="wa-field">
            <div className="wa-label">Category *</div>
            <select className="wa-select" value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
              <option value="">-- Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="wa-field">
            <div className="wa-label">Unit *</div>
            <select className="wa-select" value={form.unitId} onChange={e => set("unitId", e.target.value)}>
              <option value="">-- Unit --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        {/* Item */}
        <div className="wa-field">
          <div className="wa-label">Item Name *</div>
          <input className="wa-input" placeholder="e.g. Phở bò" value={form.item} onChange={e => set("item", e.target.value)} />
        </div>

        {/* Min / Max price */}
        <div className="wa-row">
          <div className="wa-field">
            <div className="wa-label">Min Price (VND)</div>
            <input className="wa-input" type="number" placeholder="30000" value={form.minPrice} onChange={e => set("minPrice", e.target.value)} />
          </div>
          <div className="wa-field">
            <div className="wa-label">Max Price (VND)</div>
            <input className="wa-input" type="number" placeholder="60000" value={form.maxPrice} onChange={e => set("maxPrice", e.target.value)} />
          </div>
        </div>

        {/* Note */}
        <div className="wa-field">
          <div className="wa-label">Note (optional)</div>
          <input className="wa-input" placeholder="Extra info..." value={form.note} onChange={e => set("note", e.target.value)} />
        </div>

        <button className="wa-submit" style={{alignSelf:"flex-start"}} onClick={add} disabled={busy}>
          {busy ? <span className="wa-spinner" /> : "Add Price"}
        </button>
        {err && <div className="wa-error">{err}</div>}
      </div>
    </div>
  );
}

// ─── Shared tiny spinner ──────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <span className="wa-spinner" style={{width:22,height:22}} />
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function WikiAdminModal({ open, onClose }) {
  const [tab, setTab]     = useState("category");
  const [toastMsg, setToastMsg] = useState("");

  const toast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2400);
  };

  if (!open) return null;

  const Panel = {
    category: <CategoryPanel toast={toast} />,
    unit:     <UnitPanel     toast={toast} />,
    country:  <CountryPanel  toast={toast} />,
    city:     <CityPanel     toast={toast} />,
    price:    <PricePanel    toast={toast} />,
  }[tab];

  return (
    <>
      <style>{css}</style>
      <Toast msg={toastMsg} />

      <div className="wa-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="wa-modal">

          {/* Header */}
          <div className="wa-header">
            <div className="wa-header-title">
              🌐 Wiki Price Manager
              <span className="wa-header-badge">ADMIN</span>
            </div>
            <button className="wa-close" onClick={onClose}>✕</button>
          </div>

          {/* Tabs */}
          <div className="wa-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`wa-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="wa-divider" />

          {/* Body */}
          <div className="wa-body">{Panel}</div>

        </div>
      </div>
    </>
  );
}