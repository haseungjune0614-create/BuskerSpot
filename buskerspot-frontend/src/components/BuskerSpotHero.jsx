import { useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * BuskerSpotHero
 * ------------------------------------------------------------------
 * BuskerSpot 메인 랜딩 히어로 섹션.
 * - 타이틀 글자별 stagger 등장 애니메이션
 * - 배경 오디오 웨이브 바 8개, 무한 루프
 * - CTA 버튼 hover 시 네온 펄스 + scale
 * - 모든 anime.js 인스턴스는 언마운트 시 정리(anime.remove)
 *
 * 사용 라이브러리: animejs (프로젝트에 `npm install animejs` 필요)
 * ------------------------------------------------------------------
 */
export default function BuskerSpotHero() {
  const titleRef = useRef(null);
  const waveBarRefs = useRef([]);
  const ctaRef = useRef(null);
  const ctaAnimRef = useRef(null);
  const waveAnimRef = useRef(null);
  const titleAnimRef = useRef(null);

  const TITLE_TEXT = 'BuskerSpot';
  const WAVE_BAR_COUNT = 8;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // 1) 타이틀 글자별 등장 애니메이션 -------------------------------
    const letterEls = titleRef.current
      ? titleRef.current.querySelectorAll('.bs-letter')
      : [];

    if (letterEls.length) {
      if (prefersReducedMotion) {
        anime.set(letterEls, { opacity: 1, translateY: 0 });
      } else {
        titleAnimRef.current = anime({
          targets: letterEls,
          translateY: [42, 0],
          opacity: [0, 1],
          rotateZ: [4, 0],
          easing: 'easeOutExpo',
          duration: 1000,
          delay: anime.stagger(55, { start: 200 }),
        });
      }
    }

    // 2) 배경 오디오 웨이브 바 무한 루프 ------------------------------
    const bars = waveBarRefs.current.filter(Boolean);
    if (bars.length && !prefersReducedMotion) {
      waveAnimRef.current = bars.map((bar, i) =>
        anime({
          targets: bar,
          scaleY: [
            { value: 0.25 + Math.random() * 0.25, duration: 0 },
            { value: 0.6 + Math.random() * 0.4, duration: 620 + i * 35 },
            { value: 0.2 + Math.random() * 0.3, duration: 560 + i * 40 },
            { value: 0.75 + Math.random() * 0.25, duration: 700 + i * 30 },
          ],
          loop: true,
          easing: 'easeInOutSine',
          delay: i * 90,
        })
      );
    } else if (bars.length) {
      anime.set(bars, { scaleY: 0.5 });
    }

    // 3) CTA 네온 펄스 (autoplay: false, hover 시에만 재생) -----------
    if (ctaRef.current) {
      ctaAnimRef.current = anime({
        targets: ctaRef.current,
        scale: [1, 1.045],
        boxShadow: [
          '0 0 0px 0px rgba(255,79,163,0.0), 0 0 0px 0px rgba(51,230,184,0.0)',
          '0 0 28px 4px rgba(255,79,163,0.55), 0 0 46px 10px rgba(51,230,184,0.35)',
        ],
        duration: 850,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
        autoplay: false,
      });
    }

    // Cleanup: 언마운트 시 모든 anime 인스턴스/타겟 정리
    return () => {
      if (titleAnimRef.current) anime.remove(letterEls);
      if (waveAnimRef.current) anime.remove(bars);
      if (ctaAnimRef.current) {
        ctaAnimRef.current.pause();
        anime.remove(ctaRef.current);
      }
    };
  }, []);

  const handleCtaEnter = () => {
    ctaAnimRef.current?.play();
  };

  const handleCtaLeave = () => {
    if (!ctaAnimRef.current) return;
    ctaAnimRef.current.pause();
    anime.set(ctaRef.current, {
      scale: 1,
      boxShadow:
        '0 0 0px 0px rgba(255,79,163,0.0), 0 0 0px 0px rgba(51,230,184,0.0)',
    });
  };

  return (
    <section className="bs-hero" aria-label="BuskerSpot 소개">
      <div className="bs-hero__wave" aria-hidden="true">
        {Array.from({ length: WAVE_BAR_COUNT }).map((_, i) => (
          <span
            key={i}
            ref={(el) => (waveBarRefs.current[i] = el)}
            className="bs-wave-bar"
            style={{ '--bs-bar-index': i }}
          />
        ))}
      </div>

      <div className="bs-hero__spotlight" aria-hidden="true" />

      <div className="bs-hero__content">
        <h1 className="bs-title" ref={titleRef}>
          {TITLE_TEXT.split('').map((char, i) => (
            <span className="bs-letter" key={i}>
              {char}
            </span>
          ))}
        </h1>

        <p className="bs-tagline">
          거리의 소리가 지도 위에서 다시 울립니다
        </p>

        <button
          type="button"
          className="bs-cta"
          ref={ctaRef}
          onMouseEnter={handleCtaEnter}
          onMouseLeave={handleCtaLeave}
          onFocus={handleCtaEnter}
          onBlur={handleCtaLeave}
        >
          전국 버스킹 지도 보기
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Manrope:wght@400;500;700&display=swap');

        .bs-hero {
          position: relative;
          min-height: 640px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 18%, rgba(255,184,77,0.14), transparent 55%),
            linear-gradient(180deg, #0A0812 0%, #050308 100%);
          padding: 64px 24px;
          font-family: 'Manrope', sans-serif;
        }

        .bs-hero__spotlight {
          position: absolute;
          top: -20%;
          left: 50%;
          width: 900px;
          height: 900px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(255,184,77,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        .bs-hero__wave {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: min(720px, 86%);
          height: 220px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 0;
          opacity: 0.5;
        }

        .bs-wave-bar {
          flex: 1;
          height: 100%;
          border-radius: 999px;
          transform-origin: bottom center;
          background: linear-gradient(
            180deg,
            #33e6b8 0%,
            #ffb84d calc(50% + var(--bs-bar-index, 0) * 2%),
            #ff4fa3 100%
          );
          will-change: transform;
        }

        .bs-hero__content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 22px;
        }

        .bs-title {
          margin: 0;
          font-family: 'Bungee', 'Manrope', sans-serif;
          font-weight: 400;
          font-size: clamp(2.6rem, 7vw, 5.2rem);
          letter-spacing: 0.01em;
          color: #f7efe3;
          line-height: 1;
          display: flex;
        }

        .bs-letter {
          display: inline-block;
          opacity: 0;
          will-change: transform, opacity;
        }

        .bs-tagline {
          margin: 0;
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          color: rgba(247,239,227,0.62);
          max-width: 32ch;
        }

        .bs-cta {
          margin-top: 14px;
          padding: 15px 34px;
          border-radius: 999px;
          border: 1px solid rgba(255,184,77,0.5);
          background: rgba(255,184,77,0.08);
          color: #ffe9c7;
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.01em;
          cursor: pointer;
          transform-origin: center;
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        .bs-cta:hover,
        .bs-cta:focus-visible {
          background: rgba(255,184,77,0.16);
          border-color: rgba(255,184,77,0.85);
        }

        .bs-cta:focus-visible {
          outline: 2px solid #33e6b8;
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .bs-cta {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}