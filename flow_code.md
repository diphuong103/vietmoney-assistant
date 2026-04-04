# Flow: Đăng nhập / Đăng ký / Lưu token

Tài liệu này tóm tắt luồng đăng nhập, đăng ký và nơi lưu token trong giao diện frontend.

## 1) Các file chính

- Auth API: [frontend/src/api/authApi.js](frontend/src/api/authApi.js#L1)
- HTTP client (đính token tự động, xử lý 401): [frontend/src/api/axiosClient.js](frontend/src/api/axiosClient.js#L1)
- Store auth (zustand): [frontend/src/store/authStore.js](frontend/src/store/authStore.js#L1)
- Hook helper: [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js#L1)
- Trang Login: [frontend/src/pages/auth/LoginPage.jsx](frontend/src/pages/auth/LoginPage.jsx#L1)
- Trang Register: [frontend/src/pages/auth/RegisterPage.jsx](frontend/src/pages/auth/RegisterPage.jsx#L1)
- Trang Verify OTP: [frontend/src/pages/auth/VerifyOtpPage.jsx](frontend/src/pages/auth/VerifyOtpPage.jsx#L1)

## 2) Tổng quan luồng

- Người dùng đăng ký: `RegisterPage` gửi `POST /api/auth/register` (hiện đang dùng `axios` trực tiếp). Sau khi đăng ký thành công, UI chuyển tới `VerifyOtpPage` (email được truyền qua `location.state`).
- Nhập mã OTP: `VerifyOtpPage` cần gọi `authApi.verifyOtp(otp)` để xác thực mã. Backend thường trả về `token` và `user` sau khi OTP hợp lệ.
- Đăng nhập: `LoginPage` nên gọi `useAuth().login(email, password)` (hoặc trực tiếp `authApi.login`). `useAuth.login` hiện đã lưu `token` vào `localStorage` và cập nhật store (`setToken`, `setUser`).

## 3) Nơi lưu token và cách dùng

- Token được lưu trong `localStorage` key `token` (xem [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js#L1)).
- `axiosClient` lấy token từ `localStorage.getItem('token')` và đính `Authorization: Bearer <token>` cho mọi request (xem [frontend/src/api/axiosClient.js](frontend/src/api/axiosClient.js#L1)).
- Khi nhận lỗi 401, `axiosClient` sẽ xoá token và chuyển hướng về `/login`.
- `useAuth` khi mount sẽ rehydrate từ `localStorage` (nếu có token) và gọi `authApi.getMe()` để set `user` trong store.

## 4) Hướng dẫn chỉnh `VerifyOtpPage` (gợi ý code)

Trong `VerifyOtpPage.jsx` thay TODO bằng gọi `authApi.verifyOtp` và lưu token tương tự `useAuth.login`. Ví dụ:

```js
import { useAuthStore } from '../../store/authStore';
import authApi from '../../api/authApi';

const { setUser, setToken } = useAuthStore.getState();

// khi verify thành công
const res = await authApi.verifyOtp({ otp: otp.join('') });
const { token, user } = res.data;
localStorage.setItem('token', token);
setToken(token);
setUser(user);
navigate('/');
```

Ghi chú: nếu backend trả khác (ví dụ chỉ trả success và không trả token), cần gọi `authApi.login` tiền xử lý hoặc backend/endpoint verify trả token.

## 5) Gợi ý chỉnh `LoginPage`

- Sử dụng `useAuth()` hook:

```js
import { useAuth } from '../../hooks/useAuth';
const { login } = useAuth();
await login(email, password);
navigate('/');
```

## 6) Ngôn ngữ (i18n)

- File i18n: [frontend/src/utils/i18n.js](frontend/src/utils/i18n.js#L1). Hiện nhiều text hardcoded trong các trang auth; nếu cần dịch, thay text bằng `t('key')` và gọi `setLanguage(lang)` ở chỗ chọn ngôn ngữ.

## 7) Kiểm tra sau khi sửa

1. Đăng ký -> nhập OTP -> xác thực: trang chuyển về trang chủ và `localStorage.token` tồn tại.
2. Đăng nhập trực tiếp: `localStorage.token` và `useAuthStore.user` phải được set.
3. Mở tab mới: `useAuth` rehydrate token và gọi `getMe()` để set `user`.

---
Tôi đã tạo file này; nếu muốn tôi có thể tiếp tục: (A) cập nhật `LoginPage` để gọi `useAuth.login`, (B) implement `VerifyOtpPage` lưu token, hoặc (C) chuyển text sang `i18n`.

## 8) Ghi chú từ test thực tế — các vấn đề cần sửa

Tôi đã test đăng ký + nhập OTP và phát hiện các vấn đề sau. Thêm ghi chú để bạn (hoặc dev backend) sửa:

- Vấn đề: Sau khi đăng ký và nhập OTP, dữ liệu **không được lưu vào database** (không có người dùng mới trong DB).
	- Kiểm tra backend: controller/service phải commit entity vào DB sau verify. Kiểm tra transaction, repository/DAO, và migration.
	- Đảm bảo endpoint `POST /auth/register` thực hiện insert (hoặc tạo pending record) và `POST /auth/verify-otp` đánh dấu verified + lưu thông tin user.

- Vấn đề: `VerifyOtpPage.jsx` chưa gọi `authApi.verifyOtp` và không lưu token/user vào frontend.
	- Fix frontend: gọi `authApi.verifyOtp(otp)`; nếu backend trả `token` + `user`, lưu `localStorage.setItem('token', token')` và cập nhật `useAuthStore` (`setToken`, `setUser`) rồi redirect.
	- Nếu backend không trả token tại verify, cần gọi `authApi.login` sau khi verify hoặc yêu cầu backend thay đổi để trả token.

- Vấn đề: `RegisterPage.jsx` gửi request bằng `axios.post('http://localhost:8080/api/auth/register', ...)` thay vì dùng `authApi.register` (hoặc `axiosClient`).
	- Fix: dùng `authApi.register(formData)` để tận dụng `axiosClient` (baseURL, headers, interceptors).

- Vấn đề: `LoginPage.jsx` hiện chưa gọi `useAuth().login` (TODO trong file). Do đó đăng nhập không thực sự lưu token vào `localStorage` và store.
	- Fix: tích hợp `useAuth()` và gọi `await login(email, password)` rồi `navigate('/')`.

- Vấn đề: Không có trang thông tin cá nhân riêng cho từng user (Profile page) để hiển thị/cập nhật thông tin cá nhân.
	- Frontend: thêm route `/profile` với `ProfilePage.jsx` gọi `authApi.getMe()` (hoặc lấy từ `useAuthStore.user`) và hiển thị form chỉnh sửa thông tin cá nhân (fullName, nationality, travelDestination, avatar, v.v.).
	- Backend: đảm bảo có endpoint `PUT /user/profile` hoặc tương đương để cập nhật dữ liệu người dùng.

- Vấn đề: Luồng token/refresh chưa rõ ràng.
	- Nếu backend dùng access + refresh token, cần lưu refresh token (cookie httpOnly hoặc secure storage) và implement refresh flow. Nếu chỉ access token, đảm bảo token TTL hợp lý và `getMe()` phản hồi khi token hợp lệ.

- Kiểm tra khác:
	- Xác thực email: backend phải trả trạng thái rõ ràng khi email đã tồn tại.
	- Xử lý lỗi OTP: hiển thị thông báo lỗi khi OTP sai/timeout.
	- Xác minh CORS / baseURL: `RegisterPage` hiện gọi `http://localhost:8080` cứng — chuyển sang `import.meta.env.VITE_API_BASE_URL` hoặc `authApi`.

## 9) Gợi ý hành động tiếp theo

- Nếu muốn, tôi có thể tự động:
	1. Sửa `RegisterPage.jsx` để dùng `authApi.register` (nhẹ). 
	2. Implement `VerifyOtpPage.jsx` gọi `authApi.verifyOtp`, lưu token và cập nhật `useAuthStore` (trung bình).
	3. Sửa `LoginPage.jsx` để dùng `useAuth().login` (nhẹ).
	4. Tạo skeleton `ProfilePage.jsx` và route `/profile` (tùy chọn, trung bình).

Chọn hành động nào để tôi tiếp tục (1/2/3/4), hoặc tôi có thể thực hiện tất cả.
