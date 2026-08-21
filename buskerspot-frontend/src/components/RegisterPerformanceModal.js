import React, { useState, useEffect } from 'react';
import LocationPickerModal from './LocationPickerModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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

function RegisterPerformanceModal({ isOpen, onClose, currentUser, onRegisterSuccess }) {
  const isMobile = useIsMobile(860);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  
  const [region, setRegion] = useState('서울');
  const [genre, setGenre] = useState('Acoustic');
  
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSelectLocation = (locationData) => {
    setSelectedCoords({ lat: locationData.lat, lng: locationData.lng });
    
    if (locationData.address) {
      setLocationName(locationData.address);
      const addr = locationData.address;
      
      if (addr.includes('서울')) {
        setRegion('서울');
      } else if (addr.includes('경기') || addr.includes('성남') || addr.includes('분당') || addr.includes('수원') || addr.includes('용인') || addr.includes('고양')) {
        setRegion('경기');
      } else if (addr.includes('인천')) {
        setRegion('인천');
      } else if (addr.includes('부산')) {
        setRegion('부산');
      } else if (addr.includes('대구')) {
        setRegion('대구');
      } else if (addr.includes('광주')) {
        setRegion('광주');
      } else if (addr.includes('대전')) {
        setRegion('대전');
      } else if (addr.includes('울산')) {
        setRegion('울산');
      } else if (addr.includes('세종')) {
        setRegion('세종');
      } else if (addr.includes('강원')) {
        setRegion('강원');
      } else if (addr.includes('충북') || addr.includes('충청북도')) {
        setRegion('충북');
      } else if (addr.includes('충남') || addr.includes('충청남도')) {
        setRegion('충남');
      } else if (addr.includes('전북') || addr.includes('전라북도')) {
        setRegion('전북');
      } else if (addr.includes('전남') || addr.includes('전라남도')) {
        setRegion('전남');
      } else if (addr.includes('경북') || addr.includes('경상북도')) {
        setRegion('경북');
      } else if (addr.includes('경남') || addr.includes('경상남도')) {
        setRegion('경남');
      } else if (addr.includes('제주')) {
        setRegion('제주');
      }
    }
    setIsPickerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다. 먼저 로그인해 주세요.');
      return;
    }

    if (startTime >= endTime) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    if (!selectedCoords) {
      alert('지도에서 정확한 버스킹 위치를 선택해 주세요.');
      return;
    }

    const now = new Date();
    const selectedDateTime = new Date(`${date}T${startTime}:00`);

    if (selectedDateTime < now) {
      alert('현재 시간보다 과거의 시간으로는 공연을 등록할 수 없습니다.');
      return;
    }

    const perfData = {
      title,
      stage_name: currentUser?.nickname || '아티스트',
      date,
      start_time: startTime,
      end_time: endTime,
      region,
      genre,
      location_name: locationName,
      latitude: selectedCoords?.lat,
      longitude: selectedCoords?.lng,
      description,
      user_role: currentUser?.role
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/performances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(perfData)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert('공연 등록 신청이 완료되었습니다! (관리자 승인 후 지도에 표시됩니다)');
        if (onRegisterSuccess) onRegisterSuccess(data.performance);
        onClose();
      } else {
        alert(data.message || '공연 등록 실패');
      }
    } catch (err) {
      console.error(err);
      alert('공연 등록 실패 (서버 연결 오류)');
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', zIndex: 1100
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()} 
          style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: isMobile ? '100%' : '480px',
            maxHeight: isMobile ? '88vh' : 'none',
            overflowY: isMobile ? 'auto' : 'visible',
            borderRadius: isMobile ? '20px 20px 0 0' : '24px',
            padding: isMobile ? '18px' : '28px',
            boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            position: 'relative',
            fontFamily: "'Noto Sans KR', sans-serif"
          }}
        >
          <button 
            onClick={onClose}
            style={{
              position: 'absolute', top: isMobile ? '14px' : '20px', right: isMobile ? '14px' : '20px',
              background: '#f1f3f5', border: 'none',
              width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '50%',
              fontSize: isMobile ? '12px' : '14px', fontWeight: 800, color: '#495057', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e9ecef'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f3f5'; }}
          >
            ✕
          </button>

          <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: '#212529', margin: isMobile ? '0 0 14px 0' : '0 0 20px 0', letterSpacing: '-0.02em' }}>
            🎸 버스킹 공연 등록
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>공연 제목</label>
              <input
                type="text"
                placeholder="예: 수내역 광장 버스킹"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: isMobile ? '9px 12px' : '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '13px' : '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#ff8c00'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#dee2e6'; }}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ flex: isMobile ? '1 1 100%' : 1.2 }}>
                <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>공연 날짜</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', padding: isMobile ? '9px 10px' : '11px 12px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '13px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>시작 시간</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '100%', padding: isMobile ? '9px 8px' : '11px 10px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '13px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>종료 시간</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: '100%', padding: isMobile ? '9px 8px' : '11px 10px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '13px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>공연 지역</label>
                <select 
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)} 
                  style={{ width: '100%', padding: isMobile ? '9px 10px' : '11px 12px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '12.5px' : '13.5px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="부산">부산</option>
                  <option value="대구">대구</option>
                  <option value="광주">광주</option>
                  <option value="대전">대전</option>
                  <option value="울산">울산</option>
                  <option value="세종">세종</option>
                  <option value="강원">강원</option>
                  <option value="충북">충북</option>
                  <option value="충남">충남</option>
                  <option value="전북">전북</option>
                  <option value="전남">전남</option>
                  <option value="경북">경북</option>
                  <option value="경남">경남</option>
                  <option value="제주">제주</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>음악 장르</label>
                <select 
                  value={genre} 
                  onChange={(e) => setGenre(e.target.value)} 
                  style={{ width: '100%', padding: isMobile ? '9px 10px' : '11px 12px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '12.5px' : '13.5px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="Acoustic">어쿠스틱 / 발라드</option>
                  <option value="Band">밴드 / 록</option>
                  <option value="Dance">댄스 / 퍼포먼스</option>
                  <option value="Hiphop">힙합 / 랩</option>
                  <option value="Jazz">재즈 / 블루스</option>
                  <option value="Classic">클래식 / 국악</option>
                  <option value="Other">기타</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>상세 위치 및 지도 선택</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <input
                  type="text"
                  placeholder="상세 위치 (예: 수내역 앞 광장)"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  style={{ flex: isMobile ? '1 1 100%' : 1, padding: isMobile ? '9px 12px' : '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '13px' : '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  style={{
                    padding: isMobile ? '9px 14px' : '0 16px',
                    background: selectedCoords ? '#0ca678' : '#212529',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 700,
                    transition: 'background 0.2s'
                  }}
                >
                  {selectedCoords ? '📍 위치 수정' : '📍 지도에서 선택'}
                </button>
              </div>
            </div>

            {selectedCoords && (
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: '#0ca678', margin: '-4px 0 0 4px', fontWeight: 600 }}>
                ✓ [{region}] 지역 자동 반영됨 (위도 {selectedCoords.lat.toFixed(4)}, 경도 {selectedCoords.lng.toFixed(4)})
              </p>
            )}

            <div>
              <label style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>공연 설명 및 관객 안내</label>
              <textarea
                placeholder="관객분들에게 전할 안내 사항이나 소개를 입력해주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', height: isMobile ? '64px' : '80px', padding: isMobile ? '10px 12px' : '12px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: isMobile ? '12.5px' : '13.5px', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <button 
              type="submit" 
              style={{
                width: '100%', padding: isMobile ? '11px' : '13px', background: 'linear-gradient(135deg, #ff8c00, #ffab40)',
                color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer',
                fontSize: isMobile ? '14px' : '15px', marginTop: '6px', boxShadow: '0 8px 18px -6px rgba(255,140,0,0.5)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              등록하기
            </button>
          </form>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1200 }}>
        <LocationPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectLocation={handleSelectLocation}
          initialRegion={region}
        />
      </div>
    </>
  );
}

export default RegisterPerformanceModal;