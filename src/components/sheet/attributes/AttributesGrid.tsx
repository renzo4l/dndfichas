import React, { useState } from 'react';
import { Sparkles, Edit2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { CharacterSheet, AbilityName } from '../../../types/dnd';
import {
  calculateAbilityModifier,
  calculateSavingThrowBonus,
  formatModifier,
} from '../../../utils/dndRules';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';

export interface AttributesGridProps {
  character?: CharacterSheet;
  profBonus?: number;
  onUpdateCharacter?: (updated: CharacterSheet) => void;
  onQuickRoll?: (expression: string, label: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const ABILITIES_CONFIG = [
  { key: 'str' as AbilityName, label: 'Força', pt: 'FOR', top: '13.3%', left: '50%' },
  { key: 'dex' as AbilityName, label: 'Destreza', pt: 'DES', top: '31.7%', left: '81.7%' },
  { key: 'con' as AbilityName, label: 'Constituição', pt: 'CON', top: '68.3%', left: '81.7%' },
  { key: 'int' as AbilityName, label: 'Inteligência', pt: 'INT', top: '86.7%', left: '50%' },
  { key: 'wis' as AbilityName, label: 'Sabedoria', pt: 'SAB', top: '68.3%', left: '18.3%' },
  { key: 'cha' as AbilityName, label: 'Carisma', pt: 'CAR', top: '31.7%', left: '18.3%' },
] as const;

export const AttributesGrid: React.FC<AttributesGridProps> = (props) => {
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
  const isCollapsed =
    props.isCollapsed ?? (ctx ? ctx.isCardCollapsed('atributos') : false);
  const onToggleCollapse =
    props.onToggleCollapse || (() => ctx?.handleToggleCategoryCollapse('atributos'));

  const [showEditModal, setShowEditModal] = useState(false);

  if (!character || !onUpdateCharacter) return null;

  const handleScoreChange = (ability: AbilityName, newScore: number) => {
    const valid = Math.max(1, Math.min(30, newScore));
    const newMod = calculateAbilityModifier(valid);
    onUpdateCharacter({
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: {
          ...character.abilities[ability],
          score: valid,
          modifier: newMod,
        },
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveProficiencyToggle = (ability: AbilityName) => {
    const current = character.abilities[ability]?.saveProficient || false;
    onUpdateCharacter({
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: {
          ...character.abilities[ability],
          saveProficient: !current,
        },
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <div
        className={`bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-xl relative overflow-hidden select-none sheet-card-optimized ${
          props.className || ''
        }`}
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-2">
          <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#e8c679]" />
            <span>Atributos</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-2 py-0.5 rounded bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] text-[11px] font-serif font-bold transition flex items-center gap-1 cursor-pointer"
              title="Editar Valores Base dos Atributos e Salvaguardas"
            >
              <Edit2 className="w-3 h-3 text-[#c49d48]" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
              title={isCollapsed ? 'Expandir atributos' : 'Reduzir atributos para economizar espaço'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo Expansível / Mandala */}
        <div
          className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden ${
            isCollapsed
              ? 'max-h-0 opacity-0 pointer-events-none mt-0'
              : 'max-h-[1400px] opacity-100'
          }`}
        >
          <div className="relative w-full max-w-[340px] sm:max-w-[350px] aspect-square mx-auto my-1 select-none">
            {/* Camada SVG Rúnica Mística de Fundo */}
            <svg
              viewBox="0 0 360 360"
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
            >
              <defs>
                <radialGradient id="arcaneCenterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c49d48" stopOpacity="0.18" />
                  <stop offset="70%" stopColor="#c49d48" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Glow Central */}
              <circle cx="180" cy="180" r="150" fill="url(#arcaneCenterGlow)" />

              {/* Círculos Concêntricos Ornamentados */}
              <circle
                cx="180"
                cy="180"
                r="164"
                fill="none"
                stroke="#8c6b32"
                strokeWidth="1"
                strokeOpacity="0.25"
                strokeDasharray="4 6"
              />
              <circle
                cx="180"
                cy="180"
                r="152"
                fill="none"
                stroke="#c49d48"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
              <circle
                cx="180"
                cy="180"
                r="144"
                fill="none"
                stroke="#8c6b32"
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="2 4"
              />

              {/* Geometria Estelar Hexagramal conectando os 6 nós (R=132) */}
              <polygon
                points="180,48 294,246 66,246"
                fill="none"
                stroke="#c49d48"
                strokeWidth="1.2"
                strokeOpacity="0.35"
              />
              <polygon
                points="294,114 180,312 66,114"
                fill="none"
                stroke="#c49d48"
                strokeWidth="1.2"
                strokeOpacity="0.35"
              />

              {/* Anel de conexão passando pelo centro dos 6 nós */}
              <circle
                cx="180"
                cy="180"
                r="132"
                fill="none"
                stroke="#d4af37"
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeDasharray="6 8"
              />

              {/* Anéis Rúnicos Internos */}
              <circle
                cx="180"
                cy="180"
                r="54"
                fill="none"
                stroke="#c49d48"
                strokeWidth="1.5"
                strokeOpacity="0.6"
                strokeDasharray="3 3"
              />
              <circle
                cx="180"
                cy="180"
                r="48"
                fill="none"
                stroke="#8c6b32"
                strokeWidth="1.2"
                strokeOpacity="0.5"
              />

              {/* Raios Radiais */}
              <line x1="180" y1="180" x2="180" y2="48" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
              <line x1="180" y1="180" x2="294" y2="114" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
              <line x1="180" y1="180" x2="294" y2="246" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
              <line x1="180" y1="180" x2="180" y2="312" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
              <line x1="180" y1="180" x2="66" y2="246" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
              <line x1="180" y1="180" x2="66" y2="114" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
            </svg>

            {/* Medalhão Central Arcano: ATRIBUTOS */}
            <div
              onClick={() => setShowEditModal(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 p-2 rounded-full bg-gradient-to-br from-[#1e140d] via-[#140d07] to-[#0c0805] border-2 border-[#8c6b32] shadow-[0_0_20px_rgba(196,157,72,0.3)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#e8c679] hover:scale-105 transition-all duration-200 z-10 group box-border"
              title="Clique para editar os valores base e salvaguardas dos Atributos"
            >
              <div className="absolute inset-1.5 rounded-full border border-[#d4af37]/30 border-dashed pointer-events-none" />
              <span className="font-serif font-black text-[11px] leading-tight uppercase tracking-wider text-[#f4ecd8] group-hover:text-[#f5d77f] transition drop-shadow px-1">
                ATRIBUTOS
              </span>
              <span className="text-[8px] font-mono text-[#8c7457] tracking-wider mt-0.5">
                D&amp;D 5E
              </span>
              <Edit2 className="w-3 h-3 text-[#c49d48] mt-0.5 opacity-70 group-hover:opacity-100 transition" />
            </div>

            {/* Os 6 Nós Radiais dos Atributos */}
            {ABILITIES_CONFIG.map(({ key, label, pt, top, left }) => {
              const abilityData = character.abilities[key] || {
                score: 10,
                modifier: 0,
                saveProficient: false,
              };
              const score = abilityData.score;
              const mod = calculateAbilityModifier(score);
              const isSaveProf = abilityData.saveProficient;
              const saveBonus = calculateSavingThrowBonus(
                mod,
                profBonus,
                isSaveProf,
                abilityData.saveCustomBonus || 0
              );

              return (
                <div
                  key={key}
                  style={{ top, left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onQuickRoll) {
                        onQuickRoll(
                          `1d20${formatModifier(mod)}`,
                          `Teste de ${label} (${pt})`
                        );
                      }
                    }}
                    className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#24170e] via-[#1a110a] to-[#120b06] border-2 border-[#8c6b32] hover:border-[#e8c679] hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all duration-150 flex flex-col items-center justify-center relative cursor-pointer group shadow-lg"
                    title={`Clique para rolar Teste de ${label} (1d20${formatModifier(
                      mod
                    )})\nSalvaguarda: ${formatModifier(saveBonus)}${
                      isSaveProf ? ' (Proficiente)' : ''
                    }`}
                  >
                    <div className="absolute inset-1 rounded-full border border-[#d4af37]/25 pointer-events-none" />

                    <span className="font-serif font-black text-xl text-[#f4ecd8] group-hover:text-[#f5d77f] transition leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {formatModifier(mod)}
                    </span>

                    <span className="text-[9px] uppercase font-serif font-black text-[#c49d48] tracking-wider mt-0.5">
                      {pt}
                    </span>

                    <span className="text-[8px] font-mono font-bold text-[#8c7457] leading-none">
                      {score}
                    </span>

                    {isSaveProf && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 border border-amber-300 text-[9px] text-[#140d07] font-black flex items-center justify-center shadow"
                        title={`Proficiente em Salvaguarda (${formatModifier(saveBonus)})`}
                      >
                        ★
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Edição de Atributos */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#1e140d] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            <div className="flex items-center justify-between border-b border-[#8c6b32]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#c49d48]" />
                <div>
                  <h3 className="font-black text-lg text-[#f4ecd8]">
                    Editar Atributos &amp; Salvaguardas
                  </h3>
                  <p className="text-[11px] text-[#bfa888] font-sans">
                    Altere os valores base (1–30) e marque as proficiências em salvaguardas (D&amp;D 5e).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#2c1d13] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {ABILITIES_CONFIG.map(({ key, label, pt }) => {
                const currentAbility = character.abilities[key] || {
                  score: 10,
                  modifier: 0,
                  saveProficient: false,
                };
                const mod = calculateAbilityModifier(currentAbility.score);
                const isSaveProf = currentAbility.saveProficient;
                const saveBonus = calculateSavingThrowBonus(
                  mod,
                  profBonus,
                  isSaveProf,
                  currentAbility.saveCustomBonus || 0
                );

                return (
                  <div
                    key={`modal_attr_${key}`}
                    className="flex items-center justify-between p-3 bg-[#140d08] border border-[#54412c] rounded-xl hover:border-[#8c6b32]/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#24170e] border border-[#8c6b32]/50 flex flex-col items-center justify-center font-bold">
                        <span className="text-[10px] text-[#c49d48] uppercase tracking-wider">
                          {pt}
                        </span>
                        <span className="text-xs text-[#f4ecd8] font-mono leading-none">
                          {formatModifier(mod)}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#f4ecd8]">
                          {label}
                        </div>
                        <div className="text-[10px] text-[#8c7457] font-mono">
                          Salvaguarda:{' '}
                          <span className="text-amber-300 font-bold">
                            {formatModifier(saveBonus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] uppercase text-[#8c7457] font-sans font-bold">
                          Valor:
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={currentAbility.score}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            const val =
                              clean === ''
                                ? 10
                                : Math.max(1, Math.min(30, parseInt(clean, 10)));
                            handleScoreChange(key, val);
                          }}
                          className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#8c6b32]/60 rounded-lg py-1 px-2 text-center font-mono font-bold text-sm text-amber-200 focus:outline-none focus:border-[#c49d48]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveProficiencyToggle(key)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isSaveProf
                            ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(217,119,6,0.3)]'
                            : 'bg-[#1e140d] border-[#54412c] text-[#8c7457] hover:border-[#8c6b32] hover:text-[#eedbc5]'
                        }`}
                        title="Marcar proficiência no teste de salvaguarda deste atributo"
                      >
                        <span>{isSaveProf ? '★' : '☆'}</span>
                        <span className="text-[10px]">Salva</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#8c6b32]/40 text-xs">
              <span className="text-[#8c7457] font-sans">
                Bônus de Proficiência Atual:{' '}
                <strong className="text-amber-300">+{profBonus}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md cursor-pointer"
              >
                Concluir Edição
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
