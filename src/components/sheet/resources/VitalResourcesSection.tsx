import React from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterSheet } from '../../../types/dnd';

export interface VitalResourcesSectionProps {
  character: CharacterSheet;
  conMod: number;
  onUpdateCharacter: (character: CharacterSheet) => void;
  onQuickRoll: (expression: string, label: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const VitalResourcesSection: React.FC<VitalResourcesSectionProps> = ({
  character,
  conMod,
  onUpdateCharacter,
  onQuickRoll,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Hit Dice parsing
  const parseHitDice = () => {
    const raw = (character.hitDice || '1d8').trim();
    const match = raw.match(/^(\d+)\s*(d\d+)/i);
    const dieType = match ? match[2].toLowerCase() : 'd8';
    const maxDice = match ? parseInt(match[1], 10) : 1;
    const currentDice =
      character.currentHitDice !== undefined
        ? Math.min(maxDice, Math.max(0, character.currentHitDice))
        : maxDice;
    return { currentDice, maxDice, dieType };
  };

  const parsedHitDice = parseHitDice();

  const handleAdjustTempHp = (delta: number) => {
    const nextVal = Math.max(0, (character.tempHp || 0) + delta);
    onUpdateCharacter({
      ...character,
      tempHp: nextVal,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleInteractiveDamage = (amount: number) => {
    let curHp = character.currentHp;
    let temp = character.tempHp || 0;
    let rem = amount;

    if (temp > 0) {
      if (temp >= rem) {
        temp -= rem;
        rem = 0;
      } else {
        rem -= temp;
        temp = 0;
      }
    }
    curHp = Math.max(0, curHp - rem);

    onUpdateCharacter({
      ...character,
      currentHp: curHp,
      tempHp: temp,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleInteractiveHeal = (amount: number) => {
    const curHp = Math.min(character.maxHp, character.currentHp + amount);
    onUpdateCharacter({
      ...character,
      currentHp: curHp,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleHitDiceChange = (delta: number) => {
    const nextDice = Math.min(
      parsedHitDice.maxDice,
      Math.max(0, parsedHitDice.currentDice + delta)
    );
    onUpdateCharacter({
      ...character,
      currentHitDice: nextDice,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleZeroHitDice = () => {
    onUpdateCharacter({
      ...character,
      currentHitDice: 0,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResetHitDice = () => {
    onUpdateCharacter({
      ...character,
      currentHitDice: parsedHitDice.maxDice,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRollHitDie = () => {
    if (parsedHitDice.currentDice <= 0) {
      alert('Você não possui dados de vida restantes para gastar!');
      return;
    }
    handleHitDiceChange(-1);
    const sign = conMod >= 0 ? `+${conMod}` : `${conMod}`;
    const formula = `1${parsedHitDice.dieType}${sign}`;
    onQuickRoll(formula, `Cura com Dado de Vida (1${parsedHitDice.dieType}${sign})`);
  };

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl select-none sheet-card-optimized">
      <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-3">
        <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-red-400" />
          <span>Recursos Vitais</span>
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
            title={
              isCollapsed
                ? 'Expandir recursos vitais'
                : 'Reduzir recursos vitais para economizar espaço'
            }
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
            )}
          </button>
        )}
      </div>

      <div
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-4 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[1600px] opacity-100'
        }`}
      >
        {/* BARRA 1: PONTOS DE VIDA (PV / HP) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-xs uppercase tracking-wider text-[#f4ecd8]">
                VIDA
              </span>
              {character.tempHp > 0 && (
                <span className="text-[10px] font-mono bg-[#2a1c12] border border-[#c49d48]/60 text-[#d4af37] px-1.5 py-0.2 rounded font-bold">
                  +{character.tempHp} Temp
                </span>
              )}
            </div>

            {/* Controles rápidos de HP Temporário */}
            <div className="flex items-center gap-1 text-[11px] font-serif">
              <span className="text-[#8c7457] uppercase font-bold mr-0.5">
                Temp:
              </span>
              <button
                type="button"
                onClick={() => handleAdjustTempHp(-1)}
                disabled={!character.tempHp}
                className="px-1.5 py-0.2 bg-[#261a12] hover:bg-[#382619] disabled:opacity-30 text-[#eedbc5] rounded border border-[#54412c] font-bold transition cursor-pointer"
                title="Subtrair 1 HP Temporário"
              >
                -1
              </button>
              <span className="font-mono font-bold text-amber-300 min-w-[16px] text-center">
                {character.tempHp || 0}
              </span>
              <button
                type="button"
                onClick={() => handleAdjustTempHp(1)}
                className="px-1.5 py-0.2 bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] rounded border border-[#54412c] font-bold transition cursor-pointer"
                title="Adicionar 1 HP Temporário"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTempHp(5)}
                className="px-1.5 py-0.2 bg-[#261a12] hover:bg-[#382619] text-[#c49d48] rounded border border-[#8c6b32]/50 font-bold transition ml-0.5 cursor-pointer"
                title="Adicionar 5 HP Temporários"
              >
                +5
              </button>
              {character.tempHp > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCharacter({
                      ...character,
                      tempHp: 0,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="text-[9px] text-stone-400 hover:text-red-400 underline ml-1 cursor-pointer"
                  title="Zerar HP temporário"
                >
                  Zerar
                </button>
              )}
            </div>
          </div>

          {/* Barra horizontal interativa de HP */}
          <div className="relative w-full h-11 bg-[#120a06] border-2 border-[#54412c] rounded-xl overflow-hidden shadow-xl flex items-stretch select-none">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none opacity-85 ${
                character.currentHp / (character.maxHp || 1) > 0.5
                  ? 'bg-gradient-to-r from-red-900 via-red-800 to-red-700'
                  : character.currentHp / (character.maxHp || 1) > 0.25
                  ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-800'
                  : 'bg-gradient-to-r from-red-950 to-red-900'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    (character.currentHp / (character.maxHp || 1)) * 100
                  )
                )}%`,
              }}
            />

            {/* Botão « (-5 HP) */}
            <button
              type="button"
              onClick={() => handleInteractiveDamage(5)}
              className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
              title="Dano -5 HP"
            >
              «
            </button>

            {/* Botão ‹ (-1 HP) */}
            <button
              type="button"
              onClick={() => handleInteractiveDamage(1)}
              className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
              title="Dano -1 HP"
            >
              ‹
            </button>

            {/* Display Central */}
            <div className="relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 text-center">
              <span className="font-serif font-black text-base sm:text-lg text-[#f4ecd8] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {character.currentHp} / {character.maxHp}
              </span>
              {character.tempHp > 0 && (
                <span className="font-mono font-bold text-xs text-[#e8c679] drop-shadow">
                  (+{character.tempHp})
                </span>
              )}
            </div>

            {/* Botão › (+1 HP) */}
            <button
              type="button"
              onClick={() => handleInteractiveHeal(1)}
              className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
              title="Cura +1 HP"
            >
              ›
            </button>

            {/* Botão » (+5 HP) */}
            <button
              type="button"
              onClick={() => handleInteractiveHeal(5)}
              className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
              title="Cura +5 HP"
            >
              »
            </button>
          </div>

          {/* Ajuste manual de HP */}
          <div className="flex items-center justify-end text-[11px] text-[#8c7457] pt-0.5">
            <div className="flex items-center gap-1">
              <span className="uppercase text-[9px] font-bold">Editar:</span>
              <input
                type="text"
                inputMode="numeric"
                value={character.currentHp}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  const val = clean === '' ? 0 : Math.max(0, parseInt(clean, 10));
                  onUpdateCharacter({
                    ...character,
                    currentHp: val,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-16 min-w-[4rem] bg-[#140d08] border border-[#54412c] rounded px-1.5 text-center font-bold text-red-300 text-xs focus:outline-none"
              />
              <span>/</span>
              <input
                type="text"
                inputMode="numeric"
                value={character.maxHp}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  const val = clean === '' ? 1 : Math.max(1, parseInt(clean, 10));
                  onUpdateCharacter({
                    ...character,
                    maxHp: val,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-16 min-w-[4rem] bg-[#140d08] border border-[#54412c] rounded px-1.5 text-center font-bold text-[#eedbc5] text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* BARRA 2: DADOS DE VIDA */}
        <div className="space-y-2 pt-2 border-t border-[#54412c]/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-xs uppercase tracking-wider text-[#f4ecd8]">
                DADOS DE VIDA
              </span>
              <span className="text-[10px] font-mono bg-[#22180f] border border-[#63492e] text-[#eedbc5] px-1.5 py-0.2 rounded font-bold">
                {parsedHitDice.dieType}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRollHitDie}
              className="text-[10px] font-serif font-bold text-[#c49d48] hover:text-[#f5d77f] hover:underline cursor-pointer"
              title="Gastar 1 dado de vida e rolar cura (+ CON)"
            >
              Rolar Dado (+CON)
            </button>
          </div>

          <div className="relative w-full h-10 bg-[#120a06] border-2 border-[#54412c] rounded-xl overflow-hidden shadow-xl flex items-stretch select-none">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-950 via-amber-900 to-[#8c6b32] transition-all duration-300 pointer-events-none opacity-80"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    (parsedHitDice.currentDice / (parsedHitDice.maxDice || 1)) * 100
                  )
                )}%`,
              }}
            />

            <button
              type="button"
              onClick={handleZeroHitDice}
              className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
              title="Zerar dados de vida disponíveis"
            >
              «
            </button>

            <button
              type="button"
              onClick={() => handleHitDiceChange(-1)}
              className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
              title="Gastar 1 Dado de Vida"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={handleRollHitDie}
              className="relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 text-center hover:bg-[#ffffff]/5 transition cursor-pointer"
              title="Clique para rolar 1 Dado de Vida + CON para cura"
            >
              <span className="font-serif font-black text-sm text-[#f4ecd8] drop-shadow">
                {parsedHitDice.currentDice} / {parsedHitDice.maxDice}{' '}
                {parsedHitDice.dieType}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleHitDiceChange(1)}
              className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
              title="Recuperar 1 Dado de Vida"
            >
              ›
            </button>

            <button
              type="button"
              onClick={handleResetHitDice}
              className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
              title="Restaurar todos os dados de vida"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
