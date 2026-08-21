import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import './../App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AuthModal({ isOpen, onClose, onLoginSuccess, pendingKakaoData, onKakaoDataConsumed, pendingGoogleData, onGoogleDataConsumed }) {
  const [view, setView] = useState('form'); // 'landing' | 'form'

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // 입력 필드 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('USER'); // 'USER' | 'ARTIST'

  // 카카오 인증 완료 여부 상태 (아티스트 전용)
  const [isKakaoVerified, setIsKakaoVerified] = useState(false);
  const [kakaoProfileData, setKakaoProfileData] = useState(null);

  // 구글 인증 프로필 데이터 상태 추가
  const [googleProfileData, setGoogleProfileData] = useState(null);

  // 메시지 상태
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 카카오 인증 후 돌아왔을 때 상태 및 세션에 저장해둔 폼 데이터 복원
  useEffect(() => {
    if (pendingKakaoData) {
      setView('form');
      setIsSignUp(true);
      setIsForgotPassword(false);
      setRole('ARTIST');
      setKakaoProfileData(pendingKakaoData);
      setIsKakaoVerified(true);

      const savedForm = sessionStorage.getItem('kakao_signup_form');
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        setEmail(parsed.email || '');
        setNickname(parsed.nickname || '');
        setPassword(parsed.password || '');
        sessionStorage.removeItem('kakao_signup_form');
      }

      if (onKakaoDataConsumed) {
        onKakaoDataConsumed();
      }
    }
  }, [pendingKakaoData, onKakaoDataConsumed]);

  // 구글 간편 회원가입 후 돌아왔을 때 처리
  useEffect(() => {
    if (pendingGoogleData) {
      setView('form');
      setIsSignUp(true);
      setIsForgotPassword(false);
      setGoogleProfileData(pendingGoogleData);

      if (pendingGoogleData.email) {
        setEmail(pendingGoogleData.email);
      }
      if (pendingGoogleData.name || pendingGoogleData.nickname) {
        setNickname(pendingGoogleData.name || pendingGoogleData.nickname);
      }

      const savedForm = sessionStorage.getItem('google_signup_form');
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.nickname) setNickname(parsed.nickname);
        if (parsed.password) setPassword(parsed.password);
        sessionStorage.removeItem('google_signup_form');
      }

      if (onGoogleDataConsumed) {
        onGoogleDataConsumed();
      }
    }
  }, [pendingGoogleData, onGoogleDataConsumed]);

  if (!isOpen) return null;

  // 입력 및 상태 초기화 후 모달 닫기
  const handleClose = () => {
    setView('form');
    setErrorMessage('');
    setSuccessMessage('');
    setIsSignUp(false);
    setIsForgotPassword(false);
    setEmail('');
    setPassword('');
    setNickname('');
    setRole('USER');
    setIsKakaoVerified(false);
    setKakaoProfileData(null);
    setGoogleProfileData(null);
    onClose();
  };

  // 비밀번호 찾기 (임시 비밀번호 발급) 요청
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

  // 카카오 간편 인증 요청 (Render 콜백 주소 고정)
  const handleKakaoAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;

    if (!REST_API_KEY) {
      setErrorMessage('카카오 REST API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      return;
    }

    const formData = { email, nickname, password };
    sessionStorage.setItem('kakao_signup_form', JSON.stringify(formData));

    const REDIRECT_URI = 'https://buskerspot.onrender.com/oauth/kakao/callback';
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: kakaoAuthUrl });
    } else {
      window.location.href = kakaoAuthUrl;
    }
  };

  // 구글 간편 인증 요청 (Render 콜백 주소 고정)
  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!CLIENT_ID) {
      setErrorMessage('구글 클라이언트 ID가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      return;
    }

    const formData = { email, nickname, password };
    sessionStorage.setItem('google_signup_form', JSON.stringify(formData));

    const REDIRECT_URI = 'https://buskerspot.onrender.com/oauth/google/callback';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email%20profile`;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: googleAuthUrl });
    } else {
      window.location.href = googleAuthUrl;
    }
  };

  // 회원가입 및 로그인 처리 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isSignUp) {
      if (role === 'ARTIST' && !isKakaoVerified && !googleProfileData) {
        setErrorMessage('아티스트 가입 시 본인 인증(또는 소셜 연동)은 필수입니다.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            nickname,
            role,
            kakaoData: role === 'ARTIST' ? kakaoProfileData : null,
            kakaoId: role === 'ARTIST' && kakaoProfileData ? kakaoProfileData.kakaoId : null,
            googleData: googleProfileData,
            googleId: googleProfileData ? googleProfileData.googleId || googleProfileData.sub : null
          }),
        });
        const data = await response.json();
        if (data.success) {
          alert('회원가입이 완료되었습니다! 로그인해 주세요.');
          setIsSignUp(false);
          setPassword('');
          setIsKakaoVerified(false);
          setKakaoProfileData(null);
          setGoogleProfileData(null);
        } else {
          setErrorMessage(data.message || '회원가입 실패');
        }
      } catch (err) {
        setErrorMessage('서버 연결 실패 (회원가입)');
      }
    } else {
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

  // 랜딩 화면
  const renderLanding = () => (
    <div
      style={{
        background: '#1e1e24',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '24px',
        padding: '40px 28px 32px',
        boxSizing: 'border-box',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        position: 'relative',
        fontFamily: "'Noto Sans KR', sans-serif",
        color: '#f8f9fa',
        border: '1px solid #2e2e38'
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: '20px', right: '20px', background: '#2a2a32',
          border: '1px solid #3f3f4e', width: '32px', height: '32px', borderRadius: '50%',
          fontSize: '14px', fontWeight: 800, color: '#a0a0b0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f4e'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#2a2a32'; }}
      >
        ✕
      </button>

      <div style={{ textAlign: 'center', margin: '20px 0 32px' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '14px', color: '#ff8c00' }}>
          BuskerSpot
        </div>
        <p style={{ fontSize: '0.95rem', color: '#a0a0b0', fontWeight: 600, margin: 0 }}>
          아티스트와 관객을 잇는 가장 쉬운 방법
        </p>
      </div>

      {errorMessage && <p style={{ color: '#fa5252', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: '#20c997', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>{successMessage}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          onClick={handleKakaoAuth}
          style={{
            width: '100%', padding: '15px', background: '#FEE500', color: '#191919',
            border: 'none', borderRadius: '999px', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', display: 'block' }}>
            <path fill="#191919" d="M12 3C6.477 3 2 6.145 2 10.024c0 2.456 1.583 4.606 3.963 5.852-.172.63-.623 2.285-.714 2.634-.112.434.158.427.336.311.139-.091 2.203-1.498 2.556-1.745.594.086 1.205.132 1.83 1.32 4.477 0 8.973-3.145 8.973-7.024C19 6.145 15.023 3 12 3z"/>
          </svg>
          카카오로 3초만에 시작하기
        </button>

        <button
          type="button"
          onClick={handleGoogleAuth}
          style={{
            width: '100%', padding: '15px', background: '#ffffff', color: '#1f1f1f',
            border: '1px solid #2e2e38', borderRadius: '999px', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '20px', height: '20px' }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          Google로 계속하기
        </button>

        <button
          type="button"
          onClick={() => { setView('form'); setIsSignUp(false); setErrorMessage(''); }}
          style={{
            width: '100%', padding: '15px', background: '#2a2a32', color: '#ff8c00',
            border: '1px solid #3f3f4e', borderRadius: '999px', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px',
          }}
        >
          ✉️ 이메일로 계속하기
        </button>
      </div>
    </div>
  );

  // 로그인 / 회원가입 폼 화면
  const renderForm = () => (
    <div
      style={{
        background: '#1e1e24', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '24px', padding: '48px 28px 28px', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        position: 'relative', fontFamily: "'Noto Sans KR', sans-serif", color: '#f8f9fa', border: '1px solid #2e2e38'
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: '20px', right: '20px', background: '#2a2a32',
          border: '1px solid #3f3f4e', width: '32px', height: '32px', borderRadius: '50%',
          fontSize: '14px', fontWeight: 800, color: '#a0a0b0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f4e'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#2a2a32'; }}
      >
        ✕
      </button>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8f9fa', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
        {isForgotPassword ? '비밀번호 찾기' : isSignUp ? '회원가입' : '로그인'}
      </h2>

      {errorMessage && <p style={{ color: '#fa5252', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: '#20c997', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{successMessage}</p>}

      {isForgotPassword ? (
        <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0b0', fontWeight: 700, marginBottom: '6px' }}>가입 이메일 주소</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #2e2e38', background: '#2a2a32', color: '#f8f9fa', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
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
          <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#a0a0b0', fontWeight: 600 }}>
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSignUp && (
            <>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '12px', border: role === 'USER' ? '2px solid #ff8c00' : '1px solid #2e2e38',
                    background: role === 'USER' ? 'rgba(255,140,0,0.15)' : '#2a2a32',
                    color: role === 'USER' ? '#ff8c00' : '#a0a0b0', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', transition: 'all 0.2s'
                  }}
                >
                  👤 일반 관객
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ARTIST')}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '12px', border: role === 'ARTIST' ? '2px solid #ff8c00' : '1px solid #2e2e38',
                    background: role === 'ARTIST' ? 'rgba(255,140,0,0.15)' : '#2a2a32',
                    color: role === 'ARTIST' ? '#ff8c00' : '#a0a0b0', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', transition: 'all 0.2s'
                  }}
                >
                  🎤 아티스트
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0b0', fontWeight: 700, marginBottom: '6px' }}>닉네임</label>
                <input
                  type="text"
                  placeholder="닉네임 (2자 이상)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #2e2e38', background: '#2a2a32', color: '#f8f9fa', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0b0', fontWeight: 700, marginBottom: '6px' }}>이메일 주소</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #2e2e38', background: '#2a2a32', color: '#f8f9fa', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          {isSignUp && role === 'ARTIST' && !googleProfileData && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0b0', fontWeight: 700, marginBottom: '6px' }}>아티스트 본인 확인</label>
              {isKakaoVerified ? (
                <div style={{ padding: '12px 14px', background: 'rgba(255, 140, 0, 0.15)', border: '1px solid #ff8c00', borderRadius: '12px', fontSize: '13.5px', color: '#ff8c00', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  카카오톡 본인 인증 완료됨
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleKakaoAuth}
                  style={{
                    width: '100%', padding: '12px', background: '#FEE500', color: '#191919',
                    border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px',
                  }}
                >
                  카카오톡으로 간편 인증하기
                </button>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0b0', fontWeight: 700, marginBottom: '6px' }}>비밀번호</label>
            <input
              type="password"
              placeholder="영문+숫자 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #2e2e38', background: '#2a2a32', color: '#f8f9fa', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          {!isSignUp && (
            <div style={{ textAlign: 'right', marginTop: '-4px' }}>
              <span
                style={{ fontSize: '0.8rem', color: '#a0a0b0', cursor: 'pointer', fontWeight: 600 }}
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
              fontSize: '15px', marginTop: '6px', boxShadow: '0 8px 18px -6px rgba(255,140,0,0.5)'
            }}
          >
            {isSignUp ? '가입 완료' : '로그인'}
          </button>

          {!isForgotPassword && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 16px' }}>
                <div style={{ flex: 1, height: '1px', background: '#2e2e38' }} />
                <span style={{ fontSize: '11.5px', color: '#6c727f', fontWeight: 700 }}>또는 간편 로그인</span>
                <div style={{ flex: 1, height: '1px', background: '#2e2e38' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                  type="button"
                  onClick={handleKakaoAuth}
                  title="카카오로 계속하기"
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#FEE500', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '22px', height: '22px', display: 'block' }}>
                    <path fill="#191919" d="M12 3C6.477 3 2 6.145 2 10.024c0 2.456 1.583 4.606 3.963 5.852-.172.63-.623 2.285-.714 2.634-.112.434.158.427.336.311.139-.091 2.203-1.498 2.556-1.745.594.086 1.205.132 1.83 1.32 4.477 0 8.973-3.145 8.973-7.024C19 6.145 15.023 3 12 3z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  title="Google로 계속하기"
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#2a2a32', border: '1px solid #3f3f4e', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '20px', height: '20px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}

          <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#a0a0b0', fontWeight: 600 }}>
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
  );

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px' }}>
        {view === 'landing' ? renderLanding() : renderForm()}
      </div>
    </div>
  );
}

export default AuthModal;