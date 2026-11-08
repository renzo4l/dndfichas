import React from 'react';
import { X, Dices, Sparkles, Flame } from 'lucide-react';
import { DiceRollResult } from '../types/dnd';

interface DiceRollResultManagerProps {
  toasts: DiceRollResult[];
  onDismissToast: (id: string) => void;
}

export const DiceRollResultManager: React.FC<DiceRollResultManagerProps> = ({
  toasts,
  onDismissToast,
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-xs sm:max-w-sm w-full pointer-events-none select-none">
      {toasts.map((roll) => {
        const isCrit = roll.isCritical;
        const isFumble = roll.isFumble;

        return (
          <div
            key={roll.id}
            onClick={() => onDismissToast(roll.id)}
            className={`pointer-events-auto rounded-2xl p-3.5 border-2 shadow-2xl transition-all duration-300 transform animate-slide-up cursor-pointer backdrop-blur-md relative group ${
              isCrit
                ? 'bg-[#241708]/95 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : isFumble
                ? 'bg-[#210907]/95 border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-[#18110b]/95 border-[#8c6b32]/80 hover:border-[#c49d48] shadow-[0_4px_16px_rgba(0,0,0,0.8)]'
            }`}
          >
            {/* Header: Label & Close X Button */}
            <div className="flex items-center justify-between gap-2 border-b border-[#54412c]/60 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5 truncate">
                <Dices className={`w-3.5 h-3.5 flex-shrink-0 ${isCrit ? 'text-amber-400' : isFumble ? 'text-red-400' : 'text-[#c49d48]'}`} />
                <span className="font-serif font-black text-xs text-[#f4ecd8] truncate tracking-wide">
                  {roll.label || 'Rolagem'}
                </span>
                {roll.advantageType === 'advantage' && (
                  <span className="text-[8px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider flex-shrink-0">
                    {roll.advantageCount && roll.advantageCount > 1 ? `★ +${roll.advantageCount} Vantagens` : '★ Vantagem'}
                  </span>
                )}
                {roll.advantageType === 'disadvantage' && (
                  <span className="text-[8px] bg-red-950/90 text-red-300 border border-red-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider flex-shrink-0">
                    {roll.disadvantageCount && roll.disadvantageCount > 1 ? `⚠️ +${roll.disadvantageCount} Desvantagens` : '⚠️ Desvantagem'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[9px] font-mono text-[#8c7457]">{roll.timestamp}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissToast(roll.id);
                  }}
                  className="p-1 rounded-md text-[#8c7457] hover:text-[#f4ecd8] hover:bg-[#2e1d12] transition"
                  title="Fechar resultado"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content: Body grid with Roll Result Total prominently displayed */}
            <div className="flex items-center justify-between gap-3">
              {/* Left Details: Roller, Expression, Rolls Array in Brackets */}
              <div className="space-y-1 min-w-0">
                {roll.rollerName && (
                  <div className="text-[10px] text-[#eedbc5] font-serif tracking-wider truncate">
                    {roll.rollerName}
                  </div>
                )}

                {/* Formula & Dice rolled in brackets: [ex: 13, 5] */}
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#c4b5a3] truncate">
                  <span>Fórmula: <strong className="text-amber-300 font-bold">{roll.expression}</strong></span>
                </div>

                {/* Visual dos dados rolados */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-mono text-[#8c7457]">Dados:</span>
                  {roll.rolls && roll.rolls.length > 0 ? (
                    <div className="flex items-center gap-1 font-mono text-xs flex-wrap">
                      {roll.rolls.map((val, idx) => {
                        const isAdvOrDis = roll.advantageType === 'advantage' || roll.advantageType === 'disadvantage';
                        const isKept = isAdvOrDis && val === roll.keptRoll && idx === roll.rolls.indexOf(roll.keptRoll);
                        const isDiscarded = isAdvOrDis && !isKept;

                        return (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition ${
                              isKept
                                ? roll.advantageType === 'advantage'
                                  ? 'bg-emerald-950 text-emerald-200 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] font-black'
                                  : 'bg-red-950 text-red-200 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] font-black'
                                : isDiscarded
                                ? 'bg-[#1e150e] text-stone-500 border-[#54412c] opacity-60 line-through'
                                : 'bg-[#1b120b] text-amber-200 border-[#54412c]'
                            }`}
                            title={isKept ? (roll.advantageType === 'advantage' ? 'Maior (Escolhido)' : 'Menor (Escolhido)') : isDiscarded ? 'Descartado' : `Dado: ${val}`}
                          >
                            {val}{isKept ? '★' : ''}
                          </span>
                        );
                      })}
                      {roll.modifier !== 0 && (
                        <span className="text-amber-400 font-mono text-xs font-semibold ml-0.5">
                          ({roll.modifier >= 0 ? `+${roll.modifier}` : roll.modifier})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-stone-300 font-bold font-mono text-[10px]">—</span>
                  )}
                </div>

                {/* Composite Damage Breakdown by Type */}
                {roll.damageBreakdown && roll.damageBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {roll.damageBreakdown.map((item, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#2b180d] border border-[#7a572a] text-[#f4ecd8] font-mono"
                      >
                        <strong className="text-amber-300">{item.damageType || 'Dano'}:</strong> {item.amount}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Big Prominent Total Result Box */}
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                {isCrit && (
                  <span className="text-[9px] font-serif font-black text-amber-400 uppercase tracking-widest flex items-center gap-0.5 animate-bounce">
                    <Sparkles className="w-2.5 h-2.5" /> Nat 20!
                  </span>
                )}
                {isFumble && (
                  <span className="text-[9px] font-serif font-black text-red-400 uppercase tracking-widest flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" /> Nat 1!
                  </span>
                )}

                <div
                  className={`px-3 py-1 rounded-xl border font-serif font-black text-2xl sm:text-3xl tracking-tight shadow-inner ${
                    isCrit
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                      : isFumble
                      ? 'bg-red-500/20 text-red-400 border-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                      : 'bg-[#120a06] text-[#f5d77f] border-[#8c6b32]/60 drop-shadow'
                  }`}
                >
                  {roll.total}
                </div>
              </div>
            </div>

            <div className="text-[9px] text-center text-[#8c7457] font-serif mt-1 opacity-60 group-hover:opacity-100 transition">
              Clique para fechar
            </div>
          </div>
        );
      })}
    </div>
  );
};
