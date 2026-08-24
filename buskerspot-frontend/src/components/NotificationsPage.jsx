import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buskerspot.onrender.com';

const getTodayDateStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 💡 알림 메시지를 파싱해서 태그/따옴표/사유 부분을 강조 렌더링하는 함수 (Gmarket Sans 및 Pretendard 스타일 적용)
const renderNotificationMessage = (message) => {
  if (!message) return null;
  const regex = /(\[[^\]]+\])|('[^']+')|(\([^)]*사유[^)]*\))/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={key++}>{message.slice(lastIndex, match.index)}</React.Fragment>);
    }
    if (match[1]) {
      // [공연 수정] 같은 태그 영역 -> Gmarket Sans 적용
      parts.push(
        <span key={key++} style={{ 
          fontFamily: "'GmarketSansBold', 'Pretendard', sans-serif",
          fontWeight: 700, 
          color: '#ff8c00',
          fontSize: '0.95em'
        }}>
          {match[1]}
        </span>
      );
    } else if (match[2]) {
      // '아티스트명' / '공연 제목' 영역 -> Pretendard 최대 굵기 적용
      parts.push(
        <span
          key={key++}
          style={{
            fontFamily: "'Pretendard', sans-serif",
            fontWeight: 900,
            color: '#212529',
            background: '#fff3e0',
            padding: '1px 5px',
            borderRadius: '5px',
            letterSpacing: '-0.02em'
          }}
        >
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      // 💡 사유 앞에 줄바꿈 추가
      parts.push(<br key={`br-${key++}`} />);
      parts.push(
        <span key={key++} style={{ 
          fontFamily: "'Pretendard', sans-serif",
          fontWeight: 400, 
          color: '#868e96', 
          fontSize: '0.9em' 
        }}>
          {match[3]}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < message.length) {
    parts.push(<React.Fragment key={key++}>{message.slice(lastIndex)}</React.Fragment>);
  }

  return parts;
};

export default function NotificationsPage({ currentUser, performances, setDetailModalPerf, setSelectedArtistProfile, onNotificationRead }) {
  const [notifications, setNotifications] = useState([]);
  const safePerformances = Array.isArray(performances) ? performances : [];

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token') || currentUser?.token;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('알림 목록을 불러오는 중 오류가 발생했습니다:', err);
      setNotifications([]);
    }
  };

  const handleReadNotification = async (notifId) => {
    const token = localStorage.getItem('token') || currentUser?.token;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          Array.isArray(prev) ? prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)) : []
        );
        if (onNotificationRead) onNotificationRead();
      }
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const handleViewDetail = async (notif) => {
    if (!notif.is_read) handleReadNotification(notif.id);

    const isPerformanceType = notif.type === 'PERFORMANCE_NEW' || notif.type === 'PERFORMANCE_UPDATE';

    if (isPerformanceType && notif.performance_id) {
      const localPerf = safePerformances.find(p => p.id === notif.performance_id);
      if (localPerf) {
        setDetailModalPerf(localPerf);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/performances/${notif.performance_id}`);
        const data = await res.json();
        if (data.success && data.performance) {
          setDetailModalPerf(data.performance);
        } else {
          alert('해당 공연 정보를 찾을 수 없습니다. (삭제되었을 수 있습니다)');
        }
      } catch (err) {
        console.error('공연 상세 조회 실패:', err);
        alert('공연 정보를 불러오지 못했습니다.');
      }
      return;
    }

    if (notif.type === 'PROFILE_UPDATE' && notif.artist_id) {
      try {
        const res = await fetch(`${API_URL}/api/users/${notif.artist_id}`);
        const data = await res.json();
        const artist = data.user;
        if (artist) {
          setSelectedArtistProfile({
            artist_id: artist.id || notif.artist_id,
            stage_name: artist.nickname || artist.stageName || artist.stage_name,
            genre: artist.genre || 'ALL',
            profile_image: artist.profile_image || artist.profileImage,
            instagram_url: artist.instagram_url || artist.instagramUrl,
            introduction: artist.introduction,
            follower_count: artist.follower_count || artist.followerCount || 0,
            average_rating: artist.average_rating || artist.averageRating || 0,
            review_count: artist.review_count || artist.reviewCount || 0
          });
        } else {
          alert('아티스트 프로필을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('아티스트 프로필 조회 실패:', err);
        alert('프로필 정보를 불러오지 못했습니다.');
      }
      return;
    }

    alert('상세 정보를 표시할 수 없는 알림입니다.');
  };

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '40px 20px 60px', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#212529', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          📢 내 알림함
        </h2>
        <p style={{ color: '#6c757d', fontSize: '0.95rem', margin: 0 }}>받은 알림 소식을 확인하고 관리하세요.</p>
      </div>

      {!Array.isArray(notifications) || notifications.length === 0 ? (
        <div style={{ padding: '60px 20px', background: '#ffffff', borderRadius: '18px', color: '#adb5bd', textAlign: 'center', border: '1px solid #dee2e6', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#212529', marginBottom: '6px' }}>새로운 알림이 없습니다</h3>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>관심 있는 아티스트의 소식을 기다려 보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.is_read) handleReadNotification(notif.id);
              }}
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: '16px',
                background: notif.is_read ? '#ffffff' : '#fffdf0',
                border: '1px solid',
                borderColor: notif.is_read ? '#dee2e6' : '#ffe066',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                <p style={{
                  margin: '0 0 6px 0',
                  fontSize: '14.5px',
                  color: '#212529',
                  fontWeight: notif.is_read ? 500 : 700,
                  lineHeight: '1.65',
                  letterSpacing: '-0.01em',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word'
                }}>
                  {renderNotificationMessage(notif.message)}
                </p>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#868e96', 
                  fontWeight: 600,
                  display: 'block',
                  marginTop: '8px'
                }}>
                  {(() => {
                    const rawDate = notif.createdAt || notif.created_at;
                    if (!rawDate) return '';
                    const d = new Date(rawDate);
                    return isNaN(d.getTime()) ? '' : d.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  })()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                {!notif.is_read && (
                  <span style={{ fontSize: '12px', background: '#fa5252', color: '#fff', padding: '5px 12px', borderRadius: '999px', fontWeight: 800 }}>
                    안 읽음
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(notif);
                  }}
                  style={{
                    background: '#ff8c00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(255,140,0,0.2)'
                  }}
                >
                  상세보기 →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}