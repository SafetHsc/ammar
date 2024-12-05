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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f4' }}>
            <div style={{ maxWidth: '600px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333'}}>Kreiraj Nalog</h2>

                {/* Back Link */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <Link to="/nalozi-sarze" className="nazad">Nazad</Link>
                </div>

                <form style={{ display: 'flex', flexDirection: 'column' }} onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Broj Naloga:</label>
                        <input
                            type="text"
                            value={formData.broj_naloga}
                            onChange={(e) => setFormData({ ...formData, broj_naloga: e.target.value })}
                            required
                            style={{ width: 'calc(100% - 10px)', padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Firma:</label>
                        <input
                            type="text"
                            value={formData.firma}
                            onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                            required
                            style={{ width: 'calc(100% - 10px)', padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Broj Komada + Alat:</label>
                        {formData.broj_komada_alat.map((input, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <input
                                    type="number"
                                    name="broj_komada"
                                    value={input.broj_komada}
                                    onChange={(e) => handleInputChange(e, index)}
                                    placeholder="Broj Komada"
                                    min={0}
                                    max={1000}
                                    required
                                    style={{ flex: 1, marginRight: '10px', padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '5px' }}
                                />
                                <input
                                    type="text"
                                    name="alat"
                                    value={input.alat}
                                    onChange={(e) => handleInputChange(e, index)}
                                    placeholder="Alat"
                                    required
                                    style={{ flex: 2, padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '5px' }}
                                />
                                {formData.broj_komada_alat.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveInput(index)}
                                        style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
                                    >
                                        Ukloni
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddInput}
                            style={{ padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: formData.broj_komada_alat.length >= 3 ? 'not-allowed' : 'pointer' }}
                            disabled={formData.broj_komada_alat.length >= 3}
                        >
                            + Dodaj
                        </button>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Opis:</label>
                        <input
                            type="text"
                            value={formData.opis || ''}
                            onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                            style={{ width: 'calc(100% - 10px)', padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{ padding: '11px 0', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Kreiraj Nalog
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateNalog;
