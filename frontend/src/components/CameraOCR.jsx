import { useRef, useState, useEffect } from 'react'
import { X, Camera, RotateCcw, Loader2, ScanLine } from 'lucide-react'
import { createWorker } from 'tesseract.js'

export default function CameraOCR({ onTextSelect, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // phase drives the UI and controls what's mounted in the DOM
  const [phase, setPhase] = useState('starting') // starting | camera | processing | results | error
  const [capturedImage, setCapturedImage] = useState(null)
  const [status, setStatus] = useState('Starting camera...')
  const [lines, setLines] = useState([])
  const [cameraError, setCameraError] = useState('')

  // Start camera whenever phase flips to 'starting'.
  // The video element is mounted when phase is 'starting' or 'camera',
  // so by the time this effect runs after the render the ref is valid.
  useEffect(() => {
    if (phase !== 'starting') return

    let cancelled = false

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => { if (!cancelled) setPhase('camera') }
        }
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera access denied. Please allow camera permissions in your browser settings.'
              : 'No camera found on this device.'
          )
          setPhase('error')
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [phase])

  // Stop the stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.92)

    setCapturedImage(imageData)
    stopCamera()
    runOCR(imageData)
  }

  const runOCR = async (imageData) => {
    setPhase('processing')
    setStatus('Loading OCR engine...')
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core') setStatus('Loading OCR engine...')
          if (m.status === 'loading language traineddata') setStatus('Downloading language data (first time only)…')
          if (m.status === 'recognizing text') setStatus(`Reading text… ${Math.round((m.progress || 0) * 100)}%`)
        },
      })

      const { data } = await worker.recognize(imageData)
      await worker.terminate()

      // In Tesseract.js v5+, lines live under blocks → paragraphs → lines
      // data.text is always available as a fallback
      const rawLines = data.blocks
        ? data.blocks.flatMap((b) =>
            (b.paragraphs || []).flatMap((p) => (p.lines || []))
          )
        : []

      let extracted = []

      if (rawLines.length > 0) {
        extracted = rawLines
          .filter((l) => (l.confidence ?? 50) > 20 && l.text?.trim().length > 2)
          .map((l) =>
            l.text
              .trim()
              .replace(/[^\w\s&\-().,/%₱]/g, '')
              .trim()
          )
          .filter((l) => l.length > 2 && !/^\d+$/.test(l))
      } else if (data.text) {
        // Fallback: split full text by newline
        extracted = data.text
          .split('\n')
          .map((l) =>
            l
              .trim()
              .replace(/[^\w\s&\-().,/%₱]/g, '')
              .trim()
          )
          .filter((l) => l.length > 2 && !/^\d+$/.test(l))
      }

      setLines([...new Set(extracted)])
      setPhase('results')
    } catch (err) {
      console.error('Tesseract OCR error:', err)
      setCameraError('OCR processing failed. Please try again.')
      setPhase('error')
    }
  }

  const retake = () => {
    stopCamera()
    setCapturedImage(null)
    setLines([])
    setCameraError('')
    setPhase('starting') // triggers the camera-init useEffect after re-render
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800">Scan Product Label</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Camera phase — video must be in DOM during 'starting' so ref resolves */}
        {(phase === 'starting' || phase === 'camera') && (
          <div>
            <div className="relative bg-black aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* Scan guide */}
              {phase === 'camera' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-orange-400 rounded-xl w-4/5 h-20 opacity-75 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
              )}

              {phase === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Starting camera...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5">
              <p className="text-xs text-gray-400 text-center mb-4">
                Align the product label within the orange guide, then capture
              </p>
              <button
                onClick={capture}
                disabled={phase !== 'camera'}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {phase === 'processing' && (
          <div className="p-6">
            {capturedImage && (
              <img src={capturedImage} alt="captured" className="w-full max-h-40 object-contain rounded-xl bg-gray-50 mb-5" />
            )}
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-gray-700 font-medium text-center">{status}</p>
              <p className="text-xs text-gray-400 text-center">
                First scan downloads the OCR engine (~5 MB) — subsequent scans are instant
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && (
          <div className="p-6">
            {capturedImage && (
              <img src={capturedImage} alt="captured" className="w-full max-h-28 object-contain rounded-xl bg-gray-50 mb-4" />
            )}
            <p className="text-sm font-semibold text-gray-700 mb-3">Tap a line to use as the product name:</p>
            <div className="space-y-2 max-h-52 overflow-auto mb-4 pr-1">
              {lines.length > 0 ? (
                lines.map((line, i) => (
                  <button
                    key={i}
                    onClick={() => { onTextSelect(line); onClose() }}
                    className="w-full text-left px-4 py-2.5 bg-gray-50 hover:bg-orange-50 hover:text-orange-700 border border-gray-100 hover:border-orange-300 rounded-xl text-sm transition-colors"
                  >
                    {line}
                  </button>
                ))
              ) : (
                <div className="text-center py-6 space-y-1">
                  <p className="text-gray-500 text-sm">No readable text detected.</p>
                  <p className="text-gray-400 text-xs">Try better lighting or hold the camera closer.</p>
                </div>
              )}
            </div>
            <button
              onClick={retake}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl text-sm text-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="p-6 text-center space-y-4">
            <p className="text-red-500 text-sm leading-relaxed">{cameraError}</p>
            <button
              onClick={retake}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
