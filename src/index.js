import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Home from './Home';
import GameMultiplayer from './GameMultiplayer';
import Statistic from './Statistic';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game_bot" element={<App />} />
        <Route path="/game_multiplayer/*" element={<GameMultiplayer />} />
        <Route path="/statistic" element={<Statistic />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
