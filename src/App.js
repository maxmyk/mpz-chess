import './App.css';
import React from "react";
import WithMoveValidation from "./integrations/validator";
import io from "socket.io-client"
import { useEffect } from "react";
const socket = io("http://localhost:3001")

function App() {
  useEffect(() => {
    socket.on("receive_move", (msg) => {
      alert(msg.message);
    })
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

