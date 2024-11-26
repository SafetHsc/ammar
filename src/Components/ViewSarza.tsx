import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ViewSarza: React.FC = () => {
    const [sarzas, setSarzas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSarzas = async () => {
            try {
                const response = await axios.get('/api/sarza');
                setSarzas(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching sarzas:', error);
                setLoading(false);
            }
        };

        fetchSarzas();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2>Sarza List</h2>
            {sarzas.length === 0 ? (
                <p>No sarzas available.</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nalog ID</th>
                        <th>Broj Komada</th>
                        <th>Alat</th>
                        <th>Skart</th>
                        <th>Kada</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sarzas.map((sarza) => (
                        <tr key={sarza.id}>
                            <td>{sarza.id}</td>
                            <td>{sarza.nalog_id}</td>
                            <td>{sarza.broj_komada}</td>
                            <td>{sarza.alat}</td>
                            <td>
                                {sarza.skart && sarza.skart.map((item: any, index: number) => (
                                    <div key={index}>{`From Sarza: ${item.sarzaId}, Count: ${item.count}`}</div>
                                ))}
                            </td>
                            <td>{sarza.kada_name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ViewSarza;
