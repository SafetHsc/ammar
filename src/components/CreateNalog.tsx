import React, { useState } from 'react';

interface NalogFormData {
    broj_naloga: string;
    firma: string;
    broj_komada_alat: { alat: string, broj_komada: number }[];
    total_broj_komada: number;
    opis?: string;
    completed: boolean;
}

const CreateNalog: React.FC = () => {
    const [formData, setFormData] = useState<NalogFormData>({
        broj_naloga: '',
        firma: '',
        broj_komada_alat: [{ alat: '', broj_komada: 0 }],
        total_broj_komada: 0,
        opis: '',
        completed: false, // Automatically set completed to 0 (false) on creation
    });

    const [successMessage, setSuccessMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { name, value } = e.target;
        const updatedData = [...formData.broj_komada_alat];
        updatedData[index] = { ...updatedData[index], [name]: value };

        // Recalculate total_broj_komada based on the sum of broj_komada
        const total_broj_komada = updatedData.reduce((sum, item) => sum + Number(item.broj_komada), 0);
        setFormData({ ...formData, broj_komada_alat: updatedData, total_broj_komada });
    };

    const handleAddInput = () => {
        setFormData({
            ...formData,
            broj_komada_alat: [...formData.broj_komada_alat, { alat: '', broj_komada: 0 }],
        });
    };

    const handleRemoveInput = (index: number) => {
        const updatedData = formData.broj_komada_alat.filter((_, i) => i !== index);
        const total_broj_komada = updatedData.reduce((sum, item) => sum + Number(item.broj_komada), 0);
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
                setSuccessMessage('Nalog created successfully!');
                setErrorMessage('');
            } else {
                throw new Error('Error creating nalog');
            }
        } catch (error) {
            setErrorMessage('Error creating nalog.');
            setSuccessMessage('');
        }
    };

    return (
        <div>
            <h1>Create Nalog</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Broj Naloga:</label>
                    <input
                        type="text"
                        value={formData.broj_naloga}
                        onChange={(e) => setFormData({ ...formData, broj_naloga: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label>Firma:</label>
                    <input
                        type="text"
                        value={formData.firma}
                        onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label>Broj Komada + Alat:</label>
                    {formData.broj_komada_alat.map((input, index) => (
                        <div key={index}>
                            <input
                                type="text"
                                name="alat"
                                value={input.alat}
                                onChange={(e) => handleInputChange(e, index)}
                                placeholder="Alat"
                                required
                            />
                            <input
                                type="number"
                                name="broj_komada"
                                value={input.broj_komada}
                                onChange={(e) => handleInputChange(e, index)}
                                placeholder="Broj Komada"
                                required
                            />
                            {formData.broj_komada_alat.length > 1 && (
                                <button type="button" onClick={() => handleRemoveInput(index)}>Remove</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddInput}>+ Add More</button>
                </div>
                <div>
                    <label>Opis:</label>
                    <input
                        type="text"
                        value={formData.opis || ''}
                        onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                    />
                </div>

                <button type="submit">Create Nalog</button>
            </form>

            {successMessage && <p>{successMessage}</p>}
            {errorMessage && <p>{errorMessage}</p>}
        </div>
    );
};

export default CreateNalog;
