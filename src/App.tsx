import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
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
                <button className="login-btn">PRIJAVA</button>
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
        <Link to={`/card/${id}`} className="card">
            <img src="https://media.istockphoto.com/id/940049422/vector/temperature-level-heat-levels-icon.jpg?s=612x612&w=0&k=20&c=fEnixZAdq3zCWTJBcbncjOBVi-UVb1ZuHsF5AYQWZ2I=" alt="Temperature Icon" className="temp-icon" />
            <div className="temp-info">
                <h3>{cardName}</h3>
                <ul className="temp-list">
                    <li>Top Temp: {topTemperature !== null ? `${topTemperature}°C` : 'Loading...'}</li>
                    <li>Current Temp: {currentTemperature !== null ? `${currentTemperature}°C` : 'Loading...'}</li>
                    <li>Bottom Temp: {bottomTemperature !== null ? `${bottomTemperature}°C` : 'Loading...'}</li>
                </ul>
            </div>
        </Link>
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

        // Immediately invoke the fetchData function
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

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/card/:id" element={<CardDetail />} />
            </Routes>
        </Router>
    );
};

export default App;
