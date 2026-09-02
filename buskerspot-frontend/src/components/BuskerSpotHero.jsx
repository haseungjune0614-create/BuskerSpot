import React, { useEffect, useRef } from 'react';
import { animate, stagger, utils } from 'animejs';

// ── 팔레트 & 서체는 CSS 변수로 분리 (다른 톤으로 바꾸고 싶으면 여기만 수정) ──
const THEME = {
  '--bs-bg': '#1a1332',
  '--bs-amber': '#ffb200',
  '--bs-magenta': '#ff2fb1',
  '--bs-teal': '#12e0c0',
  '--bs-font-display': "'Bungee', system-ui, sans-serif",
};

const WAVE_COUNT = 8;
const TITLE = 'BuskerSpot';

export default function BuskerSpotHero() {
  const titleRef = useRef(null);
  const waveRefs = useRef([]);
  const ctaRef = useRef(null);
  const ctaAnimRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const titleLetters = titleRef.current
      ? titleRef.current.querySelectorAll('.bs-letter')
      : [];
    const waveBars = waveRefs.current.filter(Boolean);
    const ctaEl = ctaRef.current;

    if (prefersReducedMotion) {
      // 모션 최종 상태만 즉시 세팅 (애니메이션 없이)
      if (titleLetters.length) utils.set(titleLetters, { opacity: 1, translateY: 0, rotate: 0 });
      if (waveBars.length) utils.set(waveBars, { scaleY: 1 });
      return;
    }

    // 1) 타이틀: 글자 단위로 순차 페이드인 + 살짝 회전
    if (titleLetters.length) {
      animate(titleLetters, {
        opacity: { from: 0, to: 1 },
        translateY: { from: 24, to: 0 },
        rotate: { from: () => utils.random(-8, 8), to: 0 },
        duration: 700,
        delay: stagger(45),
        ease: 'outExpo',
      });
    }

    // 2) 오디오 웨이브 8개: 바마다 duration/delay를 다르게 줘서 유기적으로
    const waveAnimations = waveBars.map((bar, i) => {
      const dur = 620 + i * 37 + utils.random(-40, 40);
      const del = i * 60 + utils.random(0, 80);
      return animate(bar, {
        scaleY: [
          { to: utils.random(0.35, 0.6) },
          { to: utils.random(0.9, 1.2) },
          { to: utils.random(0.4, 0.7) },
        ],
        duration: dur,
        delay: del,
        loop: true,
        alternate: true,
        ease: 'inOutSine',
      });
    });

    // 3) CTA 버튼: 미리 만들어두고 hover/focus에서만 재생
    if (ctaEl) {
      ctaAnimRef.current = animate(ctaEl, {
        scale: [{ to: 1.06 }, { to: 1 }],
        boxShadow: [
          { to: '0 0 0px rgba(255,47,177,0), 0 0 0px rgba(18,224,192,0)' },
          {
            to:
              '0 0 28px rgba(255,47,177,0.55), 0 0 44px rgba(18,224,192,0.35)',
          },
          { to: '0 0 0px rgba(255,47,177,0), 0 0 0px rgba(18,224,192,0)' },
        ],
        duration: 900,
        loop: true,
        ease: 'inOutQuad',
        autoplay: false,
      });
    }

    // cleanup: 언마운트 시 전부 정리
    return () => {
      if (titleLetters.length) utils.remove(titleLetters);
      if (waveBars.length) utils.remove(waveBars);
      if (ctaAnimRef.current) {
        ctaAnimRef.current.pause();
      }
      if (ctaEl) utils.remove(ctaEl);
      waveAnimations.forEach((a) => a && a.pause && a.pause());
    };
  }, []);

  const handleCtaEnter = () => {
    if (ctaAnimRef.current) ctaAnimRef.current.play();
  };

  const handleCtaLeave = () => {
    if (ctaAnimRef.current) {
      ctaAnimRef.current.pause();
      ctaAnimRef.current.seek(0);
    }
  };

  return (
    <section className="bs-hero" style={THEME}>
      <style>{`
        .bs-hero {
          position: relative;
          width: 100%;
          box-sizing: border-box;
          padding: 64px 24px;
          background: radial-gradient(circle at 50% -10%, #2a1f4d 0%, var(--bs-bg) 60%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          overflow: hidden;
        }
        .bs-title {
          font-family: var(--bs-font-display);
          font-size: clamp(2.4rem, 6vw, 4.2rem);
          letter-spacing: 0.02em;
          color: #fff;
          margin: 0;
          display: flex;
        }
        .bs-letter {
          display: inline-block;
          will-change: transform, opacity;
          text-shadow: 0 0 18px rgba(255, 178, 0, 0.45);
        }
        .bs-wave {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 64px;
        }
        .bs-wave-bar {
          width: 8px;
          height: 100%;
          border-radius: 999px;
          transform-origin: bottom center;
          background: linear-gradient(
            to top,
            var(--bs-teal) 0%,
            var(--bs-amber) 55%,
            var(--bs-magenta) 100%
          );
          will-change: transform;
        }
        .bs-cta {
          font-family: var(--bs-font-display);
          font-size: 1.05rem;
          color: #1a1332;
          background: linear-gradient(90deg, var(--bs-amber), #ffd166);
          border: none;
          border-radius: 999px;
          padding: 14px 36px;
          cursor: pointer;
          letter-spacing: 0.03em;
        }
        @media (prefers-reduced-motion: reduce) {
          .bs-letter { opacity: 1 !important; transform: none !important; }
          .bs-wave-bar { transform: none !important; }
        }
      `}</style>

      <h1 className="bs-title" ref={titleRef} aria-label={TITLE}>
        {TITLE.split('').map((ch, i) => (
          <span className="bs-letter" key={`${ch}-${i}`}>
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </h1>

      <div className="bs-wave" aria-hidden="true">
        {Array.from({ length: WAVE_COUNT }).map((_, i) => (
          <div
            key={i}
            className="bs-wave-bar"
            ref={(el) => (waveRefs.current[i] = el)}
          />
        ))}
      </div>

      <button
        ref={ctaRef}
        className="bs-cta"
        onMouseEnter={handleCtaEnter}
        onMouseLeave={handleCtaLeave}
        onFocus={handleCtaEnter}
        onBlur={handleCtaLeave}
      >
        지금 공연 찾아보기
      </button>
    </section>
  );
}