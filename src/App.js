import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Canchas from './pages/Canchas';
import Reservas from './pages/Reservas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/canchas" element={<Canchas />} />
        <Route path="/reservas" element={<Reservas />} />

      </Routes>
    </Router>
  );
}

export default App;
