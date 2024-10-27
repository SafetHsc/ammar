import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

// Header component
const Header: React.FC = () => {
    const [currentTime, setCurrentTime] = useState<string>("");

    useEffect(() => {
        const timer = setInterval(() => {
            const time = new Date().toLocaleTimeString([], { hour12: false });
            setCurrentTime(time);
        }, 1000);

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
                <Link to="/login">
                    <button className="login-btn">PRIJAVA</button>
                </Link>
            </div>
        </header>
    );
};

interface CardProps {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
}

const Card: React.FC<CardProps> = ({ id, topTemperature, currentTemperature, bottomTemperature }) => {
    const cardName = id === 10 ? 'BAIC' : `KADA ${id}`;

    return (
        <div className="card">
            <img src="https://media.istockphoto.com/id/940049422/vector/temperature-level-heat-levels-icon.jpg?s=612x612&w=0&k=20&c=fEnixZAdq3zCWTJBcbncjOBVi-UVb1ZuHsF5AYQWZ2I=" alt="Temperature Icon" className="temp-icon" />
            <div className="temp-info">
                <Link to={`/card/${id}`}>
                    <h3 style={{ marginLeft: "20px" }}>{cardName}</h3>
                </Link>
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

interface TemperatureData {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
}

const HomePage: React.FC = () => {
    const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5174/api/cards');
                if (!response.ok) {
                    console.error('Network response was not ok');
                    return;
                }
                const fetchedData: TemperatureData[] = await response.json();
                setTemperatureData(fetchedData);
            } catch (error) {
                console.error('Error fetching temperature data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <Header />
            <div className="card-container">
                {temperatureData.map(({ id, topTemperature, currentTemperature, bottomTemperature }) => (
                    <Card
                        key={id}
                        id={id}
                        topTemperature={topTemperature}
                        currentTemperature={currentTemperature}
                        bottomTemperature={bottomTemperature}
                    />
                ))}
            </div>
        </div>
    );
};

// Login Page component
const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('http://localhost:5174/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        // Handle success and failure responses
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Handle successful login, e.g., set user state, redirect to homepage
                navigate('/'); // Redirect to homepage
            } else {
                alert('Prijava neuspješna. Unesite ispravne podatke.');
            }
        } else {
            alert('Prijava neuspješna. Unesite ispravne podatke.'); // Handle server error
        }
    };

    return (
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
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/card/:id" element={<CardDetail />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </Router>
    );
};

export default App;
