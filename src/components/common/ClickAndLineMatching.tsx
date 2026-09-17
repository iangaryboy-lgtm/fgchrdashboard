import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, X, RotateCcw, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { MatchingPair } from '../../types';

export interface ClickAndLineMatchingProps {
  questionId: string;
  pairs: MatchingPair[];
  scoringMode?: 'all_or_nothing' | 'partial';
  points?: number;
  value?: Record<string, string>; // leftId -> rightText (or leftText -> rightText)
  onChange?: (matches: Record<string, string>) => void;
  disabled?: boolean;
  showResult?: boolean;
  shuffleRightItems?: boolean;
}

const LINE_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
];

export const ClickAndLineMatching: React.FC<ClickAndLineMatchingProps> = ({
  questionId,
  pairs,
  scoringMode = 'partial',
  points = 25,
  value = {},
  onChange,
  disabled = false,
  showResult = false,
  shuffleRightItems = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a selected item on left or right
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightText, setSelectedRightText] = useState<string | null>(null);

  // SVG lines coordinates: array of { leftId, rightText, x1, y1, x2, y2, color, isCorrect }
  const [lineCoordinates, setLineCoordinates] = useState<
    Array<{
      leftId: string;
      rightText: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      isCorrect?: boolean;
    }>
  >([]);

  // Stable shuffled right items so options don't jump around on re-render
  const rightItems = useMemo(() => {
    const list = pairs.map((p) => p.rightText);
    if (!shuffleRightItems) return list;
    // Simple deterministic shuffle using questionId to keep stable
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * 17 + questionId.length * 31) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [pairs, questionId, shuffleRightItems]);

  // Color mapping per left item
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    pairs.forEach((p, idx) => {
      map[p.id] = LINE_COLORS[idx % LINE_COLORS.length];
    });
    return map;
  }, [pairs]);

  // Calculate coordinates of all connected pairs
  const updateCoordinates = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newCoords: Array<{
      leftId: string;
      rightText: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      isCorrect?: boolean;
    }> = [];

    pairs.forEach((pair) => {
      const rightVal = value[pair.id] || value[pair.leftText];
      if (!rightVal) return;

      const leftDot = document.getElementById(`dot-left-${questionId}-${pair.id}`);
      // Find right item dot (escape right text for selector)
      const rightIdx = rightItems.indexOf(rightVal);
      const rightDot = document.getElementById(`dot-right-${questionId}-${rightIdx}`);

      if (leftDot && rightDot) {
        const leftRect = leftDot.getBoundingClientRect();
        const rightRect = rightDot.getBoundingClientRect();

        const isCorrect = rightVal === pair.rightText;
        newCoords.push({
          leftId: pair.id,
          rightText: rightVal,
          x1: leftRect.left + leftRect.width / 2 - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left + rightRect.width / 2 - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top,
          color: showResult
            ? isCorrect
              ? '#10b981'
              : '#ef4444'
            : colorMap[pair.id] || '#6366f1',
          isCorrect,
        });
      }
    });

    setLineCoordinates(newCoords);
  };

  useEffect(() => {
    updateCoordinates();
    const timer = setTimeout(updateCoordinates, 60);
    window.addEventListener('resize', updateCoordinates);

    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateCoordinates();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoordinates);
      if (ro) ro.disconnect();
    };
  }, [value, pairs, rightItems, questionId, showResult]);

  // Handle clicking Left Item
  const handleLeftClick = (pairId: string) => {
    if (disabled) return;

    // If a right item was already selected, connect them!
    if (selectedRightText) {
      makeConnection(pairId, selectedRightText);
      setSelectedRightText(null);
      setSelectedLeftId(null);
      return;
    }

    // Toggle selection
    if (selectedLeftId === pairId) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(pairId);
    }
  };

  // Handle clicking Right Item
  const handleRightClick = (rightText: string) => {
    if (disabled) return;

    // If a left item was already selected, connect them!
    if (selectedLeftId) {
      makeConnection(selectedLeftId, rightText);
      setSelectedLeftId(null);
      setSelectedRightText(null);
      return;
    }

    // Toggle selection
    if (selectedRightText === rightText) {
      setSelectedRightText(null);
    } else {
      setSelectedRightText(rightText);
    }
  };

  // Create connection
  const makeConnection = (leftId: string, rightText: string) => {
    if (!onChange) return;
    const newMatches = { ...value };

    // Remove any previous connection to this right item (1-to-1 matching)
    Object.keys(newMatches).forEach((k) => {
      if (newMatches[k] === rightText) {
        delete newMatches[k];
      }
    });

    // Assign new connection
    newMatches[leftId] = rightText;
    onChange(newMatches);
  };

  // Disconnect a specific pair
  const handleDisconnect = (leftId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled || !onChange) return;
    const newMatches = { ...value };
    delete newMatches[leftId];
    onChange(newMatches);
  };

  // Clear all
  const handleClearAll = () => {
    if (disabled || !onChange) return;
    onChange({});
    setSelectedLeftId(null);
    setSelectedRightText(null);
  };

  // Score calculation for display
  const totalPairs = pairs.length;
  const correctCount = pairs.filter((p) => (value[p.id] || value[p.leftText]) === p.rightText).length;
  const isAllCorrect = totalPairs > 0 && correctCount === totalPairs;
  const earnedScore =
    scoringMode === 'all_or_nothing'
      ? isAllCorrect
        ? points
        : 0
      : Math.round((points * correctCount) / Math.max(totalPairs, 1));

  return (
    <div className="space-y-3">
      {/* Scoring rule notice badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-lg text-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            🔗 點擊連線配對題型
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
              scoringMode === 'all_or_nothing'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            {scoringMode === 'all_or_nothing' ? '配分機制：全對才給分' : '配分機制：按比例給分'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span>
            {scoringMode === 'all_or_nothing'
              ? '整組必須全部配對正確才得滿分，錯 1 組即 0 分'
              : `每配對正確 1 組得 ${(points / Math.max(totalPairs, 1)).toFixed(1)} 分`}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:text-red-600 text-[11px] flex items-center gap-1 font-medium transition-colors cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              重新連線
            </button>
          )}
        </div>
      </div>

      {/* Interactive Helper Guidance */}
      {!disabled && (
        <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {selectedLeftId
              ? '👉 請點擊右側項目完成數位連線'
              : selectedRightText
              ? '👉 請點擊左側項目完成數位連線'
              : '作答方式：先點選左邊的項目，再點選右邊的項目，系統會自動在兩者之間畫出一條數位連線。'}
          </span>
        </div>
      )}

      {/* Result score display banner when in review mode */}
      {showResult && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            earnedScore === points
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : earnedScore > 0
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {earnedScore === points ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs">
                連連看配對成績：答對 {correctCount} / {totalPairs} 組
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                {scoringMode === 'all_or_nothing'
                  ? isAllCorrect
                    ? '全組配對完全正確，獲得全額分數'
                    : '全對才給分機制：未全部答對，整題 0 分'
                  : `按比例得分：${correctCount}/${totalPairs} 組正確`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black">
              {earnedScore} / {points}
            </span>
            <span className="text-xs ml-1 font-bold">分</span>
          </div>
        </div>
      )}

      {/* Main Matching Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full p-4 bg-white rounded-xl border border-slate-200 shadow-2xs select-none"
      >
        {/* SVG Drawing Layer for Digital Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Render digital connection lines */}
          {lineCoordinates.map((line, idx) => {
            const midX = (line.x1 + line.x2) / 2;
            const pathData = `M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`;
            return (
              <g key={`${line.leftId}-${line.rightText}-${idx}`}>
                {/* Background glow path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="5"
                  strokeOpacity="0.2"
                  strokeLinecap="round"
                />
                {/* Foreground digital connection path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2.8"
                  strokeDasharray={showResult && !line.isCorrect ? '4 3' : 'none'}
                  strokeLinecap="round"
                  filter="url(#line-glow)"
                />
                {/* Left endpoint dot */}
                <circle cx={line.x1} cy={line.y1} r="4.5" fill={line.color} />
                {/* Right endpoint dot */}
                <circle cx={line.x2} cy={line.y2} r="4.5" fill={line.color} />
              </g>
            );
          })}
        </svg>

        {/* 2-Column Matching Layout */}
        <div className="grid grid-cols-12 gap-3 sm:gap-6 relative z-20 items-stretch">
          {/* Left Column Items */}
          <div className="col-span-5 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>【左側項目】點選發起連線</span>
            </div>
            {pairs.map((pair, idx) => {
              const matchedRight = value[pair.id] || value[pair.leftText];
              const isSelected = selectedLeftId === pair.id;
              const itemColor = colorMap[pair.id] || '#6366f1';
              const isCorrect = showResult ? matchedRight === pair.rightText : undefined;

              return (
                <div
                  key={pair.id}
                  onClick={() => handleLeftClick(pair.id)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[56px] ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500 shadow-sm'
                      : matchedRight
                      ? 'bg-slate-50/80 border-slate-300 hover:border-slate-400'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                  }`}
                  style={{
                    borderLeftWidth: matchedRight ? '4px' : undefined,
                    borderLeftColor: matchedRight ? itemColor : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 flex-1 pr-2">
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 text-white shadow-2xs"
                      style={{ backgroundColor: matchedRight ? itemColor : '#64748b' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 leading-snug block">
                        {pair.leftText}
                      </span>
                      {matchedRight && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <span>已連線至右側</span>
                          {!disabled && (
                            <button
                              type="button"
                              onClick={(e) => handleDisconnect(pair.id, e)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                              title="解除連線"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Connection Anchor Dot */}
                  <div
                    id={`dot-left-${questionId}-${pair.id}`}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-white ring-2 ring-indigo-400 scale-125 animate-pulse'
                        : matchedRight
                        ? 'border-white ring-1 ring-slate-300'
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    }`}
                    style={{
                      backgroundColor: matchedRight ? itemColor : isSelected ? '#4f46e5' : '#ffffff',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Center Visual Spacer for Lines */}
          <div className="col-span-2 hidden sm:flex items-center justify-center">
            <div className="text-[11px] font-bold text-slate-400 text-center leading-tight">
              數位連線
              <br />
              ⟷
            </div>
          </div>

          {/* Right Column Items */}
          <div className="col-span-7 sm:col-span-5 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>【右側項目】點選完成連線</span>
            </div>
            {rightItems.map((rText, rIdx) => {
              // Find which left pair is connected to this right item
              const connectedLeftPair = pairs.find(
                (p) => (value[p.id] || value[p.leftText]) === rText
              );
              const isSelected = selectedRightText === rText;
              const itemColor = connectedLeftPair ? colorMap[connectedLeftPair.id] : undefined;

              return (
                <div
                  key={`${rIdx}-${rText}`}
                  onClick={() => handleRightClick(rText)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[56px] ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500 shadow-sm'
                      : connectedLeftPair
                      ? 'bg-slate-50/80 border-slate-300 hover:border-slate-400'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                  }`}
                  style={{
                    borderRightWidth: connectedLeftPair ? '4px' : undefined,
                    borderRightColor: connectedLeftPair ? itemColor : undefined,
                  }}
                >
                  {/* Right Connection Anchor Dot */}
                  <div
                    id={`dot-right-${questionId}-${rIdx}`}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-white ring-2 ring-indigo-400 scale-125 animate-pulse'
                        : connectedLeftPair
                        ? 'border-white ring-1 ring-slate-300'
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    }`}
                    style={{
                      backgroundColor: connectedLeftPair ? itemColor : isSelected ? '#4f46e5' : '#ffffff',
                    }}
                  />

                  <div className="flex items-center gap-2 flex-1 pl-2 text-right justify-end">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 leading-snug block">
                        {rText}
                      </span>
                      {connectedLeftPair && (
                        <span className="text-[10px] font-medium text-slate-500 block">
                          連線至：{connectedLeftPair.leftText}
                        </span>
                      )}
                    </div>
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: connectedLeftPair ? itemColor : '#f1f5f9',
                        color: connectedLeftPair ? '#ffffff' : '#64748b',
                        borderColor: connectedLeftPair ? itemColor : '#cbd5e1',
                      }}
                    >
                      {String.fromCharCode(65 + rIdx)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Answer Breakdown Details */}
      {showResult && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">配對正解與答題檢討：</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pairs.map((p, idx) => {
              const userAns = value[p.id] || value[p.leftText];
              const isMatch = userAns === p.rightText;
              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-lg border text-[11px] ${
                    isMatch
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-red-50/70 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {idx + 1}. {p.leftText}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {isMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> 正確
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-red-600" /> 錯誤
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 opacity-90">
                    <div>您的連線：{userAns || '(未連線)'}</div>
                    {!isMatch && (
                      <div className="text-emerald-700 font-bold">正解配對：{p.rightText}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export function calculateMatchingScore(
  pairs: MatchingPair[] = [],
  userMatches: Record<string, string> = {},
  scoringMode: 'all_or_nothing' | 'partial' = 'partial',
  points: number = 25
): { earnedScore: number; correctCount: number; totalPairs: number } {
  const totalPairs = pairs.length;
  if (totalPairs === 0) return { earnedScore: 0, correctCount: 0, totalPairs: 0 };
  const correctCount = pairs.filter((p) => (userMatches[p.id] || userMatches[p.leftText]) === p.rightText).length;
  const isAllCorrect = correctCount === totalPairs;
  const earnedScore =
    scoringMode === 'all_or_nothing'
      ? isAllCorrect
        ? points
        : 0
      : Math.round((points * correctCount) / totalPairs);
  return { earnedScore, correctCount, totalPairs };
}
