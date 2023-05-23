import './App.css';
import React, { useEffect } from "react";
import WithMoveValidation from "./integrations/validator";
const socket = require('./integrations/socket').socket

function App() {
  useEffect(() => {
    socket.on("receive_move", (data) => {
      alert(data)
    });
  }, [socket]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Really cool multiplayer chess</h1>
        <div>Send this link to your friend:</div>
        <a href={window.location.href}>{window.location.href}#your_unique_id</a>
        <div style={boardsContainer}>
          <WithMoveValidation />
        </div>
      </header>
    </div>
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

