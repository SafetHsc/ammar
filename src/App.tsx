import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Header from "./components/Header.tsx";
import Card from "./components/Card.tsx";
import CardDetail from "./components/CardDetail.tsx";
import LogsPage from "./components/LogsPage.tsx";
import Korisnici from "./components/Korisnici.tsx";
import Signali from "./components/Signali.tsx";
import Notifications from "./components/Notifications.tsx";
import NaloziSarze from "./components/NaloziSarze.tsx";
import CreateNalog from "./components/CreateNalog.tsx";
import CreateSarza from "./components/CreateSarza.tsx";
import ViewNalog from "./components/ViewNalog.tsx";
import ViewSarza from "./components/ViewSarza.tsx";
import KompletirajNalog from "./components/KompletirajNalog.tsx";
import KompletirajSarzu from "./components/KompletirajSarzu.tsx";
import CreateSkart from "./components/CreateSkart.tsx";
import ViewHeaterLogs from "./components/ViewHeaterLogs.tsx";

import './App.css';

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
    cardName: string;
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
        const storedUsername = sessionStorage.getItem('username');   // Retrieve username
        if (loggedIn === 'true') {
            setIsLoggedIn(true);
            setRole(Number(userRole));
            setUsername(storedUsername || ''); // Set the username if it's available
        }
    }, []);

    const fetchTemperatureData = async () => {
        try {
            const response = await fetch('/api/cards');
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

        const response = await fetch('/api/login', {
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
                sessionStorage.setItem('username', username);  // Store username
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
        setUsername('');  // Clear username in state
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('username');
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
                                cardName,
                                topTemperature,
                                currentTemperature,
                                bottomTemperature,
                                elGrijac
                            }) => (
                                <Card
                                    key={id}
                                    id={id}
                                    cardName={cardName}
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
                    <h2 style={{marginBottom:"3rem"}}>Prijava</h2>
                    <form onSubmit={handleLogin}>
                        <div>
                            <label>Korisnik:</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div>
                            <label>Lozinka:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" style={{fontSize:"inherit"}} >Prijavi se</button>
                    </form>
                    <Link to="/" >Nazad</Link>
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

            <Route path="/notifications" element={
                isLoggedIn ? (
                    <div>

                        <Notifications username={username}/>
                    </div>
                ) : (
                    <InvalidLink />
                )
            } />

            <Route path="/nalozi-sarze" element={isLoggedIn ? <NaloziSarze /> : <InvalidLink/>} />
            <Route path="/novi-nalog" element={isLoggedIn ? <CreateNalog /> : <InvalidLink />} />
            <Route path="/nova-sarza" element={isLoggedIn ? <CreateSarza /> : <InvalidLink />} />
            <Route path="/vidi-nalog" element={isLoggedIn ? <ViewNalog /> : <InvalidLink />} />
            <Route path="/vidi-sarze" element={isLoggedIn ? <ViewSarza /> : <InvalidLink />} />
            <Route path="/vidi-grijace" element={isLoggedIn ? <ViewHeaterLogs /> : <InvalidLink/>} />
            <Route path="/kompletiraj-nalog" element={isLoggedIn ? <KompletirajNalog /> : <InvalidLink />} />
            <Route path="/kompletiraj-sarzu" element={isLoggedIn ? <KompletirajSarzu /> : <InvalidLink />} />
            <Route path="/dodijeli-skart" element={isLoggedIn ? <CreateSkart /> : <InvalidLink />} />
            <Route path="/korisnici" element={isLoggedIn && role === 1 ? <Korisnici /> : <InvalidLink />} />
            {/*<Route path="/notifications" element={isLoggedIn ? <Notifications /> : <InvalidLink />} />*/}

            <Route path="/signali" element={
                <div className="signali">
                    <h2 style={{fontSize:"24px"}} >Signali</h2>
                    <Link to="/" className="nazad" >Nazad</Link>
                    <Signali />
                </div>
            } />

            <Route path="*" element={<InvalidLink />} />
        </Routes>
    );
};

export default App;
