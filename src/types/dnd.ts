export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScore {
  score: number;
  modifier: number;
  saveProficient: boolean;
  saveCustomBonus?: number;
}

export type SkillProficiencyLevel = 'none' | 'half' | 'proficient' | 'expertise';

export interface Skill {
  name: string;
  namePt: string;
  ability: AbilityName;
  proficiency: SkillProficiencyLevel;
  customBonus?: number;
}

export interface ExtraDamageEntry {
  id: string;
  damage: string; // e.g. "1d6", "2", "2d4"
  damageType: string; // e.g. "Fogo", "Elétrico", "Balístico", "Radiante"
}

export interface WeaponAttack {
  id: string;
  name: string;
  damage: string; // e.g. "1d4", "1d8"
  critical?: number; // e.g. 20 ou 19
  multiplier?: number; // e.g. 2 ou 3
  attackBonus: number; // e.g. 0 ou +5
  damageType: string; // e.g. "Balístico", "Cortante", "Perfurante"
  range?: string; // e.g. "-", "9m", "Curto"
  skill?: string; // e.g. "Luta", "Pontaria", "Atletismo"
  damageAbility?: string; // e.g. "Força", "Destreza", "Nenhum"
  extraDamage?: ExtraDamageEntry[];
  advantageLevel?: number; // > 0 = vantagens extras, < 0 = desvantagens
  fixedBonus?: number; // Bônus fixo
  notes?: string;
  imageUrl?: string;
  isHomebrew?: boolean;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = Truque (Cantrip), 1-9
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
  damageFormula?: string;
  isHomebrew?: boolean;
}

export interface HomebrewItem {
  id: string;
  name: string;
  category: 'trait' | 'spell' | 'item' | 'rule' | 'class_feature';
  description: string;
  mechanics?: string;
  author?: string;
  createdAt: string;
}

export interface MulticlassEntry {
  id: string;
  className: string;
  level: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weightKg: number; // Peso unitário em kg (ex: 0.5, 1, 3.5)
  category?: 'Geral' | 'Arma' | 'Armadura' | 'Poção' | 'Ferramenta' | 'Ração' | 'Tesouro' | 'Outro';
  equipped?: boolean;
  description?: string;
}

export interface CharacterFeature {
  id: string;
  name: string;
  description: string;
  source?: string;
  cost?: string;
  isExpanded?: boolean;
}

export interface CharacterSheet {
  id: string;
  campaignId?: string; // Linked campaign
  avatarUrl?: string; // Optional character avatar portrait
  playerName: string;
  characterName: string;
  primaryClass?: string; // e.g. "Guerreiro"
  classAndLevel: string; // e.g. "Guerreiro 5 / Bruxo 3"
  level: number; // Nível da classe principal ou total
  multiclasses?: MulticlassEntry[]; // Classes adicionais
  background: string;
  race: string;
  alignment: string;
  experiencePoints: number;

  // Core stats
  abilities: Record<AbilityName, AbilityScore>;
  proficiencyBonus: number; // calculated from level, but can have override
  passivePerception: number;
  inspiration?: boolean;

  // Combat
  armorClass: number;
  armorClassType?: string; // e.g. "Cota de Malha + Escudo"
  armorClassEquip?: number; // Bônus de equipamento/armadura
  armorClassOther?: number; // Outros bônus (escudo, magias, itens)
  initiative: number;
  initiativeBonus?: number; // Custom bonus for initiative (Alert feat, items)
  passivePerceptionBonus?: number; // Custom bonus for passive perception (Observant feat, items)
  speed: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDiceTotal: string; // e.g. "5d10"
  hitDiceCurrent: string;
  deathSaves: {
    successes: number; // 0-3
    failures: number; // 0-3
  };
  isDead?: boolean;

  // Attacks
  attacks: WeaponAttack[];

  // Skills
  skills: Record<string, Skill>;

  // Spells
  spellcastingAbility?: AbilityName;
  spellSaveDc?: number;
  spellSaveDcBonus?: number; // Bônus customizado para CD de salvaguarda de magia
  spellAttackBonus?: number;
  spellAttackCustomBonus?: number; // Bônus customizado para Ataque Mágico
  spellSlots: SpellSlot[];
  spells: Spell[];

  // Flavor & Story
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory?: string;
  featuresAndTraits: string; // Traços e características
  featuresList?: CharacterFeature[]; // Lista estruturada de cards de habilidades
  proficienciesAndLanguages: string; // Idiomas e outras proficiências
  equipment: string; // Equipamentos
  inventoryList?: InventoryItem[]; // Gerenciador estruturado de inventário com peso em kg
  maxWeightBonus?: number; // Bônus adicional de capacidade de carga em kg (mochila de carga, magias)
  coins: {
    pc: number; // Peças de Cobre
    pp: number; // Peças de Prata
    pe: number; // Peças de Electro
    po: number; // Peças de Ouro
    pl: number; // Peças de Platina
  };

  // Homebrew customizations
  homebrews: HomebrewItem[];
  dmNotes?: string; // Visible and editable by the DM
  cardOrder?: string[]; // Personalização da ordem/layout dos cards por drag-and-drop
  cardColumns?: string[][]; // Distribuição dos cards em colunas verticais independentes (Masonry/Stack)
  activeConditions?: string[]; // Condições ativas de D&D 5e
  exhaustionLevel?: number; // Nível de exaustão (0 a 6)

  updatedAt: string;
  createdAt: string;
}

export interface SessionEvent {
  id: string;
  timestamp: string;
  inGameTime?: string;
  title: string;
  description: string;
  authorName: string;
  authorRole: 'dm' | 'player';
  category?: 'combat' | 'lore' | 'loot' | 'roleplay' | 'milestone';
}

export interface SessionLog {
  id: string;
  campaignId: string;
  sessionNumber: number;
  realDate: string;
  inGameDate?: string;
  title: string;
  location?: string;
  summary: string;
  events: SessionEvent[];
  xpAwarded?: number;
  lootAwarded?: string;
  authorName: string;
  authorRole: 'dm' | 'player';
  createdAt: string;
}

export interface CampaignMember {
  id: string;
  characterId: string;
  playerName: string;
  characterName: string;
  characterClass: string;
  characterLevel: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  passivePerception: number;
  role: 'dm' | 'player';
  joinedAt: string;
}

export interface Campaign {
  id: string;
  code: string; // 8-character unique alphanumeric code, e.g. "DRG5-9X2P"
  name: string;
  description: string;
  bannerUrl?: string; // Optional campaign atmosphere artwork
  dmName: string;
  dmUserId?: string;
  setting: string;
  createdAt: string;
  members: CampaignMember[];
  sessionLogs: SessionLog[];
}

export interface DamageBreakdown {
  amount: number;
  damageType: string;
  rolls?: number[];
  expression?: string;
}

export interface DiceRollResult {
  id: string;
  timestamp: string;
  rollerName: string;
  expression: string; // e.g. "1d20 + 5 [Vantagem x3]"
  rolls: number[]; // Todos os dados rolados (sem limite de 2 dados!)
  modifier: number;
  total: number;
  isCritical?: boolean;
  isFumble?: boolean;
  label?: string; // e.g. "Ataque com Espada Longa"
  advantageType?: 'normal' | 'advantage' | 'disadvantage';
  advantageCount?: number; // Quantidade de dados extras (ex: 2 = 3 dados no total)
  disadvantageCount?: number;
  keptRoll?: number;
  fixedBonus?: number;
  damageBreakdown?: DamageBreakdown[];
}

export interface SavedRollShortcut {
  id: string;
  label: string;
  expression: string;
  damageExpression?: string; // e.g. "1d8+3 [Balístico] + 1d6 [Fogo]"
  advantageType?: 'normal' | 'advantage' | 'disadvantage';
  advantageCount?: number; // Quantidade de vantagens extras (e.g. 1, 2, 3...)
  disadvantageCount?: number; // Quantidade de desvantagens extras
  fixedBonus?: number; // Bônus fixo
  bonus?: number;
  diceCount?: number;
  diceSides?: number;
  critical?: number;
  multiplier?: number;
  damageType?: string;
  extraDamages?: ExtraDamageEntry[];
  range?: string;
  skill?: string;
  damageAbility?: string;
  notes?: string;
}

