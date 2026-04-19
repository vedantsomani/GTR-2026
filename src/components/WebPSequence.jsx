import React, { useEffect, useRef, useState } from 'react'

/**
 * WebPSequence — Renders a sequence of 480 WebP frames on a canvas.
 * Driven by mouse scroll (desktop) or touch swipe (mobile).
 * Reports progress to parent for HUD triggers.
 */
export default function WebPSequence({ sequencePath = '/frames/pc/', onProgress, onLoaded, onLoadProgress }) {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const requestFrameRef = useRef(() => {})
  const [isReady, setIsReady] = useState(false)
  const lastDrawableIndexRef = useRef(0)
  
  const progressRef = useRef(0)        // current (lerped)
  const targetProgressRef = useRef(0)  // target from scroll
  const lastReportedRef = useRef(-1)
  
  const TOTAL_FRAMES = 480
  const REQUIRED_READY_FRAMES = Math.min(400, TOTAL_FRAMES)
  const LAZY_LOAD_INTERVAL_MS = 60

  // 1. Preload images
  useEffect(() => {
    console.log(`[WebPSequence] Preloading sequence from: ${sequencePath}`)
    
    // Reset state for new sequence
    setIsReady(false)
    lastDrawableIndexRef.current = 0
    progressRef.current = 0
    targetProgressRef.current = 0
    lastReportedRef.current = -1
    imagesRef.current = []
    let totalLoadedCount = 0
    let totalSettledCount = 0
    let nextReadyReplacementIndex = REQUIRED_READY_FRAMES
    const requested = Array(TOTAL_FRAMES).fill(false)
    const images = Array.from({ length: TOTAL_FRAMES }, () => new Image())
    let isCancelled = false
    let hasReportedReady = false
    let lazyLoadTimer = null

    const updateReadyProgress = () => {
      const pct = Math.round((Math.min(totalLoadedCount, REQUIRED_READY_FRAMES) / REQUIRED_READY_FRAMES) * 100)
      onLoadProgress?.(pct)
    }

    const requestFrame = (index) => {
      if (isCancelled) return
      if (index < 0 || index >= TOTAL_FRAMES) return
      if (requested[index]) return

      requested[index] = true
      const frameStr = String(index + 1).padStart(4, '0')
      const img = images[index]

      const settle = (didLoad) => {
        if (isCancelled) return

        totalSettledCount += 1

        if (didLoad) {
          totalLoadedCount += 1
          updateReadyProgress()
        } else if (!hasReportedReady && nextReadyReplacementIndex < TOTAL_FRAMES) {
          // If a required frame fails, request another frame so we can still hit 400 successful loads.
          requestFrame(nextReadyReplacementIndex)
          nextReadyReplacementIndex += 1
        }

        if (!hasReportedReady && totalLoadedCount >= REQUIRED_READY_FRAMES) {
          reportReady()
        } else if (!hasReportedReady && totalSettledCount >= TOTAL_FRAMES) {
          console.warn('[WebPSequence] Could not reach 400 successful loads, continuing with available frames.')
          reportReady()
        }
      }

      img.onload = () => settle(true)
      img.onerror = () => {
        console.error(`[WebPSequence] ✗ Failed to load frame: ${frameStr} in ${sequencePath}`)
        settle(false)
      }
      img.src = `${sequencePath}${frameStr}.webp`
    }

    requestFrameRef.current = requestFrame

    const startLazyBackgroundLoading = () => {
      let nextLazyIndex = REQUIRED_READY_FRAMES

      const lazyStep = () => {
        if (isCancelled || nextLazyIndex >= TOTAL_FRAMES) return
        requestFrame(nextLazyIndex)
        nextLazyIndex += 1
        lazyLoadTimer = window.setTimeout(lazyStep, LAZY_LOAD_INTERVAL_MS)
      }

      lazyStep()
    }

    const reportReady = () => {
      if (isCancelled || hasReportedReady) return
      hasReportedReady = true
      onLoadProgress?.(100)
      console.log(`[WebPSequence] Ready after ${totalLoadedCount} loaded frames. Rendering started.`)
      setIsReady(true)
      onLoaded?.()
      startLazyBackgroundLoading()
    }

    onLoadProgress?.(0)
    for (let i = 0; i < REQUIRED_READY_FRAMES; i++) {
      requestFrame(i)
    }
    imagesRef.current = images

    return () => {
      isCancelled = true
      requestFrameRef.current = () => {}
      if (lazyLoadTimer) {
        window.clearTimeout(lazyLoadTimer)
      }
    }
  }, [sequencePath, onLoaded, onLoadProgress, REQUIRED_READY_FRAMES, TOTAL_FRAMES, LAZY_LOAD_INTERVAL_MS])

  // 2. Scroll/Touch Listeners (Same logic as Scene.jsx)
  useEffect(() => {
    const SCROLL_SENSITIVITY = 0.0008
    const TOUCH_SENSITIVITY = 0.003
    let touchStartY = 0

    const handleWheel = (e) => {
      e.preventDefault()
      targetProgressRef.current += e.deltaY * SCROLL_SENSITIVITY
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current))
    }

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      const deltaY = touchStartY - e.touches[0].clientY
      touchStartY = e.touches[0].clientY
      targetProgressRef.current += deltaY * TOUCH_SENSITIVITY
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current))
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // 3. Render Loop
  useEffect(() => {
    if (!isReady) return

    let animationFrameId
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const render = () => {
      // Smooth lerp
      const lerp = 0.1
      progressRef.current += (targetProgressRef.current - progressRef.current) * lerp

      // Calculate frame index (0-479)
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(progressRef.current * TOTAL_FRAMES)
      )

      // Load current/neighboring frames on demand after the initial 400-frame gate.
      requestFrameRef.current(frameIndex)
      requestFrameRef.current(frameIndex + 1)
      requestFrameRef.current(frameIndex - 1)
      
      const img = imagesRef.current[frameIndex]
      const fallback = imagesRef.current[lastDrawableIndexRef.current]
      const drawable = img && img.complete && img.naturalWidth > 0
        ? img
        : (fallback && fallback.complete && fallback.naturalWidth > 0 ? fallback : null)

      if (drawable) {
        if (drawable === img) {
          lastDrawableIndexRef.current = frameIndex
        }

        // Clear and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        const canvasAspect = canvas.width / canvas.height
        const imgAspect = drawable.width / drawable.height
        
        let drawWidth, drawHeight, offsetX, offsetY
        
        // "Cover" logic: fill the screen, crop edges
        if (canvasAspect > imgAspect) {
          drawWidth = canvas.width
          drawHeight = canvas.width / imgAspect
          offsetX = 0
          offsetY = (canvas.height - drawHeight) / 2
        } else {
          drawWidth = canvas.height * imgAspect
          drawHeight = canvas.height
          offsetX = (canvas.width - drawWidth) / 2
          offsetY = 0
        }

        ctx.drawImage(drawable, offsetX, offsetY, drawWidth, drawHeight)
      }

      // Report progress to parent
      const rounded = Math.round(progressRef.current * 100)
      if (rounded !== lastReportedRef.current) {
        lastReportedRef.current = rounded
        onProgress?.(progressRef.current)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isReady, onProgress, TOTAL_FRAMES])

  // 4. Handle resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      // Set internal resolution matching logical pixels * scale
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        backgroundColor: '#050510',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1
      }}
    />
  )
}
