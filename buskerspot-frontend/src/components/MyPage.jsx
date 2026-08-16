import React, { useState, useEffect, useRef, useCallback } from 'react';
import './../App.css';

// 배포 환경에서는 REACT_APP_API_URL 환경변수를 사용하고,
// 로컬 개발 환경에서는 localhost:8080으로 폴백합니다.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 💡 오늘 날짜 문자열(YYYY-MM-DD)을 구하는 유틸 함수
const getTodayDateStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MyPage = ({ currentUser, onUpdateUser, onLogout, onDataRefresh }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  
  const [activeModal, setActiveModal] = useState(null);

  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '');
  const [introduction, setIntroduction] = useState(currentUser?.introduction || '');
  const [genre, setGenre] = useState(currentUser?.genre || '');
  const [instagramUrl, setInstagramUrl] = useState(currentUser?.instagramUrl || '');

  const [myPerformances, setMyPerformances] = useState([]);
  const [editingPerformance, setEditingPerformance] = useState(null);
  
  const [actionReason, setActionReason] = useState('');
  const [deletingPerformance, setDeletingPerformance] = useState(null);

  const [tempLat, setTempLat] = useState(37.3827);
  const [tempLng, setTempLng] = useState(127.1189);
  const [mapSearchKeyword, setMapSearchKeyword] = useState('');
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.nickname || '');
     setProfileImage(currentUser.profileImage || '');
      setIntroduction(currentUser.introduction || '');
      setGenre(currentUser.genre || '');
      setInstagramUrl(currentUser.instagramUrl || '');
    }
  }, [currentUser]);

  const fetchMyPerformances = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/performances/my-performances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyPerformances(data.performances);
      }
    } catch (err) {
      console.error('공연 목록을 불러오는 중 오류가 발생했습니다:', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'ARTIST') {
      fetchMyPerformances();
    }
  }, [currentUser, fetchMyPerformances]);

  const initPickerMap = useCallback(() => {
    if (!window.kakao || !window.kakao.maps) return;
    const container = mapContainerRef.current;
    if (!container) return;

    const lat = tempLat || 37.3827;
    const lng = tempLng || 127.1189;

    const options = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 3
    };

    const map = new window.kakao.maps.Map(container, options);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.relayout();
      map.setCenter(new window.kakao.maps.LatLng(lat, lng));
    }, 100);

    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng),
      map: map
    });
    markerInstanceRef.current = marker;

    window.kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      const clickedLat = latlng.getLat();
      const clickedLng = latlng.getLng();

      marker.setPosition(latlng);
      setTempLat(clickedLat);
      setTempLng(clickedLng);

      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(clickedLng, clickedLat, (result, status) => {
        let regionName = '';
        if (status === window.kakao.maps.services.Status.OK) {
          for (let i = 0; i < result.length; i++) {
            if (result[i].region_type === 'H') {
              regionName = result[i].address_name;
              break;
            }
          }
        }
        if (editingPerformance) {
          setEditingPerformance(prev => ({
            ...prev,
            lat: clickedLat,
            lng: clickedLng,
            latitude: clickedLat,
            longitude: clickedLng,
            location_name: regionName || prev.location_name
          }));
        }
      });
    });
  }, [tempLat, tempLng, editingPerformance]);

  useEffect(() => {
    if (activeModal === 'mapSelect') {
      const timer = setTimeout(() => {
        initPickerMap();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeModal, initPickerMap]);

  const handleMapKeywordSearch = (e) => {
    e.preventDefault();
    if (!mapSearchKeyword.trim() || !window.kakao || !window.kakao.maps.services) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(mapSearchKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const place = data[0];
        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);
        const placeName = place.place_name || place.address_name;

        setTempLat(lat);
        setTempLng(lng);

        const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(moveLatLon);
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition(moveLatLon);
          }
        }

        if (editingPerformance) {
          setEditingPerformance(prev => ({
            ...prev,
            lat: lat,
            lng: lng,
            latitude: lat,
            longitude: lng,
            location_name: placeName
          }));
        }
      } else {
        alert('검색 결과가 없습니다. 올바른 장소명을 입력해주세요.');
      }
    });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    try {
    const res = await fetch(`${API_URL}/api/users/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfileImage(data.url);
      } else {
        alert(data.message || '이미지 업로드 실패');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {   // /api/users/profile 로 수정
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
  nickname, 
  profileImage: profileImage,      // profile_image → profileImage
  introduction, 
  genre,
  instagramUrl: instagramUrl       // instagram_url → instagramUrl
})
});

      const data = await res.json();
      if (data.success) {
        alert('프로필이 성공적으로 수정되었습니다.');
        const updatedUser = data.user || { ...currentUser, nickname, profileImage: profileImage, introduction, genre, instagramUrl: instagramUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        } else {
          window.location.reload();
        }
      } else {
        alert(data.message || '프로필 수정 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (data.success) {
        alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        alert(data.message || '비밀번호 변경 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawPassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    if (!window.confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: withdrawPassword })
      });

      const data = await res.json();
      if (data.success) {
        alert('회원 탈퇴가 완료되었습니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        alert(data.message || '회원 탈퇴 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handlePerformanceUpdateSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const payload = {
      title: editingPerformance.title,
      performance_date: editingPerformance.performance_date,
      start_time: editingPerformance.start_time,
      end_time: editingPerformance.end_time,
      location_name: editingPerformance.location_name,
      region: editingPerformance.region,
      latitude: editingPerformance.latitude || editingPerformance.lat,
      longitude: editingPerformance.longitude || editingPerformance.lng,
      reason: actionReason
    };

    try {
      const res = await fetch(`${API_URL}/api/performances/${editingPerformance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert('공연 정보가 수정되었습니다.');
        setActiveModal(null);
        setEditingPerformance(null);
        setActionReason('');
        fetchMyPerformances();
        if (onDataRefresh) onDataRefresh();
      } else {
        alert(data.message || '공연 수정 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handlePerformanceDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deletingPerformance) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/performances/${deletingPerformance.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: actionReason })
      });

      const data = await res.json();
      if (data.success) {
        alert('공연이 취소(삭제)되었습니다.');
        setActiveModal(null);
        setDeletingPerformance(null);
        setActionReason('');
        fetchMyPerformances();
        if (onDataRefresh) onDataRefresh();
      } else {
        alert(data.message || '공연 삭제 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const canModifyOrDelete = (perfDate) => {
    if (!perfDate) return true;
    const perfDateStr = perfDate.split('T')[0];
    const todayStr = getTodayDateStr();
    return todayStr < perfDateStr;
  };

  const todayStr = getTodayDateStr();
  const upcomingMyPerformances = myPerformances.filter((perf) => {
    const perfDateStr = (perf.performance_date || perf.date)?.split('T')[0];
    return !perfDateStr || perfDateStr >= todayStr;
  });

  return (
    <>
      <style>{`
        .bsp-menu-item:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.profileBanner}>
          <div style={styles.profileTopRow}>
            <div style={styles.avatarContainer}>
              {profileImage ? (
                <img src={profileImage} alt="프로필" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatar}>🎸</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={styles.welcomeText}>
                <span style={styles.nicknameText}>{currentUser?.nickname || '회원'}</span>님, 반갑습니다!
              </h2>
              <p style={styles.emailText}>{currentUser?.email || currentUser?.username || 'BuskerSpot 함께하는 중'}</p>
            </div>
          </div>

          <div style={styles.badgeRow}>
            {currentUser?.role === 'ARTIST' && (
              <span style={styles.bannerBadge}>🎤 아티스트 계정</span>
            )}
            {currentUser?.role === 'ARTIST' && genre && (
              <span style={styles.bannerBadge}>🎵 {genre}</span>
            )}
            {currentUser?.instagramUrl && (
              <a 
                href={currentUser.instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={styles.bannerLinkBadge}
              >
                📸 인스타그램 바로가기
              </a>
            )}
          </div>

          {currentUser?.introduction && (
            <div style={styles.introBox}>
              <p style={styles.introText}>"{currentUser.introduction}"</p>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>⚙️ 계정 및 프로필 설정</h3>
          <div style={styles.menuList}>
            <button type="button" style={styles.menuItem} className="bsp-menu-item" onClick={() => setActiveModal('profile')}>
              <span style={styles.menuItemLabel}>✏️ 프로필 정보 수정</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
            <button type="button" style={styles.menuItem} className="bsp-menu-item" onClick={() => setActiveModal('password')}>
              <span style={styles.menuItemLabel}>🔒 비밀번호 변경</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
            {currentUser?.role === 'ARTIST' && (
              <button type="button" style={styles.menuItem} className="bsp-menu-item" onClick={() => setActiveModal('performances')}>
                <span style={styles.menuItemLabel}>🎤 내 공연 관리 (아티스트 전용)</span>
                <span style={styles.menuArrow}>&gt;</span>
              </button>
            )}
            <button type="button" style={{ ...styles.menuItem, color: '#fa5252' }} className="bsp-menu-item" onClick={() => setActiveModal('withdraw')}>
              <span style={styles.menuItemLabel}>⚠️ 회원 탈퇴</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
          </div>
        </div>

        <div style={{ ...styles.card, marginTop: '20px' }}>
          <h3 style={styles.cardTitle}>📌 서비스 정보 및 지원</h3>
          <div style={styles.menuList}>
            <button type="button" style={styles.menuItem} className="bsp-menu-item" onClick={() => setActiveModal('about')}>
              <span style={styles.menuItemLabel}>🎸 BuskerSpot 서비스 소개</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
            <button type="button" style={styles.menuItem} className="bsp-menu-item" onClick={() => setActiveModal('terms')}>
              <span style={styles.menuItemLabel}>📜 이용약관 및 개인정보처리방침</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
            <button type="button" style={styles.menuItem} className="bsp-menu-item" onClick={() => setActiveModal('support')}>
              <span style={styles.menuItemLabel}>🎧 고객센터 및 1:1 문의</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
            <a 
              href="https://www.instagram.com/buskerspot?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ ...styles.menuItem, textDecoration: 'none' }}
              className="bsp-menu-item"
            >
              <span style={styles.menuItemLabel}>📸 관리자 인스타그램</span>
              <span style={styles.menuArrow}>&gt;</span>
            </a>
            <button 
              type="button" 
              style={{ ...styles.menuItem, color: '#fa5252' }} 
              className="bsp-menu-item" 
              onClick={() => {
                if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                  if (onLogout) onLogout();
                }
              }}
            >
              <span style={styles.menuItemLabel}>🚪 로그아웃</span>
              <span style={styles.menuArrow}>&gt;</span>
            </button>
          </div>
        </div>

        <div style={{ ...styles.card, background: '#faf6f2', textAlign: 'center', border: '1px solid #e9e4dc', marginTop: '16px', padding: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#57534e', fontWeight: 700 }}>BuskerSpot v1.0.0 (Live Edition)</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#a8a29e', fontWeight: 600 }}>Street Live Music Platform</p>
        </div>

        {activeModal && (
          <div style={styles.modalOverlay} onClick={() => setActiveModal(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button type="button" style={styles.closeBtn} onClick={() => setActiveModal(null)}>✕</button>
              
              {activeModal === 'profile' && (
                <>
                  <h3 style={styles.modalTitle}>✏️ 프로필 정보 수정</h3>
                  <form onSubmit={handleProfileUpdate}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>닉네임</label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        style={styles.input}
                        placeholder="닉네임을 입력하세요"
                        required
                      />
                    </div>

                    {currentUser?.role === 'ARTIST' && (
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>주요 장르 (카테고리)</label>
                        <select
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          style={styles.input}
                        >
                          <option value="">장르를 선택하세요</option>
                          <option value="Acoustic">어쿠스틱</option>
                          <option value="Band">밴드</option>
                          <option value="Hiphop">힙합</option>
                          <option value="Jazz">재즈</option>
                          <option value="R&B">R&B</option>
                          <option value="Classic">클래식</option>
                          <option value="Other">기타</option>
                        </select>
                      </div>
                    )}

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>인스타그램 프로필 URL</label>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        style={styles.input}
                        placeholder="https://instagram.com/your_id"
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>프로필 사진 이미지 URL 또는 파일</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={profileImage}
                          onChange={(e) => setProfileImage(e.target.value)}
                          style={{ ...styles.input, flex: 1 }}
                          placeholder="https://example.com/image.jpg"
                        />
                        <label style={styles.fileUploadBtn}>
                          파일 선택
                          <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>자기소개</label>
                      <textarea
                        value={introduction}
                        onChange={(e) => setIntroduction(e.target.value)}
                        style={styles.textarea}
                        placeholder="자신이나 팀을 간단히 소개해 주세요!"
                        rows="3"
                      />
                    </div>
                    <button type="submit" style={styles.primaryBtn}>
                      프로필 수정 저장
                    </button>
                  </form>
                </>
              )}

              {activeModal === 'password' && (
                <>
                  <h3 style={styles.modalTitle}>🔒 비밀번호 변경</h3>
                  <form onSubmit={handlePasswordChange}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>현재 비밀번호</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        style={styles.input}
                        placeholder="••••••••"
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>새 비밀번호</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={styles.input}
                        placeholder="8자 이상 입력"
                      />
                    </div>
                    <button type="submit" style={styles.primaryBtn}>
                      비밀번호 변경하기
                    </button>
                  </form>
                </>
              )}

              {activeModal === 'performances' && (
                <>
                  <h3 style={{ ...styles.modalTitle, marginBottom: '16px' }}>🎤 내 공연 관리</h3>
                  {upcomingMyPerformances.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#6c757d', textAlign: 'center', margin: '20px 0', fontWeight: 600 }}>
                      예정된 공연이 없습니다.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {upcomingMyPerformances
                        .slice()
                        .sort((a, b) => {
                          const dateA = new Date(`${a.performance_date?.split('T')[0]}T${a.start_time || '00:00'}`);
                          const dateB = new Date(`${b.performance_date?.split('T')[0]}T${b.start_time || '00:00'}`);
                          return dateA - dateB;
                        })
                        .map((perf) => {
                          const isModifiable = canModifyOrDelete(perf.performance_date);
                          return (
                            <div key={perf.id} style={styles.perfItem}>
                              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#212529', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                    {perf.title}
                                  </span>
                                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap', background: perf.status === 'APPROVED' ? 'rgba(12,166,120,0.1)' : perf.status === 'REJECTED' ? 'rgba(250,82,82,0.1)' : 'rgba(255,140,0,0.1)', color: perf.status === 'APPROVED' ? '#0ca678' : perf.status === 'REJECTED' ? '#fa5252' : '#ff8c00', fontWeight: 800 }}>
                                    {perf.status === 'APPROVED' ? '승인됨' : perf.status === 'REJECTED' ? '반려됨' : '승인 대기중'}
                                  </span>
                                </div>
                                <p style={{ margin: '0 0 2px 0', fontSize: '12.5px', color: '#495057', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  📅 {perf.performance_date?.split('T')[0]} ({perf.start_time} ~ {perf.end_time || ''})
                                </p>
                                <p style={{ margin: 0, fontSize: '12.5px', color: '#6c757d', fontWeight: 600, wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                  📍 [{perf.region}] {perf.location_name}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                {isModifiable ? (
                                  <>
                                    <button
                                      type="button"
                                      style={styles.smallEditBtn}
                                      onClick={() => {
                                        setEditingPerformance({ ...perf });
                                        setTempLat(parseFloat(perf.lat || perf.latitude) || 37.3827);
                                        setTempLng(parseFloat(perf.lng || perf.longitude) || 127.1189);
                                        setActionReason('');
                                        setActiveModal('editPerformance');
                                      }}
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      style={styles.smallDeleteBtn}
                                      onClick={() => {
                                        setDeletingPerformance(perf);
                                        setActionReason('');
                                        setActiveModal('deletePerformance');
                                      }}
                                    >
                                      삭제
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: 700, background: '#f1f3f5', padding: '4px 8px', borderRadius: '999px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                    당일 변경 불가
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {activeModal === 'withdraw' && (
                <>
                  <h3 style={{ ...styles.modalTitle, color: '#fa5252' }}>⚠️ 회원 탈퇴</h3>
                  <p style={styles.subText}>탈퇴 시 계정 정보 및 기록이 삭제됩니다.</p>
                  <div style={styles.inputGroup}>
                    <input
                      type="password"
                      placeholder="비밀번호 확인"
                      value={withdrawPassword}
                      onChange={(e) => setWithdrawPassword(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <button type="button" onClick={handleWithdraw} style={styles.dangerBtn}>
                    회원 탈퇴
                  </button>
                </>
              )}

              {activeModal === 'about' && (
                <>
                  <h3 style={styles.modalTitle}>🎸 BuskerSpot 소개</h3>
                  <p style={styles.modalText}>
                    <b>BuskerSpot</b>은 거리 위의 아티스트와 음악을 사랑하는 관객을 실시간 위치 기반으로 연결해 주는 스트릿 버스킹 플랫폼입니다.<br/><br/>
                    - <b>실시간 라이브</b>: 내 주변에서 펼쳐지는 버스킹을 지도에서 확인하세요.<br/>
                    - <b>아티스트 후원 및 팔로우</b>: 마음에 드는 버스커의 소식을 놓치지 마세요.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <h3 style={styles.modalTitle}>📜 이용약관 및 정책</h3>
                  <p style={styles.modalText}>
                    <b>제1조 (목적)</b> 본 약관은 BuskerSpot 서비스의 이용조건 및 절차, 권리 및 의무를 규정합니다.<br/><br/>
                    <b>제2조 (개인정보보호)</b> 회사는 관련 법령에 따라 회원의 개인정보를 보호하며, 안전한 서비스 제공을 위해 최선을 다합니다.
                  </p>
                </>
              )}

              {activeModal === 'support' && (
                <>
                  <h3 style={styles.modalTitle}>🎧 고객센터 및 문의</h3>
                  <p style={styles.modalText}>
                    이용 중 불편한 점이나 제휴 문의가 있으신가요?<br/><br/>
                    - <b>이메일</b>: kwhkang0925@naver.com<br/>
                    - <b>운영시간</b>: 평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)<br/>
                    언제든 편하게 연락 주시면 친절히 안내해 드리겠습니다.
                  </p>
                </>
              )}

              {activeModal === 'editPerformance' && editingPerformance && (
                <>
                  <h3 style={styles.modalTitle}>🎤 공연 정보 수정</h3>
                  <form onSubmit={handlePerformanceUpdateSubmit}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>공연 제목</label>
                      <input
                        type="text"
                        value={editingPerformance.title || ''}
                        onChange={(e) => setEditingPerformance({ ...editingPerformance, title: e.target.value })}
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>날짜</label>
                        <input
                          type="date"
                          value={editingPerformance.performance_date ? editingPerformance.performance_date.split('T')[0] : ''}
                          onChange={(e) => setEditingPerformance({ ...editingPerformance, performance_date: e.target.value })}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>시작</label>
                        <input
                          type="time"
                          value={editingPerformance.start_time || ''}
                          onChange={(e) => setEditingPerformance({ ...editingPerformance, start_time: e.target.value })}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>종료</label>
                        <input
                          type="time"
                          value={editingPerformance.end_time || ''}
                          onChange={(e) => setEditingPerformance({ ...editingPerformance, end_time: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>상세 위치</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingPerformance.location_name || ''}
                          onChange={(e) => setEditingPerformance({ ...editingPerformance, location_name: e.target.value })}
                          style={{ ...styles.input, flex: 1 }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setTempLat(parseFloat(editingPerformance.lat || editingPerformance.latitude) || 37.3827);
                            setTempLng(parseFloat(editingPerformance.lng || editingPerformance.longitude) || 127.1189);
                            setMapSearchKeyword('');
                            setActiveModal('mapSelect');
                          }}
                          style={styles.mapPickerBtn}
                        >
                          📍 지도
                        </button>
                      </div>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>수정 사유 <span style={{ color: '#fa5252' }}>*</span></label>
                      <textarea
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="수정 사유를 입력해주세요"
                        style={styles.textarea}
                        rows="2"
                        required
                      />
                    </div>
                    <button type="submit" style={styles.primaryBtn}>수정 완료</button>
                  </form>
                </>
              )}

              {activeModal === 'mapSelect' && (
                <>
                  <h3 style={{ ...styles.modalTitle, marginBottom: '8px' }}>📍 공연 위치 지정</h3>
                  <form onSubmit={handleMapKeywordSearch} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={mapSearchKeyword}
                      onChange={(e) => setMapSearchKeyword(e.target.value)}
                      placeholder="장소명 검색"
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <button type="submit" style={{ padding: '0 14px', background: '#212529', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>검색</button>
                  </form>
                  <div ref={mapContainerRef} style={{ width: '100%', height: '300px', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '16px' }} />
                  <button type="button" onClick={() => setActiveModal('editPerformance')} style={{ ...styles.primaryBtn, margin: 0 }}>위치 선택 완료</button>
                </>
              )}

              {activeModal === 'deletePerformance' && deletingPerformance && (
                <>
                  <h3 style={{ ...styles.modalTitle, color: '#fa5252' }}>⚠️ 공연 취소(삭제)</h3>
                  <p style={{ fontSize: '0.9rem', color: '#495057', marginBottom: '16px' }}><b>"{deletingPerformance.title}"</b> 공연을 취소하시겠습니까?</p>
                  <form onSubmit={handlePerformanceDeleteSubmit}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>취소 사유 <span style={{ color: '#fa5252' }}>*</span></label>
                      <textarea
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="취소 사유를 입력해주세요"
                        style={styles.textarea}
                        rows="3"
                        required
                      />
                    </div>
                    <button type="submit" style={styles.dangerBtn}>공연 취소 및 삭제하기</button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: { maxWidth: '700px', margin: '20px auto 80px', padding: '0 16px', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box' },
  profileBanner: { background: 'linear-gradient(135deg, #ff8c00 0%, #0ca678 130%)', color: '#fff', padding: '24px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 6px 18px rgba(255,140,0,0.18)', boxSizing: 'border-box' },
  profileTopRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' },
  avatarContainer: { flexShrink: 0 },
  avatar: { fontSize: '30px', background: 'rgba(255,255,255,0.25)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
  avatarImg: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.7)' },
  welcomeText: { margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', wordBreak: 'keep-all' },
  nicknameText: { color: '#ffffff' },
  emailText: { margin: 0, fontSize: '0.8rem', opacity: 0.9, fontWeight: 600, wordBreak: 'break-all' },
  badgeRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
  bannerBadge: { fontSize: '11px', background: 'rgba(255,255,255,0.22)', padding: '4px 10px', borderRadius: '999px', fontWeight: 800, backdropFilter: 'blur(4px)' },
  bannerLinkBadge: { fontSize: '11px', background: 'rgba(255,255,255,0.22)', padding: '4px 10px', borderRadius: '999px', fontWeight: 800, color: '#fff', textDecoration: 'none', backdropFilter: 'blur(4px)' },
  introBox: { background: 'rgba(0,0,0,0.12)', padding: '10px 14px', borderRadius: '12px', backdropFilter: 'blur(4px)' },
  introText: { margin: 0, fontSize: '0.84rem', opacity: 0.95, fontStyle: 'italic', fontWeight: 600, wordBreak: 'break-all', color: '#fff' },
  card: { background: '#fff', padding: '20px 24px', borderRadius: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #dee2e6', boxSizing: 'border-box', overflow: 'hidden' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 900, color: '#212529', letterSpacing: '-0.02em' },
  subText: { margin: '0 0 12px 0', fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 },
  inputGroup: { marginBottom: '14px', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
  label: { fontSize: '11.5px', fontWeight: 800, color: '#495057', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '11px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #dee2e6', outline: 'none', background: '#f1f3f5', fontWeight: 600, color: '#212529', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '11px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #dee2e6', outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#f1f3f5', fontWeight: 600, color: '#212529', boxSizing: 'border-box' },
  fileUploadBtn: { padding: '10px 14px', fontSize: '12.5px', fontWeight: 700, backgroundColor: '#f1f3f5', color: '#495057', borderRadius: '10px', border: '1px solid #dee2e6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' },
  mapPickerBtn: { padding: '11px 14px', background: '#212529', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap' },
  primaryBtn: { width: '100%', padding: '12px', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '13.5px', backgroundColor: '#ff8c00', color: '#fff', marginTop: '6px', boxShadow: '0 4px 14px rgba(255,140,0,0.25)' },
  dangerBtn: { width: '100%', padding: '12px', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '13.5px', backgroundColor: '#fa5252', color: '#fff', boxShadow: '0 4px 14px rgba(250,82,82,0.25)' },
  menuList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  menuItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 14px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '12px', fontSize: '13.5px', fontWeight: 700, color: '#343a40', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', boxSizing: 'border-box' },
  menuItemLabel: { display: 'flex', alignItems: 'center', gap: '6px' },
  menuArrow: { color: '#adb5bd', fontWeight: 800 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { background: '#fff', width: '90%', maxWidth: '520px', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #dee2e6', boxSizing: 'border-box' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#adb5bd', fontWeight: 800 },
  modalTitle: { margin: '0 0 16px 0', fontSize: '1.15rem', color: '#212529', fontWeight: 900 },
  modalText: { margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#495057', fontWeight: 500 },
  perfItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px', background: '#f1f3f5', borderRadius: '12px', border: '1px solid #dee2e6', boxSizing: 'border-box', gap: '12px', width: '100%' },
  smallEditBtn: { padding: '6px 12px', fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(12,166,120,0.1)', color: '#0ca678', border: '1px solid rgba(12,166,120,0.3)', borderRadius: '8px', cursor: 'pointer' },
  smallDeleteBtn: { padding: '6px 12px', fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(250,82,82,0.1)', color: '#fa5252', border: '1px solid rgba(250,82,82,0.3)', borderRadius: '8px', cursor: 'pointer' }
};

export default MyPage;