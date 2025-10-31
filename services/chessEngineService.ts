
import { Chess } from 'chess.js';
import type { Move } from 'chess.js';
import type { EngineMove } from '../types';

// This is a MOCK engine service. In a real application, this would
// communicate with a backend or a WebAssembly version of Stockfish.
// For this self-contained example, it provides plausible but simplified analysis.

const MATE_SCORE = 10000;

const pieceValues: { [key: string]: number } = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

// Simplified evaluation function
function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    // The side to move is in checkmate, so the other side is winning.
    return game.turn() === 'w' ? -MATE_SCORE : MATE_SCORE;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  let totalEvaluation = 0;
  game.board().forEach(row => {
    row.forEach(square => {
      if (square) {
        const value = pieceValues[square.type];
        totalEvaluation += square.color === 'w' ? value : -value;
      }
    });
  });

  return totalEvaluation;
}


// Mock analysis function
export const analyzePosition = async (fen: string): Promise<{ evaluation: number; bestMoves: EngineMove[] }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const game = new Chess(fen);
      const possibleMoves = game.moves({ verbose: true });
      
      if(possibleMoves.length === 0) {
        resolve({ evaluation: evaluateBoard(game), bestMoves: [] });
        return;
      }
      
      const scoredMoves: EngineMove[] = possibleMoves.map(move => {
        const tempGame = new Chess(fen);
        tempGame.move(move);
        // Evaluation is from the perspective of the current player
        const evaluation = evaluateBoard(tempGame) * (game.turn() === 'w' ? 1 : -1);
        return {
          move: move,
          score: evaluation / 100, // Convert to centipawn-like score
        };
      });

      // Sort moves by score, descending
      scoredMoves.sort((a, b) => b.score - a.score);

      const bestEval = scoredMoves.length > 0 ? scoredMoves[0].score * 100 : evaluateBoard(game);

      resolve({
        evaluation: bestEval,
        bestMoves: scoredMoves,
      });
    }, 200 + Math.random() * 300); // Simulate engine thinking time
  });
};
