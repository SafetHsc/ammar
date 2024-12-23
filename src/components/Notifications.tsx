import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

const Notifications: React.FC<{ username: string | null }> = ({ username }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [phValues, setPhValues] = useState<number[]>(Array(10).fill(0)); // Initial empty pH values array
    const [isPhCollapsed, setIsPhCollapsed] = useState<boolean>(true); // Track collapsible state

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

    const markAsDone = async (id: number, notificationType: string) => {
        if (notificationType === 'phCheck' && phValues.some(value => value === 0)) {
            alert('Sva pH polja moraju biti popunjena s vrijednostima između 0 - 14.');
            return;
        }

        try {
            const response = await fetch(`/api/notifications/${id}/done`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, phValues: phValues }),
            });

            if (response.ok) {
                alert('Notifikacija označena završenom.');
                await fetchNotifications(); // Refresh notifications after marking as done
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Greška u kompletiranju notifikacije');
            }
        } catch (error) {
            console.error('Error marking notification as done:', error);
        }
    };

    // Handle pH input change
    const handlePhChange = (index: number, value: string) => {
        const updatedPhValues = [...phValues];
        updatedPhValues[index] = parseFloat(value);
        setPhValues(updatedPhValues);
    };

    const togglePhCollapse = () => {
        setIsPhCollapsed(!isPhCollapsed);
    };

    useEffect(() => {
        fetchNotifications();

        // Refresh notifications
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000); // 60000 ms = 60 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="admin-log">
                <h1>OBAVIJESTI</h1>
                <Link to="/" className="nazad">Nazad</Link>
            </div>
            <ul>
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        <p>{notification.message}</p>
                        {!notification.done ? (
                            <>
                                {notification.type === 'odrzavanje' && (
                                    <button onClick={() => markAsDone(notification.id, notification.type)}>Označi završenim</button>
                                )}
                                {notification.type === 'phCheck' && (
                                    <div>
                                        <h4>Unesite pH vrijednosti:</h4>
                                        {/* Toggle Button for Collapsible Section */}
                                        <button onClick={togglePhCollapse}>
                                            {isPhCollapsed ? 'Prikaži pH Unose' : 'Sakrij pH Unose'}
                                        </button>
                                        {!isPhCollapsed && (
                                            <div>
                                                {Array.from({ length: 10 }).map((_, index) => (
                                                    <div key={index}>
                                                        <label>{`Kada ${index + 1}`}</label>
                                                        <input
                                                            type="number"
                                                            value={phValues[index]}
                                                            onChange={(e) => handlePhChange(index, e.target.value)}
                                                            step="0.01"
                                                            min="0"
                                                            max="14"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={() => markAsDone(notification.id, notification.type)}>Unesi pH Vrijednosti</button>
                                    </div>
                                )}
                                {notification.type === 'daily' && (
                                    <button onClick={() => markAsDone(notification.id, notification.type)}>Označi završenim</button>
                                )}
                                {notification.type === 'koncentracija' && (
                                    <button onClick={() => markAsDone(notification.id, notification.type)}>Označi završenim</button>
                                )}
                                {notification.type === 'praznjenje' && (
                                    <button onClick={() => markAsDone(notification.id, notification.type)}>Označi završenim</button>
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
