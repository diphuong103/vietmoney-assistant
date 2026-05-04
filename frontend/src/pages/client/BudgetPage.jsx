import { useEffect, useState, useMemo, useRef } from 'react';
import Navbar from '../../components/layout/Navbar';
import Modal from '../../components/common/Modal';
import useCategories from '../../hooks/useCategories';
import CategoryModal from '../../components/budget/CategoryModal';
import { useTransactionStore } from '../../store/transactionStore';
import { useBudgetStore } from '../../store/budgetStore';
import budgetApi from '../../api/budgetApi';

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt         = (n) => Number(n || 0).toLocaleString('en-US');
const fmtM        = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
  return String(v);
};
const pctOf       = (a, b)  => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
const daysBetween = (s, e)  => { if (!s || !e) return 0; return Math.max(0, Math.round((new Date(e) - new Date(s)) / 86_400_000) + 1); };
const daysLeft    = (e)     => { if (!e) return 0; return Math.max(0, Math.ceil((new Date(e) - new Date()) / 86_400_000)); };
const toDateKey   = (d)     => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
const isToday     = (d)     => { if (!d) return false; return toDateKey(d) === toDateKey(new Date()); };
const fmtDate     = (d)     => { if (!d) return ''; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('en-US', { month:'short', day:'numeric' }); };
const fmtTime     = (d)     => {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x)) return d;
  const diff = Date.now() - x;
  if (diff < 3_600_000)  return Math.max(1, Math.round(diff / 60_000)) + 'm ago';
  if (diff < 86_400_000) return 'Today ' + x.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  return fmtDate(d) + ' ' + x.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
};

const CAT_COLORS = ['#1D9E75','#378ADD','#EF9F27','#D4537E','#7F77DD','#D85A30','#639922','#BA7517'];

// ─── Compute budget spent from real transactions ───────────────────────────
function calcBudgetSpent(budget, transactions) {
  if (!budget) return 0;
  return transactions
    .filter(t => t.type === 'EXPENSE'
      && toDateKey(t.createdAt) >= budget.startDate
      && toDateKey(t.createdAt) <= budget.endDate)
    .reduce((s, t) => s + Number(t.amount), 0);
}

// ─── Warnings ──────────────────────────────────────────────────────────────
function buildWarnings({ dailyPct, dailyBudget, spentToday, activeBudget, computedSpent, totalIncome, totalExpense }) {
  const w = [];
  if (dailyPct >= 90)
    w.push({ icon:'🔴', color:'#E24B4A', title:'Daily budget exceeded!', desc:`Used ${Math.round(dailyPct)}% of today's budget. Take control now!` });
  else if (dailyPct >= 70)
    w.push({ icon:'🟠', color:'#EF9F27', title:'Approaching daily limit', desc:`${Math.round(dailyPct)}% used · ₫${fmtM(dailyBudget - spentToday)} remaining today.` });

  if (activeBudget) {
    const left      = daysLeft(activeBudget.endDate);
    const remaining = Number(activeBudget.totalAmount) - computedSpent;
    if (left > 0) {
      const avgPerDay  = remaining / left;
      const dailyLimit = Number(activeBudget.totalAmount) / daysBetween(activeBudget.startDate, activeBudget.endDate);
      if (avgPerDay < dailyLimit * 0.6)
        w.push({ icon:'⚡', color:'#7F77DD', title:'At risk of overspending', desc:`₫${fmtM(remaining)} left in ${left} days (₫${fmtM(avgPerDay)}/day avg needed).` });
    }
    if (left <= 3 && left > 0)
      w.push({ icon:'📅', color:'#378ADD', title:'Budget period ending soon', desc:`"${activeBudget.name}" has ${left} day${left > 1 ? 's' : ''} left. Prepare a new period.` });
  }

  if (totalExpense > totalIncome && totalIncome > 0)
    w.push({ icon:'📉', color:'#E24B4A', title:'Expenses exceed income', desc:`Spent ₫${fmtM(totalExpense)} vs earned ₫${fmtM(totalIncome)}.` });

  if (w.length === 0)
    w.push({ icon:'✅', color:'#3B6D11', title:'Finances look healthy', desc:'All indicators are within safe thresholds. Keep it up!' });

  return w;
}

// ─── Sub-components ────────────────────────────────────────────────────────
function ProgressBar({ pct, color = '#378ADD', height = 6 }) {
  const bg = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : color;
  return (
    <div style={{ background:'var(--bg3, var(--color-background-secondary))', borderRadius:99, height, overflow:'hidden' }}>
      <div style={{ width:`${Math.min(100, pct)}%`, height:'100%', background:bg, borderRadius:99, transition:'width .6s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

function RingProgress({ pct, size = 80 }) {
  const r = 30, cx = 40, cy = 40;
  const circ   = 2 * Math.PI * r;
  const filled = (Math.min(100, pct) / 100) * circ;
  const color  = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : '#378ADD';
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3, var(--color-background-secondary))" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition:'stroke-dasharray .7s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

function DonutChart({ segments, size = 88 }) {
  const r = 32, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 88 88" width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3, var(--color-background-secondary))" strokeWidth="11" />
      {segments.map((s, i) => {
        if (s.pct <= 0) return null;
        const dash   = (s.pct / 100) * circ;
        const offset = circ * 0.25 - acc;
        acc += dash;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="11"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

function WeekBars({ data, color }) {
  const max  = Math.max(...data, 1);
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:52 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <div style={{ width:'100%', minWidth:10, height:Math.max(3, Math.round((v/max)*40)), background:v===max?color:color+'50', borderRadius:'3px 3px 0 0', transition:'height .4s ease' }} />
          <span style={{ fontSize:9, color:'var(--muted, var(--color-text-secondary))', fontFamily:'DM Mono, monospace' }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Badge({ children, variant = 'blue' }) {
  const map = {
    blue:   { bg:'#E6F1FB', text:'#185FA5' },
    green:  { bg:'#EAF3DE', text:'#3B6D11' },
    red:    { bg:'#FCEBEB', text:'#A32D2D' },
    amber:  { bg:'#FAEEDA', text:'#854F0B' },
    purple: { bg:'#EEEDFE', text:'#534AB7' },
  };
  const s = map[variant] || map.blue;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, background:s.bg, color:s.text }}>
      {children}
    </span>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', margin:'20px 0 10px' }}>
      <span className="section-title" style={{ margin:0, padding:0, fontSize:13 }}>{children}</span>
      {action}
    </div>
  );
}

// ─── Chart.js lazy loader ──────────────────────────────────────────────────
function useChartJs() {
  const [ready, setReady] = useState(typeof window !== 'undefined' && typeof window.Chart !== 'undefined');
  useEffect(() => {
    if (ready) return;
    const existing = document.getElementById('chartjs-cdn');
    if (existing) { existing.addEventListener('load', () => setReady(true)); return; }
    const s = document.createElement('script');
    s.id     = 'chartjs-cdn';
    s.src    = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

// ─── 30-day Line Chart ─────────────────────────────────────────────────────
function DailyLineChart({ transactions, catTotals }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const expenseCatTotals = catTotals.filter(c => c.type !== 'INCOME');

  const { labels, datasets, totalAll, avgPerDay } = useMemo(() => {
    const DAYS     = 30;
    const dateKeys = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (DAYS - 1 - i));
      return toDateKey(d);
    });
    const lbls = dateKeys.map(dk => {
      const d = new Date(dk + 'T00:00:00');
      return `${d.getMonth()+1}/${d.getDate()}`;
    });
    const ds = expenseCatTotals.slice(0, 5).map(cat => ({
      label: `${cat.icon || ''} ${cat.name}`.trim(),
      color: cat.color,
      data:  dateKeys.map(dk =>
        transactions
          .filter(t => t.type === 'EXPENSE' && t.categoryId === cat.id && toDateKey(t.createdAt) === dk)
          .reduce((s, t) => s + Number(t.amount), 0)
      ),
    }));
    const allTotal = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    return { labels: lbls, datasets: ds, totalAll: allTotal, avgPerDay: allTotal / DAYS };
  }, [transactions, expenseCatTotals]);

  useEffect(() => {
    if (!canvasRef.current || typeof window.Chart === 'undefined') return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(ds => ({
          label:                ds.label,
          data:                 ds.data,
          borderColor:          ds.color,
          backgroundColor:      ds.color + '1A',
          pointBackgroundColor: ds.color,
          pointBorderColor:     'transparent',
          pointRadius:          ds.data.map(v => v > 0 ? 4 : 0),
          pointHoverRadius:     6,
          borderWidth:          2,
          tension:              0.4,
          fill:                 false,
          spanGaps:             false,
        })),
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction:         { mode:'index', intersect:false },
        plugins: {
          legend: { display:false },
          tooltip: {
            backgroundColor:'#111827', titleColor:'#9ca3af', bodyColor:'#f3f4f6',
            borderColor:'#374151', borderWidth:1, padding:10,
            callbacks: {
              title:  (items) => items[0].label,
              label:  (ctx)   => ` ${ctx.dataset.label}: ₫${ctx.raw.toLocaleString('en-US')}`,
              footer: (items) => { const sum = items.reduce((s, i) => s + i.raw, 0); return sum > 0 ? `Total: ₫${sum.toLocaleString('en-US')}` : ''; },
            },
          },
        },
        scales: {
          x: { grid:{ color:'rgba(255,255,255,0.04)', drawBorder:false }, ticks:{ color:'#6b7280', font:{ family:'DM Mono, monospace', size:10 }, maxRotation:0, autoSkip:true, maxTicksLimit:8 } },
          y: { grid:{ color:'rgba(255,255,255,0.04)', drawBorder:false }, beginAtZero:true, ticks:{ color:'#6b7280', font:{ family:'DM Mono, monospace', size:10 }, callback:(v) => v>=1_000_000?(v/1_000_000).toFixed(1)+'M':v>=1_000?(v/1_000).toFixed(0)+'K':v } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [labels, datasets]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, padding:'0 2px' }}>
        <div>
          <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TOTAL SPENT</div>
          <div style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono, monospace' }}>₫{fmt(totalAll)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>AVG / DAY</div>
          <div style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono, monospace' }}>₫{fmt(Math.round(avgPerDay))}</div>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
        {datasets.map((ds, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:ds.color, flexShrink:0, display:'inline-block' }} />
            <span style={{ fontSize:11, color:'var(--muted)' }}>{ds.label}</span>
          </div>
        ))}
      </div>
      <div style={{ position:'relative', width:'100%', height:200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const { categories = [], addCategory, deleteCategory } = useCategories();
  const { transactions, fetchTransactions, addTransaction, updateTransaction, removeTransaction } = useTransactionStore();
  const { dailyBudget, spentToday, remaining, percentUsed, fetchDailyBudget } = useBudgetStore();
  const chartReady = useChartJs();

  // ── Modal & form state ──
  const [addOpen,        setAddOpen]        = useState(false);
  const [catOpen,        setCatOpen]        = useState(false);
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [editingBudget,  setEditingBudget]  = useState(null);
  const [budgets,        setBudgets]        = useState([]);
  const [activeCatIdx,   setActiveCatIdx]   = useState(0);
  const [analysisCatTab, setAnalysisCatTab] = useState('expense');
  const [budgetForm,     setBudgetForm]     = useState({ name:'', totalAmount:'', currency:'VND', startDate:'', endDate:'' });

  // ── Shared transaction form fields (used by both Add and Edit modals) ──
  const [txnType,   setTxnType]   = useState('EXPENSE');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnNote,   setTxnNote]   = useState('');
  const [txnCatId,  setTxnCatId]  = useState('');

  // ── Edit transaction state ──
  const [editTxnOpen,  setEditTxnOpen]  = useState(false);
  const [editingTxn,   setEditingTxn]   = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchDailyBudget().catch(() => {});
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try { setBudgets((await budgetApi.getBudgets()) || []); } catch (e) { console.error(e); }
  };

  // ── Derived values ──
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const totalIncome  = useMemo(() => transactions.filter(t => t.type === 'INCOME').reduce((s, t)  => s + Number(t.amount), 0), [transactions]);
  const incomeToday  = useMemo(() => transactions.filter(t => t.type === 'INCOME' && isToday(t.createdAt)).reduce((s, t) => s + Number(t.amount), 0), [transactions]);

  const budgetsEnriched = useMemo(() =>
    budgets.map(b => ({ ...b, computedSpent: calcBudgetSpent(b, transactions) })),
  [budgets, transactions]);

  const activeBudget = useMemo(() => {
    const today = toDateKey(new Date());
    return budgetsEnriched.find(b => b.startDate <= today && b.endDate >= today) || budgetsEnriched[0] || null;
  }, [budgetsEnriched]);

  const totalBudget   = activeBudget ? Number(activeBudget.totalAmount) : 0;
  const walletBalance = totalBudget + totalIncome - totalExpense;

  const expenseCatIds = useMemo(() => new Set(transactions.filter(t => t.type === 'EXPENSE' && t.categoryId).map(t => t.categoryId)), [transactions]);
  const incomeCatIds  = useMemo(() => new Set(transactions.filter(t => t.type === 'INCOME'  && t.categoryId).map(t => t.categoryId)), [transactions]);

  const expenseCatTotals = useMemo(() =>
    categories
      .filter(cat => expenseCatIds.has(cat.id) || !incomeCatIds.has(cat.id))
      .map((cat, idx) => ({
        ...cat,
        color:      cat.color || CAT_COLORS[idx % CAT_COLORS.length],
        total:      transactions.filter(t => t.type === 'EXPENSE' && t.categoryId === cat.id).reduce((s, t) => s + Number(t.amount), 0),
        todayTotal: transactions.filter(t => t.type === 'EXPENSE' && t.categoryId === cat.id && isToday(t.createdAt)).reduce((s, t) => s + Number(t.amount), 0),
        sparkline:  Array.from({ length:7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          const dk = toDateKey(d);
          return transactions.filter(t => t.type === 'EXPENSE' && t.categoryId === cat.id && toDateKey(t.createdAt) === dk).reduce((s, t) => s + Number(t.amount), 0);
        }),
        txns:    transactions.filter(t => t.type === 'EXPENSE' && t.categoryId === cat.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        catType: 'EXPENSE',
      }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total),
  [categories, transactions, expenseCatIds, incomeCatIds]);

  const incomeCatTotals = useMemo(() =>
    categories
      .filter(cat => incomeCatIds.has(cat.id))
      .map((cat, idx) => ({
        ...cat,
        color:      cat.color || CAT_COLORS[(idx + 4) % CAT_COLORS.length],
        total:      transactions.filter(t => t.type === 'INCOME' && t.categoryId === cat.id).reduce((s, t) => s + Number(t.amount), 0),
        todayTotal: transactions.filter(t => t.type === 'INCOME' && t.categoryId === cat.id && isToday(t.createdAt)).reduce((s, t) => s + Number(t.amount), 0),
        sparkline:  Array.from({ length:7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          const dk = toDateKey(d);
          return transactions.filter(t => t.type === 'INCOME' && t.categoryId === cat.id && toDateKey(t.createdAt) === dk).reduce((s, t) => s + Number(t.amount), 0);
        }),
        txns:    transactions.filter(t => t.type === 'INCOME' && t.categoryId === cat.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        catType: 'INCOME',
      }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total),
  [categories, transactions, incomeCatIds]);

  const allCatTotals = useMemo(() => [
    ...expenseCatTotals.map(c => ({ ...c, displayAmount: c.total, displayType: 'EXPENSE' })),
    ...incomeCatTotals.map(c => ({ ...c, displayAmount: c.total, displayType: 'INCOME' })),
  ].sort((a, b) => b.displayAmount - a.displayAmount), [expenseCatTotals, incomeCatTotals]);

  const activeCatTotals = useMemo(() => {
    if (analysisCatTab === 'expense') return expenseCatTotals;
    if (analysisCatTab === 'income')  return incomeCatTotals;
    return allCatTotals;
  }, [analysisCatTab, expenseCatTotals, incomeCatTotals, allCatTotals]);

  const analysisTotalBase = useMemo(() => {
    if (analysisCatTab === 'expense') return totalExpense;
    if (analysisCatTab === 'income')  return totalIncome;
    return totalExpense + totalIncome;
  }, [analysisCatTab, totalExpense, totalIncome]);

  const donutSegs     = activeCatTotals.map(c => ({ pct: pctOf(c.total, analysisTotalBase), color: c.color }));
  const topExpenseCat = expenseCatTotals[0];
  const detailCatList = expenseCatTotals;

  const warnings = useMemo(() => buildWarnings({
    dailyPct: percentUsed, dailyBudget, spentToday,
    activeBudget, computedSpent: activeBudget?.computedSpent || 0,
    totalIncome, totalExpense,
  }), [percentUsed, dailyBudget, spentToday, activeBudget, totalIncome, totalExpense]);

  // ── Helpers: reset & close form fields ──
  const resetTxnForm = () => { setTxnType('EXPENSE'); setTxnAmount(''); setTxnNote(''); setTxnCatId(''); };

  // ── Actions: Add transaction ──
  const submitTxn = async () => {
    const amount = parseFloat(txnAmount);
    if (!amount || amount <= 0) return;
    await addTransaction({ type: txnType, amount, description: txnNote.trim() || '—', categoryId: txnCatId ? Number(txnCatId) : null });
    resetTxnForm();
    setAddOpen(false);
    fetchDailyBudget().catch(() => {});
    loadBudgets();
  };

  // ── Actions: Open edit transaction modal ──
  const openEditTxn = (t) => {
    setEditingTxn(t);
    setTxnType(t.type);
    setTxnAmount(String(t.amount));
    setTxnNote(t.note || t.description || '');
    setTxnCatId(t.categoryId ? String(t.categoryId) : '');
    setEditTxnOpen(true);
  };

  // ── Actions: Submit edit transaction ──
  const submitEditTxn = async () => {
    const amount = parseFloat(txnAmount);
    if (!amount || amount <= 0 || !editingTxn) return;
    await updateTransaction(editingTxn.id, {
      type:       txnType,
      amount,
      description: txnNote.trim() || '—',
      note:        txnNote.trim() || '—',
      categoryId:  txnCatId ? Number(txnCatId) : null,
    });
    resetTxnForm();
    setEditTxnOpen(false);
    setEditingTxn(null);
    fetchDailyBudget().catch(() => {});
    loadBudgets();
  };

  // ── Actions: Budget CRUD ──
  const openNewBudget  = () => { setEditingBudget(null); setBudgetForm({ name:'', totalAmount:'', currency:'VND', startDate:'', endDate:'' }); setBudgetFormOpen(true); };
  const openEditBudget = (b) => { setEditingBudget(b); setBudgetForm({ name:b.name, totalAmount:b.totalAmount, currency:b.currency, startDate:b.startDate, endDate:b.endDate }); setBudgetFormOpen(true); };

  const saveBudget = async () => {
    const payload = { name: budgetForm.name.trim(), totalAmount: parseFloat(budgetForm.totalAmount), currency: budgetForm.currency, startDate: budgetForm.startDate, endDate: budgetForm.endDate };
    if (!payload.name || !payload.totalAmount) return;
    try {
      editingBudget ? await budgetApi.updateBudget(editingBudget.id, payload) : await budgetApi.createBudget(payload);
      await loadBudgets(); fetchDailyBudget().catch(() => {}); setBudgetFormOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteBudget = async (id) => {
    try { await budgetApi.deleteBudget(id); setBudgets(p => p.filter(b => b.id !== id)); fetchDailyBudget().catch(() => {}); } catch (e) { console.error(e); }
  };

  const resolveCat = (t) => categories.find(c => c.id === t.categoryId) || { icon: t.type === 'INCOME' ? '💰' : '📦', name: 'Other', color: '#888' };

  // ── Shared styles ──
  const card    = { background:'var(--bg2, var(--color-background-primary))', border:'1px solid var(--border, var(--color-border-tertiary))', borderRadius:16, padding:'14px 16px', marginBottom:10 };
  const grid2   = { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:10 };
  const statBox = (accent) => ({ background: accent ? accent + '14' : 'var(--bg3, var(--color-background-secondary))', border:`0.5px solid ${accent ? accent + '40' : 'var(--border, var(--color-border-tertiary))'}`, borderRadius:12, padding:'10px 12px' });
  const divider = { border:'none', borderTop:'0.5px solid var(--border, var(--color-border-tertiary))', margin:'8px 0' };
  const px      = { padding:'0 20px' };

  // ── Shared transaction form JSX (reused in Add + Edit modals) ──
  const txnFormBody = (
    <>
      <div className="type-tabs">
        <button className={`type-tab${txnType === 'EXPENSE' ? ' active-expense' : ''}`} onClick={() => setTxnType('EXPENSE')}>Expense</button>
        <button className={`type-tab${txnType === 'INCOME'  ? ' active-income'  : ''}`} onClick={() => setTxnType('INCOME')}>Income</button>
      </div>
      <div className="form-field">
        <label className="form-label">Amount (VND)</label>
        <input type="number" className="form-input" placeholder="0" min="0"
          value={txnAmount} onChange={e => setTxnAmount(e.target.value)} />
      </div>
      <div className="form-field">
        <label className="form-label">Note</label>
        <input type="text" className="form-input" placeholder="e.g. Lunch, Grab…"
          value={txnNote} onChange={e => setTxnNote(e.target.value)} />
      </div>
     <div className="form-field">
       <label className="form-label">Category</label>
       <select
         className="form-input"
         value={txnCatId}
         onChange={e => setTxnCatId(e.target.value)}
       >
         <option value="">— None —</option>

         {categories
           .filter(c => (c.type || '').toUpperCase() === txnType)
           .map(c => (
             <option key={c.id} value={c.id}>
               {c.icon} {c.name}
             </option>
           ))}
       </select>
     </div>
    </>
  );

  return (
    <div className="page active" id="page-budget" style={{ paddingBottom:100 }}>

      <Navbar
        title={<>{'Viet'}<span style={{ color:'var(--accent)' }}>{'Money'}</span></>}
        subtitle="Budget"
        actions={
          <>
            <button className="icon-btn" onClick={openNewBudget} title="Create budget">🎯</button>
            <button className="icon-btn" title="Calendar">📅</button>
          </>
        }
      />

      {/* HERO CARD */}
      <div style={{ padding:'12px 20px 0' }}>
        <div className="greeting-card" style={{ borderRadius:20, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:12, opacity:0.7, marginBottom:4, fontWeight:500, letterSpacing:'.04em', textTransform:'uppercase' }}>Wallet Balance</div>
              <div style={{ fontSize:32, fontWeight:700, lineHeight:1.1, letterSpacing:'-0.02em' }}>₫{fmtM(Math.max(0, walletBalance))}</div>
              {walletBalance < 0 && <div style={{ fontSize:12, color:'#f99', marginTop:3 }}>⚠ Negative balance</div>}
            </div>
            {activeBudget && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, opacity:0.65, marginBottom:3 }}>{activeBudget.name}</div>
                <Badge variant="blue">{daysLeft(activeBudget.endDate)} days left</Badge>
              </div>
            )}
          </div>
          <div className="greeting-meta" style={{ display:'flex', gap:20 }}>
            <div className="meta-item"><strong>₫{fmtM(totalIncome)}</strong><span> income</span></div>
            <div className="meta-item"><strong>₫{fmtM(totalExpense)}</strong><span> spent</span></div>
            <div className="meta-item"><strong>₫{fmtM(totalBudget)}</strong><span> budget</span></div>
          </div>
        </div>
      </div>

      {/* BENTO QUICK STATS */}
      <div style={{ height:20 }} />
      <div style={px}>
        <div className="bento-grid" style={{ gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          <div className="bento-card" style={{ cursor:'default' }}>
            <div className="card-icon" style={{ fontSize:18 }}>📊</div>
            <div className="card-label">Daily Limit</div>
            <div className="card-value" style={{ fontSize:18 }}>₫{fmtM(dailyBudget || 0)}</div>
            {dailyBudget > 0 && (
              <div style={{ marginTop:6 }}>
                <ProgressBar pct={percentUsed} color="var(--accent, #378ADD)" height={5} />
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{Math.round(percentUsed)}% used</div>
              </div>
            )}
          </div>
          <div className="bento-card" style={{ cursor:'default' }}>
            <div className="card-icon" style={{ fontSize:18 }}>💳</div>
            <div className="card-label">Remaining Today</div>
            <div className="card-value" style={{ fontSize:18, color: remaining < 0 ? '#E24B4A' : undefined }}>₫{fmtM(Math.max(0, remaining))}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Spent: ₫{fmtM(spentToday)} · Earned: ₫{fmtM(incomeToday)}</div>
          </div>
        </div>
      </div>

      {/* PERIOD BUDGETS */}
      <SectionTitle action={<button className="icon-btn" onClick={openNewBudget} style={{ fontSize:18, fontWeight:700 }}>＋</button>}>
        Period Budgets
      </SectionTitle>
      <div style={px}>
        {budgetsEnriched.length === 0 ? (
          <div style={{ ...card, textAlign:'center', padding:'24px 16px', color:'var(--muted)' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🎯</div>
            <div style={{ fontSize:13, fontWeight:500 }}>No budgets yet</div>
            <div style={{ fontSize:12, marginTop:4, opacity:0.7 }}>Tap + to create your first budget</div>
          </div>
        ) : (
          budgetsEnriched.map(b => {
            const today      = toDateKey(new Date());
            const isActive   = b.startDate <= today && b.endDate >= today;
            const spent      = b.computedSpent;
            const bTotal     = Number(b.totalAmount);
            const bPct       = pctOf(spent, bTotal);
            const bLeft      = daysLeft(b.endDate);
            const bTotalDays = daysBetween(b.startDate, b.endDate);
            const bRemaining = bTotal - spent;
            const bDailyLimit = bTotalDays > 0 ? bTotal / bTotalDays : 0;

            return (
              <div key={b.id} style={{ ...card, borderLeft: isActive ? '3px solid var(--accent, #378ADD)' : undefined }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:600 }}>{b.name}</span>
                      {isActive && <Badge variant="blue">Active</Badge>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>
                      {fmtDate(b.startDate)} → {fmtDate(b.endDate)} · {bTotalDays} days · {bLeft} left
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:2 }}>
                    <button className="icon-btn" style={{ fontSize:13 }} onClick={() => openEditBudget(b)}>✏️</button>
                    <button className="icon-btn" style={{ fontSize:13 }} onClick={() => handleDeleteBudget(b.id)}>🗑️</button>
                  </div>
                </div>

                <div style={grid2}>
                  <div style={statBox('#E24B4A')}>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>SPENT (PERIOD)</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#A32D2D' }}>₫{fmtM(spent)}</div>
                  </div>
                  <div style={statBox('#378ADD')}>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TOTAL BUDGET</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#185FA5' }}>₫{fmtM(bTotal)}</div>
                  </div>
                  <div style={statBox(bRemaining < 0 ? '#E24B4A' : '#639922')}>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>REMAINING (PERIOD)</div>
                    <div style={{ fontSize:15, fontWeight:700, color: bRemaining < 0 ? '#A32D2D' : '#3B6D11' }}>₫{fmtM(bRemaining)}</div>
                  </div>
                  <div style={statBox(bPct >= 80 ? '#E24B4A' : bPct >= 60 ? '#EF9F27' : '#639922')}>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>% OF BUDGET</div>
                    <div style={{ fontSize:15, fontWeight:700, color: bPct >= 80 ? '#A32D2D' : bPct >= 60 ? '#854F0B' : '#3B6D11' }}>{bPct}%</div>
                  </div>
                </div>

                <ProgressBar pct={bPct} color="var(--accent, #378ADD)" height={5} />
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:5, marginBottom: isActive && dailyBudget > 0 ? 14 : 0, fontFamily:'DM Mono, monospace' }}>
                  Daily limit: ₫{fmtM(bDailyLimit)}/day
                  {bLeft > 0 && bRemaining > 0 && <> · Must spend ≤₫{fmtM(bRemaining / bLeft)}/day</>}
                </div>

                {isActive && dailyBudget > 0 && (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'12px 0' }}>
                      <div style={{ flex:1, borderTop:'0.5px solid var(--border, var(--color-border-tertiary))' }} />
                      <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>Today</span>
                      <div style={{ flex:1, borderTop:'0.5px solid var(--border, var(--color-border-tertiary))' }} />
                    </div>
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <RingProgress pct={percentUsed} size={72} />
                        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:13, fontWeight:700, lineHeight:1, color: percentUsed >= 90 ? '#E24B4A' : percentUsed >= 70 ? '#EF9F27' : 'var(--text, var(--color-text-primary))' }}>
                            {Math.round(percentUsed)}%
                          </span>
                          <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'DM Mono, monospace', marginTop:1 }}>used</span>
                        </div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={grid2}>
                          <div style={statBox()}>
                            <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TODAY LIMIT</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#185FA5' }}>₫{fmtM(dailyBudget)}</div>
                          </div>
                          <div style={statBox()}>
                            <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>SPENT TODAY</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#A32D2D' }}>₫{fmtM(spentToday)}</div>
                          </div>
                          <div style={statBox()}>
                            <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>LEFT TODAY</div>
                            <div style={{ fontSize:13, fontWeight:700, color: remaining < 0 ? '#E24B4A' : '#3B6D11' }}>₫{fmtM(Math.max(0, remaining))}</div>
                          </div>
                          <div style={statBox()}>
                            <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>EARNED TODAY</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#3B6D11' }}>₫{fmtM(incomeToday)}</div>
                          </div>
                        </div>
                        <ProgressBar pct={percentUsed} color="var(--accent, #378ADD)" height={4} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* LINE CHART */}
      <SectionTitle>Spending — Last 30 Days</SectionTitle>
      <div style={px}>
        <div style={card}>
          {chartReady && expenseCatTotals.length > 0 ? (
            <DailyLineChart transactions={transactions} catTotals={expenseCatTotals} />
          ) : !chartReady ? (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:13 }}>Loading chart…</div>
          ) : (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:13 }}>No expense categories to display</div>
          )}
        </div>
      </div>

      {/* CATEGORY ANALYSIS */}
      <SectionTitle>Category Analysis</SectionTitle>
      <div style={px}>
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {[
            { key:'expense', label:'Expense', color:'#E24B4A' },
            { key:'income',  label:'Income',  color:'#3B6D11' },
            { key:'all',     label:'All',     color:'#378ADD' },
          ].map(tab => {
            const active = analysisCatTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setAnalysisCatTab(tab.key); setActiveCatIdx(0); }}
                style={{ padding:'5px 16px', fontSize:12, fontWeight:600, borderRadius:99, border: active ? `1.5px solid ${tab.color}` : '0.5px solid var(--border, var(--color-border-tertiary))', cursor:'pointer', transition:'all .2s', background: active ? tab.color + '18' : 'transparent', color: active ? tab.color : 'var(--muted)' }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={card}>
          {activeCatTotals.length === 0 || analysisTotalBase === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'var(--muted)', fontSize:13 }}>No spending data available.</div>
          ) : (
            <>
              <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:16 }}>
                <div style={{ position:'relative' }}>
                  <DonutChart segments={donutSegs} size={88} />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                    <span style={{ fontSize:13, fontWeight:700, lineHeight:1 }}>{activeCatTotals.length}</span>
                    <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>CAT</span>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  {activeCatTotals.slice(0, 5).map((c, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                      <span style={{ width:9, height:9, borderRadius:2, background:c.color, flexShrink:0, display:'inline-block' }} />
                      <span style={{ fontSize:12, color:'var(--muted)', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.icon} {c.name}</span>
                      <span style={{ fontSize:12, fontWeight:600, fontFamily:'DM Mono, monospace' }}>{pctOf(c.total, analysisTotalBase)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {analysisCatTab !== 'income' && (
                  <div style={{ flex:1, ...statBox('#E24B4A') }}>
                    <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TOTAL EXPENSE</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#A32D2D' }}>₫{fmtM(totalExpense)}</div>
                  </div>
                )}
                {analysisCatTab !== 'expense' && (
                  <div style={{ flex:1, ...statBox('#639922') }}>
                    <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TOTAL INCOME</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#3B6D11' }}>₫{fmtM(totalIncome)}</div>
                  </div>
                )}
                {analysisCatTab === 'all' && (
                  <div style={{ flex:1, ...statBox(walletBalance >= 0 ? '#378ADD' : '#E24B4A') }}>
                    <div style={{ fontSize:9, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>NET FLOW</div>
                    <div style={{ fontSize:13, fontWeight:700, color: walletBalance >= 0 ? '#185FA5' : '#A32D2D' }}>{walletBalance >= 0 ? '+' : ''}₫{fmtM(totalIncome - totalExpense)}</div>
                  </div>
                )}
              </div>

              {activeCatTotals.map((c, i) => (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'var(--muted)' }}>{c.icon} {c.name}</span>
                      {analysisCatTab === 'all' && (
                        <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:99, background: c.catType === 'INCOME' ? '#EAF3DE' : '#FCEBEB', color: c.catType === 'INCOME' ? '#3B6D11' : '#A32D2D' }}>
                          {c.catType === 'INCOME' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight:600, fontFamily:'DM Mono, monospace', color: c.catType === 'INCOME' ? '#3B6D11' : '#A32D2D' }}>
                      {c.catType === 'INCOME' ? '+' : '−'}₫{fmtM(c.total)}
                    </span>
                  </div>
                  <ProgressBar pct={pctOf(c.total, analysisTotalBase)} color={c.color} height={5} />
                </div>
              ))}

              {topExpenseCat && analysisCatTab !== 'income' && (
                <div style={{ marginTop:12, padding:'10px 12px', background: topExpenseCat.color + '14', border:`0.5px solid ${topExpenseCat.color}40`, borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>Top expense category</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{topExpenseCat.icon} {topExpenseCat.name} · ₫{fmtM(topExpenseCat.total)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EXPENSE CATEGORY DETAIL */}
      {detailCatList.length > 0 && (
        <>
          <SectionTitle>Expense Category Detail</SectionTitle>
          <div style={px}>
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:10, scrollbarWidth:'none' }}>
              {detailCatList.map((c, i) => {
                const active = activeCatIdx === i;
                return (
                  <button key={i} onClick={() => setActiveCatIdx(i)}
                    style={{ flexShrink:0, padding:'5px 14px', fontSize:12, fontWeight:600, borderRadius:99, border: active ? `1.5px solid ${c.color}` : '0.5px solid var(--border, var(--color-border-tertiary))', cursor:'pointer', transition:'all .2s', background: active ? c.color + '18' : 'transparent', color: active ? c.color : 'var(--muted)' }}>
                    {c.icon} {c.name}
                  </button>
                );
              })}
            </div>
            {(() => {
              const c = detailCatList[activeCatIdx];
              if (!c) return null;
              const maxDay  = Math.max(...c.sparkline);
              const maxIdx  = c.sparkline.indexOf(maxDay);
              const dayLbls = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
              return (
                <div style={card}>
                  <div style={grid2}>
                    <div style={statBox(c.color)}>
                      <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TOTAL SPENT</div>
                      <div style={{ fontSize:15, fontWeight:700, color:c.color }}>₫{fmtM(c.total)}</div>
                    </div>
                    <div style={statBox()}>
                      <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>% OF EXPENSES</div>
                      <div style={{ fontSize:15, fontWeight:700 }}>{pctOf(c.total, totalExpense)}%</div>
                    </div>
                    <div style={statBox()}>
                      <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>TODAY</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#854F0B' }}>₫{fmtM(c.todayTotal)}</div>
                    </div>
                    <div style={statBox(c.color)}>
                      <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500, marginBottom:2 }}>PEAK DAY</div>
                      <div style={{ fontSize:15, fontWeight:700, color:c.color }}>{dayLbls[maxIdx] || '—'}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>₫{fmtM(maxDay)}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8, fontWeight:500 }}>Last 7 days</div>
                    <WeekBars data={c.sparkline} color={c.color} />
                  </div>
                  {c.txns.length > 0 && (
                    <>
                      <hr style={divider} />
                      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8, fontWeight:500, textTransform:'uppercase', letterSpacing:'.05em' }}>Recent</div>
                      {c.txns.map((t, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom: i < c.txns.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:500 }}>{t.note || t.description || '—'}</div>
                            <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>{fmtTime(t.createdAt)}</div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'#A32D2D', fontFamily:'DM Mono, monospace' }}>−₫{fmt(t.amount)}</span>
                            <button className="icon-btn" style={{ fontSize:12 }} onClick={() => openEditTxn(t)}>✏️</button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* RECENT TRANSACTIONS */}
      <SectionTitle>Recent Transactions</SectionTitle>
      <div style={px}>
        <div style={card}>
          {transactions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--muted)', fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💸</div>
              No transactions yet. Tap <strong style={{ color:'var(--accent)' }}>+</strong> to add one!
            </div>
          ) : (
            transactions.slice(0, 20).map((t, i) => {
              const cat   = resolveCat(t);
              const isExp = t.type === 'EXPENSE';
              return (
                <div key={t.id}>
                  {i > 0 && <hr style={divider} />}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 0' }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:(cat.color || '#888') + (isExp ? '20' : '30'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{cat.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.note || t.description || '—'}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>{cat.name} · {fmtTime(t.createdAt)}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: isExp ? '#A32D2D' : '#3B6D11', fontFamily:'DM Mono, monospace' }}>
                        {isExp ? '−' : '+'}₫{fmt(t.amount)}
                      </div>
                      <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>≈${(Number(t.amount) / 25420).toFixed(2)}</div>
                    </div>
                    {/* Edit + Delete buttons */}
                    <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                      <button className="icon-btn" style={{ fontSize:12 }} onClick={() => openEditTxn(t)}>✏️</button>
                      <button className="icon-btn" style={{ fontSize:12 }} onClick={() => removeTransaction(t.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SMART WARNINGS */}
      <SectionTitle>Smart Warnings</SectionTitle>
      <div style={px}>
        <div style={card}>
          {warnings.map((w, i) => (
            <div key={i}>
              {i > 0 && <hr style={divider} />}
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'6px 0' }}>
                <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background: w.color + '18', border:`0.5px solid ${w.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{w.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{w.title}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{w.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FABs */}
      <div className="fab-container">
        <button className="fab fab-add" onClick={() => { resetTxnForm(); setAddOpen(true); }}>＋</button>
        <button className="fab fab-edit" onClick={() => setCatOpen(true)}>✏️</button>
      </div>

      {/* MODAL: ADD TRANSACTION */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); resetTxnForm(); }}>
        <div className="fab-modal">
          <h3>Add Transaction</h3>
          {txnFormBody}
          <button className="submit-form-btn" onClick={submitTxn}>Save Transaction</button>
        </div>
      </Modal>

      {/* MODAL: EDIT TRANSACTION */}
      <Modal open={editTxnOpen} onClose={() => { setEditTxnOpen(false); setEditingTxn(null); resetTxnForm(); }}>
        <div className="fab-modal">
          <h3>✏️ Edit Transaction</h3>
          {txnFormBody}
          <button className="submit-form-btn" onClick={submitEditTxn}>Update Transaction</button>
        </div>
      </Modal>

      {/* MODAL: BUDGET FORM */}
      <Modal open={budgetFormOpen} onClose={() => setBudgetFormOpen(false)}>
        <div className="fab-modal">
          <h3>{editingBudget ? '✏️ Edit Budget' : '🎯 New Budget'}</h3>
          <div className="form-field">
            <label className="form-label">Budget Name</label>
            <input type="text" className="form-input" placeholder="e.g. May Expenses" value={budgetForm.name} onChange={e => setBudgetForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Total Amount (VND)</label>
            <input type="number" className="form-input" placeholder="0" min="0" value={budgetForm.totalAmount} onChange={e => setBudgetForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Currency</label>
            <select className="form-input" value={budgetForm.currency} onChange={e => setBudgetForm(p => ({ ...p, currency: e.target.value }))}>
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={budgetForm.startDate} onChange={e => setBudgetForm(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={budgetForm.endDate} onChange={e => setBudgetForm(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          {budgetForm.startDate && budgetForm.endDate && budgetForm.totalAmount && (
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, padding:'8px 12px', background:'var(--bg3, var(--color-background-secondary))', borderRadius:10, fontFamily:'DM Mono, monospace' }}>
              💡 Daily limit ≈ ₫{fmtM(parseFloat(budgetForm.totalAmount) / Math.max(1, daysBetween(budgetForm.startDate, budgetForm.endDate)))}/day · {daysBetween(budgetForm.startDate, budgetForm.endDate)} days
            </div>
          )}
          <button className="submit-form-btn" onClick={saveBudget}>{editingBudget ? 'Update Budget' : 'Create Budget'}</button>
        </div>
      </Modal>

      {/* MODAL: CATEGORY */}
      <CategoryModal open={catOpen} onClose={() => setCatOpen(false)} categories={categories} addCategory={addCategory} deleteCategory={deleteCategory} />
    </div>
  );
}