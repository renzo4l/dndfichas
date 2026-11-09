import { useMemo, useCallback } from 'react';
import { CharacterSheet, AbilityName } from '../../types/dnd';
import { calculateAbilityModifier, calculateProficiencyBonus } from '../../utils/dndRules';

export function useCharacterDerivedStats(character: CharacterSheet) {
  const strMod = calculateAbilityModifier(character.abilities.str?.score || 10);
  const dexMod = calculateAbilityModifier(character.abilities.dex?.score || 10);
  const conMod = calculateAbilityModifier(character.abilities.con?.score || 10);
  const intMod = calculateAbilityModifier(character.abilities.int?.score || 10);
  const wisMod = calculateAbilityModifier(character.abilities.wis?.score || 10);
  const chaMod = calculateAbilityModifier(character.abilities.cha?.score || 10);

  const multiclasses = character.multiclasses || [];
  const totalLevel = useMemo(() => {
    if (multiclasses.length === 0) return character.level || 1;
    return (character.level || 1) + multiclasses.reduce((acc, mc) => acc + (mc.level || 0), 0);
  }, [character.level, multiclasses]);

  const profBonus = useMemo(() => calculateProficiencyBonus(totalLevel), [totalLevel]);
  const speedInMeters = character.speed !== undefined ? character.speed : 9;
  const speedInSquares = Math.round(speedInMeters / 1.5);
  const totalInitiative = dexMod + (character.initiativeBonus || 0);
  const spellAbility: AbilityName = character.spellcastingAbility || 'int';
  const spellMod = spellAbility === 'int' ? intMod : spellAbility === 'wis' ? wisMod : chaMod;

  const getModByName = useCallback(
    (ability: AbilityName) => calculateAbilityModifier(character.abilities[ability]?.score || 10),
    [character.abilities]
  );

  return {
    strMod,
    dexMod,
    conMod,
    intMod,
    wisMod,
    chaMod,
    totalLevel,
    profBonus,
    speedInMeters,
    speedInSquares,
    totalInitiative,
    spellAbility,
    spellMod,
    getModByName,
  };
}
