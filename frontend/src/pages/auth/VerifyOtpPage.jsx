import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authApi from '../../api/authApi'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [form, setForm] = useState({ email: state?.email || '', otp: '', newPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resetPassword(form)
      toast.success('Đặt lại mật khẩu thành công!')
      navigate('/login')
    } catch (err) {
      toast.error(err?.message || 'OTP không hợp lệ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold mb-6">Xác thực OTP</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          <Input label="Mã OTP" value={form.otp} onChange={e => setForm(f => ({...f, otp: e.target.value}))} placeholder="Nhập 6 chữ số" maxLength={6} required />
          <Input label="Mật khẩu mới" type="password" value={form.newPassword} onChange={e => setForm(f => ({...f, newPassword: e.target.value}))} required />
          <Button type="submit" loading={loading} className="w-full">Đặt lại mật khẩu</Button>
        </form>
      </div>
    </div>
  )
}
