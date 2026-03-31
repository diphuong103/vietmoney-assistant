import { useRef, useState, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      })
      if (videoRef.current) videoRef.current.srcObject = mediaStream
      setStream(mediaStream)
      setIsActive(true)
      setError(null)
    } catch (err) {
      setError('Không thể truy cập camera: ' + err.message)
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setIsActive(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  }, [])

  return { videoRef, isActive, error, startCamera, stopCamera, capturePhoto }
}
