import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

// Header component
const Header: React.FC<{ isLoggedIn: boolean; role: number | null; onLogout: () => void }> = ({ isLoggedIn, role, onLogout }) => {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour12: false }));

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour12: false }));
        };

        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

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
                        {role === 1 ? (
                            <>
                                <Link to="/logovi">
                                    <button className="logs-btn">SVI LOGOVI</button>
                                </Link>
                                <Link to="/log">
                                    <button className="daily-log-btn">DANAŠNJI LOG</button>
                                </Link>
                            </>
                        ) : (
                            <Link to="/log">
                                <button className="daily-log-btn">DANAŠNJI LOG</button>
                            </Link>
                        )}
                        <button className="logout-btn" onClick={onLogout}>LOG OUT</button>
                    </>
                ) : (
                    <Link to="/login">
                        <button className="login-btn">PRIJAVA</button>
                    </Link>
                )}
            </div>
        </header>
    );
};

interface CardProps {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
    isLoggedIn: boolean;
}

const Card: React.FC<CardProps> = ({ id, topTemperature, currentTemperature, bottomTemperature, isLoggedIn }) => {
    const cardName = id === 10 ? 'BAIC' : `KADA ${id}`;

    const handleClick = () => {
        if (isLoggedIn) {
            window.location.href = `/card/${id}`;
        } else {
            alert('Molimo vas, prijavite se za pristup detaljima.');
        }
    };

    return (
        <div className="card" onClick={handleClick}>
            <img src="https://media.istockphoto.com/id/940049422/vector/temperature-level-heat-levels-icon.jpg?s=612x612&w=0&k=20&c=fEnixZAdq3zCWTJBcbncjOBVi-UVb1ZuHsF5AYQWZ2I=" alt="Temperature Icon" className="temp-icon" />
            <div className="temp-info">
                <h3 style={{ marginLeft: "20px" }}>{cardName}</h3>
                <ul className="temp-list">
                    <li><span className="top-temp">Najviša Temperatura:</span> {topTemperature !== null ? `${topTemperature}°C` : 'Loading...'}</li>
                    <li><span className="current-temp">Trenutna Temperatura:</span> {currentTemperature !== null ? `${currentTemperature}°C` : 'Loading...'}</li>
                    <li><span className="bottom-temp">Donja Temperatura:</span> {bottomTemperature !== null ? `${bottomTemperature}°C` : 'Loading...'}</li>
                </ul>
            </div>
        </div>
    );
};

const CardDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const cardName = id === '10' ? 'BAIC' : `KADA ${id}`;

    return (
        <div className="card-detail">
            <h2>{cardName} Details</h2>
            <p>This is the detail page for {cardName}.</p>
            <Link to="/">Back to Home</Link>
        </div>
    );
};

const InvalidLink: React.FC = () => {
    return (
        <div className="invalid-link">
            <h2>Invalid Link</h2>
            <p>You do not have permission to access this page.</p>
            <Link to="/">Go back to Home</Link>
        </div>
    );
};

interface TemperatureData {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
}

const App: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<number | null>(null);
    const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loggedIn = sessionStorage.getItem('isLoggedIn');
        const userRole = sessionStorage.getItem('role');
        if (loggedIn === 'true') {
            setIsLoggedIn(true);
            setRole(Number(userRole));
        }
    }, []);

    const fetchTemperatureData = async () => {
        try {
            const response = await fetch('http://localhost:5174/api/cards');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const fetchedData: TemperatureData[] = await response.json();
            setTemperatureData(fetchedData);
        } catch (error) {
            console.error('Error fetching temperature data:', error);
        }
    };

    useEffect(() => {
        fetchTemperatureData();
        const interval = setInterval(fetchTemperatureData, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('http://localhost:5174/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                setIsLoggedIn(true);
                setRole(result.role);
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('role', result.role);
                navigate('/'); // Redirect to homepage
            } else {
               alert('Prijava neuspješna. Unesite ispravne podatke.');
            }
        } else {
            alert('Prijava neuspješna. Unesite ispravne podatke.');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setRole(null);
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <Routes>
            <Route path="/" element={
                <div>
                    <Header isLoggedIn={isLoggedIn} role={role} onLogout={handleLogout} />
                    <div className="card-container">
                        {temperatureData.length > 0 ? (
                            temperatureData.map(({ id, topTemperature, currentTemperature, bottomTemperature }) => (
                                <Card
                                    key={id}
                                    id={id}
                                    topTemperature={topTemperature}
                                    currentTemperature={currentTemperature}
                                    bottomTemperature={bottomTemperature}
                                    isLoggedIn={isLoggedIn}
                                />
                            ))
                        ) : (
                            <p className="db-crash">
                                Provjerite konekciju sa bazom!
                            </p>
                        )}
                    </div>
                </div>
            } />
            <Route path="/card/:id" element={<CardDetail />} />
            <Route path="/login" element={
                <div className="login-page">
                    <h2>Prijava</h2>
                    <form onSubmit={handleLogin}>
                        <div>
                            <label>Korisnik:</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div>
                            <label>Lozinka:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit">Prijavi Se</button>
                    </form>
                    <Link to="/">Nazad</Link>
                </div>
            } />
            <Route path="/logovi" element={
                isLoggedIn && role === 1 ? (
                    <div>
                        <h2>Admin Logovi</h2>
                        <p>This is the admin logs page.</p>
                        {/* Add your admin content here */}
                    </div>
                ) : (
                    <InvalidLink />
                )
            } />
            <Route path="/log" element={
                isLoggedIn ? (
                    <div>
                        <h2>User Log</h2>
                        <p>This is the user logs page.</p>
                        {/* Add your user content here */}
                    </div>
                ) : (
                    <InvalidLink />
                )
            } />
            <Route path="*" element={<InvalidLink />} />
        </Routes>
    );
};

export default App;
