import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface PointALogoProps {
  size?: number
  className?: string
}

export function PointALogo({ size = 32, className }: PointALogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    let time = 0

    // Simplex-like noise function for marble effect
    const noise = (x: number, y: number, t: number) => {
      const sin1 = Math.sin(x * 0.05 + t)
      const sin2 = Math.sin(y * 0.05 + t * 0.7)
      const sin3 = Math.sin((x + y) * 0.03 + t * 0.5)
      const sin4 = Math.sin(Math.sqrt(x * x + y * y) * 0.05 - t * 0.3)
      return (sin1 + sin2 + sin3 + sin4) / 4
    }

    const render = () => {
      time += 0.02

      const centerX = size / 2
      const centerY = size / 2
      const radius = size / 2

      // Create image data for pixel manipulation
      const imageData = ctx.createImageData(size * dpr, size * dpr)
      const data = imageData.data

      for (let y = 0; y < size * dpr; y++) {
        for (let x = 0; x < size * dpr; x++) {
          const px = x / dpr
          const py = y / dpr
          
          // Check if pixel is inside circle
          const dx = px - centerX
          const dy = py - centerY
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist <= radius) {
            // Marble noise pattern
            const n = noise(px * 3, py * 3, time)
            const n2 = noise(px * 5 + 100, py * 5 + 100, time * 1.3)
            const marble = (n + n2 * 0.5) / 1.5
            
            // Swirl effect
            const angle = Math.atan2(dy, dx) + marble * 0.5 + time * 0.1
            const swirl = Math.sin(angle * 3 + dist * 0.1 + time) * 0.5 + 0.5
            
            // Color mixing - blues with light base
            const t = (marble + 1) / 2 * swirl
            
            // Base light color
            const baseR = 140
            const baseG = 160
            const baseB = 200
            
            // Blue/indigo veins
            const veinR = 100
            const veinG = 150
            const veinB = 220
            
            // Bright cyan accent
            const accentR = 180
            const accentG = 220
            const accentB = 255
            
            // Mix colors based on marble pattern
            let r, g, b
            if (t < 0.4) {
              // Dark base
              const mix = t / 0.4
              r = baseR + (veinR - baseR) * mix * 0.3
              g = baseG + (veinG - baseG) * mix * 0.3
              b = baseB + (veinB - baseB) * mix * 0.3
            } else if (t < 0.7) {
              // Red veins
              const mix = (t - 0.4) / 0.3
              r = baseR + (veinR - baseR) * (0.3 + mix * 0.5)
              g = baseG + (veinG - baseG) * (0.3 + mix * 0.3)
              b = baseB + (veinB - baseB) * (0.3 + mix * 0.4)
            } else {
              // Bright accents
              const mix = (t - 0.7) / 0.3
              r = veinR + (accentR - veinR) * mix * 0.6
              g = veinG + (accentG - veinG) * mix * 0.4
              b = veinB + (accentB - veinB) * mix * 0.5
            }
            
            // Add subtle shimmer
            const shimmer = Math.sin(time * 2 + px * 0.2 + py * 0.2) * 10
            r = Math.min(255, Math.max(0, r + shimmer))
            g = Math.min(255, Math.max(0, g + shimmer * 0.5))
            b = Math.min(255, Math.max(0, b + shimmer * 0.6))
            
            // Edge darkening for depth
            const edgeFade = 1 - Math.pow(dist / radius, 2) * 0.3
            r *= edgeFade
            g *= edgeFade
            b *= edgeFade
            
            const idx = (y * size * dpr + x) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
            data[idx + 3] = 255
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // Add glossy highlight
      const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius * 0.8
      )
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
      highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      className={cn('rounded-full shadow-lg', className)}
      style={{ width: size, height: size }}
    />
  )
}

// CSS-only version for simpler use cases (no canvas)
export function PointALogoCss({ size = 32, className }: PointALogoProps) {
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden',
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Base gradient - deep, rich blue/indigo with high contrast */}
      <div 
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #1d4ed8 20%, #4338ca 40%, #3730a3 60%, #1e1b4b 80%, #0f172a 100%)',
          backgroundSize: '400% 400%',
        }}
      />
      
      {/* Floating orbs - bright against dark */}
      <div 
        className="absolute w-1/2 h-1/2 rounded-full animate-float-1 blur-sm"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.85) 0%, transparent 70%)',
          top: '10%',
          left: '10%',
        }}
      />
      <div 
        className="absolute w-1/3 h-1/3 rounded-full animate-float-2 blur-sm"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.75) 0%, transparent 70%)',
          bottom: '20%',
          right: '15%',
        }}
      />
      <div 
        className="absolute w-1/4 h-1/4 rounded-full animate-float-3 blur-sm"
        style={{
          background: 'radial-gradient(circle, rgba(165,180,252,0.6) 0%, transparent 70%)',
          top: '40%',
          left: '50%',
        }}
      />
      
      {/* Highlight */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 40%)',
        }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-15 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
