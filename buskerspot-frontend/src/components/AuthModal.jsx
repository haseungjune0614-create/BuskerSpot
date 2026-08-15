import React, { useState, useEffect } from 'react';
import './../App.css';

// 배포 환경에서는 REACT_APP_API_URL 환경변수를 사용하고,
// 로컬 개발 환경에서는 localhost:5000으로 폴백합니다.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AuthModal({ isOpen, onClose, onLoginSuccess, pendingKakaoData, onKakaoDataConsumed }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // 💡 비밀번호 찾기 모드 상태 추가
  
  // 입력 필드 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('USER'); // 'USER' | 'ARTIST'

  // 이메일 인증 관련 상태
  const [emailCode, setEmailCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);

  // 카카오 인증 완료 여부 상태 (아티스트 전용)
  const [isKakaoVerified, setIsKakaoVerified] = useState(false);
  const [kakaoProfileData, setKakaoProfileData] = useState(null);

  // 메시지 상태
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 💡 카카오 인증 후 돌아왔을 때 상태 및 세션에 저장해둔 폼 데이터 복원
  useEffect(() => {
    if (pendingKakaoData) {
      setIsSignUp(true);
      setIsForgotPassword(false);
      setRole('ARTIST');
      setKakaoProfileData(pendingKakaoData);
      setIsKakaoVerified(true);

      // sessionStorage에 저장해둔 입력값 복원
      const savedForm = sessionStorage.getItem('kakao_signup_form');
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        setEmail(parsed.email || '');
        setNickname(parsed.nickname || '');
        setPassword(parsed.password || '');
        if (parsed.isEmailVerified) {
          setIsEmailVerified(true);
          setIsEmailCodeSent(true);
        }
        sessionStorage.removeItem('kakao_signup_form'); // 복원 후 삭제
      }

      // 💡 부모의 pendingKakaoData를 즉시 비워서 재사용 방지
      if (onKakaoDataConsumed) {
        onKakaoDataConsumed();
      }
    }
  }, [pendingKakaoData, onKakaoDataConsumed]);

  if (!isOpen) return null;

  // 입력 및 상태 초기화 후 모달 닫기
  const handleClose = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSignUp(false);
    setIsForgotPassword(false);
    setEmail('');
    setPassword('');
    setNickname('');
    setRole('USER');
    setEmailCode('');
    setIsEmailVerified(false);
    setIsEmailCodeSent(false);
    setIsKakaoVerified(false);
    setKakaoProfileData(null);
    onClose();
  };

  // 1. 이메일 인증번호 발송 요청
  const handleSendEmailCode = async () => {
    if (!email) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/send-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEmailCodeSent(true);
        setSuccessMessage('이메일로 인증번호가 발송되었습니다.');
      } else {
        setErrorMessage(data.message || '이메일 인증번호 발송 실패');
      }
    } catch (err) {
      setErrorMessage('서버 통신 오류 (이메일 인증 발송)');
    }
  };

  // 2. 이메일 인증번호 검증 요청
  const handleVerifyEmailCode = async () => {
    if (!emailCode) {
      setErrorMessage('이메일 인증번호를 입력해주세요.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: emailCode }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEmailVerified(true);
        setSuccessMessage('이메일 인증이 완료되었습니다.');
      } else {
        setErrorMessage(data.message || '이메일 인증 실패');
      }
    } catch (err) {
      setErrorMessage('서버 통신 오류 (이메일 인증 검증)');
    }
  };

  // 💡 3. 비밀번호 찾기 (임시 비밀번호 발급) 요청
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('가입하신 이메일을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('임시 비밀번호가 이메일로 전송되었습니다. 로그인 후 변경해 주세요.');
      } else {
        setErrorMessage(data.message || '임시 비밀번호 발급 실패');
      }
    } catch (err) {
      setErrorMessage('서버 통신 오류 (비밀번호 찾기)');
    }
  };

  // 카카오 간편 인증 요청
  const handleKakaoAuth = () => {
    setErrorMessage('');
    setSuccessMessage('');

    const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;

    if (!REST_API_KEY) {
      setErrorMessage('카카오 REST API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      return;
    }

    // 현재 작성 중인 폼 내용 임시 저장
    const formData = {
      email,
      nickname,
      password,
      isEmailVerified,
    };
    sessionStorage.setItem('kakao_signup_form', JSON.stringify(formData));

    // 배포 환경에서는 REACT_APP_KAKAO_REDIRECT_URI를 사용하고,
    // 없으면 현재 접속 중인 origin 기준으로 콜백 URL을 생성합니다.
    const REDIRECT_URI =
      process.env.REACT_APP_KAKAO_REDIRECT_URI ||
      `${window.location.origin}/oauth/kakao/callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    // 카카오 인증 페이지로 이동
    window.location.href = kakaoAuthUrl;
  };

  // 회원가입 및 로그인 처리 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isSignUp) {
      // 이메일 인증은 공통 필수
      if (!isEmailVerified) {
        setErrorMessage('이메일 인증을 완료해 주세요.');
        return;
      }

      // 아티스트인 경우에만 카카오 인증 필수 검사
      if (role === 'ARTIST' && !isKakaoVerified) {
        setErrorMessage('아티스트 가입 시 카카오톡 인증은 필수입니다.');
        return;
      }

      // 회원가입 API 호출
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            nickname, 
            role, 
            kakaoData: role === 'ARTIST' ? kakaoProfileData : null 
          }),
        });
        const data = await response.json();
        if (data.success) {
          alert('회원가입이 완료되었습니다! 로그인해 주세요.');
          setIsSignUp(false); // 로그인 탭으로 전환
          setPassword('');
          setIsEmailVerified(false);
          setIsKakaoVerified(false);
          setKakaoProfileData(null); // 💡 회원가입 완료 후 카카오 프로필 데이터 초기화
        } else {
          setErrorMessage(data.message || '회원가입 실패');
        }
      } catch (err) {
        setErrorMessage('서버 연결 실패 (회원가입)');
      }
    } else {
      // 로그인 처리 API 호출
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
          handleClose();
          window.location.reload();
        } else {
          setErrorMessage(data.message || '로그인 실패');
        }
      } catch (err) {
        setErrorMessage('서버 통신 오류 (로그인)');
      }
    }
  };

  return (
    <div 
      onClick={handleClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: '#ffffff', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto',
          borderRadius: '24px', padding: '28px', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          position: 'relative', fontFamily: "'Noto Sans KR', sans-serif"
        }}
      >
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute', top: '20px', right: '20px', background: '#f1f3f5',
            border: 'none', width: '32px', height: '32px', borderRadius: '50%',
            fontSize: '14px', fontWeight: 800, color: '#495057', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e9ecef'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f3f5'; }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#212529', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
          {isForgotPassword ? '비밀번호 찾기' : isSignUp ? '회원가입' : '로그인'}
        </h2>

        {errorMessage && <p style={{ color: '#fa5252', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{errorMessage}</p>}
        {successMessage && <p style={{ color: '#0ca678', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{successMessage}</p>}

        {/* 💡 비밀번호 찾기 뷰 */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>가입 이메일 주소</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                required
              />
            </div>
            <button 
              type="submit" 
              style={{
                width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ff8c00, #ffab40)',
                color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer',
                fontSize: '15px', marginTop: '6px', boxShadow: '0 8px 18px -6px rgba(255,140,0,0.5)'
              }}
            >
              임시 비밀번호 발급받기
            </button>
            <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 }}>
              비밀번호가 기억나셨나요?{' '}
              <span 
                style={{ color: '#ff8c00', cursor: 'pointer', fontWeight: 800 }} 
                onClick={() => { 
                  setIsForgotPassword(false); 
                  setErrorMessage(''); 
                  setSuccessMessage(''); 
                }}
              >
                로그인으로 돌아가기
              </span>
            </p>
          </form>
        ) : (
          /* 기존 로그인 및 회원가입 뷰 */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isSignUp && (
              <>
                {/* 유저 역할 선택 버튼 */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    style={{
                      flex: 1, padding: '11px', borderRadius: '12px', border: role === 'USER' ? '2px solid #ff8c00' : '1px solid #dee2e6',
                      background: role === 'USER' ? 'rgba(255,140,0,0.08)' : '#fff',
                      color: role === 'USER' ? '#ff8c00' : '#495057', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', transition: 'all 0.2s'
                    }}
                  >
                    👤 일반 관객
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ARTIST')}
                    style={{
                      flex: 1, padding: '11px', borderRadius: '12px', border: role === 'ARTIST' ? '2px solid #ff8c00' : '1px solid #dee2e6',
                      background: role === 'ARTIST' ? 'rgba(255,140,0,0.08)' : '#fff',
                      color: role === 'ARTIST' ? '#ff8c00' : '#495057', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', transition: 'all 0.2s'
                    }}
                  >
                    🎤 아티스트
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>닉네임</label>
                  <input
                    type="text"
                    placeholder="닉네임 (2자 이상)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    required
                  />
                </div>
              </>
            )}

            {/* 1. 이메일 & 이메일 인증번호 입력 영역 (공통) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>이메일 주소</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  disabled={isEmailVerified}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: '14px', background: isEmailVerified ? '#f1f3f5' : '#fff', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
                {isSignUp && !isEmailVerified && (
                  <button type="button" onClick={handleSendEmailCode} style={{ padding: '0 16px', background: '#495057', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                    발송
                  </button>
                )}
              </div>
            </div>

            {isSignUp && isEmailCodeSent && !isEmailVerified && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="이메일 인증번호 6자리"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
                <button type="button" onClick={handleVerifyEmailCode} style={{ padding: '0 16px', background: '#ff8c00', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  인증
                </button>
              </div>
            )}

            {/* 2. 카카오톡 인증 영역 (아티스트 선택 시에만 노출) */}
            {isSignUp && role === 'ARTIST' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>아티스트 본인 확인</label>
                {isKakaoVerified ? (
                  <div style={{ padding: '12px 14px', background: '#fff9db', border: '1px solid #fcc419', borderRadius: '12px', fontSize: '13.5px', color: '#f08c00', fontWeight: 700, textAlign: 'center' }}>
                    💬 카카오톡 본인 인증 완료됨
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleKakaoAuth}
                    style={{
                      width: '100%', padding: '12px', background: '#FEE500', color: '#191919',
                      border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}
                  >
                    💬 카카오톡으로 간편 인증하기
                  </button>
                )}
              </div>
            )}

            {/* 비밀번호 입력 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', fontWeight: 700, marginBottom: '6px' }}>비밀번호</label>
              <input
                type="password"
                placeholder="영문+숫자 8자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                required
              />
            </div>

            {/* 💡 로그인 화면일 때만 '비밀번호 찾기' 버튼 노출 */}
            {!isSignUp && (
              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <span 
                  style={{ fontSize: '0.8rem', color: '#6c757d', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setIsForgotPassword(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                >
                  비밀번호를 잊으셨나요?
                </span>
              </div>
            )}

            <button 
              type="submit" 
              style={{
                width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ff8c00, #ffab40)',
                color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer',
                fontSize: '15px', marginTop: '6px', boxShadow: '0 8px 18px -6px rgba(255,140,0,0.5)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {isSignUp ? '가입 완료' : '로그인'}
            </button>

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 }}>
              {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
              <span 
                style={{ color: '#ff8c00', cursor: 'pointer', fontWeight: 800 }} 
                onClick={() => { 
                  setIsSignUp(!isSignUp); 
                  setErrorMessage(''); 
                  setSuccessMessage(''); 
                }}
              >
                {isSignUp ? '로그인' : '회원가입'}
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;