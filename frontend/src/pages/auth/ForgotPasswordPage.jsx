import { useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      toast.success('OTP đã được gửi đến email của bạn!')
    } catch (err) {
      toast.error(err?.message || 'Không tìm thấy email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-lg">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold mb-2">Kiểm tra email</h2>
        <p className="text-gray-500 text-sm mb-6">Chúng tôi đã gửi mã OTP đến <strong>{email}</strong></p>
        <Link to="/verify-otp" state={{ email }} className="text-red-600 hover:underline text-sm font-medium">Nhập mã OTP →</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold mb-1">Quên mật khẩu</h2>
        <p className="text-gray-500 text-sm mb-6">Nhập email để nhận mã OTP đặt lại mật khẩu</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">Gửi mã OTP</Button>
        </form>
        <p className="mt-4 text-center text-sm"><Link to="/login" className="text-red-600 hover:underline">← Quay lại đăng nhập</Link></p>
      </div>
    </div>
  )
}
