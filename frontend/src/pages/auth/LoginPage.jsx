import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { loginSchema } from '../../utils/validators'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  })
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🇻🇳</div>
          <h1 className="text-2xl font-bold text-gray-900">VietMoney Assistant</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>
        <form onSubmit={handleSubmit(login)} className="space-y-4">
          <Input label="Tên đăng nhập" {...register('username')} error={errors.username?.message} placeholder="Nhập tên đăng nhập" />
          <Input label="Mật khẩu" type="password" {...register('password')} error={errors.password?.message} placeholder="Nhập mật khẩu" />
          <Button type="submit" loading={isSubmitting} className="w-full">Đăng nhập</Button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-red-600 hover:underline">Quên mật khẩu?</Link>
          <p className="text-sm text-gray-500">Chưa có tài khoản? <Link to="/register" className="text-red-600 hover:underline font-medium">Đăng ký ngay</Link></p>
        </div>
      </div>
    </div>
  )
}
