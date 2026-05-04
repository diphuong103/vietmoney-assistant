import { useMemo, useState } from 'react';

const ICON_GROUPS = {
  EXPENSE: [
    { label: 'Food & Drink',      icon: '🍽️', icons: ['🍜','🍛','🍔','🍕','🌮','🍣','🍱','🍝','🥗','🍲','🥩','🍗','🥪','🧆','🫕','☕','🧋','🍵','🥤','🍺','🧃','🍹'] },
    { label: 'Transport',         icon: '🚗', icons: ['🚕','🚌','🛵','⛽','🚗','🚙','✈️','🚂','🚲','🛺','🚁','⛴️','🚤'] },
    { label: 'Shopping',          icon: '🛍️', icons: ['🛍️','👗','👟','💄','💍','⌚','👜','🕶️','🧴','🪮','🧸','🎀','🛒'] },
    { label: 'Housing',           icon: '🏠', icons: ['🏠','🏨','💡','🔧','🪴','🛋️','🛁','🪟','🧹','🏡','🏢','🪣','🔑'] },
    { label: 'Entertainment',     icon: '🎮', icons: ['🎮','🎬','🎵','🎭','🎪','🎯','🎲','⚽','🏸','🎸','🎻','🎨','📷'] },
    { label: 'Health & Beauty',   icon: '💊', icons: ['💊','🏥','🧴','💆','🦷','🩺','💉','🩹','🧘','🏋️','🩻','🫀','🧬'] },
    { label: 'Education',         icon: '📚', icons: ['📚','🎓','✏️','📖','🔬','🔭','💻','🖥️','📐','📝','🎒','📓','🏫'] },
    { label: 'Pets',              icon: '🐶', icons: ['🐶','🐱','🐠','🐦','🐹','🐇','🦮','🧶','🪺','🦴','🐾'] },
    { label: 'Gifts & Others',    icon: '🎁', icons: ['🎁','💐','🎂','🎉','🕯️','🏷️','📦','🎊','🎈','💝','🧧','🪅','✉️'] },
  ],
  INCOME: [
    { label: 'Salary & Work',     icon: '💼', icons: ['💼','🏢','🧑‍💻','👔','🤝','📋','🗂️','📊','🖥️','🖨️','📠','🗃️','🏗️'] },
    { label: 'Money & Finance',   icon: '💵', icons: ['💵','💰','🪙','💳','🏦','📈','💹','🤑','💲','🏧','📉','🧾','💸'] },
    { label: 'Business',          icon: '📦', icons: ['📦','🏪','🛒','🏬','🚚','🏭','📣','🔖','📢','📡','🧮','⚙️'] },
    { label: 'Investment',        icon: '📈', icons: ['📈','🏠','🏘️','🌐','⛏️','📊','🔐','🏆','🎖️','🥇','💎','🛡️'] },
    { label: 'Freelance & Gifts', icon: '🎨', icons: ['🎁','🎨','✍️','🎵','📸','🎬','🧑‍🎨','👩‍💻','🧑‍🏫','🔧','⚒️','🪛','🎤'] },
  ],
};

const DEFAULT_COLORS = [
  '#F87171','#FB923C','#FBBF24','#34D399',
  '#60A5FA','#A78BFA','#F472B6','#22D3EE',
];

const styles = `
  .cm-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .cm-modal {
    background: var(--cm-bg, #fff);
    border-radius: 20px;
    border: 0.5px solid rgba(0,0,0,0.08);
    width: 100%; max-width: 520px;
    max-height: 90vh;
    display: flex; flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    .cm-modal { --cm-bg: #1c1c1e; --cm-surface: #2c2c2e; --cm-border: rgba(255,255,255,0.1); --cm-text: #f5f5f7; --cm-muted: rgba(255,255,255,0.45); }
  }
  @media (prefers-color-scheme: light) {
    .cm-modal { --cm-bg: #fff; --cm-surface: #f5f5f7; --cm-border: rgba(0,0,0,0.08); --cm-text: #1c1c1e; --cm-muted: rgba(0,0,0,0.45); }
  }
  .cm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 0;
    flex-shrink: 0;
  }
  .cm-title { font-size: 17px; font-weight: 600; color: var(--cm-text); }
  .cm-close {
    width: 30px; height: 30px; border-radius: 50%;
    border: 0.5px solid var(--cm-border);
    background: var(--cm-surface);
    cursor: pointer; font-size: 13px;
    color: var(--cm-muted);
    display: flex; align-items: center; justify-content: center;
  }
  .cm-tabs {
    display: flex; gap: 8px;
    padding: 16px 24px;
    flex-shrink: 0;
  }
  .cm-tab {
    flex: 1; padding: 9px; border-radius: 12px;
    border: 0.5px solid var(--cm-border);
    background: transparent; cursor: pointer;
    font-size: 13px; font-weight: 500;
    color: var(--cm-muted);
    transition: all 0.15s;
  }
  .cm-tab:hover:not(.active) { background: var(--cm-surface); }
  .cm-tab.active-expense { background: #FFF1F3; border-color: #F43F5E; color: #F43F5E; }
  .cm-tab.active-income  { background: #ECFDF5; border-color: #10B981; color: #10B981; }
  .cm-scroll {
    flex: 1; overflow-y: auto;
    padding: 0 24px;
  }
  .cm-scroll::-webkit-scrollbar { width: 4px; }
  .cm-scroll::-webkit-scrollbar-thumb { background: var(--cm-border); border-radius: 4px; }
  .cm-section-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
    text-transform: uppercase; color: var(--cm-muted);
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px;
  }
  .cm-section-label::after { content:''; flex:1; height:0.5px; background: var(--cm-border); }
  .cm-catlist { margin-bottom: 20px; }
  .cm-cat-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 12px;
    background: var(--cm-surface);
    border: 0.5px solid var(--cm-border);
    margin-bottom: 6px;
  }
  .cm-cat-dot {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .cm-cat-name { flex: 1; font-size: 14px; color: var(--cm-text); }
  .cm-cat-del {
    width: 26px; height: 26px; border-radius: 8px;
    border: none; background: transparent;
    color: var(--cm-muted); cursor: pointer; font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .cm-cat-del:hover { background: #FFF1F3; color: #F43F5E; }
  .cm-icon-group { margin-bottom: 14px; }
  .cm-icon-group-title {
    font-size: 12px; color: var(--cm-muted);
    margin-bottom: 7px; display: flex; align-items: center; gap: 5px;
  }
  .cm-icon-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .cm-icon-btn {
    width: 40px; height: 40px; border-radius: 10px;
    border: 0.5px solid var(--cm-border);
    background: var(--cm-surface);
    font-size: 18px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
    flex-shrink: 0;
  }
  .cm-icon-btn:hover { transform: scale(1.1); background: var(--cm-bg); }
  .cm-icon-btn.sel-expense { border: 2px solid #F43F5E; background: #FFF1F3; transform: scale(1.1); }
  .cm-icon-btn.sel-income  { border: 2px solid #10B981; background: #ECFDF5; transform: scale(1.1); }
  .cm-empty { text-align:center; color: var(--cm-muted); font-size:13px; padding: 16px 0; }
  .cm-add-row {
    display: flex; gap: 8px; align-items: center;
    padding: 14px 24px 20px;
    border-top: 0.5px solid var(--cm-border);
    flex-shrink: 0;
  }
  .cm-preview {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--cm-surface);
    border: 0.5px solid var(--cm-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .cm-name-input {
    flex: 1; height: 42px; border-radius: 12px;
    border: 0.5px solid var(--cm-border);
    background: var(--cm-surface);
    padding: 0 14px; font-size: 14px;
    color: var(--cm-text); outline: none;
  }
  .cm-name-input:focus { border-color: rgba(0,0,0,0.3); }
  .cm-add-btn {
    height: 42px; padding: 0 18px; border-radius: 12px;
    border: none; font-size: 14px; font-weight: 600;
    cursor: pointer; color: #fff; transition: all 0.12s;
  }
  .cm-add-btn:hover { opacity: 0.88; transform: scale(0.98); }
  .cm-add-btn.expense { background: #F43F5E; }
  .cm-add-btn.income  { background: #10B981; }
`;

export default function CategoryModal({
  open,
  onClose,
  categories = [],
  addCategory,
  deleteCategory,
}) {
  const [tab, setTab]               = useState('EXPENSE');
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍜');

  const filteredCategories = useMemo(
    () => categories.filter(c => (c.type || 'EXPENSE').toUpperCase() === tab),
    [categories, tab],
  );

  if (!open) return null;

  const switchTab = (type) => {
    setTab(type);
    setSelectedIcon(type === 'EXPENSE' ? '🍜' : '💼');
    setNewCatName('');
  };

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    try {
      await addCategory({
        name: newCatName.trim(),
        icon: selectedIcon,
        type: tab,
        color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length],
      });
      setNewCatName('');
      setSelectedIcon(tab === 'EXPENSE' ? '🍜' : '💼');
    } catch (err) {
      console.error('Add category failed', err);
    }
  };

  const groups = ICON_GROUPS[tab];

  return (
    <>
      <style>{styles}</style>

      <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="cm-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="cm-header">
            <span className="cm-title">✏️ Manage Categories</span>
            <button className="cm-close" onClick={onClose}>✕</button>
          </div>

          {/* Tabs */}
          <div className="cm-tabs">
            <button
              className={`cm-tab ${tab === 'EXPENSE' ? 'active-expense' : ''}`}
              onClick={() => switchTab('EXPENSE')}
            >💸 Expense</button>
            <button
              className={`cm-tab ${tab === 'INCOME' ? 'active-income' : ''}`}
              onClick={() => switchTab('INCOME')}
            >💰 Income</button>
          </div>

          {/* Scrollable body */}
          <div className="cm-scroll">

            {/* Category list */}
            <div className="cm-section-label">Your categories</div>
            <div className="cm-catlist">
              {filteredCategories.length === 0 ? (
                <div className="cm-empty">No {tab.toLowerCase()} categories yet.</div>
              ) : (
                filteredCategories.map(cat => (
                  <div className="cm-cat-item" key={cat.id}>
                    <div className="cm-cat-dot" style={{ background: cat.color + '22' }}>
                      {cat.icon}
                    </div>
                    <span className="cm-cat-name">{cat.name}</span>
                    <button className="cm-cat-del" onClick={() => deleteCategory(cat.id)}>✕</button>
                  </div>
                ))
              )}
            </div>

            {/* Icon picker — grouped */}
            <div className="cm-section-label">Choose icon</div>
            {groups.map((group, gi) => (
              <div className="cm-icon-group" key={gi}>
                <div className="cm-icon-group-title">
                  <span style={{ fontSize: 14 }}>{group.icon}</span> {group.label}
                </div>
                <div className="cm-icon-row">
                  {group.icons.map((ic, ii) => (
                    <button
                      key={ii}
                      className={`cm-icon-btn ${
                        selectedIcon === ic
                          ? tab === 'EXPENSE' ? 'sel-expense' : 'sel-income'
                          : ''
                      }`}
                      onClick={() => setSelectedIcon(ic)}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom padding */}
            <div style={{ height: 8 }} />
          </div>

          {/* Add row */}
          <div className="cm-add-row">
            <div className="cm-preview">{selectedIcon}</div>
            <input
              className="cm-name-input"
              placeholder={`New ${tab.toLowerCase()} category...`}
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              className={`cm-add-btn ${tab.toLowerCase()}`}
              onClick={handleAdd}
            >
              Add
            </button>
          </div>

        </div>
      </div>
    </>
  );
}