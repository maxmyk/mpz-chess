import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import BotGame from './GameBot';
import Home from './Home';
import GameMultiplayer from './GameMultiplayer';
import Statistic from './Statistic';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

const BackToHomeLink = () => {
  const location = useLocation();

  if (location.pathname === '/') {
    return null; // Don't render the link on the home page
  }

  return <a href="/">Back to home</a>;
};

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game_bot" element={<BotGame />} />
        <Route path="/game_multiplayer/*" element={<GameMultiplayer />} />
        <Route path="/statistic" element={<Statistic />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BackToHomeLink />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
