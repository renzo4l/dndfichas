import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterFeature } from '../../../types/dnd';

export interface FeatureCardProps {
  feature: CharacterFeature;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-[#150e09] border border-[#54412c] hover:border-[#8c6b32] rounded-xl overflow-hidden shadow-md transition group select-none">
      {/* Card Header */}
      <div
        onClick={onToggleCollapse}
        className="px-3.5 py-2.5 bg-[#1e150e] hover:bg-[#281b12] border-b border-[#54412c]/50 flex items-center justify-between gap-2 cursor-pointer select-none transition"
      >
        {/* Lado esquerdo (Chevron + Título) */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <button
            type="button"
            className="text-[#c49d48] hover:text-[#f4ecd8] transition flex-shrink-0 cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-[#c49d48]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#c49d48]" />
            )}
          </button>
          <h4 className="font-serif font-bold text-[#f4ecd8] group-hover:text-amber-300 transition text-[0.85rem] leading-[1.3] whitespace-normal">
            {feature.name}
          </h4>
        </div>

        {/* Lado direito (Badges de origem/recarga + Ações Editar/Remover) */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          {feature.source && (
            <span className="text-[0.65rem] font-serif px-1.5 py-0.5 rounded bg-[#2a1d13] text-[#d4af37] border border-[#8c6b32]/40 whitespace-nowrap">
              {feature.source}
            </span>
          )}
          {feature.cost && (
            <span className="text-[0.65rem] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold whitespace-nowrap">
              {feature.cost}
            </span>
          )}
          <div className="flex items-center gap-1.5 pl-1 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-[11px] font-serif font-bold text-emerald-400 hover:text-emerald-300 transition px-1.5 py-0.5 hover:bg-emerald-950/40 rounded cursor-pointer whitespace-nowrap"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-[11px] font-serif font-bold text-red-400 hover:text-red-300 transition px-1.5 py-0.5 hover:bg-red-950/40 rounded cursor-pointer whitespace-nowrap"
            >
              Remover
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Expandido (Descrição e Detalhes) */}
      {!isCollapsed && (
        <div className="p-3.5 bg-[#120a06] text-xs text-[#eedbc5] font-serif leading-relaxed space-y-2 border-t border-[#3d2a1b]/40">
          <p className="whitespace-pre-line text-[#eedbc5]">
            {feature.description || 'Sem descrição cadastrada.'}
          </p>
          {(feature.source || feature.cost) && (
            <div className="pt-2 border-t border-[#3d2a1b]/60 flex items-center gap-3 text-[10px] text-[#8c7457] font-mono">
              {feature.source && (
                <span>
                  Origem: <strong className="text-[#c49d48]">{feature.source}</strong>
                </span>
              )}
              {feature.cost && (
                <span>
                  Custo: <strong className="text-amber-300">{feature.cost}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
