import React from 'react';
import { AlertCircle, Skull, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterSheet } from '../../../types/dnd';

export interface ConditionsSectionProps {
  character: CharacterSheet;
  onUpdateCharacter: (character: CharacterSheet) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CONDITIONS_5E = [
  {
    id: 'amedrontado',
    name: 'Amedrontado',
    desc: 'Desvantagem em testes de habilidade e ataques enquanto a fonte do medo estiver na linha de visão. Não pode se aproximar voluntariamente da fonte.',
  },
  {
    id: 'agarrado',
    name: 'Agarrado',
    desc: 'Velocidade cai para 0 e nenhum bônus de velocidade se aplica. Termina se o agrilhoador estiver incapacitado ou se um efeito forçar a separação.',
  },
  {
    id: 'atordoado',
    name: 'Atordoado',
    desc: 'Incapacitado, não pode se mover e fala gaguejando. Falha automática em testes de FOR e DES. Ataques contra o alvo têm Vantagem.',
  },
  {
    id: 'cego',
    name: 'Cego',
    desc: 'Falha automática em testes que dependem de visão. Ataques contra o alvo têm Vantagem; os ataques do alvo têm Desvantagem.',
  },
  {
    id: 'enfeitiçado',
    name: 'Enfeitiçado',
    desc: 'Não pode atacar o enfeitiçador nem alvejá-lo com habilidades nocivas ou mágicas. O enfeitiçador tem Vantagem em testes sociais contra o alvo.',
  },
  {
    id: 'envenenado',
    name: 'Envenenado',
    desc: 'Desvantagem em testes de habilidade e jogadas de ataque.',
  },
  {
    id: 'impedido',
    name: 'Impedido',
    desc: 'Velocidade cai para 0. Ataques contra o alvo têm Vantagem; ataques do alvo têm Desvantagem. Desvantagem em testes de DES.',
  },
  {
    id: 'incapacitado',
    name: 'Incapacitado',
    desc: 'Não pode realizar ações ou reações.',
  },
  {
    id: 'inconsciente',
    name: 'Inconsciente',
    desc: 'Incapacitado, solta o que estiver segurando, cai caído (prono). Falha automática em testes de FOR e DES. Ataques contra têm Vantagem e acertos a até 1.5m são Críticos.',
  },
  {
    id: 'invisivel',
    name: 'Invisível',
    desc: 'Impossível de ser visto sem magia. Totalmente oculto para furtividade. Ataques do alvo têm Vantagem; ataques contra têm Desvantagem.',
  },
  {
    id: 'paralisado',
    name: 'Paralisado',
    desc: 'Incapacitado, não pode se mover ou falar. Falha automática em testes de FOR e DES. Ataques contra têm Vantagem e acertos a até 1.5m são Críticos.',
  },
  {
    id: 'petrificado',
    name: 'Petrificado',
    desc: 'Transformado em matéria sólida. Peso multiplicado por 10. Incapacitado. Resistência a todo dano e imunidade a veneno e doença.',
  },
  {
    id: 'prono',
    name: 'Caído (Prono)',
    desc: 'Movimento custa o dobro (rastejar). Desvantagem em jogadas de ataque. Ataques contra a até 1.5m têm Vantagem; de mais longe têm Desvantagem.',
  },
  {
    id: 'surdo',
    name: 'Surdo',
    desc: 'Falha automática em qualquer teste que dependa de audição.',
  },
];

export const ConditionsSection: React.FC<ConditionsSectionProps> = ({
  character,
  onUpdateCharacter,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const activeConditions = character.activeConditions || [];
  const exhaustionLevel = character.exhaustionLevel || 0;
  const totalActive = activeConditions.length + (exhaustionLevel > 0 ? 1 : 0);

  const handleClearAll = () => {
    onUpdateCharacter({
      ...character,
      activeConditions: [],
      exhaustionLevel: 0,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleCondition = (condId: string) => {
    const isActive = activeConditions.includes(condId);
    const updated = isActive
      ? activeConditions.filter((c) => c !== condId)
      : [...activeConditions, condId];

    onUpdateCharacter({
      ...character,
      activeConditions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSetExhaustion = (lvl: number) => {
    onUpdateCharacter({
      ...character,
      exhaustionLevel: exhaustionLevel === lvl ? 0 : lvl,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl select-none sheet-card-optimized">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37]">
            Condições de D&amp;D 5E
          </span>
          {totalActive > 0 && (
            <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 px-2 py-0.5 rounded-full">
              {totalActive} Ativa(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalActive > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/60 text-[10px] font-serif font-bold transition cursor-pointer"
              title="Remover todas as condições e exaustão"
            >
              Limpar Todas
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
              title={
                isCollapsed
                  ? 'Expandir condições'
                  : 'Reduzir condições para economizar espaço'
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
      </div>

      <div
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-3.5 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[1600px] opacity-100'
        }`}
      >
        {/* GRID DE CONDIÇÕES OFICIAIS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONDITIONS_5E.map((cond) => {
            const isActive = activeConditions.includes(cond.id);
            return (
              <button
                key={cond.id}
                type="button"
                onClick={() => handleToggleCondition(cond.id)}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between gap-1 transition-colors duration-100 cursor-pointer box-border group ${
                  isActive
                    ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-[#120a06] hover:bg-[#1f130a] border-[#54412c] text-[#eedbc5]'
                }`}
                title={cond.desc}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-serif font-bold text-xs truncate ${
                      isActive ? 'text-amber-300' : 'text-[#f4ecd8]'
                    }`}
                  >
                    {cond.name}
                  </span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                      isActive
                        ? 'bg-amber-500 border-amber-300 text-black'
                        : 'border-[#54412c] text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </div>
                <span className="text-[9px] text-[#8c7457] line-clamp-1 group-hover:text-[#bfa888] font-sans">
                  {cond.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* SELETOR DE EXAUSTÃO (1 A 6) */}
        <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2 box-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold uppercase text-[#d4af37] flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span>Exaustão (Nível {exhaustionLevel} / 6)</span>
            </span>
            {exhaustionLevel > 0 && (
              <span className="text-[9px] font-mono bg-red-950/80 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded">
                {exhaustionLevel === 1
                  ? 'Desvantagem em testes'
                  : exhaustionLevel === 2
                  ? 'Velocidade pela metade'
                  : exhaustionLevel === 3
                  ? 'Desv. em ataques/salvas'
                  : exhaustionLevel === 4
                  ? 'HP máximo pela metade'
                  : exhaustionLevel === 5
                  ? 'Velocidade 0'
                  : 'Morte / Incapacitado'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const isSelected = exhaustionLevel >= lvl;
              return (
                <button
                  key={`ex_${lvl}`}
                  type="button"
                  onClick={() => handleSetExhaustion(lvl)}
                  className={`py-2 rounded-lg border text-xs font-mono font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'bg-[#1a120b] hover:bg-[#261a12] border-[#54412c] text-[#8c7457]'
                  }`}
                  title={`Definir Exaustão para Nível ${lvl}`}
                >
                  <span>{lvl}</span>
                  <span className="text-[7px] font-serif uppercase tracking-tighter">
                    Nível
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
