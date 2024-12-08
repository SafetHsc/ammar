import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Header: React.FC<{ isLoggedIn: boolean; role: number | null; onLogout: () => void }> = ({ isLoggedIn, role, onLogout }) => {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour12: false }));

    // @ts-ignore
    const [notificationsCount, setNotificationsCount] = useState(0);

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour12: false }));
        };
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications');
                const data = await response.json();
                setNotificationsCount(data.unreadCount || 0);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        if (isLoggedIn) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Refresh every 60 seconds
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    return (
        <header className="header">
            <div className="header-left">
                <img src="src/assets/logo.png" alt="Company Logo" className="logo" />
            </div>
            <div className="header-center">
                <h2 className="clock">{currentTime}</h2>
            </div>
            <div className="header-right">
                {isLoggedIn ? (
                    <>
                        {/*<Link to="/notifications">*/}
                        {/*    <button className="notifications-btn">*/}
                        {/*        OBAVIJESTI {notificationsCount > 0 && <span>({notificationsCount})</span>}*/}
                        {/*    </button>*/}
                        {/*</Link>*/}
                        {/*<Link to="/nalozi-sarze">*/}
                        {/*    <button className="login-btn">*/}
                        {/*        NALOZI I SARZE*/}
                        {/*    </button>*/}
                        {/*</Link>*/}

                        {role === 1 && (
                            <>
                                <Link to="/logovi">
                                    <button className="logs-btn">LOGOVI</button>
                                </Link>
                                <Link to="/korisnici">
                                    <button className="korisnici-btn">KORISNICI</button>
                                </Link>
                            </>
                        )}

                        {/* Hide the Signali button for Admin */}
                        {role !== 1 && (
                            <Link to="/signali">
                                <button className="signali-btn">SIGNALI</button>
                            </Link>
                        )}

                        <button className="logout-btn" onClick={onLogout}>ODJAVA</button>
                    </>
                ) : (
                    <>
                        <Link to="/signali">
                            <button className="signali-btn">SIGNALI</button>
                        </Link>
                        <Link to="/login">
                            <button className="login-btn">PRIJAVA</button>
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
