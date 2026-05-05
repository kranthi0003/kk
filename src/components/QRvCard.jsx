import React, { useState, useEffect, useRef } from 'react'

const VCARD_DATA = `BEGIN:VCARD
VERSION:3.0
N:Akkumahanthi;Kranthi Kiran
FN:Kranthi Kiran
TITLE:SE-III at GitHub | Microsoft
EMAIL:kranthikiranakkumahanthi@gmail.com
URL:https://kranthikiran.com
URL:https://github.com/kranthi0003
URL:https://linkedin.com/in/akkiran003
END:VCARD`

// Simple QR code generator using canvas (no dependencies)
function generateQR(canvas, text) {
  // Use a QR API to get the image
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const ctx = canvas.getContext('2d')
    canvas.width = 200
    canvas.height = 200
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 200, 200)
    ctx.drawImage(img, 0, 0, 200, 200)
  }
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=000000`
}

export default function QRvCard() {
  const [open, setOpen] = useState(false)
  const canvasRef = useRef()

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-qr-vcard', handler)
    return () => window.removeEventListener('toggle-qr-vcard', handler)
  }, [])

  useEffect(() => {
    if (open && canvasRef.current) {
      generateQR(canvasRef.current, VCARD_DATA)
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[151] w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card"
        style={{ animation: 'spotlight-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="px-6 py-5 text-center">
          <h3 className="text-base font-semibold text-foreground mb-1">Scan to Save Contact</h3>
          <p className="text-xs text-muted-foreground/50 mb-4">Point your camera at the QR code</p>
          <div className="inline-block p-3 bg-white rounded-xl shadow-inner">
            <canvas ref={canvasRef} width={200} height={200} className="block" />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium text-foreground">Kranthi Kiran</p>
            <p className="text-xs text-muted-foreground/60">SE-III at GitHub | Microsoft</p>
            <p className="text-xs text-muted-foreground/40">kranthikiranakkumahanthi@gmail.com</p>
          </div>
          <button
            onClick={() => {
              const blob = new Blob([VCARD_DATA], { type: 'text/vcard' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'kranthi-kiran.vcf'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="mt-4 w-full py-2 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Download vCard (.vcf)
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spotlight-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
