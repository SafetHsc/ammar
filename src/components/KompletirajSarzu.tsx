import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Sarza {
    id: number;
    nalog_id: number;
    broj_komada_alat: string;
    total_br_kmd: number;
    skart: string;
    total_skart: number;
    kada_id: number;
    completed: number;
    created_at: string;
    completed_at: string | null;
}

const KompletirajSarzu: React.FC = () => {
    const [sarzas, setSarzas] = useState<Sarza[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchSarzas = async () => {
            try {
                const response = await fetch('/api/sarzas'); // Your backend endpoint for all sarzas
                if (!response.ok) throw new Error('Failed to fetch sarzas');
                const data: Sarza[] = await response.json();
                // Filter out only incomplete sarzas (completed = 0)
                const incompleteSarzas = data.filter(sarza => sarza.completed === 0);
                setSarzas(incompleteSarzas);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSarzas();
    }, []);

    if (loading) return <p>Učitavanje šarži...</p>;
    if (error) return <p>Error: {error}</p>;

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSarzas = sarzas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sarzas.length / itemsPerPage);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Function to handle "Kompletiraj" button click
    const handleComplete = async (id: number) => {
        try {
            const response = await fetch(`/api/sarzas/${id}/complete`, {
                method: 'PUT',
            });

            if (response.ok) {
                alert('Sarza marked as completed!');
                // Remove the completed sarza from the list without refreshing the page
                setSarzas(sarzas.filter(sarza => sarza.id !== id));
            } else {
                alert('Error completing sarza');
            }
        } catch (error) {
            console.error('Error completing sarza:', error);
            alert('Error completing sarza');
        }
    };

    return (
        <div className="kompletiraj-sarzu" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="sarza-h2">Kompletiraj Šarže</h2>
            <div className="sarza-nazad" style={{ marginBottom: '20px' }}>
                <Link to="/nalozi-sarze">Nazad</Link>
            </div>

            <div style={{ maxHeight: 'calc(70vh - 50px)', overflowY: 'auto', paddingBottom: '40px' }}>
                <table className="nalogs-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nalog ID</th>
                        <th>Ukupan Broj Komada</th>
                        <th>Ukupan Škart</th>
                        <th>Kreirano</th>
                        <th>Akcija</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentSarzas.map((sarza) => (
                        <tr key={sarza.id}>
                            <td>{sarza.id}</td>
                            <td>{sarza.nalog_id}</td>
                            <td>{sarza.total_br_kmd}</td>
                            <td>{sarza.total_skart}</td>
                            <td>{new Date(sarza.created_at).toLocaleString()}</td>
                            <td>
                                <button
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                    }}
                                    onClick={() => handleComplete(sarza.id)}
                                >
                                    Kompletiraj
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={{ marginRight: '10px', padding: '5px 10px' }}
                >
                    Prethodna
                </button>
                <span>
                    Stranica {currentPage} od {totalPages}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
                    Sljedeća
                </button>
            </div>
        </div>
    );
};

export default KompletirajSarzu;
