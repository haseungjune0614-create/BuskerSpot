import React, { useState, useEffect } from 'react';

export default function PerformanceManage() {
  const [performances, setPerformances] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [subTab, setSubTab] = useState('upcoming'); // 'upcoming': 예정된 공연, 'past': 지난 공연

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  // 목록 불러오기
  const fetchPerformances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/performances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPerformances(data.performances);
      }
    } catch (error) {
      console.error('목록 로딩 실패:', error);
    }
  };

  useEffect(() => {
    fetchPerformances();
  }, []);

  // 오늘 날짜 설정 (시간 비교 제외)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 예정된 공연 (오늘 날짜 이후 혹은 날짜가 없는 경우)
  const upcomingPerformances = performances.filter((p) => {
    if (!p.performance_date) return true;
    const perfDate = new Date(p.performance_date);
    perfDate.setHours(0, 0, 0, 0);
    return perfDate >= today;
  });

  // 지난 공연 (오늘 날짜 이전)
  const pastPerformances = performances.filter((p) => {
    if (!p.performance_date) return false;
    const perfDate = new Date(p.performance_date);
    perfDate.setHours(0, 0, 0, 0);
    return perfDate < today;
  });

  // 현재 활성화된 탭에 따른 리스트
  const currentList = subTab === 'upcoming' ? upcomingPerformances : pastPerformances;

  // 개별 체크박스 토글
  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 현재 탭의 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentList.map((p) => p.id);
      // 기존 선택된 항목들과 중복되지 않도록 합침
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    } else {
      const currentIds = currentList.map((p) => p.id);
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    }
  };

  // 단건 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 공연을 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/performances/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('삭제되었습니다.');
        fetchPerformances();
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  // 선택 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      alert('삭제할 공연을 선택해주세요.');
      return;
    }
    if (!window.confirm(`선택한 ${selectedIds.length}개의 공연을 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/performances/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await response.json();
      if (data.success) {
        alert('선택된 공연들이 삭제되었습니다.');
        fetchPerformances();
        setSelectedIds([]);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
    }
  };

  // 현재 탭의 모든 항목이 선택되었는지 확인
  const isAllSelected = 
    currentList.length > 0 && 
    currentList.every((p) => selectedIds.includes(p.id));

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>공연 목록 관리 및 삭제</h2>

      {/* 서브 탭 버튼 영역 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setSubTab('upcoming')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: subTab === 'upcoming' ? '1px solid #212529' : '1px solid #dee2e6',
            background: subTab === 'upcoming' ? '#212529' : '#f8f9fa',
            color: subTab === 'upcoming' ? '#fff' : '#495057',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          예정된 공연 ({upcomingPerformances.length})
        </button>
        <button
          onClick={() => setSubTab('past')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: subTab === 'past' ? '1px solid #212529' : '1px solid #dee2e6',
            background: subTab === 'past' ? '#212529' : '#f8f9fa',
            color: subTab === 'past' ? '#fff' : '#495057',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          지난 공연 ({pastPerformances.length})
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={handleBatchDelete}
          style={{ backgroundColor: '#ff4d4d', color: '#fff', padding: '8px 15px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          선택 항목 삭제
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={isAllSelected}
              />
            </th>
            <th style={{ padding: '10px' }}>ID</th>
            <th style={{ padding: '10px' }}>제목</th>
            <th style={{ padding: '10px' }}>아티스트</th>
            <th style={{ padding: '10px' }}>날짜</th>
            <th style={{ padding: '10px' }}>시작시간</th>
            <th style={{ padding: '10px' }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {currentList.length > 0 ? (
            currentList.map((perf) => (
              <tr key={perf.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(perf.id)}
                    onChange={() => handleCheckboxChange(perf.id)}
                  />
                </td>
                <td style={{ padding: '10px' }}>{perf.id}</td>
                <td style={{ padding: '10px' }}>{perf.title}</td>
                <td style={{ padding: '10px' }}>{perf.stage_name || perf.organizer_name}</td>
                <td style={{ padding: '10px' }}>{perf.performance_date?.slice(0, 10)}</td>
                <td style={{ padding: '10px' }}>{perf.start_time?.slice(0, 5)}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => handleDelete(perf.id)}
                    style={{ padding: '5px 10px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>
                {subTab === 'upcoming' ? '예정된 공연이 없습니다.' : '지난 공연 내역이 없습니다.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}