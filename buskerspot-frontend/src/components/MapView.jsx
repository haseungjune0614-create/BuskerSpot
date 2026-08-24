import React, { useEffect, useRef } from 'react';

const MapView = ({ performances = [], center = { lat: 37.5665, lng: 126.9780 }, onSelectPerformance }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // 1. 지도 초기화 및 위치 이동
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('Kakao Map SDK가 로드되지 않았습니다.');
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainer.current) return;

      // 지도 세팅 (최초 1회 생성)
      if (!mapInstance.current) {
        const options = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 5,
        };
        mapInstance.current = new window.kakao.maps.Map(mapContainer.current, options);
      } else {
        // center 변경 시 중심 이동
        const moveLatLon = new window.kakao.maps.LatLng(center.lat, center.lng);
        mapInstance.current.setCenter(moveLatLon);
      }
    });
  }, [center]);

  // 2. 공연 목록(performances) 변경 시 마커 재렌더링
  useEffect(() => {
    if (!mapInstance.current || !window.kakao || !window.kakao.maps) return;

    // 기존 마커 모두 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (!performances || performances.length === 0) {
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    let validMarkerCount = 0;

    performances.forEach((perf) => {
      // 📍 DB의 NUMERIC 타입 / null 대비 (parseFloat 필수)
      const rawLat = perf.latitude || perf.lat;
      const rawLng = perf.longitude || perf.lng;

      const lat = parseFloat(rawLat);
      const lng = parseFloat(rawLng);

      // 좌표 검증 (숫자이고 0이 아닌 경우에만 마커 생성)
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const markerPosition = new window.kakao.maps.LatLng(lat, lng);

        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: mapInstance.current,
          title: perf.title,
        });

        // 마커 클릭 시 공연 정보 인포윈도우 표출
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `
            <div style="padding:10px; font-size:12px; color:#333; min-width:150px;">
              <strong style="font-size:14px; color:#e63946;">${perf.title}</strong><br/>
              <span>🎤 ${perf.stage_name || perf.artist_name || '아티스트'}</span><br/>
              <span>📍 ${perf.location_name || perf.region || '위치 미정'}</span>
            </div>
          `,
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(mapInstance.current, marker);
          if (onSelectPerformance) onSelectPerformance(perf);
        });

        markersRef.current.push(marker);
        bounds.extend(markerPosition);
        validMarkerCount++;
      } else {
        console.warn('⚠️ 유효하지 않은 좌표로 인해 마커 생성 생략:', perf);
      }
    });

    // 마커가 1개 이상이면 모든 마커가 보이도록 지도 영역 재조정
    if (validMarkerCount > 0) {
      mapInstance.current.setBounds(bounds);
    }
  }, [performances]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
};

export default MapView;