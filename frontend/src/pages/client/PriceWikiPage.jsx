import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';

const RATE_USD = 25420;

const WIKI_DATA = {
  food: [
    { icon: '🍜', name: 'Phở (street stall)',     range: '30,000 – 60,000đ',  mid: 45000 },
    { icon: '🥗', name: 'Bún bò Huế',             range: '35,000 – 70,000đ',  mid: 50000 },
    { icon: '🥞', name: 'Bánh mì',                 range: '15,000 – 35,000đ',  mid: 25000 },
    { icon: '🍱', name: 'Cơm tấm (rice plate)',    range: '40,000 – 80,000đ',  mid: 55000 },
    { icon: '🍢', name: 'Bún chả',                 range: '50,000 – 90,000đ',  mid: 65000 },
    { icon: '🌮', name: 'Bánh xèo',                range: '50,000 – 100,000đ', mid: 70000 },
  ],
  drink: [
    { icon: '🧋', name: 'Trà sữa (bubble tea)',   range: '35,000 – 65,000đ',  mid: 45000 },
    { icon: '☕', name: 'Cà phê sữa đá',           range: '20,000 – 50,000đ',  mid: 30000 },
    { icon: '🥤', name: 'Fresh coconut water',     range: '20,000 – 40,000đ',  mid: 30000 },
    { icon: '🍺', name: 'Bia hơi (draft beer)',    range: '10,000 – 20,000đ',  mid: 15000 },
  ],
  transport: [
    { icon: '🛺', name: 'Xe ôm (motorbike taxi)',  range: '20,000 – 50,000đ/km', mid: 30000 },
    { icon: '🚕', name: 'Grab car (short trip)',   range: '50,000 – 120,000đ',   mid: 80000 },
    { icon: '🚌', name: 'City bus',                range: '7,000 – 15,000đ',     mid: 10000 },
    { icon: '🏍️', name: 'Motorbike rental/day',   range: '100,000 – 200,000đ',  mid: 150000 },
  ],
  hotel: [
    { icon: '🛏️', name: 'Hostel dorm bed',        range: '150,000 – 300,000đ/night', mid: 200000 },
    { icon: '🏨', name: 'Budget guesthouse',       range: '300,000 – 600,000đ/night', mid: 450000 },
    { icon: '🏩', name: 'Mid-range hotel',         range: '600,000 – 1,500,000đ/night', mid: 1000000 },
    { icon: '🏰', name: 'Boutique / 4-star',       range: '1,500,000 – 4,000,000đ/night', mid: 2500000 },
  ],
  shopping: [
    { icon: '👕', name: 'T-shirt (market)',        range: '80,000 – 200,000đ',  mid: 130000 },
    { icon: '👡', name: 'Sandals (local brand)',   range: '100,000 – 300,000đ', mid: 180000 },
    { icon: '🎁', name: 'Souvenir magnet/keyring', range: '20,000 – 50,000đ',   mid: 30000 },
    { icon: '🧣', name: 'Silk scarf (Hội An)',     range: '150,000 – 400,000đ', mid: 250000 },
  ],
  tour: [
    { icon: '⛵', name: 'Mekong Delta day tour',   range: '300,000 – 700,000đ', mid: 500000 },
    { icon: '🚣', name: 'Hạ Long Bay cruise/day',  range: '1,200,000 – 4,000,000đ', mid: 2500000 },
    { icon: '🏯', name: 'Hội An ancient town',     range: '120,000đ entry',     mid: 120000 },
    { icon: '🌋', name: 'Fansipan cable car',      range: '750,000 – 850,000đ', mid: 800000 },
  ],
};

const CHIPS = [
  { key: 'food',      label: '🍜 Food'      },
  { key: 'drink',     label: '☕ Drinks'    },
  { key: 'transport', label: '🛺 Transport' },
  { key: 'hotel',     label: '🏨 Hotel'     },
  { key: 'shopping',  label: '👗 Shopping'  },
  { key: 'tour',      label: '🗺️ Tours'    },
];

const CURRENCIES = { VND: 1, USD: 25420, KRW: 18.9, EUR: 27810 };

export default function PriceWikiPage() {
  const [amount,   setAmount]   = useState(500000);
  const [currency, setCurrency] = useState('VND');
  const [category, setCategory] = useState('food');

  const budgetVND = parseFloat(amount) * CURRENCIES[currency];
  const items     = WIKI_DATA[category] ?? [];
  const affordable = items.filter(item => budgetVND >= item.mid);

  return (
    <div className="page active" id="page-wiki">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Wiki"
      />
      <div style={{ height: 8 }} />

      <div className="wiki-hero">
        <div className="wiki-input-card">
          <div className="wiki-input-label">Your Budget</div>
          <div className="wiki-amount-row">
            <input
              type="number"
              className="wiki-amount-input"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <select className="currency-select" value={currency} onChange={e => setCurrency(e.target.value)}>
              {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="wiki-input-label">Category</div>
          <div className="category-chips">
            {CHIPS.map(chip => (
              <div
                key={chip.key}
                className={`chip${category === chip.key ? ' active' : ''}`}
                onClick={() => setCategory(chip.key)}
              >{chip.label}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">What can you get?</div>
      <div className="wiki-results">
        {items.map((item, i) => {
          const canAfford = budgetVND >= item.mid;
          return (
            <div className="wiki-item" key={i} style={!canAfford ? { opacity: 0.4 } : {}}>
              <div className="wiki-item-icon">{item.icon}</div>
              <div className="wiki-item-detail">
                <div className="wiki-item-name">{item.name}</div>
                <div className="wiki-item-range">{item.range}</div>
              </div>
              <div>
                <div className="wiki-item-price">
                  ≈ ${(item.mid / RATE_USD).toFixed(2)}
                </div>
                <div className="wiki-item-usd">{canAfford ? '✓ affordable' : '✗ over budget'}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}
