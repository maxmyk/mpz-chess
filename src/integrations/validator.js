import React, { Component } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;

class HumanVsHuman extends Component {
  static propTypes = { children: PropTypes.func };
  state = {
    fen: "start",
    dropSquareStyle: {},
    squareStyles: {},
    pieceSquare: "",
    square: "",
    history: []
  };
  componentDidMount() {
    this.game = new Chess();
  }
  componentDidUpdate(prevProps, prevState) {
  //   const sendData = (data) => {
  //     socket.emit("send_move", { message: data})
  //  }
    if (this.game.in_checkmate()) {
      this.setState(({ pieceSquare, history }) => ({
        fen: "start",
        history: this.game.history({ verbose: true }),
        squareStyles: squareStyling({ pieceSquare, history })
      }));
      this.game.reset();
      let fen = this.state.fen;
      let winner = fen.split(" ")[1];
      if (winner === "w") {
        winner = "Black";
      } else {
        winner = "White";
      }
      alert("Game over, " + winner + " wins!");
    }
    if (this.game.in_draw()) {
      this.setState(({ pieceSquare, history }) => ({
        fen: "start",
        history: this.game.history({ verbose: true }),
        squareStyles: squareStyling({ pieceSquare, history })
      }));
      this.game.reset();
      alert("Game over, DRAW!");
    }
  }
  removeHighlightSquare = () => {
    this.setState(({ pieceSquare, history }) => ({
      squareStyles: squareStyling({ pieceSquare, history })
    }));
  };
  highlightSquare = (sourceSquare, squaresToHighlight) => {
    const highlightStyles = [sourceSquare, ...squaresToHighlight].reduce(
      (a, c) => {
        return {
          ...a,
          ...{
            [c]: {
              background:
                "radial-gradient(circle, #fffc00 36%, transparent 40%)",
              borderRadius: "50%"
            }
          },
          ...squareStyling({
            history: this.state.history,
            pieceSquare: this.state.pieceSquare
          })
        };
      },
      {}
    );

    this.setState(({ squareStyles }) => ({
      squareStyles: { ...squareStyles, ...highlightStyles }
    }));
  };

  onDrop = ({ sourceSquare, targetSquare }) => {
    let move = this.game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q"
    });
    if (move === null) return;
    this.setState(({ history, pieceSquare }) => ({
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
    let squaresToHighlight = [];
    for (var i = 0; i < moves.length; i++) {
      squaresToHighlight.push(moves[i].to);
    }
    this.highlightSquare(square, squaresToHighlight);
  };

  onMouseOutSquare = square => this.removeHighlightSquare(square);

  onDragOverSquare = square => {
    this.setState({
      dropSquareStyle:
        square === "e4" || square === "d4" || square === "e5" || square === "d5"
          ? { backgroundColor: "cornFlowerBlue" }
          : { boxShadow: "inset 0 0 1px 4px rgb(255, 255, 0)" }
    });
  };

  onSquareClick = square => {
    this.setState(({ history }) => ({
      squareStyles: squareStyling({ pieceSquare: square, history }),
      pieceSquare: square
    }));
    let move = this.game.move({
      from: this.state.pieceSquare,
      to: square,
      promotion: "q"
    });
    if (move === null) return;
    this.setState({
      fen: this.game.fen(),
      history: this.game.history({ verbose: true }),
      pieceSquare: ""
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
      onDragOverSquare: this.onDragOverSquare,
      onSquareClick: this.onSquareClick,
      onSquareRightClick: this.onSquareRightClick
    });
  }
}

export default function WithMoveValidation() {
  return (
    <div>
      <HumanVsHuman>
        {({
          position,
          onDrop,
          onMouseOverSquare,
          onMouseOutSquare,
          squareStyles,
          dropSquareStyle,
          onDragOverSquare,
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
            onDragOverSquare={onDragOverSquare}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
          />
        )}
      </HumanVsHuman>

    </div>
  );
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
