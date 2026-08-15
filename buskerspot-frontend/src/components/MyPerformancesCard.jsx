import React from 'react';

export default function MyPerformancesCard({
  myPerformances,
  canModifyOrDelete,
  setEditingPerformance,
  setTempLat,
  setTempLng,
  setActionReason,
  setActiveModal,
  setDeletingPerformance,
  styles
}) {
  return (
    <div style={{ ...styles.card, marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ ...styles.cardTitle, margin: 0 }}>🎤 내 공연 관리 (아티스트 전용)</h3>
        <button
          type="button"
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: '#ff8c00',
            color: '#fff',
            fontWeight: 800,
            fontSize: '12.5px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,140,0,0.25)',
            flexShrink: 0
          }}
          onClick={() => setActiveModal('createPerformance')}
        >
          ➕ 새 공연 등록
        </button>
      </div>

      {myPerformances.length === 0 ? (
        <p style={{ fontSize: '0.9rem', color: '#6c757d', textAlign: 'center', margin: '20px 0', fontWeight: 600 }}>
          등록된 공연이 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myPerformances
            .slice()
            .sort((a, b) => {
              const dateA = new Date(`${a.performance_date?.split('T')[0]}T${a.start_time || '00:00'}`);
              const dateB = new Date(`${b.performance_date?.split('T')[0]}T${b.start_time || '00:00'}`);
              return dateA - dateB;
            })
            .map((perf) => {
              const isModifiable = canModifyOrDelete(perf.performance_date);
              return (
                <div 
                  key={perf.id} 
                  style={{
                    ...styles.perfItem,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}
                >
                  {/* 💡 텍스트 영역이 남은 공간을 채우고 너비 수축이 가능하도록 minWidth: 0 과 flex: 1 부여 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span 
                        style={{ 
                          fontWeight: 800, 
                          fontSize: '1rem', 
                          color: '#212529',
                          wordBreak: 'break-all', // 💡 긴 제목이 잘리거나 넘치지 않고 줄바꿈되도록 처리
                          overflowWrap: 'break-word'
                        }}
                      >
                        {perf.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                          background:
                            perf.status === 'APPROVED'
                              ? 'rgba(12,166,120,0.1)'
                              : perf.status === 'REJECTED'
                              ? 'rgba(250,82,82,0.1)'
                              : 'rgba(255,140,0,0.1)',
                          color:
                            perf.status === 'APPROVED'
                              ? '#0ca678'
                              : perf.status === 'REJECTED'
                              ? '#fa5252'
                              : '#ff8c00',
                          fontWeight: 800
                        }}
                      >
                        {perf.status === 'APPROVED' ? '승인됨' : perf.status === 'REJECTED' ? '반려됨' : '승인 대기중'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#495057', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      📅 {perf.performance_date?.split('T')[0]} ({perf.start_time} ~ {perf.end_time || ''})
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6c757d', fontWeight: 600, wordBreak: 'break-all' }}>
                      📍 [{perf.region}] {perf.location_name} | 장르: {perf.genre}
                    </p>
                  </div>

                  {/* 버튼 영역이 찌그러지지 않도록 flexShrink 설정 */}
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
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#6c757d',
                          fontWeight: 700,
                          background: '#f1f3f5',
                          padding: '4px 8px',
                          borderRadius: '999px',
                          border: '1px solid #dee2e6',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        변경/삭제 불가 (당일)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}