export const mainStyles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px', // 좌우 여백을 넓혀서 시원한 느낌 부여
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 10px 30px -18px rgba(41, 37, 36, 0.15)',
    flexWrap: 'nowrap'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '1.5rem',
    fontWeight: '900',
    letterSpacing: '-0.03em',
    backgroundImage: 'linear-gradient(120deg, #ff8c00 0%, #fa5252 55%, #ff6b9d 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  menuGroup: {
    display: 'flex',
    gap: '6px', // 메뉴 버튼들 간격 소폭 확대
    alignItems: 'center',
    backgroundColor: '#f5f0eb', // 조금 더 부드러운 배경톤
    padding: '6px',
    borderRadius: '999px',
    boxShadow: 'inset 0 0 0 1px rgba(41,37,36,0.05)',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  navBtn: {
    padding: '10px 20px', // 패딩을 늘려 터치 및 클릭 영역 확보
    borderRadius: '999px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#78716c',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
    whiteSpace: 'nowrap'
  },
  navBtnActive: {
    backgroundImage: 'linear-gradient(135deg, #ff8c00, #ffab40)',
    backgroundColor: '#ff8c00',
    color: '#ffffff',
    boxShadow: '0 6px 20px -4px rgba(255,140,0,0.45)',
    whiteSpace: 'nowrap'
  },
  navBtnBookmark: {
    padding: '10px 20px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#fa5252',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
    whiteSpace: 'nowrap'
  },
  navBtnBookmarkActive: {
    backgroundImage: 'linear-gradient(135deg, #fa5252, #ff8787)',
    backgroundColor: '#fa5252',
    color: '#ffffff',
    boxShadow: '0 6px 20px -4px rgba(250,82,82,0.45)',
    whiteSpace: 'nowrap'
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px', // 아이콘, 버튼, 유저 칩 사이 간격을 넓혀 여유롭게 배치
    flexShrink: 0,
    flexWrap: 'nowrap'
  },
  registerBtn: {
    backgroundImage: 'linear-gradient(135deg, #ff8c00, #fa5252)',
    backgroundColor: '#ff8c00',
    color: '#ffffff',
    padding: '11px 24px',
    borderRadius: '999px',
    border: 'none',
    fontWeight: '800',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 8px 20px -4px rgba(250,82,82,0.45)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundImage: 'linear-gradient(135deg, #fff7ed, #fff1f2)',
    backgroundColor: '#fff7ed',
    borderRadius: '999px',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#44403c',
    maxWidth: '170px',
    flexShrink: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  subActionBtn: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#f5f0eb',
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#57534e',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  }
};