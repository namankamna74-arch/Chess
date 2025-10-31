
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { GameControls } from './components/GameControls';
import { ReviewPanel } from './components/ReviewPanel';
import { getMoveExplanation } from './services/geminiService';
import { analyzePosition } from './services/chessEngineService';
import type { AnalyzedMove, EngineMove, GameMode, MoveClassification, CustomArrow } from './types';

// Helper to get a classification based on centipawn loss
const getClassification = (cpLoss: number): MoveClassification => {
  if (cpLoss > 200) return 'Blunder';
  if (cpLoss > 100) return 'Mistake';
  if (cpLoss > 0) return 'Inaccuracy';
  if (cpLoss < -100) return 'Brilliant';
  if (cpLoss < -50) return 'Excellent';
  return 'Good';
};

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [history, setHistory] = useState<AnalyzedMove[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(-1);
  const [arrows, setArrows] = useState<CustomArrow[]>([]);

  const currentAnalysis = useMemo(() => {
    if (analysisIndex >= 0 && analysisIndex < history.length) {
      return history[analysisIndex];
    }
    return null;
  }, [analysisIndex, history]);

  const updateStatus = useCallback(() => {
    if (game.isGameOver()) {
      setIsGameOver(true);
      if (game.isCheckmate()) {
        setGameOverMessage(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
      } else if (game.isDraw()) {
        setGameOverMessage('Draw!');
      } else if (game.isStalemate()) {
        setGameOverMessage('Stalemate!');
      } else if (game.isThreefoldRepetition()) {
        setGameOverMessage('Draw by threefold repetition!');
      } else {
        setGameOverMessage('Game Over');
      }
    } else {
      setIsGameOver(false);
      setGameOverMessage('');
    }
  }, [game]);

  const makeMove = (move: string | { from: string; to: string; promotion?: string }) => {
    try {
      const result = game.move(move);
      if (result) {
        const newHistoryItem: AnalyzedMove = {
          move: result,
          fenBefore: game.history({ verbose: true }).slice(-2, -1)[0]?.after || new Chess().fen(),
          classification: 'Good', // Default, will be updated in analysis
        };
        setHistory(prev => [...prev, newHistoryItem]);
        setFen(game.fen());
        updateStatus();
        return true;
      }
    } catch (e) {
      // Invalid move
      return false;
    }
    return false;
  };

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square, piece: Piece) => {
    if (gameMode === 'review' || isGameOver) return false;

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q',
    };
    
    if (makeMove(move)) {
      if (gameMode === 'ai' && !game.isGameOver()) {
        setTimeout(makeAiMove, 500);
      }
      return true;
    }
    return false;
  };
  
  const makeAiMove = async () => {
    setIsLoading(true);
    const analysis = await analyzePosition(game.fen());
    if (analysis.bestMoves.length > 0) {
      makeMove(analysis.bestMoves[0].move);
    }
    setIsLoading(false);
  };
  
  const startNewGame = (mode: GameMode) => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setGameMode(mode);
    setIsGameOver(false);
    setGameOverMessage('');
    setAnalysisIndex(-1);
    setArrows([]);
    setBoardOrientation('white');
  };

  const runFullAnalysis = useCallback(async () => {
    if(history.length === 0) return;
    setIsLoading(true);
    setGameMode('review');

    let previousEval = 0;
    const analyzedHistory: AnalyzedMove[] = [];

    for (let i = 0; i < history.length; i++) {
        const moveData = history[i];
        const analysis = await analyzePosition(moveData.fenBefore);
        const bestMoveEval = analysis.evaluation;

        const tempGame = new Chess(moveData.fenBefore);
        tempGame.move(moveData.move);
        const analysisAfter = await analyzePosition(tempGame.fen());
        const actualMoveEval = analysisAfter.evaluation;
        
        // For player whose turn it is
        const isWhiteMove = tempGame.turn() === 'b';
        const evalLoss = isWhiteMove ? previousEval - actualMoveEval : -(previousEval - actualMoveEval);
        
        const classification = getClassification(evalLoss);

        analyzedHistory.push({
            ...moveData,
            classification,
            bestMove: analysis.bestMoves[0]?.move,
            evaluation: bestMoveEval,
            evaluationAfter: actualMoveEval,
            topMoves: analysis.bestMoves,
        });
        previousEval = actualMoveEval;
    }
    setHistory(analyzedHistory);
    setAnalysisIndex(analyzedHistory.length - 1);
    setIsLoading(false);
  }, [history]);

  useEffect(() => {
    if (isGameOver && gameMode !== 'review') {
      runFullAnalysis();
    }
  }, [isGameOver, gameMode, runFullAnalysis]);
  
  const handleAnalysisNav = (index: number) => {
    if (index >= -1 && index < history.length) {
      setAnalysisIndex(index);
      const newGame = new Chess();
      if(index > -1){
        for (let i = 0; i <= index; i++) {
            newGame.move(history[i].move);
        }
      }
      setFen(newGame.fen());
      
      const currentMove = history[index];
      if (currentMove?.topMoves) {
        const newArrows = currentMove.topMoves.slice(0, 3).map((m, i) => {
            const color = i === 0 ? 'rgb(135, 206, 250, 0.8)' : i === 1 ? 'rgb(255, 165, 0, 0.7)' : 'rgb(255, 99, 71, 0.6)';
            return { from: m.move.from, to: m.move.to, color };
        });
        setArrows(newArrows);
      } else {
        setArrows([]);
      }
    }
  };
  
  const fetchAndSetExplanation = useCallback(async (index: number) => {
      const move = history[index];
      if (!move || move.explanation) return;
  
      setIsLoading(true);
      try {
          const explanation = await getMoveExplanation(
              move.fenBefore,
              move.move,
              move.classification,
              move.bestMove,
              move.evaluation,
          );
          setHistory(prev => {
              const newHistory = [...prev];
              newHistory[index].explanation = explanation;
              return newHistory;
          });
      } catch (error) {
          console.error("Failed to get explanation from Gemini", error);
          setHistory(prev => {
              const newHistory = [...prev];
              newHistory[index].explanation = "Could not retrieve explanation.";
              return newHistory;
          });
      } finally {
          setIsLoading(false);
      }
  }, [history]);


  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-2 sm:p-4">
      <header className="w-full max-w-7xl mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-white">AI Chess Coach</h1>
        <p className="text-center text-gray-400">Play, analyze, and learn with Gemini</p>
      </header>
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/3 flex flex-col items-center">
            <div className="w-full aspect-square max-w-[70vh] shadow-2xl rounded-md overflow-hidden">
                <Chessboard
                    position={fen}
                    onPieceDrop={onPieceDrop}
                    boardOrientation={boardOrientation}
                    customArrows={arrows}
                    customArrowColor="rgba(255, 0, 0, 0.5)"
                />
            </div>
             {gameOverMessage && <div className="mt-2 text-xl font-semibold p-2 bg-brand-blue rounded-md">{gameOverMessage}</div>}
             {isLoading && <div className="mt-2 text-lg font-semibold p-2 bg-yellow-600 rounded-md animate-pulse-fast">Thinking...</div>}
        </div>
        <div className="w-full lg:w-1/3 bg-gray-800 p-4 rounded-lg shadow-xl flex flex-col h-[85vh]">
          <GameControls
            onNewGame={startNewGame}
            onFlipBoard={() => setBoardOrientation(p => (p === 'white' ? 'black' : 'white'))}
            gameMode={gameMode}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <ReviewPanel 
              history={history} 
              currentIndex={analysisIndex}
              onNavigate={handleAnalysisNav}
              onGetExplanation={fetchAndSetExplanation}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
