import React, { useState, useEffect, useCallback } from 'react';
import PerformanceSearch from './components/PerformanceSearch';
import ArtistProfile from './components/ArtistProfile';
import AIRecommendation from './components/ai_recommendation';
import AdminPage from './components/AdminPage';
import MyPage from './components/MyPage';
import PerformanceModal from './components/PerformanceDetailModal';
import AuthModal from './components/AuthModal';
import RegisterPerformanceModal from './components/RegisterPerformanceModal';
import Navbar from './components/Navbar';
import NotificationsPage from './components/NotificationsPage'; // 💡 분리된 알림 페이지 컴포넌트 임포트


// 💡 환경변수 문제 원천 차단: Render 배포 주소로 직접 고정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://buskerspot.onrender.com';

// 이미지 URL 처리 헬퍼 함수
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// 오늘 날짜 문자열 반환 헬퍼 함수
const getTodayDateStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 공연 상태 판별 헬퍼 함수
const getPerformanceStatus = (dateStr, startTime, endTime) => {
  if (!dateStr || !startTime) return { text: '예정', color: '#0ca678', class: 'upcoming' };

  const now = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [sHour, sMin] = startTime.split(':').map(Number);
  
  const startObj = new Date(year, month - 1, day, sHour, sMin);
  let endObj = null;

  if (endTime) {
    const [eHour, eMin] = endTime.split(':').map(Number);
    endObj = new Date(year, month - 1, day, eHour, eMin);
    if (endObj <= startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }
  } else {
    endObj = new Date(startObj.getTime() + 2 * 60 * 60 * 1000);
  }

  if (now >= startObj && now <= endObj) {
    return { text: 'LIVE', color: '#fa5252', class: 'live' };
  } else if (now > endObj) {
    return { text: '종료', color: '#868e96', class: 'ended' };
  } else {
    return { text: '예정', color: '#0ca678', class: 'upcoming' };
  }
};

// 화면 폭을 감지해서 모바일 레이아웃 여부를 반환하는 커스텀 훅
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

// 이미지 확대용 모달 컴포넌트
function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, cursor: 'pointer', padding: '20px'
      }}
    >
      <img 
        src={imageUrl} 
        alt="확대된 프로필 사진" 
        style={{ 
          maxWidth: '90%', maxHeight: '90%', 
          borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          objectFit: 'contain'
        }}
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
}

// 상단 검색 결과 아티스트 프로필 전용 모달 컴포넌트
function ArtistProfileModal({ artist, onClose, isFollowed, onToggleFollow, bookmarkedIds, onToggleBookmark, onSelectDetail, onImageClick, renderCustomHeader }) {
  if (!artist) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px', boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            {renderCustomHeader && artist._backToList && (
              <button
                onClick={() => {
                  const header = renderCustomHeader(onClose);
                  if (header && header.props && header.props.onClick) {
                    header.props.onClick();
                  }
                }}
                style={{
                  background: 'none', border: 'none', fontSize: '22px',
                  fontWeight: 800, cursor: 'pointer', color: '#495057',
                  padding: '4px 8px', display: 'flex', alignItems: 'center', borderRadius: '8px'
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

        <ArtistProfile
          artist={artist}
          isFollowed={isFollowed}
          onToggleFollow={onToggleFollow}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={onToggleBookmark}
          onSelectDetail={onSelectDetail}
          onImageClick={onImageClick}
        />
      </div>
    </div>
  );
}

// 검색된 아티스트 및 공연 통합 리스트 나열 모달 컴포넌트
function PerformanceListModal({ performances, onClose, onSelectItem, getImageUrl }) {
  const safePerformances = Array.isArray(performances) ? performances : [];
  if (safePerformances.length === 0) return null;

  const todayStr = getTodayDateStr();

  const validItems = safePerformances.filter((item) => {
    const isArtistItem = item.isArtist || (!item.title && (item.artist_id || item.user_id || item.stage_name));
    if (isArtistItem) return true;
    const perfDateStr = (item.performance_date || item.date)?.split('T')[0];
    return !perfDateStr || perfDateStr >= todayStr;
  });

  const getGenreBadgeColor = (genre) => {
    const g = (genre || '').toLowerCase();
    if (g.includes('hiphop') || g.includes('힙합')) return { bg: '#eef2ff', color: '#4f46e5' };
    if (g.includes('acoustic') || g.includes('어쿠스틱')) return { bg: '#ecfdf5', color: '#059669' };
    if (g.includes('indie') || g.includes('인디')) return { bg: '#fff7ed', color: '#c2410c' };
    return { bg: '#f1f3f5', color: '#495057' };
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px', boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#212529', margin: 0 }}>
            🔍 검색된 결과 목록 ({validItems.length}개)
          </h3>
          <button
            onClick={onClose}
            style={{
              background: '#f1f3f5', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', fontSize: '14px', fontWeight: 800,
              cursor: 'pointer', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {validItems.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6c757d', fontSize: '0.95rem' }}>
            검색된 유효한 항목이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {validItems.map((item, idx) => {
              const isArtistItem = item.isArtist || (!item.title && (item.artist_id || item.user_id || item.stage_name));
              const badgeStyle = getGenreBadgeColor(item.genre);
              const perfDateStr = (item.performance_date || item.date)?.split('T')[0];
              const rawProfileImg = item.profile_image || item.artist_profile_image;
              const profileImg = getImageUrl ? getImageUrl(rawProfileImg) : rawProfileImg;

              return (
                <div
                  key={item.id || item.artist_id || `search-item-${idx}`}
                  onClick={() => onSelectItem(item)}
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%', background: '#fff',
                      border: '1px solid #ced4da', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden', color: '#495057', fontSize: '16px'
                    }}>
                      {isArtistItem && profileImg ? (
                        <img src={profileImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{isArtistItem ? '🎤' : '🔍'}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#212529', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isArtistItem ? (item.stage_name || item.organizer_name) : item.title}
                      </h4>
                      <p style={{ fontSize: '12.5px', color: '#6c757d', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isArtistItem ? `👤 아티스트 프로필` : `📍 [${item.region || '지역'}] ${item.location_name || item.address || ''} (${perfDateStr || ''})`}
                      </p>
                    </div>
                  </div>

                  <span style={{
                    backgroundColor: badgeStyle.bg, color: badgeStyle.color,
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12px',
                    fontWeight: 700, flexShrink: 0, marginLeft: '12px'
                  }}>
                    {item.genre || 'ALL'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('buskerspot_active_tab') || 'search';
  });

  const isMobile = useIsMobile(768);

  const [bookmarkSubTab, setBookmarkSubTab] = useState('upcoming');
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    localStorage.setItem('buskerspot_active_tab', activeTab);
  }, [activeTab]);

  const [performances, setPerformances] = useState([]);
  const [filteredPerformances, setFilteredPerformances] = useState([]);
  const [followingPerformances, setFollowingPerformances] = useState([]);
  const [followedArtistIds, setFollowedArtistIds] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  
  const [center, setCenter] = useState({ lat: 37.3827, lng: 127.1189 });
  const [selectedPerf, setSelectedPerf] = useState(null);
  const [detailModalPerf, setDetailModalPerf] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  const [headerSearchKeyword, setHeaderSearchKeyword] = useState('');
  const [searchedArtistModalData, setSearchedArtistModalData] = useState(null);
  const [searchedPerformanceList, setSearchedPerformanceList] = useState([]);
  const [openSearchPageRef, setOpenSearchPageRef] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) { setUnreadCount(0); return; }
    const token = localStorage.getItem('token') || currentUser?.token;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setUnreadCount(data.notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('안 읽은 알림 개수 조회 실패:', err);
    }
  }, [currentUser]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [pendingKakaoData, setPendingKakaoData] = useState(null);
  const [pendingGoogleData, setPendingGoogleData] = useState(null);

  const handleTabChange = useCallback((newTab) => {
    const protectedTabs = ['following', 'bookmarks', 'mypage', 'notifications'];
    if (protectedTabs.includes(newTab) && !currentUser) {
      alert('로그인이 필요한 기능입니다.');
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(newTab);
  }, [currentUser]);

  const [inputDate, setInputDate] = useState(getTodayDateStr());
  const [inputRegion, setInputRegion] = useState('전체');
  const [inputGenre, setInputGenre] = useState('전체');
  const [inputSort, setInputSort] = useState('time');

  // 1. 공연 목록 조회
  const fetchPerformances = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        date: inputDate,
        region: inputRegion,
        genre: inputGenre === '전체' ? 'ALL' : inputGenre,
        sort: inputSort,
        lat: center.lat,
        lng: center.lng
      });

      const response = await fetch(`${API_BASE_URL}/api/performances?${queryParams.toString()}`);
      if (!response.ok) throw new Error('공연 데이터 불러오기 실패');
      
      const data = await response.json();
      const safeData = Array.isArray(data) ? data : (data.performances || []);
      setPerformances(safeData);
      setFilteredPerformances(safeData);
    } catch (error) {
      console.error('App.js: 공연 목록 가져오기 실패:', error);
      setPerformances([]);
      setFilteredPerformances([]);
    }
  }, [inputDate, inputRegion, inputGenre, inputSort, center.lat, center.lng]);

  // 2. 유저 팔로우/북마크 정보 및 팔로잉 공연 조회
  const fetchUserData = useCallback(async () => {
    if (!currentUser) {
      setFollowedArtistIds([]);
      setFollowedArtists([]);
      setFollowingPerformances([]);
      setBookmarkedIds([]);
      return;
    }

    try {
      const token = currentUser.token || localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const followRes = await fetch(`${API_BASE_URL}/api/follows/my-follows`, { headers });
      if (followRes.ok) {
        const followData = await followRes.json();
        if (followData.success) {
          const ids = followData.follows.map((item) => item.artist_id);
          setFollowedArtistIds(ids);
          const mappedArtists = followData.follows.map((follow) => ({
            ...follow,
            stage_name: follow.stage_name || follow.nickname || `아티스트 (ID: ${follow.artist_id})`,
            genre: follow.genre || 'ALL'
          }));
          setFollowedArtists(mappedArtists);
        }
      }

      const followPerfRes = await fetch(`${API_BASE_URL}/api/follows/following-performances`, { headers });
      if (followPerfRes.ok) {
        const followPerfData = await followPerfRes.json();
        if (followPerfData.success && Array.isArray(followPerfData.performances)) {
          const mapped = followPerfData.performances.map((perf) => ({
            ...perf,
            date: perf.performance_date ? String(perf.performance_date).slice(0, 10) : ''
          }));
          setFollowingPerformances(mapped);
          
          setPerformances((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const combined = [...safePrev];
            mapped.forEach((perf) => {
              if (!combined.some((item) => item.id === perf.id)) {
                combined.push(perf);
              }
            });
            return combined;
          });
        }
      }

      const bookmarkRes = await fetch(`${API_BASE_URL}/api/performances/my-bookmarks`, { headers });
      if (bookmarkRes.ok) {
        const bookmarkData = await bookmarkRes.json();
        if (bookmarkData.success && Array.isArray(bookmarkData.performances)) {
          setBookmarkedIds(bookmarkData.performances.map((p) => p.id));
        }
      }
    } catch (error) {
      console.error('App.js: 유저 정보 가져오기 실패:', error);
    }
  }, [currentUser]);

  const handleDataRefresh = useCallback(() => {
    fetchPerformances();
    fetchUserData();
  }, [fetchPerformances, fetchUserData]);

  // 카카오 콜백 처리
  useEffect(() => {
    const handleKakaoRedirect = async () => {
      if (window.location.pathname !== '/oauth/kakao/callback') return;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) return;

      const alreadyProcessedCode = sessionStorage.getItem('kakao_processed_code');
      if (alreadyProcessedCode === code) {
        window.history.replaceState({}, document.title, '/');
        return;
      }
      sessionStorage.setItem('kakao_processed_code', code);

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/kakao/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (data.success) {
          if (data.existingUser) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            handleDataRefresh();
            alert(`${data.user.nickname}님, 환영합니다!`);
          } else {
            setPendingKakaoData(data.kakaoData);
            setIsAuthModalOpen(true);
          }
        } else {
          alert(data.message || '카카오 인증에 실패했습니다.');
        }
      } catch (err) {
        console.error('카카오 콜백 처리 오류:', err);
        alert('카카오 인증 처리 중 오류가 발생했습니다.');
      }

      window.history.replaceState({}, document.title, '/');
    };

    handleKakaoRedirect();
  }, [handleDataRefresh]);

  // 구글 콜백 처리
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      if (window.location.pathname !== '/oauth/google/callback') return;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) return;

      const alreadyProcessedCode = sessionStorage.getItem('google_processed_code');
      if (alreadyProcessedCode === code) {
        window.history.replaceState({}, document.title, '/');
        return;
      }
      sessionStorage.setItem('google_processed_code', code);

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (data.success) {
          if (data.existingUser) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            handleDataRefresh();
            alert(`${data.user.nickname}님, 환영합니다!`);
          } else {
            setPendingGoogleData(data.googleData);
            setIsAuthModalOpen(true);
          }
        } else {
          alert(data.message || '구글 인증에 실패했습니다.');
        }
      } catch (err) {
        console.error('구글 콜백 처리 오류:', err);
        alert('구글 인증 처리 중 오류가 발생했습니다.');
      }

      window.history.replaceState({}, document.title, '/');
    };

    handleGoogleRedirect();
  }, [handleDataRefresh]);

  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSearch = useCallback(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  // 팔로우 토글
  const handleToggleFollow = useCallback(async (artistId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const token = currentUser.token || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/follows/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ artist_id: artistId })
      });

      if (response.ok) {
        fetchUserData();
      }
    } catch (error) {
      console.error('팔로우 토글 실패:', error);
    }
  }, [currentUser, fetchUserData]);

  // 북마크 토글
  const handleToggleBookmark = useCallback(async (performanceId, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token') || currentUser?.token;
    if (!token) {
      alert('로그인이 필요한 기능입니다.');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/performances/${performanceId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (data.isBookmarked) {
          setBookmarkedIds((prev) => [...(Array.isArray(prev) ? prev : []), performanceId]);
        } else {
          setBookmarkedIds((prev) => (Array.isArray(prev) ? prev : []).filter((id) => id !== performanceId));
        }
        handleDataRefresh();
      } else {
        alert(data.message || '찜 처리에 실패했습니다.');
      }
    } catch (err) {
      console.error('찜하기 요청 오류:', err);
    }
  }, [currentUser, handleDataRefresh]);

  const handleNavbarSearchSubmit = useCallback(async (keyword) => {
    const trimmedKey = keyword.trim();
    if (!trimmedKey) return;

    let searchKey = trimmedKey.toLowerCase();

    if (searchKey === '힙합' || searchKey === '랩') {
      searchKey = 'hiphop';
    } else if (searchKey === '어쿠스틱' || searchKey === '통기타') {
      searchKey = 'acoustic';
    } else if (searchKey === '인디') {
      searchKey = 'indie';
    }

    let matchedPerfs = [];

    try {
      const res = await fetch(`${API_BASE_URL}/api/performances?keyword=${encodeURIComponent(trimmedKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.performances) {
          matchedPerfs = data.performances;
        } else if (Array.isArray(data)) {
          matchedPerfs = data;
        }
      }
    } catch (err) {
      console.warn('검색 API 호출 실패, 로컬 데이터로 대체합니다.');
    }

    // 💡 아티스트 이름 직접 검색
    let apiArtists = [];
    try {
      const artistRes = await fetch(`${API_BASE_URL}/api/users/search-artist?keyword=${encodeURIComponent(trimmedKey)}`);
      if (artistRes.ok) {
        const artistData = await artistRes.json();
        if (artistData.success && Array.isArray(artistData.artists)) {
          apiArtists = artistData.artists.map((u) => ({
            artist_id: u.id,
            stage_name: u.bandName || u.nickname,
            genre: u.genre || 'ALL',
            profile_image: u.profileImage,
            introduction: u.introduction,
            follower_count: u.followerCount ?? 0,
            average_rating: u.averageRating ?? 0,
            review_count: u.reviewCount ?? 0,
            isArtist: true
          }));
        }
      }
    } catch (err) {
      console.warn('아티스트 검색 API 호출 실패:', err);
    }

    const filterByKeyword = (p) => {
      const targetStr = [
        p.title,
        p.region,
        p.location_name,
        p.genre,
        p.stage_name,
        p.organizer_name,
        p.description
      ].join(' ').toLowerCase();
      return targetStr.includes(searchKey) || targetStr.includes(trimmedKey.toLowerCase());
    };

    const safePerformances = Array.isArray(performances) ? performances : [];
    const localMatchedPerfs = safePerformances.filter(filterByKeyword);
    const apiMatchedPerfs = matchedPerfs.filter(filterByKeyword);

    const allPerfsMap = new Map();
    [...apiMatchedPerfs, ...localMatchedPerfs].forEach(p => allPerfsMap.set(p.id, p));
    const finalPerfs = Array.from(allPerfsMap.values());

    const artistMap = new Map();
    apiArtists.forEach((a) => artistMap.set(a.artist_id, a));

    safePerformances.forEach(p => {
      const name = p.artist_nickname || p.stage_name || p.organizer_name || '';
      const genre = p.genre || '';

      const isMatch = name.toLowerCase().includes(searchKey) ||
                    name.toLowerCase().includes(trimmedKey.toLowerCase()) ||
                    genre.toLowerCase().includes(searchKey);

      if (isMatch && (p.artist_id || p.user_id)) {
        const aId = p.artist_id || p.user_id;
        if (!artistMap.has(aId)) {
          artistMap.set(aId, {
            artist_id: aId,
            stage_name: name,
            genre: genre,
            profile_image: p.artist_profile_image || p.profile_image,
            introduction: p.artist_introduction || p.introduction,
            follower_count: p.follower_count || 0,
            average_rating: p.average_rating || p.avg_rating || 0,
            review_count: p.review_count || 0,
            isArtist: true
          });
        }
      }
    });
    const matchedArtists = Array.from(artistMap.values());

    const combinedResults = [...matchedArtists, ...finalPerfs];

    if (combinedResults.length > 0) {
      setSearchedPerformanceList(combinedResults);
    } else {
      alert('일치하는 검색 결과가 없습니다.');
    }
  }, [performances]);

  const handleOpenRegisterModal = useCallback(() => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsRegisterModalOpen(true);
  }, [currentUser]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setFollowedArtistIds([]);
    setFollowedArtists([]);
    setFollowingPerformances([]);
    setBookmarkedIds([]);
    setActiveTab('search');
    alert('로그아웃되었습니다.');
  }, []);

  const handleImageClick = useCallback((imgUrl) => {
    const fullUrl = getImageUrl(imgUrl);
    if (fullUrl) {
      setExpandedImage(fullUrl);
    }
  }, []);

  const handleRegisterSearchOpenRef = useCallback((openFunc) => {
    setOpenSearchPageRef(() => openFunc);
  }, []);

  return (
    <div className="buskerspot-app" style={{ minHeight: '100vh', background: '#f8f9fa', width: '100%', boxSizing: 'border-box', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenRegisterModal={handleOpenRegisterModal}
        onLogout={handleLogout}
        searchKeyword={headerSearchKeyword}
        setSearchKeyword={setHeaderSearchKeyword}
        onSearch={handleNavbarSearchSubmit}
        onRegisterSearchOpen={handleRegisterSearchOpenRef}
        unreadCount={unreadCount}
      />

      {activeTab === 'search' && (
        <PerformanceSearch
          inputDate={inputDate}
          setInputDate={setInputDate}
          inputRegion={inputRegion}
          setInputRegion={setInputRegion}
          inputGenre={inputGenre}
          setInputGenre={setInputGenre}
          inputSort={inputSort}
          setInputSort={setInputSort}
          handleSearch={handleSearch}
          filteredPerformances={filteredPerformances}
          isMapVisible={isMapVisible}
          setIsMapVisible={setIsMapVisible}
          selectedPerf={selectedPerf}
          setSelectedPerf={setSelectedPerf}
          center={center}
          setCenter={setCenter}
          getPerformanceStatus={(date, start, end) => getPerformanceStatus(date, start, end)}
          followedArtistIds={followedArtistIds}
          handleToggleFollow={handleToggleFollow}
          setDetailModalPerf={setDetailModalPerf}
          bookmarkedIds={bookmarkedIds}
          handleToggleBookmark={handleToggleBookmark}
          setSelectedArtistProfile={setSelectedArtistProfile}
          setActiveTab={setActiveTab}
          onImageClick={handleImageClick}
        />
      )}

      {/* 💡 분리된 NotificationsPage 컴포넌트 연결 */}
      {activeTab === 'notifications' && (
        <NotificationsPage
          currentUser={currentUser}
          performances={performances}
          setDetailModalPerf={setDetailModalPerf}
          setSelectedArtistProfile={setSelectedArtistProfile}
        />
      )}

      {activeTab === 'bookmarks' && (() => {
        const todayStr = getTodayDateStr();
        const safePerformances = Array.isArray(performances) ? performances : [];
        const bookmarkedList = safePerformances.filter((perf) => bookmarkedIds.includes(perf.id));
        
        const upcomingBookmarks = bookmarkedList.filter(perf => {
          const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
          return !perfDateStr || perfDateStr >= todayStr;
        });

        const pastBookmarks = bookmarkedList.filter(perf => {
          const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
          return perfDateStr && perfDateStr < todayStr;
        });

        const renderBookmarkCard = (perf, isPast = false) => {
          const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
          const status = getPerformanceStatus(perfDateStr, perf.start_time, perf.end_time);
          const rawProfileImg = perf.artist_profile_image || perf.profile_image;
          const profileImg = getImageUrl(rawProfileImg);

          return (
            <div
              key={`bookmark-card-${perf.id}`}
              style={{
                background: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '16px',
                padding: '18px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                opacity: isPast ? 0.75 : 1,
                transition: 'all 0.18s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '14px', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? '1.05rem' : '1.3rem', color: '#212529', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                      {perf.start_time?.slice(0, 5)} ~ {perf.end_time?.slice(0, 5)}
                    </span>
                    <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap', background: isPast ? '#f1f3f5' : (status.text === 'LIVE' ? 'rgba(250,82,82,0.1)' : 'rgba(12,166,120,0.1)'), color: isPast ? '#6c757d' : (status.text === 'LIVE' ? '#fa5252' : '#0ca678') }}>
                      {isPast ? '종료됨' : status.text}
                    </span>
                    <span style={{ fontSize: '11px', background: '#f1f3f5', padding: '3px 9px', borderRadius: '999px', color: '#6c757d', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {perf.genre}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleToggleBookmark(perf.id, e)}
                    style={{
                      background: 'rgba(250,82,82,0.1)',
                      border: '1px solid rgba(250,82,82,0.3)',
                      borderRadius: '999px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#fa5252',
                      flexShrink: 0
                    }}
                    title="찜 취소"
                  >
                    <span>❤️</span>
                    <span>찜</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (profileImg) handleImageClick(profileImg);
                    }}
                    style={{ 
                      width: '52px', height: '52px', borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #ff8c00 0%, #0ca678 130%)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 14px rgba(255,140,0,0.2)',
                      cursor: profileImg ? 'pointer' : 'default' 
                    }}
                    title={profileImg ? "사진 확대하기" : ""}
                  >
                    {profileImg ? (
                      <img src={profileImg} alt={perf.stage_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontSize: '22px' }}>🎤</span>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '1.02rem', margin: '0 0 4px 0', fontWeight: 800, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.stage_name || perf.organizer_name}</h4>
                    <p style={{ fontSize: '13.5px', color: '#212529', margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.title}</p>
                  </div>
                </div>

                <div style={{ background: '#f1f3f5', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', color: '#6c757d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontWeight: 600 }}>
                  <span>📍 {perf.location_name || perf.region}</span>
                  <span>📅 {perfDateStr}</span>
                </div>
              </div>

              <button
                style={{ width: '100%', padding: '11px', borderRadius: '12px', border: 'none', background: '#ff8c00', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '13.5px', boxShadow: '0 6px 18px rgba(255,140,0,0.25)' }}
                onClick={() => setDetailModalPerf(perf)}
              >
                상세보기 →
              </button>
            </div>
          );
        };

        return (
          <main style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '40px 20px 60px', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#212529', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                ❤️ 내가 찜한 공연
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.95rem', margin: 0 }}>관심 있는 버스킹 공연 일정을 한눈에 모아보세요.</p>
            </div>

            {bookmarkedList.length > 0 ? (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button
                    onClick={() => setBookmarkSubTab('upcoming')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: bookmarkSubTab === 'upcoming' ? '#ff8c00' : '#dee2e6',
                      background: bookmarkSubTab === 'upcoming' ? '#fff9f0' : '#ffffff',
                      color: bookmarkSubTab === 'upcoming' ? '#d97706' : '#495057',
                      fontSize: '1rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: bookmarkSubTab === 'upcoming' ? '0 4px 12px rgba(255,140,0,0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    📅 예정인 공연 ({upcomingBookmarks.length})
                  </button>

                  <button
                    onClick={() => setBookmarkSubTab('past')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: bookmarkSubTab === 'past' ? '#495057' : '#dee2e6',
                      background: bookmarkSubTab === 'past' ? '#f1f3f5' : '#ffffff',
                      color: bookmarkSubTab === 'past' ? '#212529' : '#495057',
                      fontSize: '1rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: bookmarkSubTab === 'past' ? '0 4px 12px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ⌛ 지난 공연 ({pastBookmarks.length})
                  </button>
                </div>

                {bookmarkSubTab === 'upcoming' ? (
                  <div style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#212529', margin: '0 0 20px 0' }}>
                      📅 예정인 공연 목록
                    </h3>
                    {upcomingBookmarks.length === 0 ? (
                      <p style={{ fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '40px 0' }}>예정된 찜한 공연이 없습니다.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', width: '100%' }}>
                        {upcomingBookmarks.map(perf => renderBookmarkCard(perf, false))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#6c757d', margin: '0 0 20px 0' }}>
                      ⌛ 지난 공연 목록
                    </h3>
                    {pastBookmarks.length === 0 ? (
                      <p style={{ fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '40px 0' }}>지난 찜한 공연이 없습니다.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', width: '100%' }}>
                        {pastBookmarks.map(perf => renderBookmarkCard(perf, true))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', background: '#ffffff', borderRadius: '18px', color: '#adb5bd', textAlign: 'center', border: '1px solid #dee2e6', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '42px', marginBottom: '12px' }}>🤍</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#212529', marginBottom: '6px' }}>아직 찜한 공연이 없습니다</h3>
                <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>공연 찾기 탭에서 마음에 드는 버스킹을 찜해 보세요!</p>
              </div>
            )}
          </main>
        );
      })()}

      {activeTab === 'following' && (
        <main style={{ 
          width: '100%', 
          maxWidth: '1240px', 
          margin: '0 auto', 
          padding: '40px 20px 60px', 
          boxSizing: 'border-box', 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr', 
          gap: '24px', 
          alignItems: 'start' 
        }}>
          <section style={{ width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px', color: '#212529' }}>⭐ 내가 팔로우한 아티스트</h2>
            <p style={{ color: '#6c757d', fontSize: '0.95rem', marginBottom: '16px' }}>즐겨찾는 버스커들의 프로필 모음입니다.</p>

            {followedArtists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
                {followedArtists.map((artist) => (
                  <div key={artist.artist_id || artist.id} style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '18px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
                    <ArtistProfile
                      artist={artist}
                      isFollowed={true}
                      onToggleFollow={() => handleToggleFollow(artist.artist_id || artist.id)}
                      performances={performances}
                      bookmarkedIds={bookmarkedIds}
                      onToggleBookmark={handleToggleBookmark}
                      onSelectDetail={(perf) => setDetailModalPerf(perf)}
                      onImageClick={handleImageClick}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', background: '#ffffff', borderRadius: '18px', color: '#6c757d', textAlign: 'center', fontSize: '0.95rem', border: '1px solid #dee2e6', fontWeight: 600 }}>
                아직 팔로우한 아티스트가 없습니다. 마음에 드는 버스커를 팔로우해 보세요!
              </div>
            )}
          </section>

          <section style={{ width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px', color: '#212529' }}>❤️ 내가 팔로우한 아티스트 공연</h2>
            <p style={{ color: '#6c757d', fontSize: '0.95rem', marginBottom: '16px' }}>팔로우 중인 버스커의 최신 공연 일정입니다.</p>

            {followingPerformances.filter(p => getPerformanceStatus(p.date, p.start_time, p.end_time).text !== '종료').length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
                {followingPerformances
                  .filter(p => getPerformanceStatus(p.date, p.start_time, p.end_time).text !== '종료')
                  .sort((a, b) => {
                    const dateA = new Date(`${a.date || a.performance_date?.split('T')[0]}T${a.start_time || '00:00'}`);
                    const dateB = new Date(`${b.date || b.performance_date?.split('T')[0]}T${b.start_time || '00:00'}`);
                    return dateA - dateB;
                  })
                  .map((perf) => {
                    const status = getPerformanceStatus(perf.date, perf.start_time, perf.end_time);
                    const isBookmarked = bookmarkedIds.includes(perf.id);
                    return (
                      <div key={perf.id} style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '18px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxSizing: 'border-box' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#868e96', fontWeight: 700 }}>
                                📅 {perf.date || perf.performance_date?.split('T')[0]}
                              </span>
                              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', color: '#212529', letterSpacing: '0.02em' }}>
                                {perf.start_time?.slice(0, 5)} ~ {perf.end_time?.slice(0, 5)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: status.text === 'LIVE' ? 'rgba(250,82,82,0.1)' : 'rgba(12,166,120,0.1)', color: status.text === 'LIVE' ? '#fa5252' : '#0ca678' }}>
                                {status.text}
                              </span>
                              <button
                                onClick={(e) => handleToggleBookmark(perf.id, e)}
                                style={{
                                  background: isBookmarked ? 'rgba(250,82,82,0.1)' : '#f1f3f5',
                                  border: `1px solid ${isBookmarked ? 'rgba(250,82,82,0.3)' : '#dee2e6'}`,
                                  borderRadius: '999px',
                                  padding: '5px 10px',
                                  cursor: 'pointer',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
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
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', background: '#f1f3f5', padding: '3px 9px', borderRadius: '999px', color: '#6c757d', fontWeight: 600 }}>{perf.genre}</span>
                          <h4 style={{ fontSize: '1.02rem', margin: '6px 0 2px 0', fontWeight: 800, color: '#212529' }}>{perf.stage_name}</h4>
                          <p style={{ fontSize: '13.5px', color: '#495057', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.title}</p>
                        </div>
                        <button
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#212529', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
                          onClick={() => setDetailModalPerf(perf)}
                        >
                          상세정보 확인
                        </button>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', background: '#ffffff', borderRadius: '18px', color: '#6c757d', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 600 }}>
                팔로잉 중인 버스커의 진행 중이거나 다가오는 공연 일정이 없습니다.
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === 'ai-recommend' && (
        <main style={{ width: '100%', boxSizing: 'border-box' }}>
          <AIRecommendation
            currentUser={currentUser}
            performances={performances}
            onSelectDetail={(perf) => {
              const safePerformances = Array.isArray(performances) ? performances : [];
              const found = safePerformances.find(p => p.id === perf.id) || perf;
              if (!safePerformances.some(p => p.id === found.id)) {
                setPerformances(prev => [...(Array.isArray(prev) ? prev : []), found]);
              }
              setDetailModalPerf(found);
            }}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={(perfId, e) => {
              handleToggleBookmark(perfId, e);
              if (e) e.stopPropagation();
            }}
          />
        </main>
      )}

      {activeTab === 'admin' && (
        <main style={{ width: '100%', maxWidth: '1200px', margin: '40px auto', padding: '0 20px 60px', boxSizing: 'border-box' }}>
          <div style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '18px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <AdminPage currentUser={currentUser} />
          </div>
        </main>
      )}

      {activeTab === 'mypage' && (
        <main style={{ width: '100%', maxWidth: '1000px', margin: '40px auto', padding: '0 20px 60px', boxSizing: 'border-box' }}>
          <div style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '18px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <MyPage
              currentUser={currentUser}
              onUpdateUser={(updatedUser) => {
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }}
              onLogout={handleLogout}
              onDataRefresh={handleDataRefresh}
            />
          </div>
        </main>
      )}

      {selectedArtistProfile && (
        <ArtistProfileModal
          artist={selectedArtistProfile}
          onClose={() => setSelectedArtistProfile(null)}
          isFollowed={followedArtistIds.includes(selectedArtistProfile.artist_id)}
          onToggleFollow={() => handleToggleFollow(selectedArtistProfile.artist_id)}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          onSelectDetail={(perf) => {
            setSelectedArtistProfile(null);
            setDetailModalPerf(perf);
          }}
          onImageClick={handleImageClick}
        />
      )}

      {searchedArtistModalData && (
        <ArtistProfileModal
          artist={searchedArtistModalData}
          onClose={() => setSearchedArtistModalData(null)}
          isFollowed={followedArtistIds.includes(searchedArtistModalData.artist_id)}
          onToggleFollow={() => handleToggleFollow(searchedArtistModalData.artist_id)}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          onSelectDetail={(perf) => {
            setSearchedArtistModalData(null);
            setDetailModalPerf(perf);
          }}
          onImageClick={handleImageClick}
          renderCustomHeader={() => (
            <button
              onClick={() => {
                const backList = searchedArtistModalData._backToList;
                setSearchedArtistModalData(null);
                if (backList) setSearchedPerformanceList(backList);
              }}
              style={{
                background: 'none', border: 'none', fontSize: '22px',
                fontWeight: 800, cursor: 'pointer', color: '#495057',
                padding: '4px 8px', display: 'flex', alignItems: 'center', borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f3f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title="이전으로"
            >
              ←
            </button>
          )}
        />
      )}

      {searchedPerformanceList.length > 0 && (
        <PerformanceListModal
          performances={searchedPerformanceList}
          onClose={() => {
            setSearchedPerformanceList([]);
            if (openSearchPageRef) {
              openSearchPageRef();
            }
          }}
          getImageUrl={getImageUrl}
          onSelectItem={(item) => {
            const isArtistItem = item.isArtist || (!item.title && (item.artist_id || item.user_id || item.stage_name));
            const currentList = searchedPerformanceList;

            if (isArtistItem) {
              setSearchedPerformanceList([]);
              setSearchedArtistModalData({
                ...item,
                artist_id: item.artist_id || item.user_id || item.id,
                stage_name: item.stage_name || item.organizer_name,
                genre: item.genre || 'ALL',
                profile_image: item.profile_image || item.artist_profile_image,
                instagram_url: item.instagram_url || item.artist_instagram_url,
                introduction: item.introduction || item.artist_introduction || item.description,
                follower_count: item.follower_count || 0,
                average_rating: item.average_rating || 0,
                review_count: item.review_count || 0,
                _backToList: currentList
              });
            } else {
              setSearchedPerformanceList([]);
              setDetailModalPerf({
                ...item,
                _backToList: currentList
              });
            }
          }}
        />
      )}

      {detailModalPerf && (
        <PerformanceModal
          performance={detailModalPerf}
          onClose={() => {
            const backList = detailModalPerf._backToList;
            setDetailModalPerf(null);
            if (backList) {
              setSearchedPerformanceList(backList);
            }
          }}
          isFollowed={followedArtistIds.includes(detailModalPerf.artist_id)}
          onToggleFollow={() => handleToggleFollow(detailModalPerf.artist_id)}
          onReviewSubmitted={handleDataRefresh}
          getPerformanceStatus={getPerformanceStatus}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          onImageClick={handleImageClick}
          renderCustomHeader={() => {
            if (!detailModalPerf._backToList) return null;
            return (
              <button
                onClick={() => {
                  const backList = detailModalPerf._backToList;
                  setDetailModalPerf(null);
                  setSearchedPerformanceList(backList);
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
            );
          }}
        />
      )}

      {expandedImage && (
        <ImageModal
          imageUrl={expandedImage}
          onClose={() => setExpandedImage(null)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          const protectedTabs = ['following', 'bookmarks', 'mypage', 'notifications'];
          if (!currentUser && protectedTabs.includes(activeTab)) {
            setActiveTab('search');
          }
        }}
        onLoginSuccess={(userData) => {
          setCurrentUser(userData);
          setIsAuthModalOpen(false);
          handleDataRefresh();
        }}
        pendingKakaoData={pendingKakaoData}
        onKakaoDataConsumed={() => setPendingKakaoData(null)}
        pendingGoogleData={pendingGoogleData}
        onGoogleDataConsumed={() => setPendingGoogleData(null)}
      />

      <RegisterPerformanceModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        currentUser={currentUser}
        onRegisterSuccess={handleDataRefresh}
      />
    </div>
  );
}

export default App;