import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateSkillBonus,
  calculateSavingThrowBonus,
  calculatePassivePerception,
  calculateSpellSaveDc,
  calculateSpellAttackBonus,
  formatModifier,
  generateCampaignCode,
  normalizeCampaignCode,
  rollDice,
} from './dndRules';

test('calculateAbilityModifier follows D&D 5e standard rules', () => {
  // Score 10 -> +0
  assert.equal(calculateAbilityModifier(10), 0);
  // Score 11 -> +0
  assert.equal(calculateAbilityModifier(11), 0);
  // Score 12 -> +1
  assert.equal(calculateAbilityModifier(12), 1);
  // Score 14 -> +2
  assert.equal(calculateAbilityModifier(14), 2);
  // Score 18 -> +4
  assert.equal(calculateAbilityModifier(18), 4);
  // Score 20 -> +5
  assert.equal(calculateAbilityModifier(20), 5);
  // Score 8 -> -1
  assert.equal(calculateAbilityModifier(8), -1);
  // Score 9 -> -1
  assert.equal(calculateAbilityModifier(9), -1);
  // Score 3 -> -4
  assert.equal(calculateAbilityModifier(3), -4);
  // Score 1 -> -5
  assert.equal(calculateAbilityModifier(1), -5);
});

test('calculateProficiencyBonus scales accurately across 20 levels', () => {
  assert.equal(calculateProficiencyBonus(1), 2);
  assert.equal(calculateProficiencyBonus(4), 2);
  assert.equal(calculateProficiencyBonus(5), 3);
  assert.equal(calculateProficiencyBonus(8), 3);
  assert.equal(calculateProficiencyBonus(9), 4);
  assert.equal(calculateProficiencyBonus(12), 4);
  assert.equal(calculateProficiencyBonus(13), 5);
  assert.equal(calculateProficiencyBonus(16), 5);
  assert.equal(calculateProficiencyBonus(17), 6);
  assert.equal(calculateProficiencyBonus(20), 6);
});

test('calculateSkillBonus handles none, half, proficient and expertise', () => {
  const mod = 3; // +3 DEX
  const prof = 3; // +3 prof bonus

  // None
  assert.equal(calculateSkillBonus(mod, prof, 'none'), 3);
  // Half (Jack of all trades) -> floor(3 * 0.5) = 1 -> 3 + 1 = 4
  assert.equal(calculateSkillBonus(mod, prof, 'half'), 4);
  // Proficient -> 3 + 3 = 6
  assert.equal(calculateSkillBonus(mod, prof, 'proficient'), 6);
  // Expertise -> 3 + (3 * 2) = 9
  assert.equal(calculateSkillBonus(mod, prof, 'expertise'), 9);
  // Custom item bonus +1
  assert.equal(calculateSkillBonus(mod, prof, 'proficient', 1), 7);
});

test('calculateSavingThrowBonus adds proficiency when proficient', () => {
  assert.equal(calculateSavingThrowBonus(2, 3, false), 2);
  assert.equal(calculateSavingThrowBonus(2, 3, true), 5);
  assert.equal(calculateSavingThrowBonus(-1, 2, true), 1);
});

test('calculatePassivePerception is 10 + perception bonus', () => {
  assert.equal(calculatePassivePerception(5), 15);
  assert.equal(calculatePassivePerception(-1), 9);
});

test('calculateSpellSaveDc and spell attack bonuses are correct', () => {
  // Lvl 5 Wizard (prof +3, INT 18 (+4 mod))
  assert.equal(calculateSpellSaveDc(3, 4), 15); // 8 + 3 + 4 = 15
  assert.equal(calculateSpellAttackBonus(3, 4), 7); // 3 + 4 = 7
});

test('formatModifier returns proper sign', () => {
  assert.equal(formatModifier(3), '+3');
  assert.equal(formatModifier(0), '+0');
  assert.equal(formatModifier(-2), '-2');
});

test('generateCampaignCode creates 8-character formatted code', () => {
  const code = generateCampaignCode();
  // e.g. "DRG7-K92X"
  assert.equal(code.length, 9); // 8 chars + 1 hyphen
  const normalized = normalizeCampaignCode(code);
  assert.equal(normalized, code);
  assert.equal(normalizeCampaignCode('drg7-k92x'), 'DRG7-K92X');
  assert.equal(normalizeCampaignCode('drg7k92x'), 'DRG7-K92X');
});

test('rollDice computes correct range and structure', () => {
  const roll = rollDice('1d20+4', 'Thorin', 'Teste de Atletismo');
  assert.equal(roll.rollerName, 'Thorin');
  assert.equal(roll.label, 'Teste de Atletismo');
  assert.equal(roll.modifier, 4);
  assert.ok(roll.total >= 5 && roll.total <= 24);
  assert.equal(roll.rolls.length, 1);
  assert.ok(roll.rolls[0] >= 1 && roll.rolls[0] <= 20);
});

test('rollDice handles advantage, disadvantage and multiple dice', () => {
  const advRoll = rollDice('1d20+5 [Vantagem]', 'Thorin', 'Ataque com Vantagem');
  assert.equal(advRoll.advantageType, 'advantage');
  assert.equal(advRoll.rolls.length, 2);
  assert.equal(advRoll.total, Math.max(...advRoll.rolls) + 5);

  const disRoll = rollDice('1d20+2 [Desvantagem]', 'Thorin', 'Ataque com Desvantagem');
  assert.equal(disRoll.advantageType, 'disadvantage');
  assert.equal(disRoll.rolls.length, 2);
  assert.equal(disRoll.total, Math.min(...disRoll.rolls) + 2);

  const multiDice = rollDice('4d6+3', 'Mago', 'Bola de Fogo Pequena');
  assert.equal(multiDice.rolls.length, 4);
  const sum = multiDice.rolls.reduce((a, b) => a + b, 0);
  assert.equal(multiDice.total, sum + 3);
});

test('rollDice handles multiple advantages and Portuguese plurals', () => {
  const multiAdv = rollDice('1d20+6 [2 Vantagens]', 'Guerreiro', 'Ataque Triplo');
  assert.equal(multiAdv.advantageType, 'advantage');
  assert.equal(multiAdv.rolls.length, 3); // 1 base + 2 advantages = 3 dice
  assert.equal(multiAdv.advantageCount, 2);
  assert.equal(multiAdv.total, Math.max(...multiAdv.rolls) + 6);

  const tripleAdv = rollDice('1d20+4 [3 Vantagens]', 'Ladino', 'Emboscada');
  assert.equal(tripleAdv.advantageType, 'advantage');
  assert.equal(tripleAdv.rolls.length, 4); // 1 base + 3 advantages = 4 dice
  assert.equal(tripleAdv.advantageCount, 3);
  assert.equal(tripleAdv.total, Math.max(...tripleAdv.rolls) + 4);

  const doubleDis = rollDice('1d20+1 [2 Desvantagens]', 'Alvo', 'Cego e Preso');
  assert.equal(doubleDis.advantageType, 'disadvantage');
  assert.equal(doubleDis.rolls.length, 3);
  assert.equal(doubleDis.total, Math.min(...doubleDis.rolls) + 1);
});

test('rollDice handles multi-type damage formulas', () => {
  const dmgRoll = rollDice('1d8+3 [Cortante] + 1d6 [Fogo]', 'Paladino', 'Golpe Sagrado');
  assert.ok(dmgRoll.damageBreakdown);
  assert.equal(dmgRoll.damageBreakdown?.length, 2);
  assert.equal(dmgRoll.damageBreakdown?.[0].damageType, 'Cortante');
  assert.equal(dmgRoll.damageBreakdown?.[1].damageType, 'Fogo');
});


