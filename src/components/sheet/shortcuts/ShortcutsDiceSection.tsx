import React, { useState } from 'react';
import {
  Dices,
  Star,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Flame,
} from 'lucide-react';
import { SavedRollShortcut } from '../../../types/dnd';
import { getSavedRollShortcuts, saveRollShortcuts } from '../../../services/storage';
import { EditRollShortcutModal } from '../modals/EditRollShortcutModal';

export interface ShortcutsDiceSectionProps {
  onQuickRoll: (expression: string, label: string) => void;
  savedShortcuts?: SavedRollShortcut[];
  onShortcutsChange?: (shortcuts: SavedRollShortcut[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const modifyAdvantageInFormula = (
  currentFormula: string,
  action: 'advantage' | 'disadvantage' | 'clear'
): string => {
  const raw = currentFormula.trim();
  const baseExpr = raw.replace(/\s*\[.*?\]/g, '').trim() || '1d20';

  if (action === 'clear') {
    return baseExpr;
  }

  const advMatch = raw.match(
    /\[?\s*(?:(\d+)\s*x?\s*vantag(?:em|ens)?|vantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i
  );
  const disMatch = raw.match(
    /\[?\s*(?:(\d+)\s*x?\s*desvantag(?:em|ens)?|desvantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i
  );

  let curAdvCount = 0;
  let curDisCount = 0;

  if (disMatch) {
    curDisCount = Math.max(1, parseInt(disMatch[1] || disMatch[2] || '1', 10));
  } else if (advMatch) {
    curAdvCount = Math.max(1, parseInt(advMatch[1] || advMatch[2] || '1', 10));
  }

  if (action === 'advantage') {
    if (curDisCount > 0) {
      const nextDis = curDisCount - 1;
      if (nextDis === 0) return baseExpr;
      return `${baseExpr} [${nextDis > 1 ? `${nextDis} Desvantagens` : 'Desvantagem'}]`;
    } else {
      const nextAdv = curAdvCount + 1;
      return `${baseExpr} [${nextAdv > 1 ? `${nextAdv} Vantagens` : 'Vantagem'}]`;
    }
  } else {
    if (curAdvCount > 0) {
      const nextAdv = curAdvCount - 1;
      if (nextAdv === 0) return baseExpr;
      return `${baseExpr} [${nextAdv > 1 ? `${nextAdv} Vantagens` : 'Vantagem'}]`;
    } else {
      const nextDis = curDisCount + 1;
      return `${baseExpr} [${nextDis > 1 ? `${nextDis} Desvantagens` : 'Desvantagem'}]`;
    }
  }
};

export const getAdvDisCounts = (formula: string) => {
  const advMatch = formula.match(
    /\[?\s*(?:(\d+)\s*x?\s*vantag(?:em|ens)?|vantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i
  );
  const disMatch = formula.match(
    /\[?\s*(?:(\d+)\s*x?\s*desvantag(?:em|ens)?|desvantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i
  );
  let adv = 0;
  let dis = 0;
  if (disMatch) {
    dis = Math.max(1, parseInt(disMatch[1] || disMatch[2] || '1', 10));
  } else if (advMatch) {
    adv = Math.max(1, parseInt(advMatch[1] || advMatch[2] || '1', 10));
  }
  return { adv, dis };
};

export const ShortcutsDiceSection: React.FC<ShortcutsDiceSectionProps> = ({
  onQuickRoll,
  savedShortcuts: propShortcuts,
  onShortcutsChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [internalShortcuts, setInternalShortcuts] = useState<SavedRollShortcut[]>(
    () => propShortcuts || getSavedRollShortcuts()
  );
  const [quickDiceFormula, setQuickDiceFormula] = useState('1d20+5');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<SavedRollShortcut | null>(null);

  const shortcuts = propShortcuts || internalShortcuts;

  const updateShortcuts = (newList: SavedRollShortcut[]) => {
    setInternalShortcuts(newList);
    saveRollShortcuts(newList);
    if (onShortcutsChange) {
      onShortcutsChange(newList);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingShortcut(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sc: SavedRollShortcut) => {
    setEditingShortcut(sc);
    setIsModalOpen(true);
  };

  const handleDeleteShortcut = (id: string) => {
    const updated = shortcuts.filter((sc) => sc.id !== id);
    updateShortcuts(updated);
  };

  const handleSaveModal = (sc: SavedRollShortcut, rollImmediately?: boolean) => {
    let updated: SavedRollShortcut[];
    if (editingShortcut) {
      updated = shortcuts.map((s) => (s.id === sc.id ? sc : s));
    } else {
      updated = [...shortcuts, sc];
    }
    updateShortcuts(updated);
    setIsModalOpen(false);

    if (rollImmediately) {
      onQuickRoll(sc.expression, sc.label);
    }
  };

  const { adv: quickAdvCount, dis: quickDisCount } = getAdvDisCounts(quickDiceFormula);

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-4 select-none sheet-card-optimized">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#24170e] border border-[#8c6b32]/70 text-[#d4af37]">
            <Dices className="w-4 h-4 text-[#e8c679]" />
          </div>
          <div>
            <h4 className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37]">
              Mesa de Dados &amp; Atalhos
            </h4>
            <span className="text-[9px] text-[#8c7457] font-mono">
              Rolador &amp; Atalhos Salvos Archdice
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs shadow-md border border-[#e8c679]/40 transition active:scale-95 cursor-pointer"
            title="Abrir janela flutuante para salvar uma nova rolagem genérica (sem ser ataque)"
          >
            <Star className="w-3.5 h-3.5 fill-[#140d07]" />
            <span>+ Salvar Rolagem</span>
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
              title={
                isCollapsed
                  ? 'Expandir atalhos'
                  : 'Reduzir atalhos para economizar espaço'
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
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-4 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[3500px] opacity-100'
        }`}
      >
        {/* Rolador Rápido Automático */}
        <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-serif uppercase tracking-wider text-[#a38b6c]">
            <span>Rolador Livre:</span>
            <span className="text-[9px] font-mono text-[#6e5840]">Enter para rolar</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickDiceFormula}
                onChange={(e) => setQuickDiceFormula(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickDiceFormula.trim()) {
                    onQuickRoll(
                      quickDiceFormula.trim(),
                      `Rolagem livre: ${quickDiceFormula.trim()}`
                    );
                  }
                }}
                placeholder="ex: 1d20+5, 2d6+3, 8d6, 1d20+5 [Vantagem]..."
                className="w-full bg-[#1b120b] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-200 placeholder-[#6d573f] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (quickDiceFormula.trim()) {
                  onQuickRoll(
                    quickDiceFormula.trim(),
                    `Rolagem livre: ${quickDiceFormula.trim()}`
                  );
                }
              }}
              className="px-3.5 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] active:scale-95 text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 shadow-md flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Rolar</span>
            </button>
          </div>

          {/* Botões Rápidos de Dados Base e Flags Rápidas */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1 border-t border-[#54412c]/40 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[9px] font-serif uppercase text-[#8c7457] mr-0.5 flex-shrink-0">
                Dados:
              </span>
              {['d20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100'].map((die) => (
                <button
                  key={die}
                  type="button"
                  onClick={() => {
                    setQuickDiceFormula(`1${die}`);
                    onQuickRoll(`1${die}`, `Rolagem: 1${die}`);
                  }}
                  className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] hover:text-[#f4ecd8] text-[10px] font-mono font-bold text-[#c49d48] border border-[#54412c] transition flex-shrink-0 cursor-pointer"
                  title={`Rolar 1${die}`}
                >
                  {die}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const newFormula = modifyAdvantageInFormula(
                    quickDiceFormula,
                    'advantage'
                  );
                  setQuickDiceFormula(newFormula);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold border transition flex items-center gap-1 cursor-pointer ${
                  quickAdvCount > 0
                    ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500 shadow-sm'
                    : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                }`}
                title="Adicionar +1 Vantagem à fórmula"
              >
                <span>+ Vantagem</span>
                {quickAdvCount > 0 && (
                  <span className="px-1 py-0.2 bg-emerald-700 text-white rounded text-[9px] font-mono font-bold">
                    +{quickAdvCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const newFormula = modifyAdvantageInFormula(
                    quickDiceFormula,
                    'disadvantage'
                  );
                  setQuickDiceFormula(newFormula);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold border transition flex items-center gap-1 cursor-pointer ${
                  quickDisCount > 0
                    ? 'bg-red-900/90 text-red-200 border-red-500 shadow-sm'
                    : 'bg-red-950/70 hover:bg-red-900/80 text-red-300 border-red-700/60'
                }`}
                title="Adicionar +1 Desvantagem à fórmula"
              >
                <span>+ Desvantagem</span>
                {quickDisCount > 0 && (
                  <span className="px-1 py-0.2 bg-red-700 text-white rounded text-[9px] font-mono font-bold">
                    +{quickDisCount}
                  </span>
                )}
              </button>
              {(quickAdvCount > 0 || quickDisCount > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    const newFormula = modifyAdvantageInFormula(
                      quickDiceFormula,
                      'clear'
                    );
                    setQuickDiceFormula(newFormula);
                  }}
                  className="px-1.5 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-stone-400 hover:text-stone-200 text-[9px] font-mono border border-[#54412c] transition cursor-pointer"
                  title="Remover vantagem/desvantagem"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Seção de Atalhos Salvos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-serif font-black uppercase tracking-wider text-[#d4af37] text-[11px] flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#e8c679] fill-[#e8c679]" />
              <span>Atalhos Salvos ({shortcuts.length})</span>
            </span>
          </div>

          {shortcuts.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[#140d08] border-2 border-dashed border-[#54412c] rounded-xl space-y-2">
              <Dices className="w-6 h-6 text-[#8c7457] mx-auto opacity-60" />
              <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                Você ainda não salvou nenhum atalho de rolagem
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3 py-1.5 bg-[#24170e] hover:bg-[#382415] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/60 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1 mx-auto cursor-pointer shadow active:scale-95"
              >
                <Star className="w-3.5 h-3.5 fill-[#c49d48]" />
                <span>+ Criar Atalho de Rolagem</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {shortcuts.map((sc) => {
                const isAdv =
                  sc.advantageType === 'advantage' || /vantagem/i.test(sc.expression);
                const isDis =
                  sc.advantageType === 'disadvantage' ||
                  /desvantagem/i.test(sc.expression);

                return (
                  <div
                    key={sc.id}
                    onClick={() => onQuickRoll(sc.expression, sc.label)}
                    className="group relative flex flex-col justify-between p-2.5 rounded-xl bg-[#150e09] hover:bg-[#25170d] border border-[#54412c] hover:border-[#8c6b32] hover:shadow-[0_0_12px_rgba(196,157,72,0.2)] transition-all duration-150 cursor-pointer text-left space-y-1.5"
                    title={`Clique para rolar ${sc.label} (${sc.expression})`}
                  >
                    {/* Linha Superior */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-serif font-black text-xs text-[#f4ecd8] group-hover:text-[#f5d77f] transition truncate">
                        {sc.label}
                      </span>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(sc);
                          }}
                          className="p-1 rounded text-[#8c7457] hover:text-[#c49d48] hover:bg-[#251910] transition"
                          title="Editar este atalho"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteShortcut(sc.id);
                          }}
                          className="p-1 rounded text-[#8c7457] hover:text-red-400 hover:bg-red-950/40 transition"
                          title="Excluir este atalho"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Linha Central: Fórmula */}
                    <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-300">
                      <Dices className="w-3 h-3 text-[#c49d48] flex-shrink-0" />
                      <span className="truncate">{sc.expression}</span>
                    </div>

                    {sc.damageExpression && (
                      <div className="flex items-center gap-1 font-mono text-[11px] text-red-300 font-semibold truncate">
                        <Flame className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="truncate">{sc.damageExpression}</span>
                      </div>
                    )}

                    {/* Botões Rápidos */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickRoll(sc.expression, `Ataque: ${sc.label}`);
                        }}
                        className="px-2 py-0.5 rounded bg-[#251910] hover:bg-[#382619] text-[#c49d48] border border-[#8c6b32]/60 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                        title="Rolar Teste de Ataque"
                      >
                        <Dices className="w-3 h-3 text-[#e8c679]" />
                        <span>Acertar</span>
                      </button>

                      {sc.damageExpression && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickRoll(sc.damageExpression!, `Dano: ${sc.label}`);
                          }}
                          className="px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700/60 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                          title="Rolar Dano"
                        >
                          <Flame className="w-3 h-3 text-red-400" />
                          <span>Dano</span>
                        </button>
                      )}
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {isAdv && (
                        <span className="text-[8px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                          {sc.advantageCount && sc.advantageCount > 1
                            ? `★ +${sc.advantageCount}d Vantagem`
                            : '★ Vantagem'}
                        </span>
                      )}
                      {isDis && (
                        <span className="text-[8px] bg-red-950/90 text-red-300 border border-red-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                          {sc.disadvantageCount && sc.disadvantageCount > 1
                            ? `⚠️ +${sc.disadvantageCount}d Desvantagem`
                            : '⚠️ Desvantagem'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Flutuante para Salvar Rolagem */}
      <EditRollShortcutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingShortcut={editingShortcut}
      />
    </div>
  );
};
