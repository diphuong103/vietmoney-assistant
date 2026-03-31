import { useState } from 'react'
import { useExchangeRate } from '../../hooks/useExchangeRate'
import { CURRENCIES } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'

export default function ExchangeRatePage() {
  const { rates, updatedAt, isConnected, convert } = useExchangeRate()
  const [amount, setAmount] = useState(1000000)
  const [fromCurrency, setFromCurrency] = useState('VND')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tỷ giá hối đoái</h1>
          <p className="text-gray-500 text-sm">Cập nhật: {updatedAt ? formatDate(updatedAt, 'HH:mm DD/MM/YYYY') : '--'}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Converter */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">Quy đổi nhanh</h2>
        <div className="flex gap-3">
          <input type="number" value={amount} onChange={e => setAmount(+e.target.value)}
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm outline-none focus:border-red-500" />
          <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)}
            className="px-3 py-2.5 border rounded-lg text-sm outline-none">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CURRENCIES.filter(c => c !== fromCurrency).slice(0, 8).map(to => {
            const converted = convert(amount, fromCurrency, to)
            return (
              <div key={to} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">{to}</span>
                <span className="text-sm font-semibold">{converted ? converted.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '--'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rate Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Tiền tệ</th>
              <th className="px-6 py-3 text-right">1 VND =</th>
              <th className="px-6 py-3 text-right">1 tệ = VND</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(rates).map(([currency, rate]) => (
              <tr key={currency} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{currency}</td>
                <td className="px-6 py-3 text-right text-gray-600">{rate?.toFixed(6)}</td>
                <td className="px-6 py-3 text-right font-semibold">{(1/rate)?.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
