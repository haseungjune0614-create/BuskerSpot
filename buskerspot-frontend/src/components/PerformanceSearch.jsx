import React, { useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

// ==========================================
// 🎨 라이트 테마 및 디자인 상수 (BuskerSpot Light Theme)
// ==========================================
const C = {
  bg: '#f8f9fa',
  surface: '#ffffff',
  surfaceAlt: '#f1f3f5',
  text: '#212529',
  textMuted: '#6c757d',
  textFaint: '#adb5bd',
  border: '#dee2e6',
  borderLight: '#ced4da',
  marigold: '#ff8c00',
  marigoldDim: 'rgba(255, 140, 0, 0.1)',
  marigoldSoft: 'rgba(255, 140, 0, 0.2)',
  teal: '#0ca678',
  tealDim: 'rgba(12, 166, 120, 0.1)',
  coral: '#fa5252',
  coralDim: 'rgba(250, 82, 82, 0.1)',
};

// 💡 화면 폭 감지 커스텀 훅
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// 지역 선택 매핑
const regionList = ['전체', '서울', '경기', '인천', '강원', '대전', '대구', '부산', '광주', '울산', '세종', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

const regionSubMap = {
  서울: ['전체', '강남구', '마포구', '송파구', '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강동구'],
  경기: ['전체', '수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '파주시', '시흥시', '김포시', '광명시', '광주시', '군포시', '이천시', '오산시', '하남시', '양주시', '구리시', '안성시', '포천시', '의왕시', '여주시', '양평군', '동두천시', '가평군', '연천군'],
  부산: ['전체', '해운대구', '진구', '수영구', '중구', '남구', '동래구', '영도구', '북구', '기장군'],
};

const genreList = [
  { label: '전체 장르', v: '전체' },
  { label: '🎤 어쿠스틱/발라드', v: '어쿠스틱/발라드' },
  { label: '🎸 밴드/록', v: '밴드/록' },
  { label: '🎹 자작곡/싱어송라이터', v: '자작곡/싱어송라이터' },
  { label: '🎷 클래식/재즈', v: '클래식/재즈' },
  { label: '🎧 힙합/R&B', v: '힙합/R&B' },
  { label: '💃 댄스/퍼포먼스', v: '댄스/퍼포먼스' },
  { label: '🪕 국악/전통', v: '국악/전통' },
  { label: '🪄 마술/마임', v: '마술/마임' },
];

const sortList = [
  { label: '⏰ 시간순', v: 'time' },
  { label: '📍 거리순', v: 'distance' },
  { label: '🔥 인기순', v: 'popularity' },
  { label: '⭐ 평점순', v: 'rating' },
];

// 하버사인 공식 (두 좌표 사이 거리 계산 - km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 이미지 URL 처리 헬퍼
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) return imagePath;
  return `${process.env.REACT_APP_API_URL || ''}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// 공연 진행 상태 계산 헬퍼
const getPerformanceStatus = (dateStr, startTime, endTime) => {
  if (!dateStr || !startTime) return { text: '예정됨', class: 'upcoming' };
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (dateStr < todayStr) return { text: '종료됨', class: 'ended' };
  if (dateStr > todayStr) return { text: '예정됨', class: 'upcoming' };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [sH, sM] = startTime.split(':').map(Number);
  const startMinutes = sH * 60 + sM;

  let endMinutes = startMinutes + 120; // 기본 2시간
  if (endTime) {
    const [eH, eM] = endTime.split(':').map(Number);
    endMinutes = eH * 60 + eM;
  }

  if (nowMinutes < startMinutes) return { text: '오늘 예정', class: 'today' };
  if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) return { text: 'NOW LIVE', class: 'live' };
  return { text: '공연 종료', class: 'ended' };
};

const statusStyle = (statusClass) => {
  switch (statusClass) {
    case 'live':
      return { color: C.coral, bg: C.coralDim, border: 'rgba(250,82,82,0.3)' };
    case 'today':
      return { color: C.marigold, bg: C.marigoldDim, border: 'rgba(255,140,0,0.3)' };
    case 'upcoming':
      return { color: C.teal, bg: C.tealDim, border: 'rgba(12,166,120,0.3)' };
    default:
      return { color: C.textFaint, bg: C.surfaceAlt, border: C.border };
  }
};

// 기본 마이크 아바타
const DefaultMicrophoneAvatar = ({ size = 52 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      flexShrink: 0,
    }}
  >
    🎤
  </div>
);

// 비주얼 음파 이퀄라이저 애니메이션
const Waveform = ({ heights }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '32px', margin: '20px 0' }}>
    {heights.map((h, i) => (
      <div
        key={i}
        className="bsp-wave-bar"
        style={{
          width: '3px',
          height: `${h}px`,
          backgroundColor: C.marigold,
          borderRadius: '2px',
          animationDelay: `${(i % 5) * 0.15}s`,
        }}
      />
    ))}
  </div>
);

// 필터 버튼 (Pill)
const FilterPill = ({ children, active, onClick, small, tone = 'marigold' }) => {
  const activeBg = tone === 'teal' ? C.tealDim : C.marigoldDim;
  const activeBorder = tone === 'teal' ? C.teal : C.marigold;
  const activeColor = tone === 'teal' ? C.teal : C.marigold;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? '5px 12px' : '8px 16px',
        fontSize: small ? '12px' : '13px',
        fontWeight: active ? 800 : 600,
        borderRadius: '999px',
        border: `1px solid ${active ? activeBorder : C.border}`,
        background: active ? activeBg : C.surface,
        color: active ? activeColor : C.textMuted,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

// ==========================================
// 🚀 메인 컴포넌트: PerformanceSearch
// ==========================================
export default function PerformanceSearch({
  inputDate,
  setInputDate,
  inputRegion,
  setInputRegion,
  inputGenre,
  setInputGenre,
  inputSort,
  setInputSort,
  handleSearch,
  filteredPerformances,
  isMapVisible,
  setIsMapVisible,
  selectedPerf,
  setSelectedPerf,
  center,
  setCenter,
  followedArtistIds,
  handleToggleFollow,
  setDetailModalPerf,
  bookmarkedIds,
  handleToggleBookmark,
  setSelectedArtistProfile,
  setActiveTab,
  onImageClick
}) {
  const waveHeights = [12, 20, 28, 16, 24, 32, 18, 10, 22, 26, 14, 20, 30, 16, 8, 22, 28, 12];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [inputSubRegion, setInputSubRegion] = useState('전체');

  const isMobile = useIsMobile(768);
  const isSmallPhone = useIsMobile(480);

  // 현재 사용자 GPS 위치 가져오기
  const handleGetMyCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('GPS 위치를 불러올 수 없습니다:', err),
        { enableHighAccuracy: true }
      );
    }
  };

  React.useEffect(() => {
    handleGetMyCurrentLocation();
  }, []);

  // 오늘 날짜 설정
  const setToday = () => {
    setInputDate(new Date().toISOString().split('T')[0]);
  };

  const handleMainRegionChange = (r) => {
    setInputRegion(r);
    setInputSubRegion('전체');
  };

  const handleSortChange = (s) => {
    setInputSort(s);
  };

  const finalFilteredPerformances = (filteredPerformances || []).filter((perf) => {
    if (inputRegion !== '전체') {
      const matchRegion = perf.region?.includes(inputRegion) || perf.location_name?.includes(inputRegion);
      if (!matchRegion) return false;
    }
    if (inputSubRegion !== '전체') {
      const matchSub = perf.region?.includes(inputSubRegion) || perf.location_name?.includes(inputSubRegion);
      if (!matchSub) return false;
    }
    if (inputGenre !== '전체') {
      if (perf.genre !== inputGenre) return false;
    }
    return true;
  });

  // 정렬된 결과 반환
  const sortedPerformances = [...finalFilteredPerformances].sort((a, b) => {
    if (inputSort === 'time') return (a.start_time || '').localeCompare(b.start_time || '');
    if (inputSort === 'popularity') return (b.follower_count || 0) - (a.follower_count || 0);
    if (inputSort === 'rating') return (b.artist_average_rating || 0) - (a.artist_average_rating || 0);
    if (inputSort === 'distance') {
      const distA = calculateDistance(center.lat, center.lng, a.lat, a.lng) ?? 9999;
      const distB = calculateDistance(center.lat, center.lng, b.lat, b.lng) ?? 9999;
      return distA - distB;
    }
    return 0;
  });

  return (
    <>
      <style>{`
        .bsp-wrap-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .bsp-date-input {
          background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text};
          padding: 8px 12px; border-radius: 10px; font-size: 13px; outline: none;
        }
        .bsp-search-btn {
          background: linear-gradient(135deg, ${C.marigold}, #ffab40); color: #ffffff; border: none;
          border-radius: 12px; padding: 11px 26px; font-weight: 800; font-size: 14px; cursor: pointer;
          box-shadow: 0 6px 18px rgba(255,140,0,0.2); transition: transform 0.15s ease;
        }
        .bsp-search-btn:hover { transform: translateY(-1px); }

        .bsp-card {
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 18px; padding: 18px;
          display: flex; align-items: flex-start; gap: 14px; cursor: pointer; transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .bsp-card:hover { border-color: ${C.borderLight}; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.06); }
        .bsp-card.active { border-color: ${C.marigold}; box-shadow: 0 0 0 2px ${C.marigoldSoft}; }

        .bsp-live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: ${C.coral}; display: inline-block;
          animation: bsp-pulse 1.4s ease-in-out infinite;
        }
        @keyframes bsp-pulse {
          0% { box-shadow: 0 0 0 0 rgba(250,82,82,0.5); }
          70% { box-shadow: 0 0 0 7px rgba(250,82,82,0); }
          100% { box-shadow: 0 0 0 0 rgba(250,82,82,0); }
        }

        .bsp-wave-bar { animation: bsp-wave 1.6s ease-in-out infinite; transform-origin: bottom; }
        @keyframes bsp-wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }

        .bsp-icon-btn {
          background: ${C.surfaceAlt}; border: 1px solid ${C.border}; color: ${C.textMuted};
          border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          transition: all 0.15s ease;
        }
        .bsp-icon-btn:hover { border-color: ${C.borderLight}; color: ${C.text}; background: #e9ecef; }

        @media screen and (max-width: 768px) {
          .bsp-card { flex-direction: column; align-items: stretch; padding: 14px; }
          .bsp-card-actions { flex-direction: row !important; width: 100%; }
          .bsp-card-actions button { flex: 1; }
        }
      `}</style>

      <section style={{ background: `radial-gradient(ellipse 900px 380px at 50% -60px, rgba(255,140,0,0.08), transparent 70%), ${C.bg}`, padding: isMobile ? '30px 14px 20px' : '50px 20px 30px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: C.text, fontSize: isSmallPhone ? '1.4rem' : (isMobile ? '1.7rem' : '2.1rem'), fontWeight: 900, margin: '0 0 8px 0' }}>
            지금 내 주변에서 펼쳐지는 버스킹
          </h1>
          <p style={{ color: C.textMuted, fontSize: isMobile ? '0.85rem' : '0.95rem', margin: 0 }}>오늘의 라이브 공연을 확인하고 버스커를 직접 응원해보세요</p>

          {!isMobile && <Waveform heights={waveHeights} />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', background: C.surface, padding: '12px 18px', borderRadius: '12px', border: `1px solid ${C.border}`, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>🔍 검색 필터 {isFilterOpen ? '접기' : '펼치기'}</span>
            <button type="button" onClick={() => setIsFilterOpen(!isFilterOpen)} className="bsp-icon-btn" style={{ padding: '6px 12px' }}>
              {isFilterOpen ? '▲ 닫기' : '▼ 열기'}
            </button>
          </div>

          {isFilterOpen && (
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', background: C.surface, padding: isMobile ? '16px' : '20px', borderRadius: '14px', border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>날짜</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="bsp-date-input" />
                  <button type="button" className="bsp-pill bsp-pill--marigold" onClick={setToday} style={{ padding: '8px 16px', fontSize: '13px', background: C.marigoldDim, color: C.marigold, border: `1px solid ${C.marigold}`, borderRadius: '999px', fontWeight: 700, cursor: 'pointer' }}>오늘</button>
                </div>
              </div>

              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>지역</span>
                <div className="bsp-wrap-row">
                  {regionList.map((r) => (
                    <FilterPill key={r} active={inputRegion === r} onClick={() => handleMainRegionChange(r)}>
                      {r === '전체' ? '전국 전체' : r}
                    </FilterPill>
                  ))}
                </div>
                {inputRegion !== '전체' && regionSubMap[inputRegion] && (
                  <div className="bsp-wrap-row" style={{ marginTop: '8px' }}>
                    {regionSubMap[inputRegion].map((sub, idx) => (
                      <FilterPill key={idx} small tone="teal" active={inputSubRegion === sub} onClick={() => setInputSubRegion(sub)}>
                        {sub}
                      </FilterPill>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>장르</span>
                <div className="bsp-wrap-row">
                  {genreList.map((g) => (
                    <FilterPill key={g.v} active={inputGenre === g.v} onClick={() => setInputGenre(g.v)}>
                      {g.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>정렬</span>
                <div className="bsp-wrap-row">
                  {sortList.map((s) => (
                    <FilterPill key={s.v} tone="teal" active={inputSort === s.v} onClick={() => handleSortChange(s.v)}>
                      {s.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <button type="button" className="bsp-search-btn" onClick={() => { handleSearch(); setIsFilterOpen(false); }}>
                🔍 이 조건으로 검색
              </button>
            </div>
          )}
        </div>
      </section>

      <main style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '20px 12px 40px' : '32px 20px 60px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '24px', alignItems: 'flex-start' }}>
          <section style={{ flex: isMobile ? 'none' : (isMapVisible ? '1.1' : '1'), width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
  <h3 style={{ color: C.text, fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>
    버스킹 목록 <span style={{ color: C.marigold }}>({sortedPerformances.length}개 검색됨)</span>
  </h3>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button type="button" className="bsp-icon-btn" onClick={handleGetMyCurrentLocation} style={{ fontSize: isMobile ? '11px' : '12.5px', padding: isMobile ? '6px 10px' : '8px 14px' }}>📍 내 위치 새로고침</button>
    <button type="button" className="bsp-icon-btn" onClick={() => setIsMapVisible(!isMapVisible)} style={{ fontSize: isMobile ? '11px' : '12.5px', padding: isMobile ? '6px 10px' : '8px 14px' }}>{isMapVisible ? '🗺️ 지도 접기' : '🗺️ 지도 보기'}</button>
  </div>
</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
              {sortedPerformances.length > 0 ? (
                sortedPerformances.map((perf) => {
                  const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
                  const status = getPerformanceStatus(perfDateStr, perf.start_time, perf.end_time);
                  const sColor = statusStyle(status.class);
                  const profileImg = getImageUrl(perf.artist_profile_image || perf.profile_image);
                  const introText = perf.artist_introduction || perf.introduction || perf.bio;
                  const reviewCount = perf.artist_review_count || perf.review_count || 0;
                  const displayRating = reviewCount > 0 ? Number(perf.artist_average_rating || perf.average_rating || 0).toFixed(1) : '0.0';
                  const distanceKm = perf.lat && perf.lng ? calculateDistance(center.lat, center.lng, perf.lat, perf.lng) : null;
                  const distanceText = distanceKm !== null ? (distanceKm < 1 ? `약 ${Math.round(distanceKm * 1000)}m` : `약 ${distanceKm.toFixed(1)}km`) : '';
                  const isBookmarked = bookmarkedIds.includes(perf.id);

                  return (
                    <div key={perf.id} className={`bsp-card ${selectedPerf?.id === perf.id ? 'active' : ''}`} onClick={() => setSelectedPerf(perf)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: isMobile ? '100%' : 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '54px' }}>
                          <span style={{ color: C.text, fontSize: '1.3rem', fontWeight: 800 }}>{perf.start_time?.slice(0, 5)}</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '999px', color: sColor.color, background: sColor.bg }}>
                            {status.text}
                          </span>
                        </div>

                        {profileImg ? (
                          <img
                            src={profileImg}
                            alt=""
                            onClick={(e) => { e.stopPropagation(); if (onImageClick) onImageClick(profileImg); }}
                            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: `1px solid ${C.border}` }}
                          />
                        ) : <DefaultMicrophoneAvatar />}

                        {isMobile && (
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {perf.artist_nickname || perf.stage_name}
                            </h4>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: C.textMuted }}>{perf.location_name || perf.region}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: C.marigold, background: C.marigoldDim, padding: '3px 9px', borderRadius: '999px' }}>{perf.genre}</span>
                          {!isMobile && <span style={{ fontSize: '11px', fontWeight: 600, color: C.textMuted, background: C.surfaceAlt, padding: '3px 9px', borderRadius: '999px' }}>{perf.location_name || perf.region}</span>}
                          {distanceText && <span style={{ fontSize: '11px', fontWeight: 600, color: C.teal, background: C.tealDim, padding: '3px 9px', borderRadius: '999px' }}>{distanceText}</span>}
                        </div>
                        {!isMobile && <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: C.text }}>{perf.artist_nickname || perf.stage_name}</h4>}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: C.textMuted, marginBottom: '4px' }}>
                          <span>👥 {perf.follower_count ?? perf.followers ?? 0}명</span>
                          <span>⭐ {displayRating} ({reviewCount})</span>
                        </div>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: C.text, fontSize: '13.5px' }}>{perf.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: C.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {introText ? `💬 ${introText}` : '💬 소개가 없습니다.'}
                        </p>
                      </div>

                      <div className="bsp-card-actions" style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', alignItems: 'stretch', width: isMobile ? '100%' : 'auto' }}>
                        <button type="button" onClick={(e) => handleToggleBookmark(perf.id, e)} style={{ background: isBookmarked ? C.coralDim : C.surfaceAlt, color: isBookmarked ? C.coral : C.textMuted, border: `1px solid ${C.border}`, borderRadius: '999px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                          {isBookmarked ? '❤️' : '🤍'} 찜
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDetailModalPerf(perf); }} style={{ background: C.marigold, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '12.5px' }}>
                          상세보기
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (setSelectedArtistProfile) {
                              setSelectedArtistProfile({
                                artist_id: perf.artist_id || perf.user_id,
                                stage_name: perf.artist_nickname || perf.stage_name,
                                genre: perf.genre,
                                profile_image: perf.artist_profile_image || perf.profile_image,
                                introduction: perf.artist_introduction || perf.introduction || perf.bio,
                                follower_count: perf.follower_count ?? perf.followers ?? 0,
                                average_rating: perf.artist_average_rating ?? perf.average_rating ?? 0,
                                review_count: perf.artist_review_count ?? perf.review_count ?? 0
                              });
                            }
                          }}
                          style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '8px 14px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          프로필 보기
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textFaint, background: C.surface, borderRadius: '18px', border: `1px solid ${C.border}` }}>검색된 공연이 없습니다.</div>
              )}
            </div>
          </section>

          {isMapVisible && (
            <section style={{ flex: isMobile ? 'none' : '0.9', width: '100%', position: isMobile ? 'relative' : 'sticky', top: isMobile ? 0 : '20px', order: isMobile ? -1 : 0 }}>
              <div style={{ borderRadius: '18px', overflow: 'hidden', border: `1px solid ${C.border}`, height: isMobile ? '280px' : '640px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <Map center={center} style={{ width: '100%', height: '100%' }} level={4}>
                  <MapMarker position={center} />
                  {finalFilteredPerformances.map((perf) => {
                    if (!perf.lat || !perf.lng) return null;
                    return <MapMarker key={perf.id} position={{ lat: Number(perf.lat), lng: Number(perf.lng) }} onClick={() => setSelectedPerf(perf)} />;
                  })}
                </Map>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}