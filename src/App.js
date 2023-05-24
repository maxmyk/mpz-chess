import './App.css';
import React, { Component } from "react";
// import Chessboard from "chessboardjsx";
import WithMoveValidation from "./integrations/bot_game";


// function App() rewritten to have two buttons. if the first button is clicked, then the first board is shown. if the second button is clicked, then the second board is shown.
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Really cool multiplayer chess</h1>
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