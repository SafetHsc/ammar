import React, { useState, useEffect } from 'react';
import {Link} from "react-router-dom";

const CreateSarza = () => {
    const [nalogs, setNalog] = useState<any[]>([]); // List of nalogs to populate the dropdown
    const [brojKomadaAlat, setBrojKomadaAlat] = useState<any[]>([{ broj_komada: '', alat: '' }]); // Start with one default field
    const [skartLinkSarza, setSkartLinkSarza] = useState<any[]>([{ skart: '', linkedSarza: '', alat: '' }]); // Start with one default field
    const [kadaId, setKadaId] = useState<number | null>(null); // Dropdown for kada_id
    const [nalogId, setNalogId] = useState<string>(''); // Selected nalog_id (broj_naloga)
    const [message] = useState<string>(''); // Message for success or error
    const [allKadas, setAllKadas] = useState<any[]>([]); // List of kadas to populate the kada dropdown
    // @ts-ignore
    const [selectedKada, setSelectedKada] = useState<any>(null); // Selected kada for temperature display
    const [linkedSarzas, setLinkedSarzas] = useState<any[]>([]); // List of linked Sarzas for the selected Nalog

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
            fetch(`/api/sarzas/linked/${encodeURIComponent(nalogId)}`) // Encode URL
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    setLinkedSarzas(data);
                    setSkartLinkSarza([{ skart: '', linkedSarza: '', alat: '' }]);
                })
                .catch((error) => {
                    console.error('Error fetching linked Sarzas:', error);
                });
        } else {
            setLinkedSarzas([]);
            setSkartLinkSarza([{ skart: '', linkedSarza: '', alat: '' }]);
        }
    }, [nalogId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            nalog_id: nalogId,
            broj_komada_alat: brojKomadaAlat,
            skart: skartLinkSarza.map(item => ({
                skart: item.skart,
                alat: item.alat,
                sarza: item.linkedSarza,
            })),
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
            alert(`Šarža uspješno kreirana, ID: ${result.id}`);
            resetForm();
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

    const handleAddSkartLinkSarza = () => {
        if (skartLinkSarza.length < 3) {
            setSkartLinkSarza([...skartLinkSarza, { skart: '', linkedSarza: '', alat: '' }]);
        }
    };

    const handleRemoveSkartLinkSarza = (index: number) => {
        const updated = skartLinkSarza.filter((_, i) => i !== index);
        setSkartLinkSarza(updated);
    };

    const handleChangeSkartLinkSarza = (index: number, field: string, value: any) => {
        const updated = [...skartLinkSarza];
        updated[index][field] = value;
        setSkartLinkSarza(updated);
    };

    const handleKadaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setKadaId(Number(selectedId));

        // Find the selected Kada's details for temperature display
        const selectedKada = allKadas.find(kada => kada.id === Number(selectedId));
        setSelectedKada(selectedKada || null);
    };

    const resetForm = () => {
        setNalogId('');
        setBrojKomadaAlat([{ broj_komada: '', alat: '' }]);
        setSkartLinkSarza([{ skart: '', linkedSarza: '', alat: '' }]);
        setKadaId(null);
        setSelectedKada(null);
        setLinkedSarzas([]);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f4' }}>
            <div style={{
                maxWidth: '600px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#fff',
                fontFamily: 'Arial, sans-serif',
                width: '100%'
            }}>
                <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#333'}}>Kreiraj Šaržu</h2>
                <div style={{marginBottom: '20px', textAlign: 'center'}}>
                    <Link to="/nalozi-sarze" className="nazad">Nazad</Link>
                </div>
                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column'}}>
                    {/* Dropdown for nalog selection */}
                    <div style={{marginBottom: '15px'}}>
                        <label style={{display: 'block', marginBottom: '5px', color: '#555'}}>Nalog</label>
                        <select value={nalogId} onChange={(e) => setNalogId(e.target.value)} required style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                        }}>
                            <option value="">Odaberi Nalog</option>
                            {nalogs.map((nalog) => (
                                <option key={nalog.id} value={nalog.broj_naloga}>
                                    {nalog.broj_naloga}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Broj Komada and Alat Pair Input */}
                    <div style={{marginBottom: '15px'}}>
                        <label style={{display: 'block', marginBottom: '5px', color: '#555'}}>Broj Komada i Alat</label>
                        {brojKomadaAlat.map((item, index) => (
                            <div key={index} style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <input
                                    type="number"
                                    value={item.broj_komada}
                                    onChange={(e) => handleChangeBrojKomadaAlat(index, 'broj_komada', e.target.value)}
                                    placeholder="Broj Komada"
                                    required
                                    style={{
                                        flex: 1,
                                        marginRight: '10px',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        minWidth: '100px', // Added min-width to prevent shrinking
                                    }}
                                />
                                <input
                                    type="text"
                                    value={item.alat}
                                    onChange={(e) => handleChangeBrojKomadaAlat(index, 'alat', e.target.value)}
                                    placeholder="Alat"
                                    required
                                    style={{
                                        flex: 2,
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        minWidth: '150px', // Added min-width for consistency
                                    }}
                                />
                                {brojKomadaAlat.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveBrojKomadaAlat(index)}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            marginLeft: '10px',
                                            minWidth: '80px', // Added min-width to ensure button size
                                        }}
                                    >
                                        Ukloni
                                    </button>
                                )}
                            </div>
                        ))}
                        {brojKomadaAlat.length < 3 && (
                            <button type="button" onClick={handleAddBrojKomadaAlat} style={{
                                padding: '8px 12px',
                                backgroundColor: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}>
                                + Dodaj
                            </button>
                        )}
                    </div>

                    {/* Skart, Linked Sarza, and Alat Pair Input */}
                    <div style={{marginBottom: '15px'}}>
                        <label style={{display: 'block', marginBottom: '5px', color: '#555'}}>
                            Škart, Alat i iz šarže:
                        </label>
                        {skartLinkSarza.map((item, index) => (
                            <div key={index} style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <input
                                    type="number"
                                    value={item.skart}
                                    onChange={(e) => handleChangeSkartLinkSarza(index, 'skart', e.target.value)}
                                    placeholder="Skart"
                                    style={{
                                        flex: 1,
                                        marginRight: '10px',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        minWidth: '100px', // Prevent shrinking
                                    }}
                                />
                                <input
                                    type="text"
                                    value={item.alat ?? ''}
                                    onChange={(e) => handleChangeSkartLinkSarza(index, 'alat', e.target.value)}
                                    placeholder="Alat"
                                    style={{
                                        flex: 2,
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        minWidth: '150px', // Prevent shrinking
                                    }}
                                />
                                <select
                                    value={item.linkedSarza || ''}
                                    onChange={(e) => handleChangeSkartLinkSarza(index, 'linkedSarza', e.target.value)}
                                    style={{
                                        gap: '3px',
                                        marginLeft: '8px',
                                        fontSize: '14px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        minWidth: '150px',
                                        marginRight: '10px',
                                    }}
                                >
                                    <option value="">Odaberi Šaržu</option>
                                    {linkedSarzas.map((sarza) => (
                                        <option key={sarza.id} value={sarza.id}>
                                            {sarza.id}
                                        </option>
                                    ))}
                                </select>

                                {skartLinkSarza.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkartLinkSarza(index)}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            marginLeft: '10px',
                                            minWidth: '80px', // Ensure button has minimum width
                                        }}
                                    >
                                        Ukloni
                                    </button>
                                )}
                            </div>
                        ))}
                        {skartLinkSarza.length < 3 && (
                            <button
                                type="button"
                                onClick={handleAddSkartLinkSarza}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                + Dodaj
                            </button>
                        )}
                    </div>

                    {/* Kada selection */}
                    <div style={{marginBottom: '15px'}}>
                        <label style={{display: 'block', marginBottom: '5px', color: '#555'}}>Kada</label>
                        <select value={kadaId || ''} onChange={handleKadaSelect} required style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                        }}>
                            <option value="">Odaberi Kadu</option>
                            {allKadas.map((kada) => (
                                <option key={kada.id} value={kada.id}>
                                    Kada {kada.id}
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
                    <div style={{textAlign: 'center', marginTop: '20px'}}>
                        <button type="submit" style={{
                            width: '100%',
                            padding: '11px 0',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}>
                            Submit
                        </button>
                    </div>
                </form>

                {/* Message */}
                {message && <div style={{textAlign: 'center', marginTop: '20px', color: '#333'}}>{message}</div>}
            </div>
        </div>
    );

};

export default CreateSarza;
