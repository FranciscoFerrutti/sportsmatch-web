import React from 'react';
import './Card.css';

const Card = ({ cancha, time, date, duration, status, onAccept, onReject }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{cancha}</h3>
        <p>{time}</p>
      </div>
      <div className="card-body">
        <p>{date}</p>
        <p>{duration}</p>
        <div className="card-footer">
          {status === 'pending' ? (
            <>
              <button className="accept-btn" onClick={onAccept}>Aceptar</button>
              <button className="reject-btn" onClick={onReject}>Rechazar</button>
            </>
          ) : (
            <p>{status}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
