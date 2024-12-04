import React from "react";
import grijacOn from "../assets/grijacON.png";
import grijacOff from "../assets/grijacOff.jpg";

interface CardProps {
    id: number;
    topTemperature: number | null;
    currentTemperature: number | null;
    bottomTemperature: number | null;
    elGrijac: number;
    isLoggedIn: boolean;
}

const Card: React.FC<CardProps> = ({ id, topTemperature, currentTemperature, bottomTemperature, elGrijac, isLoggedIn }) => {
    const cardName = id === 10 ? 'BAJC' : `KADA ${id}`;

    const handleClick = () => {
        if (isLoggedIn) {
            window.location.href = `/card/${id}`;
        } else {
            alert('Molimo vas, prijavite se za pristup detaljima.');
        }
    };

    return (
        <div className="card" onClick={handleClick}>
            <img src={elGrijac === 1 ? grijacOn : grijacOff} alt="Temperature Icon" className="temp-icon" />
            <div className="temp-info">
                <h3 className="card-name">{cardName}</h3>
                <ul className="temp-list">
                    <li><span className="top-temp">Najviša Temperatura:</span> {topTemperature !== null ? `${topTemperature}°C` : 'Loading...'}</li>
                    <li><span className="current-temp">Trenutna Temperatura:</span> <p className="current-temp-broj">{currentTemperature !== null ? `${currentTemperature}°C` : 'Loading...'}</p></li>
                    <li><span className="bottom-temp">Najniža Temperatura:</span> {bottomTemperature !== null ? `${bottomTemperature}°C` : 'Loading...'}</li>
                </ul>
            </div>
        </div>
    );
};

export default Card;