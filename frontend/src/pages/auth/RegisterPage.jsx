import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { registerSchema } from '../../utils/validators'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { CITIES } from '../../utils/constants'

export default function RegisterPage() {
  const { register: authRegister } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  })
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🇻🇳</div>
          <h1 className="text-xl font-bold text-gray-900">Tạo tài khoản mới</h1>
        </div>
        <form onSubmit={handleSubmit(authRegister)} className="space-y-4">
          <Input label="Tên đăng nhập *" {...register('username')} error={errors.username?.message} />
          <Input label="Mật khẩu *" type="password" {...register('password')} error={errors.password?.message} />
          <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Họ và tên" {...register('fullName')} />
          <Input label="Quốc tịch" {...register('nationality')} placeholder="Việt Nam, USA, Korea..." />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Điểm đến du lịch</label>
            <select {...register('travelDestination')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
              <option value="">-- Chọn thành phố --</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">Đăng ký</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Đã có tài khoản? <Link to="/login" className="text-red-600 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
