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
    removed_at: string | null; // Added for clarity
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

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSarzas = sarzas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.max(Math.ceil(sarzas.length / itemsPerPage), 1);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleComplete = async (id: number, totalSkart: number) => {
        if (totalSkart === 0) {
            const confirmComplete = window.confirm(
                'Za ovu šaržu nije unešen škart. Da li ste sigurni da želite kompletirati ovu šaržu?'
            );
            if (!confirmComplete) {
                return;
            }
        }

        try {
            const response = await fetch(`/api/sarzas/${id}/complete`, {
                method: 'PUT',
            });

            if (response.ok) {
                alert('Šarža je uspješno kompletirana!');
                setSarzas(sarzas.filter(sarza => sarza.id !== id));
            } else {
                alert('Greška pri kompletiranju šarže');
            }
        } catch (error) {
            console.error('Greška pri kompletiranju šarže:', error);
            alert('Greška pri kompletiranju šarže');
        }
    };

    const handleRemoveFromKada = async (id: number) => {
        const confirmRemove = window.confirm(
            'Da li ste sigurni da želite označiti šaržu kao uklonjenu iz kade?'
        );

        if (!confirmRemove) return;

        try {
            const response = await fetch(`/api/sarzas/${id}/remove`, {
                method: 'PUT',
            });

            if (response.ok) {
                alert('Šarža je uspješno označena kao uklonjena iz kade!');
                setSarzas(prevSarzas =>
                    prevSarzas.map(sarza =>
                        sarza.id === id ? { ...sarza, removed_at: new Date().toISOString() } : sarza
                    )
                );
            } else {
                alert('Greška pri označavanju šarže kao uklonjene');
            }
        } catch (error) {
            console.error('Greška pri označavanju šarže kao uklonjene:', error);
            alert('Greška pri označavanju šarže kao uklonjene');
        }
    };

    return (
        <div className="view-nalogs">
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
                        <th>Broj Komada + Alat</th>
                        <th>Ukupan Broj Komada</th>
                        <th>Ukupan Škart</th>
                        <th>Kreirano</th>
                        <th>Akcija</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentSarzas.map(sarza => (
                        <tr key={sarza.id}>
                            <td>{sarza.id}</td>
                            <td>{sarza.nalog_id}</td>
                            <td>
                                {sarza.broj_komada_alat
                                    ? JSON.parse(sarza.broj_komada_alat)
                                        .map(
                                            (item: { alat: string; broj_komada: string }) =>
                                                `${item.broj_komada} ${item.alat}`
                                        )
                                        .join('; ')
                                    : '-'}
                            </td>
                            <td>{sarza.total_br_kmd}</td>
                            <td>{sarza.total_skart}</td>
                            <td>{new Date(sarza.created_at).toLocaleString()}</td>
                            <td>
                                <button
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginRight: '5px',
                                    }}
                                    onClick={() => handleComplete(sarza.id, sarza.total_skart)}
                                >
                                    Kompletiraj
                                </button>
                                {sarza.removed_at === null && (
                                    <button
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => handleRemoveFromKada(sarza.id)}
                                    >
                                        Ukloni iz Kade
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

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
