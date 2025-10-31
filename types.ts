
import type { Move } from 'chess.js';

export type GameMode = 'local' | 'ai' | 'review';

export type MoveClassification = 'Brilliant' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';

export interface AnalyzedMove {
  move: Move;
  fenBefore: string;
  classification: MoveClassification;
  explanation?: string;
  bestMove?: Move;
  evaluation?: number;
  evaluationAfter?: number;
  topMoves?: EngineMove[];
}

export interface EngineMove {
  move: Move;
  score: number;
}

export type CustomArrow = {
  from: string;
  to: string;
  color: string;
};
