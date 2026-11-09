import React from 'react';
import { Dices } from 'lucide-react';
import { SkillProficiencyLevel } from '../../../types/dnd';
import { formatModifier } from '../../../utils/dndRules';

export interface SkillRowProps {
  id: string;
  name: string;
  attributeLabel: string;
  isSavingThrow?: boolean;
  isProficient?: boolean;
  proficiencyLevel?: SkillProficiencyLevel;
  customBonus: number;
  totalBonus: number;
  rollTitle?: string;
  onRoll: () => void;
  onProficiencyToggle: () => void;
  onCustomBonusChange: (bonus: number) => void;
}

export const SkillRow: React.FC<SkillRowProps> = ({
  name,
  attributeLabel,
  isSavingThrow = false,
  isProficient = false,
  proficiencyLevel = 'none',
  customBonus,
  totalBonus,
  rollTitle,
  onRoll,
  onProficiencyToggle,
  onCustomBonusChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9\-+]/g, '');
    if (clean === '' || clean === '-' || clean === '+') {
      onCustomBonusChange(0);
    } else {
      const parsed = parseInt(clean, 10);
      onCustomBonusChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  return (
    <div className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-2 items-center w-full px-2 py-1 rounded-lg border-l-2 border-transparent hover:border-[#c49d48] hover:bg-[#281b10] transition-colors duration-100 group text-xs">
      {/* Col 1: D20 Rolagem Imediata */}
      <button
        type="button"
        onClick={onRoll}
        className="w-full flex items-center justify-center text-[#8c7457] group-hover:text-[#f5d77f] hover:bg-[#3d2719] transition rounded py-0.5 cursor-pointer"
        title={rollTitle || `Rolar 1d20${formatModifier(totalBonus)}`}
      >
        <Dices className="w-3.5 h-3.5" />
      </button>

      {/* Col 2: Marcador/Ícone de Proficiência */}
      {isSavingThrow ? (
        <button
          type="button"
          onClick={onProficiencyToggle}
          className={`w-full py-0.5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition cursor-pointer ${
            isProficient
              ? 'bg-amber-600 border-amber-300 text-[#140d07] shadow-[0_0_8px_rgba(217,119,6,0.6)] font-black'
              : 'bg-[#140d08] border-[#54412c] text-stone-600 hover:border-[#8c6b32]'
          }`}
          title={`Proficiência em Salvaguarda: ${
            isProficient ? 'Sim (+ prof)' : 'Não'
          } (Clique para alternar)`}
        >
          {isProficient ? '★' : '☆'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onProficiencyToggle}
          className={`w-full py-0.5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition cursor-pointer ${
            proficiencyLevel === 'expertise'
              ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)] font-black'
              : proficiencyLevel === 'proficient'
              ? 'bg-[#c49d48] border-[#e8c679] text-[#140d07] shadow-sm font-black'
              : proficiencyLevel === 'half'
              ? 'bg-[#2b1f15] border-[#8c6b32] text-amber-200'
              : 'bg-[#140d08] border-[#54412c] text-stone-600 hover:border-[#8c6b32]'
          }`}
          title={`Treino: ${
            proficiencyLevel === 'expertise'
              ? 'Especialização (2x)'
              : proficiencyLevel === 'proficient'
              ? 'Proficiente (1x)'
              : proficiencyLevel === 'half'
              ? 'Meia-Proficiência (0.5x)'
              : 'Sem Treino'
          } (Clique para alternar)`}
        >
          {proficiencyLevel === 'expertise'
            ? '✪'
            : proficiencyLevel === 'proficient'
            ? '●'
            : proficiencyLevel === 'half'
            ? '½'
            : '○'}
        </button>
      )}

      {/* Col 3: Nome + Atributo Base */}
      <div className="truncate flex items-center gap-1 min-w-0">
        <span
          onClick={onRoll}
          title={name}
          className="font-serif font-semibold text-[#f4ecd8] group-hover:text-amber-200 transition cursor-pointer select-none truncate text-xs"
        >
          {name}
        </span>
        <span className="text-[10px] text-[#8c7457] font-mono shrink-0">
          ({attributeLabel})
        </span>
      </div>

      {/* Col 4: Campo de Bônus Adicional / Outros */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9\-+]*"
        value={customBonus === 0 ? '' : customBonus}
        onChange={handleInputChange}
        className="w-full bg-[#120a06] border border-[#54412c] group-hover:border-[#8c6b32] focus:border-[#c49d48] rounded px-1 py-0.5 text-center font-mono text-[11px] text-amber-200 focus:outline-none"
        placeholder="0"
        title="Bônus adicional / outros (itens mágicos, bênçãos, etc.)"
      />

      {/* Col 5: Modificador Total Calculado */}
      <span className="font-mono font-black text-amber-300 text-right drop-shadow text-xs truncate w-full">
        {formatModifier(totalBonus)}
      </span>
    </div>
  );
};
