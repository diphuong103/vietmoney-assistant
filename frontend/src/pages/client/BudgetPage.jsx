import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Modal from '../../components/common/Modal';

const DEFAULT_CATEGORIES = [
  { emoji: '🍜', name: 'Food',      color: '#C8F23D' },
  { emoji: '🛺', name: 'Transport', color: '#3DF2C8' },
  { emoji: '🏨', name: 'Hotel',     color: '#3D8FF2' },
  { emoji: '🎭', name: 'Activity',  color: '#F2C43D' },
  { emoji: '🛍️', name: 'Shopping',  color: '#F23D6E' },
];

const DAILY_BUDGET_DEFAULT = 2_000_000;

export default function BudgetPage() {
  const [transactions, setTransactions]   = useState([]);
  const [categories, setCategories]       = useState(DEFAULT_CATEGORIES);
  const [dailyBudget, setDailyBudget]     = useState(DAILY_BUDGET_DEFAULT);

  // Modals
  const [addOpen, setAddOpen]             = useState(false);
  const [budgetOpen, setBudgetOpen]       = useState(false);
  const [catOpen, setCatOpen]             = useState(false);

  // Add transaction form state
  const [txnType, setTxnType]             = useState('expense');
  const [txnAmount, setTxnAmount]         = useState('');
  const [txnDesc, setTxnDesc]             = useState('');
  const [txnCat, setTxnCat]              = useState(0);

  // Budget set form
  const [budgetInput, setBudgetInput]     = useState('');

  // Category form
  const [newCatEmoji, setNewCatEmoji]     = useState('');
  const [newCatName, setNewCatName]       = useState('');

  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const pct = Math.min(100, Math.round((totalSpent / dailyBudget) * 100));

  // Donut segments
  const catTotals = categories.map((cat, idx) => ({
    ...cat,
    total: transactions
      .filter(t => t.type === 'expense' && t.catIdx === idx)
      .reduce((s, t) => s + t.amount, 0),
  }));
  const radius = 14, circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = catTotals.map(cat => {
    const share = totalSpent > 0 ? cat.total / totalSpent : 0;
    const dash  = share * circumference;
    const seg   = { share, dash, offset, color: cat.color };
    offset += dash;
    return seg;
  });

  const submitTxn = () => {
    const amount = parseFloat(txnAmount);
    if (!amount || amount <= 0) return;
    setTransactions(prev => [{
      type: txnType, amount, desc: txnDesc || '—',
      catIdx: parseInt(txnCat), date: new Date(),
    }, ...prev]);
    setTxnAmount(''); setTxnDesc(''); setAddOpen(false);
  };

  const saveDailyBudget = () => {
    const v = parseFloat(budgetInput);
    if (v > 0) setDailyBudget(v);
    setBudgetOpen(false);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const colors = ['#C8F23D','#3DF2C8','#3D8FF2','#F2C43D','#F23D6E','#A78BFA'];
    setCategories(prev => [...prev, {
      emoji: newCatEmoji || '📦',
      name: newCatName,
      color: colors[prev.length % colors.length],
    }]);
    setNewCatEmoji(''); setNewCatName('');
  };

  const deleteCategory = (idx) => {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="page active" id="page-budget">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Budget"
        actions={
          <>
            <button className="icon-btn" onClick={() => setBudgetOpen(true)} title="Set daily budget">🎯</button>
            <button className="icon-btn" title="Calendar">📅</button>
          </>
        }
      />
      <div style={{ height: 8 }} />

      {/* Summary Card */}
      <div className="budget-hero">
        <div className="budget-summary-card">
          <div className="budget-title">Total Spent Today</div>
          <div className="budget-total">₫{totalSpent.toLocaleString()}</div>
          <div className="budget-progress-bar">
            <div className="budget-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="budget-progress-label">
            <span>{pct}% of daily budget</span>
            <span>₫{(dailyBudget - totalSpent).toLocaleString()} left</span>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="donut-section">
          <div className="donut-wrap">
            <svg className="donut-svg" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r={radius} fill="none" stroke="#1a1e26" strokeWidth="4" />
              {segments.map((seg, i) =>
                seg.dash > 0 && (
                  <circle
                    key={i} cx="18" cy="18" r={radius}
                    fill="none" stroke={seg.color} strokeWidth="4"
                    strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                    strokeDashoffset={-seg.offset}
                  />
                )
              )}
            </svg>
            <div className="donut-center">
              <div className="donut-center-val">{pct}%</div>
              <div className="donut-center-label">used</div>
            </div>
          </div>
          <div className="donut-legend">
            {catTotals.map((cat, i) => (
              <div className="legend-item" key={i}>
                <div className="legend-dot" style={{ background: cat.color }} />
                <span className="legend-name">{cat.emoji} {cat.name}</span>
                <span className="legend-pct">
                  {totalSpent > 0 ? Math.round((cat.total / totalSpent) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="section-title">Recent Transactions</div>
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 14 }}>
            No transactions yet.<br />
            Tap <strong style={{ color: 'var(--accent)' }}>+</strong> to add one!
          </div>
        ) : (
          transactions.map((t, i) => {
            const cat = categories[t.catIdx] ?? { emoji: '📦', name: 'Other', color: '#888' };
            return (
              <div className="txn-item" key={i}>
                <div className="txn-icon" style={{ background: `${cat.color}22` }}>{cat.emoji}</div>
                <div className="txn-detail">
                  <div className="txn-name">{t.desc}</div>
                  <div className="txn-cat">{cat.name}</div>
                </div>
                <div>
                  <div className={`txn-amount ${t.type}`}>
                    {t.type === 'expense' ? '−' : '+'}₫{t.amount.toLocaleString()}
                  </div>
                  <div className="txn-usd">≈ ${(t.amount / 25420).toFixed(2)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ height: 80 }} />

      {/* FAB Buttons */}
      <div className="fab-container">
        <button className="fab fab-add" onClick={() => setAddOpen(true)} title="Add transaction">＋</button>
        <button className="fab fab-edit" onClick={() => setCatOpen(true)} title="Manage categories">✏️</button>
      </div>

      {/* Add Transaction Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <div className="fab-modal">
          <h3>Add Transaction</h3>
          <div className="type-tabs">
            <button
              className={`type-tab${txnType === 'expense' ? ' active-expense' : ''}`}
              onClick={() => setTxnType('expense')}
            >Expense</button>
            <button
              className={`type-tab${txnType === 'income' ? ' active-income' : ''}`}
              onClick={() => setTxnType('income')}
            >Income</button>
          </div>
          <div className="form-field">
            <label className="form-label">Amount (VND)</label>
            <input type="number" className="form-input" placeholder="0" min="0"
              value={txnAmount} onChange={e => setTxnAmount(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <input type="text" className="form-input" placeholder="e.g. Pho lunch"
              value={txnDesc} onChange={e => setTxnDesc(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Category</label>
            <select className="form-input" value={txnCat} onChange={e => setTxnCat(e.target.value)}>
              {categories.map((c, i) => (
                <option key={i} value={i}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <button className="submit-form-btn" onClick={submitTxn}>Save Transaction</button>
        </div>
      </Modal>

      {/* Set Budget Modal */}
      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)}>
        <div className="fab-modal">
          <h3>🎯 Set Daily Budget</h3>
          <div className="form-field">
            <label className="form-label">Daily Budget (VND)</label>
            <input type="number" className="form-input" placeholder="2000000"
              value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
          </div>
          <button className="submit-form-btn" onClick={saveDailyBudget}>Save Budget</button>
        </div>
      </Modal>

      {/* Category Modal */}
      <div
        className={`cat-modal-overlay${catOpen ? ' open' : ''}`}
        onClick={e => e.target === e.currentTarget && setCatOpen(false)}
      >
        <div className="cat-modal">
          <div className="cat-modal-header">
            <div className="cat-modal-title">✏️ Manage Categories</div>
            <button className="cat-close" onClick={() => setCatOpen(false)}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {categories.map((cat, i) => (
              <div className="category-item" key={i}>
                <span className="cat-emoji">{cat.emoji}</span>
                <input className="cat-name-edit" defaultValue={cat.name} />
                <button className="cat-delete" onClick={() => deleteCategory(i)}>✕</button>
              </div>
            ))}
          </div>
          <div className="cat-add-row">
            <input className="cat-emoji-input" placeholder="🍜" maxLength={2}
              value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} />
            <input className="cat-name-input" placeholder="Category name..."
              value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()} />
            <button className="cat-add-btn" onClick={addCategory}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
