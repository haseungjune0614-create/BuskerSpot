import React, { useState, useEffect } from 'react';
import PerformanceManage from './PerformanceManage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

function AdminPage() {
  const [tab, setTab] = useState('performances');
  const [performances, setPerformances] = useState([]);
  const [users, setUsers] = useState([]);
  const isMobile = useIsMobile(768);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (tab === 'performances') fetchPerformances();
    if (tab === 'users') fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchPerformances = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/performances`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`JSON이 아닌 응답 수신 (상태 코드 ${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.success) {
        setPerformances(data.performances || []);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('공연 목록 API 호출 에러:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`JSON이 아닌 응답 수신 (상태 코드 ${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        console.warn('회원 목록 불러오기 실패:', data.message);
      }
    } catch (err) {
      console.error('회원 목록 API 호출 에러:', err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/performances/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`JSON이 아닌 응답 수신 (상태 코드 ${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchPerformances();
      } else {
        alert(data.message || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('공연 상태 변경 에러:', err);
      alert(err.message);
    }
  };

  const handleRegionChange = async (id, region) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/performances/${id}/region`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ region })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`JSON이 아닌 응답 수신 (상태 코드 ${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.success) {
        alert('지역이 성공적으로 수정되었습니다.');
        fetchPerformances();
      } else {
        alert(data.message || '지역 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('공연 지역 변경 에러:', err);
      alert(err.message);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`JSON이 아닌 응답 수신 (상태 코드 ${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.message || '권한 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('회원 권한 변경 에러:', err);
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('정말로 이 회원을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`JSON이 아닌 응답 수신 (상태 코드 ${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.success) {
        alert(data.message || '회원이 성공적으로 삭제되었습니다.');
        fetchUsers();
      } else {
        alert(data.message || '회원 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('회원 삭제 에러:', err);
      alert(err.message);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return { background: '#e6fcf5', color: '#0ca678' };
      case 'REJECTED':
        return { background: '#fff5f5', color: '#fa5252' };
      default:
        return { background: '#fff9db', color: '#f59f00' };
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activePerformances = performances.filter((p) => {
    if (!p.performance_date) return true;
    const perfDate = new Date(p.performance_date);
    perfDate.setHours(0, 0, 0, 0);
    return perfDate >= today;
  }).sort((a, b) => {
    const timeA = new Date(`${a.performance_date}T${a.start_time || '00:00'}`);
    const timeB = new Date(`${b.performance_date}T${b.start_time || '00:00'}`);
    return timeA - timeB;
  });

  const regionList = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

  return (
    <div
      style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: isMobile ? '12px 10px 80px' : '20px 20px 60px',
        fontFamily: "'Noto Sans KR', sans-serif",
        boxSizing: 'border-box',
        overflowX: 'hidden',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}
    >
      {/* 상단 헤더 및 탭 네비게이션 */}
      <div
        style={{
          background: '#ffffff',
          padding: isMobile ? '16px' : '24px',
          borderRadius: '16px',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          marginBottom: '16px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: 800,
            color: '#212529',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em'
          }}
        >
          🛡️ BuskerSpot 관리자 대시보드
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap'
          }}
        >
          {[
            { id: 'performances', label: '🎭 공연 승인 관리' },
            { id: 'manage', label: '🛠️ 공연 목록 관리' },
            { id: 'users', label: '👥 회원 관리' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                padding: isMobile ? '12px 14px' : '10px 18px',
                borderRadius: '10px',
                border: tab === item.id ? '1px solid #212529' : '1px solid #dee2e6',
                background: tab === item.id ? '#212529' : '#f8f9fa',
                color: tab === item.id ? '#fff' : '#495057',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '13.5px',
                transition: 'all 0.15s ease',
                width: isMobile ? '100%' : 'auto',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 카드 영역 */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        {/* 모바일 가이드 문구 추가 (테이블 스크롤 안내) */}
        {isMobile && tab !== 'manage' && (
          <div style={{ padding: '10px 16px', background: '#fff3bf', color: '#856404', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #ffeeba' }}>
            👉 표를 좌우로 밀어서(스크롤) 전체 내용을 확인하세요.
          </div>
        )}

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>

          {tab === 'performances' && (
            <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef', color: '#495057', fontSize: '12.5px', fontWeight: 700 }}>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '60px' }}>ID</th>
                  <th style={{ padding: '14px 16px', width: '180px' }}>공연명</th>
                  <th style={{ padding: '14px 16px', width: '120px' }}>아티스트</th>
                  <th style={{ padding: '14px 16px', width: '150px' }}>일시</th>
                  <th style={{ padding: '14px 16px', width: '160px' }}>장소 / 주소</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '110px' }}>지역 분류</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '100px' }}>현재 상태</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '130px' }}>승인 처리</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13.5px', color: '#212529' }}>
                {activePerformances.length > 0 ? (
                  activePerformances.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#adb5bd', textAlign: 'center' }}>{p.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#212529', whiteSpace: 'normal', wordBreak: 'break-all' }}>{p.title}</td>
                      <td style={{ padding: '14px 16px', color: '#495057', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.stage_name}</td>
                      <td style={{ padding: '14px 16px', color: '#495057', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {p.performance_date
                          ? new Date(p.performance_date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
                          : ''} {p.start_time}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#495057', fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-all' }}>{p.location_name}</td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <select
                          value={p.region || '경기'}
                          onChange={(e) => handleRegionChange(p.id, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ced4da', background: '#fff', fontSize: '12.5px', fontWeight: 600, color: '#212529', cursor: 'pointer' }}
                        >
                          {regionList.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, ...getStatusBadgeStyle(p.status) }}>
                          {p.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleStatusChange(p.id, 'APPROVED')}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#e6fcf5', color: '#0ca678', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleStatusChange(p.id, 'REJECTED')}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fff5f5', color: '#fa5252', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#adb5bd', fontSize: '0.95rem', fontWeight: 600 }}>
                      진행 예정인 공연이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'manage' && <PerformanceManage />}

          {tab === 'users' && (
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef', color: '#495057', fontSize: '12.5px', fontWeight: 700 }}>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '60px' }}>ID</th>
                  <th style={{ padding: '14px 16px', width: '200px' }}>이메일</th>
                  <th style={{ padding: '14px 16px', width: '130px' }}>닉네임</th>
                  <th style={{ padding: '14px 16px', width: '160px' }}>카카오 본인 인증</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '100px' }}>현재 권한</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '120px' }}>권한 변경</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>회원 삭제</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13.5px', color: '#212529' }}>
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#adb5bd', textAlign: 'center' }}>{u.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#212529', whiteSpace: 'nowrap' }}>{u.email}</td>
                      <td style={{ padding: '14px 16px', color: '#495057', fontWeight: 600, whiteSpace: 'nowrap' }}>{u.nickname}</td>

                      <td style={{ padding: '14px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {u.role === 'ARTIST' ? (
                          u.kakao_id ? (
                            <span style={{ color: '#0ca678', background: '#e6fcf5', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                              💬 카카오 인증 완료
                            </span>
                          ) : (
                            <span style={{ color: '#fa5252', background: '#fff5f5', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                              ❌ 미인증
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#adb5bd' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, background: '#f1f3f5', color: '#495057', border: '1px solid #dee2e6' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ced4da', background: '#fff', fontSize: '12.5px', fontWeight: 600, color: '#212529', cursor: 'pointer' }}
                        >
                          <option value="USER">USER</option>
                          <option value="ARTIST">ARTIST</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fff5f5', color: '#fa5252', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#adb5bd', fontSize: '0.95rem', fontWeight: 600 }}>
                      가입된 회원 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminPage;