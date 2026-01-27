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

    const render = () => {
      time += 0.015

      const centerX = size / 2
      const centerY = size / 2
      const radius = size / 2 - 2

      // Clear canvas
      ctx.clearRect(0, 0, size, size)

      // Create ethereal gradient effect
      const gradient = ctx.createRadialGradient(
        centerX + Math.sin(time * 1.5) * 3,
        centerY + Math.cos(time * 1.2) * 3,
        0,
        centerX,
        centerY,
        radius
      )

      // Animated color stops - deep, rich blue/indigo with high contrast
      const hue1 = 220 + Math.sin(time * 0.5) * 10 // Deep blue
      const hue2 = 195 + Math.cos(time * 0.7) * 15 // Teal/cyan
      const hue3 = 250 + Math.sin(time * 0.3) * 10 // Deep indigo/violet

      gradient.addColorStop(0, `hsla(${hue2}, 100%, 50%, 1)`)
      gradient.addColorStop(0.25, `hsla(${hue1}, 95%, 40%, 1)`)
      gradient.addColorStop(0.5, `hsla(${hue3}, 90%, 30%, 1)`)
      gradient.addColorStop(0.75, `hsla(${hue3 + 10}, 85%, 20%, 1)`)
      gradient.addColorStop(1, `hsla(${hue3 + 15}, 80%, 12%, 1)`)

      // Draw main circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Add noise/grain texture overlay
      const imageData = ctx.getImageData(0, 0, size * dpr, size * dpr)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15
        data[i] = Math.min(255, Math.max(0, data[i] + noise))
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
      }
      ctx.putImageData(imageData, 0, 0)

      // Add subtle glow orbs
      for (let i = 0; i < 3; i++) {
        const orbX = centerX + Math.sin(time * (1 + i * 0.3) + i * 2) * (radius * 0.4)
        const orbY = centerY + Math.cos(time * (1.2 + i * 0.2) + i * 2) * (radius * 0.4)
        const orbRadius = radius * (0.15 + Math.sin(time * 2 + i) * 0.05)

        const orbGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbRadius)
        orbGradient.addColorStop(0, `hsla(${hue2 + i * 20}, 90%, 80%, 0.6)`)
        orbGradient.addColorStop(1, `hsla(${hue2 + i * 20}, 90%, 80%, 0)`)

        ctx.beginPath()
        ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2)
        ctx.fillStyle = orbGradient
        ctx.fill()
      }

      // Add center highlight
      const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.2,
        centerY - radius * 0.2,
        0,
        centerX,
        centerY,
        radius * 0.6
      )
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()

      // Clip to circle for clean edges
      ctx.globalCompositeOperation = 'destination-in'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

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
      className={cn('rounded-full', className)}
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
