import React from 'react';

export default function ProfileEditCard({
  currentUser,
  nickname,
  setNickname,
  genre,
  setGenre,
  instagramUrl,
  setInstagramUrl,
  profileImage,
  setProfileImage,
  handleImageFileChange,
  introduction,
  setIntroduction,
  handleProfileUpdate,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  handlePasswordChange,
  styles
}) {
  return (
    <div style={styles.column}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>✏️ 프로필 정보 수정</h3>
        <form onSubmit={handleProfileUpdate}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={styles.input}
              placeholder="닉네임을 입력하세요"
              required
            />
          </div>

          {currentUser?.role === 'ARTIST' && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>주요 장르 (카테고리)</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  style={styles.input}
                >
                  <option value="">장르를 선택하세요</option>
                  <option value="Acoustic">어쿠스틱</option>
                  <option value="Band">밴드</option>
                  <option value="Hiphop">힙합</option>
                  <option value="Jazz">재즈</option>
                  <option value="R&B">R&B</option>
                  <option value="Classic">클래식</option>
                  <option value="Other">기타</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>인스타그램 프로필 URL</label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  style={styles.input}
                  placeholder="https://instagram.com/your_id 또는 아이디"
                />
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>프로필 사진 이미지 URL 또는 파일</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
                placeholder="https://example.com/image.jpg"
              />
              <label style={styles.fileUploadBtn}>
                파일 선택
                <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>자기소개</label>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              style={styles.textarea}
              placeholder="자신이나 팀을 간단히 소개해 주세요!"
              rows="3"
            />
          </div>
          <button type="submit" style={styles.primaryBtn}>
            프로필 수정 저장
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🔒 비밀번호 변경</h3>
        <form onSubmit={handlePasswordChange}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="8자 이상 입력"
            />
          </div>
          <button type="submit" style={styles.primaryBtn}>
            비밀번호 변경하기
          </button>
        </form>
      </div>
    </div>
  );
}