import React, { useState, useEffect } from 'react';

const CreateSarza = () => {
    const [nalogs, setNalog] = useState<any[]>([]); // List of nalogs to populate the dropdown
    const [brojKomadaAlat, setBrojKomadaAlat] = useState<any[]>([{ broj_komada: 0, alat: '' }]); // Start with one default field
    const [skartLinkSarza, setSkartLinkSarza] = useState<any[]>([{ skart: 0, linkedSarza: '', alat: '' }]); // Start with one default field
    const [kadaId, setKadaId] = useState<number | null>(null); // Dropdown for kada_id
    const [nalogId, setNalogId] = useState<string>(''); // Selected nalog_id (broj_naloga)
    const [message, setMessage] = useState<string>(''); // Message for success or error
    const [allKadas, setAllKadas] = useState<any[]>([]); // List of kadas to populate the kada dropdown
    const [selectedKada, setSelectedKada] = useState<any>(null); // Selected kada for temperature display

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
            setMessage(`Sarza created successfully with ID: ${result.id}`);
        } catch (error) {
            setMessage('Failed to create Sarza');
            console.error(error);
        }
    };

    const handleAddBrojKomadaAlat = () => {
        if (brojKomadaAlat.length < 3) {
            setBrojKomadaAlat([...brojKomadaAlat, { broj_komada: 0, alat: '' }]);
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
            setSkartLinkSarza([...skartLinkSarza, { skart: 0, linkedSarza: '', alat: '' }]);
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

    return (
        <div>
            <h2>Create Sarza</h2>
            <form onSubmit={handleSubmit}>
                {/* Dropdown for nalog selection */}
                <div>
                    <label>Nalog</label>
                    <select value={nalogId} onChange={(e) => setNalogId(e.target.value)} required>
                        <option value="">Select Nalog</option>
                        {nalogs.map((nalog) => (
                            <option key={nalog.id} value={nalog.broj_naloga}>
                                {nalog.broj_naloga}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Broj Komada and Alat Pair Input */}
                <div>
                    <label>Broj Komada and Alat</label>
                    {brojKomadaAlat.map((item, index) => (
                        <div key={index}>
                            <input
                                type="number"
                                value={item.broj_komada}
                                onChange={(e) => handleChangeBrojKomadaAlat(index, 'broj_komada', e.target.value)}
                                placeholder="Broj Komada"
                            />
                            <input
                                type="text"
                                value={item.alat}
                                onChange={(e) => handleChangeBrojKomadaAlat(index, 'alat', e.target.value)}
                                placeholder="Alat"
                            />
                            {brojKomadaAlat.length > 1 && (
                                <button type="button" onClick={() => handleRemoveBrojKomadaAlat(index)}>Remove</button>
                            )}
                        </div>
                    ))}
                    {brojKomadaAlat.length < 3 && (
                        <button type="button" onClick={handleAddBrojKomadaAlat}>Add Broj Komada & Alat</button>
                    )}
                </div>

                {/* Skart, Linked Sarza, and Alat Pair Input */}
                <div>
                    <label>Skart, Linked Sarza, and Alat</label>
                    {skartLinkSarza.map((item, index) => (
                        <div key={index}>
                            <input
                                type="number"
                                value={item.skart}
                                onChange={(e) => handleChangeSkartLinkSarza(index, 'skart', e.target.value)}
                                placeholder="Skart"
                            />

                            <input
                                type="text"
                                value={item.alat ?? ''}
                                onChange={(e) => handleChangeSkartLinkSarza(index, 'alat', e.target.value)}
                                placeholder="Alat"
                            />
                            <input
                                type="number"
                                value={item.linkedSarza ?? ''}
                                onChange={(e) => handleChangeSkartLinkSarza(index, 'linkedSarza', e.target.value)}
                                placeholder="Linked Sarza ID"
                            />
                            {skartLinkSarza.length > 1 && (
                                <button type="button" onClick={() => handleRemoveSkartLinkSarza(index)}>Remove</button>
                            )}
                        </div>
                    ))}
                    {skartLinkSarza.length < 3 && (
                        <button type="button" onClick={handleAddSkartLinkSarza}>Add Skart, Linked Sarza & Alat</button>
                    )}
                </div>

                {/* Kada selection */}
                <div>
                <label>Kada</label>
                    <select value={kadaId || ''} onChange={handleKadaSelect} required>
                        <option value="">Select Kada</option>
                        {allKadas.map((kada) => (
                            <option key={kada.id} value={kada.id}>
                                Kada {kada.id}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedKada && (
                    <div>
                        <h4>Kada Temperatures</h4>
                        <p>Top Temperature: {selectedKada.topTemperature}°C</p>
                        <p>Current Temperature: {selectedKada.currentTemperature}°C</p>
                        <p>Bottom Temperature: {selectedKada.bottomTemperature}°C</p>
                    </div>
                )}
                <button type="submit">Submit</button>
            </form>

            {message && <div>{message}</div>}
        </div>
    );
};

export default CreateSarza;
