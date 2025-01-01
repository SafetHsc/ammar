import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Modal from "./Modal.tsx";

const Notifications: React.FC<{ username: string | null }> = ({ username }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [phValues, setPhValues] = useState<number[]>(Array(10).fill(0));
    const [isPhModalOpen, setIsPhModalOpen] = useState<boolean>(false);
    const [currentNotificationId, setCurrentNotificationId] = useState<number | null>(null);

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
                body: JSON.stringify({ username, phValues }),
            });

            if (response.ok) {
                alert('Notifikacija označena završenom.');
                await fetchNotifications();
                setIsPhModalOpen(false);
                setCurrentNotificationId(null);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Greška u kompletiranju notifikacije');
            }
        } catch (error) {
            console.error('Error marking notification as done:', error);
        }
    };

    const handlePhChange = (index: number, value: string) => {
        const updatedPhValues = [...phValues];
        updatedPhValues[index] = parseFloat(value);
        setPhValues(updatedPhValues);
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="notifications-container">
            {/* Header Section */}
            <div className="notifications-header">
                <h1>OBAVIJESTI</h1>
                <Link to="/" className="nazad">Nazad</Link>
            </div>

            {/* Notifications Box */}
            <div className="notifications-box">
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <p>{notification.message}</p>
                            {!notification.done ? (
                                <>
                                    {notification.type === 'phCheck' && (
                                        <>
                                            <button onClick={() => {
                                                setIsPhModalOpen(true);
                                                setCurrentNotificationId(notification.id);
                                            }}>
                                                Unesi pH Vrijednosti
                                            </button>
                                            <Modal isOpen={isPhModalOpen} onClose={() => setIsPhModalOpen(false)}>
                                                <h3>Unesite pH vrijednosti:</h3>
                                                {Array.from({ length: 10 }).map((_, index) => (
                                                    <div key={index} className="kada-ph-row">
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
                                                <button
                                                    onClick={() => {
                                                        if (currentNotificationId !== null) {
                                                            markAsDone(currentNotificationId, notification.type);
                                                        }
                                                    }}
                                                >
                                                    Označi završenim
                                                </button>
                                            </Modal>
                                        </>
                                    )}
                                    {notification.type !== 'phCheck' && (
                                        <button onClick={() => markAsDone(notification.id, notification.type)}>
                                            Označi završenim
                                        </button>
                                    )}
                                </>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Notifications;