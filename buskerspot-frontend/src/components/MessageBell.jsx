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
