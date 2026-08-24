import React, { useState, useEffect } from 'react';

// 💡 화면 폭이 좁을 때(모바일) 반응형 처리를 위한 커스텀 훅
const useIsMobile = (breakpoint = 480) => {
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

// ==========================================
// 🕒 정확한 날짜 및 시간 비교를 위한 헬퍼 함수
// ==========================================
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hours}:${minutes}`
  };
};

export default function ArtistProfile({ 
  artist, 
  isFollowed, 
  onToggleFollow, 
  bookmarkedIds = [], 
  onToggleBookmark,
  onSelectDetail,
  hidePerformances = false,
  onImageClick
}) {
  const [imgError, setImgError] = useState(false);
  const [artistPerformances, setArtistPerformances] = useState([]);
  const [perfSubTab, setPerfSubTab] = useState('upcoming');
  const isMobile = useIsMobile(480); // 💡 모바일 감지 훅 적용

  useEffect(() => {
    setImgError(false);

    const artistId = artist?.artist_id || artist?.id;
    if (!artistId || hidePerformances) return;

    const fetchArtistPerformances = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/performances?artist_id=${artistId}`);
        const data = await res.json();
        
        let rawList = [];
        if (data.success && Array.isArray(data.performances)) {
          rawList = data.performances;
        } else if (Array.isArray(data)) {
          rawList = data;
        }

        const filtered = rawList
          .filter(p => String(p.artist_id || p.user_id || p.artistId) === String(artistId))
          .map((p, index) => ({
            ...p,
            id: p.id || p.performance_id || p.performanceId || `perf-${index}`
          }));

        setArtistPerformances(filtered);
      } catch (err) {
        console.error('아티스트 공연 목록 조회 실패:', err);
      }
    };

    fetchArtistPerformances();
  }, [artist, hidePerformances]);

  const rawAvg = artist.artist_average_rating ?? artist.average_rating;
  const reviewCount = Number(artist.artist_review_count ?? artist.review_count ?? 0);
  const avgRating = rawAvg && Number(rawAvg) > 0
    ? Number(rawAvg).toFixed(1)
    : '평점 없음';

  const bioText = artist.introduction || artist.bio || artist.description;
  const artistId = artist.artist_id || artist.id;
  
  // 💡 인스타그램 URL 추출
  const rawInsta = artist.artist_instagram_url || artist.instagram_url || artist.instagram;
  const instagramUrl = rawInsta 
    ? (rawInsta.startsWith('http') ? rawInsta : `https://instagram.com/${rawInsta.replace('@', '')}`) 
    : null;

  // 💡 앞뒤 공백 제거(.trim())를 추가하여 이중 URL 생성 원천 차단
  let rawProfileImg = (artist.profile_image || artist.artist_profile_image)?.trim();

  if (rawProfileImg) {
    const httpMatches = [...rawProfileImg.matchAll(/https?:\/\//g)];
    if (httpMatches.length > 1) {
      const lastIndex = httpMatches[httpMatches.length - 1].index;
      rawProfileImg = rawProfileImg.slice(lastIndex).trim();
    }
  }

  const profileImgSrc = rawProfileImg 
    ? (rawProfileImg.startsWith('http://') || rawProfileImg.startsWith('https://') || rawProfileImg.startsWith('blob:') 
        ? rawProfileImg 
        : `${process.env.REACT_APP_API_URL}${rawProfileImg.startsWith('/') ? '' : '/'}${rawProfileImg}`) 
    : null;

  // 💡 현재 날짜 및 시간 기준 지난 공연 / 다가오는 공연 정밀 분류 및 시간순 정렬
  const { dateStr: todayDateStr, timeStr: todayTimeStr } = getCurrentDateTime();

  const isPastPerformance = (perf) => {
    const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
    if (!perfDateStr) return false;

    if (perfDateStr < todayDateStr) return true;
    if (perfDateStr > todayDateStr) return false;

    // 오늘 날짜인 경우 종료 시간(end_time) 비교 (없으면 시작 시간 기준)
    const endTime = perf.end_time ? perf.end_time.slice(0, 5) : (perf.start_time ? perf.start_time.slice(0, 5) : '23:59');
    return endTime < todayTimeStr;
  };

  const upcomingPerfs = artistPerformances
    .filter(perf => !isPastPerformance(perf))
    .sort((a, b) => {
      const dateA = (a.performance_date || a.date || '').split('T')[0];
      const dateB = (b.performance_date || b.date || '').split('T')[0];
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

  const pastPerfs = artistPerformances
    .filter(perf => isPastPerformance(perf))
    .sort((a, b) => {
      const dateA = (a.performance_date || a.date || '').split('T')[0];
      const dateB = (b.performance_date || b.date || '').split('T')[0];
      if (dateA !== dateB) return dateB.localeCompare(dateA); // 지난 공연은 최신순(역순)
      return (b.start_time || '').localeCompare(a.start_time || '');
    });

  const displayedPerfs = perfSubTab === 'upcoming' ? upcomingPerfs : pastPerfs;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #eaecef',
      borderRadius: '24px',
      padding: isMobile ? '20px' : '32px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: "'Noto Sans KR', sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* 상단 프로필 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', minWidth: 0 }}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (profileImgSrc && !imgError && onImageClick) {
                onImageClick(profileImgSrc);
              }
            }}
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ff8c00 0%, #ff5e62 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              boxShadow: '0 6px 16px rgba(255,140,0,0.25)',
              flexShrink: 0,
              cursor: profileImgSrc && !imgError ? 'pointer' : 'default',
              border: '3px solid #fff'
            }}
            title={profileImgSrc && !imgError ? "사진 확대하기" : ""}
          >
            {profileImgSrc && !imgError ? (
              <img
                src={profileImgSrc}
                alt={artist.stage_name || artist.nickname}
                onError={() => setImgError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
              />
            ) : (
              '🎤'
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                background: '#fff3e0',
                color: '#e65100',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '-0.3px'
              }}>
                {artist.genre || 'Acoustic'}
              </span>

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 3px 10px rgba(220, 39, 67, 0.2)',
                    transition: 'transform 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ fontSize: '13px' }}>📸</span>
                  <span>인스타그램</span>
                </a>
              )}
            </div>

            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.5px' }}>
              {artist.stage_name || artist.nickname}
            </h2>
          </div>
        </div>
      </div>

      {/* 통계 요약 박스 (평점 & 팔로워) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        background: '#f8f9fa',
        padding: isMobile ? '14px' : '18px',
        borderRadius: '16px',
        textAlign: 'center',
        border: '1px solid #edf2f7'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: 700 }}>⭐ 전체 평점 평균</div>
          <div style={{ fontSize: isMobile ? '0.9rem' : '1.15rem', fontWeight: 900, color: '#dd6b20', whiteSpace: 'nowrap' }}>
            {avgRating} <span style={{ fontSize: isMobile = '11px' ? '11px' : '12px', color: '#a0aec0', fontWeight: 600 }}>({reviewCount}개 리뷰)</span>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: 700 }}>❤️ 팔로워 수</div>
          <div style={{ fontSize: isMobile ? '0.9rem' : '1.15rem', fontWeight: 900, color: '#1a202c' }}>
            {artist.follower_count ?? 0}명
          </div>
        </div>
      </div>

      {/* 아티스트 소개 박스 */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: '#4a5568', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📖 아티스트 소개</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#2d3748', lineHeight: '1.6', background: '#fafbfc', padding: '16px', borderRadius: '14px', border: '1px solid #edf2f7', fontWeight: 500, wordBreak: 'break-all' }}>
          {bioText && bioText.trim() !== ''
            ? bioText
            : '등록된 아티스트 소개글이 없습니다.'}
        </p>
      </div>

      {/* 아티스트 공연 일정 섹션 */}
      {!hidePerformances && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '12.5px', color: '#4a5568', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              📅 아티스트 공연 일정
            </h4>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPerfSubTab('upcoming')}
                style={{
                  padding: isMobile ? '5px 10px' : '6px 12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: perfSubTab === 'upcoming' ? '#dd6b20' : '#e2e8f0',
                  background: perfSubTab === 'upcoming' ? '#fffaf0' : '#ffffff',
                  color: perfSubTab === 'upcoming' ? '#dd6b20' : '#718096',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                예정 ({upcomingPerfs.length})
              </button>
              <button
                onClick={() => setPerfSubTab('past')}
                style={{
                  padding: isMobile ? '5px 10px' : '6px 12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: perfSubTab === 'past' ? '#4a5568' : '#e2e8f0',
                  background: perfSubTab === 'past' ? '#f7fafc' : '#ffffff',
                  color: perfSubTab === 'past' ? '#2d3748' : '#718096',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                지난 ({pastPerfs.length})
              </button>
            </div>
          </div>

          {displayedPerfs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
              {displayedPerfs.map((perf) => {
                const perfId = perf.id;
                const isBookmarked = bookmarkedIds.includes(perfId);

                return (
                  <div key={perfId} style={{ background: '#fafbfc', padding: '14px 16px', borderRadius: '14px', border: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, paddingRight: '12px', minWidth: 0 }}>
                      <div style={{ fontSize: '11.5px', color: '#dd6b20', fontWeight: 800, marginBottom: '3px' }}>
                        {perf.performance_date?.slice(0, 10)} | {perf.start_time?.slice(0, 5)} ~ {perf.end_time?.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, margin: '2px 0', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.title}</div>
                      <div style={{ fontSize: '12px', color: '#718096', fontWeight: 600 }}>📍 {perf.location_name} ({perf.region})</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleBookmark && perfId && !String(perfId).startsWith('perf-')) {
                            onToggleBookmark(perfId, e);
                          } else {
                            console.error('공연 찜하기 실패: 유효한 공연 ID가 없습니다.', perf);
                            alert('이 공연은 고유 ID가 없어 찜할 수 없습니다. 데이터베이스 조회를 확인해 주세요.');
                          }
                        }}
                        style={{
                          background: isBookmarked ? 'rgba(245,101,101,0.1)' : '#ffffff',
                          border: isBookmarked ? '1px solid rgba(245,101,101,0.3)' : '1px solid #e2e8f0',
                          borderRadius: '999px',
                          padding: '5px 12px',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: isBookmarked ? '#e53e3e' : '#718096',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title={isBookmarked ? '찜 취소' : '찜하기'}
                      >
                        <span>{isBookmarked ? '❤️' : '🤍'}</span>
                        <span>찜</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSelectDetail) {
                            onSelectDetail(perf);
                          }
                        }}
                        style={{
                          background: '#ff8c00',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '5px 12px',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(255,140,0,0.25)',
                          transition: 'all 0.15s ease'
                        }}
                        title="상세보기"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: '#a0aec0', fontWeight: 600, background: '#fafbfc', padding: '16px', borderRadius: '14px', border: '1px solid #edf2f7', textAlign: 'center' }}>
              {perfSubTab === 'upcoming' ? '예정된 공연 일정이 없습니다.' : '지난 공연 일정이 없습니다.'}
            </p>
          )}
        </div>
      )}

      {/* 팔로우 토글 버튼 */}
      <button
        onClick={() => {
          if (onToggleFollow) {
            onToggleFollow(artistId);
          }
        }}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '14px',
          border: 'none',
          background: isFollowed ? '#edf2f7' : 'linear-gradient(135deg, #ff8c00 0%, #ff5e62 100%)',
          color: isFollowed ? '#4a5568' : '#fff',
          fontWeight: 800,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isFollowed ? 'none' : '0 6px 16px rgba(255,140,0,0.3)',
          letterSpacing: '-0.3px'
        }}
        onMouseEnter={(e) => {
          if (!isFollowed) e.currentTarget.style.opacity = '0.95';
        }}
        onMouseLeave={(e) => {
          if (!isFollowed) e.currentTarget.style.opacity = '1';
        }}
      >
        {isFollowed ? '✓ 팔로잉 중' : '❤️ 팔로우하기'}
      </button>
    </div>
  );
}