import {
  CharacterSheet,
  Campaign,
  HomebrewItem,
  DiceRollResult,
  SavedRollShortcut,
} from '../types/dnd';
import {
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateSkillBonus,
  calculatePassivePerception,
  DEFAULT_5E_SKILLS,
} from '../utils/dndRules';

const STORAGE_KEYS = {
  CHARACTERS: 'dnd5e_characters_v1',
  CAMPAIGNS: 'dnd5e_campaigns_v1',
  ACTIVE_CAMPAIGN_ID: 'dnd5e_active_campaign_id',
  ACTIVE_CHAR_ID: 'dnd5e_active_char_id',
  HOMEBREWS: 'dnd5e_homebrews_v1',
  DICE_HISTORY: 'dnd5e_dice_history_v1',
  SAVED_SHORTCUTS: 'dnd5e_saved_shortcuts_v1',
  CURRENT_USER_ROLE: 'dnd5e_user_role_v1', // 'dm' | 'player'
  CURRENT_USER_NAME: 'dnd5e_user_name_v1',
  CURRENT_USER_ID: 'dnd5e_user_id_v1',
};

export function createBlankCharacter(name = 'Novo Aventureiro'): CharacterSheet {
  const level = 1;
  const prof = calculateProficiencyBonus(level);

  const skillsRecord: Record<string, any> = {};
  DEFAULT_5E_SKILLS.forEach((s) => {
    skillsRecord[s.id] = {
      name: s.name,
      namePt: s.namePt,
      ability: s.ability,
      proficiency: 'none',
      customBonus: 0,
    };
  });

  const abilities = {
    str: { score: 10, modifier: 0, saveProficient: false },
    dex: { score: 10, modifier: 0, saveProficient: false },
    con: { score: 10, modifier: 0, saveProficient: false },
    int: { score: 10, modifier: 0, saveProficient: false },
    wis: { score: 10, modifier: 0, saveProficient: false },
    cha: { score: 10, modifier: 0, saveProficient: false },
  };

  return {
    id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerName: 'Jogador',
    characterName: name,
    primaryClass: 'Guerreiro',
    classAndLevel: 'Guerreiro 1',
    level: 1,
    multiclasses: [],
    background: 'Soldado',
    race: 'Humano',
    alignment: 'Neutro e Bom',
    experiencePoints: 0,

    abilities,
    proficiencyBonus: prof,
    passivePerception: 10,

    armorClass: 10,
    armorClassType: 'Nenhuma',
    initiative: 0,
    speed: 9,
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDiceTotal: '1d8',
    hitDiceCurrent: '1d8',
    deathSaves: { successes: 0, failures: 0 },

    attacks: [],

    skills: skillsRecord,

    spellSlots: [
      { level: 1, total: 0, used: 0 },
      { level: 2, total: 0, used: 0 },
      { level: 3, total: 0, used: 0 },
      { level: 4, total: 0, used: 0 },
      { level: 5, total: 0, used: 0 },
      { level: 6, total: 0, used: 0 },
      { level: 7, total: 0, used: 0 },
      { level: 8, total: 0, used: 0 },
      { level: 9, total: 0, used: 0 },
    ],
    spells: [],

    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    featuresAndTraits: '',
    featuresList: [],
    proficienciesAndLanguages: '',
    equipment: '',
    inventoryList: [],
    maxWeightBonus: 0,
    coins: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },

    homebrews: [],
    dmNotes: '',
    activeConditions: [],
    exhaustionLevel: 0,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function getCurrentUserId(): string {
  try {
    let uid = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!uid) {
      uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
    }
    return uid;
  } catch {
    return 'usr_default';
  }
}


// Storage helper functions
export function getSavedCharacters(): CharacterSheet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    if (!raw) return [];
    const parsed: CharacterSheet[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Limpeza automática de personagens antigos mockados caso ainda possuam os dados padrão
    let hasChanges = false;
    const sanitized = parsed.map((char) => {
      let c = { ...char };
      // Se possui habilidades mockadas padrão (ex: feat_1 'Estilo de Luta: Defesa', feat_2 'Retomar o Fôlego')
      if (c.featuresList && c.featuresList.some(f => f.id === 'feat_1' || f.name === 'Estilo de Luta: Defesa')) {
        c.featuresList = c.featuresList.filter(f => f.id !== 'feat_1' && f.id !== 'feat_2' && f.name !== 'Estilo de Luta: Defesa' && f.name !== 'Retomar o Fôlego');
        if (c.featuresAndTraits && c.featuresAndTraits.includes('Estilo de Luta: Defesa')) {
          c.featuresAndTraits = '';
        }
        hasChanges = true;
      }
      // Se possui magias mockadas padrão (sp_1, sp_2, sp_3)
      if (c.spells && c.spells.some(s => s.id === 'sp_1' || s.name === 'Raio de Fogo' || s.name === 'Míssil Mágico' || s.name === 'Bola de Fogo')) {
        c.spells = c.spells.filter(s => s.id !== 'sp_1' && s.id !== 'sp_2' && s.id !== 'sp_3');
        hasChanges = true;
      }
      // Se possui ataque mockado padrão (atk_1 Espada Longa com nota Versátil)
      if (c.attacks && c.attacks.some(a => a.id === 'atk_1' && a.name === 'Espada Longa')) {
        c.attacks = c.attacks.filter(a => a.id !== 'atk_1');
        hasChanges = true;
      }
      // Se possui inventário mockado padrão (inv_1 a inv_7)
      if (c.inventoryList && c.inventoryList.some(i => i.id === 'inv_1' || i.id === 'inv_2')) {
        c.inventoryList = c.inventoryList.filter(i => !['inv_1', 'inv_2', 'inv_3', 'inv_4', 'inv_5', 'inv_6', 'inv_7'].includes(i.id));
        if (c.equipment && c.equipment.includes('Cota de malha, espada longa')) {
          c.equipment = '';
        }
        hasChanges = true;
      }
      // Se possui traços de personalidade mockados
      if (c.personalityTraits === 'Sempre calmo diante do perigo.') {
        c.personalityTraits = '';
        hasChanges = true;
      }
      if (c.ideals === 'Proteção: O fraco deve ser protegido pelo forte.') {
        c.ideals = '';
        hasChanges = true;
      }
      if (c.bonds === 'Minha espada foi dada pelo meu comandante antes de sua morte.') {
        c.bonds = '';
        hasChanges = true;
      }
      if (c.flaws === 'Raramente recuo de um desafio com honra.') {
        c.flaws = '';
        hasChanges = true;
      }
      return c;
    });

    if (hasChanges) {
      saveCharacters(sanitized);
      return sanitized;
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveCharacters(chars: CharacterSheet[]) {
  localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(chars));
}

export function getSavedCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
}

export function getSavedHomebrews(): HomebrewItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOMEBREWS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHomebrews(homebrews: HomebrewItem[]) {
  localStorage.setItem(STORAGE_KEYS.HOMEBREWS, JSON.stringify(homebrews));
}

export function getActiveCampaignId(): string {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CAMPAIGN_ID) || '';
}

export function setActiveCampaignId(id: string) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CAMPAIGN_ID, id);
}

export function getActiveCharacterId(): string {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAR_ID) || '';
}

export function setActiveCharacterId(id: string) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAR_ID, id);
}

export function getUserRole(): 'dm' | 'player' {
  return (localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ROLE) as 'dm' | 'player') || 'player';
}

export function setUserRole(role: 'dm' | 'player') {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, role);
}

export function getUserName(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_NAME) || 'Aventureiro';
}

export function setUserName(name: string) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_NAME, name);
}

export function getDiceHistory(): DiceRollResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DICE_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDiceHistory(history: DiceRollResult[]) {
  localStorage.setItem(STORAGE_KEYS.DICE_HISTORY, JSON.stringify(history.slice(0, 30)));
}

export function getSavedRollShortcuts(): SavedRollShortcut[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SHORTCUTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRollShortcuts(shortcuts: SavedRollShortcut[]) {
  localStorage.setItem(STORAGE_KEYS.SAVED_SHORTCUTS, JSON.stringify(shortcuts));
}


