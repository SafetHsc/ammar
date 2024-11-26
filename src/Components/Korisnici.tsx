import React, { useState } from 'react';
import {Link} from "react-router-dom";

const Korisnici: React.FC = () => {
    const [createUsername, setCreateUsername] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [deleteUsername, setDeleteUsername] = useState('');
    const [error] = useState('');

    // Handle creating a user
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: createUsername, password: createPassword }),
        });

        if (response.ok) {
            alert(`Račun "${createUsername}" uspješno kreiran!`);
            setCreateUsername('');
            setCreatePassword('');
        } else {
            await response.json();
            alert(`Greška u kreiranju računa - korisnik "${createUsername}" već postoji!`);
        }
    };

    // Handle deleting a user
    const handleDeleteUser = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('/api/del-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: deleteUsername }),
        });

        if (response.ok) {
            alert(`Račun "${deleteUsername}" uspješno obrisan!`);
            setDeleteUsername('');
        } else {
            await response.json();
            alert(`Greška u brisanju računa!`);
        }
    };

    return (
        <div className="korisnici-page">
            <h2 className="korisnici-h">Upravljanje Korisnicima</h2>
            <p style={{ textAlign: 'center' }}>
            <Link to="/" className="nazad">Nazad</Link>
            </p>
            <div className="forms-container">
                {/* Create User Form */}
                <div className="form create-user">
                    <h3>Kreiraj Novi Račun</h3>
                    <form onSubmit={handleCreateUser}>
                        <div>
                            <label>Korisničko ime:</label>
                            <input
                                type="text"
                                value={createUsername}
                                onChange={(e) => setCreateUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label>Lozinka:</label>
                            <input
                                type="text"
                                value={createPassword}
                                onChange={(e) => setCreatePassword(e.target.value)}
                                required
                            />
                        </div>
                        <button className="korisnici-form-btn" type="submit">Kreiraj korisnika</button>
                    </form>
                    {error && <p className="error">{error}</p>}
                </div>

                {/* Delete User Form */}
                <div className="form delete-user">
                    <h3>Obriši Račun</h3>
                    <form onSubmit={handleDeleteUser}>
                        <div>
                            <label>Korisničko ime:</label>
                            <input
                                type="text"
                                value={deleteUsername}
                                onChange={(e) => setDeleteUsername(e.target.value)}
                                required
                            />
                        </div>
                        <button className="korisnici-form-btn" type="submit">Izbriši korisnika</button>
                    </form>
                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Korisnici;
