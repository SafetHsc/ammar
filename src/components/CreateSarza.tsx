import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

const CreateSarza = () => {
    const [nalogs, setNalog] = useState<any[]>([]); // List of nalogs to populate the dropdown
    const [brojKomadaAlat, setBrojKomadaAlat] = useState<any[]>([{ broj_komada: '', alat: '' }]); // Start with one default field
    const [kadaId, setKadaId] = useState<number | null>(null); // Dropdown for kada_id
    const [nalogId, setNalogId] = useState<string>(''); // Selected nalog_id (broj_naloga)
    const [allKadas, setAllKadas] = useState<any[]>([]); // List of kadas to populate the kada dropdown
    const [availableAlats, setAvailableAlats] = useState<string[]>([]); // List of alat names for the selected nalog

    useEffect(() => {
        // Fetch all nalogs to populate the dropdown
        fetch('/api/nalogs/incomplete')
            .then((response) => response.json())
            .then((data) => {
                setNalog(data);
            })
            .catch((error) => {
                console.error('Error fetching nalogs:', error);
            });

        // Fetch all kadas to populate the kada dropdown
        fetch('/api/cards')
            .then((response) => response.json())
            .then((data) => {
                setAllKadas(data);
            })
            .catch((error) => {
                console.error('Error fetching kadas:', error);
            });
    }, []);

    useEffect(() => {
        if (nalogId) {
            // Fetch available alats for the selected nalog
            fetch(`/api/nalogs/${encodeURIComponent(nalogId)}/alats`)
                .then((response) => response.json())
                .then((data) => {
                    setAvailableAlats(data);
                })
                .catch((error) => {
                    console.error('Error fetching alat names:', error);
                });
        } else {
            setAvailableAlats([]);
        }
    }, [nalogId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            nalog_id: nalogId,
            broj_komada_alat: brojKomadaAlat,
            kada_id: kadaId
        };
        try {
            const response = await fetch('/api/sarzas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (response.ok) {
                alert(`Šarža uspješno kreirana, ID: ${result.id}`);
                resetForm();
            } else {
                alert(`Greška: ${result.message}`);
            }
        } catch (error) {
            alert('Greška u izradi šarže');
            console.error(error);
        }
    };

    const handleAddBrojKomadaAlat = () => {
        if (brojKomadaAlat.length < 3) {
            setBrojKomadaAlat([...brojKomadaAlat, { broj_komada: '', alat: '' }]);
        }
    };

    const handleRemoveBrojKomadaAlat = (index: number) => {
        const updated = brojKomadaAlat.filter((_, i) => i !== index);
        setBrojKomadaAlat(updated);
    };

    const handleChangeBrojKomadaAlat = (index: number, field: string, value: any) => {
        const updated = [...brojKomadaAlat];
        updated[index][field] = value;
        setBrojKomadaAlat(updated);
    };

    const handleKadaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setKadaId(Number(selectedId));
    };

    const resetForm = () => {
        setNalogId('');
        setBrojKomadaAlat([{ broj_komada: '', alat: '' }]);
        setKadaId(null);
    };

    return (
        <div className="createsarza">
            <div className="sarza-div">
                <h2 className="sarza-h2">Kreiraj Šaržu</h2>
                <div className="sarza-nazad">
                    <Link to="/nalozi-sarze" className="nazad">Nazad</Link>
                </div>
                <form onSubmit={handleSubmit} className="sarza-form">
                    {/* Dropdown for nalog selection */}
                    <div className="input-div">
                        <label className="sarza-labels">Nalog</label>
                        <select value={nalogId} onChange={(e) => setNalogId(e.target.value)} required className="sarza-dropdown">
                            <option value="">Odaberi Nalog</option>
                            {nalogs.map((nalog) => (
                                <option key={nalog.id} value={nalog.broj_naloga}>
                                    {nalog.broj_naloga}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Broj Komada and Alat Pair Input */}
                    <div className="input-div">
                        <label className="sarza-labels">Broj Komada i Alat</label>
                        {brojKomadaAlat.map((item, index) => (
                            <div key={index} className="sarza-bk-alat-div">
                                <input type="number" value={item.broj_komada}
                                       onChange={(e) => handleChangeBrojKomadaAlat(index, 'broj_komada', e.target.value)}
                                       placeholder="Broj Komada" required min={1} max={100001} className="sarza-bk"/>
                                <select value={item.alat}
                                        onChange={(e) => handleChangeBrojKomadaAlat(index, 'alat', e.target.value)}
                                        required className="sarza-alat-dropdown">
                                    <option value="">Odaberi Alat</option>
                                    {availableAlats.map((alat, i) => (
                                        <option key={i} value={alat}>
                                            {alat}
                                        </option>
                                    ))}
                                </select>
                                {brojKomadaAlat.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveBrojKomadaAlat(index)}
                                            className="sarza-remove-btn">Ukloni</button>)}
                            </div>
                        ))}
                        {brojKomadaAlat.length < 3 && (
                            <button type="button" onClick={handleAddBrojKomadaAlat} className="sarza-add-bkalat-btn">
                                + Dodaj</button>
                        )}
                    </div>

                    {/* Kada selection */}
                    <div className="input-div">
                        <label className="sarza-labels">Kada</label>
                        <select value={kadaId || ''} onChange={handleKadaSelect} required className="sarza-dropdown">
                            <option value="">Odaberi Kadu</option>
                            {allKadas.map((kada) => (
                                <option key={kada.id} value={kada.id}>
                                    {kada.id}
                                </option>

                            ))}
                        </select>
                    </div>

                    {/* Display Temperatures */}
                    {/*{selectedKada && (*/}
                    {/*    <div style={{marginTop: '5px'}}>*/}
                    {/*        <h4 style={{color: '#555'}}>Temperature Kada</h4>*/}
                    {/*        <p style={{color: '#333'}}>Gornja Temperatura: {selectedKada.topTemperature}°C</p>*/}
                    {/*        <p style={{color: '#333'}}>Trenutna Temperatura: {selectedKada.currentTemperature}°C</p>*/}
                    {/*        <p style={{color: '#333'}}>Donja Temperatura: {selectedKada.bottomTemperature}°C</p>*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {/* Submit Button */}
                    <div className="sarza-submit">
                        <button type="submit" className="sarza-submit-btn">Kreiraj Šaržu</button>
                    </div>
                </form>

                {/*{message && <div style={{textAlign: 'center', marginTop: '20px', color: '#333'}}>{message}</div>}*/}
            </div>
        </div>
    );
};

export default CreateSarza;