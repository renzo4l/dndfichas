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

    armorClass: 16,
    armorClassType: 'Cota de Malha',
    initiative: 0,
    speed: 9,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    hitDiceTotal: '1d10',
    hitDiceCurrent: '1d10',
    deathSaves: { successes: 0, failures: 0 },

    attacks: [
      {
        id: 'atk_1',
        name: 'Espada Longa',
        attackBonus: 4,
        damage: '1d8 + 2',
        damageType: 'Cortante',
        notes: 'Versátil (1d10)',
      },
    ],

    skills: skillsRecord,

    spellSlots: [
      { level: 1, total: 4, used: 0 },
      { level: 2, total: 3, used: 0 },
      { level: 3, total: 2, used: 0 },
      { level: 4, total: 0, used: 0 },
      { level: 5, total: 0, used: 0 },
      { level: 6, total: 0, used: 0 },
      { level: 7, total: 0, used: 0 },
      { level: 8, total: 0, used: 0 },
      { level: 9, total: 0, used: 0 },
    ],
    spells: [
      {
        id: 'sp_1',
        name: 'Raio de Fogo',
        level: 0,
        school: 'Evocação',
        castingTime: '1 Ação',
        range: '36m',
        components: 'V, S',
        duration: 'Instantâneo',
        description: 'Lança um feixe flamejante. Faça um ataque com magia. Em um acerto, o alvo sofre 1d10 de dano de fogo.',
        prepared: true,
      },
      {
        id: 'sp_2',
        name: 'Míssil Mágico',
        level: 1,
        school: 'Evocação',
        castingTime: '1 Ação',
        range: '36m',
        components: 'V, S',
        duration: 'Instantâneo',
        description: 'Cria 3 dardos mágicos infalíveis. Cada dardo causa 1d4+1 de dano de energia.',
        prepared: true,
      },
      {
        id: 'sp_3',
        name: 'Bola de Fogo',
        level: 3,
        school: 'Evocação',
        castingTime: '1 Ação',
        range: '45m',
        components: 'V, S, M (guano e enxofre)',
        duration: 'Instantâneo',
        description: 'Explosão flamejante em esfera de 6m. Alvos fazem teste de resistência de Destreza ou sofrem 8d6 de dano de fogo.',
        prepared: true,
      },
    ],

    personalityTraits: 'Sempre calmo diante do perigo.',
    ideals: 'Proteção: O fraco deve ser protegido pelo forte.',
    bonds: 'Minha espada foi dada pelo meu comandante antes de sua morte.',
    flaws: 'Raramente recuo de um desafio com honra.',
    featuresAndTraits: 'Estilo de Luta: Defesa (+1 na CA quando usando armadura).\nRetomar o Fôlego: 1d10 + nível por descanso curto.',
    featuresList: [
      {
        id: 'feat_1',
        name: 'Estilo de Luta: Defesa',
        description: 'Você recebe +1 de bônus na sua Classe de Armadura enquanto estiver usando uma armadura.',
        source: 'Classe (Guerreiro)',
        isExpanded: true,
      },
      {
        id: 'feat_2',
        name: 'Retomar o Fôlego',
        description: 'Em seu turno, você pode usar uma ação bônus para recuperar pontos de vida iguais a 1d10 + seu nível de guerreiro. Você precisa terminar um descanso curto ou longo para usar este traço novamente.',
        source: 'Classe (Guerreiro)',
        cost: '1/Descanso Curto',
        isExpanded: false,
      },
    ],
    proficienciesAndLanguages: 'Todas as armaduras, escudos, armas simples e marciais.\nIdiomas: Comum, Élfico.',
    equipment: 'Cota de malha, espada longa, escudo (+2 CA), mochila de aventureiro, poção de cura (2x), ração de viagem, tochas.',
    inventoryList: [
      { id: 'inv_1', name: 'Cota de Malha', quantity: 1, weightKg: 25, category: 'Armadura', equipped: true, description: 'CA 16 (sem des)' },
      { id: 'inv_2', name: 'Espada Longa', quantity: 1, weightKg: 1.5, category: 'Arma', equipped: true, description: '1d8 cortante (versátil 1d10)' },
      { id: 'inv_3', name: 'Escudo', quantity: 1, weightKg: 3, category: 'Armadura', equipped: true, description: '+2 na CA' },
      { id: 'inv_4', name: 'Mochila de Aventureiro', quantity: 1, weightKg: 2, category: 'Geral', equipped: true },
      { id: 'inv_5', name: 'Poção de Cura Rápida', quantity: 2, weightKg: 0.25, category: 'Poção', description: 'Recupera 2d4+2 PV' },
      { id: 'inv_6', name: 'Ração de Viagem (1 dia)', quantity: 5, weightKg: 0.5, category: 'Ração' },
      { id: 'inv_7', name: 'Tochas', quantity: 10, weightKg: 0.4, category: 'Geral' },
    ],
    maxWeightBonus: 0,
    coins: { pc: 0, pp: 5, pe: 0, po: 25, pl: 0 },

    homebrews: [],
    dmNotes: '',
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
    return raw ? JSON.parse(raw) : [];
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


