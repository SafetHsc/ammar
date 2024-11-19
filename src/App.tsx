import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import grijacOn from "./assets/grijacON.png";
import grijacOff from "./assets/grijacOff.jpg";
import LogsPage from "./Components/LogsPage.tsx";
import Korisnici from "./Components/Korisnici.tsx";
import './App.css';

// Header
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
                        <Link to="/signali">
                            <button className="signali-btn">SIGNALI</button>
                        </Link>
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

interface CardProps {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
    elGrijac: number;
    isLoggedIn: boolean;
}

const Card: React.FC<CardProps> = ({ id, topTemperature, currentTemperature, bottomTemperature, elGrijac, isLoggedIn }) => {
    const cardName = id === 10 ? 'BAJC' : `KADA ${id}`;

    const handleClick = () => {
        if (isLoggedIn) {
            window.location.href = `/card/${id}`;
        } else {
            alert('Molimo vas, prijavite se za pristup detaljima.');
        }
    };

    return (
        <div className="card" onClick={handleClick}>
            <img src={elGrijac === 1 ? grijacOn : grijacOff} alt="Temperature Icon" className="temp-icon" />
            <div className="temp-info">
                <h3 className="card-name">{cardName}</h3>
                <ul className="temp-list">
                    <li><span className="top-temp">Najviša Temperatura:</span> {topTemperature !== null ? `${topTemperature}°C` : 'Loading...'}</li>
                    <li><span className="current-temp">Trenutna Temperatura:</span> <p className="current-temp-broj">{currentTemperature !== null ? `${currentTemperature}°C` : 'Loading...'}</p></li>
                    <li><span className="bottom-temp">Najniža Temperatura:</span> {bottomTemperature !== null ? `${bottomTemperature}°C` : 'Loading...'}</li>
                </ul>
            </div>
        </div>
    );
};


const CardDetail: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
    const { id } = useParams<{ id: string }>();
    const [cardData, setCardData] = useState<TemperatureData | null>(null);
    const [loading, setLoading] = useState(true);
    const [topTemperature, setTopTemperature] = useState<string>('');
    const [bottomTemperature, setBottomTemperature] = useState<string>('');
    const [existingTemperatures, setExistingTemperatures] = useState<TemperatureData | null>(null);
    const [message] = useState<string>('');

    useEffect(() => {
        const fetchCardData = async () => {
            try {
                const response = await fetch(`http://localhost:5174/api/cards/${id}`);
                if (!response.ok) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Network response was not ok');
                }
                const data: TemperatureData = await response.json();
                setCardData(data);
                setExistingTemperatures(data);

                setTopTemperature('');
                setBottomTemperature('');

            } catch (error) {
                console.error('Greška u učitavanju podataka:', error);

            } finally {
                setLoading(false);
            }
        };
        fetchCardData();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const updatedData = {
            id: Number(id),
            topTemperature: topTemperature ? Number(topTemperature) : existingTemperatures?.topTemperature,
            bottomTemperature: bottomTemperature ? Number(bottomTemperature) : existingTemperatures?.bottomTemperature,
            currentTemperature: existingTemperatures?.currentTemperature
        };

        if (!isLoggedIn) {
            alert('Morate biti prijavljeni za izmjene temperatura!.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5174/api/cards/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                alert('Temperature uspješno promijenjene!');

                const updatedResponse = await fetch(`http://localhost:5174/api/cards/${id}`);
                const updatedCardData: TemperatureData = await updatedResponse.json();

                setCardData(updatedCardData);
                setExistingTemperatures(updatedCardData);

                // Empties the numbers from form
                setTopTemperature('');
                setBottomTemperature('');

                setCardData(updatedCardData);
                setExistingTemperatures(updatedCardData);

            }
            else {
                alert('Temperatura nije promijenjena.');
            }

        } catch (error) {
            console.error('Greška u ažuriranju temperatura:', error);
            alert('Greška u ažuriranju temperatura.');
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!cardData) {
        return <p>No data found.</p>;
    }

    const cardName = id === '10' ? 'BAJC' : `KADA ${id}`;

    return (
        <div className="kont-temp-div">
            <h2 className="h2-kont-temp">{cardName} - Kontrola Temperatura</h2>
            <div className="kont-temp">
                <div className="kont-temp-left">
                    <div className="card-detail">
                        <p><span className="toptemp-span">Najviša Temperatura:</span> {cardData.topTemperature}°C</p>
                        <p><span className="currenttemp-span">Trenutna Temperatura:</span> {cardData.currentTemperature}°C</p>
                        <p><span className="bottomtemp-span ">Najniža Temperatura:</span> {cardData.bottomTemperature}°C</p>
                    </div>
                </div>

                <div className="card-detail-div">
                {isLoggedIn && (
                    <form className="temp-form" onSubmit={handleUpdate}>
                        <h3 className="podesavanje-temp">Podešavanje Temperatura</h3>
                            <div className="tt-form-div">
                                <label className="tt-label">Najviša Temperatura:</label>
                                <input
                                    className="top-temp-form"
                                    type="number"
                                    min={55}
                                    max={100}
                                    value={topTemperature}
                                    onChange={(e) => setTopTemperature(e.target.value)} //{handleTopTemperatureChange}
                                    //placeholder={`Može biti do 100`} // ${minTemperature}
                                />
                            </div>

                            <div className="bt-form-div">
                                <label className="bt-label">Najniža Temperatura:</label>
                                <input
                                    className="donja-temp-form"
                                    type="number"
                                    min={55}
                                    max={80}
                                    value={bottomTemperature}
                                    onChange={(e) => setBottomTemperature(e.target.value)} //onChange={handleBottomTemperatureChange}
                                    //placeholder={`   `}
                                />
                            </div>
                            <button className="temp-submit" type="submit">Promijeni</button>
                    </form>
                    )}

                    {!isLoggedIn && <p className="warning"><b>Morate biti prijavljeni za podešavanje temperatura!</b></p>}
                    {message && <p>{message}</p>}

                    <Link to="/" className="nazad" >Nazad</Link>
                </div>
            </div>
        </div>

    );
};

const InvalidLink: React.FC = () => {
    return (
        <div className="invalid-link">
            <h2>Niste Prijavljeni</h2>
            <p>Nemate odobrenje za pristup ovoj lokaciji!</p>
            <Link to="/">Nazad</Link>
        </div>
    );
};

interface TemperatureData {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
    elGrijac: number;
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
                // noinspection ExceptionCaughtLocallyJS
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
        const interval = setInterval(fetchTemperatureData, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('http://localhost:5174/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
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
        setUsername('');  // briše kredencijale iz forme
        setPassword('');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('role');
        navigate('/');
    };

    return (
        <Routes>
            <Route path="/" element={
                <div>
                    <Header isLoggedIn={isLoggedIn} role={role} onLogout={handleLogout}/>
                    <div className="card-container">
                        {temperatureData.length > 0 ? (
                            temperatureData.map(({
                                id,
                                topTemperature,
                                currentTemperature,
                                bottomTemperature,
                                elGrijac
                            }) => (
                                <Card
                                    key={id}
                                    id={id}
                                    topTemperature={topTemperature}
                                    currentTemperature={currentTemperature}
                                    bottomTemperature={bottomTemperature}
                                    elGrijac={elGrijac}
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
            }/>
            <Route path="/card/:id" element={
                <CardDetail isLoggedIn={isLoggedIn}/>
            }/>
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
                    <div className="admin-log">
                        <h2>Admin Logovi</h2>
                        <p>Sadržaj u izradi</p>
                        <Link to="/">Nazad</Link>
                        <LogsPage/>
                    </div>
                ) : (
                    <InvalidLink />
                )
            } />
            <Route path="/korisnici" element={isLoggedIn && role === 1 ? <Korisnici /> : <InvalidLink />} />
            <Route path="/signali" element={
                <div className="signali">
                    <h2>Signali</h2>
                    <p>Sadržaj u izradi</p>
                    <Link to="/">Nazad</Link>
                    {/* Add your content here */}
                </div>
            } />
            <Route path="*" element={<InvalidLink />} />
        </Routes>
    );
};

export default App;
