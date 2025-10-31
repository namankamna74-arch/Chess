
import React, { useEffect, useRef } from 'react';
import type { AnalyzedMove, MoveClassification } from '../types';
import { Sparkles, Bot, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReviewPanelProps {
  history: AnalyzedMove[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onGetExplanation: (index: number) => void;
  isLoading: boolean;
}

const classificationStyles: Record<MoveClassification, string> = {
  Brilliant: 'text-cyan-400 border-cyan-400',
  Excellent: 'text-green-400 border-green-400',
  Good: 'text-gray-400 border-gray-400',
  Inaccuracy: 'text-yellow-400 border-yellow-400',
  Mistake: 'text-orange-400 border-orange-400',
  Blunder: 'text-red-500 border-red-500',
};

const MoveItem: React.FC<{ moveData: AnalyzedMove; index: number; isCurrent: boolean; onNavigate: (index: number) => void; onGetExplanation: (index: number) => void; isLoading: boolean;}> = ({ moveData, index, isCurrent, onNavigate, onGetExplanation, isLoading }) => {
  const isWhiteMove = index % 2 === 0;
  
  const handleGetExplanation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!moveData.explanation) {
      onGetExplanation(index);
    }
  };

  return (
    <div 
      onClick={() => onNavigate(index)}
      className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${isCurrent ? 'bg-blue-900/50' : 'hover:bg-gray-700/50'}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 w-6 text-right font-mono">{isWhiteMove ? `${index/2 + 1}.` : ''}</span>
          <span className="font-bold text-lg">{moveData.move.san}</span>
        </div>
        <span className={`text-sm font-semibold border px-2 py-0.5 rounded-full ${classificationStyles[moveData.classification]}`}>
          {moveData.classification}
        </span>
      </div>
      {isCurrent && (
        <div className="mt-3 space-y-3">
          {moveData.explanation ? (
             <p className="text-gray-300 text-sm bg-gray-700/50 p-2 rounded-md">{moveData.explanation}</p>
          ) : (
            <button
              onClick={handleGetExplanation}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-md transition-colors"
            >
              {isLoading ? 'Loading...' : <> <Sparkles size={16} /> Explain with Gemini </>}
            </button>
          )}
          {moveData.topMoves && (
              <div className="bg-gray-700/50 p-2 rounded-md">
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">Engine Suggestions:</h4>
                  <ul className="text-sm space-y-1">
                      {moveData.topMoves.slice(0, 3).map((engineMove, i) => (
                          <li key={i} className="flex justify-between items-center font-mono">
                              <span>{engineMove.move.san}</span>
                              <span className="text-gray-400">{engineMove.score.toFixed(2)}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          )}
        </div>
      )}
    </div>
  );
};


export const ReviewPanel: React.FC<ReviewPanelProps> = ({ history, currentIndex, onNavigate, onGetExplanation, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current && currentIndex !== -1) {
      const activeElement = scrollRef.current.children[currentIndex] as HTMLElement;
      if (activeElement) {
        const container = scrollRef.current;
        const elementTop = activeElement.offsetTop;
        const elementHeight = activeElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerHeight = container.offsetHeight;

        if (elementTop < containerTop || (elementTop + elementHeight) > (containerTop + containerHeight)) {
          container.scrollTo({
            top: elementTop - containerHeight / 2 + elementHeight / 2,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [currentIndex]);


  if (history.length === 0) {
    return <div className="text-center text-gray-400">Game moves will appear here.</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <h3 className="text-lg font-bold">Game Review</h3>
        <div className="flex gap-2">
            <button onClick={() => onNavigate(currentIndex - 1)} disabled={currentIndex < 0} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => onNavigate(currentIndex + 1)} disabled={currentIndex >= history.length - 1} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight size={20} />
            </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-grow overflow-y-auto pr-1 space-y-1 py-2">
          {history.map((moveData, index) => (
             <MoveItem 
                key={index}
                moveData={moveData}
                index={index}
                isCurrent={index === currentIndex}
                onNavigate={onNavigate}
                onGetExplanation={onGetExplanation}
                isLoading={isLoading && index === currentIndex}
             />
          ))}
      </div>
    </div>
  );
};
