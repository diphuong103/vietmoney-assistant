import { useState, useRef } from 'react'
import { useCamera } from '../../hooks/useCamera'
import scanApi from '../../api/scanApi'
import Button from '../../components/common/Button'
import { formatVND } from '../../utils/formatCurrency'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ScanPage() {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto } = useCamera()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()

  const processImage = async (blob) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', blob, 'scan.jpg')
      const res = await scanApi.scanImage(formData)
      setResult(res.data)
      stopCamera()
    } catch (err) {
      toast.error('Nhận diện thất bại. Thử lại!')
    } finally {
      setLoading(false)
    }
  }

  const handleCapture = async () => {
    const blob = await capturePhoto()
    if (blob) processImage(blob)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nhận diện tiền Việt Nam</h1>
        <p className="text-gray-500 text-sm">AI tự động nhận diện mệnh giá VND</p>
      </div>

      {!result ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {isActive ? (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/70 rounded-xl w-64 h-44" />
              </div>
              <div className="p-4 flex gap-3">
                <Button onClick={handleCapture} loading={loading} className="flex-1">📸 Chụp ảnh</Button>
                <Button variant="secondary" onClick={stopCamera}>Hủy</Button>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-4">
              <div className="text-center text-6xl py-4">📷</div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <Button onClick={startCamera} className="w-full" size="lg">🎥 Mở Camera</Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="flex-1 border-t border-gray-200" /></div>
                <div className="relative text-center"><span className="bg-white px-3 text-xs text-gray-400">hoặc</span></div>
              </div>
              <Button variant="secondary" onClick={() => fileRef.current?.click()} className="w-full" size="lg">
                🖼️ Tải ảnh lên
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="text-center">
            <div className="text-5xl font-bold text-red-600 mb-1">{result.denomination}</div>
            <div className="text-gray-500 text-sm">Độ chính xác: {(result.confidence * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Giá trị</div>
            <div className="text-2xl font-bold text-red-700">{formatVND(result.valueVnd)}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/exchange-rate', { state: { amount: result.valueVnd } })}>💱 Quy đổi</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/price-wiki')}>📋 Tham khảo giá</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/budget', { state: { amount: result.valueVnd } })}>💰 Thêm chi tiêu</Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setResult(null)}>← Quét lại</Button>
        </div>
      )}
    </div>
  )
}
