import React, { Component, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
const socket = require('../integrations/socket').socket;
const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;

class HumanVsHuman extends Component {
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
    newMessage: "",
    // localBool: true
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

  componentDidUpdate(prevProps, prevState) {
    const { fen, prevFEN, history } = this.state;

    // if (this.state.localBool) {
    //   socket.emit("get_move", { room: this.props.room_id });
    //   this.setState({ localBool: false });
    // }
    if (fen !== "start" && fen !== prevFEN) {
      this.setState({ prevFEN: fen });
      socket.emit("send_move", { room: this.props.room_id, currentState: this.state });
    }

    const lastMove = history[history.length - 1];
    if (this.game.in_checkmate()) {
      this.game.reset();
      let winner = lastMove.color === "b" ? "Black" : "White";
      alert("Game over, " + winner + " wins!");
    } else if (this.game.in_draw()) {
      this.game.reset();
      alert("Game over, DRAW!");
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
    const { player } = this.state;
    const piece = this.game.get(sourceSquare);
    const myPlayer = player === "white" ? "w" : "b";
    if (piece && piece.color !== myPlayer) {
      return;
    } else {
      const move = this.game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q"
      });

      if (move === null) return;

      this.setState(({ pieceSquare, history }) => ({
        fen: this.game.fen(),
        history: this.game.history({ verbose: true }),
        squareStyles: squareStyling({ pieceSquare, history })
      }));
    }
  };

  onMouseOverSquare = square => {
    let moves = this.game.moves({
      square: square,
      verbose: true
    });

    if (moves.length === 0) return;

    let squaresToHighlight = moves.map(move => move.to);

    this.setState(({ pieceSquare, history }) => ({
      squareStyles: {
        ...squareStyling({ pieceSquare, history }),
        ...squaresToHighlight.reduce(
          (acc, curr) => ({
            ...acc,
            [curr]: {
              background: "radial-gradient(circle, #fffc00 36%, transparent 40%)",
              borderRadius: "50%"
            }
          }),
          {}
        )
      }
    }));
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
    if (pieceSquare) {
      const move = this.game.move({
        from: pieceSquare,
        to: square,
        promotion: "q"
      });

      if (move === null) return;

      this.setState(prevState => ({
        fen: this.game.fen(),
        history: this.game.history({ verbose: true }),
        pieceSquare: "",
        squareStyles: squareStyling({ pieceSquare: "", history: prevState.history })
      }));
    } else {
      this.setState({
        pieceSquare: square,
        squareStyles: squareStyling({ pieceSquare: square, history })
      });
    }
  };

  onSquareRightClick = square => {
    if (this.game.game_over()) {
      this.setState({
        squareStyles: { [square]: { backgroundColor: "lime" } }
      });
    } else {
      this.setState({
        squareStyles: { [square]: { backgroundColor: "deepPink" } }
      });
    }
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
    socket.emit("send_message", { room:room_id, message });
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
        <div class="half" style={{ backgroundColor: player === "white" ? "white" : "black" , color : player === "black"  ? "white" : "black" }}>
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
          boardStyle={{
            borderRadius: "5px",
            boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`
          }}
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
  const sourceSquare = history.length && history[history.length - 1].from;
  const targetSquare = history.length && history[history.length - 1].to;

  return {
    [pieceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
    ...(history.length && {
      [sourceSquare]: {
        backgroundColor: "rgba(255, 255, 0, 0.4)"
      }
    }),
    ...(history.length && {
      [targetSquare]: {
        backgroundColor: "rgba(255, 255, 0, 0.4)"
      }
    })
  };
};

export default function WithMoveValidation({ room_id }) {
  const [player, setPlayer] = useState("white");

  useEffect(() => {
    socket.on("receive_side", (data) => {
      setPlayer(data.message);
    });
  }, []);

  return (
    <div>
      <HumanVsHuman room_id={room_id} />
    </div>
  );
}
