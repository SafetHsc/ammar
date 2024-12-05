import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NalogFormData {
    broj_naloga: string;
    firma: string;
    broj_komada_alat: { alat: string; broj_komada: string }[];  // Change to string instead of number
    total_broj_komada: number;
    opis?: string;
    completed: boolean;
}

const CreateNalog: React.FC = () => {
    const [formData, setFormData] = useState<NalogFormData>({
        broj_naloga: '',
        firma: '',
        broj_komada_alat: [{ alat: '', broj_komada: '' }],
        total_broj_komada: 0,
        opis: '',
        completed: false,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { name, value } = e.target;
        const updatedData = [...formData.broj_komada_alat];
        updatedData[index] = { ...updatedData[index], [name]: value };

        // Recalculate total_broj_komada based on the sum of broj_komada (convert to number only if it's a valid number)
        const total_broj_komada = updatedData.reduce((sum, item) => {
            const brojKomada = item.broj_komada ? Number(item.broj_komada) : 0;
            return sum + brojKomada;
        }, 0);

        setFormData({ ...formData, broj_komada_alat: updatedData, total_broj_komada });
    };

    const handleAddInput = () => {
        if (formData.broj_komada_alat.length < 3) {
            setFormData({
                ...formData,
                broj_komada_alat: [...formData.broj_komada_alat, { alat: '', broj_komada: '' }],
            });
        }
    };

    const handleRemoveInput = (index: number) => {
        const updatedData = formData.broj_komada_alat.filter((_, i) => i !== index);
        const total_broj_komada = updatedData.reduce((sum, item) => {
            const brojKomada = item.broj_komada ? Number(item.broj_komada) : 0;
            return sum + brojKomada;
        }, 0);
        setFormData({ ...formData, broj_komada_alat: updatedData, total_broj_komada });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/nalogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Nalog uspješno kreiran!');
                setFormData({
                    broj_naloga: '',
                    firma: '',
                    broj_komada_alat: [{ alat: '', broj_komada: '' }],
                    total_broj_komada: 0,
                    opis: '',
                    completed: false,
                });
            } else {
                throw new Error('Error creating nalog');
            }
        } catch (error) {
            alert('Greška u izradi naloga.');
        }
    };

    return (
        <div className="createnalog">
            <div className="nalog-div">
                <h2 className="nalog-h2">Kreiraj Nalog</h2>

                {/* Back Link */}
                <div className="nalog-nazad"><Link to="/nalozi-sarze" className="nazad">Nazad</Link></div>

                <form className="nalog-form" onSubmit={handleSubmit}>
                    <div className="broj-naloga">
                        <label className="nalog-label">Broj Naloga:</label>
                        <input
                            type="text"
                            value={formData.broj_naloga}
                            onChange={(e) => setFormData({ ...formData, broj_naloga: e.target.value })}
                            required
                            className="broj-naloga-input"
                        />
                    </div>
                    <div className="broj-naloga">
                        <label className="nalog-label">Firma:</label>
                        <input
                            type="text"
                            value={formData.firma}
                            onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                            required
                            className="firma-input"
                        />
                    </div>
                    <div className="broj-naloga">
                        <label className="nalog-label">Broj Komada + Alat:</label>
                        {formData.broj_komada_alat.map((input, index) => (
                            <div key={index} className="nalog-brkmd-alat">
                                <input
                                    type="number"
                                    name="broj_komada"
                                    value={input.broj_komada}
                                    onChange={(e) => handleInputChange(e, index)}
                                    placeholder="Broj Komada"
                                    min={0}
                                    max={1000}
                                    required
                                    className="input-brkmd-nalog"
                                />
                                <input
                                    type="text"
                                    name="alat"
                                    value={input.alat}
                                    onChange={(e) => handleInputChange(e, index)}
                                    placeholder="Alat"
                                    required
                                    className="nalog-alat"
                                />
                                {formData.broj_komada_alat.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveInput(index)} className="nalog-ukloni-btn">Ukloni</button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddInput}
                            className="nalog-dodaj-input"
                            style={{ cursor: formData.broj_komada_alat.length >= 3 ? 'not-allowed' : 'pointer' }}
                            disabled={formData.broj_komada_alat.length >= 3}
                        >
                            + Dodaj
                        </button>
                    </div>
                    <div className="broj-naloga">
                        <label className="nalog-label">Opis:</label>
                        <input
                            type="text"
                            value={formData.opis || ''}
                            onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                            className="broj-naloga-input"
                        />
                    </div>
                    <button type="submit" className="nalog-submit-btn">Kreiraj Nalog</button>
                </form>
            </div>
        </div>
    );
};

export default CreateNalog;
