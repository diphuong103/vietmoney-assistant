import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input
      ref={ref}
      className={clsx(
        'w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none',
        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        error
          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
          : 'border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-100',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))
Input.displayName = 'Input'
export default Input
