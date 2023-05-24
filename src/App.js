import './App.css';
import React from "react";
import WithMoveValidation from "./integrations/validator";
import { Route, Routes, useParams, Navigate } from "react-router-dom";

const GameMultiplayer = () => {
  let { room_id } = useParams();

  // Generate a random room number if room_id is not present
  if (!room_id) {
    room_id = Math.floor(Math.random() * 1000000).toString();
    return <Navigate to={`/game_multiplayer/${room_id}`} />;
  }

  // Use the room_id value in your component logic

  return (
    <div>
      <h1>Multiplayer Game</h1>
      <p>Room ID: {room_id}</p>
      {/* Render the rest of your multiplayer game */}
    </div>
  );
};


function App() {

  return (
    <header className="App-header">
      <Routes>
        <Route exact path="/game_multiplayer" component={GameMultiplayer} />
        <Route path="/game_multiplayer/:room_id" component={GameMultiplayer} />
        <h1>Really cool multiplayer chess</h1>
        <div>Send this link to your friend:</div>
        <a href={window.location.href}>{window.location.href}#your_unique_id</a>
        <div style={boardsContainer}>
          <WithMoveValidation />
        </div>
      </Routes>
    </header>
  );
}

export default App;

const boardsContainer = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  flexWrap: "wrap",
  width: "100vw",
  marginTop: 30,
  marginBottom: 50
};

