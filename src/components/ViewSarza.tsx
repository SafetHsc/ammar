import React, { useState, useEffect } from 'react';

// Define the type for a Sarza object
interface Sarza {
    id: number;
    broj_naloga: string;
    broj_komada: number;
    alat: string;
    kada_name: string;
}

const ViewSarza: React.FC = () => {
    const [sarzas, setSarzas] = useState<Sarza[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchSarzas = async () => {
            try {
                const response = await fetch('/api/sarzas');
                if (!response.ok) {
                    throw new Error('Failed to fetch Sarzas');
                }
                const data = await response.json();
                setSarzas(data);
            } catch (error) {
                setError('Error fetching Sarzas');
            } finally {
                setLoading(false);
            }
        };

        fetchSarzas();
    }, []);

    return (
        <div>
            <h2>View Sarzas</h2>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {sarzas.map((sarza) => (
                    <li key={sarza.id}>
                        Nalog: {sarza.broj_naloga}, Broj Komada: {sarza.broj_komada}, Alat: {sarza.alat}, Kada: {sarza.kada_name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ViewSarza;
