import React from 'react';

const getDeterministicColor = (str) => {
  const colors = [
    'bg-rose-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-600',
    'bg-violet-500',
    'bg-fuchsia-500',
    'bg-indigo-500',
    'bg-orange-500'
  ];
  let hash = 0;
  const stringToHash = str || 'default';
  for (let i = 0; i < stringToHash.length; i++)
    hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const UserAvatar = React.memo(
  ({ name, surname, userId, size = 'md', lastActive, badgeCount = 0 }) => {
    const initials = `${name?.[0] || ''}${surname?.[0] || ''}`.toUpperCase() || '?';
    const color = getDeterministicColor(userId || name);
    const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-14 h-14 text-lg' };
    const isOnline =
      lastActive && Date.now() - (lastActive?.toMillis?.() || lastActive || 0) < 300000;

    return (
      <div className="relative shrink-0 select-none">
        <div
          className={`${sizes[size]} ${color} text-white rounded-full flex items-center justify-center font-bold shadow-sm`}
        >
          {initials}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-navy-900 rounded-full"></div>
        )}
        {badgeCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-navy-900">
            {badgeCount > 99 ? '99+' : badgeCount}
          </div>
        )}
      </div>
    );
  }
);

export default UserAvatar;
