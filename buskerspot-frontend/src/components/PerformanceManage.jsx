import React, { useState, useEffect } from 'react';

export default function PerformanceManage() {
  const [performances, setPerformances] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // 목록 불러오기
  const fetchPerformances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/performances/manage/all', {
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

  // 개별 체크박스 토글
  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(performances.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 단건 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 공연을 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/performances/${id}`, {
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
      const response = await fetch('http://localhost:5000/api/performances/batch-delete', {
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

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>공연 목록 관리 및 삭제</h2>
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
                checked={performances.length > 0 && selectedIds.length === performances.length}
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
          {performances.length > 0 ? (
            performances.map((perf) => (
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
              <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>등록된 공연이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}