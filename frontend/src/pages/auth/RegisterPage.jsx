import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';

function getPasswordStrength(v) {
  let s = 0;
  if (v.length >= 8)  s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}
const S_COLOR = ['', '#e84055', '#f59e0b', '#e8b84b', '#28d878'];
const S_LABEL = ['', 'Yếu', 'Trung bình', 'Khá mạnh', 'Mạnh'];
const NATIONALITIES = ['Vietnamese','Korean','Japanese','Chinese','American','French','German','British','Australian','Other'];
const CITIES = ['Hà Nội','Hồ Chí Minh','Đà Nẵng','Hội An','Huế','Nha Trang','Phú Quốc','Hạ Long','Cần Thơ','Đà Lạt'];

const inp = (err) => ({
  width:'100%', background:'var(--bg3)',
  border:`1px solid ${err ? 'rgba(242,61,110,0.6)' : 'var(--border)'}`,
  borderRadius:12, color:'var(--text)', padding:'11px 14px',
  fontSize:15, outline:'none', boxSizing:'border-box', fontFamily:'inherit',
});

function Field({ label, error, hint, children }) {
  return (
      <div style={{ marginBottom: 16 }}>
        {label && <label style={{ display:'block', fontSize:12, fontFamily:'DM Mono,monospace',
          textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--muted)', marginBottom:6 }}>{label}</label>}
        {children}
        {error && <div style={{ fontSize:12, color:'var(--accent3)', marginTop:5 }}>{error}</div>}
        {!error && hint && <div style={{ fontSize:12, color:'#28d878', marginTop:5 }}>{hint}</div>}
      </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName:'', email:'', password:'', confirm:'',
    nationality:'', travelCity:'', terms:false,
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [showCpw,  setShowCpw]  = useState(false);
  const [strength, setStrength] = useState(0);

  useEffect(() => setStrength(getPasswordStrength(form.password)), [form.password]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined, _global: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Họ và tên ít nhất 2 ký tự';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Mật khẩu không được để trống';
    else if (form.password.length < 8) e.password = 'Mật khẩu ít nhất 8 ký tự';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Cần ít nhất 1 chữ hoa (A–Z)';
    else if (!/[0-9]/.test(form.password)) e.password = 'Cần ít nhất 1 chữ số (0–9)';
    if (!form.confirm) e.confirm = 'Vui lòng xác nhận mật khẩu';
    else if (form.confirm !== form.password) e.confirm = '⚠️ Mật khẩu không khớp';
    if (!form.terms) e.terms = 'Bạn phải đồng ý với Điều Khoản Sử Dụng';
    return e;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setLoading(true);
    try {
      const rawFullName = form.fullName.trim();
    const autoUsername = generateUsername(rawFullName);
      await authApi.register({
        username: autoUsername,
        fullName:    form.fullName.trim(),
        email:       form.email.trim(),
        password:    form.password,
        nationality: form.nationality || undefined,
        travelDestination:  form.travelCity  || undefined,
      });
      navigate('/login', { state: { registered: true, email: form.email.trim() } });
    } catch (err) {
      console.error('Register error:', err);
      // Lấy message từ nhiều nơi có thể backend trả về
      const msg =
          err.response?.data?.error   ||
          err.response?.data?.message ||
          (err.response?.status === 409 ? 'Email này đã được đăng ký.' : null) ||
          (err.response?.status === 400 ? 'Dữ liệu không hợp lệ. Kiểm tra lại thông tin.' : null) ||
          (err.response?.status === 403 ? 'Yêu cầu bị từ chối. Kiểm tra kết nối tới server.' : null) ||
          'Đăng ký thất bại. Vui lòng thử lại!';
      setErrors(p => ({ ...p, _global: msg }));
    } finally {
      setLoading(false);
    }
  };

  const generateUsername = (name) => {
  if (!name) return '';
  return name
    .toLowerCase() // 1. Chuyển thành chữ thường
    .normalize('NFD') // 2. Tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, '') // 3. Xóa các dấu vừa tách
    .replace(/đ/g, 'd') // 4. Đổi chữ 'đ' thành 'd'
    .replace(/\s+/g, ''); // 5. Xóa toàn bộ khoảng trắng
};

  const eyeBtn = {
    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
    background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:16, padding:0,
  };

  return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'flex-start',
        justifyContent:'center', padding:'40px 20px', background:'var(--bg)' }}>
        <div style={{ width:'100%', maxWidth:440, background:'var(--bg2)',
          border:'1px solid var(--border)', borderRadius:24, padding:'32px 28px' }}>

          <Link to="/" style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20,
            marginBottom:28, display:'inline-block', color:'var(--text)', textDecoration:'none' }}>
            Viet<span style={{ color:'var(--accent)' }}>Money</span>
          </Link>

          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:700, marginBottom:4 }}>Tạo Tài Khoản</h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Hoàn toàn miễn phí — không cần thẻ tín dụng</p>

          {errors._global && (
              <div style={{ background:'rgba(242,61,110,0.08)', border:'1px solid rgba(242,61,110,0.35)',
                borderRadius:12, padding:'10px 14px', fontSize:13, color:'var(--accent3)', marginBottom:20 }}>
                ⚠️ {errors._global}
              </div>
          )}

          <form onSubmit={handleRegister} noValidate>
            <Field label="Họ và Tên" error={errors.fullName}>
              <input id="fullName" type="text" autoComplete="name" placeholder="Nhập tên đầy đủ"
                     value={form.fullName} onChange={set('fullName')} style={inp(!!errors.fullName)} />
            </Field>

            <Field label="Email" error={errors.email}>
              <input id="email" type="email" autoComplete="email" placeholder="example@email.com"
                     value={form.email} onChange={set('email')} style={inp(!!errors.email)} />
            </Field>

            <Field label="Mật khẩu" error={errors.password}>
              <div style={{ position:'relative' }}>
                <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                       placeholder="Ít nhất 8 ký tự, 1 chữ hoa, 1 số"
                       value={form.password} onChange={set('password')}
                       style={{ ...inp(!!errors.password), paddingRight:44 }} />
                <button type="button" style={eyeBtn} tabIndex={-1} onClick={() => setShowPw(v=>!v)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {form.password && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:4 }}>
                      {[1,2,3,4].map(i => (
                          <div key={i} style={{ height:3, flex:1, borderRadius:2,
                            background: i<=strength ? S_COLOR[strength] : 'var(--bg)', transition:'background 0.3s' }} />
                      ))}
                    </div>
                    {strength > 0 && <div style={{ fontSize:11, marginTop:4, color:S_COLOR[strength] }}>
                      Độ mạnh: {S_LABEL[strength]}</div>}
                  </div>
              )}
            </Field>

            <Field label="Xác nhận mật khẩu" error={errors.confirm}>
              <div style={{ position:'relative' }}>
                <input id="confirm" type={showCpw ? 'text' : 'password'} autoComplete="new-password"
                       placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={set('confirm')}
                       style={{ ...inp(!!errors.confirm), paddingRight:44 }} />
                <button type="button" style={eyeBtn} tabIndex={-1} onClick={() => setShowCpw(v=>!v)}>
                  {showCpw ? '🙈' : '👁'}
                </button>
              </div>
              {form.confirm && form.confirm === form.password && !errors.confirm &&
                  <div style={{ fontSize:12, color:'#28d878', marginTop:5 }}>✓ Mật khẩu khớp</div>}
            </Field>

            <Field label="Quốc tịch (tùy chọn)">
              <div style={{ position:'relative' }}>
                <select value={form.nationality} onChange={set('nationality')}
                        style={{ ...inp(false), appearance:'none', cursor:'pointer' }}>
                  <option value="">-- Chọn quốc tịch --</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  color:'var(--muted)', pointerEvents:'none', fontSize:11 }}>▼</span>
              </div>
            </Field>

            <Field label="Điểm đến du lịch (tùy chọn)">
              <div style={{ position:'relative' }}>
                <select value={form.travelCity} onChange={set('travelCity')}
                        style={{ ...inp(false), appearance:'none', cursor:'pointer' }}>
                  <option value="">-- Chọn thành phố --</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  color:'var(--muted)', pointerEvents:'none', fontSize:11 }}>▼</span>
              </div>
            </Field>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.terms} onChange={set('terms')}
                       style={{ width:16, height:16, marginTop:2, accentColor:'var(--accent)', cursor:'pointer', flexShrink:0 }} />
                <span style={{ fontSize:13, color:'var(--muted)', lineHeight:1.55 }}>
                Tôi đồng ý với{' '}
                  <a href="#" style={{ color:'var(--accent)', textDecoration:'none' }}>Điều Khoản Sử Dụng</a>
                  {' '}và{' '}
                  <a href="#" style={{ color:'var(--accent)', textDecoration:'none' }}>Chính Sách Bảo Mật</a>
              </span>
              </label>
              {errors.terms && <div style={{ fontSize:12, color:'var(--accent3)', marginTop:5 }}>{errors.terms}</div>}
            </div>

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px',
              background: loading ? 'var(--bg3)' : 'var(--accent)',
              color: loading ? 'var(--muted)' : '#000',
              borderRadius:12, border:'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, transition:'background 0.2s',
            }}>
              {loading ? '⏳ Đang xử lý...' : 'Tạo Tài Khoản'}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:12, color:'var(--muted)' }}>hoặc</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          <a href="/oauth2/authorization/google" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            width:'100%', padding:'11px 0', borderRadius:40, background:'var(--bg3)',
            border:'1px solid var(--border)', color:'var(--text)', fontSize:14,
            fontWeight:500, textDecoration:'none', boxSizing:'border-box',
          }}>
            🌐 Đăng ký với Google
          </a>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:20 }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Đăng Nhập</Link>
          </p>
        </div>
      </div>
  );
}