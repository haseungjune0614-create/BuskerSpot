import React, { useState, useEffect } from 'react';

const getTodayDateStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  useEffect(() => {
    setImgError(false);

    const artistId = artist?.artist_id || artist?.id;
    if (!artistId || hidePerformances) return;

    const fetchArtistPerformances = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/performances?artist_id=${artistId}`);
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

  const rawProfileImg = artist.profile_image || artist.artist_profile_image;
  const profileImgSrc = rawProfileImg 
    ? (rawProfileImg.startsWith('http://') || rawProfileImg.startsWith('https://') || rawProfileImg.startsWith('blob:') 
        ? rawProfileImg 
        : `http://localhost:5000${rawProfileImg.startsWith('/') ? '' : '/'}${rawProfileImg}`) 
    : null;

  const todayStr = getTodayDateStr();
  const upcomingPerfs = artistPerformances.filter(perf => {
    const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
    return !perfDateStr || perfDateStr >= todayStr;
  });

  const pastPerfs = artistPerformances.filter(perf => {
    const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
    return perfDateStr && perfDateStr < todayStr;
  });

  const displayedPerfs = perfSubTab === 'upcoming' ? upcomingPerfs : pastPerfs;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #dee2e6',
      borderRadius: '18px',
      padding: '28px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: "'Noto Sans KR', sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', width: '100%', minWidth: 0 }}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (profileImgSrc && !imgError && onImageClick) {
                onImageClick(profileImgSrc);
              }
            }}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ff8c00 0%, #0ca678 130%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 4px 14px rgba(255,140,0,0.2)',
              flexShrink: 0,
              cursor: profileImgSrc && !imgError ? 'pointer' : 'default'
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: '#f1f3f5',
                  color: '#6c757d',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 700
                }}>
                  {artist.genre || 'Acoustic'}
                </span>
                <span style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 600 }}>
                  ID: {artistId}
                </span>
              </div>

              {/* 💡 예쁘고 세련된 인스타그램 바로가기 버튼 (우측 상단 배치) */}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 3px 10px rgba(220, 39, 67, 0.25)',
                    transition: 'transform 0.1s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '14px' }}>📸</span>
                  <span>인스타그램</span>
                </a>
              )}
            </div>

            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {artist.stage_name || artist.nickname}
            </h2>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        background: '#f1f3f5',
        padding: '16px',
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #dee2e6'
      }}>
        <div>
          <div style={{ fontSize: '11.5px', color: '#6c757d', marginBottom: '4px', fontWeight: 700 }}>⭐ 전체 평점 평균</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ff8c00' }}>
            {avgRating} <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600 }}>({reviewCount}개 리뷰)</span>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid #dee2e6' }}>
          <div style={{ fontSize: '11.5px', color: '#6c757d', marginBottom: '4px', fontWeight: 700 }}>❤️ 팔로워 수</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#212529' }}>
            {artist.follower_count ?? 0}명
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#495057', fontWeight: 800, textTransform: 'uppercase' }}>📖 아티스트 소개</h4>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#495057', lineHeight: '1.5', background: '#f8f9fa', padding: '14px', borderRadius: '12px', border: '1px solid #dee2e6', fontWeight: 500 }}>
          {bioText && bioText.trim() !== ''
            ? bioText
            : '등록된 아티스트 소개글이 없습니다.'}
        </p>
      </div>

      {!hidePerformances && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', color: '#495057', fontWeight: 800, textTransform: 'uppercase' }}>📅 아티스트 공연 일정</h4>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPerfSubTab('upcoming')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: perfSubTab === 'upcoming' ? '#ff8c00' : '#dee2e6',
                  background: perfSubTab === 'upcoming' ? '#fff9f0' : '#ffffff',
                  color: perfSubTab === 'upcoming' ? '#d97706' : '#6c757d',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                예정 ({upcomingPerfs.length})
              </button>
              <button
                onClick={() => setPerfSubTab('past')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: perfSubTab === 'past' ? '#495057' : '#dee2e6',
                  background: perfSubTab === 'past' ? '#f1f3f5' : '#ffffff',
                  color: perfSubTab === 'past' ? '#212529' : '#6c757d',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                지난 ({pastPerfs.length})
              </button>
            </div>
          </div>

          {displayedPerfs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto', paddingRight: '2px' }}>
              {displayedPerfs.map((perf) => {
                const perfId = perf.id;
                const isBookmarked = bookmarkedIds.includes(perfId);

                return (
                  <div key={perfId} style={{ background: '#f8f9fa', padding: '14px', borderRadius: '12px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, paddingRight: '10px', minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#ff8c00', fontWeight: 800, marginBottom: '2px' }}>
                        {perf.performance_date?.slice(0, 10)} | {perf.start_time?.slice(0, 5)} ~ {perf.end_time?.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, margin: '2px 0', color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.title}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600 }}>📍 {perf.location_name} ({perf.region})</div>
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
                          background: isBookmarked ? 'rgba(250,82,82,0.1)' : '#ffffff',
                          border: isBookmarked ? '1px solid rgba(250,82,82,0.3)' : '1px solid #dee2e6',
                          borderRadius: '999px',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: isBookmarked ? '#fa5252' : '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
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
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(255,140,0,0.2)'
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
            <p style={{ margin: 0, fontSize: '13px', color: '#6c757d', fontWeight: 600, background: '#f8f9fa', padding: '14px', borderRadius: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
              {perfSubTab === 'upcoming' ? '예정된 공연 일정이 없습니다.' : '지난 공연 일정이 없습니다.'}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (onToggleFollow) {
            onToggleFollow(artistId);
          }
        }}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: 'none',
          background: isFollowed ? '#f1f3f5' : '#ff8c00',
          color: isFollowed ? '#495057' : '#fff',
          fontWeight: 800,
          fontSize: '13.5px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isFollowed ? 'none' : '0 4px 14px rgba(255,140,0,0.25)'
        }}
      >
        {isFollowed ? '✓ 팔로잉 중' : '❤️ 팔로우하기'}
      </button>
    </div>
  );
}