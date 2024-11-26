import React, { useState, useEffect } from 'react';

const SarzaForm: React.FC = () => {
    const [nalogs, setNalogs] = useState<{ id: number; broj_naloga: string }[]>([]);
    const [kadas, setKadas] = useState<any[]>([]);
    const [selectedNalog, setSelectedNalog] = useState<number | null>(null);
    const [brojKomada, setBrojKomada] = useState<number>(0);
    const [alat, setAlat] = useState<string>('');
    const [skart, setSkart] = useState<{ sarzaId: number; count: number }[]>([]);
    const [selectedKada, setSelectedKada] = useState<number | null>(null);
    const [kadaDetails, setKadaDetails] = useState<any>(null);

    // Fetch incomplete nalogs
    useEffect(() => {
        const fetchNalogs = async () => {
            try {
                const response = await fetch('/api/nalog/incomplete');
                const data = await response.json();
                setNalogs(data);
            } catch (error) {
                console.error('Error fetching nalogs:', error);
            }
        };

        fetchNalogs();
    }, []);

    // Fetch kadas
    useEffect(() => {
        const fetchKadas = async () => {
            try {
                const response = await fetch('/api/cards');
                const data = await response.json();
                setKadas(data);
            } catch (error) {
                console.error('Error fetching kadas:', error);
            }
        };

        fetchKadas();
    }, []);

    // Fetch kada details on selection
    useEffect(() => {
        if (selectedKada) {
            const fetchKadaDetails = async () => {
                try {
                    const response = await fetch(`/api/cards/${selectedKada}`);
                    const data = await response.json();
                    setKadaDetails(data);
                } catch (error) {
                    console.error('Error fetching kada details:', error);
                }
            };

            fetchKadaDetails();
        }
    }, [selectedKada]);

    const handleAddSkart = () => {
        setSkart([...skart, { sarzaId: 0, count: 0 }]);
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch('/api/sarza', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nalog_id: selectedNalog,
                    broj_komada: brojKomada,
                    alat,
                    skart,
                    kada_id: selectedKada,
                }),
            });

            if (response.ok) {
                alert('Sarza created successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Error creating sarza');
            }
        } catch (error) {
            console.error('Error creating sarza:', error);
            alert('There was an error. Please try again later.');
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <label>
                Link to Nalog:
                <select
                    value={selectedNalog || ''}
                    onChange={(e) => setSelectedNalog(parseInt(e.target.value))}
                >
                    <option value="" disabled>Select Nalog</option>
                    {nalogs.map((nalog) => (
                        <option key={nalog.id} value={nalog.id}>
                            {`${nalog.id} - ${nalog.broj_naloga}`}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Broj Komada:
                <input
                    type="number"
                    value={brojKomada}
                    onChange={(e) => setBrojKomada(parseInt(e.target.value))}
                    min="1"
                />
            </label>

            <label>
                Alat:
                <input
                    type="text"
                    value={alat}
                    onChange={(e) => setAlat(e.target.value)}
                />
            </label>

            <div>
                <h4>Skart</h4>
                {skart.map((item, index) => (
                    <div key={index}>
                        <label>
                            From Sarza:
                            <input
                                type="number"
                                value={item.sarzaId}
                                onChange={(e) => {
                                    const newSkart = [...skart];
                                    newSkart[index].sarzaId = parseInt(e.target.value);
                                    setSkart(newSkart);
                                }}
                                min="1"
                            />
                        </label>

                        <label>
                            Count:
                            <input
                                type="number"
                                value={item.count}
                                onChange={(e) => {
                                    const newSkart = [...skart];
                                    newSkart[index].count = parseInt(e.target.value);
                                    setSkart(newSkart);
                                }}
                                min="0"
                            />
                        </label>
                    </div>
                ))}
                <button type="button" onClick={handleAddSkart}>Add Skart</button>
            </div>

            <label>
                Kada:
                <select
                    value={selectedKada || ''}
                    onChange={(e) => setSelectedKada(parseInt(e.target.value))}
                >
                    <option value="" disabled>Select Kada</option>
                    {kadas.map((kada) => (
                        <option key={kada.id} value={kada.id}>
                            {kada.name}
                        </option>
                    ))}
                </select>
            </label>

            {kadaDetails && (
                <div>
                    <h4>Kada Details</h4>
                    <p>Top Temperature: {kadaDetails.topTemperature}</p>
                    <p>Current Temperature: {kadaDetails.currentTemperature}</p>
                    <p>Bottom Temperature: {kadaDetails.bottomTemperature}</p>
                </div>
            )}

            <button type="submit">Create Sarza</button>
        </form>
    );
};

export default SarzaForm;
