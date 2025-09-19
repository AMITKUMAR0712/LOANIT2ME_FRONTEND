import React, { useState, useEffect } from 'react';
import { fetchAdminNotifications, markAdminNotificationRead } from '../../lib/api';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { notifications } = await fetchAdminNotifications();
        setNotifications(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Notifications</h2>
      {notifications.length ? (
        notifications.map((notif) => (
          <div key={notif.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-semibold text-fern_green-500 text-lg">Notification: {notif.type}</h3>
                <p className="text-sm text-fern_green-400">To: {notif.user.fullName}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                notif.isRead ? "bg-celadon-900 text-fern_green-500 border border-celadon-400" :
                "bg-mantis-900 text-mantis-400 border border-mantis-400"
              }`}>
                {notif.isRead ? 'Read' : 'Unread'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
              <div>
                <p className="text-sm text-fern_green-400">User</p>
                <p className="font-semibold text-text-mantis-100">{notif.user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Type</p>
                <p className="font-semibold text-text-mantis-100">{notif.type}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Status</p>
                <p className="font-semibold text-text-mantis-100">{notif.isRead ? 'Read' : 'Unread'}</p>
              </div>
            </div>
            <div className="bg-celadon-900 p-4 rounded-lg mb-5">
              <p className="text-sm text-fern_green-400 mb-2">Message</p>
              <p className="text-fern_green-200">{notif.message}</p>
            </div>
            <div className="flex gap-3">
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="bg-fern_green-300 text-white px-5 py-2 rounded-lg hover:bg-fern_green-400 transition-all duration-200 shadow-sm font-medium"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No notifications found.</p>
      )}
    </div>
  );
};

export default NotificationManagement;