import React, { useState, useEffect } from 'react';
import ArtistProfile from './ArtistProfile';

export default function NotificationsPage({ currentUser, performances = [], setDetailModalPerf }) {
  const [notifications, setNotifications] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [loadingArtistId, setLoadingArtistId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('알림 목록을 불러오는 중 오류가 발생했습니다:', err);
    }
  };

  const handleReadNotification = async (notifId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  // 💡 아티스트 프로필 정보를 불러와 모달로 띄움
  const handleShowArtistProfile = async (artistId) => {
    setLoadingArtistId(artistId);
    try {
      const res = await fetch(`http://localhost:5000/api/${artistId}`);
      const data = await res.json();
      if (data && data.id) {
        setSelectedArtist(data);
      } else {
        alert('아티스트 정보를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('아티스트 정보 조회 실패:', err);
      alert('아티스트 정보를 불러오지 못했습니다.');
    } finally {
      setLoadingArtistId(null);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#212529', marginBottom: '20px' }}>
        📢 내 알림함
      </h2>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#adb5bd', fontSize: '14px', fontWeight: 600, background: '#fff', borderRadius: '16px', border: '1px solid #dee2e6' }}>
          새로운 알림이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => {
            // 알림에 연결된 공연 ID가 있을 경우 performances 배열에서 매칭
            const targetPerf = notif.performance_id 
              ? performances.find(p => p.id === notif.performance_id) 
              : null;

            // 공연이 없고 artist_id만 있는 경우 (예: 닉네임 변경 알림) → 아티스트 카드 버튼
            const showArtistButton = !targetPerf && notif.artist_id;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) handleReadNotification(notif.id);
                }}
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: notif.is_read ? '#ffffff' : '#fff9db',
                  border: '1px solid',
                  borderColor: notif.is_read ? '#dee2e6' : '#ffe066',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#343a40', fontWeight: notif.is_read ? 500 : 700, lineHeight: '1.4' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '11.5px', color: '#868e96', fontWeight: 600 }}>
                    {new Date(notif.createdAt).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {!notif.is_read && (
                    <span style={{ fontSize: '11px', background: '#fa5252', color: '#fff', padding: '3px 8px', borderRadius: '999px', fontWeight: 800 }}>
                      안 읽음
                    </span>
                  )}

                  {targetPerf && setDetailModalPerf && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!notif.is_read) handleReadNotification(notif.id);
                        setDetailModalPerf(targetPerf);
                      }}
                      style={{
                        background: '#ff8c00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      상세보기 →
                    </button>
                  )}

                  {showArtistButton && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!notif.is_read) handleReadNotification(notif.id);
                        handleShowArtistProfile(notif.artist_id);
                      }}
                      disabled={loadingArtistId === notif.artist_id}
                      style={{
                        background: '#ff8c00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        opacity: loadingArtistId === notif.artist_id ? 0.6 : 1
                      }}
                    >
                      {loadingArtistId === notif.artist_id ? '불러오는 중...' : '상세보기 →'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 💡 아티스트 프로필 카드 모달 */}
      {selectedArtist && (
        <div
          onClick={() => setSelectedArtist(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '600px', position: 'relative' }}
          >
            <button
              onClick={() => setSelectedArtist(null)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 1,
                background: '#212529',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <ArtistProfile
              artist={selectedArtist}
              isFollowed={false}
              onToggleFollow={null}
              bookmarkedIds={[]}
              onToggleBookmark={null}
              onSelectDetail={(perf) => {
                setSelectedArtist(null);
                if (setDetailModalPerf) setDetailModalPerf(perf);
              }}
              onImageClick={null}
            />
          </div>
        </div>
      )}
    </div>
  );
}