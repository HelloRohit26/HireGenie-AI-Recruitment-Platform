import React, { useState } from 'react';
import { NotificationItem } from '../../types';
import { mockNotifications } from '../../data/mockData';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = (notif: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.actionUrl && onNavigate) {
      onNavigate(notif.actionUrl);
      onClose();
    }
  };

  const typeColors: Record<string, string> = {
    ai: 'text-[#F4C377]',
    success: 'text-emerald-400',
    warning: 'text-[#C97C5D]',
    error: 'text-red-400',
    info: 'text-[#79A89A]'
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute top-14 right-0 z-50 w-80 sm:w-96 bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A28]">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#F4F1E9]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/30">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-[10px] text-[#D6A85F] hover:underline font-mono"
          >
            Mark all read
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-[#A1A19A] text-xs">
              <span className="material-symbols-outlined text-2xl opacity-50 block mb-2">notifications_off</span>
              No notifications
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#20201C] transition-colors border-b border-[#2A2A28]/50 ${
                  !notif.read ? 'bg-[#D6A85F]/5' : ''
                }`}
              >
                <span className={`material-symbols-outlined text-lg mt-0.5 ${typeColors[notif.type] || 'text-[#A1A19A]'}`}>
                  {notif.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold truncate ${!notif.read ? 'text-[#F4F1E9]' : 'text-[#A1A19A]'}`}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D6A85F] shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#A1A19A] mt-0.5 line-clamp-2">{notif.message}</p>
                  <span className="text-[9px] text-[#A1A19A]/70 font-mono mt-1 block">{notif.timeAgo}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};
