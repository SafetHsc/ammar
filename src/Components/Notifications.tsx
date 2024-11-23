import React, { useState, useEffect } from 'react';

const Notifications: React.FC<{username: string | null }> = ({username }) => {
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            setNotifications(data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsDone = async (id: number) => {

        try {
            const response = await fetch(`/api/notifications/${id}/done`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }), // Sending username instead of userId
            });

            if (response.ok) {
                alert('Notification marked as done');
                await fetchNotifications();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to mark notification as done');
            }
        } catch (error) {
            console.error('Error marking notification as done:', error);
        }
    };

    const dismissNotification = async (id: number) => {

        try {
            const response = await fetch(`/api/notifications/${id}/dismiss`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }), // Sending username instead of userId
            });

            if (response.ok) {
                alert('Notification marked as done');
                await fetchNotifications();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to mark notification as done');
            }
        } catch (error) {
            console.error('Error marking notification as done:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div>
            <h1>OBAVIJESTI</h1>
            <ul>
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        <p>{notification.message}</p>
                        {!notification.done ? (
                            <>
                                {notification.type === 'monthly' && (
                                    <button onClick={() => markAsDone(notification.id)}>Označi završenim.</button>
                                )}
                                {notification.type === 'phCheck' && (
                                    <button onClick={() => dismissNotification(notification.id)}>Označi završenim.</button>
                                )}
                            </>
                        ):<></>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notifications;
