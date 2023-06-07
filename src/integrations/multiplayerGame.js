import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
const socket = require('./socket').socket;
const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;

const Multiplayer = ({ room_id }) => {
  const [fen, setFen] = useState('start');
  const [dropSquareStyle, setDropSquareStyle] = useState({});
  const [squareStyles, setSquareStyles] = useState({});
  const [pieceSquare, setPieceSquare] = useState('');
  const [history, setHistory] = useState([]);
  const [prevFEN, setPrevFEN] = useState('');
  const [player, setPlayer] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [game, setGame] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (!game) {
      setGame(new Chess());
    }

    socket.emit('join_room', room_id);

    socket.on('room_full', (data) => {
      alert('Room is full. Redirecting to home page.');
      window.location.href = '/';
    });

    socket.on('receive_move', (data) => {
      setChessState(data);
    });

    socket.on('receive_side', (data) => {
      setPlayer(data.message);
    });

    socket.on('receive_message', (data) => {
      const { player, message } = data;
      addChatMessage(`${player}: ${message}`);
    });

    return () => {
      socket.off('room_full');
      socket.off('receive_move');
      socket.off('receive_side');
      socket.off('receive_message');
    };
  }, []);

  useEffect(() => {
    if (fen !== 'start' && fen !== prevFEN) {
      setPrevFEN(fen);
      socket.emit('send_move', { room: room_id, currentState: { fen, history, squareStyles } });
    }

    // const lastMove = history[history.length - 1];
    const lastMove = getLastMoveFromFEN(fen)
    if (game && game.in_checkmate() && !gameEnded) {
      console.log(lastMove)
      let winner = lastMove.color === 'b' ? 'black' : 'white';
      socket.emit('get_stats', { room: room_id, message: winner });
      alert('Game over, ' + winner + ' wins!');
      setGame(new Chess());
      setGameEnded(true);
    } else if (game && game.in_draw() && !gameEnded) {
      socket.emit('get_stats', { room: room_id, message: 'draw' });
      alert('Game over, DRAW!');
      setGame(new Chess());
      setGameEnded(true);
    }
  }, [fen, prevFEN, history, game, gameEnded]);

  const setChessState = (data) => {
    setFen(data.currentState.fen);
    console.log(data)
    setSquareStyles(data.currentState.squareStyles);
    setGame((prevGame) => {
      prevGame.load(data.currentState.fen);
      return prevGame;
    });
  };

  const onDrop = ({ sourceSquare, targetSquare }) => {
    const myPlayer = player === "white" ? "w" : "b";
    const piece = game.get(sourceSquare);
    if (piece && piece.color !== myPlayer) {
      return;
    }
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q"
    });
    if (move === null) return;
    setFen(game.fen());
    setHistory(game.history({ verbose: true }));
    setSquareStyles(squareStyling({ pieceSquare, history }));
  };

  const onMouseOverSquare = (square) => {
    const moves = game.moves({
      square,
      verbose: true
    });
    if (moves.length === 0) return;
    const squaresToHighlight = moves.map(move => move.to);
    setSquareStyles(({ pieceSquare, history }) => {
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
        ...squareStyling({ pieceSquare, history }),
        ...highlightedSquares
      };
    });
  };

  const onMouseOutSquare = () => {
    setSquareStyles(({ pieceSquare, history }) => ({
      ...squareStyling({ pieceSquare, history })
    }));
  };

  const onSquareClick = (square) => {
    const myPlayer = player === "white" ? "w" : "b";
    const piece = game.get(square);
    if (piece && piece.color !== myPlayer) {
      return;
    }
    if (pieceSquare) {
      const move = game.move({
        from: pieceSquare,
        to: square,
        promotion: "q"
      });
      if (move === null) return;
      setHistory(game.history({ verbose: true }));
      setPieceSquare("");
    } else {
      setPieceSquare(square);
    }
    setFen(game.fen());
    setSquareStyles(squareStyling({ pieceSquare, history }));
  };

  const handleInputChange = (event) => {
    setNewMessage(event.target.value);
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    const message = {
      player: player,
      message: newMessage
    };
    if (!newMessage.replace(/\s/g, "").length) {
      return;
    }
    addChatMessage(`${player}: ${newMessage}`);
    socket.emit("send_message", { room: room_id, message });
    setNewMessage("");
  };

  const addChatMessage = (message) => {
    setChatMessages(prevState => [...prevState, message]);
  };
  const squareStyling = ({ pieceSquare, history }) => {
    const { from, to } = (history && history.length > 0 && history[history.length - 1]) || {};
    const backgroundColor = "#ff0000";
    const isMove = pieceSquare === from || pieceSquare === to;
    if (isMove) {
      return { backgroundColor };
    }
    return {};
  };

  function getLastMoveFromFEN(fen) {
    const fenParts = fen.split(" ");
    const moveInfo = fenParts[fenParts.length - 1]; // Retrieve the move-related information
    const moveParts = moveInfo.split(" ");
    const lastMove = moveParts[moveParts.length - 1]; // Extract the last move
  
    return lastMove;
  }
  

  return (
    <div class="centred_pvp">
      <div class="half" style={{ backgroundColor: player === "white" ? "white" : "black", color: player === "black" ? "white" : "black" }}>
        <div class="chatbox">
          {chatMessages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
        <form onSubmit={handleSendMessage}>
          <input type="text" value={newMessage} onChange={handleInputChange} />
          <button type="submit">Send</button>
        </form>
      </div>
      <Chessboard
        width={600}
        position={fen}
        onDrop={onDrop}
        onMouseOverSquare={onMouseOverSquare}
        onMouseOutSquare={onMouseOutSquare}
        squareStyles={squareStyles}
        dropSquareStyle={dropSquareStyle}
        onSquareClick={onSquareClick}
        orientation={player}
      />
    </div>
  );
};

Multiplayer.propTypes = {
  room_id: PropTypes.string.isRequired
};

const MultiplayerWithMoveValidation = ({ room_id }) => {
  const [, setPlayer] = useState("white");
  useEffect(() => {
    socket.on("receive_side", (data) => {
      setPlayer(data.message);
    });
    return () => {
      socket.off("receive_side");
    };
  }, []);

  return (
    <div>
      <Multiplayer room_id={room_id} />
    </div>
  );
};

export default MultiplayerWithMoveValidation;
