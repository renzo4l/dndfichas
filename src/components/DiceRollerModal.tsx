import React, { useState } from 'react';
import { X, Dices, RotateCcw, Sparkles, Flame, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DiceRollResult } from '../types/dnd';
import { rollDice } from '../utils/dndRules';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollerName: string;
  history: DiceRollResult[];
  onAddRoll: (roll: DiceRollResult) => void;
  onClearHistory: () => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  rollerName,
  history,
  onAddRoll,
  onClearHistory,
}) => {
  const [expression, setExpression] = useState('1d20');
  const [modifier, setModifier] = useState<number>(0);
  const [label, setLabel] = useState('Rolagem Livre');
  const [advantageCount, setAdvantageCount] = useState<number>(0);
  const [disadvantageCount, setDisadvantageCount] = useState<number>(0);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#d97706', '#ef4444', '#10b981'],
    });
  };

  const executeRoll = (expr: string, customLabel?: string) => {
    let finalLabel = customLabel || label;
    let fullExpr = expr;

    // Apply stackable advantage or disadvantage tag if active
    if (advantageCount > 0) {
      const tag = advantageCount > 1 ? `[${advantageCount} Vantagens]` : '[Vantagem]';
      fullExpr = `${expr} ${tag}`;
      if (!customLabel) {
        finalLabel = `${finalLabel} (${advantageCount > 1 ? `${advantageCount} Vantagens` : 'Com Vantagem'})`;
      }
    } else if (disadvantageCount > 0) {
      const tag = disadvantageCount > 1 ? `[${disadvantageCount} Desvantagens]` : '[Desvantagem]';
      fullExpr = `${expr} ${tag}`;
      if (!customLabel) {
        finalLabel = `${finalLabel} (${disadvantageCount > 1 ? `${disadvantageCount} Desvantagens` : 'Com Desvantagem'})`;
      }
    }

    if (modifier !== 0) {
      fullExpr = `${fullExpr}${modifier >= 0 ? '+' : ''}${modifier}`;
    }

    const result = rollDice(fullExpr, rollerName, finalLabel);
    if (result.isCritical) triggerConfetti();
    setLastRoll(result);
    onAddRoll(result);
  };

  const quickDice = [
    { name: 'd4', sides: 4, iconBg: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60' },
    { name: 'd6', sides: 6, iconBg: 'bg-blue-900/60 text-blue-300 border-blue-700/60' },
    { name: 'd8', sides: 8, iconBg: 'bg-amber-950/80 text-[#e8c679] border-amber-700/60' },
    { name: 'd10', sides: 10, iconBg: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/60' },
    { name: 'd12', sides: 12, iconBg: 'bg-orange-900/60 text-orange-300 border-orange-700/60' },
    { name: 'd20', sides: 20, iconBg: 'bg-amber-900/60 text-amber-300 border-amber-600/70 font-bold' },
    { name: 'd100', sides: 100, iconBg: 'bg-red-900/60 text-red-300 border-red-700/60' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#171923] border border-amber-900/60 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#211a13] to-[#1a1c26] border-b border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-amber-200 text-lg">Rolador de Dados D&D 5e</h2>
              <p className="text-xs text-stone-400">Rolando como: <span className="text-amber-300">{rollerName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Last Roll Display */}
          {lastRoll && (
            <div
              className={`p-4 rounded-xl border text-center transition-all ${
                lastRoll.isCritical
                  ? 'bg-gradient-to-b from-amber-950/80 to-amber-900/30 border-amber-500 shadow-lg shadow-amber-500/20'
                  : lastRoll.isFumble
                  ? 'bg-gradient-to-b from-red-950/80 to-red-900/30 border-red-600'
                  : 'bg-stone-900/80 border-stone-800'
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-stone-400 mb-1 flex items-center justify-center gap-1.5">
                {lastRoll.isCritical && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> Sucesso Crítico! (Nat 20)
                  </span>
                )}
                {lastRoll.isFumble && (
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <Flame className="w-3.5 h-3.5" /> Falha Crítica! (Nat 1)
                  </span>
                )}
                {!lastRoll.isCritical && !lastRoll.isFumble && (
                  <span>{lastRoll.label || 'Resultado'}</span>
                )}
              </div>

              <div className="text-4xl font-serif font-black text-amber-300 tracking-tight my-1">
                {lastRoll.total}
              </div>

              <div className="text-xs text-stone-400 flex items-center justify-center gap-2">
                <span>Expressão: <strong className="text-stone-300">{lastRoll.expression}</strong></span>
                <span>•</span>
                <span>Dados: [{lastRoll.rolls.join(', ')}]</span>
                {lastRoll.modifier !== 0 && (
                  <>
                    <span>•</span>
                    <span>Mod: {lastRoll.modifier >= 0 ? `+${lastRoll.modifier}` : lastRoll.modifier}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Dice Buttons */}
          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-stone-400 block mb-2">
              Dados Rápidos
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {quickDice.map((d) => (
                <button
                  key={d.name}
                  onClick={() => executeRoll(`1${d.name}`, `Rolagem de ${d.name}`)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border transition hover:scale-105 active:scale-95 shadow-sm ${d.iconBg}`}
                >
                  <span className="text-xs uppercase font-mono font-bold">{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advantage / Disadvantage Mode with Multi-level support */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase font-bold tracking-wider text-stone-400">
                Modo de Rolagem (Vantagem / Desvantagem)
              </label>
              {(advantageCount > 0 || disadvantageCount > 0) && (
                <span className="text-xs text-amber-300 font-mono">
                  {advantageCount > 0
                    ? `${1 + advantageCount} Dados (Pega Maior)`
                    : `${1 + disadvantageCount} Dados (Pega Menor)`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdvantageCount(0);
                  setDisadvantageCount(0);
                }}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  advantageCount === 0 && disadvantageCount === 0
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Normal
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAdvantageCount((prev) => prev + 1);
                    setDisadvantageCount(0);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                    advantageCount > 0
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-emerald-300'
                  }`}
                  title="Clique para adicionar mais vantagens"
                >
                  <span>+ Vantagem</span>
                  {advantageCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono font-bold">
                      +{advantageCount}
                    </span>
                  )}
                </button>
                {advantageCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAdvantageCount((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 text-xs hover:bg-stone-800"
                    title="Diminuir vantagem"
                  >
                    -
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setDisadvantageCount((prev) => prev + 1);
                    setAdvantageCount(0);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                    disadvantageCount > 0
                      ? 'bg-red-600/30 border-red-500 text-red-200'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-red-300'
                  }`}
                  title="Clique para adicionar mais desvantagens"
                >
                  <span>+ Desvantagem</span>
                  {disadvantageCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-700 text-white text-[10px] font-mono font-bold">
                      +{disadvantageCount}
                    </span>
                  )}
                </button>
                {disadvantageCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDisadvantageCount((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 text-xs hover:bg-stone-800"
                    title="Diminuir desvantagem"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Formula Builder */}
          <div className="bg-stone-900/60 p-3.5 rounded-lg border border-stone-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <label className="text-[11px] text-stone-400 block mb-1">Fórmula (ex: 2d6, 1d20)</label>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="ex: 1d20"
                  className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-sm text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Modificador (+ / -)</label>
                <input
                  type="number"
                  value={modifier}
                  onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Descrição</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="ex: Ataque, Dano"
                  className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              onClick={() => executeRoll(expression)}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-serif font-bold text-sm rounded-lg shadow-md transition transform active:scale-[0.99]"
            >
              Rolar Dados Personalizados
            </button>
          </div>

          {/* Roll History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400 uppercase tracking-wider">
                <History className="w-3.5 h-3.5" />
                Histórico Recente
              </div>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-[11px] text-stone-500 hover:text-stone-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-stone-500 italic text-center py-2">
                  Nenhuma rolagem feita ainda nesta sessão.
                </p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-stone-900/70 border border-stone-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300">{h.label || 'Rolagem'}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({h.expression})</span>
                      <span className="text-[10px] text-stone-500">{h.rollerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-500">{h.timestamp}</span>
                      <span
                        className={`font-serif font-black px-1.5 py-0.5 rounded text-xs ${
                          h.isCritical
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50'
                            : h.isFumble
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : 'text-stone-200'
                        }`}
                      >
                        {h.total}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
