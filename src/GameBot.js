import React from "react";
import WithMoveValidation from "./integrations/botGame";

function BotGame() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Really cool multiplayer chess</h1>
        <div class="boardsContainer">
          <WithMoveValidation />
        </div>
      </header>
    </div>
  );
}

export default BotGame;
