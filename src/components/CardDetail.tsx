import React, {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";

interface TemperatureData {
    id: number;
    cardName: string;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
    elGrijac: number;
}

const CardDetail: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
    const { id } = useParams<{ id: string }>();
    const [cardData, setCardData] = useState<TemperatureData | null>(null);
    const [loading, setLoading] = useState(true);
    const [topTemperature, setTopTemperature] = useState<string>('');
    const [bottomTemperature, setBottomTemperature] = useState<string>('');
    const [existingTemperatures, setExistingTemperatures] = useState<TemperatureData | null>(null);
    const [message] = useState<string>('');

    useEffect(() => {
        const fetchCardData = async () => {
            try {
                const response = await fetch(`/api/cards/${id}`);
                if (!response.ok) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Network response was not ok');
                }
                const data: TemperatureData = await response.json();
                setCardData(data);
                setExistingTemperatures(data);

                setTopTemperature('');
                setBottomTemperature('');

            } catch (error) {
                console.error('Greška u učitavanju podataka:', error);

            } finally {
                setLoading(false);
            }
        };
        fetchCardData();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const updatedData = {
            id: Number(id),
            topTemperature: topTemperature ? Number(topTemperature) : existingTemperatures?.topTemperature,
            bottomTemperature: bottomTemperature ? Number(bottomTemperature) : existingTemperatures?.bottomTemperature,
            currentTemperature: existingTemperatures?.currentTemperature
        };

        if (!isLoggedIn) {
            alert('Morate biti prijavljeni za izmjene temperatura!.');
            return;
        }

        try {
            const response = await fetch(`/api/cards/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                alert('Temperature uspješno promijenjene!');

                const updatedResponse = await fetch(`/api/cards/${id}`);
                const updatedCardData: TemperatureData = await updatedResponse.json();

                setCardData(updatedCardData);
                setExistingTemperatures(updatedCardData);

                // Empties the numbers from form
                setTopTemperature('');
                setBottomTemperature('');

                setCardData(updatedCardData);
                setExistingTemperatures(updatedCardData);

            }
            else {
                alert('Temperatura nije promijenjena.');
            }

        } catch (error) {
            console.error('Greška u ažuriranju temperatura:', error);
            alert('Greška u ažuriranju temperatura.');
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!cardData) {
        return <p>No data found.</p>;
    }



    return (
        <div className="kont-temp-div">
            <h2 className="h2-kont-temp">{cardData.cardName} - Kontrola Temperatura</h2>
            <div className="kont-temp">
                <div className="kont-temp-left">
                    <div className="card-detail">
                        <p><span className="toptemp-span">Najviša Temperatura:</span> {cardData.topTemperature}°C</p>
                        <p><span className="currenttemp-span">Trenutna Temperatura:</span> {cardData.currentTemperature}°C</p>
                        <p><span className="bottomtemp-span ">Najniža Temperatura:</span> {cardData.bottomTemperature}°C</p>
                    </div>
                </div>

                <div className="card-detail-div">
                    {isLoggedIn && (
                        <form className="temp-form" onSubmit={handleUpdate}>
                            <h3 className="podesavanje-temp">Podešavanje Temperatura</h3>
                            <div className="tt-form-div">
                                <label className="tt-label">Najviša Temperatura:</label>
                                <input
                                    className="top-temp-form"
                                    type="number"
                                    min={55}
                                    max={100}
                                    value={topTemperature}
                                    onChange={(e) => setTopTemperature(e.target.value)} //{handleTopTemperatureChange}
                                    //placeholder={`Može biti do 100`} // ${minTemperature}
                                />
                            </div>

                            <div className="bt-form-div">
                                <label className="bt-label">Najniža Temperatura:</label>
                                <input
                                    className="donja-temp-form"
                                    type="number"
                                    min={55}
                                    max={80}
                                    value={bottomTemperature}
                                    onChange={(e) => setBottomTemperature(e.target.value)} //onChange={handleBottomTemperatureChange}
                                    //placeholder={`   `}
                                />
                            </div>
                            <button className="temp-submit" type="submit">Promijeni</button>
                        </form>
                    )}

                    {!isLoggedIn && <p className="warning"><b>Morate biti prijavljeni za podešavanje temperatura!</b></p>}
                    {message && <p>{message}</p>}

                    <Link to="/" className="nazad" >Nazad</Link>
                </div>
            </div>
        </div>

    );
};

export default CardDetail;