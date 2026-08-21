#!/bin/bash
# 사용법: buskerspot-frontend 폴더 안에서 실행
#   cd ~/band_bumsu/buskerspot-frontend
#   bash setup_frontend_message.sh
set -e

BASE="src"
mkdir -p "$BASE/components"
mkdir -p "$BASE/api"

# ---------- api/messageApi.js ----------
cat > "$BASE/api/messageApi.js" << 'EOF'
// src/api/messageApi.js
//
// TODO: 프로젝트에서 실제로 JWT 토큰을 어떻게 저장/전달하는지 확인 후
//       getAuthHeader() 부분만 맞게 수정하면 나머지 코드는 그대로 써도 됩니다.

const BASE_URL = process.env.REACT_APP_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('token'); // TODO: 실제 저장 키 이름 확인
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `요청 실패 (${res.status})`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function fetchMyMessages(page = 0, size = 20) {
  return request(`/api/messages?page=${page}&size=${size}`);
}

export function fetchUnreadCount() {
  return request('/api/messages/unread-count');
}

export function readMessage(recipientId) {
  return request(`/api/messages/${recipientId}`);
}

export function sendAdminMessage({ title, content, targetType, targetUserId }) {
  return request('/api/admin/messages', {
    method: 'POST',
    body: JSON.stringify({ title, content, targetType, targetUserId }),
  });
}
EOF

# ---------- components/MessageBell.jsx ----------
cat > "$BASE/components/MessageBell.jsx" << 'EOF'
// src/components/MessageBell.jsx
//
// 사용법: Navbar.jsx 에서 기존 알림 아이콘 바로 옆에 추가하세요.
//   import MessageBell from './MessageBell';
//   <NotificationIcon />
//   <MessageBell />

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchMyMessages, fetchUnreadCount, readMessage } from '../api/messageApi';
import './MessageBell.css';

export default function MessageBell() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (e) {
      console.error('안 읽은 메시지 수 조회 실패', e);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyMessages(0, 20);
      setMessages(data?.content ?? []);
    } catch (e) {
      setError('메시지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      loadMessages();
    }
  };

  const handleSelectMessage = async (msg) => {
    if (!msg.isRead) {
      try {
        await readMessage(msg.recipientId);
        setMessages((prev) =>
          prev.map((m) => (m.recipientId === msg.recipientId ? { ...m, isRead: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error('읽음 처리 실패', e);
      }
    }
  };

  return (
    <div className="message-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="message-bell-button"
        onClick={toggleOpen}
        aria-label="메시지함 열기"
      >
        <span className="message-bell-icon" aria-hidden="true">✉️</span>
        {unreadCount > 0 && (
          <span className="message-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="message-bell-panel">
          <div className="message-bell-header">메시지함</div>

          {loading && <div className="message-bell-empty">불러오는 중...</div>}
          {!loading && error && <div className="message-bell-empty">{error}</div>}
          {!loading && !error && messages.length === 0 && (
            <div className="message-bell-empty">받은 메시지가 없습니다.</div>
          )}

          {!loading && !error && messages.length > 0 && (
            <ul className="message-bell-list">
              {messages.map((msg) => (
                <li
                  key={msg.recipientId}
                  className={`message-bell-item ${msg.isRead ? '' : 'unread'}`}
                  onClick={() => handleSelectMessage(msg)}
                >
                  <div className="message-bell-item-title">
                    {!msg.isRead && <span className="dot" />}
                    {msg.title}
                  </div>
                  <div className="message-bell-item-content">{msg.content}</div>
                  <div className="message-bell-item-date">
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
EOF

# ---------- components/MessageBell.css ----------
cat > "$BASE/components/MessageBell.css" << 'EOF'
.message-bell-wrapper {
  position: relative;
  display: inline-block;
}

.message-bell-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 6px;
  line-height: 1;
}

.message-bell-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #e74c3c;
  color: #fff;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  min-width: 16px;
  text-align: center;
}

.message-bell-panel {
  position: absolute;
  top: 40px;
  right: 0;
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}

.message-bell-header {
  padding: 12px 16px;
  font-weight: 700;
  border-bottom: 1px solid #f0f0f0;
}

.message-bell-empty {
  padding: 24px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.message-bell-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.message-bell-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}

.message-bell-item:hover {
  background: #fafafa;
}

.message-bell-item.unread {
  background: #f5f9ff;
}

.message-bell-item-title {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-bell-item-title .dot {
  width: 6px;
  height: 6px;
  background: #3478f6;
  border-radius: 50%;
  display: inline-block;
}

.message-bell-item-content {
  font-size: 12.5px;
  color: #555;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.message-bell-item-date {
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
}
EOF

# ---------- components/AdminMessageSend.jsx ----------
cat > "$BASE/components/AdminMessageSend.jsx" << 'EOF'
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
EOF

# ---------- components/AdminMessageSend.css ----------
cat > "$BASE/components/AdminMessageSend.css" << 'EOF'
.admin-message-send {
  max-width: 480px;
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  background: #fff;
}

.admin-message-send h3 {
  margin: 0 0 16px;
  font-size: 16px;
}

.field-group {
  margin-bottom: 14px;
}

.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.radio-group {
  display: flex;
  gap: 16px;
  font-size: 13px;
  font-weight: 400;
}

.field-group input[type='text'],
.field-group input[type='number'],
.field-group textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.admin-message-result {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.admin-message-result.success {
  background: #eafbea;
  color: #1f8b3d;
}

.admin-message-result.error {
  background: #fdecea;
  color: #c0392b;
}

.admin-message-send button[type='submit'] {
  background: #3478f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.admin-message-send button[type='submit']:disabled {
  background: #a9c3f5;
  cursor: not-allowed;
}
EOF

echo "완료: MessageBell(2), AdminMessageSend(2), messageApi.js 가 생성되었습니다."
echo "→ Navbar.jsx 에 <MessageBell /> 추가, AdminPage.jsx 에 <AdminMessageSend /> 추가하는 걸 잊지 마세요."
