import React from 'react';
import { Footprints } from 'lucide-react';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';

export interface SpeedCounterProps {
  speed?: number;
  onUpdateSpeed?: (speed: number) => void;
  className?: string;
}

export const SpeedCounter: React.FC<SpeedCounterProps> = ({
  speed,
  onUpdateSpeed,
  className = '',
}) => {
  let ctx: ReturnType<typeof useCharacterSheet> | null = null;
  try {
    ctx = useCharacterSheet();
  } catch {
    ctx = null;
  }

  const currentSpeed =
    speed ?? (ctx?.character.speed !== undefined && ctx?.character.speed !== null
      ? ctx.character.speed
      : 9);

  const speedInSquares = Math.round(currentSpeed / 1.5);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9.]/g, '');
    const val = clean === '' ? 0 : Math.max(0, parseFloat(clean) || 0);

    if (onUpdateSpeed) {
      onUpdateSpeed(val);
    } else if (ctx) {
      ctx.onUpdateCharacter({
        ...ctx.character,
        speed: val,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div
      className={`bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden text-center select-none ${className}`}
    >
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
        <Footprints className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="truncate">Deslocamento</span>
      </div>

      <div className="flex items-baseline justify-center gap-0.5 max-w-full my-0.5">
        <input
          type="text"
          inputMode="numeric"
          value={currentSpeed}
          onChange={handleChange}
          className="text-xl sm:text-2xl font-serif font-black text-amber-100 w-12 text-center bg-transparent focus:outline-none focus:bg-[#251910] rounded px-0 leading-none cursor-pointer"
          title="Deslocamento em metros. Clique para editar"
        />
        <span className="text-[10px] font-serif font-bold text-emerald-400 uppercase tracking-wider select-none">
          m
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 text-[9px] text-[#8c7457] font-serif truncate max-w-full">
        <span className="font-bold text-emerald-200">{speedInSquares} q</span>
        <span className="text-[8px] text-stone-500">(1,5m = 1q)</span>
      </div>
    </div>
  );
};
