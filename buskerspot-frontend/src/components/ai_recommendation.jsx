import React, { useState, useEffect } from 'react';
import '../App.css';

// 배포 환경에서는 REACT_APP_API_URL 환경변수를 사용하고,
// 로컬 개발 환경에서는 localhost:8080으로 폴백합니다.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 💡 화면 폭을 감지해서 모바일 레이아웃 여부를 반환하는 커스텀 훅
const useIsMobile = (breakpoint = 900) => {
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

const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_URL}/${url.replace(/^\//, '')}`;
};

// 💡 날짜 포맷 함수 ("YYYY-MM-DD" -> "X월 X일")
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
};

const DefaultMicrophoneAvatar = ({ size = 52 }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ff8c00 0%, #0ca678 130%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.45}px`,
      color: '#ffffff',
      flexShrink: 0,
      boxShadow: '0 4px 14px rgba(255,140,0,0.2)'
    }}
  >
    🎤
  </div>
);

function AIRecommendation({ currentUser, onSelectDetail, bookmarkedIds = [], onToggleBookmark }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [recommendedList, setRecommendedList] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);

  const isMobile = useIsMobile(900);
  // 💡 모바일에서는 검색 기록 패널을 기본적으로 접어둔다
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    setIsHistoryOpen(!isMobile);
  }, [isMobile]);
  
  // 로그인한 계정별 고유 키 생성
  const userKey = currentUser ? `ai_search_history_${currentUser.id || currentUser.email}` : null;

  const [searchHistory, setSearchHistory] = useState(() => {
    if (!userKey) return [];
    const saved = localStorage.getItem(userKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!userKey) {
      setSearchHistory([]);
    } else {
      const saved = localStorage.getItem(userKey);
      setSearchHistory(saved ? JSON.parse(saved) : []);
    }
  }, [userKey]);

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setAiReport('');
    setRecommendedList([]);
    setHasSearched(true);
    setIsCachedResult(false);

    try {
      const res = await fetch(`${API_URL}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery, 
          chatHistory: [] 
        })
      });
      const data = await res.json();

      // Java 백엔드 응답 스펙(report)에 맞춘 조건문
      if (data && data.report) {
        setAiReport(data.report || '');
        const mappedRecs = (data.recommendations || []).map(perf => ({
          ...perf,
          id: perf.id || perf.performance_id,
          artist_id: perf.artist_id || perf.user_id
        }));
        setRecommendedList(mappedRecs);
        setIsCachedResult(false);

        if (userKey) {
          setSearchHistory((prev) => {
            const filtered = prev.filter((item) => item !== searchQuery);
            const updated = [searchQuery, ...filtered].slice(0, 20);
            localStorage.setItem(userKey, JSON.stringify(updated));
            return updated;
          });
        }

        if (isMobile) setIsHistoryOpen(false);
      } else {
        alert('AI 추천 결과를 받아오지 못했습니다.');
      }
    } catch (err) {
      console.error('API 통신 실패:', err);
      alert('서버와 통신하는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = (e) => {
    e.preventDefault();
    executeSearch(prompt);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (userKey) {
      localStorage.removeItem(userKey);
    }
  };

  const handleDeleteHistoryItem = (e, indexToDelete) => {
    e.stopPropagation();
    const updated = searchHistory.filter((_, idx) => idx !== indexToDelete);
    setSearchHistory(updated);
    if (userKey) {
      if (updated.length === 0) {
        localStorage.removeItem(userKey);
      } else {
        localStorage.setItem(userKey, JSON.stringify(updated));
      }
    }
  };

  const historyPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {!currentUser ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#adb5bd', fontSize: '13px', fontWeight: 600 }}>
          로그인 후 이용 가능한 기능입니다.
        </div>
      ) : searchHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#adb5bd', fontSize: '13px', fontWeight: 600 }}>
          아직 검색한 기록이 없습니다.
        </div>
      ) : (
        searchHistory.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              setPrompt(item);
              executeSearch(item);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              background: '#f1f3f5',
              border: '1px solid #dee2e6',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,140,0,0.1)';
              e.currentTarget.style.borderColor = '#ff8c00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f3f5';
              e.currentTarget.style.borderColor = '#dee2e6';
            }}
            title={item}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#495057',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
                fontWeight: 600,
                flex: 1
              }}
            >
              🕒 {item}
            </span>

            <button
              type="button"
              onClick={(e) => handleDeleteHistoryItem(e, idx)}
              style={{
                background: 'none',
                border: 'none',
                color: '#adb5bd',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fa5252'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#adb5bd'; }}
              title="이 기록 삭제"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100%', minHeight: 'calc(100vh - 60px)', background: '#f8f9fa', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box' }}>

      {/* 💡 [사이드바 / 모바일에서는 접이식 검색 기록 패널] */}
      {isMobile ? (
        <div style={{ background: '#ffffff', borderBottom: '1px solid #dee2e6', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={() => setIsHistoryOpen((o) => !o)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              background: 'none',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              color: '#212529',
              cursor: 'pointer'
            }}
          >
            <span>💬 최근 검색 기록{searchHistory.length > 0 ? ` (${searchHistory.length})` : ''}</span>
            <span>{isHistoryOpen ? '▲' : '▼'}</span>
          </button>
          {isHistoryOpen && (
            <div style={{ padding: '0 20px 20px', maxHeight: '260px', overflowY: 'auto' }}>
              {searchHistory.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={clearHistory}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: '#6c757d', cursor: 'pointer', fontWeight: 700 }}
                  >
                    전체 삭제
                  </button>
                </div>
              )}
              {historyPanelContent}
            </div>
          )}
        </div>
      ) : (
        <aside style={{
          width: '320px',
          background: '#ffffff',
          borderRight: '1px solid #dee2e6',
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flexShrink: 0,
          height: 'calc(100vh - 60px)',
          position: 'sticky',
          top: '60px',
          overflowY: 'auto',
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.02)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '2px solid #f1f3f5' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#212529', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 최근 검색 기록
            </span>
            {searchHistory.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#6c757d', cursor: 'pointer', fontWeight: 700 }}
              >
                전체 삭제
              </button>
            )}
          </div>
          {historyPanelContent}
        </aside>
      )}

      {/* 💡 [메인 영역] */}
      <main style={{ flex: 1, padding: isMobile ? '20px 16px' : '36px 48px', boxSizing: 'border-box', minWidth: 0 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          
          <div style={{ 
            background: '#ffffff', 
            padding: isMobile ? '22px 20px' : '36px 40px', 
            borderRadius: '18px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', 
            border: '1px solid #dee2e6', 
            marginBottom: isMobile ? '20px' : '28px',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #ff8c00 0%, #ffab40 50%, #0ca678 100%)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem', background: 'rgba(255,140,0,0.1)', padding: '4px 8px', borderRadius: '10px' }}>✨</span>
              <h2 style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: 900, margin: 0, color: '#212529', letterSpacing: '-0.02em' }}>
                AI 관객 리뷰 심층 맞춤 추천
              </h2>
            </div>
            <p style={{ fontSize: isMobile ? '0.85rem' : '0.92rem', color: '#6c757d', margin: '0 0 20px 0', lineHeight: '1.5', fontWeight: 500 }}>
              원하시는 분위기나 장소를 알려주세요. 실제 관객 리뷰를 다각도로 분석하여 진짜 맞춤 공연을 추천해 드립니다.
            </p>

            <form onSubmit={handleAISearch} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', width: '100%' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 퇴근시간 서현역 인근에서 열리는 잔잔한 어쿠스틱 공연"
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #dee2e6', 
                  outline: 'none', 
                  fontSize: '13.5px', 
                  background: '#f1f3f5',
                  transition: 'all 0.15s ease',
                  color: '#212529',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  width: '100%'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#ff8c00'; e.target.style.background = '#ffffff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.background = '#f1f3f5'; }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: loading ? '#adb5bd' : 'linear-gradient(135deg, #ff8c00, #ffab40)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(255,140,0,0.25)',
                  transition: 'transform 0.15s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                {loading ? 'AI 분석 중...' : '맞춤 분석받기'}
              </button>
            </form>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', background: '#ffffff', borderRadius: '18px', border: '1px solid #dee2e6', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ 
                display: 'inline-block', 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f1f3f5', 
                borderTopColor: '#ff8c00', 
                borderRadius: '50%', 
                animation: 'spin 0.8s linear infinite', 
                marginBottom: '16px' 
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#ff8c00', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 4px 0' }}>AI 큐레이터가 최적의 무대를 엄선하고 있어요...</p>
              <p style={{ color: '#adb5bd', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>실제 관객 리뷰와 연주 스타일을 매칭하는 중입니다.</p>
            </div>
          )}

          {aiReport && !loading && (
            <div style={{
              background: 'rgba(255,140,0,0.05)',
              border: '1px solid rgba(255,140,0,0.2)',
              borderRadius: '16px',
              padding: isMobile ? '16px 18px' : '18px 22px',
              marginBottom: '24px',
              color: '#212529',
              fontSize: '0.94rem',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              lineHeight: '1.5',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#ff8c00' }}>
                  <span>🤖</span>
                  <span>AI 큐레이터 리포트</span>
                </div>
                {isCachedResult && (
                  <span style={{ fontSize: '11px', background: 'rgba(12,166,120,0.1)', color: '#0ca678', padding: '3px 10px', borderRadius: '999px', fontWeight: 800 }}>
                    ⚡ 캐시된 초고속 답변
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 500, color: '#495057' }}>{aiReport}</div>
            </div>
          )}

          {recommendedList.length > 0 && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 2px 0', color: '#212529', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎯 AI가 엄선한 맞춤 버스킹 무대 <span style={{ color: '#ff8c00', fontSize: '1rem', fontFamily: "'Bebas Neue', sans-serif" }}>({recommendedList.length}건)</span>
              </h3>

              {recommendedList.map((perf, idx) => {
                const profileImg = getFullImageUrl(perf.profile_image);
                const rating = Number(perf.avg_rating || 0);
                const reviewCnt = Number(perf.review_count || 0);
                const perfId = perf.id || perf.performance_id;
                const isBookmarked = bookmarkedIds.includes(perfId);

                return (
                  <div
                    key={perfId || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #dee2e6',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{
                      background: '#f1f3f5',
                      padding: isMobile ? '10px 14px' : '10px 20px',
                      color: '#495057',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #dee2e6',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#ff8c00', fontWeight: 800 }}>✨ AI 추천 매칭 #{idx + 1}</span>
                      <span style={{ fontSize: '11px', background: '#ffffff', padding: '2px 8px', borderRadius: '999px', border: '1px solid #dee2e6', color: '#6c757d', fontWeight: 600 }}>
                        📍 {perf.region || perf.location_name || '버스킹 존'}
                      </span>
                    </div>

                    <div style={{ padding: isMobile ? '16px' : '20px', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '12px' : '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                          {/* 💡 날짜 및 시간 표시 영역 */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#868e96', fontWeight: 700 }}>
                              {formatDate(perf.performance_date) || '일자 미정'}
                            </span>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#212529', letterSpacing: '0.02em', lineHeight: '1' }}>
                              {perf.start_time?.slice(0, 5) || '19:00'}
                            </span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(12,166,120,0.1)', color: '#0ca678', fontWeight: 800 }}>
                              예정
                            </span>
                          </div>

                          <div style={{ flexShrink: 0 }}>
                            {profileImg ? (
                              <img
                                src={profileImg}
                                alt={perf.stage_name}
                                style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #dee2e6' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <div style={{ display: profileImg ? 'none' : 'block' }}>
                              <DefaultMicrophoneAvatar size={52} />
                            </div>
                          </div>

                          {isMobile && (
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 800, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {perf.stage_name || '아티스트'}
                              </h4>
                              {rating > 0 && (
                                <span style={{ fontSize: '11px', background: 'rgba(255,140,0,0.1)', color: '#ff8c00', padding: '3px 9px', borderRadius: '999px', fontWeight: 800 }}>
                                  ⭐ {rating.toFixed(1)} ({reviewCnt})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', background: '#f1f3f5', color: '#6c757d', padding: '3px 9px', borderRadius: '999px', fontWeight: 700 }}>
                              {perf.genre || 'ALL'}
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(12,166,120,0.1)', color: '#0ca678', padding: '3px 9px', borderRadius: '999px', fontWeight: 700 }}>
                              📍 {perf.location_name || perf.region || '장소 미정'}
                            </span>
                            {!isMobile && rating > 0 && (
                              <span style={{ fontSize: '11px', background: 'rgba(255,140,0,0.1)', color: '#ff8c00', padding: '3px 9px', borderRadius: '999px', fontWeight: 800 }}>
                                ⭐ {rating.toFixed(1)} ({reviewCnt})
                              </span>
                            )}
                          </div>

                          {!isMobile && (
                            <h4 style={{ margin: '0 0 2px 0', fontSize: '1.02rem', fontWeight: 800, color: '#212529' }}>
                              {perf.stage_name || '아티스트'}
                            </h4>
                          )}

                          <p style={{ margin: 0, fontSize: '13.5px', color: '#495057', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {perf.title || '버스킹 라이브 공연'}
                          </p>
                        </div>

                        {/* 💡 찜 버튼 & 상세보기 버튼 */}
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', alignItems: 'stretch', width: isMobile ? '100%' : 'auto' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              if (onToggleBookmark) onToggleBookmark(perfId, e);
                            }}
                            style={{
                              background: isBookmarked ? '#fff0f3' : '#f8f9fa',
                              border: isBookmarked ? '1px solid #ff8787' : '1px solid #dee2e6',
                              borderRadius: '20px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: isBookmarked ? '#e03131' : '#495057',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                              flex: isMobile ? 1 : 'none'
                            }}
                            title={isBookmarked ? '찜 취소' : '찜하기'}
                          >
                            <span>{isBookmarked ? '❤️' : '🤍'}</span>
                            <span>찜</span>
                          </button>

                          <button
                            type="button"
                            style={{
                              border: 'none',
                              background: '#ff8c00',
                              color: '#ffffff',
                              padding: '10px 16px',
                              borderRadius: '12px',
                              fontSize: '13.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              whiteSpace: 'nowrap',
                              flex: isMobile ? 1 : 'none'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectDetail) {
                                onSelectDetail({
                                  ...perf,
                                  id: perfId,
                                  artist_id: perf.artist_id || perf.user_id
                                });
                              }
                            }}
                          >
                            상세보기
                          </button>
                        </div>
                      </div>

                      <div style={{
                        marginTop: '16px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        padding: isMobile ? '12px 14px' : '14px 16px',
                        border: '1px solid #dee2e6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        {perf.aiReviewQuote && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                            <span style={{ background: 'rgba(255,140,0,0.1)', color: '#ff8c00', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                              💬 관객 리뷰
                            </span>
                            <span style={{ color: '#212529', fontWeight: 600, fontStyle: 'italic', lineHeight: '1.4' }}>
                              "{perf.aiReviewQuote}"
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', paddingTop: perf.aiReviewQuote ? '8px' : '0', borderTop: perf.aiReviewQuote ? '1px dashed #dee2e6' : 'none' }}>
                          <span style={{ background: 'rgba(12,166,120,0.1)', color: '#0ca678', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                            ✨ AI 추천
                          </span>
                          <span style={{ color: '#495057', fontWeight: 500, lineHeight: '1.4' }}>
                            {perf.aiReasonText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasSearched && !loading && recommendedList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #dee2e6', color: '#adb5bd', fontSize: '0.95rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', width: '100%', boxSizing: 'border-box' }}>
              😅 질문과 어울리는 추천 공연을 DB에서 찾지 못했습니다. 다른 질문을 입력해 보세요!
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

AIRecommendation.defaultProps = {
  bookmarkedIds: [],
  onToggleBookmark: () => {}
};

export default AIRecommendation;