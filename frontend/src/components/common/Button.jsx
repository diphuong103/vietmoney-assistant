import { clsx } from 'clsx'

const variants = {
  primary: 'bg-red-600 hover:bg-red-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  danger: 'bg-red-100 hover:bg-red-200 text-red-700',
  ghost: 'hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-700',
}
const sizes = {
  sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base'
}

export default function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  return (
    <button
      className={clsx('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
