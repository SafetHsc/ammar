import React, { useState, useEffect } from 'react';

// Define the type for a Nalog object
interface Nalog {
    id: number;
    broj_naloga: string;
    completed: 'yes' | 'no';
}

const ViewNalog: React.FC = () => {
    const [nalogs, setNalogs] = useState<Nalog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // Fetch nalogs data on component mount
        const fetchNalogs = async () => {
            try {
                const response = await fetch('/api/nalogs');
                if (!response.ok) {
                    throw new Error('Failed to fetch nalogs');
                }
                const data = await response.json();
                setNalogs(data);
            } catch (err) {
                setError('Error fetching nalogs');
            } finally {
                setLoading(false);
            }
        };

        fetchNalogs();
    }, []);

    const markAsCompleted = async (id: number) => {
        try {
            // Update the nalog on the backend
            const response = await fetch(`/api/nalogs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: 'yes' }),
            });

            if (!response.ok) {
                throw new Error('Failed to update nalog');
            }

            // Update the local state after the backend update
            setNalogs((prevNalogs) =>
                prevNalogs.map((nalog) =>
                    nalog.id === id ? { ...nalog, completed: 'yes' } : nalog
                )
            );
        } catch (err) {
            setError('Failed to mark as completed');
        }
    };

    return (
        <div>
            <h2>Nalogs</h2>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {nalogs.map((nalog) => (
                    <li key={nalog.id}>
                        {nalog.broj_naloga} - {nalog.completed}
                        {nalog.completed === 'no' && (
                            <button onClick={() => markAsCompleted(nalog.id)}>
                                Mark as Completed
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ViewNalog;
