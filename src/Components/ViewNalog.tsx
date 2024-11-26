import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ViewNalog: React.FC = () => {
    const [nalogs, setNalogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNalogs = async () => {
            try {
                const response = await axios.get('/api/nalog');
                setNalogs(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching nalogs:', error);
                setLoading(false);
            }
        };

        fetchNalogs();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2>Nalog List</h2>
            {nalogs.length === 0 ? (
                <p>No nalogs available.</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Broj Naloga</th>
                        <th>Firma</th>
                        <th>Broj Komada</th>
                        <th>Opis</th>
                        <th>Completed</th>
                    </tr>
                    </thead>
                    <tbody>
                    {nalogs.map((nalog) => (
                        <tr key={nalog.id}>
                            <td>{nalog.id}</td>
                            <td>{nalog.broj_naloga}</td>
                            <td>{nalog.firma}</td>
                            <td>
                                {nalog.broj_komada.map((item: any, index: number) => (
                                    <div key={index}>{`${item.number} (${item.type})`}</div>
                                ))}
                            </td>
                            <td>{nalog.opis || 'N/A'}</td>
                            <td>{nalog.completed === 'yes' ? 'Yes' : 'No'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ViewNalog;
