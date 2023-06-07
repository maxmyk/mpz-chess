import React, { Component, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
const socket = require('./socket').socket;
const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;

class Multiplayer extends Component {
  static propTypes = {
    room_id: PropTypes.string.isRequired
  };

  state = {
    fen: "start",
    dropSquareStyle: {},
    squareStyles: {},
    pieceSquare: "",
    history: [],
    prevFEN: "",
    player: "",
    chatMessages: [],
    newMessage: ""
  };

  componentDidMount() {
    const { room_id } = this.props;
    if (!this.game) {
      this.game = new Chess();
      socket.emit("join_room", room_id);
      socket.on("room_full", (data) => {
        alert("Room is full. Redirecting to home page.");
        window.location.href = "/";
      });
    }

    socket.on("receive_move", (data) => {
      this.setChessState(data);
    });

    socket.on("receive_side", (data) => {
      this.setPlayer(data.message);
    });

    socket.on("receive_message", (data) => {
      const { player, message } = data;
      this.addChatMessage(`${player}: ${message}`);
    });
  }

  componentDidUpdate() {
    const { fen, prevFEN, history, gameEnded } = this.state;

    if (fen !== "start" && fen !== prevFEN) {
      this.setState({ prevFEN: fen });
      socket.emit("send_move", { room: this.props.room_id, currentState: this.state });
    }

    const lastMove = history[history.length - 1];
    if (this.game.in_checkmate() && !gameEnded) {
      let winner = lastMove.color === "b" ? "black" : "white";
      socket.emit("get_stats", { room: this.props.room_id, message: winner });
      alert("Game over, " + winner + " wins!");
      this.game = new Chess();
      this.setState({ gameEnded: true });
    } else if (this.game.in_draw() && !gameEnded) {
      socket.emit("get_stats", { room: this.props.room_id, message: "draw" });
      alert("Game over, DRAW!");
      this.game = new Chess();
      this.setState({ gameEnded: true });
    }
  }



  setPlayer = (player) => {
    this.setState({ player });
  };

  setChessState = (data) => {
    this.setState({
      fen: data.currentState.fen,
      history: data.currentState.history,
      squareStyles: data.currentState.squareStyles
    });
    this.game.load(data.currentState.fen);
  };

  onDrop = ({ sourceSquare, targetSquare }) => {
    const { player, pieceSquare, history } = this.state;
    const piece = this.game.get(sourceSquare);
    const myPlayer = player === "white" ? "w" : "b";
    if (piece && piece.color !== myPlayer) {
      return;
    }
    const move = this.game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q"
    });
    if (move === null)
      return;
    this.setState({
      fen: this.game.fen(),
      history: this.game.history({ verbose: true }),
      squareStyles: squareStyling({ pieceSquare, history })
    });
  };

  onMouseOverSquare = square => {
    const moves = this.game.moves({
      square,
      verbose: true
    });

    if (moves.length === 0) return;
    const squaresToHighlight = moves.map(move => move.to);
    this.setState(({ pieceSquare, history }) => {
      const highlightedSquares = squaresToHighlight.reduce(
        (acc, curr) => ({
          ...acc,
          [curr]: {
            background: "#ffff00ff",
            borderRadius: "100%"
          }
        }),
        {}
      );

      return {
        squareStyles: {
          ...squareStyling({ pieceSquare, history }),
          ...highlightedSquares
        }
      };
    });
  };


  onMouseOutSquare = () => {
    this.setState(({ pieceSquare, history }) => ({
      squareStyles: squareStyling({ pieceSquare, history })
    }));
  };

  onSquareClick = square => {
    const { player, pieceSquare, history } = this.state;
    const piece = this.game.get(square);
    const myPlayer = player === "white" ? "w" : "b";

    if (piece && piece.color !== myPlayer) {
      return;
    }
    const newState = {};
    if (pieceSquare) {
      const move = this.game.move({
        from: pieceSquare,
        to: square,
        promotion: "q"
      });
      if (move === null)
        return;
      newState.history = this.game.history({ verbose: true });
      newState.pieceSquare = "";
    } else {
      newState.pieceSquare = square;
    }
    newState.fen = this.game.fen();
    newState.squareStyles = squareStyling({ pieceSquare: newState.pieceSquare, history });
    this.setState(newState);
  };

  handleInputChange = event => {
    this.setState({ newMessage: event.target.value });
  };

  handleSendMessage = event => {
    event.preventDefault();
    const { player, newMessage } = this.state;
    const { room_id } = this.props;
    const message = {
      player: player,
      message: newMessage
    };
    // if stripped message is empty, don't send
    if (!newMessage.replace(/\s/g, "").length) {
      return;
    }
    this.addChatMessage(`${player}: ${newMessage}`);
    socket.emit("send_message", { room: room_id, message });
    this.setState({ newMessage: "" });
  };

  addChatMessage = message => {
    this.setState(prevState => ({
      chatMessages: [...prevState.chatMessages, message]
    }));
  };

  render() {
    const { fen, dropSquareStyle, squareStyles, player, chatMessages, newMessage } = this.state;
    return (
      <div class="centred_pvp">
        <div class="half" style={{ backgroundColor: player === "white" ? "white" : "black", color: player === "black" ? "white" : "black" }}>
          <div class="chatbox">
            {chatMessages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
          <form onSubmit={this.handleSendMessage}>
            <input type="text" value={newMessage} onChange={this.handleInputChange} />
            <button type="submit">Send</button>
          </form>
        </div>
        <Chessboard
          width={600}
          position={fen}
          onDrop={this.onDrop}
          onMouseOverSquare={this.onMouseOverSquare}
          onMouseOutSquare={this.onMouseOutSquare}
          squareStyles={squareStyles}
          dropSquareStyle={dropSquareStyle}
          onSquareClick={this.onSquareClick}
          onSquareRightClick={this.onSquareRightClick}
          orientation={player}
        />
      </div>
    );
  }
}

const squareStyling = ({ pieceSquare, history }) => {
  const { from, to } = history[history.length - 1] || {};
  const backgroundColor = "#ff000033";

  return {
    [pieceSquare]: { backgroundColor },
    ...(from && { [from]: { backgroundColor } }),
    ...(to && { [to]: { backgroundColor } })
  };
};


export default function MultiplayerWithMoveValidation({ room_id }) {
  const [, setPlayer] = useState("white");
  useEffect(() => {
    socket.on("receive_side", (data) => {
      setPlayer(data.message);
    });
  }, []);

  return (
    <div>
      <Multiplayer room_id={room_id} />
    </div>
  );
}

