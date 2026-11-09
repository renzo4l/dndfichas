import React, { useState } from 'react';
import {
  Swords,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Dices,
  Flame,
} from 'lucide-react';
import { WeaponAttack, CharacterSheet, SavedRollShortcut } from '../../../types/dnd';
import { formatModifier } from '../../../utils/dndRules';
import { getSavedRollShortcuts, saveRollShortcuts } from '../../../services/storage';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';
import { CreateEditAttackModal } from '../modals/CreateEditAttackModal';

export interface CombatSectionProps {
  character?: CharacterSheet;
  profBonus?: number;
  onUpdateCharacter?: (character: CharacterSheet) => void;
  onQuickRoll?: (expression: string, label: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onShortcutsChanged?: (shortcuts: SavedRollShortcut[]) => void;
}

export const buildAttackTestFormula = (atk: WeaponAttack): string => {
  const sign = (atk.attackBonus ?? 0) >= 0 ? `+${atk.attackBonus ?? 0}` : `${atk.attackBonus ?? 0}`;
  let flag = '';
  if (atk.advantageLevel && atk.advantageLevel > 0) {
    flag = ` [${atk.advantageLevel > 1 ? `${atk.advantageLevel} Vantagens` : 'Vantagem'}]`;
  } else if (atk.advantageLevel && atk.advantageLevel < 0) {
    const dis = Math.abs(atk.advantageLevel);
    flag = ` [${dis > 1 ? `${dis} Desvantagens` : 'Desvantagem'}]`;
  }
  return `1d20${sign}${flag}`;
};

export const buildAttackDamageFormula = (atk: WeaponAttack): string => {
  let base = atk.damage || '1d4';
  if (atk.fixedBonus && !base.includes('+') && !base.includes('-')) {
    base = `${base}${atk.fixedBonus >= 0 ? `+${atk.fixedBonus}` : `${atk.fixedBonus}`}`;
  }
  const baseType = atk.damageType || 'Balístico';
  let expr = `${base} [${baseType}]`;
  if (atk.extraDamage && atk.extraDamage.length > 0) {
    atk.extraDamage.forEach((extra) => {
      if (extra.damage && extra.damage.trim()) {
        expr += ` + ${extra.damage.trim()} [${extra.damageType || 'Extra'}]`;
      }
    });
  }
  return expr;
};

export const CombatSection: React.FC<CombatSectionProps> = ({
  character: propChar,
  profBonus: propProf,
  onUpdateCharacter: propUpdate,
  onQuickRoll: propRoll,
  isCollapsed: propCollapsed,
  onToggleCollapse: propToggleCollapse,
  onShortcutsChanged,
}) => {
  let ctx: ReturnType<typeof useCharacterSheet> | null = null;
  try {
    ctx = useCharacterSheet();
  } catch {
    ctx = null;
  }

  const character = propChar || ctx?.character;
  const profBonus = propProf ?? ctx?.profBonus ?? 2;
  const onUpdateCharacter = propUpdate || ctx?.onUpdateCharacter;
  const onQuickRoll = propRoll || ctx?.onQuickRoll;
  const isCollapsed = propCollapsed ?? ctx?.isCardCollapsed('combate') ?? false;
  const onToggleCollapse = propToggleCollapse || (() => ctx?.handleToggleCategoryCollapse('combate'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttack, setEditingAttack] = useState<WeaponAttack | null>(null);

  if (!character || !onUpdateCharacter || !onQuickRoll) {
    return null;
  }

  const handleOpenCreateModal = () => {
    setEditingAttack(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (atk: WeaponAttack) => {
    setEditingAttack(atk);
    setIsModalOpen(true);
  };

  const handleDeleteAttack = (id: string) => {
    const updated = character.attacks.filter((a) => a.id !== id);
    onUpdateCharacter({
      ...character,
      attacks: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveAttack = (attackData: WeaponAttack, saveAsShortcut?: boolean) => {
    let updatedAttacks: WeaponAttack[];
    const exists = character.attacks.some((a) => a.id === attackData.id);

    if (exists) {
      updatedAttacks = character.attacks.map((a) => (a.id === attackData.id ? attackData : a));
    } else {
      updatedAttacks = [...character.attacks, attackData];
    }

    onUpdateCharacter({
      ...character,
      attacks: updatedAttacks,
      updatedAt: new Date().toISOString(),
    });

    if (saveAsShortcut) {
      try {
        const currentShortcuts = getSavedRollShortcuts();
        const attackTestFormula = buildAttackTestFormula(attackData);
        const attackDmgFormula = buildAttackDamageFormula(attackData);
        const advType =
          (attackData.advantageLevel || 0) > 0
            ? 'advantage'
            : (attackData.advantageLevel || 0) < 0
            ? 'disadvantage'
            : 'normal';

        const newShortcut: SavedRollShortcut = {
          id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          label: attackData.name,
          expression: attackTestFormula,
          damageExpression: attackDmgFormula,
          advantageType: advType,
          advantageCount:
            (attackData.advantageLevel || 0) > 0 ? attackData.advantageLevel : 0,
          disadvantageCount:
            (attackData.advantageLevel || 0) < 0
              ? Math.abs(attackData.advantageLevel || 0)
              : 0,
          bonus: attackData.attackBonus,
          fixedBonus: attackData.fixedBonus,
          critical: attackData.critical,
          multiplier: attackData.multiplier,
          damageType: attackData.damageType,
          extraDamages: attackData.extraDamage,
          range: attackData.range,
          skill: attackData.skill,
          damageAbility: attackData.damageAbility,
        };

        const updatedShortcuts = [
          ...currentShortcuts.filter(
            (s) =>
              s.label !== attackData.name &&
              s.label !== `${attackData.name} (Ataque)`
          ),
          newShortcut,
        ];

        saveRollShortcuts(updatedShortcuts);
        if (onShortcutsChanged) {
          onShortcutsChanged(updatedShortcuts);
        }
      } catch (err) {
        console.error('Erro ao salvar atalho de combate:', err);
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none sheet-card-optimized">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-[#54412c]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-[#e8c679] flex-shrink-0" />
          <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
            Combate &amp; Ataques DE ARMA
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold text-[0.7rem] whitespace-nowrap min-w-fit">
            {character.attacks.length} ataque(s)
          </span>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[0.75rem] rounded-lg shadow transition cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> + Novo Ataque
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer flex items-center justify-center flex-shrink-0"
            title={
              isCollapsed
                ? 'Expandir card de combate'
                : 'Reduzir card de combate para economizar espaço'
            }
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      <div
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-3 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[3500px] opacity-100'
        }`}
      >
        {character.attacks.length === 0 ? (
          <div className="text-center py-6 px-4 bg-[#140d08] border border-dashed border-[#54412c] rounded-xl space-y-2">
            <Swords className="w-6 h-6 text-[#8c7457] mx-auto opacity-60" />
            <p className="font-serif font-bold text-xs text-[#eedbc5]">
              Nenhum ataque ou arma configurada.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg shadow-md border border-[#e8c679]/40 transition active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Ataque / Ação</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {character.attacks.map((atk, idx) => {
              const attackTestFormula = buildAttackTestFormula(atk);
              const attackDmgFormula = buildAttackDamageFormula(atk);

              return (
                <div
                  key={atk.id}
                  className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2 relative hover:border-[#8c6b32] transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={atk.name}
                        onChange={(e) => {
                          const newAttacks = [...character.attacks];
                          newAttacks[idx].name = e.target.value;
                          onUpdateCharacter({ ...character, attacks: newAttacks });
                        }}
                        className="font-serif font-bold text-amber-200 text-sm bg-transparent border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none w-full"
                        placeholder="Nome da Arma ou Ataque"
                      />
                      {atk.critical && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#251910] text-[#e8c679] border border-[#8c6b32]/60 font-mono flex-shrink-0">
                          Crit: {atk.critical} (x{atk.multiplier || 2})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(atk)}
                        className="text-[#c49d48] hover:text-[#f4ecd8] hover:bg-[#2c1d12] p-1.5 rounded transition cursor-pointer"
                        title="Editar ataque"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttack(atk.id)}
                        className="text-stone-500 hover:text-red-400 p-1.5 rounded transition cursor-pointer"
                        title="Remover ataque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-[#8c7457] font-serif block mb-0.5">
                        Bônus de Ataque
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={atk.attackBonus}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                            const parsed = parseInt(clean, 10);
                            const newAttacks = [...character.attacks];
                            newAttacks[idx].attackBonus = isNaN(parsed) ? 0 : parsed;
                            onUpdateCharacter({ ...character, attacks: newAttacks });
                          }}
                          className="w-16 min-w-[4rem] bg-[#1b120b] border border-[#54412c] rounded px-1.5 py-1 text-amber-300 font-bold focus:outline-none text-center"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onQuickRoll(attackTestFormula, `Ataque com ${atk.name}`)
                          }
                          className="px-2.5 py-1 bg-[#2a1c12] hover:bg-[#382619] text-[#c49d48] border border-[#8c6b32]/60 rounded font-bold text-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          title={`Rolar Ataque (${attackTestFormula})`}
                        >
                          <Dices className="w-3 h-3 text-[#e8c679]" />
                          <span>Acertar</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8c7457] font-serif block mb-0.5">
                        Dano / Tipo
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={atk.damage}
                          onChange={(e) => {
                            const newAttacks = [...character.attacks];
                            newAttacks[idx].damage = e.target.value;
                            onUpdateCharacter({ ...character, attacks: newAttacks });
                          }}
                          placeholder="ex: 1d8+3"
                          className="w-20 bg-[#1b120b] border border-[#54412c] rounded px-1.5 py-1 text-white font-mono text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onQuickRoll(attackDmgFormula, `Dano de ${atk.name}`)
                          }
                          className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 rounded font-bold text-xs border border-red-800/60 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          title={`Rolar Dano (${attackDmgFormula})`}
                        >
                          <Flame className="w-3 h-3 text-red-400" />
                          <span>Dano</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {atk.damageType && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2b180d] border border-[#7a572a] text-[#f4ecd8] font-mono">
                        {atk.damageType}
                      </span>
                    )}
                    {atk.fixedBonus !== undefined && atk.fixedBonus !== 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#251910] border border-[#8c6b32]/60 text-amber-300 font-mono font-bold">
                        Fixo: {formatModifier(atk.fixedBonus)}
                      </span>
                    )}
                    {atk.advantageLevel && atk.advantageLevel > 0 ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold uppercase">
                        ★ +{atk.advantageLevel}d Vantagem
                      </span>
                    ) : null}
                    {atk.advantageLevel && atk.advantageLevel < 0 ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-600 font-bold uppercase">
                        ⚠️ +{Math.abs(atk.advantageLevel)}d Desvantagem
                      </span>
                    ) : null}
                    {atk.extraDamage &&
                      atk.extraDamage.map((ed) => (
                        <span
                          key={ed.id}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-[#24170e] border border-amber-700/60 text-amber-200 font-mono"
                        >
                          +{ed.damage} {ed.damageType}
                        </span>
                      ))}
                    {atk.range && atk.range !== '-' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e140d] border border-[#54412c] text-[#8c7457] font-sans">
                        {atk.range}
                      </span>
                    )}
                  </div>

                  {atk.notes !== undefined && (
                    <input
                      type="text"
                      value={atk.notes || ''}
                      placeholder="Propriedades / Alcance / Efeitos (ex: Versátil, Alcance 18m...)"
                      onChange={(e) => {
                        const newAttacks = [...character.attacks];
                        newAttacks[idx].notes = e.target.value;
                        onUpdateCharacter({ ...character, attacks: newAttacks });
                      }}
                      className="w-full text-[11px] text-[#eedbc5] bg-transparent border-t border-[#54412c]/60 pt-1 focus:outline-none placeholder-[#6d573f]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Flutuante Archdice */}
      <CreateEditAttackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAttack}
        editingAttack={editingAttack}
        onQuickRoll={onQuickRoll}
        character={character}
        profBonus={profBonus}
      />
    </div>
  );
};
