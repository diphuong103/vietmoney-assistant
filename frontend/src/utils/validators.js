import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự').max(50),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  travelDestination: z.string().optional(),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Nhập tên đăng nhập'),
  password: z.string().min(1, 'Nhập mật khẩu'),
})

export const budgetSchema = z.object({
  name: z.string().min(1, 'Nhập tên ngân sách'),
  totalAmount: z.number().positive('Số tiền phải lớn hơn 0'),
  currency: z.string().default('VND'),
})
