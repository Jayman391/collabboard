import { useCursorStore } from '../../stores/cursorStore';

export function OnlineUsers() {
  const onlineUsers = useCursorStore((s) => s.onlineUsers);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: '4px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 10,
      }}
    >
      {Array.from(onlineUsers.values()).map((user) => (
        <div
          key={user.userId}
          title={user.userName}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: user.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            border: '2px solid white',
            marginLeft: -4,
          }}
        >
          {user.userName.charAt(0).toUpperCase()}
        </div>
      ))}
      <span
        style={{
          fontSize: 12,
          color: '#666',
          marginLeft: 4,
        }}
      >
        {onlineUsers.size} online
      </span>
    </div>
  );
}
