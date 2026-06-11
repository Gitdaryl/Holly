import React from 'react';

export default function ChatMessage({ role, content, timestamp }) {
  const isUser = role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '0.5rem',
      alignItems: 'flex-end',
      marginBottom: '0.75rem',
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #1a2332, #2c4a6e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>H</span>
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '80%',
        padding: '0.6rem 0.9rem',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? '#e84393' : 'white',
        color: isUser ? 'white' : '#1a2332',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        boxShadow: isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
        border: isUser ? 'none' : '1px solid #e8e4df',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  );
}
