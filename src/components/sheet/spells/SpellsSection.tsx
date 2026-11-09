import React, { useState } from 'react';
import { BookOpen, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterSheet, AbilityName, Spell } from '../../../types/dnd';
import {
  calculateAbilityModifier,
  calculateSpellSaveDc,
  calculateSpellAttackBonus,
  formatModifier,
} from '../../../utils/dndRules';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';
import { SpellCard } from './SpellCard';

export interface SpellsSectionProps {
  character?: CharacterSheet;
  profBonus?: number;
  onUpdateCharacter?: (updated: CharacterSheet) => void;
  onQuickRoll?: (expression: string, label: string) => void;
  onOpenCreateSpellModal?: () => void;
  onOpenEditSpellModal?: (spell: Spell) => void;
  onToggleSpellPrepared?: (id: string) => void;
  onDeleteSpell?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ABILITY_LABEL_MAP: Record<AbilityName, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
};

const SPELL_LEVEL_TABS = [
  { id: 'all', label: 'Todas' },
  { id: '0', label: 'Truques' },
  { id: '1', label: '1º' },
  { id: '2', label: '2º' },
  { id: '3', label: '3º' },
  { id: '4', label: '4º' },
  { id: '5', label: '5º' },
  { id: '6', label: '6º' },
  { id: '7', label: '7º' },
  { id: '8', label: '8º' },
  { id: '9', label: '9º' },
  { id: 'prepared', label: 'Preparadas' },
];

export const SpellsSection: React.FC<SpellsSectionProps> = (props) => {
  let ctx: ReturnType<typeof useCharacterSheet> | null = null;
  try {
    ctx = useCharacterSheet();
  } catch {
    ctx = null;
  }

  const character = props.character || ctx?.character;
  const profBonus = props.profBonus ?? ctx?.profBonus ?? 2;
  const onUpdateCharacter = props.onUpdateCharacter || ctx?.onUpdateCharacter;
  const onQuickRoll = props.onQuickRoll || ctx?.onQuickRoll;
  const onOpenCreateSpellModal =
    props.onOpenCreateSpellModal || ctx?.handleOpenCreateSpellModal;
  const onOpenEditSpellModal =
    props.onOpenEditSpellModal || ctx?.handleOpenEditSpellModal;
  const onToggleSpellPrepared =
    props.onToggleSpellPrepared || ctx?.handleToggleSpellPrepared;
  const onDeleteSpell = props.onDeleteSpell || ctx?.handleDeleteSpell;
  const isCollapsed =
    props.isCollapsed ?? (ctx ? ctx.isCardCollapsed('magias') : false);
  const onToggleCollapse =
    props.onToggleCollapse || (() => ctx?.handleToggleCategoryCollapse('magias'));

  const [spellSearchQuery, setSpellSearchQuery] = useState<string>('');
  const [spellLevelFilter, setSpellLevelFilter] = useState<string>('all');
  const [collapsedSpellIds, setCollapsedSpellIds] = useState<Record<string, boolean>>({});

  if (!character) return null;

  const spellcastingAbilityKey = character.spellcastingAbility || 'int';
  const spellAbilityScore = character.abilities[spellcastingAbilityKey]?.score || 10;
  const spellAbilityMod = calculateAbilityModifier(spellAbilityScore);
  const spellDcVal =
    calculateSpellSaveDc(profBonus, spellAbilityMod) + (character.spellSaveDcBonus || 0);
  const spellAttackVal =
    calculateSpellAttackBonus(profBonus, spellAbilityMod) +
    (character.spellAttackBonus || 0);

  const allSpells = character.spells || [];
  const preparedSpellsCount = allSpells.filter((s) => s.prepared).length;

  const filteredSpells = allSpells.filter((sp) => {
    if (spellLevelFilter === 'prepared' && !sp.prepared) return false;
    if (spellLevelFilter !== 'all' && spellLevelFilter !== 'prepared') {
      const targetLvl = parseInt(spellLevelFilter, 10);
      if (sp.level !== targetLvl) return false;
    }
    if (spellSearchQuery.trim()) {
      const query = spellSearchQuery.toLowerCase();
      const nameMatch = sp.name.toLowerCase().includes(query);
      const schoolMatch = (sp.school || '').toLowerCase().includes(query);
      const descMatch = (sp.description || '').toLowerCase().includes(query);
      const formula = sp.damageFormula || (sp as any).damageFormula || '';
      const formulaMatch = formula.toLowerCase().includes(query);
      if (!nameMatch && !schoolMatch && !descMatch && !formulaMatch) return false;
    }
    return true;
  });

  const handleAbilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        spellcastingAbility: e.target.value as AbilityName,
      });
    }
  };

  const handleToggleCollapseSpell = (id: string) => {
    setCollapsedSpellIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? false),
    }));
  };

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-xl space-y-3 select-none sheet-card-optimized">
      {/* Cabeçalho do Card de Magias */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-[#54412c]/60 pb-2.5">
        {/* Lado Esquerdo: Título, Contador e + Nova Magia agrupados */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 mr-1">
            <BookOpen className="w-4 h-4 text-[#e8c679] shrink-0" />
            <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
              Magias &amp; Grimório DE CONJURAÇÃO
            </span>
          </div>

          <span className="relative inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold text-[0.7rem] whitespace-nowrap shrink-0">
            {allSpells.length} magia(s)
          </span>

          {onOpenCreateSpellModal && (
            <button
              type="button"
              onClick={onOpenCreateSpellModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[0.75rem] rounded-lg shadow transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> + Nova Magia
            </button>
          )}
        </div>

        {/* Lado Direito: Apenas o botão da Seta */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer flex items-center justify-center shrink-0 self-start"
          title={isCollapsed ? 'Expandir card de magias' : 'Reduzir card de magias para economizar espaço'}
        >
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
          )}
        </button>
      </div>

      <div
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-4 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[6000px] opacity-100'
        }`}
      >
        <div className="grid grid-cols-3 gap-2">
          {/* Atributo de Conjuração */}
          <div className="bg-[#120a06] border border-[#54412c] rounded-lg p-2 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-[0.7rem] uppercase font-bold text-[#8c7457] font-serif leading-[1.2] text-center w-full">
              <span className="whitespace-normal leading-[1.2]">Atributo Conjurar</span>
              <span className="text-[#e8c679] font-mono flex-shrink-0 ml-1">
                {formatModifier(spellAbilityMod)}
              </span>
            </div>
            <select
              value={spellcastingAbilityKey}
              onChange={handleAbilityChange}
              className="mt-1 text-xs font-serif font-bold text-amber-200 bg-[#1a120b] border border-[#54412c] rounded p-1 focus:border-[#c49d48] focus:outline-none cursor-pointer w-full box-border"
            >
              <option value="int">INT (Mago / Artífice)</option>
              <option value="wis">SAB (Clérigo / Druida / Ranger)</option>
              <option value="cha">CAR (Bardo / Bruxo / Feiticeiro / Paladino)</option>
              <option value="str">FOR (Força)</option>
              <option value="dex">DES (Destreza)</option>
              <option value="con">CON (Constituição)</option>
            </select>
          </div>

          {/* CD de Salvaguarda */}
          <div className="bg-[#120a06] border border-[#54412c] rounded-lg p-2 text-center min-w-0 flex flex-col justify-between">
            <span className="text-[0.7rem] uppercase font-bold text-[#8c7457] font-serif block whitespace-normal leading-[1.2] text-center">
              CD de Salvaguarda
            </span>
            <span className="text-xl font-serif font-black text-amber-300 block my-0.5">
              {spellDcVal}
            </span>
            <span
              className="text-[9px] text-[#8c7457] font-mono block truncate"
              title={`8 + ${profBonus} (Prof) ${
                spellAbilityMod >= 0 ? `+ ${spellAbilityMod}` : spellAbilityMod
              } (${ABILITY_LABEL_MAP[spellcastingAbilityKey].substring(0, 3).toUpperCase()}) ${
                character.spellSaveDcBonus
                  ? character.spellSaveDcBonus > 0
                    ? `+ ${character.spellSaveDcBonus}`
                    : character.spellSaveDcBonus
                  : ''
              }`}
            >
              8 + {profBonus} (Prof){' '}
              {spellAbilityMod >= 0 ? `+ ${spellAbilityMod}` : spellAbilityMod} (
              {ABILITY_LABEL_MAP[spellcastingAbilityKey].substring(0, 3).toUpperCase()}){' '}
              {character.spellSaveDcBonus
                ? character.spellSaveDcBonus > 0
                  ? `+ ${character.spellSaveDcBonus}`
                  : character.spellSaveDcBonus
                : ''}
            </span>
          </div>

          {/* Ataque Mágico & Preparadas */}
          <div className="bg-[#120a06] border border-[#54412c] rounded-lg p-2 text-center flex flex-col justify-between min-w-0">
            <div>
              <span className="text-[0.7rem] uppercase font-bold text-[#8c7457] font-serif block whitespace-normal leading-[1.2] text-center">
                Bônus de Ataque Mágico
              </span>
              <span className="text-xl font-serif font-black text-emerald-300 block my-0.5">
                {formatModifier(spellAttackVal)}
              </span>
            </div>
            <div className="pt-1 border-t border-[#3d2a1b]/60 flex items-center justify-between text-[10px] text-[#eedbc5] font-serif">
              <span>Preparadas:</span>
              <strong className="text-amber-200">{preparedSpellsCount}</strong>
            </div>
          </div>
        </div>

        {/* FILTROS DE NÍVEL E BUSCA RESPONSIVA */}
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={spellSearchQuery}
              onChange={(e) => setSpellSearchQuery(e.target.value)}
              placeholder="Buscar magia por nome, escola ou fórmula..."
              className="w-full text-xs text-[#eedbc5] bg-[#140e09] border border-[#54412c] rounded-lg px-2.5 py-1.5 focus:border-[#c49d48] focus:outline-none font-serif placeholder:text-[#8c7457]/70"
            />
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#54412c] max-w-full">
              {SPELL_LEVEL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSpellLevelFilter(tab.id)}
                  className={`px-2 py-1 rounded text-[11px] font-serif font-bold transition whitespace-nowrap cursor-pointer flex-shrink-0 ${
                    spellLevelFilter === tab.id
                      ? 'bg-[#c49d48] text-[#140d07]'
                      : 'bg-[#140e09] text-[#8c7457] hover:text-[#eedbc5] border border-[#54412c]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LISTA DE MAGIAS */}
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredSpells.length === 0 ? (
            <div className="bg-[#140e09] border border-dashed border-[#54412c] rounded-xl p-6 text-center space-y-2">
              <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                {allSpells.length === 0
                  ? 'Nenhum feitiço ou ritual preparado. Clique em "+ Nova Magia".'
                  : 'Nenhuma magia encontrada com os filtros selecionados.'}
              </p>
            </div>
          ) : (
            filteredSpells.map((sp) => (
              <SpellCard
                key={sp.id}
                spell={sp}
                isCollapsed={collapsedSpellIds[sp.id] ?? false}
                onToggleCollapse={() => handleToggleCollapseSpell(sp.id)}
                onTogglePrepared={() =>
                  onToggleSpellPrepared && onToggleSpellPrepared(sp.id)
                }
                onQuickRoll={onQuickRoll}
                onEdit={() => onOpenEditSpellModal && onOpenEditSpellModal(sp)}
                onDelete={() => onDeleteSpell && onDeleteSpell(sp.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
