import React, { createContext, useContext } from 'react';
import {
  CharacterSheet,
  AbilityName,
  SkillProficiencyLevel,
  Spell,
} from '../types/dnd';

export interface CharacterSheetContextType {
  character: CharacterSheet;
  onUpdateCharacter: (updated: CharacterSheet) => void;
  onQuickRoll: (expression: string, label: string) => void;
  userRole: 'dm' | 'player';
  profBonus: number;
  getModByName: (ability: AbilityName) => number;
  isCardCollapsed: (cardId: string) => boolean;
  handleToggleCategoryCollapse: (cardId: string) => void;

  // Handlers para Salvaguardas e Perícias
  handleSaveProficiencyToggle: (ability: AbilityName) => void;
  handleSaveCustomBonusChange: (ability: AbilityName, customBonus: number) => void;
  handleSkillProficiencyChange: (skillId: string, level: SkillProficiencyLevel) => void;
  handleSkillCustomBonusChange: (skillId: string, customBonus: number) => void;

  // Handlers para Magias
  handleToggleSpellPrepared: (id: string) => void;
  handleDeleteSpell: (id: string) => void;
  handleOpenCreateSpellModal: () => void;
  handleOpenEditSpellModal: (spell: Spell) => void;
}

const CharacterSheetContext = createContext<CharacterSheetContextType | null>(null);

export interface CharacterSheetProviderProps {
  value: CharacterSheetContextType;
  children: React.ReactNode;
}

export const CharacterSheetProvider: React.FC<CharacterSheetProviderProps> = ({
  value,
  children,
}) => {
  return (
    <CharacterSheetContext.Provider value={value}>
      {children}
    </CharacterSheetContext.Provider>
  );
};

export const useCharacterSheet = (): CharacterSheetContextType => {
  const context = useContext(CharacterSheetContext);
  if (!context) {
    throw new Error(
      'useCharacterSheet must be used within a CharacterSheetProvider'
    );
  }
  return context;
};
