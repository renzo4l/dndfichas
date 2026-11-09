import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Move, Check, RotateCcw, GripVertical, Crown } from 'lucide-react';
import { CharacterSheet } from '../types/dnd';
import { CharacterSheetProvider, CharacterSheetContextType } from '../context/CharacterSheetContext';
import { DEFAULT_CARD_ORDER, DEFAULT_CARD_COLUMNS, normalizeCardId, getCardTitle, filterMatchesCard } from './sheet/sheetLayout';
import { useCharacterDerivedStats } from './sheet/useCharacterDerivedStats';

// Submódulos Modulares
import { CharacterHeader } from './sheet/header/CharacterHeader';
import { AttributesGrid } from './sheet/attributes/AttributesGrid';
import { VitalResourcesSection } from './sheet/resources/VitalResourcesSection';
import { DefenseSection } from './sheet/defense/DefenseSection';
import { SkillsAndSavesSection } from './sheet/skills/SkillsAndSavesSection';
import { CombatSection } from './sheet/combat/CombatSection';
import { FeaturesSection } from './sheet/features/FeaturesSection';
import { SpellsSection } from './sheet/spells/SpellsSection';
import { InventorySection } from './sheet/inventory/InventorySection';
import { BiographySection } from './sheet/bio/BiographySection';
import { ConditionsSection } from './sheet/conditions/ConditionsSection';
import { ShortcutsDiceSection } from './sheet/shortcuts/ShortcutsDiceSection';

export interface CharacterSheetViewProps {
  character: CharacterSheet;
  onUpdateCharacter: (character: CharacterSheet) => void;
  onBack: () => void;
  onQuickRoll: (expression: string, label: string) => void;
  userRole?: 'dm' | 'player';
}

export const CharacterSheetView: React.FC<CharacterSheetViewProps> = ({
  character,
  onUpdateCharacter,
  onBack,
  onQuickRoll,
  userRole = 'player',
}) => {
  const stats = useCharacterDerivedStats(character);

  const [cardColumns, setCardColumns] = useState<string[][]>(() => {
    if (character.cardColumns && Array.isArray(character.cardColumns) && character.cardColumns.length === 3) {
      return character.cardColumns.map((col) =>
        col.map(normalizeCardId).filter((id) => DEFAULT_CARD_ORDER.includes(id))
      );
    }
    try {
      const saved = localStorage.getItem(`archdice_card_columns_${character.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return parsed.map((col: any) =>
            col.map(normalizeCardId).filter((id: string) => DEFAULT_CARD_ORDER.includes(id))
          );
        }
      }
    } catch {}
    return DEFAULT_CARD_COLUMNS;
  });

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [selectedCardForSwap, setSelectedCardForSwap] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const updateColumns = useCallback((newCols: string[][]) => {
    setCardColumns(newCols);
    try {
      localStorage.setItem(`archdice_card_columns_${character.id}`, JSON.stringify(newCols));
    } catch {}
    onUpdateCharacter({ ...character, cardColumns: newCols, updatedAt: new Date().toISOString() });
  }, [character, onUpdateCharacter]);

  const isCardCollapsed = useCallback((cardId: string) => Boolean(collapsedCategories[normalizeCardId(cardId)]), [collapsedCategories]);
  const handleToggleCategoryCollapse = useCallback((cardId: string) => {
    const norm = normalizeCardId(cardId);
    setCollapsedCategories((prev) => ({ ...prev, [norm]: !prev[norm] }));
  }, []);

  const handleSelectCardForSwap = (targetCardId: string) => {
    if (!selectedCardForSwap) {
      setSelectedCardForSwap(targetCardId);
    } else if (selectedCardForSwap === targetCardId) {
      setSelectedCardForSwap(null);
    } else {
      const newCols = cardColumns.map((col) => [...col]);
      let sCol = -1, sIdx = -1, tCol = -1, tIdx = -1;
      for (let c = 0; c < cardColumns.length; c++) {
        const si = cardColumns[c].indexOf(selectedCardForSwap);
        if (si !== -1) { sCol = c; sIdx = si; }
        const ti = cardColumns[c].indexOf(targetCardId);
        if (ti !== -1) { tCol = c; tIdx = ti; }
      }
      if (sCol !== -1 && tCol !== -1) {
        const temp = newCols[sCol][sIdx];
        newCols[sCol][sIdx] = newCols[tCol][tIdx];
        newCols[tCol][tIdx] = temp;
        updateColumns(newCols);
      }
      setSelectedCardForSwap(null);
    }
  };

  const contextValue: CharacterSheetContextType = useMemo(() => ({
    character,
    onUpdateCharacter,
    onQuickRoll,
    userRole,
    profBonus: stats.profBonus,
    getModByName: stats.getModByName,
    isCardCollapsed,
    handleToggleCategoryCollapse,
    handleSaveProficiencyToggle: () => {},
    handleSaveCustomBonusChange: () => {},
    handleSkillProficiencyChange: () => {},
    handleSkillCustomBonusChange: () => {},
    handleToggleSpellPrepared: () => {},
    handleDeleteSpell: () => {},
    handleOpenCreateSpellModal: () => {},
    handleOpenEditSpellModal: () => {},
  }), [character, onUpdateCharacter, onQuickRoll, userRole, stats.profBonus, stats.getModByName, isCardCollapsed, handleToggleCategoryCollapse]);

  const renderCard = (cardId: string) => {
    const isCol = isCardCollapsed(cardId);
    const onTog = () => handleToggleCategoryCollapse(cardId);

    switch (cardId) {
      case 'atributos':
        return <AttributesGrid character={character} onUpdateCharacter={onUpdateCharacter} onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'recursos':
        return <VitalResourcesSection character={character} conMod={stats.conMod} onUpdateCharacter={onUpdateCharacter} onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'defesa':
        return <DefenseSection character={character} dexMod={stats.dexMod} profBonus={stats.profBonus} totalLevel={stats.totalLevel} totalInitiative={stats.totalInitiative} initiativeBonus={character.initiativeBonus || 0} speedInMeters={stats.speedInMeters} speedInSquares={stats.speedInSquares} spellAbility={stats.spellAbility} spellMod={stats.spellMod} onUpdateCharacter={onUpdateCharacter} onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'pericias':
        return <SkillsAndSavesSection character={character} profBonus={stats.profBonus} onUpdateCharacter={onUpdateCharacter} onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'combate':
        return <CombatSection character={character} profBonus={stats.profBonus} onUpdateCharacter={onUpdateCharacter} onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'habilidades':
        return <FeaturesSection character={character} onUpdateCharacter={onUpdateCharacter} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'magias':
        return <SpellsSection character={character} profBonus={stats.profBonus} onUpdateCharacter={onUpdateCharacter} onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'inventario':
        return <InventorySection character={character} onUpdateCharacter={onUpdateCharacter} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'biografia':
        return <BiographySection character={character} userRole={userRole} onUpdateCharacter={onUpdateCharacter} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'condicoes':
        return <ConditionsSection character={character} onUpdateCharacter={onUpdateCharacter} isCollapsed={isCol} onToggleCollapse={onTog} />;
      case 'atalhos':
        return <ShortcutsDiceSection onQuickRoll={onQuickRoll} isCollapsed={isCol} onToggleCollapse={onTog} />;
      default:
        return null;
    }
  };

  return (
    <CharacterSheetProvider value={contextValue}>
      <div className="space-y-6 pb-16">
        {userRole === 'dm' && (
          <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-stone-900 border border-amber-500/70 rounded-xl p-3 text-amber-200 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="font-serif font-bold text-sm text-amber-300">Modo Mestre da Campanha (DM) — Acesso Total</span>
            </div>
          </div>
        )}

        {/* Barra Superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#160f0a]/90 border-2 border-[#8c6b32]/60 rounded-2xl p-3 shadow-xl backdrop-blur-sm">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#24170e] hover:bg-[#382619] text-[#e8c679] border border-[#8c6b32]/60 text-xs font-serif font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Lista</span>
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'Todos os Cards' },
              { id: 'combat', label: 'Combate' },
              { id: 'spells', label: 'Magias' },
              { id: 'traits', label: 'Habilidades' },
              { id: 'inventory', label: 'Inventário' },
              { id: 'bio', label: 'Biografia' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg border font-serif font-bold transition flex-shrink-0 cursor-pointer ${
                  categoryFilter === f.id
                    ? 'bg-[#c49d48] text-[#140d07] border-[#e8c679] shadow-sm'
                    : 'bg-[#1e140d] text-[#8c7457] border-[#54412c] hover:text-[#eedbc5]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-serif font-bold transition cursor-pointer ${
                isEditingLayout
                  ? 'bg-emerald-700 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-[#24170e] text-amber-200 border-[#8c6b32]/60 hover:bg-[#382619]'
              }`}
            >
              {isEditingLayout ? <Check className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
              <span>{isEditingLayout ? 'Concluir Layout' : 'Reorganizar Cards'}</span>
            </button>
            {isEditingLayout && (
              <button
                type="button"
                onClick={() => updateColumns(DEFAULT_CARD_COLUMNS)}
                className="p-1.5 rounded-xl bg-[#24170e] hover:bg-[#382619] text-[#8c7457] hover:text-amber-300 border border-[#54412c] transition cursor-pointer"
                title="Restaurar colunas padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* HUD de Cabeçalho */}
        <CharacterHeader
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onQuickRoll={onQuickRoll}
          profBonus={stats.profBonus}
          totalLevel={stats.totalLevel}
          dexMod={stats.dexMod}
          speedInMeters={stats.speedInMeters}
          speedInSquares={stats.speedInSquares}
        />

        {/* Grade de 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full">
          {cardColumns.map((colCards, colIdx) => (
            <div key={`col-${colIdx}`} className="flex flex-col gap-6 w-full min-w-0">
              {colCards.filter((cardId) => filterMatchesCard(categoryFilter, cardId)).map((cardId) => {
                const normId = normalizeCardId(cardId);
                const isSelectedForSwap = selectedCardForSwap === normId;
                return (
                  <div
                    key={cardId}
                    className={`w-full ${
                      isEditingLayout
                        ? 'border-2 border-dashed border-[#c49d48] bg-[#160f09]/95 p-1 rounded-2xl shadow-[0_0_15px_rgba(196,157,72,0.25)]'
                        : ''
                    }`}
                  >
                    {isEditingLayout && (
                      <div className="bg-[#261910] border-b border-[#8c6b32]/70 px-3 py-1.5 flex items-center justify-between text-[11px] font-serif font-bold text-[#e8c679] rounded-t-xl mb-1 select-none shadow">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-amber-300 flex-shrink-0" />
                          <span className="uppercase tracking-wider">{getCardTitle(normId)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectCardForSwap(normId)}
                          className={`text-[10px] px-2 py-0.5 rounded font-serif font-bold border transition cursor-pointer ${
                            isSelectedForSwap
                              ? 'bg-emerald-600 text-white border-emerald-300'
                              : 'bg-[#1a0f08] border-[#54412c] text-amber-200 hover:text-white hover:bg-amber-800'
                          }`}
                        >
                          {isSelectedForSwap ? '★ Selecionado' : 'Trocar Posição'}
                        </button>
                      </div>
                    )}
                    {renderCard(normId)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </CharacterSheetProvider>
  );
};
