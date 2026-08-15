import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const DUMMY_BUSKINGS = [
  { id: 1, title: "어쿠스틱 감성 버스킹", date: "2026-08-05", time: "18:00", lat: 37.4, lng: 127.1, artist: "김민수", artistId: 101 },
  { id: 2, title: "인디 록 라이브", date: "2026-08-05", time: "20:00", lat: 37.41, lng: 127.12, artist: "밴드 사운드", artistId: 102 },
  { id: 3, title: "길거리 재즈 피아노", date: "2026-08-07", time: "19:30", lat: 37.39, lng: 127.09, artist: "재즈캣", artistId: 103 },
];

const BuskerSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentUserId = 1; // 로그인된 사용자 ID (예시)
  const [followedArtists, setFollowedArtists] = useState([]);

  // 컴포넌트 마운트 시 팔로우 목록 불러오기
  useEffect(() => {
    fetch(`/api/follows/${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFollowedArtists(data);
        }
      })
      .catch((err) => console.error("팔로우 정보 로드 실패:", err));
  }, [currentUserId]);

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentFormattedDate = formatDateString(selectedDate);
  const filteredBuskings = DUMMY_BUSKINGS.filter(
    (item) => item.date === currentFormattedDate
  );

  // 팔로우 토글 핸들러
  const handleToggleFollow = async (artistId) => {
    const isFollowing = followedArtists.includes(artistId);
    const method = isFollowing ? 'DELETE' : 'POST';

    try {
      const response = await fetch('/api/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, artistId }),
      });

      if (response.ok) {
        if (isFollowing) {
          setFollowedArtists(followedArtists.filter((id) => id !== artistId));
        } else {
          setFollowedArtists([...followedArtists, artistId]);
        }
      }
    } catch (error) {
      console.error('팔로우 요청 실패:', error);
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. 좌측 컨트롤 패널 */}
      <div style={styles.leftPanel}>
        <div style={styles.card}>
          <h3 style={styles.title}>📅 버스킹 일정 선택</h3>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            formatDay={(locale, date) => date.toLocaleString('en', { day: 'numeric' })}
          />
        </div>

        <div style={{ ...styles.card, flex: 1 }}>
          <h4 style={styles.title}>⏰ {currentFormattedDate} 타임라인</h4>
          {filteredBuskings.length > 0 ? (
            <div style={styles.timelineList}>
              {filteredBuskings.map((busking) => {
                const isFollowing = followedArtists.includes(busking.artistId);
                return (
                  <div key={busking.id} style={styles.timelineItem}>
                    <span style={styles.timeBadge}>{busking.time}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{busking.title}</strong>
                      <p style={styles.artistText}>아티스트: {busking.artist}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFollow(busking.artistId)}
                      style={{
                        ...styles.followBtn,
                        backgroundColor: isFollowing ? '#e53e3e' : '#edf2f7',
                        color: isFollowing ? '#fff' : '#4a5568',
                      }}
                    >
                      {isFollowing ? '♥ 팔로잉' : '♡ 팔로우'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={styles.emptyText}>등록된 공연 일정이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 2. 우측 지도 영역 */}
      <div style={styles.rightPanel}>
        <Map
          center={{ lat: 37.4, lng: 127.1 }}
          style={{ width: '100%', height: '100%' }}
          level={4}
        >
          {filteredBuskings.map((busking) => (
            <MapMarker
              key={busking.id}
              position={{ lat: busking.lat, lng: busking.lng }}
            >
              <div style={styles.markerBox}>
                <strong>{busking.title}</strong>
                <br />
                <span>{busking.time} ({busking.artist})</span>
              </div>
            </MapMarker>
          ))}
        </Map>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: 'calc(100vh - 40px)', gap: '20px', padding: '20px', backgroundColor: '#f8f9fa', boxSizing: 'border-box' },
  leftPanel: { width: '420px', display: 'flex', flexDirection: 'column', gap: '20px' },
  rightPanel: { flex: 1, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  card: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  title: { margin: '0 0 15px 0', fontSize: '16px', color: '#333' },
  timelineList: { display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px' },
  timelineItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#f1f3f5', borderRadius: '8px' },
  timeBadge: { backgroundColor: '#3182ce', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  artistText: { margin: '4px 0 0 0', fontSize: '13px', color: '#666' },
  emptyText: { color: '#888', fontSize: '14px', textAlign: 'center', marginTop: '20px' },
  markerBox: { padding: '8px', fontSize: '12px', color: '#000', textAlign: 'center' },
  followBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default BuskerSchedule;