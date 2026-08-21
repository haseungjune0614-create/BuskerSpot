// src/components/AdminMessageSend.jsx
//
// 사용법: AdminPage.jsx 안에 탭/섹션으로 추가하세요.
//   import AdminMessageSend from './AdminMessageSend';
//   <AdminMessageSend />

import React, { useState } from 'react';
import { sendAdminMessage } from '../api/messageApi';
import './AdminMessageSend.css';

export default function AdminMessageSend() {
  const [targetType, setTargetType] = useState('ALL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setResult({ type: 'error', message: '제목과 내용을 입력해주세요.' });
      return;
    }
    if (targetType === 'INDIVIDUAL' && !targetUserId) {
      setResult({ type: 'error', message: '대상 사용자 ID를 입력해주세요.' });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      await sendAdminMessage({
        title,
        content,
        targetType,
        targetUserId: targetType === 'INDIVIDUAL' ? Number(targetUserId) : null,
      });
      setResult({ type: 'success', message: '메시지를 발송했습니다.' });
      setTitle('');
      setContent('');
      setTargetUserId('');
    } catch (err) {
      setResult({ type: 'error', message: err.message || '발송에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-message-send" onSubmit={handleSubmit}>
      <h3>메시지 발송</h3>

      <div className="field-group">
        <label>발송 대상</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="targetType"
              value="ALL"
              checked={targetType === 'ALL'}
              onChange={() => setTargetType('ALL')}
            />
            전체 사용자
          </label>
          <label>
            <input
              type="radio"
              name="targetType"
              value="INDIVIDUAL"
              checked={targetType === 'INDIVIDUAL'}
              onChange={() => setTargetType('INDIVIDUAL')}
            />
            특정 사용자
          </label>
        </div>
      </div>

      {targetType === 'INDIVIDUAL' && (
        <div className="field-group">
          <label htmlFor="targetUserId">대상 사용자 ID</label>
          <input
            id="targetUserId"
            type="number"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="예: 42"
          />
        </div>
      )}

      <div className="field-group">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="메시지 제목"
        />
      </div>

      <div className="field-group">
        <label htmlFor="content">내용</label>
        <textarea
          id="content"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지 내용을 입력하세요"
        />
      </div>

      {result && (
        <div className={`admin-message-result ${result.type}`}>{result.message}</div>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? '발송 중...' : '발송하기'}
      </button>
    </form>
  );
}
