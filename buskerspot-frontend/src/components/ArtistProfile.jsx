import React, { useState, useEffect } from 'react';

// 💡 모바일 화면 감지 커스텀 훅
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

// 🕒 날짜 및 시간 비교 헬퍼
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

// 🎨 디자인 팔레트: 잉크 블랙 + 브라스(황동) 단일 액센트
const palette = {
  ink: '#1B1B1D',
  inkSoft: '#4A4A4C',
  muted: '#8B8B8F',
  brass: '#96733A',
  brassTint: '#F5EFE3',
  surface: '#FFFFFF',
  hairline: '#E7E4DD',
  danger: '#B23B3B'
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
  const isMobile = useIsMobile(480);

  useEffect(() => {
    setImgError(false);
    const artistId = artist?.artist_id || artist?.id;
    if (!artistId || hidePerformances) return;

    const fetchArtistPerformances = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/performances?artist_id=${artistId}`);
        const data = await res.json();
        let rawList = [];
        if (data.success && Array.isArray(data.performances)) rawList = data.performances;
        else if (Array.isArray(data)) rawList = data;

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

  const rawAvg = artist?.artist_average_rating ?? artist?.average_rating;
  const reviewCount = Number(artist?.artist_review_count ?? artist?.review_count ?? 0);
  const avgRating = rawAvg && Number(rawAvg) > 0 ? Number(rawAvg).toFixed(1) : '평점 없음';

  const bioText = artist?.introduction || artist?.bio || artist?.description;
  const artistId = artist?.artist_id || artist?.id;

  const rawInsta = artist?.artist_instagram_url || artist?.instagram_url || artist?.instagram;
  const instagramUrl = rawInsta
    ? (rawInsta.startsWith('http') ? rawInsta : `https://instagram.com/${rawInsta.replace('@', '')}`)
    : null;

  let rawProfileImg = (artist?.profile_image || artist?.artist_profile_image)?.trim();
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

  const { dateStr: todayDateStr, timeStr: todayTimeStr } = getCurrentDateTime();

  const isPastPerformance = (perf) => {
    const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
    if (!perfDateStr) return false;
    if (perfDateStr < todayDateStr) return true;
    if (perfDateStr > todayDateStr) return false;
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
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.start_time || '').localeCompare(a.start_time || '');
    });

  const displayedPerfs = perfSubTab === 'upcoming' ? upcomingPerfs : pastPerfs;

  return (
    <div style={{
      background: palette.surface,
      border: `1px solid ${palette.hairline}`,
      borderRadius: '14px',
      padding: isMobile ? '24px 20px' : '36px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: "'Noto Sans KR', sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* 헤더: 아바타 + 이름 + 장르 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (profileImgSrc && !imgError && onImageClick) onImageClick(profileImgSrc);
          }}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: palette.ink,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            flexShrink: 0,
            cursor: profileImgSrc && !imgError ? 'pointer' : 'default',
            border: `1px solid ${palette.hairline}`
          }}
          title={profileImgSrc && !imgError ? '사진 확대하기' : ''}
        >
          {profileImgSrc && !imgError ? (
            <img
              src={profileImgSrc}
              alt={artist?.stage_name || artist?.nickname || '아티스트'}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : ('♪')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: palette.brass,
            letterSpacing: '0.03em',
            marginBottom: '4px'
          }}>
            {artist?.genre || 'Acoustic'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 800,
              color: palette.ink,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px'
            }}>
              {artist?.stage_name || artist?.nickname || '아티스트'}
            </h2>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.inkSoft,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${palette.hairline}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                인스타그램
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 통계: 헤어라인으로만 구분 */}
      <div style={{
        display: 'flex',
        borderTop: `1px solid ${palette.hairline}`,
        borderBottom: `1px solid ${palette.hairline}`,
        padding: '18px 0'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: palette.muted, marginBottom: '6px', fontWeight: 600 }}>평점 평균</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: palette.ink }}>
            {avgRating}
            {reviewCount > 0 && (
              <span style={{ fontSize: '12px', color: palette.muted, fontWeight: 500, marginLeft: '6px' }}>
                ({reviewCount}개 리뷰)
              </span>
            )}
          </div>
        </div>
        <div style={{ width: '1px', background: palette.hairline, margin: '0 24px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: palette.muted, marginBottom: '6px', fontWeight: 600 }}>팔로워</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: palette.ink }}>
            {artist?.follower_count ?? 0}명
          </div>
        </div>
      </div>

      {/* 소개글 */}
      {bioText && bioText.trim() !== '' && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: palette.inkSoft,
          lineHeight: '1.7',
          fontWeight: 500,
          paddingLeft: '16px',
          borderLeft: `2px solid ${palette.brass}`,
          wordBreak: 'break-word'
        }}>
          {bioText}
        </p>
      )}

      {/* 공연 일정 리스트 */}
      {!hidePerformances && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', color: palette.ink, fontWeight: 700 }}>
              공연 일정
            </h4>
            <div style={{ display: 'flex', gap: '18px' }}>
              {['upcoming', 'past'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPerfSubTab(tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: perfSubTab === tab ? `2px solid ${palette.ink}` : '2px solid transparent',
                    padding: '0 0 6px 0',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: perfSubTab === tab ? palette.ink : palette.muted,
                    cursor: 'pointer'
                  }}
                >
                  {tab === 'upcoming' ? `예정 (${upcomingPerfs.length})` : `지난 (${pastPerfs.length})`}
                </button>
              ))}
            </div>
          </div>

          {displayedPerfs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflowY: 'auto' }}>
              {displayedPerfs.map((perf, i) => {
                const perfId = perf.id;
                const isBookmarked = bookmarkedIds.includes(perfId);
                return (
                  <div
                    key={perfId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderTop: i === 0 ? 'none' : `1px solid ${palette.hairline}`
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '12px', minWidth: 0 }}>
                      <div style={{ fontSize: '11.5px', color: palette.brass, fontWeight: 700, marginBottom: '4px' }}>
                        {perf.performance_date?.slice(0, 10)} · {perf.start_time?.slice(0, 5)}–{perf.end_time?.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0', color: palette.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {perf.title}
                      </div>
                      <div style={{ fontSize: '12px', color: palette.muted, fontWeight: 500 }}>
                        {perf.location_name} · {perf.region}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleBookmark && perfId && !String(perfId).startsWith('perf-')) {
                            onToggleBookmark(perfId, e);
                          } else {
                            alert('이 공연은 고유 ID가 없어 찜할 수 없습니다.');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isBookmarked ? palette.danger : palette.muted
                        }}
                        title={isBookmarked ? '찜 취소' : '찜하기'}
                      >
                        {isBookmarked ? '♥ 찜함' : '♡ 찜'}
                      </button>
                      <button
                        onClick={() => onSelectDetail && onSelectDetail(perf)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: palette.ink,
                          borderBottom: `1px solid ${palette.ink}`
                        }}
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: palette.muted, fontWeight: 500, padding: '20px 0', textAlign: 'center' }}>
              {perfSubTab === 'upcoming' ? '예정된 공연 일정이 없습니다.' : '지난 공연 일정이 없습니다.'}
            </p>
          )}
        </div>
      )}

      {/* 팔로우 버튼 */}
      <button
        onClick={() => onToggleFollow && onToggleFollow(artistId)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: isFollowed ? `1px solid ${palette.hairline}` : 'none',
          background: isFollowed ? '#fff' : palette.ink,
          color: isFollowed ? palette.inkSoft : '#fff',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          letterSpacing: '-0.2px'
        }}
      >
        {isFollowed ? '팔로잉 중' : '팔로우하기'}
      </button>
    </div>
  );
}