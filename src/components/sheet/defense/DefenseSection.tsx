import React from 'react';
import {
  Shield,
  Zap,
  Footprints,
  Sparkles,
  Eye,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CharacterSheet, AbilityName } from '../../../types/dnd';
import {
  formatModifier,
  calculatePassivePerception,
  calculateSpellSaveDc,
  calculateSpellAttackBonus,
} from '../../../utils/dndRules';

export interface DefenseSectionProps {
  character: CharacterSheet;
  dexMod: number;
  profBonus: number;
  totalLevel: number;
  totalInitiative: number;
  initiativeBonus: number;
  speedInMeters: number;
  speedInSquares: number;
  spellAbility: AbilityName;
  spellMod: number;
  onUpdateCharacter: (character: CharacterSheet) => void;
  onQuickRoll: (expression: string, label: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DefenseSection: React.FC<DefenseSectionProps> = ({
  character,
  dexMod,
  profBonus,
  totalLevel,
  totalInitiative,
  initiativeBonus,
  speedInMeters,
  speedInSquares,
  spellAbility,
  spellMod,
  onUpdateCharacter,
  onQuickRoll,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const perceptionSkill = character.skills?.perception;
  const isPerceptionProf =
    perceptionSkill?.proficiency === 'proficient' ||
    perceptionSkill?.proficiency === 'expertise';
  const autoPassivePerception =
    calculatePassivePerception(
      character.abilities.wis?.modifier || 0,
      profBonus,
      isPerceptionProf
    ) + (character.passivePerceptionBonus || 0);

  const spellSaveDc =
    calculateSpellSaveDc(profBonus, spellMod) + (character.spellSaveDcBonus || 0);
  const spellAttackBonus =
    calculateSpellAttackBonus(profBonus, spellMod) +
    (character.spellAttackCustomBonus || 0);

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl select-none sheet-card-optimized">
      <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-3">
        <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Defesa &amp; Movimento</span>
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
            title={
              isCollapsed
                ? 'Expandir defesa'
                : 'Reduzir defesa para economizar espaço'
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
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-4 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[1600px] opacity-100'
        }`}
      >
        {/* Escudo Ornamental Estilizado de CA */}
        <div className="flex items-center gap-3.5 bg-[#140e09] border border-[#54412c] rounded-xl p-3 shadow-inner">
          <div className="relative w-16 h-18 sm:w-18 sm:h-20 flex-shrink-0 flex items-center justify-center select-none">
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            >
              <path
                d="M 50,5 Q 85,10 95,28 Q 95,80 50,115 Q 5,80 5,28 Q 15,10 50,5 Z"
                fill="#1e140d"
                stroke="#8c6b32"
                strokeWidth="4"
              />
              <path
                d="M 50,13 Q 78,17 87,32 Q 87,74 50,105 Q 13,74 13,32 Q 22,17 50,13 Z"
                fill="#261a12"
                stroke="#d4af37"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <input
                type="text"
                inputMode="numeric"
                value={character.armorClass}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  const newTotal = clean === '' ? 0 : parseInt(clean, 10);
                  const otherVal = character.armorClassOther || 0;
                  const newEquip = Math.max(0, newTotal - 10 - dexMod - otherVal);
                  onUpdateCharacter({
                    ...character,
                    armorClass: newTotal,
                    armorClassEquip: newEquip,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="text-2xl sm:text-3xl font-serif font-black text-[#f5ebd7] hover:text-[#d4af37] w-16 min-w-[4rem] text-center bg-transparent focus:outline-none leading-none drop-shadow cursor-pointer"
                title="Classe de Armadura Total. Clique para editar diretamente"
              />
              <span className="text-[8px] uppercase font-serif font-black text-[#c49d48] tracking-widest mt-0.5">
                CA
              </span>
            </div>
          </div>

          {/* Título e Fórmula de Defesa */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-serif font-black text-[#f4ecd8] tracking-wider uppercase">
                Classe de Armadura
              </h4>
            </div>

            <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1 font-mono text-xs text-[#a88a56]">
              <span className="font-bold text-[#c49d48] pb-1">=</span>
              <div className="flex flex-col items-center min-w-[20px]">
                <span className="font-bold text-[#eedbc5] text-sm pb-0.5">10</span>
                <span className="text-[8px] font-serif text-[#6e5840] uppercase">
                  Base
                </span>
              </div>
              <span className="font-bold text-[#8c7457] pb-1">+</span>
              <div className="flex flex-col items-center min-w-[32px]">
                <span className="font-bold text-amber-200 text-sm pb-0.5">
                  {formatModifier(dexMod)}
                </span>
                <span className="text-[8px] font-serif text-[#6e5840] uppercase">
                  DES
                </span>
              </div>
              <span className="font-bold text-[#8c7457] pb-1">+</span>
              <div className="flex flex-col items-center min-w-[36px]">
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    character.armorClassEquip !== undefined
                      ? character.armorClassEquip
                      : Math.max(
                          0,
                          character.armorClass -
                            10 -
                            dexMod -
                            (character.armorClassOther || 0)
                        )
                  }
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                    const parsed = clean === '' ? 0 : parseInt(clean, 10);
                    const equipVal = isNaN(parsed) ? 0 : parsed;
                    const otherVal = character.armorClassOther || 0;
                    const newTotal = 10 + dexMod + equipVal + otherVal;
                    onUpdateCharacter({
                      ...character,
                      armorClassEquip: equipVal,
                      armorClass: newTotal,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="w-10 text-center font-bold text-amber-300 text-sm bg-transparent border-b-2 border-[#8c6b32] focus:border-[#d4af37] focus:outline-none pb-0.5"
                  title="Bônus de Equipamento / Armadura"
                />
                <span className="text-[9px] font-serif font-bold text-[#8c7457] uppercase tracking-wide mt-0.5">
                  Equip.
                </span>
              </div>
              <span className="font-bold text-[#8c7457] pb-1">+</span>
              <div className="flex flex-col items-center min-w-[36px]">
                <input
                  type="text"
                  inputMode="numeric"
                  value={character.armorClassOther || 0}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                    const parsed = clean === '' ? 0 : parseInt(clean, 10);
                    const otherVal = isNaN(parsed) ? 0 : parsed;
                    const equipVal =
                      character.armorClassEquip !== undefined
                        ? character.armorClassEquip
                        : Math.max(0, character.armorClass - 10 - dexMod);
                    const newTotal = 10 + dexMod + equipVal + otherVal;
                    onUpdateCharacter({
                      ...character,
                      armorClassOther: otherVal,
                      armorClass: newTotal,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="w-10 text-center font-bold text-amber-300 text-sm bg-transparent border-b-2 border-[#8c6b32] focus:border-[#d4af37] focus:outline-none pb-0.5"
                  title="Outros bônus (Escudo, magias, itens mágicos)"
                />
                <span className="text-[9px] font-serif font-bold text-[#8c7457] uppercase tracking-wide mt-0.5">
                  Outros.
                </span>
              </div>
            </div>

            <input
              type="text"
              value={character.armorClassType || ''}
              onChange={(e) =>
                onUpdateCharacter({
                  ...character,
                  armorClassType: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Nome do Equipamento (ex: Cota de Malha, Escudo...)"
              className="w-full bg-[#1e140d]/80 border border-[#54412c]/60 focus:border-[#c49d48] rounded px-2 py-0.5 text-[11px] font-serif text-[#eedbc5] placeholder-[#6e5840] focus:outline-none"
              title="Nome da Armadura ou Equipamento"
            />
          </div>
        </div>

        {/* Indicadores Complementares */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          {/* Iniciativa */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
              <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              <span className="truncate">Iniciativa</span>
            </div>

            <button
              type="button"
              onClick={() =>
                onQuickRoll(
                  `1d20${formatModifier(totalInitiative)}`,
                  `Iniciativa de ${character.characterName}`
                )
              }
              className="text-xl sm:text-2xl font-serif font-black text-amber-200 hover:text-amber-400 transition cursor-pointer my-0.5 truncate max-w-full"
              title={`Clique para rolar Iniciativa (1d20${formatModifier(totalInitiative)})`}
            >
              {formatModifier(totalInitiative)}
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#8c7457] max-w-full">
              <span className="flex-shrink-0">Bônus:</span>
              <input
                type="text"
                inputMode="numeric"
                value={character.initiativeBonus || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                  const parsed = parseInt(clean, 10);
                  onUpdateCharacter({
                    ...character,
                    initiativeBonus: isNaN(parsed) ? 0 : parsed,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#54412c] focus:border-[#c49d48] rounded px-1 text-center text-amber-300 font-bold focus:outline-none"
                title="Bônus adicional para Iniciativa"
              />
            </div>
          </div>

          {/* Deslocamento */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
              <Footprints className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">Deslocamento</span>
            </div>

            <div className="flex items-center justify-center gap-1 max-w-full">
              <input
                type="text"
                inputMode="numeric"
                value={speedInMeters}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9.]/g, '');
                  const val = clean === '' ? 0 : Math.max(0, parseFloat(clean) || 0);
                  onUpdateCharacter({
                    ...character,
                    speed: val,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="text-xl sm:text-2xl font-serif font-black text-emerald-300 w-16 min-w-[4rem] px-1 text-center bg-transparent focus:outline-none"
                title="Deslocamento em metros. Clique para editar"
              />
              <span className="text-xs font-serif font-bold text-emerald-400 flex-shrink-0">
                m
              </span>
            </div>

            <div className="flex items-center justify-center gap-1 text-[9px] text-[#8c7457] font-serif truncate max-w-full">
              <span className="font-bold text-emerald-200">{speedInSquares} q</span>
              <span>(1,5m = 1q)</span>
            </div>
          </div>

          {/* Proficiência */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">Proficiência</span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black text-amber-400 my-0.5 truncate max-w-full">
              +{profBonus}
            </div>
            <span className="text-[9px] text-[#8c7457] font-serif truncate max-w-full">
              Nível Total {totalLevel}
            </span>
          </div>

          {/* Percepção Passiva */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
              <Eye className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <span className="truncate">Percepção Pass.</span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black text-amber-200 my-0.5 truncate max-w-full">
              {autoPassivePerception}
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#8c7457] max-w-full">
              <span className="flex-shrink-0">Bônus:</span>
              <input
                type="text"
                inputMode="numeric"
                value={character.passivePerceptionBonus || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                  const parsed = parseInt(clean, 10);
                  onUpdateCharacter({
                    ...character,
                    passivePerceptionBonus: isNaN(parsed) ? 0 : parsed,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#54412c] focus:border-[#c49d48] rounded px-1 text-center text-amber-300 font-bold focus:outline-none"
                title="Bônus adicional para Percepção Passiva"
              />
            </div>
          </div>
        </div>

        {/* Salvaguarda de Magia & Ataque Mágico */}
        <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 shadow-sm space-y-2 w-full max-w-full overflow-hidden">
          <div className="flex flex-row items-center gap-3 w-full flex-wrap sm:flex-nowrap justify-between border-b border-[#54412c]/50 pb-2">
            <div className="flex items-center gap-1.5 text-xs uppercase font-serif font-black text-[#d4af37] min-w-0">
              <Crown className="w-4 h-4 text-[#e8c679] flex-shrink-0" />
              <span className="truncate">Salvaguarda &amp; Magia</span>
            </div>

            <div className="flex flex-row items-center gap-3 w-full sm:w-auto text-[10px] font-serif text-[#eedbc5]">
              <span className="text-[#8c7457] font-bold uppercase tracking-wider flex-shrink-0">
                CHAVE:
              </span>
              <select
                value={spellAbility}
                onChange={(e) =>
                  onUpdateCharacter({
                    ...character,
                    spellcastingAbility: e.target.value as AbilityName,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="bg-[#1e140d] border border-[#54412c] text-[10px] text-amber-200 rounded px-2 py-1 focus:outline-none focus:border-[#c49d48] font-serif font-bold flex-1 sm:flex-none cursor-pointer"
                title="Habilidade Chave de Conjuração"
              >
                <option value="int">INT (Mago / Artífice)</option>
                <option value="wis">SAB (Clérigo / Druida)</option>
                <option value="cha">CAR (Bardo / Bruxo / Feit)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-0.5 w-full max-w-full overflow-hidden">
            <div className="bg-[#1c130c] border border-[#54412c] rounded-lg p-2 flex flex-col items-center justify-between min-w-0 w-full max-w-full overflow-hidden space-y-1">
              <span className="text-[9px] uppercase font-serif font-bold text-[#8c7457] tracking-wider truncate max-w-full">
                CD SALVAGUARDA
              </span>
              <span className="text-xl font-serif font-black text-[#f5d77f] drop-shadow my-0.5 truncate max-w-full">
                {spellSaveDc}
              </span>
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#8c7457] max-w-full">
                <span className="flex-shrink-0 text-[9px]">Bônus:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={character.spellSaveDcBonus || 0}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                    const parsed = parseInt(clean, 10);
                    onUpdateCharacter({
                      ...character,
                      spellSaveDcBonus: isNaN(parsed) ? 0 : parsed,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="w-16 min-w-[4rem] bg-[#140d08] border border-[#54412c] focus:border-[#c49d48] rounded px-1 text-center text-amber-300 font-bold focus:outline-none"
                  title="Bônus adicional para CD de Salvaguarda de Magia"
                />
              </div>
            </div>

            <div className="bg-[#1c130c] border border-[#54412c] rounded-lg p-2 flex flex-col items-center justify-between min-w-0 w-full max-w-full overflow-hidden space-y-1">
              <button
                type="button"
                onClick={() =>
                  onQuickRoll(
                    `1d20${formatModifier(spellAttackBonus)}`,
                    `Ataque Mágico de ${character.characterName}`
                  )
                }
                className="w-full flex flex-col items-center justify-center hover:opacity-90 transition cursor-pointer group"
                title="Clique para rolar Ataque Mágico"
              >
                <span className="text-[9px] uppercase font-serif font-bold text-[#8c7457] group-hover:text-[#c49d48] tracking-wider truncate max-w-full">
                  ATAQUE MÁGICO
                </span>
                <span className="text-xl font-serif font-black text-amber-300 group-hover:text-amber-200 drop-shadow my-0.5 truncate max-w-full">
                  {formatModifier(spellAttackBonus)}
                </span>
              </button>
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#8c7457] max-w-full">
                <span className="flex-shrink-0 text-[9px]">Bônus:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={character.spellAttackCustomBonus || 0}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                    const parsed = parseInt(clean, 10);
                    onUpdateCharacter({
                      ...character,
                      spellAttackCustomBonus: isNaN(parsed) ? 0 : parsed,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="w-16 min-w-[4rem] bg-[#140d08] border border-[#54412c] focus:border-[#c49d48] rounded px-1 text-center text-amber-300 font-bold focus:outline-none"
                  title="Bônus adicional para Ataque Mágico"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
