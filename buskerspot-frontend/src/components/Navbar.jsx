import React, { useState, useEffect, useCallback } from 'react';
import { mainStyles } from '../styles/navbarStyles';
import MessageBell from './MessageBell';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const useIsMobile = (breakpoint = 860) => {
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

const getTodayDateStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuthModal, onOpenRegisterModal, onLogout, onSearch, onRegisterSearchOpen, unreadCount = 0 }) {
  const [artistKeyword, setArtistKeyword] = useState('');
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [recentPerformances, setRecentPerformances] = useState([]);
  const [popularKeywords, setPopularKeywords] = useState(['어쿠스틱', '힙합', '인디밴드', '홍대', '강남', '발라드', '재즈']);

  const isMobile = useIsMobile(860);
  const artistUserKey = currentUser ? `artist_search_history_${currentUser.id || currentUser.email}` : null;

  const [artistSearchHistory, setArtistSearchHistory] = useState(() => {
    if (!artistUserKey) return [];
    const saved = localStorage.getItem(artistUserKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (onRegisterSearchOpen) {
      onRegisterSearchOpen(() => setIsSearchPageOpen(true));
    }
  }, [onRegisterSearchOpen]);

  useEffect(() => {
    if (!artistUserKey) {
      setArtistSearchHistory([]);
    } else {
      const saved = localStorage.getItem(artistUserKey);
      setArtistSearchHistory(saved ? JSON.parse(saved) : []);
    }
  }, [artistUserKey]);

  const fetchRecentPerformances = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/performances`);
      const data = await res.json();
      if (data.success && data.performances) {
        const todayStr = getTodayDateStr();
        const upcomingPerfs = data.performances.filter((perf) => {
          const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
          return !perfDateStr || perfDateStr >= todayStr;
        });
        const sorted = upcomingPerfs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRecentPerformances(sorted.slice(0, 5));
      }
    } catch (err) {
      console.error('공연 목록을 불러오는 중 오류 발생:', err);
    }
  }, []);

  const fetchPopularKeywords = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/search/popular`);
      const data = await res.json();
      if (data.success && data.popularKeywords) {
        setPopularKeywords(data.popularKeywords);
      }
    } catch (err) {
      console.error('인기 검색어를 불러오는 중 오류 발생:', err);
    }
  }, []);

  useEffect(() => {
    if (isSearchPageOpen) {
      fetchRecentPerformances();
      fetchPopularKeywords();
    }
  }, [isSearchPageOpen, fetchRecentPerformances, fetchPopularKeywords]);

  const saveArtistSearchHistory = (query) => {
    if (!query || !query.trim() || !artistUserKey) return;
    const trimmed = query.trim();
    setArtistSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 20);
      localStorage.setItem(artistUserKey, JSON.stringify(updated));
      return updated;
    });
  };

  const recordSearchKeyword = async (keyword) => {
    try {
      await fetch(`${API_URL}/api/search/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });
    } catch (err) {
      console.error('검색어 기록 전송 오류:', err);
    }
  };

  const handleArtistSearch = (e) => {
    e.preventDefault();
    const keyword = artistKeyword.trim();
    if (!keyword) return;

    saveArtistSearchHistory(keyword);
    recordSearchKeyword(keyword);
    setIsSearchPageOpen(false);
    if (onSearch) onSearch(keyword);
  };

  const handleSelectHistory = (item) => {
    setArtistKeyword(item);
    setIsSearchPageOpen(false);
    saveArtistSearchHistory(item);
    recordSearchKeyword(item);
    if (onSearch) onSearch(item);
  };

  const handleDeleteHistoryItem = (e, indexToDelete) => {
    e.stopPropagation();
    const updated = artistSearchHistory.filter((_, idx) => idx !== indexToDelete);
    setArtistSearchHistory(updated);
    if (artistUserKey) {
      if (updated.length === 0) localStorage.removeItem(artistUserKey);
      else localStorage.setItem(artistUserKey, JSON.stringify(updated));
    }
  };

  const clearHistory = () => {
    setArtistSearchHistory([]);
    if (artistUserKey) localStorage.removeItem(artistUserKey);
  };

  const navItems = [
    { key: 'search', label: '공연 찾기' },
    { key: 'following', label: '팔로잉' },
    { key: 'bookmarks', label: '❤️ 찜한 공연' },
    { key: 'ai-recommend', label: '✨ AI 추천' }
  ];

  const searchForm = (
    <form onSubmit={handleArtistSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: 0, width: '100%' }}>
      <input
        type="text"
        placeholder="지역, 아티스트, 장르 검색... (예: 서울, 어쿠스틱)"
        value={artistKeyword}
        onChange={(e) => setArtistKeyword(e.target.value)}
        className="bsp-search-input"
        style={{
          width: '100%',
          height: '46px',
          padding: '0 46px 0 18px',
          border: '1px solid #dee2e6',
          borderRadius: '12px',
          backgroundColor: '#f8f9fa',
          fontSize: '14px',
          fontWeight: 600,
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      <button
        type="submit"
        style={{
          position: 'absolute',
          right: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#ff8c00'
        }}
      >
        🔍
      </button>
    </form>
  );

  return (
    <>
      <style>{`
        .bsp-nav-btn:hover { color: #57534e; background-color: rgba(41,37,36,0.04); }
        .bsp-nav-btn.is-active:hover { color: #ffffff; }
        .bsp-nav-btn.is-bookmark:hover { background-color: rgba(250,82,82,0.08); }
        .bsp-nav-btn.is-bookmark.is-active:hover { color: #ffffff; }

        .bsp-register-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 26px -6px rgba(250,82,82,0.6); }
        .bsp-sub-btn:hover { background-color: #f2ece5; }
        .bsp-logout-btn:hover { background-color: #ffe3e3; }
        .bsp-login-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -6px rgba(255,140,0,0.55); }

        .bsp-search-input:focus {
          background-color: #ffffff;
          border-color: #ff8c00;
          box-shadow: 0 0 0 3px rgba(255,140,0,0.15);
        }
        .bsp-top-icon-btn:hover { background-color: rgba(41,37,36,0.06); }
        .bsp-menu-item:hover { background-color: #faf6f2 !important; }

        .bsp-bottom-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          color: #868e96;
          gap: 3px;
          padding: 6px 0;
          transition: color 0.15s ease;
        }
        .bsp-bottom-tab.is-active {
          color: #ff8c00;
        }

        @media screen and (max-width: 860px) {
          .bsp-desktop-only { display: none !important; }
          body { padding-bottom: 65px; }
        }
        @media screen and (min-width: 861px) {
          .bsp-mobile-only { display: none !important; }
        }
      `}</style>

      {/* 상단 기본 헤더 */}
      <header
        style={{
          ...mainStyles.navbar,
          flexWrap: 'nowrap',
          ...(isMobile
            ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 900, borderBottom: '1px solid #f1eee7' }
            : {})
        }}
      >
        <div
  style={{ ...mainStyles.logoContainer, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
  onClick={() => { setArtistKeyword(''); if (onSearch) onSearch(''); setActiveTab('search'); setIsSearchPageOpen(false); }}
>
  <img src="/logo-icon.png" alt="BuskerSpot" style={{ height: '44px', width: 'auto' }} />
  <span>BuskerSpot</span>
</div>

        {/* 데스크탑 전용 메뉴 및 검색 */}
        {!isMobile && (
          <div className="bsp-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1, justifyContent: 'flex-end', paddingRight: '20px', flexShrink: 0 }}>
            <nav style={{ ...mainStyles.menuGroup, flexShrink: 0, whiteSpace: 'nowrap', marginRight: '100px' }}> 
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`bsp-nav-btn ${item.key === 'bookmarks' ? 'is-bookmark' : ''} ${activeTab === item.key ? 'is-active' : ''}`}
                  style={{
                    ...(item.key === 'bookmarks' ? mainStyles.navBtnBookmark : mainStyles.navBtn),
                    ...(activeTab === item.key
                      ? (item.key === 'bookmarks' ? mainStyles.navBtnBookmarkActive : mainStyles.navBtnActive)
                      : {})
                  }}
                  onClick={() => setActiveTab(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '30px' }}>
              <div
                onClick={() => setIsSearchPageOpen(true)}
                style={{
                  width: '240px', height: '38px', padding: '0 36px 0 16px', border: 'none', borderRadius: '999px',
                  backgroundColor: '#faf6f2', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center',
                  color: '#a8a29e', cursor: 'pointer', boxSizing: 'border-box', position: 'relative'
                }}
              >
                <span>{artistKeyword || '지역, 아티스트, 장르 검색...'}</span>
                <span style={{ position: 'absolute', right: '12px', fontSize: '13px' }}>🔍</span>
              </div>
            </div>
          </div>
        )}

        {/* 데스크탑 우측 액션 그룹 */}
        {!isMobile && (
          <div className="bsp-desktop-only" style={{ ...mainStyles.actionGroup, flexShrink: 0, flexWrap: 'nowrap', position: 'relative' }}>
            {currentUser && (
              <button
                className="bsp-top-icon-btn"
                type="button"
                onClick={() => setActiveTab('notifications')}
                style={{
                  position: 'relative', width: '38px', height: '38px', borderRadius: '50%', border: 'none',
                  backgroundColor: activeTab === 'notifications' ? '#ffe3e3' : '#faf6f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#fa5252', color: '#fff', fontSize: '10px', fontWeight: 800, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            {currentUser && <MessageBell />}

            {currentUser && (
              <div style={{ ...mainStyles.userChip, overflow: 'hidden', maxWidth: '130px', flexShrink: 0 }}>
                {currentUser.role === 'ADMIN' && <span>🛡️</span>}
                {currentUser.role === 'ARTIST' && <span>🎤</span>}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '80px', verticalAlign: 'middle' }}>
                  <b>{currentUser.nickname}</b>
                </span>
                님
              </div>
            )}

            {currentUser ? (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  className="bsp-top-icon-btn"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%', border: 'none',
                    backgroundColor: isMenuOpen ? '#ffe3e3' : '#faf6f2', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
                  }}
                  title="메뉴"
                >
                  ☰
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 1099 }}
                    />
                    <div
                      style={{
                        position: 'absolute', top: '46px', right: 0, minWidth: '180px',
                        backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f1eee7',
                        boxShadow: '0 14px 30px -10px rgba(41,37,36,0.25)', padding: '8px',
                        display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 1100, boxSizing: 'border-box'
                      }}
                    >
                      {currentUser.role === 'ARTIST' && (
                        <button
                          className="bsp-menu-item"
                          style={{ ...mainStyles.subActionBtn, textAlign: 'left', backgroundColor: 'transparent', color: '#ff8c00', width: '100%' }}
                          onClick={() => { setIsMenuOpen(false); onOpenRegisterModal(); }}
                        >
                          + 공연 등록
                        </button>
                      )}
                      {currentUser.role === 'ADMIN' && (
                        <button
                          className="bsp-menu-item"
                          style={{ ...mainStyles.subActionBtn, textAlign: 'left', backgroundColor: 'transparent', width: '100%' }}
                          onClick={() => { setIsMenuOpen(false); setActiveTab('admin'); }}
                        >
                          관리자 페이지
                        </button>
                      )}
                      <button
                        className="bsp-menu-item"
                        style={{ ...mainStyles.subActionBtn, textAlign: 'left', backgroundColor: 'transparent', width: '100%' }}
                        onClick={() => { setIsMenuOpen(false); setActiveTab('mypage'); }}
                      >
                        마이페이지
                      </button>
                      <button
                        className="bsp-menu-item"
                        style={{ ...mainStyles.subActionBtn, textAlign: 'left', backgroundColor: 'transparent', color: '#fa5252', width: '100%' }}
                        onClick={() => { setIsMenuOpen(false); onLogout(); }}
                      >
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button className="bsp-login-btn" style={{ ...mainStyles.subActionBtn, backgroundColor: '#ff8c00', color: '#fff', boxShadow: '0 8px 18px -6px rgba(255,140,0,0.5)', flexShrink: 0 }} onClick={onOpenAuthModal}>
                로그인 / 회원가입
              </button>
            )}
          </div>
        )}

        {/* 모바일 전용 상단 우측 버튼들 */}
        {isMobile && (
          <div className="bsp-mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {currentUser?.role === 'ARTIST' && (
              <button
                className="bsp-register-btn"
                onClick={onOpenRegisterModal}
                style={{ ...mainStyles.registerBtn, padding: '6px 10px', fontSize: '11px', borderRadius: '8px', whiteSpace: 'nowrap' }}
              >
                + 등록
              </button>
            )}

            {!currentUser && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                style={{
                  backgroundColor: '#ff8c00',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 10px rgba(255,140,0,0.2)'
                }}
              >
                로그인/가입
              </button>
            )}

            <button
              type="button"
              className="bsp-top-icon-btn"
              onClick={() => setIsSearchPageOpen(true)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                backgroundColor: '#faf6f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
              }}
              title="검색"
            >
              🔍
            </button>

            {currentUser && (
              <button
                className="bsp-top-icon-btn"
                type="button"
                onClick={() => setActiveTab('notifications')}
                style={{
                  position: 'relative', width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  backgroundColor: activeTab === 'notifications' ? '#ffe3e3' : '#faf6f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '3px', right: '3px', backgroundColor: '#fa5252', color: '#fff', fontSize: '9px', fontWeight: 800, width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {currentUser && <MessageBell />}
          </div>
        )}
      </header>

      {/* 통합검색 페이지 화면 (오버레이 모드) */}
      {isSearchPageOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowY: 'auto',
          paddingBottom: '80px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #f1eee7',
            backgroundColor: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            maxWidth: '800px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            <button
              type="button"
              onClick={() => setIsSearchPageOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: '22px', fontWeight: 700, cursor: 'pointer', color: '#343a40', padding: 0 }}
            >
              〈
            </button>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#212529' }}>통합검색</span>
            <button
              type="button"
              onClick={() => { setIsSearchPageOpen(false); setActiveTab('search'); }}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0 }}
            >
              🏠
            </button>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 900, color: '#212529', letterSpacing: '-0.02em' }}>통합검색</h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#868e96', fontWeight: 600 }}>지역, 아티스트, 장르를 한 번에 찾아보세요.</p>
            </div>

            {searchForm}

            {artistSearchHistory.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#495057' }}>최근 검색</span>
                  <button type="button" onClick={clearHistory} style={{ background: 'none', border: 'none', fontSize: '11.5px', color: '#adb5bd', cursor: 'pointer', fontWeight: 700 }}>전체 삭제</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {artistSearchHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectHistory(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                        backgroundColor: '#f1f3f5', borderRadius: '999px', fontSize: '13px', fontWeight: 700, color: '#495057', cursor: 'pointer'
                      }}
                    >
                      <span>🕒 {item}</span>
                      <span onClick={(e) => handleDeleteHistoryItem(e, idx)} style={{ color: '#adb5bd', fontWeight: 900 }}>✕</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 실시간 인기 검색어 태그 목록 */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 900, color: '#212529' }}>실시간 인기 검색어 🔥</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {popularKeywords.map((keyword, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectHistory(keyword)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#495057',
                      cursor: 'pointer'
                    }}
                  >
                    {idx + 1}. {keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* 새로 등록된 공연 목록 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#212529' }}>새로 등록된 공연</h3>
                <span style={{ fontSize: '12px', color: '#ff8c00', fontWeight: 700 }}>{recentPerformances.length}</span>
              </div>

              {recentPerformances.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#adb5bd', fontSize: '13px', fontWeight: 600 }}>
                  등록된 공연이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentPerformances.map((perf) => (
                    <div
                      key={perf.id}
                      onClick={() => {
                        setIsSearchPageOpen(false);
                        setActiveTab('search');
                        if (onSearch) onSearch(perf.title);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '14px',
                        border: '1px solid #e9ecef',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,140,0,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8c00', fontSize: '16px', flexShrink: 0
                        }}>
                          🔍
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 800, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {perf.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#868e96', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 [{perf.region}] {perf.location_name} ({perf.performance_date?.split('T')[0]})
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '4px 9px', backgroundColor: 'rgba(12,166,120,0.1)', color: '#0ca678', borderRadius: '999px', fontWeight: 800, flexShrink: 0 }}>
                        {perf.genre || '버스킹'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 모바일 전용 화면 하단 고정 네비게이션 바 */}
      {isMobile && (
        <nav
          className="bsp-mobile-only"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e9e4dc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
            boxSizing: 'border-box'
          }}
        >
          <button
            type="button"
            className={`bsp-bottom-tab ${activeTab === 'search' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span style={{ fontSize: '20px' }}>🏠</span>
            <span>홈</span>
          </button>

          <button
            type="button"
            className={`bsp-bottom-tab ${activeTab === 'following' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            <span style={{ fontSize: '20px' }}>👥</span>
            <span>팔로잉</span>
          </button>

          <button
            type="button"
            className={`bsp-bottom-tab ${activeTab === 'bookmarks' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <span style={{ fontSize: '20px' }}>❤️</span>
            <span>찜한공연</span>
          </button>

          <button
            type="button"
            className={`bsp-bottom-tab ${activeTab === 'ai-recommend' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('ai-recommend')}
          >
            <span style={{ fontSize: '20px' }}>✨</span>
            <span>AI 추천</span>
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              type="button"
              className={`bsp-bottom-tab ${activeTab === 'admin' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <span>관리자</span>
            </button>
          )}

          <button
            type="button"
            className={`bsp-bottom-tab ${activeTab === 'mypage' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('mypage')}
          >
            <span style={{ fontSize: '20px' }}>👤</span>
            <span>마이</span>
          </button>
        </nav>
      )}
    </>
  );
}