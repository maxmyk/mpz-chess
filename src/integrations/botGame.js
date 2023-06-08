import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
import axios from "axios";

const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;
const lichessApi = "lip_8mesw2BXarmzrgqlt5DD";

async function getBestMove(position) {
  const parts = position.split(" ");
  parts[parts.length - 3] = "-";
  const currFen = parts.join(" ");
  try {
    const response = await axios.get("https://lichess.org/api/cloud-eval", {
      params: {
        fen: currFen,
        multiPv: 1,
      },
      headers: {
        Authorization: "Bearer " + lichessApi,
      },
    });
    const bestMove = response.data.pvs[0].moves.slice(0, 4);
    return bestMove;
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
}

const game = new Chess();

function Singleplayer({ children }) {
  const [fen, setFen] = useState("start");
  const [dropSquareStyle, setDropSquareStyle] = useState({});
  const [squareStyles, setSquareStyles] = useState({});
  const [pieceSquare, setPieceSquare] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (history.length !== 0) {
      const lastMove = history[history.length - 1];
      if (game.in_checkmate()) {
        handleGameOver(lastMove);
      } else if (
        game.in_draw() ||
        game.in_stalemate() ||
        game.in_threefold_repetition()
      ) {
        handleDraw();
      }
    }
  }, [history]);

  const handleGameOver = (lastMove) => {
    const winner = lastMove.color === "b" ? "Black" : "White";
    game.reset();
    setFen(game.fen());
    setHistory(game.history({ verbose: true }));
    setSquareStyles({});
    alert(`Game over, ${winner} wins!`);
  };

  const handleDraw = () => {
    game.reset();
    setFen(game.fen());
    setHistory(game.history({ verbose: true }));
    setSquareStyles({});
    alert("Game over, DRAW!");
  };

  const makeMoveOnBoard = (move) => {
    const { source, target, promotion } = move;
    const chessMove = game.move({ from: source, to: target, promotion });
    if (chessMove !== null) {
      setFen(game.fen());
      setHistory(game.history({ verbose: true }));
      setSquareStyles(squareStyling({ pieceSquare, history }));
    }
  };

  const onDrop = async ({ sourceSquare, targetSquare }) => {
    let move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) return;

    setFen(game.fen());
    setHistory(game.history({ verbose: true }));
    setPieceSquare("");

    if (move.color === "w") {
      try {
        const bestMove = await getBestMove(game.fen());
        console.log("Best move:", bestMove);
        if (bestMove) {
          const move = {
            source: bestMove.slice(0, 2),
            target: bestMove.slice(2, 4),
            promotion: "q",
          };
          makeMoveOnBoard(move);
        }
      } catch (error) {
        const possibleMoves = game.moves();
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        game.move(possibleMoves[randomIndex]);
        setFen(game.fen());
        setHistory(game.history({ verbose: true }));
      }
    }
  };

  const onMouseOverSquare = (square) => {
    const moves = game.moves({
      square,
      verbose: true,
    });

    if (moves.length === 0) return;
    const squaresToHighlight = moves.map((move) => move.to);
    setSquareStyles((prevSquareStyles) => ({
      ...squareStyling({ pieceSquare, history }),
      ...squaresToHighlight.reduce(
        (acc, curr) => ({
          ...acc,
          [curr]: {
            background: "#ffff00ff",
            borderRadius: "100%",
          },
        }),
        {}
      ),
    }));
  };

  const onMouseOutSquare = () => {
    setSquareStyles(squareStyling({ pieceSquare, history }));
  };

  const onSquareClick = async (square) => {
    setSquareStyles(squareStyling({ pieceSquare: square, history }));
    setPieceSquare(square);
    const move = game.move({
      from: pieceSquare,
      to: square,
      promotion: "q",
    });
    if (move === null) return;
    setFen(game.fen());
    setHistory(game.history({ verbose: true }));
    setPieceSquare("");

    try {
      const bestMove = await getBestMove(game.fen());
      console.log("Best move:", bestMove);
      if (bestMove) {
        const move = {
          source: bestMove.slice(0, 2),
          target: bestMove.slice(2, 4),
          promotion: "q",
        };
        makeMoveOnBoard(move);
      }
    } catch (error) {
      const possibleMoves = game.moves();
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      game.move(possibleMoves[randomIndex]);
      setFen(game.fen());
    }
  };

  const squareStyling = ({ pieceSquare, history }) => {
    const { from, to } = history[history.length - 1] || {};
    const backgroundColor = "#ff000033";

    return {
      [pieceSquare]: { backgroundColor },
      ...(from && { [from]: { backgroundColor } }),
      ...(to && { [to]: { backgroundColor } }),
    };
  };

  return (
    <div className="centred_pvp">
      {children({
        position: fen,
        onDrop,
        onMouseOverSquare,
        onMouseOutSquare,
        squareStyles,
        dropSquareStyle,
        onSquareClick,
        onSquareRightClick: () => {},
      })}
    </div>
  );
}

Singleplayer.propTypes = {
  children: PropTypes.func,
};

export default function SingleplayerWithMoveValidation() {
  return (
    <Singleplayer>
      {({
        position,
        onDrop,
        onMouseOverSquare,
        onMouseOutSquare,
        squareStyles,
        dropSquareStyle,
        onSquareClick,
        onSquareRightClick,
      }) => (
        <Chessboard
          id="humanVsBot"
          width={600}
          position={position}
          onDrop={onDrop}
          onMouseOverSquare={onMouseOverSquare}
          onMouseOutSquare={onMouseOutSquare}
          squareStyles={squareStyles}
          dropSquareStyle={dropSquareStyle}
          onSquareClick={onSquareClick}
          onSquareRightClick={onSquareRightClick}
        />
      )}
    </Singleplayer>
  );
}
