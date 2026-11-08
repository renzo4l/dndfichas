import { AbilityName, SkillProficiencyLevel, DiceRollResult, DamageBreakdown } from '../types/dnd';

/**
 * Calculates the standard D&D 5e ability modifier from a raw score.
 * Formula: floor((score - 10) / 2)
 */
export function calculateAbilityModifier(score: number): number {
  if (isNaN(score)) return 0;
  return Math.floor((score - 10) / 2);
}

/**
 * Calculates the proficiency bonus based on character level (1-20).
 * Rules:
 * Level 1-4: +2
 * Level 5-8: +3
 * Level 9-12: +4
 * Level 13-16: +5
 * Level 17-20: +6
 */
export function calculateProficiencyBonus(level: number): number {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return Math.floor((safeLevel - 1) / 4) + 2;
}

/**
 * Official D&D 5e damage types + Balístico (C.R.I.S.)
 */
export const ALL_DND_DAMAGE_TYPES = [
  'Ácido',
  'Balístico',
  'Contundente',
  'Cortante',
  'Elétrico',
  'Fogo',
  'Força',
  'Frio',
  'Necrótico',
  'Perfurante',
  'Psíquico',
  'Radiante',
  'Trovão',
  'Veneno',
] as const;

/**
 * Calculates the total bonus for a skill.
 */
export function calculateSkillBonus(
  abilityModifier: number,
  proficiencyBonus: number,
  proficiencyLevel: SkillProficiencyLevel,
  customBonus = 0
): number {
  let profMultiplier = 0;
  if (proficiencyLevel === 'half') profMultiplier = 0.5;
  else if (proficiencyLevel === 'proficient') profMultiplier = 1;
  else if (proficiencyLevel === 'expertise') profMultiplier = 2;

  const profPart = Math.floor(proficiencyBonus * profMultiplier);
  return abilityModifier + profPart + (customBonus || 0);
}

/**
 * Calculates saving throw bonus.
 */
export function calculateSavingThrowBonus(
  abilityModifier: number,
  proficiencyBonus: number,
  isProficient: boolean,
  customBonus = 0
): number {
  return abilityModifier + (isProficient ? proficiencyBonus : 0) + (customBonus || 0);
}

/**
 * Calculates Passive Perception.
 * Rule: 10 + Perception skill modifier + custom bonus
 */
export function calculatePassivePerception(perceptionBonus: number, customBonus = 0): number {
  return 10 + perceptionBonus + (customBonus || 0);
}

/**
 * Calculates Spell Save DC.
 * Rule: 8 + proficiency bonus + spellcasting ability modifier
 */
export function calculateSpellSaveDc(
  proficiencyBonus: number,
  spellcastingAbilityMod: number
): number {
  return 8 + proficiencyBonus + spellcastingAbilityMod;
}

/**
 * Calculates Spell Attack Modifier.
 * Rule: proficiency bonus + spellcasting ability modifier
 */
export function calculateSpellAttackBonus(
  proficiencyBonus: number,
  spellcastingAbilityMod: number
): number {
  return proficiencyBonus + spellcastingAbilityMod;
}

/**
 * Formats a modifier number into a string with '+' or '-'.
 * Example: 3 -> "+3", -1 -> "-1", 0 -> "+0"
 */
export function formatModifier(val: number): string {
  if (val >= 0) return `+${val}`;
  return `${val}`;
}

/**
 * Standard list of 18 skills in D&D 5e with Portuguese names and associated abilities.
 */
export const DEFAULT_5E_SKILLS = [
  { id: 'acrobatics', name: 'Acrobatics', namePt: 'Acrobacia', ability: 'dex' as AbilityName },
  { id: 'animal_handling', name: 'Animal Handling', namePt: 'Adestrar Animais', ability: 'wis' as AbilityName },
  { id: 'arcana', name: 'Arcana', namePt: 'Arcanismo', ability: 'int' as AbilityName },
  { id: 'athletics', name: 'Athletics', namePt: 'Atletismo', ability: 'str' as AbilityName },
  { id: 'deception', name: 'Deception', namePt: 'Enganação / Blefar', ability: 'cha' as AbilityName },
  { id: 'history', name: 'History', namePt: 'História', ability: 'int' as AbilityName },
  { id: 'insight', name: 'Insight', namePt: 'Intuição', ability: 'wis' as AbilityName },
  { id: 'intimidation', name: 'Intimidation', namePt: 'Intimidação', ability: 'cha' as AbilityName },
  { id: 'investigation', name: 'Investigation', namePt: 'Investigação', ability: 'int' as AbilityName },
  { id: 'medicine', name: 'Medicine', namePt: 'Medicina', ability: 'wis' as AbilityName },
  { id: 'nature', name: 'Nature', namePt: 'Natureza', ability: 'int' as AbilityName },
  { id: 'navigation', name: 'Navigation', namePt: 'Navegação', ability: 'int' as AbilityName },
  { id: 'perception', name: 'Perception', namePt: 'Percepção', ability: 'wis' as AbilityName },
  { id: 'performance', name: 'Performance', namePt: 'Atuação', ability: 'cha' as AbilityName },
  { id: 'persuasion', name: 'Persuasion', namePt: 'Persuasão', ability: 'cha' as AbilityName },
  { id: 'religion', name: 'Religion', namePt: 'Religião', ability: 'int' as AbilityName },
  { id: 'sleight_of_hand', name: 'Sleight of Hand', namePt: 'Prestidigitação', ability: 'dex' as AbilityName },
  { id: 'stealth', name: 'Stealth', namePt: 'Furtividade', ability: 'dex' as AbilityName },
  { id: 'survival', name: 'Survival', namePt: 'Sobrevivência', ability: 'wis' as AbilityName },
];

/**
 * Generates an 8-character unique alphanumeric campaign code.
 * Excludes confusing characters like 0/O, 1/I to make it easy to share.
 * Output format: e.g. "DRG7-K92X" (8 chars excluding hyphen, or 8 total chars)
 */
export function generateCampaignCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX for readibility
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Normalizes a campaign code (removes dashes/spaces, converts to uppercase)
 */
export function normalizeCampaignCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

/**
 * Pure function to simulate dice rolling.
 * Handles single or multiple dice (e.g. 1d20, 2d6, 8d6+4, 1d20+5 [Vantagem x3]).
 * Supports stackable advantages (rolls 1 + N dice, picks highest) and disadvantages (picks lowest).
 * Supports composite damage expressions with separated damage types (e.g. "1d8+3 [Balístico] + 1d6 [Fogo]").
 */
export function rollDice(
  expression: string,
  rollerName = 'Jogador',
  label = 'Rolagem'
): DiceRollResult {
  const isAdvOrDis = /vantag|desvantag|advantage|disadvantage/i.test(expression);
  // Check for composite damage breakdown with '+' and '[Tipo]' e.g. "1d8+3 [Balístico] + 1d6 [Fogo]"
  const bracketCount = (expression.match(/\[/g) || []).length;
  const hasMultipleDamageTypes = !isAdvOrDis && (/(?<=\])\s*\+\s*/.test(expression) || bracketCount > 1);

  if (hasMultipleDamageTypes) {
    const parts = expression.split(/(?<=\])\s*\+\s*/);
    let grandTotal = 0;
    const allRolls: number[] = [];
    const breakdown: DamageBreakdown[] = [];
    let combinedModifier = 0;

    for (const part of parts) {
      const typeMatch = part.match(/\[([^\]]+)\]/);
      const dmgType = typeMatch ? typeMatch[1].trim() : 'Geral';
      const cleanPart = part.replace(/\[.*?\]/g, '').trim();

      const diceMatch = cleanPart.match(/^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
      if (diceMatch) {
        const count = parseInt(diceMatch[1] || '1', 10);
        const sides = parseInt(diceMatch[2], 10);
        const sign = diceMatch[3] === '-' ? -1 : 1;
        const mod = diceMatch[4] ? parseInt(diceMatch[4], 10) * sign : 0;

        let partTotal = mod;
        const partRolls: number[] = [];
        for (let i = 0; i < count; i++) {
          const val = Math.floor(Math.random() * sides) + 1;
          partRolls.push(val);
          allRolls.push(val);
          partTotal += val;
        }
        combinedModifier += mod;
        grandTotal += partTotal;
        breakdown.push({
          amount: partTotal,
          damageType: dmgType,
          rolls: partRolls,
          expression: cleanPart,
        });
      } else {
        const fixedNum = parseInt(cleanPart, 10);
        if (!isNaN(fixedNum)) {
          grandTotal += fixedNum;
          combinedModifier += fixedNum;
          breakdown.push({
            amount: fixedNum,
            damageType: dmgType,
            expression: cleanPart,
          });
        }
      }
    }

    if (breakdown.length > 0) {
      return {
        id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rollerName,
        expression,
        rolls: allRolls,
        modifier: combinedModifier,
        total: grandTotal,
        label,
        damageBreakdown: breakdown,
      };
    }
  }

  // Detect stackable advantage / disadvantage
  const disMatch = expression.match(/\[?\s*(?:(\d+)\s*x?\s*desvantag(?:em|ens)?|desvantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i) ||
                   (/desvantag/i.test(expression) ? [null, '1'] : null);
  const advMatch = !disMatch && (
    expression.match(/\[?\s*(?:(\d+)\s*x?\s*vantag(?:em|ens)?|vantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i) ||
    (/vantag/i.test(expression) ? [null, '1'] : null)
  );

  let advantageType: 'normal' | 'advantage' | 'disadvantage' = 'normal';
  let advantageCount = 0;
  let disadvantageCount = 0;

  if (disMatch) {
    advantageType = 'disadvantage';
    disadvantageCount = Math.max(1, parseInt(disMatch[1] || disMatch[2] || '1', 10));
  } else if (advMatch) {
    advantageType = 'advantage';
    advantageCount = Math.max(1, parseInt(advMatch[1] || advMatch[2] || '1', 10));
  }

  // Strip tags like [Vantagem x3], (Vantagem) for cleaner regex parsing
  const cleanExpr = expression.replace(/\[.*?\]|\(.*?\)/g, ' ').trim();

  // Match e.g. "1d20+3" or "2d6 - 1" or "8d6" or "d20+5"
  const regex = /^\s*(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i;
  const match = cleanExpr.match(regex);

  let rolls: number[] = [];
  let modifier = 0;
  let total = 0;
  let isCritical = false;
  let isFumble = false;
  let keptRoll: number | undefined = undefined;

  if (match) {
    const count = parseInt(match[1] || '1', 10);
    const sides = parseInt(match[2], 10);
    const sign = match[3] === '-' ? -1 : 1;
    modifier = match[4] ? parseInt(match[4], 10) * sign : 0;

    if (advantageType !== 'normal' && sides === 20) {
      // Advantage or disadvantage: roll 1 + N extra dice (no 2-dice limit!)
      const extraDice = advantageType === 'advantage' ? advantageCount : disadvantageCount;
      const totalDice = Math.max(2, 1 + extraDice);
      for (let i = 0; i < totalDice; i++) {
        rolls.push(Math.floor(Math.random() * 20) + 1);
      }
      keptRoll = advantageType === 'advantage' ? Math.max(...rolls) : Math.min(...rolls);
      total = keptRoll + modifier;
      isCritical = keptRoll === 20;
      isFumble = keptRoll === 1;
    } else {
      // Standard roll (single or multiple dice, e.g. 8d6)
      for (let i = 0; i < count; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push(val);
        total += val;
      }
      total += modifier;
      if (sides === 20 && count === 1) {
        isCritical = rolls[0] === 20;
        isFumble = rolls[0] === 1;
        keptRoll = rolls[0];
      }
    }

    return {
      id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rollerName,
      expression,
      rolls,
      modifier,
      total,
      isCritical,
      isFumble,
      label,
      advantageType,
      advantageCount: advantageType === 'advantage' ? advantageCount : undefined,
      disadvantageCount: advantageType === 'disadvantage' ? disadvantageCount : undefined,
      keptRoll,
    };
  }

  // Fallback for raw modifier e.g. "+5" or simple d20 roll
  const modNum = parseInt(cleanExpr, 10) || 0;
  if (advantageType !== 'normal') {
    const extraDice = advantageType === 'advantage' ? advantageCount : disadvantageCount;
    const totalDice = Math.max(2, 1 + extraDice);
    for (let i = 0; i < totalDice; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    keptRoll = advantageType === 'advantage' ? Math.max(...rolls) : Math.min(...rolls);
    modifier = modNum;
    total = keptRoll + modNum;
    isCritical = keptRoll === 20;
    isFumble = keptRoll === 1;
  } else {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    rolls = [d20Roll];
    modifier = modNum;
    total = d20Roll + modNum;
    isCritical = d20Roll === 20;
    isFumble = d20Roll === 1;
    keptRoll = d20Roll;
  }

  return {
    id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rollerName,
    expression,
    rolls,
    modifier,
    total,
    isCritical,
    isFumble,
    label,
    advantageType,
    advantageCount: advantageType === 'advantage' ? advantageCount : undefined,
    disadvantageCount: advantageType === 'disadvantage' ? disadvantageCount : undefined,
    keptRoll,
  };
}
