import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface SarzaData {
    alatData: { alat: string, broj_komada: number }[];
    skartData: { alat: string, skart: number }[];
}

const CreateSkart = () => {
    const [nalogs, setNalog] = useState<any[]>([]);
    const [skartLinkSarza, setSkartLinkSarza] = useState<any[]>([{ skart: '', alat: '' }]);
    const [nalogId, setNalogId] = useState<string>('');
    const [linkedSarzas, setLinkedSarzas] = useState<any[]>([]);
    const [selectedSarza, setSelectedSarza] = useState<string>('');
    const [sarzaData, setSarzaData] = useState<any>({});
    const [formErrors, setFormErrors] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/nalogs/incomplete')
            .then((response) => response.json())
            .then((data) => setNalog(data))
            .catch((error) => console.error('Error fetching nalogs:', error));
    }, []);

    useEffect(() => {
        if (nalogId) {
            fetch(`/api/sarzas/linked/${encodeURIComponent(nalogId)}`)
                .then((response) => response.json())
                .then((data) => {
                    setLinkedSarzas(data);
                    const sarzaMap: { [key: string]: SarzaData } = {};
                    data.forEach((sarza: any) => {
                        sarzaMap[sarza.id] = {
                            alatData: JSON.parse(sarza.broj_komada_alat || '[]'),
                            skartData: JSON.parse(sarza.skart || '[]')
                        };
                    });
                    setSarzaData(sarzaMap);
                })
                .catch((error) => console.error('Error fetching linked sarzas:', error));
        } else {
            setLinkedSarzas([]);
        }
    }, [nalogId]);

    useEffect(() => {
        const errors: string[] = [];

        // Check if all skartLinkSarza rows are completed
        // if (skartLinkSarza.some((item) => !item.skart || !item.alat)) {
        //     errors.push("Sva polja u `škart` i `alat` moraju biti popunjena!");
        // }

        // Check if a Sarza is selected
        // if (!selectedSarza) {
        //     errors.push("Odaberite Šaržu");
        // }

        // Check for skart exceeding limits
        skartLinkSarza.forEach((item, index) => {
            if (!item.skart) {
                errors.push(`Red ${index + 1}: Unesite Škart.`);
            }
            if (!item.alat) {
                errors.push(`Red ${index + 1}: Odaberite Alat.`);
            } else if (
                item.skart && // Validate limit only after alat is selected
                isSkartExceeds(parseInt(item.skart, 10), item.alat, selectedSarza)
            ) {
                errors.push(`Red ${index + 1}: Škart Prekoračuje Limit za \`${item.alat}\`.`);
            }
        });

        setFormErrors(errors);
    }, [skartLinkSarza, selectedSarza]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // if (!selectedSarza) {
        //     alert('Odaberite Šaržu.');
        //     return;
        // }

        const formData = { skart: skartLinkSarza.map(item => ({ ...item, linkedSarza: selectedSarza })) };

        try {
            const response = await fetch('/api/skarts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Skart successfully updated');
                resetForm();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert('Error in skart creation');
            console.error(error);
        }
    };

    const handleAddSkartLinkSarza = () => {
        if (skartLinkSarza.length < 3) {
            setSkartLinkSarza([...skartLinkSarza, { skart: '', alat: '' }]);
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

    const resetForm = () => {
        setSkartLinkSarza([{ skart: '', alat: '' }]);
        setNalogId('');
        setSelectedSarza('');
    };

    const isSkartExceeds = (skartCount: number, alat: string, linkedSarzaId: string) => {
        const sarza = sarzaData[linkedSarzaId];
        if (!sarza) return false;

        const alatSkart = sarza.skartData.filter((item: any) => item.alat === alat)
            .reduce((acc: number, item: any) => acc + parseInt(item.skart), 0);
        const alatBrojKomada = sarza.alatData.find((item: any) => item.alat === alat)?.broj_komada || 0;

        return alatSkart + skartCount > alatBrojKomada;
    };

    // const isFormValid = () => {
    //     return skartLinkSarza.every((item) => item.skart && item.alat && selectedSarza) &&
    //         !skartLinkSarza.some(item => isSkartExceeds(parseInt(item.skart, 10), item.alat, selectedSarza));
    // };

    const getAvailableAlatsForRow = (index: number): string[] => {
        const sarza = sarzaData[selectedSarza];
        if (!sarza) return [];

        let availableAlats = sarza.alatData.map((item: { alat: string }) => item.alat);

        // Filter out alats that are already selected in other rows
        skartLinkSarza.forEach((item, i) => {
            if (i !== index && item.alat) {
                availableAlats = availableAlats.filter((alat: string) => alat !== item.alat);
            }
        });

        return availableAlats;
    };

    return (
        <div className="createsarza">
            <div className="sarza-div">
                <h2 className="sarza-h2">Kreiraj Skart</h2>
                <div className="sarza-nazad">
                    <Link to="/nalozi-sarze" className="nazad">Nazad</Link>
                </div>
                <form onSubmit={handleSubmit} className="sarza-form">
                    <div className="input-div">
                        <label className="sarza-labels">Nalog</label>
                        <select value={nalogId} onChange={(e) => setNalogId(e.target.value)} required
                                className="sarza-dropdown">
                            <option value="">Odaberi Nalog</option>
                            {nalogs.map((nalog) => (
                                <option key={nalog.id} value={nalog.broj_naloga}>
                                    {nalog.broj_naloga}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Always visible Sarza selection */}
                    <div className="input-div">
                        <label className="sarza-labels">Izaberi Šaržu</label>
                        <select
                            value={selectedSarza}
                            onChange={(e) => setSelectedSarza(e.target.value)}
                            className="sarza-dropdown"
                        >
                            <option value="">Odaberi Šaržu</option>
                            {linkedSarzas.map((sarza) => (
                                <option key={sarza.id} value={sarza.id}>
                                    {sarza.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-div">
                        <label className="sarza-labels">Škart i Alat:</label>
                        {skartLinkSarza.map((item, index) => (
                            <div key={index} className="sarza-bk-alat-div">
                                <input
                                    type="number"
                                    value={item.skart}
                                    onChange={(e) => handleChangeSkartLinkSarza(index, 'skart', e.target.value)}
                                    placeholder="Skart"
                                    min={1}
                                    max={5000}
                                    className="skart-bk"
                                />
                                <select
                                    value={item.alat}
                                    onChange={(e) => handleChangeSkartLinkSarza(index, 'alat', e.target.value)}
                                    className="sarza-alat-dropdown"
                                >
                                    <option value="">Odaberi Alat</option>
                                    {getAvailableAlatsForRow(index).map((alat, i) => (
                                        <option key={i} value={alat}>
                                            {alat}
                                        </option>
                                    ))}
                                </select>

                                {skartLinkSarza.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveSkartLinkSarza(index)}
                                            className="sarza-remove-btn">
                                        Ukloni
                                    </button>
                                )}
                            </div>
                        ))}
                        {skartLinkSarza.length < 3 && (
                            <button type="button" onClick={handleAddSkartLinkSarza} className="sarza-add-bkalat-btn">
                                Dodaj
                            </button>
                        )}
                    </div>

                    {/*<button type="submit" disabled={!isFormValid()} className="skart-save-btn">*/}
                    {/*    Unos Škarta*/}
                    {/*</button>*/}
                    <div className="sarza-submit">
                        <button type="submit" disabled={formErrors.length > 0} className="skart-submit-btn">
                            Unesi Škart
                        </button>
                    </div>
                        {/* Error Messages */}
                        {formErrors.length > 0 && (
                            <ul className="error-messages">
                                {formErrors.map((error, index) => (
                                    <li key={index} className="error-message">
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        )}

                </form>
            </div>
        </div>
    );
};

export default CreateSkart;
