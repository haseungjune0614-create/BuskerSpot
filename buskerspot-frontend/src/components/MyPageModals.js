import React from 'react';

export default function MyPageModals({
  activeModal,
  setActiveModal,
  editingPerformance,
  setEditingPerformance,
  newPerformance,
  setNewPerformance,
  handlePerformanceUpdateSubmit,
  handlePerformanceCreateSubmit,
  styles
}) {
  if (!activeModal) return null;

  return (
    <div style={styles.modalOverlay} onClick={() => setActiveModal(null)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={styles.closeBtn} onClick={() => setActiveModal(null)}>✕</button>
        
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
              <div style={styles.inputGroup}>
                <label style={styles.label}>공연 날짜</label>
                <input
                  type="date"
                  value={editingPerformance.performance_date ? editingPerformance.performance_date.split('T')[0] : ''}
                  onChange={(e) => setEditingPerformance({ ...editingPerformance, performance_date: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>시작 시간</label>
                  <input
                    type="time"
                    value={editingPerformance.start_time || ''}
                    onChange={(e) => setEditingPerformance({ ...editingPerformance, start_time: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>종료 시간</label>
                  <input
                    type="time"
                    value={editingPerformance.end_time || ''}
                    onChange={(e) => setEditingPerformance({ ...editingPerformance, end_time: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>장소 이름</label>
                <input
                  type="text"
                  value={editingPerformance.location_name || ''}
                  onChange={(e) => setEditingPerformance({ ...editingPerformance, location_name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>상세 설명</label>
                <textarea
                  value={editingPerformance.description || ''}
                  onChange={(e) => setEditingPerformance({ ...editingPerformance, description: e.target.value })}
                  style={styles.textarea}
                  rows="3"
                />
              </div>
              <button type="submit" style={styles.primaryBtn}>
                수정 완료
              </button>
            </form>
          </>
        )}

        {activeModal === 'createPerformance' && (
          <>
            <h3 style={styles.modalTitle}>➕ 새 공연 등록</h3>
            <form onSubmit={handlePerformanceCreateSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>공연 제목</label>
                <input
                  type="text"
                  value={newPerformance.title}
                  onChange={(e) => setNewPerformance({ ...newPerformance, title: e.target.value })}
                  style={styles.input}
                  placeholder="공연 제목을 입력하세요"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>공연 날짜</label>
                <input
                  type="date"
                  value={newPerformance.performance_date}
                  onChange={(e) => setNewPerformance({ ...newPerformance, performance_date: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>시작 시간</label>
                  <input
                    type="time"
                    value={newPerformance.start_time}
                    onChange={(e) => setNewPerformance({ ...newPerformance, start_time: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>종료 시간</label>
                  <input
                    type="time"
                    value={newPerformance.end_time}
                    onChange={(e) => setNewPerformance({ ...newPerformance, end_time: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>지역</label>
                  <input
                    type="text"
                    value={newPerformance.region}
                    onChange={(e) => setNewPerformance({ ...newPerformance, region: e.target.value })}
                    style={styles.input}
                    placeholder="예: 서울, 성남"
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>장르</label>
                  <input
                    type="text"
                    value={newPerformance.genre}
                    onChange={(e) => setNewPerformance({ ...newPerformance, genre: e.target.value })}
                    style={styles.input}
                    placeholder="예: 어쿠스틱, 밴드"
                    required
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>장소 이름</label>
                <input
                  type="text"
                  value={newPerformance.location_name}
                  onChange={(e) => setNewPerformance({ ...newPerformance, location_name: e.target.value })}
                  style={styles.input}
                  placeholder="예: 홍대 거리 / 야탑광장"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>상세 설명</label>
                <textarea
                  value={newPerformance.description}
                  onChange={(e) => setNewPerformance({ ...newPerformance, description: e.target.value })}
                  style={styles.textarea}
                  placeholder="공연에 대한 간단한 소개를 적어주세요."
                  rows="3"
                />
              </div>
              <button type="submit" style={styles.primaryBtn}>
                등록하기
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}