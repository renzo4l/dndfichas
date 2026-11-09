import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CharacterSheet,
  AbilityName,
  SkillProficiencyLevel,
} from '../../../types/dnd';
import {
  calculateAbilityModifier,
  calculateSkillBonus,
  calculateSavingThrowBonus,
  formatModifier,
  DEFAULT_5E_SKILLS,
} from '../../../utils/dndRules';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';
import { SkillRow } from './SkillRow';

export interface SkillsAndSavesSectionProps {
  character?: CharacterSheet;
  profBonus?: number;
  onQuickRoll?: (formula: string, label: string) => void;
  onSaveProficiencyToggle?: (ability: AbilityName) => void;
  onSaveCustomBonusChange?: (ability: AbilityName, customBonus: number) => void;
  onSkillProficiencyChange?: (skillId: string, level: SkillProficiencyLevel) => void;
  onSkillCustomBonusChange?: (skillId: string, customBonus: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SAVING_THROWS_CONFIG = [
  { key: 'str' as AbilityName, label: 'Força', pt: 'FOR' },
  { key: 'dex' as AbilityName, label: 'Destreza', pt: 'DES' },
  { key: 'con' as AbilityName, label: 'Constituição', pt: 'CON' },
  { key: 'int' as AbilityName, label: 'Inteligência', pt: 'INT' },
  { key: 'wis' as AbilityName, label: 'Sabedoria', pt: 'SAB' },
  { key: 'cha' as AbilityName, label: 'Carisma', pt: 'CAR' },
] as const;

const ABILITY_LABEL_PT: Record<AbilityName, string> = {
  str: 'FOR',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

const NEXT_PROFICIENCY_MAP: Record<SkillProficiencyLevel, SkillProficiencyLevel> = {
  none: 'proficient',
  proficient: 'expertise',
  expertise: 'half',
  half: 'none',
};

export const SkillsAndSavesSection: React.FC<SkillsAndSavesSectionProps> = (props) => {
  // Conecta ao contexto se disponível, permitindo também props diretas
  let ctx: ReturnType<typeof useCharacterSheet> | null = null;
  try {
    ctx = useCharacterSheet();
  } catch {
    ctx = null;
  }

  const character = props.character || ctx?.character;
  const profBonus = props.profBonus ?? ctx?.profBonus ?? 2;
  const onQuickRoll = props.onQuickRoll || ctx?.onQuickRoll;
  const onSaveProficiencyToggle =
    props.onSaveProficiencyToggle || ctx?.handleSaveProficiencyToggle;
  const onSaveCustomBonusChange =
    props.onSaveCustomBonusChange || ctx?.handleSaveCustomBonusChange;
  const onSkillProficiencyChange =
    props.onSkillProficiencyChange || ctx?.handleSkillProficiencyChange;
  const onSkillCustomBonusChange =
    props.onSkillCustomBonusChange || ctx?.handleSkillCustomBonusChange;
  const isCollapsed =
    props.isCollapsed ?? (ctx ? ctx.isCardCollapsed('pericias') : false);
  const onToggleCollapse =
    props.onToggleCollapse || (() => ctx?.handleToggleCategoryCollapse('pericias'));

  const [skillTabFilter, setSkillTabFilter] = useState<'all' | 'skills' | 'saves'>('all');
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');

  if (!character) return null;

  const getModByName = (ab: AbilityName) => {
    const score = character.abilities[ab]?.score || 10;
    return calculateAbilityModifier(score);
  };

  const handleRoll = (formula: string, label: string) => {
    if (onQuickRoll) {
      onQuickRoll(formula, label);
    }
  };

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-xl space-y-3 select-none sheet-card-optimized">
      {/* Cabeçalho do Card Central */}
      <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#e8c679]" />
          <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37]">
            Perícias &amp; Salvaguardas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-[#eedbc5] font-serif bg-[#24170e] border border-[#54412c] px-2 py-0.5 rounded-md">
            Prof: <strong className="text-amber-300 font-mono">+{profBonus}</strong>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
            title={isCollapsed ? 'Expandir perícias' : 'Reduzir perícias para economizar espaço'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-3 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[3000px] opacity-100'
        }`}
      >
        {/* Filtro Rápido e Busca */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-4">
          <div className="flex p-0.5 bg-[#120a06] border border-[#54412c] rounded-lg gap-0.5 text-[10px] font-serif font-bold shrink-0">
            <button
              type="button"
              onClick={() => setSkillTabFilter('all')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                skillTabFilter === 'all'
                  ? 'bg-[#c49d48] text-[#140d07] shadow-sm'
                  : 'text-[#8c7457] hover:text-[#eedbc5]'
              }`}
            >
              Todas (24)
            </button>
            <button
              type="button"
              onClick={() => setSkillTabFilter('skills')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                skillTabFilter === 'skills'
                  ? 'bg-[#c49d48] text-[#140d07] shadow-sm'
                  : 'text-[#8c7457] hover:text-[#eedbc5]'
              }`}
            >
              Perícias (18)
            </button>
            <button
              type="button"
              onClick={() => setSkillTabFilter('saves')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                skillTabFilter === 'saves'
                  ? 'bg-[#c49d48] text-[#140d07] shadow-sm'
                  : 'text-[#8c7457] hover:text-[#eedbc5]'
              }`}
            >
              Salvaguardas (6)
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar..."
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            className="flex-1 min-w-[140px] max-w-full bg-[#120a06] border border-[#54412c] rounded-lg px-2.5 py-1 text-[11px] text-[#eedbc5] placeholder-[#6d573f] focus:outline-none focus:border-[#c49d48]"
          />
        </div>

        {/* Tabela de Cabeçalho em CSS Grid */}
        <div className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-2 items-center w-full text-[10px] sm:text-xs uppercase font-serif font-bold text-[#8c7457] border-b border-[#54412c]/40 pb-1.5 select-none px-2">
          <span className="text-center">D20</span>
          <span className="text-center">MAESTRIA</span>
          <span className="truncate min-w-0">NOME (ATRIBUTO)</span>
          <span className="text-center">OUTROS</span>
          <span className="text-right">TOTAL</span>
        </div>

        {/* Lista Vertical Densa */}
        <div className="divide-y divide-[#54412c]/30 max-h-[620px] overflow-y-auto pr-1 space-y-0.5">
          {/* 1. SEÇÃO DE SALVAGUARDAS (6) */}
          {(skillTabFilter === 'all' || skillTabFilter === 'saves') && (
            <div className="space-y-0.5 pt-0.5">
              {skillTabFilter === 'all' && (
                <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase font-serif font-black text-[#c49d48] tracking-wider bg-[#18110b] border-y border-[#54412c]/40 flex items-center justify-between">
                  <span>Testes de Salvaguarda (6)</span>
                  <span className="text-[8px] font-mono text-[#8c7457]">D&amp;D 5E</span>
                </div>
              )}

              {SAVING_THROWS_CONFIG.filter(
                (sv) =>
                  !skillSearchQuery ||
                  sv.label.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                  sv.pt.toLowerCase().includes(skillSearchQuery.toLowerCase())
              ).map(({ key, label, pt }) => {
                const abilityData = character.abilities[key] || {
                  score: 10,
                  modifier: 0,
                  saveProficient: false,
                  saveCustomBonus: 0,
                };
                const mod = calculateAbilityModifier(abilityData.score);
                const isProf = abilityData.saveProficient;
                const customBonus = abilityData.saveCustomBonus || 0;
                const totalBonus = calculateSavingThrowBonus(
                  mod,
                  profBonus,
                  isProf,
                  customBonus
                );

                return (
                  <SkillRow
                    key={`save_row_${key}`}
                    id={key}
                    name={label}
                    attributeLabel={pt}
                    isSavingThrow={true}
                    isProficient={isProf}
                    customBonus={customBonus}
                    totalBonus={totalBonus}
                    rollTitle={`Rolar Salvaguarda de ${label} (1d20${formatModifier(totalBonus)})`}
                    onRoll={() =>
                      handleRoll(`1d20+${totalBonus}`, `${label} (${pt})`)
                    }
                    onProficiencyToggle={() =>
                      onSaveProficiencyToggle && onSaveProficiencyToggle(key)
                    }
                    onCustomBonusChange={(val) =>
                      onSaveCustomBonusChange && onSaveCustomBonusChange(key, val)
                    }
                  />
                );
              })}
            </div>
          )}

          {/* 2. SEÇÃO DE PERÍCIAS (18 D&D 5E) */}
          {(skillTabFilter === 'all' || skillTabFilter === 'skills') && (
            <div className="space-y-0.5 pt-1">
              {skillTabFilter === 'all' && (
                <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase font-serif font-black text-[#c49d48] tracking-wider bg-[#18110b] border-y border-[#54412c]/40 flex items-center justify-between">
                  <span>Perícias</span>
                </div>
              )}

              {DEFAULT_5E_SKILLS.filter(
                (sk) =>
                  !skillSearchQuery ||
                  sk.namePt.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                  sk.ability.toLowerCase().includes(skillSearchQuery.toLowerCase())
              ).map((sk) => {
                const currentSkill = character.skills[sk.id] || {
                  name: sk.name,
                  namePt: sk.namePt,
                  ability: sk.ability,
                  proficiency: 'none',
                  customBonus: 0,
                };
                const abilityMod = getModByName(sk.ability);
                const customBonus = currentSkill.customBonus || 0;
                const totalBonus = calculateSkillBonus(
                  abilityMod,
                  profBonus,
                  currentSkill.proficiency,
                  customBonus
                );

                return (
                  <SkillRow
                    key={sk.id}
                    id={sk.id}
                    name={sk.namePt}
                    attributeLabel={ABILITY_LABEL_PT[sk.ability]}
                    isSavingThrow={false}
                    proficiencyLevel={currentSkill.proficiency}
                    customBonus={customBonus}
                    totalBonus={totalBonus}
                    rollTitle={`Rolar teste de ${sk.namePt} (1d20${formatModifier(totalBonus)})`}
                    onRoll={() =>
                      handleRoll(
                        `1d20+${totalBonus}`,
                        `Perícia: ${sk.namePt} (${ABILITY_LABEL_PT[sk.ability]})`
                      )
                    }
                    onProficiencyToggle={() => {
                      if (onSkillProficiencyChange) {
                        const nextLevel =
                          NEXT_PROFICIENCY_MAP[currentSkill.proficiency] || 'none';
                        onSkillProficiencyChange(sk.id, nextLevel);
                      }
                    }}
                    onCustomBonusChange={(val) => {
                      if (onSkillCustomBonusChange) {
                        onSkillCustomBonusChange(sk.id, val);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
