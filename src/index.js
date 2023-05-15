import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Home from './Home';
import Statistic from './Statistic';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route exact path="/game_multiplayer" element={<App />} />
        <Route exact path="/game_bot" element={<App />} />
        <Route path="/" element={<Home />} />
        <Route path="/statistic" element={<Statistic />} />
        <Route element={<h1>404 - Not Found</h1>} />
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
