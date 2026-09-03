import React, { useState, useEffect, useCallback, useRef } from 'react';
import ArtistProfile from './ArtistProfile';

function PerformanceDetailModal({ 
  performance, 
  onClose, 
  isFollowed, 
  onToggleFollow, 
  onReviewSubmitted, 
  getPerformanceStatus, 
  bookmarkedIds = [], 
  onToggleBookmark,
  renderCustomHeader 
}) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [artistStats, setArtistStats] = useState(null);

  const perfId = performance?.id || performance?.performance_id || performance?.performanceId;
  const artistId = performance?.artist_id || performance?.user_id || performance?.artistId;

  // 💡 아티스트 최신 정보(평점/리뷰수/팔로워) 비동기 FETCH
  useEffect(() => {
    if (!artistId) return;
    let isMounted = true;

    const fetchArtistStats = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${artistId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setArtistStats(data);
        }
      } catch (err) {
        console.error('아티스트 통계 조회 실패:', err);
      }
    };

    fetchArtistStats();
    return () => { isMounted = false; };
  }, [artistId]);

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = currentUser?.id || currentUser?.user_id;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const rawLat = performance?.lat ?? performance?.latitude;
  const rawLng = performance?.lng ?? performance?.longitude;
  const parsedLat = parseFloat(rawLat);
  const parsedLng = parseFloat(rawLng);

  const lat = Number.isFinite(parsedLat) ? parsedLat : 37.3827;
  const lng = Number.isFinite(parsedLng) ? parsedLng : 127.1189;

  const loadKakaoMapSDK = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => resolve(window.kakao));
        return;
      }
      const existingScript = document.getElementById('kakao-map-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => resolve(window.kakao));
          } else {
            reject(new Error('카카오 지도 SDK 객체를 찾을 수 없습니다.'));
          }
        }, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('카카오 지도 SDK 로드에 실패했습니다.')), { once: true });
        return;
      }

      const kakaoAppKey = process.env.REACT_APP_KAKAO_MAP_KEY;
      if (!kakaoAppKey) {
        reject(new Error('REACT_APP_KAKAO_MAP_KEY 환경변수가 없습니다.'));
        return;
      }

      const script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`;
      script.async = true;
      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => resolve(window.kakao));
        } else {
          reject(new Error('카카오 지도 SDK가 로드되었지만 kakao.maps를 찾을 수 없습니다.'));
        }
      };
      script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'));
      document.head.appendChild(script);
    });
  }, []);

  const initializeKakaoMap = useCallback(async () => {
    if (!performance || !mapContainerRef.current) return;
    try {
      const kakao = await loadKakaoMapSDK();
      if (!kakao || !kakao.maps) return;

      const mapContainer = mapContainerRef.current;
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;

      const position = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(mapContainer, { center: position, level: 4 });
      mapInstanceRef.current = map;

      const marker = new kakao.maps.Marker({ position: position, map: map });
      markerInstanceRef.current = marker;

      const locationName = performance.location_name || '공연장';
      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;font-weight:bold;color:#333;white-space:nowrap;">${locationName}</div>`
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });

      setTimeout(() => {
        if (map) {
          map.relayout();
          map.setCenter(position);
        }
      }, 100);

      const handleResize = () => {
        if (map) {
          map.relayout();
          map.setCenter(position);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (marker) marker.setMap(null);
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      };
    } catch (error) {
      console.error('카카오 지도 생성 실패:', error);
    }
  }, [performance, lat, lng, loadKakaoMapSDK]);

  useEffect(() => {
    if (!performance) return;
    let cleanup;
    const createMap = async () => {
      cleanup = await initializeKakaoMap();
    };
    createMap();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [performance, initializeKakaoMap]);

  const fetchReviews = useCallback(async () => {
    if (!perfId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews/${perfId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        console.error('리뷰 조회 실패, 상태 코드:', response.status);
      }
    } catch (error) {
      console.error('리뷰를 불러오는 중 통신 오류 발생:', error);
    }
  }, [perfId]);

  useEffect(() => {
    if (performance) fetchReviews();
  }, [performance, fetchReviews]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      alert('리뷰 내용을 입력해주세요!');
      return;
    }
    if (!perfId) {
      alert('공연 정보 식별자(ID)가 없어 리뷰를 등록할 수 없습니다.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인 후 리뷰를 작성할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          performance_id: Number(perfId),
          rating: Number(newReview.rating),
          comment: newReview.comment
        })
      });

      if (response.ok) {
        alert('리뷰가 등록되었습니다!');
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        const errorText = await response.text();
        console.error('서버 에러 응답:', errorText);
        alert('리뷰 등록에 실패했습니다. (이미 작성했거나 오류가 발생했습니다.)');
      }
    } catch (error) {
      console.error('통신 오류 발생:', error);
      alert('서버와 통신하지 못했습니다.');
    }
  };

  if (!performance) return null;

  const perfDateStr = performance.performance_date || performance.date;
  const status = getPerformanceStatus ? getPerformanceStatus(perfDateStr, performance.start_time, performance.end_time) : { text: '예정' };
  const isEnded = status.text === '종료';

  const hasUserWrittenReview = reviews.some((rev) => rev.user_id === currentUserId || rev.userId === currentUserId);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : (performance.avg_rating ? Number(performance.avg_rating).toFixed(1) : null);

  const totalReviewCount = reviews.length > 0 ? reviews.length : (performance.review_count || 0);

  const kakaoMapLink = `https://map.kakao.com/link/map/${encodeURIComponent(performance.location_name || '공연장')},${lat},${lng}`;
  const kakaoRouteLink = `https://map.kakao.com/link/to/${encodeURIComponent(performance.location_name || '공연장')},${lat},${lng}`;

  const isBookmarked = bookmarkedIds.includes(performance.id);

  // 💡 [수정 핵심] 평점 및 리뷰 수 보장 로직 (모든 변수 필드명 전수 조사)
  const rawRatingVal = 
    artistStats?.average_rating ?? 
    artistStats?.artist_average_rating ?? 
    artistStats?.avg_rating ?? 
    performance?.artist_average_rating ?? 
    performance?.average_rating ?? 
    performance?.avg_rating;

  const rawReviewVal = 
    artistStats?.review_count ?? 
    artistStats?.artist_review_count ?? 
    artistStats?.reviews_count ?? 
    performance?.artist_review_count ?? 
    performance?.review_count ?? 
    performance?.reviews_count;

  const computedAverageRating = rawRatingVal !== undefined && rawRatingVal !== null ? Number(rawRatingVal) : 0;
  const computedReviewCount = rawReviewVal !== undefined && rawReviewVal !== null ? Number(rawReviewVal) : 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            {renderCustomHeader && performance._backToList && (
              <button
                onClick={() => {
                  const header = renderCustomHeader(onClose);
                  if (header && header.props && header.props.onClick) {
                    header.props.onClick();
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  color: '#495057',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f3f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="이전으로"
              >
                ←
              </button>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', border: 'none', fontSize: '20px', 
              cursor: 'pointer', color: '#495057', padding: '4px 8px' 
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, wordBreak: 'break-all' }}>
            {performance.title}
          </h2>

          <button
            type="button"
            onClick={(e) => {
              if (onToggleBookmark) {
                onToggleBookmark(performance.id, e);
              }
            }}
            style={{
              background: isBookmarked ? 'rgba(250,82,82,0.1)' : '#f1f3f5',
              border: `1px solid ${isBookmarked ? 'rgba(250,82,82,0.3)' : '#dee2e6'}`,
              borderRadius: '999px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 800,
              color: isBookmarked ? '#fa5252' : '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}
            title={isBookmarked ? '찜 취소' : '찜하기'}
          >
            <span>{isBookmarked ? '❤️' : '🤍'}</span>
            <span>{isBookmarked ? '찜함' : '찜'}</span>
          </button>
        </div>

        <div style={{ margin: '12px 0 20px 0' }}>
          <ArtistProfile
            artist={{
              artist_id: artistId,
              stage_name: performance.artist_nickname || performance.stage_name || performance.organizer_name,
              genre: performance.genre,
              profile_image: performance.artist_profile_image || performance.profile_image,
              introduction: performance.artist_introduction || performance.introduction || performance.bio,
              follower_count: artistStats?.follower_count ?? performance.follower_count ?? performance.followers ?? 0,
              average_rating: computedAverageRating,
              artist_average_rating: computedAverageRating,
              review_count: computedReviewCount,
              artist_review_count: computedReviewCount
            }}
            isFollowed={isFollowed}
            onToggleFollow={() => {
              if (currentUserId && artistId && Number(currentUserId) === Number(artistId)) {
                alert('본인을 팔로우할 수 없습니다.');
                return;
              }
              if (onToggleFollow) {
                onToggleFollow(artistId);
              }
            }}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={onToggleBookmark}
            hidePerformances={true}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>일시:</strong> {perfDateStr ? String(perfDateStr).split('T')[0] : '2026-08-08'} {performance.start_time?.slice(0, 5)} ~ {performance.end_time?.slice(0, 5) || '22:00'}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '6px' }}>공연 위치:</strong>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '240px', display: 'block' }} />
            <div style={{ padding: '10px 12px', fontSize: '13px', color: '#4b5563', fontWeight: 'bold', borderTop: '1px solid #e5e7eb' }}>
              📍 {performance.location_name || '상세 위치 정보 없음'}
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '0 12px 12px 12px' }}>
              <a href={kakaoMapLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#f3f4f6', color: '#374151', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                큰 지도 보기
              </a>
              <a href={kakaoRouteLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#FEE500', color: '#191919', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                길찾기
              </a>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <strong>소개:</strong>
          <p style={{ marginTop: '4px', color: '#444' }}>{performance.description || '등록된 상세 소개가 없습니다.'}</p>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', margin: 0 }}>⭐ 관람 평점 및 리뷰</h3>
          {avgRating && (
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4F46E5' }}>
              평균 {avgRating}점 ({totalReviewCount}개 리뷰)
            </span>
          )}
        </div>

        {isEnded ? (
          hasUserWrittenReview ? (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#4b5563', fontSize: '14px', marginBottom: '20px' }}>
              이미 이 공연에 대한 리뷰를 작성하셨습니다. 소중한 의견 감사합니다! ✨
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <select value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
                <option value="4">⭐⭐⭐⭐ (4점)</option>
                <option value="3">⭐⭐⭐ (3점)</option>
                <option value="2">⭐⭐ (2점)</option>
                <option value="1">⭐ (1점)</option>
              </select>
              <textarea placeholder="따뜻한 리뷰나 댓글을 남겨주세요!" value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }} />
              <button type="submit" style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                리뷰 등록
              </button>
            </form>
          )
        ) : (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            공연이 종료된 후에만 리뷰를 작성할 수 있습니다.
          </div>
        )}

        <div className="review-list">
          {reviews.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>아직 작성된 리뷰가 없습니다.</p>
          ) : (
            <div>
              {reviews.map((rev, idx) => (
                <div key={idx} style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{rev.user_name || rev.name || '익명'}</strong>
                    <span>{'⭐'.repeat(Number(rev.rating || 0))}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerformanceDetailModal;