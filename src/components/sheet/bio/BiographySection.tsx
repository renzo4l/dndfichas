import React from 'react';
import { User, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterSheet } from '../../../types/dnd';

export interface BiographySectionProps {
  character: CharacterSheet;
  userRole?: 'dm' | 'player';
  onUpdateCharacter: (character: CharacterSheet) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const BiographySection: React.FC<BiographySectionProps> = ({
  character,
  userRole = 'player',
  onUpdateCharacter,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none sheet-card-optimized">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[#e8c679]" />
          <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
            Biografia &amp; Anotações
          </span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer flex items-center justify-center"
            title={
              isCollapsed
                ? 'Expandir biografia'
                : 'Reduzir biografia para economizar espaço'
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
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-3 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[3000px] opacity-100'
        }`}
      >
        {/* História & Personalidade */}
        <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2 text-xs">
          <span className="font-serif font-black uppercase text-[#d4af37] block">
            História &amp; Personalidade
          </span>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#8c7457] font-serif block">
              História de Fundo / Origem
            </label>
            <textarea
              value={character.backstory || ''}
              onChange={(e) =>
                onUpdateCharacter({ ...character, backstory: e.target.value })
              }
              rows={3}
              placeholder="Origem, família, juramentos e eventos marcantes..."
              className="w-full text-xs text-[#eedbc5] bg-[#120a06] border border-[#54412c] rounded p-2 focus:outline-none focus:border-[#c49d48]"
            />
          </div>
        </div>

        {/* DM Notes Section */}
        <div className="bg-[#1a1008] border border-amber-900/50 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-serif font-black text-amber-400 uppercase flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Anotações do Mestre da Campanha
            </span>
            <span className="text-[10px] text-[#8c7457] font-serif">
              {userRole === 'dm' ? 'Editável pelo Mestre' : 'Somente Leitura'}
            </span>
          </div>
          <textarea
            value={character.dmNotes || ''}
            disabled={userRole !== 'dm'}
            onChange={(e) =>
              onUpdateCharacter({ ...character, dmNotes: e.target.value })
            }
            rows={3}
            placeholder={
              userRole === 'dm'
                ? 'Escreva notas da trama, segredos, recompensas ocultas ou maldições para este herói...'
                : 'Anotações confidenciais do Mestre...'
            }
            className="w-full text-xs text-amber-200 bg-[#120a06] border border-amber-900/50 rounded p-2 focus:outline-none disabled:opacity-75"
          />
        </div>
      </div>
    </div>
  );
};
