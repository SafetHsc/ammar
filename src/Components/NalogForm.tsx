import React, { useState } from 'react';

const NalogForm: React.FC = () => {
    const [brojNaloga, setBrojNaloga] = useState('');
    const [firma, setFirma] = useState('');
    const [brojKomada, setBrojKomada] = useState([{ number: 0, type: '' }]);
    const [opis, setOpis] = useState('');

    const handleAddBrojKomada = () => {
        if (brojKomada.length < 3) {
            setBrojKomada([...brojKomada, { number: 0, type: '' }]);
        }
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch('/api/nalog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ broj_naloga: brojNaloga, firma, broj_komada: brojKomada, opis }),
            });

            if (response.ok) {
                alert('Nalog created successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Error creating nalog');
            }
        } catch (error) {
            console.error('Error creating nalog:', error);
            alert('There was an error. Please try again later.');
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <input
                type="text"
                placeholder="Broj naloga"
                value={brojNaloga}
                onChange={(e) => setBrojNaloga(e.target.value)}
            />
            <input
                type="text"
                placeholder="Firma"
                value={firma}
                onChange={(e) => setFirma(e.target.value)}
            />
            {brojKomada.map((komada, index) => (
                <div key={index}>
                    <input
                        type="number"
                        placeholder="Broj komada"
                        value={komada.number}
                        onChange={(e) => {
                            const newKomada = [...brojKomada];
                            newKomada[index].number = parseInt(e.target.value);
                            setBrojKomada(newKomada);
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Vrsta"
                        value={komada.type}
                        onChange={(e) => {
                            const newKomada = [...brojKomada];
                            newKomada[index].type = e.target.value;
                            setBrojKomada(newKomada);
                        }}
                    />
                </div>
            ))}
            {brojKomada.length < 3 && <button type="button" onClick={handleAddBrojKomada}>+</button>}
            <textarea
                placeholder="Opis (optional)"
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                maxLength={150}
            />
            <button type="submit">Create Nalog</button>
        </form>
    );
};

export default NalogForm;
