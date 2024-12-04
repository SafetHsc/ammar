import React, { useState, useEffect } from 'react';
import {Link} from "react-router-dom";

const Notifications: React.FC<{ username: string | null }> = ({ username }) => {
    const [notifications, setNotifications] = useState<any[]>([]);

    // Fetch notifications from the server
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
                fetchNotifications(); // Refresh the list after marking as done
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
                alert('Notification dismissed');
                fetchNotifications(); // Refresh the list after dismissing
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to dismiss notification');
            }
        } catch (error) {
            console.error('Error dismissing notification:', error);
        }
    };

    // Fetch notifications initially and set up polling for periodic refresh
    useEffect(() => {
        // Fetch notifications on mount
        fetchNotifications();

        // Set up polling to refresh notifications every 10 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 10000); // 10000 ms = 10 seconds

        // Clean up interval on component unmount
        return () => clearInterval(interval);
    }, []); // Empty dependency array means this runs once when the component mounts

    return (
        <div>
            <div className="admin-log">
                <h1>OBAVIJESTI</h1>
                <Link to="/" className="nazad" >Nazad</Link>
            </div>
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
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notifications;
