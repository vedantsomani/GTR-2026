import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react'

const FAQ = lazy(() => import('./FAQ.jsx'))
const RuleBook = lazy(() => import('./RuleBook.jsx'))
const Chatbot = lazy(() => import('./Chatbot.jsx'))

const REGISTER_URL = 'https://unstop.com/o/1mBACUO?lb=PTE7q0Dz&utm_medium=Share&utm_source=ctazqbso53950&utm_campaign=Competitions'

// Keyframes mapping scroll progress to banner position (% of viewport)
// Measured from actual WebP frames — full journey from first appearance to final zoom
const BANNER_KEYFRAMES = [
  // Banner first appears at top, small, partially behind rafters
  { scroll: 0.42, top: 5,  left: 38, width: 26, height: 8  },
  { scroll: 0.46, top: 8,  left: 35, width: 30, height: 10 },
  { scroll: 0.50, top: 13, left: 33, width: 33, height: 11 },
  // Banner descends, getting bigger
  { scroll: 0.56, top: 20, left: 32, width: 37, height: 12 },
  { scroll: 0.64, top: 28, left: 32, width: 38, height: 13 },
  // Camera zooming in
  { scroll: 0.73, top: 34, left: 27, width: 48, height: 18 },
  { scroll: 0.79, top: 35, left: 22, width: 55, height: 22 },
  { scroll: 0.83, top: 35, left: 17, width: 65, height: 26 },
  // Final close-up
  { scroll: 0.92, top: 36, left: 10, width: 82, height: 33 },
  { scroll: 1.00, top: 37, left: 9,  width: 84, height: 35 },
]

function lerp(a, b, t) {
  return a + (b - a) * t
}

function getBannerPosition(scrollProgress) {
  const kf = BANNER_KEYFRAMES
  // Before first keyframe
  if (scrollProgress <= kf[0].scroll) return null
  // After last keyframe
  if (scrollProgress >= kf[kf.length - 1].scroll) {
    const last = kf[kf.length - 1]
    return { top: last.top, left: last.left, width: last.width, height: last.height }
  }
  // Find the two keyframes we're between
  for (let i = 0; i < kf.length - 1; i++) {
    if (scrollProgress >= kf[i].scroll && scrollProgress <= kf[i + 1].scroll) {
      const t = (scrollProgress - kf[i].scroll) / (kf[i + 1].scroll - kf[i].scroll)
      return {
        top: lerp(kf[i].top, kf[i + 1].top, t),
        left: lerp(kf[i].left, kf[i + 1].left, t),
        width: lerp(kf[i].width, kf[i + 1].width, t),
        height: lerp(kf[i].height, kf[i + 1].height, t),
      }
    }
  }
  return null
}

export default function HUD({ scrollProgress = 0 }) {
  const [overlay, setOverlay] = useState(null)
  const closeOverlay = useCallback(() => setOverlay(null), [])

  const bannerPos = useMemo(() => getBannerPosition(scrollProgress), [scrollProgress])

  return (
    <div className="hud-overlay">
      {/* Dynamic registration zone — tracks the banner position in the animation */}
      {bannerPos && (
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Register for GTR 2026"
          style={{
            position: 'absolute',
            top: `${bannerPos.top}%`,
            left: `${bannerPos.left}%`,
            width: `${bannerPos.width}%`,
            height: `${bannerPos.height}%`,
            zIndex: 15,
            cursor: 'pointer',
            display: 'block',
            pointerEvents: 'all',
          }}
        />
      )}

      {/* Chatbot + overlays */}
      <Suspense fallback={null}>
        <FAQ isOpen={overlay === 'faq'} onClose={closeOverlay} />
        <RuleBook isOpen={overlay === 'rulebook'} onClose={closeOverlay} />
        {scrollProgress > 0.02 && <Chatbot />}
      </Suspense>
    </div>
  )
}
