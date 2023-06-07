import React, { Component } from "react";
import PropTypes from "prop-types";
import Chessboard from "chessboardjsx";
import * as ChessJS from "chess.js";
import axios from "axios";
const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess;
const lichessApi = 'lip_8mesw2BXarmzrgqlt5DD';

async function getBestMove(position) {
    const parts = position.split(' ');
    parts[parts.length - 3] = '-';
    const currFen = parts.join(' ');
    return axios.get('https://lichess.org/api/cloud-eval', {
        params: {
            fen: currFen,
            multiPv: 1,
        },
        headers: {
            'Authorization': 'Bearer ' + lichessApi,
        },
    })
        .then((response) => {
            const bestMove = response.data.pvs[0].moves.slice(0, 4);
            return bestMove;
        })
        .catch((error) => {
            console.error('An error occurred:', error);
            throw error;
        });
}

class Singleplayer extends Component {
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
        const { history } = this.state;
        const { history: prevHistory } = prevState;
        
        if (history.length !== prevHistory.length) {
          const lastMove = history[history.length - 1];
          
          if (this.game.in_checkmate()) {
            this.handleGameOver(lastMove);
          } else if (this.game.in_draw()) {
            this.handleDraw();
          }
        }
      }
      
      handleGameOver = (lastMove) => {
        const winner = lastMove.color === "b" ? "Black" : "White";
        this.game.reset();
        alert(`Game over, ${winner} wins!`);
      }
      
      handleDraw = () => {
        this.game.reset();
        alert("Game over, DRAW!");
      }

    makeMoveOnBoard = (move) => {
        const { source, target, promotion } = move;
        const chessMove = this.game.move({ from: source, to: target, promotion });
        if (chessMove !== null) {
            this.setState(({ history, pieceSquare }) => ({
                fen: this.game.fen(),
                history: this.game.history({ verbose: true }),
                squareStyles: squareStyling({ pieceSquare, history })
            }));
        }
    };

    onDrop = async ({ sourceSquare, targetSquare }) => {
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

        try {
            const bestMove = await getBestMove(this.game.fen());
            console.log('Best move:', bestMove);
            if (bestMove) {
                const move = {
                    source: bestMove.slice(0, 2),
                    target: bestMove.slice(2, 4),
                    promotion: "q"
                };
                this.makeMoveOnBoard(move);
            }
        } catch (error) {
            const possibleMoves = this.game.moves();
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            this.game.move(possibleMoves[randomIndex]);
            this.setState({ fen: this.game.fen() });
        }
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

    onSquareClick = async (square) => {
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
        try {
            const bestMove = await getBestMove(this.game.fen());
            console.log('Best move:', bestMove);
            if (bestMove) {
                const move = {
                    source: bestMove.slice(0, 2),
                    target: bestMove.slice(2, 4),
                    promotion: "q"
                };
                this.makeMoveOnBoard(move);
            }
        } catch (error) {
            const possibleMoves = this.game.moves();
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            this.game.move(possibleMoves[randomIndex]);
            this.setState({ fen: this.game.fen() });
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

export default function SingleplayerWithMoveValidation() {
    return (
        <div className="centred_pvp">
            <Singleplayer>
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
        </div>
    );
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
