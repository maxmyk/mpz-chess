import React, { Component, useState } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
import { useNavigate } from "react-router-dom";
const socket = require('../integrations/socket').socket;
const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;

var player = "black";

class HumanVsHuman extends Component {
  static propTypes = {
    children: PropTypes.func,
    room_id: PropTypes.string.isRequired
  };

  state = {
    fen: "start",
    dropSquareStyle: {},
    squareStyles: {},
    pieceSquare: "",
    history: [],
    prevFEN: ""
  };

  componentDidMount() {
    // Check ig this.game does not exist
    if (!this.game) {
      this.game = new Chess();
      socket.emit("join_room", this.props.room_id);
      socket.on("room_full", (data) => {
        // Redirect to home page
        alert("Room is full. Redirecting to home page.");
        window.location.href = "/"; // Use window.location.href to redirect
      });
    }    
    socket.on("receive_move", (data) => {
      this.setChessState(data);
    });
    // alert("You are playing as " + player + "and your room id is " + this.props.room_id + ".");
  }

  componentDidUpdate(prevProps, prevState) {
    const { fen, prevFEN, history } = this.state;

    if (fen !== "start" && fen !== prevFEN) {
      this.setState({ prevFEN: fen });
      alert("You are playing as " + player + "and your room id is " + this.props.room_id + ".");
      socket.emit("send_move", { room: this.props.room_id, currentState: this.state });
    }

    if (history.length !== prevState.history.length) {
      const lastMove = history[history.length - 1];
      if (this.game.in_checkmate()) {
        this.game.reset();
        let winner = lastMove.color === "w" ? "Black" : "White";
        alert("Game over, " + winner + " wins!");
      } else if (this.game.in_draw()) {
        this.game.reset();
        alert("Game over, DRAW!");
      }
    }
  }

  setChessState = (data) => {
    const { fen, prevFEN, history } = this.state;
    this.setState({
      fen: data.currentState.fen,
      history: data.currentState.history,
      squareStyles: data.currentState.squareStyles
    });
    this.game.load(data.currentState.fen);
  };

  onDrop = ({ sourceSquare, targetSquare }) => {
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
    this.setState(({ pieceSquare, history }) => {
      const piece = this.game.get(square);

      if (piece && piece.color === this.game.turn()) {
        return {
          squareStyles: squareStyling({ pieceSquare: square, history }),
          pieceSquare: square
        };
      } else if (pieceSquare) {
        const move = this.game.move({
          from: pieceSquare,
          to: square,
          promotion: "q"
        });

        if (move === null) return {};

        return {
          fen: this.game.fen(),
          history: this.game.history({ verbose: true }),
          pieceSquare: ""
        };
      }

      return {};
    });
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

  render() {
    const { fen, dropSquareStyle, squareStyles } = this.state;
    return this.props.children({
      squareStyles,
      position: fen,
      onMouseOverSquare: this.onMouseOverSquare,
      onMouseOutSquare: this.onMouseOutSquare,
      onDrop: this.onDrop,
      dropSquareStyle,
      onSquareClick: this.onSquareClick,
      onSquareRightClick: this.onSquareRightClick
    });
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
  return (
    <div>
      <HumanVsHuman room_id={room_id}>
        {({
          position,
          onDrop,
          onMouseOverSquare,
          onMouseOutSquare,
          squareStyles,
          dropSquareStyle,
          onSquareClick,
          onSquareRightClick
        }) => (
          <Chessboard
            id="humanVsHuman"
            width={600}
            position={position}
            onDrop={onDrop}
            onMouseOverSquare={onMouseOverSquare}
            onMouseOutSquare={onMouseOutSquare}
            boardStyle={{
              borderRadius: "5px",
              boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`
            }}
            squareStyles={squareStyles}
            dropSquareStyle={dropSquareStyle}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
            orientation={player} // Change this
          />
        )}
      </HumanVsHuman>
    </div>
  );
}
