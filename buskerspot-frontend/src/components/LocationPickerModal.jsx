import React, { useState, useEffect, useRef } from 'react';

const LocationPickerModal = ({ isOpen, onClose, onSelectLocation }) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPlace, setSelectedPlace] = useState({
    location_name: '',
    lat: null,
    lng: null,
  });

  // 모달이 열릴 때 지도 초기화
  useEffect(() => {
    if (!isOpen) return;

    const { kakao } = window;
    if (!kakao || !kakao.maps) {
      console.error('카카오 맵 SDK가 로드되지 않았습니다.');
      return;
    }

    // 지도 기본 옵션 (초기 중심 위치: 홍대입구역)
    const options = {
      center: new kakao.maps.LatLng(37.5565, 126.9244),
      level: 3,
    };

    const createdMap = new kakao.maps.Map(mapContainer.current, options);
    const createdMarker = new kakao.maps.Marker({
      position: createdMap.getCenter(),
    });

    createdMarker.setMap(createdMap);
    setMap(createdMap);
    setMarker(createdMarker);

    // 지도 클릭 이벤트 등록 (클릭한 위치로 마커 이동 및 좌표 추출)
    kakao.maps.event.addListener(createdMap, 'click', (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      createdMarker.setPosition(latlng);

      // 클릭한 위치의 좌표를 역지오코딩하여 주소/장소명 추출
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
        let name = '선택한 위치';
        if (status === kakao.maps.services.Status.OK && result[0]) {
          name = result[0].road_address
            ? result[0].road_address.address_name
            : result[0].address.address_name;
        }

        setSelectedPlace({
          location_name: name,
          lat: latlng.getLat(),
          lng: latlng.getLng(),
        });
      });
    });
  }, [isOpen]);

  // 키워드 검색 처리
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchKeyword.trim() || !map) return;

    const { kakao } = window;
    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === kakao.maps.services.Status.OK && data.length > 0) {
        const firstPlace = data[0];
        const moveLatLng = new kakao.maps.LatLng(firstPlace.y, firstPlace.x);

        map.setCenter(moveLatLng);
        marker.setPosition(moveLatLng);

        setSelectedPlace({
          location_name: firstPlace.place_name || firstPlace.address_name,
          lat: parseFloat(firstPlace.y),
          lng: parseFloat(firstPlace.x),
        });
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  // 위치 선택 완료 처리
  const handleConfirm = () => {
    if (!selectedPlace.lat || !selectedPlace.lng) {
      alert('지도에서 위치를 클릭하거나 장소를 검색해 주세요.');
      return;
    }
    // lat/lng 과 latitude/longitude 를 모두 보장하여 전달
  onSelectLocation({
    location_name: selectedPlace.location_name,
    lat: selectedPlace.lat,
    lng: selectedPlace.lng,
    latitude: selectedPlace.lat,
    longitude: selectedPlace.lng,
  });
  onClose();
};

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3>📍 공연 위치 선택</h3>

        {/* 장소 검색 폼 */}
        <form onSubmit={handleSearch} style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="장소명 또는 주소 검색 (예: 홍대 걷고싶은거리)"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <button type="submit" style={btnStyle}>검색</button>
        </form>

        {/* 카카오 맵 영역 */}
        <div ref={mapContainer} style={{ width: '100%', height: '350px', borderRadius: '8px' }}></div>

        {/* 선택한 장소 정보 표시 */}
        <div style={{ marginTop: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
          <strong>선택된 위치:</strong> {selectedPlace.location_name || '지도를 클릭하여 위치를 선택하세요.'}
        </div>

        {/* 버튼 영역 */}
        <div style={{ marginTop: '15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ ...btnStyle, backgroundColor: '#888' }}>취소</button>
          <button type="button" onClick={handleConfirm} style={{ ...btnStyle, backgroundColor: '#4CAF50' }}>이 위치로 설정</button>
        </div>
      </div>
    </div>
  );
};

// 임시 스타일 정의
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  background: '#fff', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px'
};
const btnStyle = {
  padding: '8px 14px', border: 'none', borderRadius: '4px', background: '#2196F3', color: '#fff', cursor: 'pointer'
};

export default LocationPickerModal;