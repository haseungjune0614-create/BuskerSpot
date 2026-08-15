import React, { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const C = {
  bg: '#f8f9fa',
  surface: '#ffffff',
  surfaceAlt: '#f1f3f5',
  border: '#dee2e6',
  borderLight: '#ced4da',
  text: '#212529',
  textMuted: '#6c757d',
  textFaint: '#adb5bd',
  marigold: '#ff8c00',
  marigoldDim: 'rgba(255,140,0,0.1)',
  marigoldSoft: 'rgba(255,140,0,0.3)',
  teal: '#0ca678',
  tealDim: 'rgba(12,166,120,0.1)',
  coral: '#fa5252',
  coralDim: 'rgba(250,82,82,0.1)',
};

// 💡 화면 폭을 감지해서 모바일 레이아웃 여부를 반환하는 커스텀 훅
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

const FilterPill = ({ active, onClick, children, small, tone = 'marigold' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`bsp-pill bsp-pill--${tone} ${active ? 'active' : ''}`}
    style={{ padding: small ? '6px 12px' : '8px 16px', fontSize: small ? '12.5px' : '13.5px' }}
  >
    {children}
  </button>
);

const Waveform = ({ heights }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', height: '22px', margin: '18px 0 30px' }}>
    {heights.map((h, i) => (
      <span
        key={i}
        className="bsp-wave-bar"
        style={{
          width: '3px',
          height: `${h}%`,
          background: i % 5 === 0 ? C.teal : C.marigold,
          borderRadius: '2px',
          animationDelay: `${i * 0.06}s`,
        }}
      />
    ))}
  </div>
);

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
  getPerformanceStatus,
  followedArtistIds,
  handleToggleFollow,
  setDetailModalPerf,
  bookmarkedIds,
  handleToggleBookmark,
  setSelectedArtistProfile,
  setActiveTab,
  onImageClick
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile(768);
  const isSmallPhone = useIsMobile(480);

  const regionSubMap = {
    '서울': ['전체(서울)', '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구', '홍대'],
    '경기': ['전체(경기)', '수원시', '고양시', '용인시', '성남시', '분당구', '부천시', '화성시', '안산시', '안양시', '남양주시', '평택시', '시흥시', '파주시', '의정부시', '김포시', '광주시', '광명시', '군포시', '하남시', '오산시', '이천시', '안성시', '의왕시', '포천시', '여주시', '연천군', '가평군', '양평군', '분당'],
    '인천': ['전체(인천)', '중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '부산': ['전체(부산)', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구': ['전체(대구)', '중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
    '광주': ['전체(광주)', '동구', '서구', '남구', '북구', '광산구'],
    '대전': ['전체(대전)', '동구', '중구', '서구', '유성구', '대덕구'],
    '울산': ['전체(울산)', '중구', '남구', '동구', '북구', '울주군'],
    '세종': ['전체(세종)'],
    '강원': ['전체(강원)', '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충북': ['전체(충북)', '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충남': ['전체(충남)', '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전북': ['전체(전북)', '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전남': ['전체(전남)', '목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경북': ['전체(경북)', '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경남': ['전체(경남)', '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주': ['전체(제주)', '제주시', '서귀포시']
  };

  const neighborhoodToProvince = { '홍대': '서울', '강남': '서울', '분당': '경기' };
  const regionList = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  const genreList = [
    { v: 'ALL', label: '전체 장르' },
    { v: 'Acoustic', label: '어쿠스틱 / 발라드' },
    { v: 'Band', label: '밴드 / 록' },
    { v: 'Dance', label: '댄스 / 퍼포먼스' },
    { v: 'Hiphop', label: '힙합 / 랩' },
    { v: 'Jazz', label: '재즈 / 블루스' },
    { v: 'Classic', label: '클래식 / 국악' },
    { v: 'Other', label: '기타' }
  ];
  const sortList = [
    { v: 'time', label: '⏰ 시간 순' },
    { v: 'nearest', label: '📍 가까운 순' },
    { v: 'rating', label: '⭐ 평점 순' },
    { v: 'reviews', label: '💬 리뷰 많은 순' },
    { v: 'follower', label: '👥 팔로워 순' }
  ];

  const [inputSubRegion, setInputSubRegion] = useState('전체');

  const handleMainRegionChange = (region) => {
    setInputRegion(region);
    setInputSubRegion('전체');
  };

  const parseLocalDate = (dateString) => {
    if (!dateString) return new Date();
    const cleanDateStr = dateString.split('T')[0];
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) return imagePath;
    return `http://localhost:5000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const handleGetMyCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          alert('현재 위치(GPS)를 성공적으로 불러왔습니다!');
        },
        () => alert('위치 정보 권한이 거부되었거나 사용할 수 없습니다.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('이 브라우저에서는 위치 정보(Geolocation)를 지원하지 않습니다.');
    }
  };

  const handleSortChange = (sortValue) => {
    setInputSort(sortValue);
    if (sortValue === 'nearest') handleGetMyCurrentLocation();
  };

  const setToday = () => {
    const d = new Date();
    setInputDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };
  const finalFilteredPerformances = (filteredPerformances || []).filter((perf) => {
    const rawRegion = perf.region || perf.location_name || '';
    const regionName = rawRegion.replace(/\s+/g, '');
    const locName = (perf.location_name || perf.region || '').replace(/\s+/g, '');

    if (inputRegion && inputRegion !== '전체') {
      const mainReg = inputRegion.replace(/\s+/g, '');
      const province = neighborhoodToProvince[perf.region] || null;
      let isMatched = province ? (province === mainReg) : (regionName.includes(mainReg) || locName.includes(mainReg));

      if (!isMatched && regionSubMap[inputRegion]) {
        isMatched = regionSubMap[inputRegion].some(sub => {
          const cleanSub = sub.replace('구', '').replace('시', '').replace(/전체\(.*\)/, '').trim();
          if (!cleanSub || cleanSub.length < 2) return false;
          return locName.includes(cleanSub) || regionName.includes(cleanSub);
        });
      }

      if (mainReg === '대구' && (regionName.includes('경남') || regionName.includes('경북') || regionName.includes('창원'))) return false;
      if (mainReg === '경남' && regionName.includes('대구')) return false;
      if (!isMatched) return false;
    }

    if (inputSubRegion && inputSubRegion !== '전체' && !inputSubRegion.startsWith('전체(')) {
      const subReg = inputSubRegion.replace('구', '').replace('시', '').replace(/\s+/g, '');
      if (!locName.includes(subReg) && !regionName.includes(subReg)) return false;
    }

    return true;
  });

  const sortedPerformances = [...finalFilteredPerformances].sort((a, b) => {
    if (inputSort === 'rating') {
      const ratingA = (a.artist_review_count || a.review_count || 0) > 0 ? (a.artist_average_rating || a.average_rating || 0) : 0;
      const ratingB = (b.artist_review_count || b.review_count || 0) > 0 ? (b.artist_average_rating || b.average_rating || 0) : 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.artist_review_count || b.review_count || 0) - (a.artist_review_count || a.review_count || 0);
    }
    if (inputSort === 'reviews') {
      const reviewsA = a.artist_review_count || a.review_count || 0;
      const reviewsB = b.artist_review_count || b.review_count || 0;
      if (reviewsB !== reviewsA) return reviewsB - reviewsA;
      const ratingA = reviewsA > 0 ? (a.artist_average_rating || a.average_rating || 0) : 0;
      const ratingB = reviewsB > 0 ? (b.artist_average_rating || b.average_rating || 0) : 0;
      return ratingB - ratingA;
    }
    if (inputSort === 'nearest') {
      const distA = a.lat && a.lng ? calculateDistance(center.lat, center.lng, a.lat, a.lng) : 999999;
      const distB = b.lat && b.lng ? calculateDistance(center.lat, center.lng, b.lat, b.lng) : 999999;
      return distA - distB;
    }
    if (inputSort === 'follower') {
      return (b.follower_count || b.followers || 0) - (a.follower_count || a.followers || 0);
    }
    const dateObjA = parseLocalDate(a.performance_date || a.date);
    const dateObjB = parseLocalDate(b.performance_date || b.date);
    const [hA, mA] = a.start_time ? a.start_time.split(':').map(Number) : [0, 0];
    const [hB, mB] = b.start_time ? b.start_time.split(':').map(Number) : [0, 0];
    const timeA = new Date(dateObjA.getFullYear(), dateObjA.getMonth(), dateObjA.getDate(), hA, mA);
    const timeB = new Date(dateObjB.getFullYear(), dateObjB.getMonth(), dateObjB.getDate(), hB, mB);
    return timeA - timeB;
  });

  const DefaultMicrophoneAvatar = ({ size = 50 }) => (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: `linear-gradient(135deg, ${C.marigold} 0%, ${C.teal} 130%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${size * 0.45}px`, color: '#ffffff', flexShrink: 0,
      boxShadow: `0 4px 14px rgba(255,140,0,0.2)`
    }}>
      🎤
    </div>
  );

  const statusStyle = (statusClass) => {
    if (statusClass === 'live') return { color: C.coral, bg: C.coralDim, border: 'rgba(250,82,82,0.3)' };
    if (statusClass === 'ended') return { color: C.textFaint, bg: '#f1f3f5', border: C.border };
    return { color: C.teal, bg: C.tealDim, border: 'rgba(12,166,120,0.3)' };
  };

  const waveHeights = [30, 55, 40, 80, 60, 35, 90, 50, 65, 30, 45, 75, 55, 40, 85, 60, 35, 50, 70, 40, 55, 30, 60, 45, 80];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

        .bsp-wrap-row { display: flex; gap: 8px; flex-wrap: wrap; }

        .bsp-pill {
          border-radius: 999px; border: 1px solid ${C.border}; background: ${C.surfaceAlt};
          color: ${C.textMuted}; font-weight: 600; white-space: nowrap; cursor: pointer;
          transition: all 0.15s ease; flex-shrink: 0;
        }
        .bsp-pill:hover { border-color: ${C.borderLight}; color: ${C.text}; }
        .bsp-pill--marigold.active {
          background: ${C.marigold}; border-color: ${C.marigold}; color: #ffffff; box-shadow: 0 4px 14px rgba(255,140,0,0.25);
        }
        .bsp-pill--teal.active {
          background: ${C.teal}; border-color: ${C.teal}; color: #ffffff; box-shadow: 0 4px 14px rgba(12,166,120,0.25);
        }

        .bsp-date-input {
          background: ${C.surfaceAlt}; border: 1px solid ${C.border}; color: ${C.text};
          border-radius: 10px; padding: 8px 12px; font-size: 13.5px; font-weight: 600; color-scheme: light;
        }
        .bsp-date-input:focus { outline: none; border-color: ${C.marigold}; }

        .bsp-search-btn {
          background: linear-gradient(135deg, ${C.marigold}, #ffab40); color: #ffffff; border: none;
          border-radius: 12px; padding: 11px 26px; font-weight: 800; font-size: 14px; cursor: pointer;
          box-shadow: 0 6px 18px rgba(255,140,0,0.25); transition: transform 0.15s ease;
        }
        .bsp-search-btn:hover { transform: translateY(-1px); }

        .bsp-card {
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 18px; padding: 18px;
          display: flex; align-items: flex-start; gap: 14px; cursor: pointer; transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .bsp-card:hover { border-color: ${C.borderLight}; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.08); }
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
        @media (prefers-reduced-motion: reduce) {
          .bsp-wave-bar, .bsp-live-dot { animation: none; }
        }

        .bsp-icon-btn {
          background: ${C.surfaceAlt}; border: 1px solid ${C.border}; color: ${C.textMuted};
          border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          transition: all 0.15s ease;
        }
        .bsp-icon-btn:hover { border-color: ${C.borderLight}; color: ${C.text}; }

        /* 모바일 대응 */
        @media screen and (max-width: 768px) {
          .bsp-card { flex-direction: column; align-items: stretch; padding: 14px; }
          .bsp-card-actions { flex-direction: row !important; width: 100%; }
          .bsp-card-actions button { flex: 1; }
        }
      `}</style>

      <section
        style={{
          background: `radial-gradient(ellipse 900px 380px at 50% -60px, rgba(255,140,0,0.08), transparent 70%), ${C.bg}`,
          padding: isMobile ? '30px 14px 20px' : '50px 20px 30px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: C.text, fontSize: isSmallPhone ? '1.4rem' : (isMobile ? '1.7rem' : '2.1rem'), fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.02em', fontFamily: "'Noto Sans KR', sans-serif" }}>
            지금 내 주변에서 펼쳐지는 버스킹
          </h1>
          <p style={{ color: C.textMuted, fontSize: isMobile ? '0.85rem' : '0.95rem', margin: 0 }}>
            오늘의 라이브 공연을 확인하고 버스커를 직접 응원해보세요
          </p>

          {!isMobile && <Waveform heights={waveHeights} />}
          {isMobile && <div style={{ height: '18px' }} />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: C.surface, padding: '12px 18px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>
              🔍 검색 필터 {isFilterOpen ? '접기' : '펼치기'}
            </span>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bsp-icon-btn"
              style={{ padding: '6px 12px' }}
            >
              {isFilterOpen ? '▲ 닫기' : '▼ 열기'}
            </button>
          </div>

          {isFilterOpen && (
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', background: C.surface, padding: isMobile ? '16px' : '20px', borderRadius: '14px', border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>날짜</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="bsp-date-input" style={{ flex: isMobile ? '1 1 160px' : 'none' }} />
                  <button className="bsp-pill bsp-pill--marigold" onClick={setToday} style={{ padding: '8px 16px', fontSize: '13px' }}>오늘</button>
                </div>
              </div>

              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>지역</span>
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
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>장르</span>
                <div className="bsp-wrap-row">
                  {genreList.map((g) => (
                    <FilterPill key={g.v} active={inputGenre === g.v} onClick={() => setInputGenre(g.v)}>
                      {g.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>정렬</span>
                <div className="bsp-wrap-row">
                  {sortList.map((s) => (
                    <FilterPill key={s.v} tone="teal" active={inputSort === s.v} onClick={() => handleSortChange(s.v)}>
                      {s.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <button
                className="bsp-search-btn"
                onClick={() => {
                  handleSearch();
                  setIsFilterOpen(false);
                }}
                style={{ alignSelf: isMobile ? 'stretch' : 'flex-start', marginTop: '4px' }}
              >
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
              <h3 style={{ color: C.text, fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                버스킹 목록{' '}
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: C.marigold, fontSize: '1.15rem', letterSpacing: '0.02em' }}>
                  ({sortedPerformances.length}개 검색됨)
                </span>
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="bsp-icon-btn" onClick={handleGetMyCurrentLocation}>📍{isMobile ? '' : ' 내 위치 새로고침'}</button>
                <button className="bsp-icon-btn" onClick={() => setIsMapVisible(!isMapVisible)}>
                  {isMapVisible ? '🗺️ 지도 접기' : '🗺️ 지도 보기'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
              {sortedPerformances.length > 0 ? (
                sortedPerformances.map((perf) => {
                  const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
                  const status = getPerformanceStatus(perfDateStr, perf.start_time, perf.end_time);
                  const sColor = statusStyle(status.class);
                  const rawProfileImg = perf.artist_profile_image || perf.profile_image;
                  const profileImg = getImageUrl(rawProfileImg);
                  const introText = perf.artist_introduction || perf.introduction || perf.bio;
                  const reviewCount = perf.artist_review_count || perf.review_count || 0;
                  const displayRating = reviewCount > 0 ? Number(perf.artist_average_rating || perf.average_rating || 0).toFixed(1) : '0.0';
                  const distanceKm = perf.lat && perf.lng ? calculateDistance(center.lat, center.lng, perf.lat, perf.lng) : null;
                  const distanceText = distanceKm !== null ? (distanceKm < 1 ? `약 ${Math.round(distanceKm * 1000)}m` : `약 ${distanceKm.toFixed(1)}km`) : '';
                  const isBookmarked = bookmarkedIds.includes(perf.id);

                  return (
                    <div
                      key={perf.id}
                      className={`bsp-card ${selectedPerf?.id === perf.id ? 'active' : ''}`}
                      onClick={() => {
                        if (perf.lat && perf.lng) {
                          const newLat = Number(perf.lat);
                          const newLng = Number(perf.lng);
                          if (center.lat === newLat && center.lng === newLng) {
                            setCenter({ lat: newLat + 0.00001, lng: newLng + 0.00001 });
                            setTimeout(() => {
                              setCenter({ lat: newLat, lng: newLng });
                            }, 10);
                          } else {
                            setCenter({ lat: newLat, lng: newLng });
                          }
                        }
                        setSelectedPerf(perf);
                        setIsMapVisible(true);
                      }}
                    >
                      {/* 모바일: 시간/상태 + 아바타를 한 줄로 배치 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: isMobile ? '100%' : 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '54px' }}>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: C.text, fontSize: '1.3rem', letterSpacing: '0.02em' }}>
                            {perf.start_time?.slice(0, 5)}
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '999px',
                            color: sColor.color, background: sColor.bg, border: `1px solid ${sColor.border}`,
                            display: 'flex', alignItems: 'center', gap: '5px'
                          }}>
                            {status.class === 'live' && <span className="bsp-live-dot" />}
                            {status.text}
                          </span>
                        </div>

                        {profileImg ? (
                          <img
                            src={profileImg}
                            alt={perf.stage_name || '아티스트'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onImageClick) onImageClick(profileImg);
                            }}
                            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0, cursor: 'pointer' }}
                            title="사진 확대하기"
                            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }}
                          />
                        ) : null}
                        <div style={{ display: profileImg ? 'none' : 'block' }}><DefaultMicrophoneAvatar size={52} /></div>

                        {isMobile && (
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {perf.stage_name || perf.organizer_name}
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
                        {!isMobile && (
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: C.text }}>{perf.stage_name || perf.organizer_name}</h4>
                        )}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: C.textMuted, marginBottom: '4px' }}>
                          <span>👥 {perf.follower_count ?? perf.followers ?? 0}명</span>
                          <span>⭐ {displayRating} ({reviewCount})</span>
                        </div>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: C.text, fontSize: '13.5px' }}>{perf.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: C.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {introText ? `💬 ${introText}` : '💬 등록된 아티스트 소개가 없습니다.'}
                        </p>
                      </div>

                      <div className="bsp-card-actions" style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', alignItems: 'stretch', width: isMobile ? '100%' : 'auto' }}>
                        <button
                          onClick={(e) => handleToggleBookmark(perf.id, e)}
                          style={{
                            background: isBookmarked ? C.coralDim : C.surfaceAlt,
                            border: `1px solid ${isBookmarked ? 'rgba(250,82,82,0.3)' : C.border}`,
                            borderRadius: '999px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                            color: isBookmarked ? C.coral : C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                          }}
                        >
                          <span>{isBookmarked ? '❤️' : '🤍'}</span><span>찜</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetailModalPerf(perf); }}
                          style={{ background: C.marigold, color: '#ffffff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          상세보기
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (setSelectedArtistProfile) {
                              const artistId = perf.artist_id || perf.user_id;
                              setSelectedArtistProfile({
                                artist_id: artistId,
                                stage_name: perf.stage_name || perf.organizer_name,
                                genre: perf.genre || 'Acoustic',
                                profile_image: perf.artist_profile_image || perf.profile_image,
                                instagram_url: perf.artist_instagram_url || perf.instagram_url,
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
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textFaint, background: C.surface, borderRadius: '18px', border: `1px solid ${C.border}` }}>
                  검색된 공연이 없습니다.
                </div>
              )}
            </div>
          </section>

          {isMapVisible && (
            <section
              style={{
                flex: isMobile ? 'none' : '0.9',
                width: '100%',
                position: isMobile ? 'relative' : 'sticky',
                top: isMobile ? 0 : '20px',
                order: isMobile ? -1 : 0
              }}
            >
              <div style={{ borderRadius: '18px', overflow: 'hidden', border: `1px solid ${C.border}`, height: isMobile ? '280px' : '640px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Map center={center} style={{ width: '100%', height: '100%' }} level={4}>
                  <MapMarker position={center} />
                  {finalFilteredPerformances.map((perf) => {
                    if (!perf.lat || !perf.lng) return null;
                    return (
                      <MapMarker key={perf.id} position={{ lat: perf.lat, lng: perf.lng }}
                        onClick={() => { setCenter({ lat: Number(perf.lat), lng: Number(perf.lng) }); setSelectedPerf(perf); }} />
                    );
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