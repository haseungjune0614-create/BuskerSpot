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
