import Navbar from '../../components/layout/Navbar';

const PLANS = [
  {
    title: 'Đà Nẵng 3N2Đ',
    date: '20/05 - 22/05',
    location: 'Đà Nẵng',
    people: 2,
    budget: '5.000.000đ',
    progress: 60,
  },
  {
    title: 'Hội An Weekend',
    date: '05/06 - 06/06',
    location: 'Hội An',
    people: 3,
    budget: '3.500.000đ',
    progress: 30,
  },
];

export default function TravelPlanPage() {
  return (
    <div className="page active" id="page-plans">
      <Navbar
        title={<>Travel<span style={{ color: 'var(--accent)' }}>Plans</span></>}
        actions={<button className="icon-btn">➕</button>}
      />

      <div className="plans-container">
        {PLANS.map((plan, i) => (
          <div className="plan-card" key={i}>
            <div className="plan-header">
              <div className="plan-title">{plan.title}</div>
              <div className="plan-date">{plan.date}</div>
            </div>
            <div className="plan-info">
              <span>📍 {plan.location}</span>
              <span>👥 {plan.people} người</span>
            </div>
            <div className="plan-budget">Ngân sách: <b>{plan.budget}</b></div>
            <div className="plan-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${plan.progress}%` }} />
              </div>
              <div className="progress-label">Đã chuẩn bị {plan.progress}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
