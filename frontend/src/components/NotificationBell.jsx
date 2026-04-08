import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, FileText, CreditCard, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';

const NotificationBell = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const endpoint = isAdmin ? '/notifications/admin' : '/notifications';
      const response = await apiClient.get(endpoint);
      // Handle both admin (has success field) and user (direct data) response formats
      if (response.success !== undefined) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      } else if (response.notifications !== undefined) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await apiClient.put('/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setLoading(true);
      await apiClient.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'kyc':
      case 'kyc_approval':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'card':
      case 'card_approval':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'transaction':
      case 'transfer':
      case 'deposit':
      case 'withdrawal':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate based on notification type
    if (isAdmin) {
      // Admin navigation
      switch (notification.type) {
        case 'kyc':
        case 'kyc_approval':
          navigate('/mybanker?section=kyc-review');
          break;
        case 'card':
        case 'card_approval':
          navigate('/mybanker?section=cards');
          break;
        case 'deposit':
          navigate('/mybanker?section=deposit');
          break;
        case 'withdrawal':
          navigate('/mybanker?section=withdrawal');
          break;
        case 'support':
        case 'support_ticket':
          navigate('/mybanker?section=support-tickets');
          break;
        default:
          navigate('/mybanker');
      }
    } else {
      // User navigation
      switch (notification.type) {
        case 'kyc':
        case 'kyc_approval':
          navigate('/kyc');
          break;
        case 'card':
        case 'card_approval':
          navigate('/cards');
          break;
        case 'deposit':
        case 'withdrawal':
        case 'transaction':
          navigate('/transactions');
          break;
        case 'support':
        case 'support_ticket':
          navigate('/support-tickets');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[70vh] sm:max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  disabled={loading}
                  className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
