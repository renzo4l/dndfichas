import React from 'react';
import { Dices } from 'lucide-react';
import { Spell } from '../../../types/dnd';

export interface SpellCardProps {
  spell: Spell;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onTogglePrepared: () => void;
  onQuickRoll?: (formula: string, label: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  isCollapsed,
  onToggleCollapse,
  onTogglePrepared,
  onQuickRoll,
  onEdit,
  onDelete,
}) => {
  const formula = spell.damageFormula || (spell as any).damageFormula || '';

  return (
    <div
      className={`bg-[#140e09] border rounded-xl overflow-hidden transition ${
        spell.prepared ? 'border-[#8c6b32]' : 'border-[#3d2a1b]'
      }`}
    >
      {/* Header Card */}
      <div className="p-3 bg-[#1a120b] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#54412c]/40">
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="checkbox"
            checked={spell.prepared}
            onChange={onTogglePrepared}
            className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer accent-[#c49d48]"
            title={
              spell.prepared
                ? 'Magia Preparada (clique para desmarcar)'
                : 'Marcar como Preparada'
            }
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="font-serif font-black text-amber-200 text-sm hover:text-white text-left transition cursor-pointer"
          >
            {spell.name}
          </button>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold">
            {spell.level === 0 ? 'Truque' : `${spell.level}º Nível`} • {spell.school || 'Evocação'}
          </span>

          {spell.prepared && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 font-serif font-bold">
              Preparada
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {formula && (
            <button
              type="button"
              onClick={() => onQuickRoll && onQuickRoll(formula, spell.name)}
              className="flex items-center gap-1 text-[11px] font-serif font-bold px-2.5 py-1 bg-amber-950/80 text-amber-200 hover:bg-amber-900 border border-amber-700/80 rounded cursor-pointer transition shadow"
              title={`Rolar magia (${formula})`}
            >
              <Dices className="w-3.5 h-3.5 text-amber-300" />
              <span>Rolar ({formula})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-serif font-bold text-emerald-400 hover:text-emerald-300 transition px-1.5 py-0.5 hover:bg-emerald-950/40 rounded cursor-pointer"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] font-serif font-bold text-red-400 hover:text-red-300 transition px-1.5 py-0.5 hover:bg-red-950/40 rounded cursor-pointer"
          >
            Remover
          </button>
        </div>
      </div>

      {/* Visualização de detalhes / Descrição */}
      {!isCollapsed && (
        <div className="p-3 bg-[#120a06] text-xs space-y-2 border-t border-[#3d2a1b]/40">
          {/* Metadados da Magia */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#8c7457] font-mono bg-[#1a120b] p-2 rounded border border-[#3d2a1b]/60">
            <div>
              <span className="block text-[#c49d48]">Conjuração:</span>
              <span className="text-[#eedbc5]">{spell.castingTime || '1 Ação'}</span>
            </div>
            <div>
              <span className="block text-[#c49d48]">Alcance:</span>
              <span className="text-[#eedbc5]">{spell.range || '18m'}</span>
            </div>
            <div>
              <span className="block text-[#c49d48]">Componentes:</span>
              <span className="text-[#eedbc5]">{spell.components || 'V, S'}</span>
            </div>
            <div>
              <span className="block text-[#c49d48]">Duração:</span>
              <span className="text-[#eedbc5]">{spell.duration || 'Instantâneo'}</span>
            </div>
          </div>

          {/* Descrição */}
          <p className="whitespace-pre-line text-[#eedbc5] font-serif leading-relaxed">
            {spell.description || 'Sem descrição cadastrada.'}
          </p>
        </div>
      )}
    </div>
  );
};
