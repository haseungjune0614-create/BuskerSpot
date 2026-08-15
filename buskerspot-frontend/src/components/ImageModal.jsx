import React from 'react';

const ImageModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, cursor: 'pointer', padding: '20px'
      }}
    >
      <img 
        src={imageUrl} 
        alt="확대된 이미지" 
        style={{ 
          maxWidth: '90%', maxHeight: '90%', 
          borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' 
        }}
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫히지 않게
      />
    </div>
  );
};

export default ImageModal;