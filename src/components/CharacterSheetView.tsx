import React, { useState, useMemo, useCallback } from 'react';
import {
  CharacterSheet,
  AbilityName,
  SkillProficiencyLevel,
  WeaponAttack,
  Spell,
  HomebrewItem,
  MulticlassEntry,
  SavedRollShortcut,
  ExtraDamageEntry,
  CharacterFeature,
  InventoryItem,
} from '../types/dnd';
import {
  getSavedRollShortcuts,
  saveRollShortcuts,
} from '../services/storage';
import {
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateSkillBonus,
  calculateSavingThrowBonus,
  calculatePassivePerception,
  calculateSpellSaveDc,
  calculateSpellAttackBonus,
  formatModifier,
  DEFAULT_5E_SKILLS,
  ALL_DND_DAMAGE_TYPES,
} from '../utils/dndRules';
import {
  Shield,
  Heart,
  Zap,
  Footprints,
  Eye,
  Plus,
  Trash2,
  Sparkles,
  Dices,
  Crown,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Skull,
  ArrowLeft,
  Camera,
  Layers,
  X,
  PlusCircle,
  Minus,
  Edit2,
  Check,
  Swords,
  BookOpen,
  Backpack,
  ScrollText,
  Star,
  Target,
  Flame,
  ChevronDown,
  ChevronUp,
  User,
  GripVertical,
  Move,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';

export const STANDARD_5E_ALIGNMENTS = [
  'Leal e Bom',
  'Neutro e Bom',
  'Caótico e Bom',
  'Leal e Neutro',
  'Neutro Verdadeiro',
  'Caótico e Neutro',
  'Leal e Mau',
  'Neutro e Mau',
  'Caótico e Mau',
  'Sem Tendência (Não Alinhado)',
];

export const STANDARD_5E_BACKGROUNDS = [
  'Acólito',
  'Artesão de Guilda',
  'Artista',
  'Charlatão',
  'Criminoso',
  'Eremita',
  'Forasteiro',
  'Herói do Povo',
  'Marinheiro',
  'Nobre',
  'Órfão',
  'Sábio',
  'Soldado',
  'Gladiador',
  'Cavaleiro',
  'Espião',
  'Personalizado / Homebrew',
];

export const STANDARD_5E_CLASSES = [
  'Bárbaro',
  'Bardo',
  'Bruxo',
  'Clérigo',
  'Druida',
  'Feiticeiro',
  'Guerreiro',
  'Ladino',
  'Mago',
  'Monge',
  'Paladino',
  'Patrulheiro',
  'Artífice',
  'Personalizado',
];

interface CharacterSheetViewProps {
  character: CharacterSheet;
  onUpdateCharacter: (updated: CharacterSheet) => void;
  allCharacters: CharacterSheet[];
  onSelectCharacterId: (id: string) => void;
  onCreateNewCharacter: () => void;
  onBackToList?: () => void;
  userRole: 'dm' | 'player';
  onQuickRoll: (expression: string, label: string) => void;
  onOpenDriveModal: () => void;
  onOpenMysqlModal?: () => void;
}

export const CharacterSheetView: React.FC<CharacterSheetViewProps> = ({
  character,
  onUpdateCharacter,
  allCharacters,
  onSelectCharacterId,
  onCreateNewCharacter,
  onBackToList,
  userRole,
  onQuickRoll,
  onOpenDriveModal,
  onOpenMysqlModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'combat' | 'traits' | 'spells' | 'inventory' | 'bio'>('combat');
  const [quickDiceFormula, setQuickDiceFormula] = useState<string>('1d20+5');

  // Helper function to modify stackable advantage / disadvantage levels in free roller formula without auto-rolling
  const modifyAdvantageInFormula = (currentFormula: string, action: 'advantage' | 'disadvantage' | 'clear'): string => {
    const raw = currentFormula.trim();
    const baseExpr = raw.replace(/\s*\[.*?\]/g, '').trim() || '1d20';

    if (action === 'clear') {
      return baseExpr;
    }

    const advMatch = raw.match(/\[?\s*(?:(\d+)\s*x?\s*vantag(?:em|ens)?|vantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i);
    const disMatch = raw.match(/\[?\s*(?:(\d+)\s*x?\s*desvantag(?:em|ens)?|desvantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i);

    let curAdvCount = 0;
    let curDisCount = 0;

    if (disMatch) {
      curDisCount = Math.max(1, parseInt(disMatch[1] || disMatch[2] || '1', 10));
    } else if (advMatch) {
      curAdvCount = Math.max(1, parseInt(advMatch[1] || advMatch[2] || '1', 10));
    }

    if (action === 'advantage') {
      if (curDisCount > 0) {
        const nextDis = curDisCount - 1;
        if (nextDis === 0) return baseExpr;
        return `${baseExpr} [${nextDis > 1 ? `${nextDis} Desvantagens` : 'Desvantagem'}]`;
      } else {
        const nextAdv = curAdvCount + 1;
        return `${baseExpr} [${nextAdv > 1 ? `${nextAdv} Vantagens` : 'Vantagem'}]`;
      }
    } else {
      if (curAdvCount > 0) {
        const nextAdv = curAdvCount - 1;
        if (nextAdv === 0) return baseExpr;
        return `${baseExpr} [${nextAdv > 1 ? `${nextAdv} Vantagens` : 'Vantagem'}]`;
      } else {
        const nextDis = curDisCount + 1;
        return `${baseExpr} [${nextDis > 1 ? `${nextDis} Desvantagens` : 'Desvantagem'}]`;
      }
    }
  };

  const getAdvDisCounts = (formula: string) => {
    const advMatch = formula.match(/\[?\s*(?:(\d+)\s*x?\s*vantag(?:em|ens)?|vantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i);
    const disMatch = formula.match(/\[?\s*(?:(\d+)\s*x?\s*desvantag(?:em|ens)?|desvantag(?:em|ens)?(?:\s*x|\s*:|\s*\+|\s*)?\s*(\d+)?)\s*\]?/i);
    let adv = 0;
    let dis = 0;
    if (disMatch) {
      dis = Math.max(1, parseInt(disMatch[1] || disMatch[2] || '1', 10));
    } else if (advMatch) {
      adv = Math.max(1, parseInt(advMatch[1] || advMatch[2] || '1', 10));
    }
    return { adv, dis };
  };
  const [hpChangeAmount, setHpChangeAmount] = useState<number>(5);
  const [tempHpAmount, setTempHpAmount] = useState<number>(5);
  const [showMulticlassModal, setShowMulticlassModal] = useState<boolean>(false);
  const [newMulticlassName, setNewMulticlassName] = useState<string>('Bruxo');
  const [newMulticlassLevel, setNewMulticlassLevel] = useState<number>(1);
  const [isEditingAvatar, setIsEditingAvatar] = useState<boolean>(false);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string>(character.avatarUrl || '');
  const [showAttributesEditModal, setShowAttributesEditModal] = useState<boolean>(false);
  const [skillTabFilter, setSkillTabFilter] = useState<'all' | 'skills' | 'saves'>('all');
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');
  const [savedShortcuts, setSavedShortcuts] = useState<SavedRollShortcut[]>(() => getSavedRollShortcuts());
  
  // Floating Modal State for C.R.I.S. Attacks, Multi-Dice, Stackable Advantages and Extra Damage Types
  const [showCrisAttackModal, setShowCrisAttackModal] = useState<boolean>(false);
  const [editingAttackId, setEditingAttackId] = useState<string | null>(null);
  const [modalAttackName, setModalAttackName] = useState<string>('Novo Ataque');
  const [modalDamage, setModalDamage] = useState<string>('1d4');
  const [modalCritical, setModalCritical] = useState<number>(20);
  const [modalMultiplier, setModalMultiplier] = useState<number>(2);
  const [modalAttackBonus, setModalAttackBonus] = useState<number>(0);
  const [modalDamageType, setModalDamageType] = useState<string>('Balístico');
  const [modalRange, setModalRange] = useState<string>('-');
  const [modalSkill, setModalSkill] = useState<string>('Luta');
  const [modalDamageAbility, setModalDamageAbility] = useState<string>('Força');
  const [modalFixedBonus, setModalFixedBonus] = useState<number>(0);
  const [modalAdvantageCount, setModalAdvantageCount] = useState<number>(0);
  const [modalDisadvantageCount, setModalDisadvantageCount] = useState<number>(0);
  const [modalExtraDamages, setModalExtraDamages] = useState<ExtraDamageEntry[]>([]);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');
  const [modalSaveAsShortcut, setModalSaveAsShortcut] = useState<boolean>(true);

  // Dedicated Floating Modal State for "Salvar Rolagem" (Generic Non-Attack Dice Shortcuts)
  const [showSaveRollShortcutModal, setShowSaveRollShortcutModal] = useState<boolean>(false);
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [shortcutName, setShortcutName] = useState<string>('Nova Rolagem');
  const [shortcutFormula, setShortcutFormula] = useState<string>('1d20+5');
  const [shortcutAdvantageCount, setShortcutAdvantageCount] = useState<number>(0);
  const [shortcutDisadvantageCount, setShortcutDisadvantageCount] = useState<number>(0);
  const [shortcutNotes, setShortcutNotes] = useState<string>('');

  const handleOpenCreateShortcutModal = () => {
    setEditingShortcutId(null);
    setShortcutName('Nova Rolagem');
    setShortcutFormula('1d20+5');
    setShortcutAdvantageCount(0);
    setShortcutDisadvantageCount(0);
    setShortcutNotes('');
    setShowSaveRollShortcutModal(true);
  };

  const handleOpenEditShortcutModal = (sc: SavedRollShortcut) => {
    setEditingShortcutId(sc.id);
    setShortcutName(sc.label || 'Rolagem Salva');
    setShortcutFormula(sc.expression || '1d20');
    setShortcutAdvantageCount(sc.advantageCount || 0);
    setShortcutDisadvantageCount(sc.disadvantageCount || 0);
    setShortcutNotes(sc.notes || '');
    setShowSaveRollShortcutModal(true);
  };

  const handleSaveShortcutModal = (rollImmediately = false) => {
    const label = shortcutName.trim() || 'Rolagem Salva';
    let expr = shortcutFormula.trim() || '1d20';

    if (!expr.includes('[Vantag') && !expr.includes('[Desvantag')) {
      if (shortcutAdvantageCount > 0) {
        expr = `${expr} [${shortcutAdvantageCount > 1 ? `${shortcutAdvantageCount} Vantagens` : 'Vantagem'}]`;
      } else if (shortcutDisadvantageCount > 0) {
        expr = `${expr} [${shortcutDisadvantageCount > 1 ? `${shortcutDisadvantageCount} Desvantagens` : 'Desvantagem'}]`;
      }
    }

    const newShortcut: SavedRollShortcut = {
      id: editingShortcutId || `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label,
      expression: expr,
      advantageCount: shortcutAdvantageCount > 0 ? shortcutAdvantageCount : undefined,
      disadvantageCount: shortcutDisadvantageCount > 0 ? shortcutDisadvantageCount : undefined,
      notes: shortcutNotes.trim() || undefined,
    };

    const updated = editingShortcutId
      ? savedShortcuts.map((sc) => (sc.id === editingShortcutId ? newShortcut : sc))
      : [...savedShortcuts, newShortcut];

    setSavedShortcuts(updated);
    saveRollShortcuts(updated);
    setShowSaveRollShortcutModal(false);

    if (rollImmediately) {
      onQuickRoll(expr, label);
    }
  };

  // Inventory Manager State (Gerenciador de Inventário com Peso em kg e Contagem Automática)
  const [showInventoryItemModal, setShowInventoryItemModal] = useState<boolean>(false);
  const [editingInventoryItemId, setEditingInventoryItemId] = useState<string | null>(null);
  const [inventoryItemName, setInventoryItemName] = useState<string>('');
  const [inventoryItemQuantity, setInventoryItemQuantity] = useState<number>(1);
  const [inventoryItemWeightKg, setInventoryItemWeightKg] = useState<number>(0.5);
  const [inventoryItemCategory, setInventoryItemCategory] = useState<'Geral' | 'Arma' | 'Armadura' | 'Poção' | 'Ferramenta' | 'Ração' | 'Tesouro' | 'Outro'>('Geral');
  const [inventoryItemEquipped, setInventoryItemEquipped] = useState<boolean>(false);
  const [inventoryItemDescription, setInventoryItemDescription] = useState<string>('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [collapsedInventoryItemIds, setCollapsedInventoryItemIds] = useState<Record<string, boolean>>({});

  // Helper to resolve inventory list from character or parse equipment string
  const inventoryItemsList: InventoryItem[] = useMemo(() => {
    if (character.inventoryList && Array.isArray(character.inventoryList) && character.inventoryList.length > 0) {
      return character.inventoryList;
    }
    if (!character.equipment || !character.equipment.trim()) {
      return [];
    }
    const lines = character.equipment.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.length > 0);
    return lines.map((line, idx) => {
      const qtyMatch = line.match(/\(?(\d+)\s*x\)?/i) || line.match(/^(\d+)\s+/i);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      const cleanName = line.replace(/\(?\d+\s*x\)?/gi, '').replace(/^\d+\s+/gi, '').replace(/\[.*?\]/g, '').replace(/\(Equipado\)/gi, '').trim();

      let cat: 'Geral' | 'Arma' | 'Armadura' | 'Poção' | 'Ferramenta' | 'Ração' | 'Tesouro' | 'Outro' = 'Geral';
      let weight = 0.5;
      if (/espada|machado|arco|adaga|lança|maça|besta|tridente|foice/i.test(cleanName)) {
        cat = 'Arma';
        weight = 1.5;
      } else if (/cota|armadura|couro|placas|escudo|gibão|elmo/i.test(cleanName)) {
        cat = 'Armadura';
        weight = 3.0;
      } else if (/poção|elixir|antídoto|frasco|tônico/i.test(cleanName)) {
        cat = 'Poção';
        weight = 0.25;
      } else if (/ração|comida|alimento|pão|queijo/i.test(cleanName)) {
        cat = 'Ração';
        weight = 0.5;
      }

      return {
        id: `parsed_inv_${idx}_${Date.now()}`,
        name: cleanName || line,
        quantity: qty > 0 ? qty : 1,
        weightKg: weight,
        category: cat,
        equipped: /equipado/i.test(line),
      };
    });
  }, [character.inventoryList, character.equipment]);

  // Synchronize inventory list back to character state & equipment summary text for complete backward compatibility
  const handleUpdateInventoryItems = (newList: InventoryItem[]) => {
    const summaryText = newList
      .map((item) => {
        const eqTag = item.equipped ? ' (Equipado)' : '';
        const qtyTag = item.quantity > 1 ? ` (${item.quantity}x)` : '';
        const weightTag = item.weightKg > 0 ? ` [${item.weightKg * item.quantity}kg]` : '';
        return `${item.name}${qtyTag}${weightTag}${eqTag}`;
      })
      .join(', ');

    onUpdateCharacter({
      ...character,
      inventoryList: newList,
      equipment: summaryText,
    });
  };

  const handleOpenCreateInventoryItemModal = () => {
    setEditingInventoryItemId(null);
    setInventoryItemName('');
    setInventoryItemQuantity(1);
    setInventoryItemWeightKg(0.5);
    setInventoryItemCategory('Geral');
    setInventoryItemEquipped(false);
    setInventoryItemDescription('');
    setShowInventoryItemModal(true);
  };

  const handleOpenEditInventoryItemModal = (item: InventoryItem) => {
    setEditingInventoryItemId(item.id);
    setInventoryItemName(item.name || '');
    setInventoryItemQuantity(item.quantity || 1);
    setInventoryItemWeightKg(item.weightKg ?? 0.5);
    setInventoryItemCategory(item.category || 'Geral');
    setInventoryItemEquipped(!!item.equipped);
    setInventoryItemDescription(item.description || '');
    setShowInventoryItemModal(true);
  };

  const handleSaveInventoryItemModal = () => {
    const name = inventoryItemName.trim() || 'Novo Item';
    const quantity = Math.max(1, inventoryItemQuantity);
    const weightKg = Math.max(0, inventoryItemWeightKg);

    const newItem: InventoryItem = {
      id: editingInventoryItemId || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      quantity,
      weightKg,
      category: inventoryItemCategory,
      equipped: inventoryItemEquipped,
      description: inventoryItemDescription.trim() || undefined,
    };

    const updated = editingInventoryItemId
      ? inventoryItemsList.map((item) => (item.id === editingInventoryItemId ? newItem : item))
      : [...inventoryItemsList, newItem];

    handleUpdateInventoryItems(updated);
    setShowInventoryItemModal(false);
  };

  const handleDeleteInventoryItem = (id: string) => {
    const updated = inventoryItemsList.filter((item) => item.id !== id);
    handleUpdateInventoryItems(updated);
  };

  const handleToggleEquippedInventoryItem = (id: string) => {
    const updated = inventoryItemsList.map((item) =>
      item.id === id ? { ...item, equipped: !item.equipped } : item
    );
    handleUpdateInventoryItems(updated);
  };

  const handleAdjustQuantityInventoryItem = (id: string, delta: number) => {
    const updated = inventoryItemsList
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as InventoryItem[];
    handleUpdateInventoryItems(updated);
  };

  // Spell Manager State (Gerenciador de Magias e Espaços de Conjuração do 1º ao 9º Nível)
  const [showSpellModal, setShowSpellModal] = useState<boolean>(false);
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [spellName, setSpellName] = useState<string>('');
  const [spellLevel, setSpellLevel] = useState<number>(1);
  const [spellSchool, setSpellSchool] = useState<string>('Evocação');
  const [spellCastingTime, setSpellCastingTime] = useState<string>('1 Ação');
  const [spellRange, setSpellRange] = useState<string>('18m');
  const [spellComponents, setSpellComponents] = useState<string>('V, S');
  const [spellDuration, setSpellDuration] = useState<string>('Instantâneo');
  const [spellDescription, setSpellDescription] = useState<string>('');
  const [spellPrepared, setSpellPrepared] = useState<boolean>(true);
  const [spellDamageFormula, setSpellDamageFormula] = useState<string>('');
  const [spellSearchQuery, setSpellSearchQuery] = useState<string>('');
  const [spellLevelFilter, setSpellLevelFilter] = useState<string>('all');
  const [collapsedSpellIds, setCollapsedSpellIds] = useState<Record<string, boolean>>({});

  const normalizeCardId = (id: string): string => {
    const map: Record<string, string> = {
      atributos: 'atributos',
      attributes: 'atributos',
      recursos: 'recursos',
      vitalidade: 'recursos',
      vitality: 'recursos',
      defesa: 'defesa',
      defense: 'defesa',
      pericias: 'pericias',
      savings: 'pericias',
      skills: 'pericias',
      combate: 'combate',
      combat: 'combate',
      habilidades: 'habilidades',
      traits: 'habilidades',
      magias: 'magias',
      spells: 'magias',
      inventario: 'inventario',
      inventory: 'inventario',
      biografia: 'biografia',
      bio: 'biografia',
      atalhos: 'atalhos',
      shortcuts: 'atalhos',
    };
    return map[id.toLowerCase()] || id;
  };

  const getCardTitle = (rawCardId: string): string => {
    const cardId = normalizeCardId(rawCardId);
    switch (cardId) {
      case 'atributos': return 'Atributos';
      case 'recursos': return 'Recursos Vitais';
      case 'defesa': return 'Defesa & Movimento';
      case 'pericias': return 'Perícias & Salvaguardas';
      case 'combate': return 'Combate & Ataques';
      case 'habilidades': return 'Habilidades';
      case 'magias': return 'Magias';
      case 'inventario': return 'Inventário';
      case 'biografia': return 'Biografia';
      case 'condicoes': return 'Condições';
      case 'atalhos': return 'Mesa de Dados & Atalhos';
      default: return cardId;
    }
  };

  // Lista padrão de cards para reordenação na visualização da ficha
  const DEFAULT_CARD_ORDER = useMemo(() => [
    'atributos',
    'recursos',
    'defesa',
    'pericias',
    'combate',
    'habilidades',
    'magias',
    'inventario',
    'biografia',
    'condicoes',
    'atalhos',
  ], []);

  const DEFAULT_CARD_COLUMNS = useMemo(() => [
    ['atributos', 'recursos', 'defesa'],
    ['pericias', 'combate', 'condicoes', 'atalhos'],
    ['habilidades', 'magias', 'inventario', 'biografia'],
  ], []);

  // Estado puramente manual das 3 colunas independentes
  const [cardColumns, setCardColumns] = useState<string[][]>(() => {
    // 1. Verificar se character.cardColumns existe e é válido
    if (character.cardColumns && Array.isArray(character.cardColumns) && character.cardColumns.length === 3) {
      const cols = character.cardColumns.map((col) =>
        Array.isArray(col) ? col.map(normalizeCardId).filter((id) => DEFAULT_CARD_ORDER.includes(id)) : []
      );
      const present = new Set(cols.flat());
      const missing = DEFAULT_CARD_ORDER.filter((id) => !present.has(id));
      if (missing.length > 0) {
        cols[2] = [...cols[2], ...missing];
      }
      return cols;
    }

    // 2. Verificar localStorage
    try {
      const saved = localStorage.getItem(`cris_card_columns_${character.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          const cols = parsed.map((col: any) =>
            Array.isArray(col) ? col.map(normalizeCardId).filter((id: string) => DEFAULT_CARD_ORDER.includes(id)) : []
          );
          const present = new Set(cols.flat());
          const missing = DEFAULT_CARD_ORDER.filter((id) => !present.has(id));
          if (missing.length > 0) {
            cols[2] = [...cols[2], ...missing];
          }
          return cols;
        }
      }
    } catch (e) {
      // Ignorar erro
    }

    return DEFAULT_CARD_COLUMNS;
  });

  const [cardOrder, setCardOrder] = useState<string[]>(() => cardColumns.flat());

  // Salvar colunas no estado do personagem e localStorage
  const updateColumns = (newCols: string[][]) => {
    const present = new Set<string>();
    const cleanedCols: string[][] = [[], [], []];

    newCols.forEach((col, cIdx) => {
      col.forEach((rawId) => {
        const norm = normalizeCardId(rawId);
        if (DEFAULT_CARD_ORDER.includes(norm) && !present.has(norm)) {
          present.add(norm);
          cleanedCols[cIdx].push(norm);
        }
      });
    });

    const missing = DEFAULT_CARD_ORDER.filter((id) => !present.has(id));
    if (missing.length > 0) {
      cleanedCols[2] = [...cleanedCols[2], ...missing];
    }

    setCardColumns(cleanedCols);
    const flatOrder = cleanedCols.flat();
    setCardOrder(flatOrder);

    try {
      localStorage.setItem(`cris_card_columns_${character.id}`, JSON.stringify(cleanedCols));
      localStorage.setItem(`cris_card_order_${character.id}`, JSON.stringify(flatOrder));
    } catch (e) {
      // Ignorar erro
    }

    onUpdateCharacter({
      ...character,
      cardColumns: cleanedCols,
      cardOrder: flatOrder,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResetCardOrder = () => {
    updateColumns(DEFAULT_CARD_COLUMNS);
  };

  const [isLayoutEditing, setIsLayoutEditing] = useState<boolean>(false);
  const isEditingLayout = isLayoutEditing;
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const [selectedCardForSwap, setSelectedCardForSwap] = useState<string | null>(null);

  const handleSelectCardForSwap = (rawTargetCardId: string) => {
    const targetCardId = normalizeCardId(rawTargetCardId);
    if (!selectedCardForSwap) {
      setSelectedCardForSwap(targetCardId);
    } else if (selectedCardForSwap === targetCardId) {
      setSelectedCardForSwap(null);
    } else {
      const sourceCardId = selectedCardForSwap;
      let sCol = -1, sIdx = -1, tCol = -1, tIdx = -1;
      for (let c = 0; c < cardColumns.length; c++) {
        const si = cardColumns[c].findIndex((id) => normalizeCardId(id) === sourceCardId);
        if (si !== -1) { sCol = c; sIdx = si; }
        const ti = cardColumns[c].findIndex((id) => normalizeCardId(id) === targetCardId);
        if (ti !== -1) { tCol = c; tIdx = ti; }
      }

      if (sCol !== -1 && tCol !== -1) {
        const newCols = cardColumns.map((col) => [...col]);
        const temp = newCols[sCol][sIdx];
        newCols[sCol][sIdx] = newCols[tCol][tIdx];
        newCols[tCol][tIdx] = temp;
        updateColumns(newCols);
      }
      setSelectedCardForSwap(null);
    }
  };

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'combat' | 'traits' | 'spells' | 'inventory' | 'bio'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    atributos: false,
    attributes: false,
    defesa: false,
    defense: false,
    recursos: false,
    vitality: false,
    savings: false,
    pericias: false,
    skills: false,
    combate: false,
    combat: false,
    habilidades: false,
    traits: false,
    magias: false,
    spells: false,
    inventario: false,
    inventory: false,
    biografia: false,
    bio: false,
    atalhos: false,
    shortcuts: false,
  });

  const isCardCollapsed = (cardId: string): boolean => {
    const norm = normalizeCardId(cardId);
    const aliasMap: Record<string, string> = {
      atributos: 'attributes',
      recursos: 'vitality',
      defesa: 'defense',
      pericias: 'skills',
      combate: 'combat',
      habilidades: 'traits',
      magias: 'spells',
      inventario: 'inventory',
      biografia: 'bio',
      atalhos: 'shortcuts',
    };
    const alias = aliasMap[norm] || norm;
    return Boolean(collapsedCategories[norm] || collapsedCategories[alias]);
  };

  const handleToggleCategoryCollapse = (cardId: string) => {
    const norm = normalizeCardId(cardId);
    const aliasMap: Record<string, string> = {
      atributos: 'attributes',
      recursos: 'vitality',
      defesa: 'defense',
      pericias: 'skills',
      combate: 'combat',
      habilidades: 'traits',
      magias: 'spells',
      inventario: 'inventory',
      biografia: 'bio',
      atalhos: 'shortcuts',
    };
    const alias = aliasMap[norm] || norm;
    setCollapsedCategories((prev) => {
      const current = Boolean(prev[norm] || prev[alias]);
      return {
        ...prev,
        [norm]: !current,
        [alias]: !current,
      };
    });
  };

  const handleExpandAllCategories = () => {
    setCollapsedCategories({
      atributos: false,
      attributes: false,
      defesa: false,
      defense: false,
      recursos: false,
      vitality: false,
      savings: false,
      pericias: false,
      skills: false,
      combate: false,
      combat: false,
      habilidades: false,
      traits: false,
      magias: false,
      spells: false,
      inventario: false,
      inventory: false,
      biografia: false,
      bio: false,
      atalhos: false,
      shortcuts: false,
    });
  };

  const handleCollapseAllCategories = () => {
    setCollapsedCategories({
      atributos: true,
      attributes: true,
      defesa: true,
      defense: true,
      recursos: true,
      vitality: true,
      savings: true,
      pericias: true,
      skills: true,
      combate: true,
      combat: true,
      habilidades: true,
      traits: true,
      magias: true,
      spells: true,
      inventario: true,
      inventory: true,
      biografia: true,
      bio: true,
      atalhos: true,
      shortcuts: true,
    });
  };

  const handleMoveCard = (cardId: string, direction: 'up' | 'down') => {
    const norm = normalizeCardId(cardId);
    let curCol = -1, curIdx = -1;
    for (let c = 0; c < cardColumns.length; c++) {
      const idx = cardColumns[c].findIndex((id) => normalizeCardId(id) === norm);
      if (idx !== -1) { curCol = c; curIdx = idx; break; }
    }
    if (curCol === -1) return;

    const newCols = cardColumns.map((col) => [...col]);
    if (direction === 'up' && curIdx > 0) {
      const temp = newCols[curCol][curIdx];
      newCols[curCol][curIdx] = newCols[curCol][curIdx - 1];
      newCols[curCol][curIdx - 1] = temp;
      updateColumns(newCols);
    } else if (direction === 'down' && curIdx < newCols[curCol].length - 1) {
      const temp = newCols[curCol][curIdx];
      newCols[curCol][curIdx] = newCols[curCol][curIdx + 1];
      newCols[curCol][curIdx + 1] = temp;
      updateColumns(newCols);
    }
  };

  // Drag and Drop (DND) Event Handlers com Preview Nítido e Preservação de Conteúdo
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    if (!isEditingLayout) return;
    const norm = normalizeCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', norm);

    // Snapshot limpo do card nativo antes de aplicar a opacidade reduzida no DOM
    const cardEl = document.getElementById(`card-${norm}`);
    if (cardEl && e.dataTransfer.setDragImage) {
      const rect = cardEl.getBoundingClientRect();
      const offsetX = Math.min(Math.max(e.clientX - rect.left, 24), Math.max(rect.width / 2, 40));
      const offsetY = Math.min(Math.max(e.clientY - rect.top, 20), 40);
      e.dataTransfer.setDragImage(cardEl, offsetX, offsetY);
    }

    setTimeout(() => {
      setDraggedCardId(norm);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    if (!isEditingLayout) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const norm = normalizeCardId(cardId);
    if (dragOverCardId !== norm) {
      setDragOverCardId(norm);
    }
  };

  const handleDragOverColumn = (e: React.DragEvent, colIdx: number) => {
    if (!isEditingLayout) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColIdx !== colIdx) {
      setDragOverColIdx(colIdx);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    if (!isEditingLayout) return;
    e.preventDefault();
    e.stopPropagation();
    const sourceCardId = draggedCardId || e.dataTransfer.getData('text/plain');
    const normSource = normalizeCardId(sourceCardId || '');
    const normTarget = normalizeCardId(targetCardId);

    setDraggedCardId(null);
    setDragOverCardId(null);
    setDragOverColIdx(null);

    if (!normSource || normSource === normTarget) return;

    let sCol = -1, sIdx = -1, tCol = -1, tIdx = -1;
    for (let c = 0; c < cardColumns.length; c++) {
      const si = cardColumns[c].findIndex((id) => normalizeCardId(id) === normSource);
      if (si !== -1) { sCol = c; sIdx = si; }
      const ti = cardColumns[c].findIndex((id) => normalizeCardId(id) === normTarget);
      if (ti !== -1) { tCol = c; tIdx = ti; }
    }

    if (sCol === -1 || tCol === -1) return;

    const newCols = cardColumns.map((col) => [...col]);
    const [moved] = newCols[sCol].splice(sIdx, 1);
    const newTargetIdx = newCols[tCol].findIndex((id) => normalizeCardId(id) === normTarget);
    if (newTargetIdx !== -1) {
      newCols[tCol].splice(newTargetIdx, 0, moved);
    } else {
      newCols[tCol].push(moved);
    }

    updateColumns(newCols);
  };

  const handleDropColumn = (e: React.DragEvent, colIdx: number) => {
    if (!isEditingLayout) return;
    e.preventDefault();
    e.stopPropagation();

    const sourceCardId = draggedCardId || e.dataTransfer.getData('text/plain');
    const normSource = normalizeCardId(sourceCardId || '');

    setDraggedCardId(null);
    setDragOverCardId(null);
    setDragOverColIdx(null);

    if (!normSource) return;

    let sCol = -1, sIdx = -1;
    for (let c = 0; c < cardColumns.length; c++) {
      const si = cardColumns[c].findIndex((id) => normalizeCardId(id) === normSource);
      if (si !== -1) { sCol = c; sIdx = si; break; }
    }

    if (sCol === -1) return;

    const newCols = cardColumns.map((col) => [...col]);
    const [moved] = newCols[sCol].splice(sIdx, 1);
    newCols[colIdx].push(moved);

    updateColumns(newCols);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
    setDragOverColIdx(null);
  };

  // Helper para renderizar o cabeçalho minimalista padronizado para TODOS os cards
  const renderMinimalCardHeader = (
    cardId: string,
    title: string,
    icon: React.ReactNode,
    badge?: React.ReactNode,
    actionButtons?: React.ReactNode
  ) => {
    const isCollapsed = collapsedCategories[cardId] ?? false;

    return (
      <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5 mb-3 select-none">
        <div className="flex items-center gap-2 min-w-0">
          {isLayoutEditing && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                handleDragStart(e, cardId);
              }}
              className="p-1.5 rounded-lg bg-[#24170e] border border-[#c49d48] text-[#e8c679] cursor-grab active:cursor-grabbing hover:bg-[#382619] shadow-[0_0_10px_rgba(196,157,72,0.4)] transition flex-shrink-0 animate-pulse"
              title="Clique e arraste este ícone para reorganizar a posição deste card"
            >
              <GripVertical className="w-4 h-4 text-[#e8c679]" />
            </div>
          )}
          {icon}
          <h3 className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] truncate">
            {title}
          </h3>
          {badge}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {actionButtons}

          {/* Minimamente Minimalista: Apenas o Ícone de Chevron para Reduzir/Expandir */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCategoryCollapse(cardId);
            }}
            className="p-1.5 rounded-lg bg-[#120a06] hover:bg-[#261a12] text-[#c49d48] hover:text-[#f4ecd8] border border-[#54412c] transition cursor-pointer flex items-center justify-center shadow"
            title={isCollapsed ? 'Expandir card' : 'Reduzir card'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-[#c49d48]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#c49d48]" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleOpenCreateSpellModal = () => {
    setEditingSpellId(null);
    setSpellName('');
    setSpellLevel(1);
    setSpellSchool('Evocação');
    setSpellCastingTime('1 Ação');
    setSpellRange('18m');
    setSpellComponents('V, S');
    setSpellDuration('Instantâneo');
    setSpellDescription('');
    setSpellPrepared(true);
    setSpellDamageFormula('');
    setShowSpellModal(true);
  };

  const handleOpenEditSpellModal = (sp: Spell) => {
    setEditingSpellId(sp.id);
    setSpellName(sp.name || '');
    setSpellLevel(sp.level ?? 1);
    setSpellSchool(sp.school || 'Evocação');
    setSpellCastingTime(sp.castingTime || '1 Ação');
    setSpellRange(sp.range || '18m');
    setSpellComponents(sp.components || 'V, S');
    setSpellDuration(sp.duration || 'Instantâneo');
    setSpellDescription(sp.description || '');
    setSpellPrepared(!!sp.prepared);
    setSpellDamageFormula((sp as any).damageFormula || '');
    setShowSpellModal(true);
  };

  const handleSaveSpellModal = () => {
    const name = spellName.trim() || 'Nova Magia';
    const newSpell: Spell = {
      id: editingSpellId || `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      level: spellLevel,
      school: spellSchool.trim() || 'Evocação',
      castingTime: spellCastingTime.trim() || '1 Ação',
      range: spellRange.trim() || 'Pessoal',
      components: spellComponents.trim() || 'V, S',
      duration: spellDuration.trim() || 'Instantâneo',
      description: spellDescription.trim() || '',
      prepared: spellPrepared,
      ...(spellDamageFormula.trim() ? { damageFormula: spellDamageFormula.trim() } : {}),
    } as any;

    const currentSpells = character.spells || [];
    const updated = editingSpellId
      ? currentSpells.map((s) => (s.id === editingSpellId ? newSpell : s))
      : [...currentSpells, newSpell];

    onUpdateCharacter({
      ...character,
      spells: updated,
    });
    setShowSpellModal(false);
  };

  const handleDeleteSpell = (id: string) => {
    const updated = (character.spells || []).filter((s) => s.id !== id);
    onUpdateCharacter({
      ...character,
      spells: updated,
    });
  };

  const handleToggleSpellPrepared = (id: string) => {
    const updated = (character.spells || []).map((s) =>
      s.id === id ? { ...s, prepared: !s.prepared } : s
    );
    onUpdateCharacter({
      ...character,
      spells: updated,
    });
  };

  const handleResetAllSpellSlots = () => {
    const newSlots = Array.from({ length: 9 }, (_, i) => {
      const lvl = i + 1;
      const existing = (character.spellSlots || []).find((s) => s.level === lvl);
      return {
        level: lvl,
        total: existing ? existing.total : (lvl === 1 ? 4 : lvl === 2 ? 3 : lvl === 3 ? 2 : 0),
        used: 0,
      };
    });

    onUpdateCharacter({
      ...character,
      spellSlots: newSlots,
    });
  };

  const handleAdjustSpellSlotUsed = (lvl: number, delta: number) => {
    const currentSlots = Array.from({ length: 9 }, (_, i) => {
      const l = i + 1;
      const existing = (character.spellSlots || []).find((s) => s.level === l);
      return {
        level: l,
        total: existing ? existing.total : (l === 1 ? 4 : l === 2 ? 3 : l === 3 ? 2 : 0),
        used: existing ? existing.used : 0,
      };
    });

    const idx = currentSlots.findIndex((s) => s.level === lvl);
    if (idx >= 0) {
      const current = currentSlots[idx];
      const newUsed = Math.max(0, Math.min(current.total, current.used + delta));
      currentSlots[idx].used = newUsed;
    }

    onUpdateCharacter({
      ...character,
      spellSlots: currentSlots,
    });
  };

  const handleUpdateSpellSlotTotal = (lvl: number, newTotal: number) => {
    const currentSlots = Array.from({ length: 9 }, (_, i) => {
      const l = i + 1;
      const existing = (character.spellSlots || []).find((s) => s.level === l);
      return {
        level: l,
        total: existing ? existing.total : (l === 1 ? 4 : l === 2 ? 3 : l === 3 ? 2 : 0),
        used: existing ? existing.used : 0,
      };
    });

    const idx = currentSlots.findIndex((s) => s.level === lvl);
    if (idx >= 0) {
      const validTotal = Math.max(0, Math.min(20, newTotal));
      currentSlots[idx].total = validTotal;
      if (currentSlots[idx].used > validTotal) {
        currentSlots[idx].used = validTotal;
      }
    }

    onUpdateCharacter({
      ...character,
      spellSlots: currentSlots,
    });
  };

  // Features / Habilidades Cards State
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingFeatureName, setEditingFeatureName] = useState<string>('');
  const [editingFeatureDescription, setEditingFeatureDescription] = useState<string>('');
  const [editingFeatureSource, setEditingFeatureSource] = useState<string>('');
  const [editingFeatureCost, setEditingFeatureCost] = useState<string>('');
  const [editingFeatureHasCost, setEditingFeatureHasCost] = useState<boolean>(false);
  const [featureSearchQuery, setFeatureSearchQuery] = useState<string>('');
  const [collapsedFeatureIds, setCollapsedFeatureIds] = useState<Record<string, boolean>>({});

  // Helper to resolve features list from character or parse raw string
  const featuresList: CharacterFeature[] = useMemo(() => {
    if (character.featuresList && Array.isArray(character.featuresList) && character.featuresList.length > 0) {
      return character.featuresList;
    }
    if (!character.featuresAndTraits || !character.featuresAndTraits.trim()) {
      return [];
    }
    const blocks = character.featuresAndTraits.split(/\n\n+/).filter((b) => b.trim().length > 0);
    if (blocks.length === 1 && character.featuresAndTraits.includes('\n')) {
      const lines = character.featuresAndTraits.split('\n').filter((l) => l.trim().length > 0);
      return lines.map((line, idx) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 40) {
          return {
            id: `parsed_${idx}_${Date.now()}`,
            name: line.slice(0, colonIdx).trim(),
            description: line.slice(colonIdx + 1).trim(),
          };
        }
        return {
          id: `parsed_${idx}_${Date.now()}`,
          name: line.trim().slice(0, 30),
          description: line.trim(),
        };
      });
    }
    return blocks.map((block, idx) => {
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      const colonIdx = firstLine.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        return {
          id: `parsed_${idx}_${firstLine.slice(0, 8)}`,
          name: firstLine.slice(0, colonIdx).trim(),
          description: [firstLine.slice(colonIdx + 1).trim(), ...lines.slice(1)].filter(Boolean).join('\n'),
        };
      }
      return {
        id: `parsed_${idx}_${firstLine.slice(0, 8)}`,
        name: firstLine.slice(0, 30),
        description: block.trim(),
      };
    });
  }, [character.featuresList, character.featuresAndTraits]);

  const updateFeaturesList = (newList: CharacterFeature[]) => {
    const textFormatted = newList.map(f => {
      let str = f.name;
      if (f.source || f.cost) {
        const meta = [f.source, f.cost].filter(Boolean).join(' | ');
        str += ` [${meta}]`;
      }
      str += `: ${f.description}`;
      return str;
    }).join('\n\n');

    onUpdateCharacter({
      ...character,
      featuresList: newList,
      featuresAndTraits: textFormatted,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddFeature = () => {
    const newId = `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFeature: CharacterFeature = {
      id: newId,
      name: 'Nova Habilidade',
      description: 'Descrição e detalhes dos efeitos da habilidade...',
      source: 'Classe',
      cost: '',
    };
    const newList = [newFeature, ...featuresList];
    updateFeaturesList(newList);
    setEditingFeatureId(newId);
    setEditingFeatureName('Nova Habilidade');
    setEditingFeatureDescription('Descrição e detalhes dos efeitos da habilidade...');
    setEditingFeatureSource('Classe');
    setEditingFeatureCost('');
    setEditingFeatureHasCost(false);
  };

  const handleToggleExpandFeature = (id: string) => {
    setCollapsedFeatureIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartEditFeature = (feat: CharacterFeature) => {
    setEditingFeatureId(feat.id);
    setEditingFeatureName(feat.name);
    setEditingFeatureDescription(feat.description);
    setEditingFeatureSource(feat.source || '');
    const hasCost = Boolean(feat.cost && feat.cost.trim().length > 0);
    setEditingFeatureHasCost(hasCost);
    setEditingFeatureCost(feat.cost || '');
  };

  const handleSaveEditFeature = (id: string) => {
    const finalCost = editingFeatureHasCost ? editingFeatureCost.trim() : undefined;
    const newList = featuresList.map(f => {
      if (f.id === id) {
        return {
          ...f,
          name: editingFeatureName.trim() || 'Habilidade',
          description: editingFeatureDescription.trim(),
          source: editingFeatureSource.trim() || undefined,
          cost: finalCost || undefined,
        };
      }
      return f;
    });
    updateFeaturesList(newList);
    setEditingFeatureId(null);
  };

  const handleRemoveFeature = (id: string) => {
    const newList = featuresList.filter(f => f.id !== id);
    updateFeaturesList(newList);
    if (editingFeatureId === id) {
      setEditingFeatureId(null);
    }
  };

  // Multiclass & Total Level resolution (no cap at 20)
  const primaryClass = character.primaryClass || (character.classAndLevel ? character.classAndLevel.split(' ')[0] : 'Guerreiro');
  const multiclasses: MulticlassEntry[] = character.multiclasses || [];
  const totalLevel = character.level + multiclasses.reduce((sum, mc) => sum + (mc.level || 0), 0);

  // Auto-calculated proficiency bonus from total level (unlimited scaling)
  const profBonus = calculateProficiencyBonus(totalLevel);

  // Deslocamento diretamente em metros (1,5m por quadrado de grid; ex: 9m = 6 quadriculados)
  const speedInMeters = character.speed !== undefined && character.speed !== null
    ? character.speed
    : 9;
  const speedInSquares = Math.round(speedInMeters / 1.5);

  // Hit Dice parsed state and helpers (<, <<, >, >>)
  const parsedHitDice = useMemo(() => {
    const total = character.hitDiceTotal || `${totalLevel || 1}d8`;
    const match = total.match(/(\d+)\s*(d\d+)/i);
    const maxDice = match ? parseInt(match[1], 10) : Math.max(1, totalLevel || 1);
    const dieType = match ? match[2].toLowerCase() : 'd8';

    let currentDice = maxDice;
    if (character.hitDiceCurrent !== undefined && character.hitDiceCurrent !== '') {
      const curMatch = String(character.hitDiceCurrent).match(/(\d+)/);
      if (curMatch) {
        currentDice = Math.min(maxDice, Math.max(0, parseInt(curMatch[1], 10)));
      }
    }
    return { currentDice, maxDice, dieType };
  }, [character.hitDiceTotal, character.hitDiceCurrent, totalLevel]);

  const handleHitDiceChange = (delta: number) => {
    const newCur = Math.min(parsedHitDice.maxDice, Math.max(0, parsedHitDice.currentDice + delta));
    onUpdateCharacter({
      ...character,
      hitDiceCurrent: `${newCur}${parsedHitDice.dieType}`,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResetHitDice = () => {
    onUpdateCharacter({
      ...character,
      hitDiceCurrent: `${parsedHitDice.maxDice}${parsedHitDice.dieType}`,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleZeroHitDice = () => {
    onUpdateCharacter({
      ...character,
      hitDiceCurrent: `0${parsedHitDice.dieType}`,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRollHitDie = () => {
    const conMod = calculateAbilityModifier(character.abilities.con.score);
    if (parsedHitDice.currentDice > 0) {
      handleHitDiceChange(-1);
      onQuickRoll(`1${parsedHitDice.dieType}+${conMod}`, `Dado de Vida (${parsedHitDice.dieType} + CON) gasto para cura`);
    } else {
      onQuickRoll(`1${parsedHitDice.dieType}+${conMod}`, `Dado de Vida (${parsedHitDice.dieType} + CON) [Sem dados restantes]`);
    }
  };

  const syncClassAndLevel = (newPrimaryClass: string, newPrimaryLevel: number, newMulticlasses: MulticlassEntry[]) => {
    const total = newPrimaryLevel + newMulticlasses.reduce((sum, mc) => sum + (mc.level || 0), 0);
    const mcStr = newMulticlasses.length > 0
      ? ' / ' + newMulticlasses.map((m) => `${m.className} ${m.level}`).join(' / ')
      : '';
    const classAndLevel = `${newPrimaryClass} ${newPrimaryLevel}${mcStr}`;

    onUpdateCharacter({
      ...character,
      primaryClass: newPrimaryClass,
      level: newPrimaryLevel,
      multiclasses: newMulticlasses,
      classAndLevel,
      proficiencyBonus: calculateProficiencyBonus(total),
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePrimaryClassChange = (newClass: string) => {
    syncClassAndLevel(newClass, character.level, multiclasses);
  };

  const handlePrimaryLevelChange = (newLevel: number) => {
    const validLevel = Math.max(1, newLevel);
    syncClassAndLevel(primaryClass, validLevel, multiclasses);
  };

  const handleAddMulticlass = () => {
    if (!newMulticlassName.trim()) return;
    const newEntry: MulticlassEntry = {
      id: `mc_${Date.now()}`,
      className: newMulticlassName.trim(),
      level: Math.max(1, newMulticlassLevel || 1),
    };
    const updated = [...multiclasses, newEntry];
    syncClassAndLevel(primaryClass, character.level, updated);
    setNewMulticlassLevel(1);
    setShowMulticlassModal(false);
  };

  const handleRemoveMulticlass = (id: string) => {
    const updated = multiclasses.filter((m) => m.id !== id);
    syncClassAndLevel(primaryClass, character.level, updated);
  };

  const handleUpdateMulticlassLevel = (id: string, newLvl: number) => {
    const updated = multiclasses.map((m) =>
      m.id === id ? { ...m, level: Math.max(1, newLvl) } : m
    );
    syncClassAndLevel(primaryClass, character.level, updated);
  };

  const handleSaveAvatar = () => {
    onUpdateCharacter({
      ...character,
      avatarUrl: avatarUrlDraft.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingAvatar(false);
  };

  // Ability modifiers
  const strMod = calculateAbilityModifier(character.abilities.str.score);
  const dexMod = calculateAbilityModifier(character.abilities.dex.score);
  const conMod = calculateAbilityModifier(character.abilities.con.score);
  const intMod = calculateAbilityModifier(character.abilities.int.score);
  const wisMod = calculateAbilityModifier(character.abilities.wis.score);
  const chaMod = calculateAbilityModifier(character.abilities.cha.score);

  const getModByName = (ability: AbilityName) => {
    switch (ability) {
      case 'str': return strMod;
      case 'dex': return dexMod;
      case 'con': return conMod;
      case 'int': return intMod;
      case 'wis': return wisMod;
      case 'cha': return chaMod;
    }
  };

  // Initiative calculation with DEX mod + custom initiative bonus
  const initiativeBonus = character.initiativeBonus || 0;
  const totalInitiative = dexMod + initiativeBonus;

  // Passive perception with WIS skill bonus + custom passive perception bonus
  const perceptionSkill = character.skills['perception'];
  const perceptionBonus = perceptionSkill
    ? calculateSkillBonus(wisMod, profBonus, perceptionSkill.proficiency, perceptionSkill.customBonus)
    : wisMod;
  const passivePerceptionBonus = character.passivePerceptionBonus || 0;
  const autoPassivePerception = calculatePassivePerception(perceptionBonus, passivePerceptionBonus);

  // Spellcasting auto calculations with custom bonus support
  const spellAbility = character.spellcastingAbility || 'int';
  const spellMod = getModByName(spellAbility);
  const spellSaveDcBonus = character.spellSaveDcBonus || 0;
  const spellAttackCustomBonus = character.spellAttackCustomBonus || 0;
  const spellSaveDc = calculateSpellSaveDc(profBonus, spellMod) + spellSaveDcBonus;
  const spellAttackBonus = calculateSpellAttackBonus(profBonus, spellMod) + spellAttackCustomBonus;

  // Helper to extract attribute modifier by name
  const getAbilityModByName = (attrName: string): number => {
    if (!attrName || attrName === 'Nenhum' || attrName === '-') return 0;
    const lower = attrName.toLowerCase();
    if (lower.includes('for') || lower.includes('str')) return strMod;
    if (lower.includes('des') || lower.includes('dex')) return dexMod;
    if (lower.includes('con')) return conMod;
    if (lower.includes('int')) return intMod;
    if (lower.includes('sab') || lower.includes('wis')) return wisMod;
    if (lower.includes('car') || lower.includes('cha')) return chaMod;
    return 0;
  };

  // Helper to extract skill bonus by name (proficiency/training + custom bonus)
  const getSkillBonusByName = (skillName: string): number => {
    if (!skillName || skillName === 'Nenhuma' || skillName === '-' || skillName === 'Nenhum') return 0;
    const lower = skillName.toLowerCase();
    if (lower === 'luta' || lower === 'pontaria') {
      return profBonus;
    }
    const defaultEntry = DEFAULT_5E_SKILLS.find(
      (s) => s.namePt.toLowerCase() === lower || s.name.toLowerCase() === lower || s.id.toLowerCase() === lower
    );
    if (defaultEntry) {
      const sk = character.skills[defaultEntry.id];
      if (sk) {
        let profMultiplier = 0;
        if (sk.proficiency === 'half') profMultiplier = 0.5;
        else if (sk.proficiency === 'proficient') profMultiplier = 1;
        else if (sk.proficiency === 'expertise') profMultiplier = 2;
        return Math.floor(profBonus * profMultiplier) + (sk.customBonus || 0);
      }
    }
    return 0;
  };

  // Automatic Attribute and Skill summation for Attack and Damage
  const chosenAttrMod = useMemo(() => {
    return getAbilityModByName(modalDamageAbility);
  }, [modalDamageAbility, strMod, dexMod, conMod, intMod, wisMod, chaMod]);

  const chosenSkillBonus = useMemo(() => {
    return getSkillBonusByName(modalSkill);
  }, [modalSkill, character.skills, profBonus]);

  // Total acerto: Bônus manual do usuário + Perícia + Atributo
  const effectiveAttackBonus = useMemo(() => {
    return modalAttackBonus + chosenSkillBonus + chosenAttrMod;
  }, [modalAttackBonus, chosenSkillBonus, chosenAttrMod]);

  // Total dano fixo: Bônus fixo manual do usuário + Atributo
  const effectiveFixedBonus = useMemo(() => {
    return modalFixedBonus + chosenAttrMod;
  }, [modalFixedBonus, chosenAttrMod]);

  // Computed attack formula (1d20 + effectiveBonus [flags])
  const modalComputedAttackFormula = useMemo(() => {
    const bonusSign = effectiveAttackBonus !== 0 ? (effectiveAttackBonus > 0 ? `+${effectiveAttackBonus}` : `${effectiveAttackBonus}`) : '+0';
    let flagTag = '';
    if (modalAdvantageCount > 0) {
      flagTag = ` [${modalAdvantageCount > 1 ? `${modalAdvantageCount} Vantagens` : 'Vantagem'}]`;
    } else if (modalDisadvantageCount > 0) {
      flagTag = ` [${modalDisadvantageCount > 1 ? `${modalDisadvantageCount} Desvantagens` : 'Desvantagem'}]`;
    }
    return `1d20${bonusSign}${flagTag}`;
  }, [effectiveAttackBonus, modalAdvantageCount, modalDisadvantageCount]);

  // Computed composite damage formula with separated damage types
  const modalComputedDamageFormula = useMemo(() => {
    let base = modalDamage.trim() || '1d4';
    if (effectiveFixedBonus !== 0 && !base.includes('+') && !base.includes('-')) {
      base = `${base}${effectiveFixedBonus > 0 ? `+${effectiveFixedBonus}` : `${effectiveFixedBonus}`}`;
    }
    const baseType = modalDamageType.trim() || 'Balístico';
    let full = `${base} [${baseType}]`;

    if (modalExtraDamages && modalExtraDamages.length > 0) {
      modalExtraDamages.forEach((extra) => {
        const extraDmg = extra.damage.trim();
        if (extraDmg) {
          const type = extra.damageType.trim() || 'Extra';
          full += ` + ${extraDmg} [${type}]`;
        }
      });
    }
    return full;
  }, [modalDamage, effectiveFixedBonus, modalDamageType, modalExtraDamages]);

  const handleOpenCreateAttackModal = () => {
    setEditingAttackId(null);
    setModalAttackName('Novo Ataque');
    setModalDamage('1d4');
    setModalCritical(20);
    setModalMultiplier(2);
    setModalAttackBonus(0); // Usuário escolhe livremente seu valor de base
    setModalDamageType('Balístico');
    setModalRange('-');
    setModalSkill('Luta');
    setModalDamageAbility('Força');
    setModalFixedBonus(0); // Bônus fixo manual livre
    setModalAdvantageCount(0);
    setModalDisadvantageCount(0);
    setModalExtraDamages([]);
    setModalImageUrl('');
    setModalSaveAsShortcut(true);
    setShowCrisAttackModal(true);
  };

  const handleOpenEditAttackModal = (atk: WeaponAttack) => {
    setEditingAttackId(atk.id);
    setModalAttackName(atk.name || 'Ataque');
    setModalDamage(atk.damage || '1d4');
    setModalCritical(atk.critical ?? 20);
    setModalMultiplier(atk.multiplier ?? 2);
    setModalAttackBonus(atk.attackBonus ?? 0);
    setModalDamageType(atk.damageType || 'Balístico');
    setModalRange(atk.range || '-');
    setModalSkill(atk.skill || 'Luta');
    setModalDamageAbility(atk.damageAbility || 'Força');
    setModalFixedBonus(atk.fixedBonus ?? 0);
    setModalAdvantageCount(atk.advantageLevel && atk.advantageLevel > 0 ? atk.advantageLevel : 0);
    setModalDisadvantageCount(atk.advantageLevel && atk.advantageLevel < 0 ? Math.abs(atk.advantageLevel) : 0);
    setModalExtraDamages(atk.extraDamage ? [...atk.extraDamage] : []);
    setModalImageUrl(atk.imageUrl || '');
    setModalSaveAsShortcut(true);
    setShowCrisAttackModal(true);
  };

  const handleAddExtraDamage = () => {
    setModalExtraDamages((prev) => [
      ...prev,
      { id: `ed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, damage: '1d6', damageType: 'Fogo' },
    ]);
  };

  const handleUpdateExtraDamage = (id: string, field: 'damage' | 'damageType', value: string) => {
    setModalExtraDamages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveExtraDamage = (id: string) => {
    setModalExtraDamages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTestAttackRoll = () => {
    const label = `Ataque: ${modalAttackName.trim() || 'Novo Ataque'}`;
    onQuickRoll(modalComputedAttackFormula, label);
  };

  const handleTestDamageRoll = () => {
    const label = `Dano: ${modalAttackName.trim() || 'Novo Ataque'}`;
    onQuickRoll(modalComputedDamageFormula, label);
  };

  const handleSaveCrisAttack = () => {
    const attackName = modalAttackName.trim() || 'Novo Ataque';
    const advLevel = modalAdvantageCount > 0 ? modalAdvantageCount : (modalDisadvantageCount > 0 ? -modalDisadvantageCount : 0);

    const attackData: WeaponAttack = {
      id: editingAttackId || `atk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: attackName,
      damage: modalDamage.trim() || '1d4',
      critical: modalCritical,
      multiplier: modalMultiplier,
      attackBonus: effectiveAttackBonus,
      damageType: modalDamageType.trim() || 'Balístico',
      range: modalRange.trim() || '-',
      skill: modalSkill.trim() || 'Luta',
      damageAbility: modalDamageAbility.trim() || 'Força',
      fixedBonus: effectiveFixedBonus,
      advantageLevel: advLevel,
      extraDamage: modalExtraDamages,
      imageUrl: modalImageUrl.trim() || undefined,
      notes: `${modalRange !== '-' ? `Alcance: ${modalRange}` : ''} ${modalSkill ? `(${modalSkill})` : ''}`.trim(),
    };

    let updatedAttacks: WeaponAttack[];
    if (editingAttackId) {
      updatedAttacks = character.attacks.map((a) => (a.id === editingAttackId ? attackData : a));
    } else {
      updatedAttacks = [...character.attacks, attackData];
    }
    onUpdateCharacter({
      ...character,
      attacks: updatedAttacks,
      updatedAt: new Date().toISOString(),
    });

    if (modalSaveAsShortcut) {
      const advType = modalAdvantageCount > 0 ? 'advantage' : (modalDisadvantageCount > 0 ? 'disadvantage' : 'normal');
      const newShortcut: SavedRollShortcut = {
        id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: `${attackName}`,
        expression: modalComputedAttackFormula,
        damageExpression: modalComputedDamageFormula,
        advantageType: advType,
        advantageCount: modalAdvantageCount,
        disadvantageCount: modalDisadvantageCount,
        bonus: effectiveAttackBonus,
        fixedBonus: effectiveFixedBonus,
        critical: modalCritical,
        multiplier: modalMultiplier,
        damageType: modalDamageType,
        extraDamages: modalExtraDamages,
        range: modalRange,
        skill: modalSkill,
        damageAbility: modalDamageAbility,
      };
      const updatedShortcuts = [
        ...savedShortcuts.filter((s) => s.label !== attackName && s.label !== `${attackName} (Ataque)`),
        newShortcut,
      ];
      setSavedShortcuts(updatedShortcuts);
      saveRollShortcuts(updatedShortcuts);
    }

    setShowCrisAttackModal(false);
  };

  const handleDeleteShortcut = (id: string) => {
    const updated = savedShortcuts.filter((sc) => sc.id !== id);
    setSavedShortcuts(updated);
    saveRollShortcuts(updated);
  };

  // Helper to build attack and damage formulas from any WeaponAttack
  const buildAttackTestFormula = (atk: WeaponAttack) => {
    const sign = (atk.attackBonus ?? 0) >= 0 ? `+${atk.attackBonus ?? 0}` : `${atk.attackBonus ?? 0}`;
    let flag = '';
    if (atk.advantageLevel && atk.advantageLevel > 0) {
      flag = ` [${atk.advantageLevel > 1 ? `${atk.advantageLevel} Vantagens` : 'Vantagem'}]`;
    } else if (atk.advantageLevel && atk.advantageLevel < 0) {
      const dis = Math.abs(atk.advantageLevel);
      flag = ` [${dis > 1 ? `${dis} Desvantagens` : 'Desvantagem'}]`;
    }
    return `1d20${sign}${flag}`;
  };

  const buildAttackDamageFormula = (atk: WeaponAttack) => {
    let base = atk.damage || '1d4';
    if (atk.fixedBonus && !base.includes('+') && !base.includes('-')) {
      base = `${base}${atk.fixedBonus >= 0 ? `+${atk.fixedBonus}` : `${atk.fixedBonus}`}`;
    }
    const baseType = atk.damageType || 'Balístico';
    let expr = `${base} [${baseType}]`;
    if (atk.extraDamage && atk.extraDamage.length > 0) {
      atk.extraDamage.forEach((extra) => {
        if (extra.damage && extra.damage.trim()) {
          expr += ` + ${extra.damage.trim()} [${extra.damageType || 'Extra'}]`;
        }
      });
    }
    return expr;
  };

  // Update helper
  const handleScoreChange = (ability: AbilityName, score: number) => {
    const validScore = Math.max(1, Math.min(30, score || 10));
    const mod = calculateAbilityModifier(validScore);
    const updated = {
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: {
          ...character.abilities[ability],
          score: validScore,
          modifier: mod,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateCharacter(updated);
  };

  const handleSaveProficiencyToggle = (ability: AbilityName) => {
    const current = character.abilities[ability].saveProficient;
    const updated = {
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: {
          ...character.abilities[ability],
          saveProficient: !current,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateCharacter(updated);
  };

  const handleSkillProficiencyChange = (skillId: string, level: SkillProficiencyLevel) => {
    const existing = character.skills[skillId] || {
      name: skillId,
      namePt: skillId,
      ability: 'str',
      proficiency: 'none',
      customBonus: 0,
    };

    const updated = {
      ...character,
      skills: {
        ...character.skills,
        [skillId]: {
          ...existing,
          proficiency: level,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateCharacter(updated);
  };

  const handleSkillCustomBonusChange = (skillId: string, customBonus: number) => {
    const existing = character.skills[skillId] || {
      name: skillId,
      namePt: skillId,
      ability: 'str',
      proficiency: 'none',
      customBonus: 0,
    };

    const updated = {
      ...character,
      skills: {
        ...character.skills,
        [skillId]: {
          ...existing,
          customBonus,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateCharacter(updated);
  };

  const handleSaveCustomBonusChange = (ability: AbilityName, customBonus: number) => {
    const updated = {
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: {
          ...character.abilities[ability],
          saveCustomBonus: customBonus,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateCharacter(updated);
  };

  const handleInteractiveDamage = (amount: number) => {
    let currentTemp = character.tempHp || 0;
    let currentRegular = character.currentHp;

    if (currentTemp > 0) {
      const absorbed = Math.min(currentTemp, amount);
      currentTemp -= absorbed;
      amount -= absorbed;
    }

    const newHp = Math.max(0, currentRegular - amount);
    onUpdateCharacter({
      ...character,
      currentHp: newHp,
      tempHp: currentTemp,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleInteractiveHeal = (amount: number) => {
    const newHp = Math.min(character.maxHp, character.currentHp + amount);
    onUpdateCharacter({
      ...character,
      currentHp: newHp,
      isDead: false,
      deathSaves: newHp > 0 ? { successes: 0, failures: 0 } : character.deathSaves,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAdjustTempHp = (delta: number) => {
    const newTemp = Math.max(0, (character.tempHp || 0) + delta);
    onUpdateCharacter({
      ...character,
      tempHp: newTemp,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeathSaveSuccessToggle = (slotIndex: number) => {
    const currentSuccesses = character.deathSaves?.successes || 0;
    const newSuccesses = currentSuccesses === slotIndex ? slotIndex - 1 : slotIndex;
    if (newSuccesses >= 3) {
      // 3 sucessos: a aba some e retorna com 1 de vida!
      onUpdateCharacter({
        ...character,
        currentHp: 1,
        deathSaves: { successes: 0, failures: 0 },
        isDead: false,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    onUpdateCharacter({
      ...character,
      deathSaves: {
        successes: newSuccesses,
        failures: character.deathSaves?.failures || 0,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeathSaveFailureToggle = (slotIndex: number) => {
    const currentFailures = character.deathSaves?.failures || 0;
    const newFailures = currentFailures === slotIndex ? slotIndex - 1 : slotIndex;
    if (newFailures >= 3) {
      // 3 fracassos: a aba some e exibe status de morto do lado do nome!
      onUpdateCharacter({
        ...character,
        isDead: true,
        deathSaves: {
          successes: character.deathSaves?.successes || 0,
          failures: 3,
        },
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    onUpdateCharacter({
      ...character,
      deathSaves: {
        successes: character.deathSaves?.successes || 0,
        failures: newFailures,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRollDeathSave = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    let newSucc = character.deathSaves?.successes || 0;
    let newFail = character.deathSaves?.failures || 0;

    if (roll === 20) {
      onQuickRoll('1d20', `Salvaguarda de ${character.characterName}: 20 NATURAL! Recobra a consciência com 1 HP!`);
      onUpdateCharacter({
        ...character,
        currentHp: 1,
        deathSaves: { successes: 0, failures: 0 },
        isDead: false,
        updatedAt: new Date().toISOString(),
      });
      return;
    } else if (roll === 1) {
      newFail += 2;
      onQuickRoll('1d20', `Salvaguarda de ${character.characterName}: 1 (FALHA CRÍTICA! +2 Fracassos)`);
    } else if (roll >= 10) {
      newSucc += 1;
      onQuickRoll('1d20', `Salvaguarda de ${character.characterName}: ${roll} (Sucesso!)`);
    } else {
      newFail += 1;
      onQuickRoll('1d20', `Salvaguarda de ${character.characterName}: ${roll} (Fracasso!)`);
    }

    if (newSucc >= 3) {
      onUpdateCharacter({
        ...character,
        currentHp: 1,
        deathSaves: { successes: 0, failures: 0 },
        isDead: false,
        updatedAt: new Date().toISOString(),
      });
    } else if (newFail >= 3) {
      onUpdateCharacter({
        ...character,
        isDead: true,
        deathSaves: { successes: newSucc, failures: 3 },
        updatedAt: new Date().toISOString(),
      });
    } else {
      onUpdateCharacter({
        ...character,
        deathSaves: { successes: newSucc, failures: newFail },
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAddAttack = () => {
    const newAttack: WeaponAttack = {
      id: `atk_${Date.now()}`,
      name: 'Novo Ataque',
      attackBonus: profBonus + strMod,
      damage: '1d6 + ' + strMod,
      damageType: 'Cortante',
      notes: 'Corpo a corpo',
    };
    onUpdateCharacter({
      ...character,
      attacks: [...character.attacks, newAttack],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddSpell = () => {
    const newSpell: Spell = {
      id: `sp_${Date.now()}`,
      name: 'Nova Magia',
      level: 1,
      school: 'Evocação',
      castingTime: '1 Ação',
      range: '18 m',
      components: 'V, S',
      duration: 'Instantânea',
      description: 'Descrição dos efeitos da magia...',
      prepared: true,
      isHomebrew: false,
    };
    onUpdateCharacter({
      ...character,
      spells: [...character.spells, newSpell],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddHomebrew = () => {
    const newHb: HomebrewItem = {
      id: `hb_${Date.now()}`,
      name: 'Nova Característica Homebrew',
      category: 'trait',
      description: 'Descreva a regra caseira, talento ou item especial criado pelo mestre ou jogador.',
      mechanics: '+2 em testes específicos ou bônus customizado',
      author: userRole === 'dm' ? 'Mestre da Campanha' : character.playerName,
      createdAt: new Date().toISOString().split('T')[0],
    };
    onUpdateCharacter({
      ...character,
      homebrews: [...(character.homebrews || []), newHb],
      updatedAt: new Date().toISOString(),
    });
  };

  const isCardVisibleInFilter = (rawCardId: string, filter: string) => {
    if (isEditingLayout || filter === 'all') return true;
    const cardId = normalizeCardId(rawCardId);
    if (filter === 'combat') return ['combate', 'recursos', 'defesa', 'pericias', 'atalhos', 'atributos'].includes(cardId);
    if (filter === 'traits') return ['habilidades', 'pericias'].includes(cardId);
    if (filter === 'spells') return ['magias', 'pericias'].includes(cardId);
    if (filter === 'inventory') return ['inventario'].includes(cardId);
    if (filter === 'bio') return ['biografia'].includes(cardId);
    return true;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* DM Master Mode Banner (when DM is editing) */}
      {userRole === 'dm' && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-stone-900 border border-amber-500/70 rounded-xl p-3 sm:p-4 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif font-bold text-amber-300 flex items-center gap-2">
                <span>Modo de Edição do Mestre da Campanha (DM)</span>
                <span className="text-[10px] bg-amber-500 text-black font-extrabold uppercase px-1.5 py-0.5 rounded">
                  Acesso Total
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Você tem permissão para visualizar e editar quaisquer atributos, vida, magias, itens e adicionar notas do mestre a esta ficha.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenDriveModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs border border-emerald-600/60 transition"
              title="Salvar ou restaurar no Google Drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sincronizar Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#15110d] p-3.5 rounded-xl border border-[#382b1d]">
        <div className="flex items-center gap-3 flex-wrap">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#201912] hover:bg-[#2c2219] text-[#eedbc5] font-serif font-bold text-xs transition border border-[#54412c]"
              title="Voltar para a lista de personagens"
            >
              <ArrowLeft className="w-4 h-4 text-[#c49d48]" />
              <span>Voltar à Lista</span>
            </button>
          )}

          <button
            onClick={onCreateNewCharacter}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs shadow-md border border-[#e8c679]/40 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Personagem</span>
          </button>
        </div>

        {/* Botão de Layout (Apenas este no painel de controle superior) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLayoutEditing(!isLayoutEditing)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-serif font-black shadow-md border transition cursor-pointer active:scale-95 ${
              isLayoutEditing
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-[#261a12] hover:bg-[#382619] text-[#c49d48] border-[#8c6b32]/80 hover:text-[#f4ecd8]'
            }`}
            title="Ativar/desativar modo de reorganização dos cards por arraste e solte (Drag & Drop)"
          >
            <LayoutGrid className="w-4 h-4 text-[#e8c679]" />
            <span>{isLayoutEditing ? 'Layout (Editando)' : 'Layout'}</span>
          </button>
        </div>
      </div>

      {/* Banner Informativo de Edição de Layout por Drag & Drop */}
      {isLayoutEditing && (
        <div className="bg-[#24170e] border-2 border-[#c49d48] rounded-xl p-3 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs font-serif font-bold">
            <Move className="w-4.5 h-4.5 text-[#e8c679] animate-bounce flex-shrink-0" />
            <span>
              <strong>Modo de Layout Ativo:</strong> Clique e arraste (drag-and-drop) os cards da ficha para reorganizar a tela livremente.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsLayoutEditing(false)}
            className="px-3.5 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-black font-serif font-black text-xs rounded-lg transition cursor-pointer border border-amber-300 flex-shrink-0 shadow"
          >
            Concluir Layout
          </button>
        </div>
      )}

      {/* Multiclass Management Modal */}
      {showMulticlassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e140d] border-2 border-[#8c6b32] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            <div className="flex items-center justify-between border-b border-[#8c6b32]/40 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#c49d48]" />
                <h3 className="font-black text-lg text-[#f4ecd8]">Gerenciar Multiclasse</h3>
              </div>
              <button
                onClick={() => setShowMulticlassModal(false)}
                className="p-1 rounded text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#2c1d13]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Classes List */}
            <div className="space-y-2.5">
              <div className="text-xs uppercase font-bold text-[#c49d48] tracking-wider">
                Classes do Personagem:
              </div>

              {/* Primary Class Row */}
              <div className="flex items-center justify-between p-2.5 bg-[#140d08] border border-[#8c6b32]/40 rounded-lg">
                <div>
                  <span className="font-bold text-sm text-[#f4ecd8]">{primaryClass}</span>
                  <span className="text-[10px] text-[#c49d48] ml-2 font-mono uppercase bg-[#261a12] px-1.5 py-0.5 rounded border border-[#8c6b32]/30">
                    Principal
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#bfa888]">Nível:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={character.level}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      handlePrimaryLevelChange(clean === '' ? 1 : Math.max(1, parseInt(clean, 10)));
                    }}
                    className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#8c6b32]/60 rounded px-1.5 py-0.5 text-center text-sm font-bold text-amber-300 focus:outline-none focus:border-[#c49d48]"
                  />
                </div>
              </div>

              {/* Multiclasses Rows */}
              {multiclasses.map((mc) => (
                <div
                  key={mc.id}
                  className="flex items-center justify-between p-2.5 bg-[#140d08] border border-[#8c6b32]/30 rounded-lg"
                >
                  <div>
                    <span className="font-bold text-sm text-[#f4ecd8]">{mc.className}</span>
                    <span className="text-[10px] text-[#e8c679] ml-2 font-mono uppercase bg-[#2a1d13] px-1.5 py-0.5 rounded border border-[#8c6b32]/60">
                      Multiclasse
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#bfa888]">Nível:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={mc.level}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        handleUpdateMulticlassLevel(mc.id, clean === '' ? 1 : Math.max(1, parseInt(clean, 10)));
                      }}
                      className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#8c6b32]/60 rounded px-1.5 py-0.5 text-center text-sm font-bold text-[#f5ebd7] focus:outline-none focus:border-[#c49d48]"
                    />
                    <button
                      onClick={() => handleRemoveMulticlass(mc.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-950/60 transition"
                      title="Remover Multiclasse"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Level Banner */}
            <div className="p-2.5 bg-[#261a12] border border-[#8c6b32]/50 rounded-lg flex items-center justify-between text-xs">
              <span className="text-[#eedbc5] font-semibold">Nível Total do Personagem:</span>
              <span className="font-black text-amber-400 text-base font-mono">
                {totalLevel}
              </span>
            </div>

            {/* Add New Multiclass Form */}
            <div className="pt-2 border-t border-[#8c6b32]/40 space-y-2">
              <div className="text-xs uppercase font-bold text-[#c49d48]">
                Adicionar Nova Multiclasse
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <select
                    value={newMulticlassName}
                    onChange={(e) => setNewMulticlassName(e.target.value)}
                    className="w-full bg-[#140d08] border border-[#8c6b32]/60 rounded-lg p-2 text-xs text-[#f4ecd8] focus:outline-none focus:border-[#c49d48]"
                  >
                    {STANDARD_5E_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nível"
                    value={newMulticlassLevel}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setNewMulticlassLevel(clean === '' ? 1 : Math.max(1, parseInt(clean, 10)));
                    }}
                    className="w-full bg-[#140d08] border border-[#8c6b32]/60 rounded-lg p-2 text-xs text-center font-bold text-amber-300 focus:outline-none focus:border-[#c49d48]"
                  />
                </div>
              </div>
              <button
                onClick={handleAddMulticlass}
                className="w-full py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md border border-[#e8c679]/40 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Multiclasse</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Image Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e140d] border-2 border-[#8c6b32] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            <div className="flex items-center justify-between border-b border-[#8c6b32]/40 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#c49d48]" />
                <h3 className="font-black text-base text-[#f4ecd8]">Retrato do Personagem</h3>
              </div>
              <button
                onClick={() => setIsEditingAvatar(false)}
                className="p-1 rounded text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#2c1d13]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase font-bold text-[#bfa888] block">
                URL da Imagem de Retrato (Avatar):
              </label>
              <input
                type="text"
                value={avatarUrlDraft}
                onChange={(e) => setAvatarUrlDraft(e.target.value)}
                placeholder="https://exemplo.com/imagem_personagem.png"
                className="w-full bg-[#140d08] border border-[#8c6b32]/60 rounded-lg p-2.5 text-xs text-[#f4ecd8] placeholder-[#7d654c] focus:outline-none focus:border-[#c49d48]"
              />

              {avatarUrlDraft && (
                <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border-2 border-[#8c6b32] bg-[#140d08]">
                  <img
                    src={avatarUrlDraft}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#8c6b32]/40">
              <button
                onClick={() => {
                  setAvatarUrlDraft('');
                  onUpdateCharacter({ ...character, avatarUrl: undefined });
                  setIsEditingAvatar(false);
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300"
              >
                Remover Foto
              </button>
              <button
                onClick={handleSaveAvatar}
                className="px-4 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md"
              >
                Salvar Retrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attributes & Saving Throws Edit Modal */}
      {showAttributesEditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e140d] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            <div className="flex items-center justify-between border-b border-[#8c6b32]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#c49d48]" />
                <div>
                  <h3 className="font-black text-lg text-[#f4ecd8]">Editar Atributos &amp; Salvaguardas</h3>
                  <p className="text-[11px] text-[#bfa888] font-sans">
                    Altere os valores base (1–30) e marque as proficiências em salvaguardas (D&amp;D 5e).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttributesEditModal(false)}
                className="p-1.5 rounded-lg text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#2c1d13] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of 6 Ability Scores */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {(
                [
                  { key: 'str', label: 'Força', pt: 'FOR' },
                  { key: 'dex', label: 'Destreza', pt: 'DES' },
                  { key: 'con', label: 'Constituição', pt: 'CON' },
                  { key: 'int', label: 'Inteligência', pt: 'INT' },
                  { key: 'wis', label: 'Sabedoria', pt: 'SAB' },
                  { key: 'cha', label: 'Carisma', pt: 'CAR' },
                ] as const
              ).map(({ key, label, pt }) => {
                const currentAbility = character.abilities[key];
                const mod = calculateAbilityModifier(currentAbility.score);
                const isSaveProf = currentAbility.saveProficient;
                const saveBonus = calculateSavingThrowBonus(mod, profBonus, isSaveProf);

                return (
                  <div
                    key={`modal_attr_${key}`}
                    className="flex items-center justify-between p-3 bg-[#140d08] border border-[#54412c] rounded-xl hover:border-[#8c6b32]/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#24170e] border border-[#8c6b32]/50 flex flex-col items-center justify-center font-bold">
                        <span className="text-[10px] text-[#c49d48] uppercase tracking-wider">{pt}</span>
                        <span className="text-xs text-[#f4ecd8] font-mono leading-none">{formatModifier(mod)}</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#f4ecd8]">{label}</div>
                        <div className="text-[10px] text-[#8c7457] font-mono">
                          Salvaguarda: <span className="text-amber-300 font-bold">{formatModifier(saveBonus)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Score Input */}
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
                            const val = clean === '' ? 10 : Math.max(1, Math.min(30, parseInt(clean, 10)));
                            handleScoreChange(key, val);
                          }}
                          className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#8c6b32]/60 rounded-lg py-1 px-2 text-center font-mono font-bold text-sm text-amber-200 focus:outline-none focus:border-[#c49d48]"
                        />
                      </div>

                      {/* Saving Throw Proficiency Toggle */}
                      <button
                        type="button"
                        onClick={() => handleSaveProficiencyToggle(key)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-sans font-bold flex items-center gap-1.5 transition ${
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
                Bônus de Proficiência Atual: <strong className="text-amber-300">+{profBonus}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowAttributesEditModal(false)}
                className="px-5 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md"
              >
                Concluir Edição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Flutuante C.R.I.S. para Ataques, Atalhos, Vantagens Múltiplas e Dano Extra Separado */}
      {showCrisAttackModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif max-h-[92vh] overflow-y-auto">
            {/* Cabeçalho do Modal no estilo C.R.I.S. */}
            <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
              <div>
                <h3 className="font-sans font-black text-xl sm:text-2xl text-[#f4ecd8] tracking-tight">
                  {editingAttackId ? 'Editar Ataque' : 'Novo Ataque'}
                </h3>
                <p className="text-[11px] text-[#a89073] font-sans">
                  Configure ataque, crítico, atributos, dados extras e tipos de dano.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCrisAttackModal(false)}
                className="p-1.5 rounded-lg text-[#8c7457] hover:text-[#f4ecd8] hover:bg-[#251910] transition"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campo 1: Nome* */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nome<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={modalAttackName}
                onChange={(e) => setModalAttackName(e.target.value)}
                placeholder="Novo Ataque"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Linha 2 (3 Colunas): Dano* | Crítico* | Multiplicador* */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Dano<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={modalDamage}
                  onChange={(e) => setModalDamage(e.target.value)}
                  placeholder="1d4"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Crítico<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={modalCritical}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setModalCritical(clean === '' ? 20 : Math.max(1, Math.min(20, parseInt(clean, 10))));
                  }}
                  placeholder="20"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-center text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Multiplicador<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={modalMultiplier}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setModalMultiplier(clean === '' ? 2 : Math.max(1, Math.min(10, parseInt(clean, 10))));
                  }}
                  placeholder="2"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-center text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Linha 3 (2 Colunas): Ataque Bônus | Tipo de Dano */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                    Ataque Bônus
                  </label>
                  <span className="text-[11px] font-mono font-bold text-amber-300">
                    Total Acerto: {formatModifier(effectiveAttackBonus)}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={modalAttackBonus}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                    const parsed = parseInt(clean, 10);
                    setModalAttackBonus(isNaN(parsed) ? 0 : parsed);
                  }}
                  placeholder="0"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-center text-amber-300 font-bold focus:outline-none transition"
                />
                <div className="text-[10px] text-[#a89073] font-sans">
                  Base ({formatModifier(modalAttackBonus)}) + {modalSkill || 'Perícia'} ({formatModifier(chosenSkillBonus)}) + {modalDamageAbility || 'Atributo'} ({formatModifier(chosenAttrMod)})
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Tipo de Dano
                </label>
                <input
                  type="text"
                  value={modalDamageType}
                  onChange={(e) => setModalDamageType(e.target.value)}
                  placeholder="Balístico"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition"
                />
                <div className="flex flex-wrap gap-1 pt-0.5 max-h-20 overflow-y-auto pr-1">
                  {ALL_DND_DAMAGE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setModalDamageType(t)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-sans transition border ${
                        modalDamageType.toLowerCase() === t.toLowerCase()
                          ? 'bg-[#c49d48] text-[#140d07] border-[#e8c679] font-bold'
                          : 'bg-[#1e1a17] text-[#a89073] border-[#3d2d1e] hover:text-[#eedbc5]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha 4 (3 Colunas): Alcance | Perícia | Atributo Dano */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Alcance
                </label>
                <input
                  type="text"
                  value={modalRange}
                  onChange={(e) => setModalRange(e.target.value)}
                  placeholder="-"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                    Perícia
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    +{chosenSkillBonus}
                  </span>
                </div>
                <select
                  value={modalSkill}
                  onChange={(e) => setModalSkill(e.target.value)}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition"
                >
                  <option value="Luta">Luta (+{profBonus})</option>
                  <option value="Pontaria">Pontaria (+{profBonus})</option>
                  <option value="Nenhuma">Nenhuma (+0)</option>
                  {DEFAULT_5E_SKILLS.map((sk) => (
                    <option key={sk.id} value={sk.namePt}>
                      {sk.namePt} ({formatModifier(getSkillBonusByName(sk.namePt))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                    Atributo Dano
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    {formatModifier(chosenAttrMod)}
                  </span>
                </div>
                <select
                  value={modalDamageAbility}
                  onChange={(e) => setModalDamageAbility(e.target.value)}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition"
                >
                  <option value="Força">Força ({formatModifier(strMod)})</option>
                  <option value="Destreza">Destreza ({formatModifier(dexMod)})</option>
                  <option value="Constituição">Constituição ({formatModifier(conMod)})</option>
                  <option value="Inteligência">Inteligência ({formatModifier(intMod)})</option>
                  <option value="Sabedoria">Sabedoria ({formatModifier(wisMod)})</option>
                  <option value="Carisma">Carisma ({formatModifier(chaMod)})</option>
                  <option value="Nenhum">Nenhum (+0)</option>
                </select>
              </div>
            </div>

            {/* Bônus Fixo de Dano (Sem cards, valor livre + soma automática de atributo) */}
            <div className="space-y-1.5 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#c49d48] uppercase tracking-wider block">
                  Bônus Fixo de Dano:
                </label>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  Total Dano: {formatModifier(effectiveFixedBonus)}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={modalFixedBonus}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                  const parsed = parseInt(clean, 10);
                  setModalFixedBonus(isNaN(parsed) ? 0 : parsed);
                }}
                placeholder="0"
                className="w-full bg-[#141210] border border-[#8c6b32]/60 rounded-lg py-1.5 px-3 text-center font-mono font-bold text-sm text-amber-200 focus:outline-none focus:border-[#c49d48]"
              />
              <div className="text-[10px] text-[#a89073] font-sans">
                Fixo ({formatModifier(modalFixedBonus)}) + {modalDamageAbility || 'Atributo'} ({formatModifier(chosenAttrMod)})
              </div>
            </div>

            {/* Vantagens & Desvantagens (Dados Extras - Sem Limite de 2 Dados) */}
            <div className="space-y-2 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#c49d48] uppercase tracking-wider block">
                  Vantagens &amp; Desvantagens (Dados Extras):
                </label>
                {(modalAdvantageCount > 0 || modalDisadvantageCount > 0) && (
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border font-sans ${
                    modalAdvantageCount > 0
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-red-950 text-red-300 border-red-600'
                  }`}>
                    {modalAdvantageCount > 0
                      ? `${1 + modalAdvantageCount} Dados `
                      : `${1 + modalDisadvantageCount} Dados `}
                  </span>
                )}
              </div>

              {/* Contadores de Vantagem e Desvantagem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Stepper de Vantagem */}
                <div className="flex items-center justify-between bg-[#141210] border border-emerald-900/60 rounded-lg p-2">
                  <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1">
                    ★ Vantagens:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalAdvantageCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-sm text-emerald-200">
                      +{modalAdvantageCount}d
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalAdvantageCount((prev) => prev + 1);
                        setModalDisadvantageCount(0); // Mutually exclusive
                      }}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stepper de Desvantagem */}
                <div className="flex items-center justify-between bg-[#141210] border border-red-900/60 rounded-lg p-2">
                  <span className="text-xs font-serif font-bold text-red-300 flex items-center gap-1">
                    ⚠️ Desvantagens:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalDisadvantageCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-red-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-sm text-red-200">
                      +{modalDisadvantageCount}d
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalDisadvantageCount((prev) => prev + 1);
                        setModalAdvantageCount(0); // Mutually exclusive
                      }}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-red-900/40 text-red-300 border border-red-700/60 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dano Extra: com tipos separados (conforme imagem de referência C.R.I.S.) */}
            <div className="space-y-2 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Dano extra:
                </label>
                <button
                  type="button"
                  onClick={handleAddExtraDamage}
                  className="px-2.5 py-1 rounded bg-[#251910] hover:bg-[#382619] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/60 text-xs font-sans font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Dano Extra</span>
                </button>
              </div>

              {/* Lista de Entradas de Dano Extra */}
              {modalExtraDamages.length === 0 ? (
                <div className="text-[11px] text-[#78634c] italic py-2 text-center bg-[#141210] rounded-lg border border-dashed border-[#3d2d1e]">
                  Nenhum dano extra configurado. Clique em "+ Adicionar Dano Extra" para somar dados adicionais com tipos específicos.
                </div>
              ) : (
                <div className="space-y-2">
                  {modalExtraDamages.map((extra, edIdx) => (
                    <div
                      key={extra.id}
                      className="flex items-center gap-2 bg-[#141210] border border-[#54412c] rounded-lg p-2"
                    >
                      <div className="flex-1">
                        <label className="text-[9px] text-[#8c7457] font-sans uppercase block mb-0.5">
                          Dano / Dado #{edIdx + 1}
                        </label>
                        <input
                          type="text"
                          value={extra.damage}
                          onChange={(e) => handleUpdateExtraDamage(extra.id, 'damage', e.target.value)}
                          placeholder="ex: 1d6 ou 2"
                          className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded px-2 py-1 text-xs font-mono text-amber-200 focus:outline-none"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[9px] text-[#8c7457] font-sans uppercase block mb-0.5">
                          Tipo de Dano
                        </label>
                        <select
                          value={extra.damageType}
                          onChange={(e) => handleUpdateExtraDamage(extra.id, 'damageType', e.target.value)}
                          className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded px-2 py-1 text-xs font-sans text-[#f4ecd8] focus:outline-none"
                        >
                          {ALL_DND_DAMAGE_TYPES.map((dt) => (
                            <option key={dt} value={dt} className="bg-[#1e1a17] text-[#f4ecd8]">
                              {dt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExtraDamage(extra.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded transition mt-3 cursor-pointer"
                        title="Remover dano extra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Imagem (conforme print C.R.I.S.) */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Imagem (URL ou Ícone)
              </label>
              <input
                type="text"
                value={modalImageUrl}
                onChange={(e) => setModalImageUrl(e.target.value)}
                placeholder="https://... ou vazio"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Salvar também como Atalho de Rolagem */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modalSaveAsShortcut"
                checked={modalSaveAsShortcut}
                onChange={(e) => setModalSaveAsShortcut(e.target.checked)}
                className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c]"
              />
              <label htmlFor="modalSaveAsShortcut" className="text-xs text-[#eedbc5] font-sans cursor-pointer select-none">
                Salvar também na <strong>Mesa de Dados &amp; Atalhos</strong> (acesso rápido de rolagem)
              </label>
            </div>

            {/* Pré-visualização em Tempo Real das Fórmulas */}
            <div className="bg-[#100e0c] border border-[#8c6b32]/60 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wider text-[#a89073]">
                <span>Fórmulas Calculadas:</span>
                <span className="text-amber-400 font-mono font-bold">Prévia da Rolagem</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#a89073]">Teste de Acerto:</span>
                  <strong className="text-amber-300">{modalComputedAttackFormula}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a89073]">Rolagem de Dano:</span>
                  <strong className="text-amber-300 truncate max-w-[280px] sm:max-w-none text-right">
                    {modalComputedDamageFormula}
                  </strong>
                </div>
              </div>
            </div>

            {/* Rodapé: Ações e Botões de Teste */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestAttackRoll}
                  className="px-3 py-1.5 rounded-lg bg-[#251910] hover:bg-[#382619] text-[#d4af37] border border-[#8c6b32] text-xs font-sans font-bold transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                  title="Testar teste de ataque na janela flutuante"
                >
                  <Dices className="w-4 h-4 text-[#e8c679]" />
                  <span>Testar Ataque</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestDamageRoll}
                  className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-700/60 text-xs font-sans font-bold transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                  title="Testar dano com separação de tipos na janela flutuante"
                >
                  <Flame className="w-4 h-4 text-red-400" />
                  <span>Testar Dano</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCrisAttackModal(false)}
                  className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrisAttack}
                  className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAttackId ? 'Atualizar Ataque' : 'Salvar Ataque'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Flutuante Exclusivo para Salvar Rolagem (Atalho Genérico de Rolagem de Dados) */}
      {showSaveRollShortcutModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
              <div>
                <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#e8c679] fill-[#e8c679]" />
                  <span>{editingShortcutId ? 'Editar Rolagem Salva' : 'Salvar Nova Rolagem'}</span>
                </h3>
                <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
                  Crie um atalho rápido para rolagens frequentes (perícias, curas, salvaguardas, etc.).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveRollShortcutModal(false)}
                className="p-1.5 rounded-lg text-[#8c7457] hover:text-[#f4ecd8] hover:bg-[#251910] transition cursor-pointer"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campo 1: Nome da Rolagem */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nome da Rolagem / Etiqueta<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={shortcutName}
                onChange={(e) => setShortcutName(e.target.value)}
                placeholder="ex: Cura da Poção, Teste de Percepção, Iniciativa"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Campo 2: Fórmula de Dados */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Fórmula de Dados<span className="text-amber-400">*</span>
                </label>
                <span className="text-[10px] text-[#8c7457] font-mono">ex: 1d20+5, 2d8+3, 8d6</span>
              </div>
              <input
                type="text"
                value={shortcutFormula}
                onChange={(e) => setShortcutFormula(e.target.value)}
                placeholder="ex: 1d20+5 ou 2d8+3"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm font-mono text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
              />
              
              {/* Presets Rápidos */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                <span className="text-[9px] text-[#8c7457] font-sans uppercase flex-shrink-0">Presenciais:</span>
                {['1d20+5', '1d20+2', '2d6+3', '1d8+3', '1d4+1', '8d6'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setShortcutFormula(preset)}
                    className="px-1.5 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono font-bold text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Flags de Vantagem e Desvantagem */}
            <div className="space-y-2 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Modo de Vantagem / Desvantagem (Opcional)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Stepper de Vantagem */}
                <div className="flex items-center justify-between bg-[#141210] border border-emerald-900/60 rounded-lg p-2">
                  <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1">
                    ★ Vantagem:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShortcutAdvantageCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm text-emerald-200">
                      +{shortcutAdvantageCount}d
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShortcutAdvantageCount((prev) => prev + 1);
                        setShortcutDisadvantageCount(0);
                      }}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stepper de Desvantagem */}
                <div className="flex items-center justify-between bg-[#141210] border border-red-900/60 rounded-lg p-2">
                  <span className="text-xs font-serif font-bold text-red-300 flex items-center gap-1">
                    ⚠️ Desvantagem:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShortcutDisadvantageCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-red-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm text-red-200">
                      +{shortcutDisadvantageCount}d
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShortcutDisadvantageCount((prev) => prev + 1);
                        setShortcutAdvantageCount(0);
                      }}
                      className="w-7 h-7 rounded bg-[#251910] hover:bg-red-900/40 text-red-300 border border-red-700/60 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Campo 3: Observação */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Notas / Observação (Opcional)
              </label>
              <input
                type="text"
                value={shortcutNotes}
                onChange={(e) => setShortcutNotes(e.target.value)}
                placeholder="ex: Poção de Cura, Bônus da Armadura"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Rodapé: Botões de Ação */}
            <div className="flex items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
              <button
                type="button"
                onClick={() => setShowSaveRollShortcutModal(false)}
                className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveShortcutModal(true)}
                  className="px-3 py-2 bg-[#251910] hover:bg-[#382619] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/80 text-xs font-sans font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
                >
                  <Dices className="w-4 h-4 text-[#e8c679]" />
                  <span>Salvar &amp; Rolar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveShortcutModal(false)}
                  className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingShortcutId ? 'Atualizar Atalho' : 'Salvar Atalho'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Flutuante para Adicionar / Editar Item de Inventário */}
      {showInventoryItemModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
              <div>
                <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
                  <Backpack className="w-5 h-5 text-[#c49d48]" />
                  <span>{editingInventoryItemId ? 'Editar Item do Inventário' : 'Novo Item no Inventário'}</span>
                </h3>
                <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
                  Adicione ou edite detalhes do item, quantidade e peso unitário em kg.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInventoryItemModal(false)}
                className="p-1.5 rounded-lg text-[#8c7457] hover:text-[#f4ecd8] hover:bg-[#251910] transition cursor-pointer"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1">
              <span className="text-[10px] font-sans uppercase font-bold text-[#8c7457] block">
                Seleção Rápida de Itens Comuns:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { name: 'Espada Longa', weight: 1.5, cat: 'Arma' },
                  { name: 'Cota de Malha', weight: 25.0, cat: 'Armadura' },
                  { name: 'Escudo (+2 CA)', weight: 3.0, cat: 'Armadura' },
                  { name: 'Poção de Cura', weight: 0.25, cat: 'Poção' },
                  { name: 'Mochila de Aventureiro', weight: 2.0, cat: 'Geral' },
                  { name: 'Ração de Viagem', weight: 0.5, cat: 'Ração' },
                  { name: 'Tocha', weight: 0.4, cat: 'Geral' },
                  { name: 'Corda 15m', weight: 5.0, cat: 'Geral' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setInventoryItemName(preset.name);
                      setInventoryItemWeightKg(preset.weight);
                      setInventoryItemCategory(preset.cat as any);
                    }}
                    className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
                  >
                    {preset.name} ({preset.weight}kg)
                  </button>
                ))}
              </div>
            </div>

            {/* Campo 1: Nome do Item */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nome do Item<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={inventoryItemName}
                onChange={(e) => setInventoryItemName(e.target.value)}
                placeholder="ex: Espada Longa, Poção de Cura Rápida, Cota de Malha"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Linha 2: Categoria | Quantidade | Peso em kg */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Categoria
                </label>
                <select
                  value={inventoryItemCategory}
                  onChange={(e) => setInventoryItemCategory(e.target.value as any)}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-sans text-[#f4ecd8] focus:outline-none transition"
                >
                  <option value="Geral" className="bg-[#1e1a17]">Geral</option>
                  <option value="Arma" className="bg-[#1e1a17]">Arma</option>
                  <option value="Armadura" className="bg-[#1e1a17]">Armadura</option>
                  <option value="Poção" className="bg-[#1e1a17]">Poção</option>
                  <option value="Ferramenta" className="bg-[#1e1a17]">Ferramenta</option>
                  <option value="Ração" className="bg-[#1e1a17]">Ração</option>
                  <option value="Tesouro" className="bg-[#1e1a17]">Tesouro</option>
                  <option value="Outro" className="bg-[#1e1a17]">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Quantidade<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inventoryItemQuantity}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setInventoryItemQuantity(clean === '' ? 1 : Math.max(1, parseInt(clean, 10)));
                  }}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-mono text-center text-amber-200 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Peso Unitário (kg)<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={inventoryItemWeightKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    setInventoryItemWeightKg(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  placeholder="0.5"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-mono text-center text-amber-200 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Checkbox Equipado */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="inventoryItemEquipped"
                checked={inventoryItemEquipped}
                onChange={(e) => setInventoryItemEquipped(e.target.checked)}
                className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c] cursor-pointer"
              />
              <label htmlFor="inventoryItemEquipped" className="text-xs text-[#eedbc5] font-sans cursor-pointer select-none">
                Item está <strong>Equipado / Vestido / Sintonizado</strong> no momento
              </label>
            </div>

            {/* Campo Descrição */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Descrição ou Notas (Opcional)
              </label>
              <textarea
                value={inventoryItemDescription}
                onChange={(e) => setInventoryItemDescription(e.target.value)}
                rows={2}
                placeholder="Propriedades mágicas, CA, dano, utilidade, etc."
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Cálculo Total em kg */}
            <div className="bg-[#100e0c] border border-[#8c6b32]/60 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-[#a89073]">Peso Total do Item:</span>
              <strong className="text-amber-300">
                {(inventoryItemQuantity * inventoryItemWeightKg).toFixed(1)} kg ({inventoryItemQuantity}x {inventoryItemWeightKg} kg)
              </strong>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
              <button
                type="button"
                onClick={() => setShowInventoryItemModal(false)}
                className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveInventoryItemModal}
                className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingInventoryItemId ? 'Atualizar Item' : 'Adicionar Item'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Flutuante Arcaico para Adicionar / Editar Magia no Grimório */}
      {showSpellModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif max-h-[92vh] overflow-y-auto">
            {/* Cabeçalho do Modal no Estilo Grimório Arcaico */}
            <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
              <div>
                <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{editingSpellId ? 'Editar Magia do Grimório' : 'Nova Magia no Grimório'}</span>
                </h3>
                <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
                  Insira os detalhes arcanos, nível (Truque a 9º Nível), escola, ritual/concentração e descrição.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSpellModal(false)}
                className="p-1.5 rounded-lg text-[#8c7457] hover:text-[#f4ecd8] hover:bg-[#251910] transition cursor-pointer"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Rápidos de Magias Famosas */}
            <div className="space-y-1">
              <span className="text-[10px] font-sans uppercase font-bold text-[#8c7457] block">
                Presenciais Rápidos do D&amp;D 5e:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { name: 'Bola de Fogo', lvl: 3, sch: 'Evocação', time: '1 Ação', range: '45m', dmg: '8d6 [Fogo]', desc: 'Explosão flamejante em esfera de 6m. Teste de RES de Destreza para metade do dano.' },
                  { name: 'Míssil Mágico', lvl: 1, sch: 'Evocação', time: '1 Ação', range: '36m', dmg: '3d4+3 [Energia]', desc: 'Cria 3 dardos infalíveis de energia arcana. Cada dardo causa 1d4+1.' },
                  { name: 'Escudo Arcano', lvl: 1, sch: 'Abjuração', time: '1 Reação', range: 'Pessoal', dmg: '', desc: '+5 na CA e imunidade a Míssil Mágico até o início do seu próximo turno.' },
                  { name: 'Curar Ferimentos', lvl: 1, sch: 'Evocação', time: '1 Ação', range: 'Toque', dmg: '1d8+3 [Cura]', desc: 'Uma criatura que você tocar recupera PV iguais a 1d8 + modificador de conjuração.' },
                  { name: 'Raio de Fogo', lvl: 0, sch: 'Evocação', time: '1 Ação', range: '36m', dmg: '1d10 [Fogo]', desc: 'Lança um feixe flamejante com ataque à distância mágico. 1d10 dano de fogo.' },
                  { name: 'Passo Nebuloso', lvl: 2, sch: 'Transmutação', time: '1 Ação Bônus', range: '9m', dmg: '', desc: 'Teleporta-se instantaneamente para um local não ocupado que você veja a até 9m.' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSpellName(preset.name);
                      setSpellLevel(preset.lvl);
                      setSpellSchool(preset.sch);
                      setSpellCastingTime(preset.time);
                      setSpellRange(preset.range);
                      setSpellDamageFormula(preset.dmg);
                      setSpellDescription(preset.desc);
                    }}
                    className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
                  >
                    {preset.name} ({preset.lvl === 0 ? 'Truque' : `${preset.lvl}º Nível`})
                  </button>
                ))}
              </div>
            </div>

            {/* Campo 1: Nome da Magia */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nome da Magia<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={spellName}
                onChange={(e) => setSpellName(e.target.value)}
                placeholder="ex: Bola de Fogo, Escudo Arcano, Raio de Fogo"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Linha 2: Nível (0 a 9) & Escola de Magia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Nível da Magia<span className="text-amber-400">*</span>
                </label>
                <select
                  value={spellLevel}
                  onChange={(e) => setSpellLevel(parseInt(e.target.value, 10))}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-sans text-amber-200 focus:outline-none transition"
                >
                  <option value={0} className="bg-[#1e1a17]">Truque (Cantrip - Nível 0)</option>
                  <option value={1} className="bg-[#1e1a17]">1º Nível</option>
                  <option value={2} className="bg-[#1e1a17]">2º Nível</option>
                  <option value={3} className="bg-[#1e1a17]">3º Nível</option>
                  <option value={4} className="bg-[#1e1a17]">4º Nível</option>
                  <option value={5} className="bg-[#1e1a17]">5º Nível</option>
                  <option value={6} className="bg-[#1e1a17]">6º Nível</option>
                  <option value={7} className="bg-[#1e1a17]">7º Nível</option>
                  <option value={8} className="bg-[#1e1a17]">8º Nível</option>
                  <option value={9} className="bg-[#1e1a17]">9º Nível</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Escola de Magia
                </label>
                <select
                  value={spellSchool}
                  onChange={(e) => setSpellSchool(e.target.value)}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-sans text-[#f4ecd8] focus:outline-none transition"
                >
                  {['Evocação', 'Abjuração', 'Necromancia', 'Adivinhação', 'Encantamento', 'Ilusão', 'Invocação', 'Transmutação', 'Outra'].map((sch) => (
                    <option key={sch} value={sch} className="bg-[#1e1a17]">{sch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 3: Tempo de Conjuração | Alcance | Duração */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">Tempo</label>
                <input
                  type="text"
                  value={spellCastingTime}
                  onChange={(e) => setSpellCastingTime(e.target.value)}
                  placeholder="1 Ação, 1 Reação..."
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">Alcance</label>
                <input
                  type="text"
                  value={spellRange}
                  onChange={(e) => setSpellRange(e.target.value)}
                  placeholder="Pessoal, Toque, 18m..."
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">Duração</label>
                <input
                  type="text"
                  value={spellDuration}
                  onChange={(e) => setSpellDuration(e.target.value)}
                  placeholder="Instantâneo, 1 min..."
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
                />
              </div>
            </div>

            {/* Linha 4: Componentes | Fórmula de Dano/Cura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">Componentes</label>
                <input
                  type="text"
                  value={spellComponents}
                  onChange={(e) => setSpellComponents(e.target.value)}
                  placeholder="V, S ou V, S, M (materiais)"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Fórmula Rolável (Opcional)
                </label>
                <input
                  type="text"
                  value={spellDamageFormula}
                  onChange={(e) => setSpellDamageFormula(e.target.value)}
                  placeholder="ex: 8d6 [Fogo], 1d8+3 [Cura]"
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-mono text-amber-200 placeholder-[#6e5840] focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox Magia Preparada */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="spellPreparedCheckbox"
                checked={spellPrepared}
                onChange={(e) => setSpellPrepared(e.target.checked)}
                className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c] cursor-pointer"
              />
              <label htmlFor="spellPreparedCheckbox" className="text-xs text-[#eedbc5] font-sans cursor-pointer select-none">
                Magia está <strong>Preparada / Memorizada</strong> no momento
              </label>
            </div>

            {/* Campo Descrição Detalhada da Magia */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Descrição Detalhada &amp; Efeitos Arcanos<span className="text-amber-400">*</span>
              </label>
              <textarea
                value={spellDescription}
                onChange={(e) => setSpellDescription(e.target.value)}
                rows={4}
                placeholder="Escreva a descrição completa da magia, testes de salvaguarda, efeitos em níveis superiores..."
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
              <button
                type="button"
                onClick={() => setShowSpellModal(false)}
                className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSpellModal}
                className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingSpellId ? 'Atualizar Magia' : 'Salvar no Grimório'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Parchment Style Sheet Container */}
      <div className="bg-[#18130e] border-2 border-[#54412c] rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-7 space-y-6">
        {/* 1. Header do Personagem Integrado com Avatar, Campos de Linha Limpa e Barra de Vida Estendida (Estilo CRIS) */}
        <div className="bg-[#1f1711] border border-[#54412c] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
          {/* Parte Superior: Avatar à Esquerda + Campos de Texto Alinhados à Direita */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6">
            {/* Avatar do Personagem (Enquadrado à esquerda, ocupando toda a altura do bloco) */}
            <div className="relative group flex-shrink-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden border-2 border-[#8c6b32]/70 bg-[#120c08] shadow-2xl flex items-center justify-center">
                {character.avatarUrl ? (
                  <img
                    src={character.avatarUrl}
                    alt={character.characterName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2a1c12] via-[#1a110a] to-[#0f0905] flex flex-col items-center justify-center select-none">
                    <span className="font-serif font-black text-3xl sm:text-4xl text-[#c49d48] tracking-widest">
                      {character.characterName ? character.characterName.slice(0, 2).toUpperCase() : 'HP'}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#8c7457] mt-1 font-mono">
                      Sem Retrato
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de Editar Avatar */}
              <button
                onClick={() => {
                  setAvatarUrlDraft(character.avatarUrl || '');
                  setIsEditingAvatar(true);
                }}
                className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-[#261a12]/90 hover:bg-[#3d2a1b] text-[#c49d48] hover:text-[#f4ecd8] border border-[#8c6b32]/60 shadow-lg transition"
                title="Alterar Retrato do Personagem"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Informações Centrais em Linhas Limpas e Elegantes */}
            <div className="flex-1 w-full space-y-3.5">
              {/* Linha 1: Nome do Personagem & Nome do Jogador */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-8">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#c49d48] block">
                      Nome do Personagem
                    </label>
                    {character.isDead && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-950/95 border border-red-600 text-red-200 text-xs font-serif font-black uppercase tracking-widest shadow-[0_0_12px_rgba(220,38,38,0.5)] animate-pulse">
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span>MORTO</span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateCharacter({
                              ...character,
                              isDead: false,
                              currentHp: 1,
                              deathSaves: { successes: 0, failures: 0 },
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="ml-1 text-[10px] text-amber-300 underline hover:text-white"
                          title="Reviver personagem com 1 HP"
                        >
                          (Reviver)
                        </button>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={character.characterName}
                    onChange={(e) => onUpdateCharacter({ ...character, characterName: e.target.value })}
                    className="w-full bg-transparent text-xl sm:text-2xl font-serif font-black text-[#f4ecd8] border-b-2 border-[#54412c] focus:border-[#c49d48] focus:outline-none transition-colors"
                    placeholder="Nome do Herói"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#a3907a] block mb-0.5">
                    Jogador
                  </label>
                  <input
                    type="text"
                    value={character.playerName}
                    onChange={(e) => onUpdateCharacter({ ...character, playerName: e.target.value })}
                    className="w-full bg-transparent text-sm sm:text-base font-serif font-semibold text-[#eedbc5] border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                    placeholder="Nome do Jogador"
                  />
                </div>
              </div>

              {/* Linha 2: Classe & Nível (Separados!) com Botão de Multiclasse, Nível sem parênteses e Raça */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Classe Principal + Ícone Multiclasse */}
                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] uppercase font-bold text-[#a3907a]">
                      Classe Principal
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMulticlassModal(true)}
                      className="text-[10px] text-[#c49d48] hover:text-[#f4ecd8] flex items-center gap-1 font-bold transition hover:underline"
                      title="Adicionar ou gerenciar multiclasse"
                    >
                      <Plus className="w-3 h-3 text-[#c49d48]" />
                      <span>Multiclasse</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={primaryClass}
                      onChange={(e) => handlePrimaryClassChange(e.target.value)}
                      className="w-full bg-transparent text-sm font-serif font-semibold text-[#f4ecd8] border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                      placeholder="Ex: Paladino, Guerreiro"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMulticlassModal(true)}
                      className="p-1 rounded bg-[#261a12] border border-[#8c6b32]/50 hover:border-[#c49d48] text-[#c49d48] hover:text-white transition flex-shrink-0"
                      title="Adicionar Multiclasse"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Badges de Multiclasses ativas */}
                  {multiclasses.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {multiclasses.map((mc) => (
                        <span
                          key={mc.id}
                          className="text-[10px] bg-[#2a1d13] border border-[#8c6b32]/60 text-[#e8c679] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono"
                        >
                          <span>{mc.className} {mc.level}</span>
                          <button
                            onClick={() => handleRemoveMulticlass(mc.id)}
                            className="hover:text-red-300 ml-0.5"
                            title="Remover"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nível do Personagem (Sem Parênteses e Sem Limite de Nível 20) */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] uppercase font-bold text-[#a3907a]">
                      Nível
                    </label>
                    {multiclasses.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        Total {totalLevel}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={character.level}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      handlePrimaryLevelChange(clean === '' ? 1 : Math.max(1, parseInt(clean, 10)));
                    }}
                    className="w-full bg-transparent text-sm font-serif font-black text-amber-300 border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                  />
                </div>

                {/* Raça */}
                <div className="sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-[#a3907a] block mb-0.5">
                    Raça
                  </label>
                  <input
                    type="text"
                    value={character.race}
                    onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                    className="w-full bg-transparent text-sm font-serif font-semibold text-[#eedbc5] border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                    placeholder="Ex: Humano, Elfo"
                  />
                </div>
              </div>

              {/* Linha 3: Antecedente (Lista suspensa pré-determinada) e Tendência (Lista suspensa pré-determinada) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Antecedente com dropdown */}
                <div className="sm:col-span-5">
                  <label className="text-[10px] uppercase font-bold text-[#a3907a] block mb-0.5">
                    Antecedente (Origem)
                  </label>
                  <select
                    value={character.background}
                    onChange={(e) => onUpdateCharacter({ ...character, background: e.target.value })}
                    className="w-full bg-[#150f0a] text-sm font-serif font-semibold text-[#eedbc5] border border-[#54412c] rounded-lg px-2.5 py-1 focus:border-[#c49d48] focus:outline-none"
                  >
                    {!STANDARD_5E_BACKGROUNDS.includes(character.background) && character.background && (
                      <option value={character.background}>{character.background}</option>
                    )}
                    {STANDARD_5E_BACKGROUNDS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tendência com dropdown */}
                <div className="sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-[#a3907a] block mb-0.5">
                    Tendência
                  </label>
                  <select
                    value={character.alignment}
                    onChange={(e) => onUpdateCharacter({ ...character, alignment: e.target.value })}
                    className="w-full bg-[#150f0a] text-sm font-serif font-semibold text-[#eedbc5] border border-[#54412c] rounded-lg px-2.5 py-1 focus:border-[#c49d48] focus:outline-none"
                  >
                    {!STANDARD_5E_ALIGNMENTS.includes(character.alignment) && character.alignment && (
                      <option value={character.alignment}>{character.alignment}</option>
                    )}
                    {STANDARD_5E_ALIGNMENTS.map((aln) => (
                      <option key={aln} value={aln}>
                        {aln}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pontos de Experiência (XP) */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-[#a3907a] block mb-0.5">
                    Pontos de XP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={character.experiencePoints || 0}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      onUpdateCharacter({
                        ...character,
                        experiencePoints: clean === '' ? 0 : parseInt(clean, 10),
                      });
                    }}
                    className="w-full bg-transparent text-sm font-serif font-semibold text-amber-200 border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caixa de Salvaguardas contra a Morte Automática ao Cair a Zero de Vida */}
        {character.currentHp === 0 && !character.isDead && (
          <div className="bg-[#1c0f0a] border-2 border-red-700/80 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-red-800/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-950 rounded-xl border border-red-600 text-red-400 animate-pulse">
                  <Skull className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-red-200 tracking-wider flex items-center gap-2">
                    <span>MORRENDO (0 HP) — SALVAGUARDAS CONTRA A MORTE</span>
                  </h3>
                  <p className="text-xs text-[#eedbc5] font-serif leading-relaxed">
                    A personagem caiu em <span className="text-red-400 font-bold uppercase tracking-wide">morrendo</span>. <span className="text-emerald-400 font-bold">3 sucessos</span> para retornar da morte, <span className="text-red-400 font-bold">3 falhas</span> e ela estará morta.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInteractiveHeal(1)}
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 rounded-lg text-xs font-serif font-bold transition shadow"
              >
                + Curar (1 HP)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sucessos */}
              <div className="bg-[#120a06] border border-[#54412c] rounded-xl p-3.5 space-y-2 text-center">
                <div className="text-xs uppercase font-bold text-emerald-400 font-serif tracking-wider">
                  Sucessos ({character.deathSaves?.successes || 0} / 3)
                </div>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3].map((slot) => {
                    const checked = (character.deathSaves?.successes || 0) >= slot;
                    return (
                      <button
                        key={`modal_succ_${slot}`}
                        type="button"
                        onClick={() => handleDeathSaveSuccessToggle(slot)}
                        className={`w-10 h-10 rounded-full border-2 transition flex items-center justify-center font-bold text-sm ${
                          checked
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                            : 'bg-[#1e140d] border-[#54412c] text-stone-500 hover:border-emerald-500'
                        }`}
                        title={`Marcar Sucesso ${slot}`}
                      >
                        {checked ? '✓' : slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fracassos */}
              <div className="bg-[#120a06] border border-[#54412c] rounded-xl p-3.5 space-y-2 text-center">
                <div className="text-xs uppercase font-bold text-red-400 font-serif tracking-wider">
                  Fracassos ({character.deathSaves?.failures || 0} / 3)
                </div>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3].map((slot) => {
                    const checked = (character.deathSaves?.failures || 0) >= slot;
                    return (
                      <button
                        key={`modal_fail_${slot}`}
                        type="button"
                        onClick={() => handleDeathSaveFailureToggle(slot)}
                        className={`w-10 h-10 rounded-full border-2 transition flex items-center justify-center font-bold text-sm ${
                          checked
                            ? 'bg-red-700 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                            : 'bg-[#1e140d] border-[#54412c] text-stone-500 hover:border-red-500'
                        }`}
                        title={`Marcar Fracasso ${slot}`}
                      >
                        {checked ? '✕' : slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botão para rolar 1d20 de salvaguarda */}
            <div>
              <button
                type="button"
                onClick={handleRollDeathSave}
                className="w-full py-3 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-[#f4ecd8] font-serif font-black text-sm rounded-xl shadow-lg border border-amber-500/50 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Dices className="w-5 h-5 text-amber-300" />
                <span>Rolar Salvaguarda contra a Morte (1d20)</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT D&D 5E EM 3 COLUNAS VERTICAIS PURAMENTE MANUAIS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full">
          {cardColumns.map((colCards, colIdx) => {
            const isColTarget = dragOverColIdx === colIdx && draggedCardId !== null;

            return (
              <div
                key={`col-${colIdx}`}
                data-column-index={colIdx}
                onDragOver={(e) => handleDragOverColumn(e, colIdx)}
                onDrop={(e) => handleDropColumn(e, colIdx)}
                className={`flex flex-col gap-6 w-full min-w-0 transition-colors duration-200 ${
                  isEditingLayout && isColTarget
                    ? 'bg-amber-950/20 ring-2 ring-dashed ring-amber-400/60 p-2 rounded-2xl'
                    : ''
                }`}
              >
                {colCards.map((cardId) => {
                  const normId = normalizeCardId(cardId);
                  const isDragging = draggedCardId === normId;
                  const isDragOver = dragOverCardId === normId;
                  const isSelectedForSwap = selectedCardForSwap === normId;

                  return (
                    <div
                      key={cardId}
                      id={`card-${normId}`}
                      data-card-id={normId}
                      draggable={isEditingLayout}
                      onDragStart={(e) => handleDragStart(e, normId)}
                      onDragOver={(e) => handleDragOver(e, normId)}
                      onDrop={(e) => handleDrop(e, normId)}
                      onDragEnd={handleDragEnd}
                      className={`w-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isEditingLayout
                          ? 'relative border-2 border-dashed border-[#c49d48] bg-[#160f09]/95 p-1 rounded-2xl shadow-[0_0_15px_rgba(196,157,72,0.25)] cursor-grab active:cursor-grabbing hover:border-amber-300'
                          : ''
                      } ${
                        isDragging
                          ? 'opacity-40 scale-[0.98] border-2 border-amber-400 border-dashed bg-amber-950/40'
                          : ''
                      } ${
                        isDragOver && !isDragging
                          ? 'ring-4 ring-amber-400 border-amber-300 bg-amber-900/40 scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.6)] z-30'
                          : ''
                      }`}
                    >
                  {/* Cabeçalho de DND Visível quando o Modo Layout estiver Ativo */}
                  {isEditingLayout && (
                    <div
                      draggable={true}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, normId);
                      }}
                      className="bg-[#261910] border-b border-[#8c6b32]/70 px-3 py-1.5 flex items-center justify-between text-[11px] font-serif font-bold text-[#e8c679] rounded-t-xl mb-1 select-none cursor-grab active:cursor-grabbing shadow"
                      title="Clique e arraste este ícone para mover o card de lugar"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
                        <span className="uppercase tracking-wider">
                          Arraste para Mover ({getCardTitle(normId)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCardForSwap(normId);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-serif font-bold border transition ${
                          isSelectedForSwap
                            ? 'bg-emerald-600 text-white border-emerald-300'
                            : 'bg-[#1a0f08] border-[#54412c] text-amber-200 hover:text-white hover:bg-amber-800'
                        }`}
                      >
                        {isSelectedForSwap ? '★ Selecionado (Clique em outro)' : 'Trocar Posição'}
                      </button>
                    </div>
                  )}

                  {(() => {
                    switch (normId) {
                      case 'atributos':
                        return (
                          <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-2">
                <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#e8c679]" />
                  <span>Atributos</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAttributesEditModal(true)}
                    className="px-2 py-0.5 rounded bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] text-[11px] font-serif font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Editar Valores Base dos Atributos e Salvaguardas"
                  >
                    <Edit2 className="w-3 h-3 text-[#c49d48]" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryCollapse('atributos')}
                    className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
                    title={isCardCollapsed('atributos') ? 'Expandir atributos' : 'Reduzir atributos para economizar espaço'}
                  >
                    {isCardCollapsed('atributos') ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                  isCardCollapsed('atributos')
                    ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                    : 'max-h-[1400px] opacity-100'
                }`}
              >
              {/* Contêiner Quadrado para o Círculo Místico Rúnico */}
              <div className="relative w-full max-w-[340px] sm:max-w-[350px] aspect-square mx-auto my-1 select-none">
                {/* Camada SVG Rúnica Mística de Fundo */}
                <svg viewBox="0 0 360 360" className="absolute inset-0 w-full h-full pointer-events-none select-none">
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
                  <circle cx="180" cy="180" r="164" fill="none" stroke="#8c6b32" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 6" />
                  <circle cx="180" cy="180" r="152" fill="none" stroke="#c49d48" strokeWidth="1.5" strokeOpacity="0.4" />
                  <circle cx="180" cy="180" r="144" fill="none" stroke="#8c6b32" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 4" />

                  {/* Geometria Estelar Mística Hexagramal conectando os 6 nós (R=132) */}
                  <polygon points="180,48 294,246 66,246" fill="none" stroke="#c49d48" strokeWidth="1.2" strokeOpacity="0.35" />
                  <polygon points="294,114 180,312 66,114" fill="none" stroke="#c49d48" strokeWidth="1.2" strokeOpacity="0.35" />

                  {/* Anel de conexão passando pelo centro dos 6 nós */}
                  <circle cx="180" cy="180" r="132" fill="none" stroke="#d4af37" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="6 8" />

                  {/* Anéis Rúnicos Internos envolvendo o Medalhão Central */}
                  <circle cx="180" cy="180" r="54" fill="none" stroke="#c49d48" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
                  <circle cx="180" cy="180" r="48" fill="none" stroke="#8c6b32" strokeWidth="1.2" strokeOpacity="0.5" />

                  {/* Raios Radiais que ligam o centro a cada um dos 6 nós */}
                  <line x1="180" y1="180" x2="180" y2="48" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
                  <line x1="180" y1="180" x2="294" y2="114" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
                  <line x1="180" y1="180" x2="294" y2="246" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
                  <line x1="180" y1="180" x2="180" y2="312" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
                  <line x1="180" y1="180" x2="66" y2="246" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
                  <line x1="180" y1="180" x2="66" y2="114" stroke="#c49d48" strokeWidth="1" strokeOpacity="0.45" />
                </svg>

                {/* Medalhão Central Arcano: ATRIBUTOS (Idêntico ao C.R.I.S) */}
                <div
                  onClick={() => setShowAttributesEditModal(true)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 p-2 rounded-full bg-gradient-to-br from-[#1e140d] via-[#140d07] to-[#0c0805] border-2 border-[#8c6b32] shadow-[0_0_20px_rgba(196,157,72,0.3)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#e8c679] hover:scale-105 transition-all duration-300 z-10 group box-border"
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

                {/* Os 6 Nós Radiais dos Atributos: FOR, DES, CON, INT, SAB, CAR */}
                {(
                  [
                    { key: 'str', label: 'Força', pt: 'FOR', mod: strMod, top: '13.3%', left: '50%' },
                    { key: 'dex', label: 'Destreza', pt: 'DES', mod: dexMod, top: '31.7%', left: '81.7%' },
                    { key: 'con', label: 'Constituição', pt: 'CON', mod: conMod, top: '68.3%', left: '81.7%' },
                    { key: 'int', label: 'Inteligência', pt: 'INT', mod: intMod, top: '86.7%', left: '50%' },
                    { key: 'wis', label: 'Sabedoria', pt: 'SAB', mod: wisMod, top: '68.3%', left: '18.3%' },
                    { key: 'cha', label: 'Carisma', pt: 'CAR', mod: chaMod, top: '31.7%', left: '18.3%' },
                  ] as const
                ).map(({ key, label, pt, mod, top, left }) => {
                  const score = character.abilities[key].score;
                  const isSaveProf = character.abilities[key].saveProficient;
                  const saveBonus = calculateSavingThrowBonus(mod, profBonus, isSaveProf);

                  return (
                    <div
                      key={key}
                      style={{ top, left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                      <button
                        type="button"
                        onClick={() => onQuickRoll(`1d20+${mod}`, `Teste de ${label} (${pt})`)}
                        className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#24170e] via-[#1a110a] to-[#120b06] border-2 border-[#8c6b32] hover:border-[#e8c679] hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center relative cursor-pointer group shadow-lg"
                        title={`Clique para rolar Teste de ${label} (1d20${formatModifier(mod)})\nSalvaguarda: ${formatModifier(saveBonus)}${isSaveProf ? ' (Proficiente)' : ''}`}
                      >
                        {/* Moldura circular interna */}
                        <div className="absolute inset-1 rounded-full border border-[#d4af37]/25 pointer-events-none" />

                        {/* Modificador proeminente no centro (estilo CRIS) */}
                        <span className="font-serif font-black text-xl text-[#f4ecd8] group-hover:text-[#f5d77f] transition leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {formatModifier(mod)}
                        </span>

                        {/* Nome e Sigla do Atributo */}
                        <span className="text-[9px] uppercase font-serif font-black text-[#c49d48] tracking-wider mt-0.5">
                          {pt}
                        </span>

                        {/* Valor bruto (score) */}
                        <span className="text-[8px] font-mono font-bold text-[#8c7457] leading-none">
                          {score}
                        </span>

                        {/* Marcador de proficiência na salvaguarda */}
                        {isSaveProf && (
                          <span
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 border border-amber-300 text-[9px] text-[#140d07] font-black flex items-center justify-center shadow"
                            title={`Proficiente em Salvaguarda (+${saveBonus})`}
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
          );

        case 'recursos':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl select-none">
              <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-3">
                <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                  <span>Recursos Vitais</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleCategoryCollapse('recursos')}
                  className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
                  title={isCardCollapsed('recursos') ? 'Expandir recursos vitais' : 'Reduzir recursos vitais para economizar espaço'}
                >
                  {isCardCollapsed('recursos') ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                  )}
                </button>
              </div>

              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-4 ${
                  isCardCollapsed('recursos')
                    ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                    : 'max-h-[1600px] opacity-100'
                }`}
              >

              {/* BARRA 1: PONTOS DE VIDA (PV / HP) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black text-xs uppercase tracking-wider text-[#f4ecd8]">
                      VIDA
                    </span>
                    {character.tempHp > 0 && (
                      <span className="text-[10px] font-mono bg-[#2a1c12] border border-[#c49d48]/60 text-[#d4af37] px-1.5 py-0.2 rounded font-bold">
                        +{character.tempHp} Temp
                      </span>
                    )}
                  </div>

                  {/* Controles rápidos de HP Temporário */}
                  <div className="flex items-center gap-1 text-[11px] font-serif">
                    <span className="text-[#8c7457] uppercase font-bold mr-0.5">Temp:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustTempHp(-1)}
                      disabled={!character.tempHp}
                      className="px-1.5 py-0.2 bg-[#261a12] hover:bg-[#382619] disabled:opacity-30 text-[#eedbc5] rounded border border-[#54412c] font-bold transition"
                      title="Subtrair 1 HP Temporário"
                    >
                      -1
                    </button>
                    <span className="font-mono font-bold text-amber-300 min-w-[16px] text-center">
                      {character.tempHp || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustTempHp(1)}
                      className="px-1.5 py-0.2 bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] rounded border border-[#54412c] font-bold transition"
                      title="Adicionar 1 HP Temporário"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustTempHp(5)}
                      className="px-1.5 py-0.2 bg-[#261a12] hover:bg-[#382619] text-[#c49d48] rounded border border-[#8c6b32]/50 font-bold transition ml-0.5"
                      title="Adicionar 5 HP Temporários"
                    >
                      +5
                    </button>
                    {character.tempHp > 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateCharacter({ ...character, tempHp: 0, updatedAt: new Date().toISOString() })}
                        className="text-[9px] text-stone-400 hover:text-red-400 underline ml-1"
                        title="Zerar HP temporário"
                      >
                        Zerar
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra horizontal interativa de HP: « ‹ [ VIDA ] › » */}
                <div className="relative w-full h-11 bg-[#120a06] border-2 border-[#54412c] rounded-xl overflow-hidden shadow-xl flex items-stretch select-none">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none opacity-85 ${
                      character.currentHp / (character.maxHp || 1) > 0.5
                        ? 'bg-gradient-to-r from-red-900 via-red-800 to-red-700'
                        : character.currentHp / (character.maxHp || 1) > 0.25
                        ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-800'
                        : 'bg-gradient-to-r from-red-950 to-red-900 animate-pulse'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, (character.currentHp / (character.maxHp || 1)) * 100))}%`,
                    }}
                  />

                  {/* Botão « (-5 HP) */}
                  <button
                    type="button"
                    onClick={() => handleInteractiveDamage(5)}
                    className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
                    title="Dano -5 HP"
                  >
                    «
                  </button>

                  {/* Botão ‹ (-1 HP) */}
                  <button
                    type="button"
                    onClick={() => handleInteractiveDamage(1)}
                    className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
                    title="Dano -1 HP"
                  >
                    ‹
                  </button>

                  {/* Display Central */}
                  <div className="relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 text-center">
                    <span className="font-serif font-black text-base sm:text-lg text-[#f4ecd8] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {character.currentHp} / {character.maxHp}
                    </span>
                    {character.tempHp > 0 && (
                      <span className="font-mono font-bold text-xs text-[#e8c679] drop-shadow">
                        (+{character.tempHp})
                      </span>
                    )}
                  </div>

                  {/* Botão › (+1 HP) */}
                  <button
                    type="button"
                    onClick={() => handleInteractiveHeal(1)}
                    className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
                    title="Cura +1 HP"
                  >
                    ›
                  </button>

                  {/* Botão » (+5 HP) */}
                  <button
                    type="button"
                    onClick={() => handleInteractiveHeal(5)}
                    className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
                    title="Cura +5 HP"
                  >
                    »
                  </button>
                </div>

                {/* Ajuste manual de HP */}
                <div className="flex items-center justify-end text-[11px] text-[#8c7457] pt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="uppercase text-[9px] font-bold">Editar:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={character.currentHp}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        const val = clean === '' ? 0 : Math.max(0, parseInt(clean, 10));
                        onUpdateCharacter({ ...character, currentHp: val, updatedAt: new Date().toISOString() });
                      }}
                      className="w-16 min-w-[4rem] bg-[#140d08] border border-[#54412c] rounded px-1.5 text-center font-bold text-red-300 text-xs focus:outline-none"
                    />
                    <span>/</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={character.maxHp}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        const val = clean === '' ? 1 : Math.max(1, parseInt(clean, 10));
                        onUpdateCharacter({ ...character, maxHp: val, updatedAt: new Date().toISOString() });
                      }}
                      className="w-16 min-w-[4rem] bg-[#140d08] border border-[#54412c] rounded px-1.5 text-center font-bold text-[#eedbc5] text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BARRA 2: DADOS DE VIDA (Hit Dice - ex: 4/5 d8) */}
              <div className="space-y-2 pt-2 border-t border-[#54412c]/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black text-xs uppercase tracking-wider text-[#f4ecd8]">
                      DADOS DE VIDA
                    </span>
                    <span className="text-[10px] font-mono bg-[#22180f] border border-[#63492e] text-[#eedbc5] px-1.5 py-0.2 rounded font-bold">
                      {parsedHitDice.dieType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRollHitDie}
                    className="text-[10px] font-serif font-bold text-[#c49d48] hover:text-[#f5d77f] hover:underline"
                    title="Gastar 1 dado de vida e rolar cura (+ CON)"
                  >
                    Rolar Dado (+CON)
                  </button>
                </div>

                {/* Barra horizontal interativa de Dados de Vida: « ‹ [ DADOS ] › » */}
                <div className="relative w-full h-10 bg-[#120a06] border-2 border-[#54412c] rounded-xl overflow-hidden shadow-xl flex items-stretch select-none">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-950 via-amber-900 to-[#8c6b32] transition-all duration-300 pointer-events-none opacity-80"
                    style={{
                      width: `${Math.min(100, Math.max(0, (parsedHitDice.currentDice / (parsedHitDice.maxDice || 1)) * 100))}%`,
                    }}
                  />

                  {/* Botão « (Zerar) */}
                  <button
                    type="button"
                    onClick={handleZeroHitDice}
                    className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
                    title="Zerar dados de vida disponíveis"
                  >
                    «
                  </button>

                  {/* Botão ‹ (-1 dado) */}
                  <button
                    type="button"
                    onClick={() => handleHitDiceChange(-1)}
                    className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-r border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
                    title="Gastar 1 Dado de Vida"
                  >
                    ‹
                  </button>

                  {/* Display Central (clique para rolar e curar!) */}
                  <button
                    type="button"
                    onClick={handleRollHitDie}
                    className="relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 text-center hover:bg-[#ffffff]/5 transition"
                    title="Clique para rolar 1 Dado de Vida + CON para cura"
                  >
                    <span className="font-serif font-black text-sm text-[#f4ecd8] drop-shadow">
                      {parsedHitDice.currentDice} / {parsedHitDice.maxDice} {parsedHitDice.dieType}
                    </span>
                  </button>

                  {/* Botão › (+1 dado) */}
                  <button
                    type="button"
                    onClick={() => handleHitDiceChange(1)}
                    className="relative z-10 w-9 bg-[#1a0f08]/65 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-sm transition cursor-pointer"
                    title="Recuperar 1 Dado de Vida"
                  >
                    ›
                  </button>

                  {/* Botão » (Restaurar) */}
                  <button
                    type="button"
                    onClick={handleResetHitDice}
                    className="relative z-10 w-11 bg-[#1a0f08]/75 hover:bg-[#33170c] active:bg-[#4a2010] text-[#f4ecd8] hover:text-white border-l border-[#54412c] flex items-center justify-center font-serif font-black text-xs transition cursor-pointer"
                    title="Restaurar todos os dados de vida"
                  >
                    »
                  </button>
                </div>
              </div>
              </div>
            </div>
          );

        case 'defesa':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl select-none">
              <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2 mb-3">
                <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Defesa &amp; Movimento</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleCategoryCollapse('defesa')}
                  className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
                  title={isCardCollapsed('defesa') ? 'Expandir defesa' : 'Reduzir defesa para economizar espaço'}
                >
                  {isCardCollapsed('defesa') ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                  )}
                </button>
              </div>

              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-4 ${
                  isCardCollapsed('defesa')
                    ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                    : 'max-h-[1600px] opacity-100'
                }`}
              >

              {/* Escudo Ornamental Estilizado de Classe de Armadura (CA) & Decomposição da Defesa */}
              <div className="flex items-center gap-3.5 bg-[#140e09] border border-[#54412c] rounded-xl p-3 shadow-inner">
                {/* Silhueta / Ícone de Escudo de Defesa com Total de CA */}
                <div className="relative w-16 h-18 sm:w-18 sm:h-20 flex-shrink-0 flex items-center justify-center select-none">
                  {/* SVG de Escudo Medieval Rúnico */}
                  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
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

                  {/* Valor da CA dentro do Escudo */}
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

                {/* Título e Fórmula de Defesa (10 + Destreza + Equipamento + Outros) */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-serif font-black text-[#f4ecd8] tracking-wider uppercase">
                      Classe de Armadura
                    </h4>
                  </div>

                  {/* Fórmula Visual: = 10 + DES + Equip. + Outros. */}
                  <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1 font-mono text-xs text-[#a88a56]">
                    <span className="font-bold text-[#c49d48] pb-1">=</span>
                    <div className="flex flex-col items-center min-w-[20px]">
                      <span className="font-bold text-[#eedbc5] text-sm pb-0.5">10</span>
                      <span className="text-[8px] font-serif text-[#6e5840] uppercase">Base</span>
                    </div>
                    <span className="font-bold text-[#8c7457] pb-1">+</span>
                    <div className="flex flex-col items-center min-w-[32px]">
                      <span className="font-bold text-amber-200 text-sm pb-0.5">
                        {formatModifier(dexMod)}
                      </span>
                      <span className="text-[8px] font-serif text-[#6e5840] uppercase">DES</span>
                    </div>
                    <span className="font-bold text-[#8c7457] pb-1">+</span>
                    {/* Bônus de Equipamento (Equip.) */}
                    <div className="flex flex-col items-center min-w-[36px]">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={character.armorClassEquip !== undefined ? character.armorClassEquip : Math.max(0, character.armorClass - 10 - dexMod - (character.armorClassOther || 0))}
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
                    {/* Outros Bônus (Outros.) */}
                    <div className="flex flex-col items-center min-w-[36px]">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={character.armorClassOther || 0}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                          const parsed = clean === '' ? 0 : parseInt(clean, 10);
                          const otherVal = isNaN(parsed) ? 0 : parsed;
                          const equipVal = character.armorClassEquip !== undefined ? character.armorClassEquip : Math.max(0, character.armorClass - 10 - dexMod);
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

                  {/* Nome do Equipamento (Opcional) */}
                  <input
                    type="text"
                    value={character.armorClassType || ''}
                    onChange={(e) => onUpdateCharacter({ ...character, armorClassType: e.target.value, updatedAt: new Date().toISOString() })}
                    placeholder="Nome do Equipamento (ex: Cota de Malha, Escudo...)"
                    className="w-full bg-[#1e140d]/80 border border-[#54412c]/60 focus:border-[#c49d48] rounded px-2 py-0.5 text-[11px] font-serif text-[#eedbc5] placeholder-[#6e5840] focus:outline-none"
                    title="Nome da Armadura ou Equipamento que soma na Classe de Armadura"
                  />
                </div>
              </div>

              {/* Grid Compacto de Indicadores Complementares: Iniciativa (+Bônus), Deslocamento (0m/q), Proficiência e Percepção (+Bônus) */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                {/* Iniciativa com suporte a bônus adicional (ex: Alerta, itens) */}
                <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
                    <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    <span className="truncate">Iniciativa</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onQuickRoll(`1d20${formatModifier(totalInitiative)}`, `Iniciativa de ${character.characterName}`)}
                    className="text-xl sm:text-2xl font-serif font-black text-amber-200 hover:text-amber-400 transition cursor-pointer my-0.5 truncate max-w-full"
                    title={`Clique para rolar Iniciativa (1d20${formatModifier(totalInitiative)})\n(DES: ${formatModifier(dexMod)} | Bônus: ${formatModifier(initiativeBonus)})`}
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
                      title="Bônus adicional para Iniciativa (ex: Talento Alerta +5)"
                    />
                  </div>
                </div>

                {/* Deslocamento em Metros / Quadrados (Espaço Físico Garantido de w-16 min-w-[4rem] para 3+ dígitos) */}
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
                      title="Deslocamento em metros (ex: 0m, 9m, 90m, 120m). Clique para editar"
                    />
                    <span className="text-xs font-serif font-bold text-emerald-400 flex-shrink-0">m</span>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-[9px] text-[#8c7457] font-serif truncate max-w-full">
                    <span className="font-bold text-emerald-200">{speedInSquares} q</span>
                    <span>(1,5m = 1q)</span>
                  </div>
                </div>

                {/* Bônus de Proficiência (Calculado pelo Nível) */}
                <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2 flex flex-col items-center justify-between shadow-sm space-y-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif truncate max-w-full">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">Proficiência</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-serif font-black text-amber-400 my-0.5 truncate max-w-full">
                    +{profBonus}
                  </div>
                  <span className="text-[9px] text-[#8c7457] font-serif truncate max-w-full">Nível Total {totalLevel}</span>
                </div>

                {/* Percepção Passiva com suporte a bônus adicional (ex: Observador) */}
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
                      title="Bônus adicional para Percepção Passiva (ex: Talento Observador +5)"
                    />
                  </div>
                </div>
              </div>

              {/* Pacote da Salvaguarda de Magia & Ataque Mágico com Layout Flex de Requisito Exato */}
              <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 shadow-sm space-y-2 w-full max-w-full overflow-hidden">
                {/* Cabeçalho de Requisito Exato: flex flex-row items-center gap-3 w-full flex-wrap */}
                <div className="flex flex-row items-center gap-3 w-full flex-wrap sm:flex-nowrap justify-between border-b border-[#54412c]/50 pb-2">
                  <div className="flex items-center gap-1.5 text-xs uppercase font-serif font-black text-[#d4af37] min-w-0">
                    <Crown className="w-4 h-4 text-[#e8c679] flex-shrink-0" />
                    <span className="truncate">Salvaguarda &amp; Magia</span>
                  </div>

                  {/* Container de Requisito Exato: CHAVE + Select empurrado naturalmente */}
                  <div className="flex flex-row items-center gap-3 w-full sm:w-auto text-[10px] font-serif text-[#eedbc5]">
                    <span className="text-[#8c7457] font-bold uppercase tracking-wider flex-shrink-0">CHAVE:</span>
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

                {/* Estrutura Reta de 2 Colunas Totalmente Contidas com Suporte a Bônus Customizado */}
                <div className="grid grid-cols-2 gap-2 text-center pt-0.5 w-full max-w-full overflow-hidden">
                  {/* COLUNA 1: CD SALVAGUARDA */}
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
                        title="Bônus adicional para CD de Salvaguarda de Magia (ex: Cajado do Pacto +1)"
                      />
                    </div>
                  </div>

                  {/* COLUNA 2: ATAQUE MÁGICO */}
                  <div className="bg-[#1c130c] border border-[#54412c] rounded-lg p-2 flex flex-col items-center justify-between min-w-0 w-full max-w-full overflow-hidden space-y-1">
                    <button
                      type="button"
                      onClick={() => onQuickRoll(`1d20${formatModifier(spellAttackBonus)}`, `Ataque Mágico de ${character.characterName}`)}
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
                        title="Bônus adicional para Ataque Mágico (ex: Foco Arcano +1)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          );

        case 'pericias':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none">
              {/* Cabeçalho do Card Central */}
              <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e8c679]" />
                  <span className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37]">
                    Perícias &amp; Salvaguardas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-[#eedbc5] font-serif bg-[#24170e] border border-[#54412c] px-2 py-0.5 rounded-md">
                    Prof: <strong className="text-amber-300 font-mono">+{profBonus}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryCollapse('pericias')}
                    className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
                    title={isCardCollapsed('pericias') ? 'Expandir perícias' : 'Reduzir perícias para economizar espaço'}
                  >
                    {isCardCollapsed('pericias') ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-3 ${
                  isCardCollapsed('pericias')
                    ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                    : 'max-h-[3000px] opacity-100'
                }`}
              >

              {/* Filtro Rápido e Busca (Totalmente Contido Anti-Transbordo) */}
              <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-4">
                <div className="flex p-0.5 bg-[#120a06] border border-[#54412c] rounded-lg gap-0.5 text-[10px] font-serif font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setSkillTabFilter('all')}
                    className={`px-2 py-0.5 rounded transition ${
                      skillTabFilter === 'all'
                        ? 'bg-[#c49d48] text-[#140d07] shadow-sm'
                        : 'text-[#8c7457] hover:text-[#eedbc5]'
                    }`}
                  >
                    Todas (24)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillTabFilter('skills')}
                    className={`px-2 py-0.5 rounded transition ${
                      skillTabFilter === 'skills'
                        ? 'bg-[#c49d48] text-[#140d07] shadow-sm'
                        : 'text-[#8c7457] hover:text-[#eedbc5]'
                    }`}
                  >
                    Perícias (18)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillTabFilter('saves')}
                    className={`px-2 py-0.5 rounded transition ${
                      skillTabFilter === 'saves'
                        ? 'bg-[#c49d48] text-[#140d07] shadow-sm'
                        : 'text-[#8c7457] hover:text-[#eedbc5]'
                    }`}
                  >
                    Salvaguardas (6)
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Buscar..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="flex-1 min-w-[140px] max-w-full bg-[#120a06] border border-[#54412c] rounded-lg px-2.5 py-1 text-[11px] text-[#eedbc5] placeholder-[#6d573f] focus:outline-none focus:border-[#c49d48]"
                />
              </div>

              {/* Tabela de Cabeçalho em CSS Grid Perfeitamente Estruturado com Alinhamento Pixel-perfeito */}
              <div className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-2 items-center w-full text-[10px] sm:text-xs uppercase font-serif font-bold text-[#8c7457] border-b border-[#54412c]/40 pb-1.5 select-none px-2">
                <span className="text-center">D20</span>
                <span className="text-center">MAESTRIA</span>
                <span className="truncate min-w-0">NOME (ATRIBUTO)</span>
                <span className="text-center">OUTROS</span>
                <span className="text-right">TOTAL</span>
              </div>

              {/* Lista Vertical Densa e Bem Alinhada sem sobreposição */}
              <div className="divide-y divide-[#54412c]/30 max-h-[620px] overflow-y-auto pr-1 space-y-0.5">
                {/* 1. SEÇÃO DE SALVAGUARDAS (6) */}
                {(skillTabFilter === 'all' || skillTabFilter === 'saves') && (
                  <div className="space-y-0.5 pt-0.5">
                    {skillTabFilter === 'all' && (
                      <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase font-serif font-black text-[#c49d48] tracking-wider bg-[#18110b] border-y border-[#54412c]/40 flex items-center justify-between">
                        <span>Testes de Salvaguarda (6)</span>
                        <span className="text-[8px] font-mono text-[#8c7457]">D&amp;D 5E</span>
                      </div>
                    )}

                    {(
                      [
                        { key: 'str', label: 'Salvaguarda de Força', pt: 'FOR' },
                        { key: 'dex', label: 'Salvaguarda de Destreza', pt: 'DES' },
                        { key: 'con', label: 'Salvaguarda de Constituição', pt: 'CON' },
                        { key: 'int', label: 'Salvaguarda de Inteligência', pt: 'INT' },
                        { key: 'wis', label: 'Salvaguarda de Sabedoria', pt: 'SAB' },
                        { key: 'cha', label: 'Salvaguarda de Carisma', pt: 'CAR' },
                      ] as const
                    )
                      .filter(
                        (sv) =>
                          !skillSearchQuery ||
                          sv.label.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                          sv.pt.toLowerCase().includes(skillSearchQuery.toLowerCase())
                      )
                      .map(({ key, label, pt }) => {
                        const abilityData = character.abilities[key];
                        const mod = calculateAbilityModifier(abilityData.score);
                        const isProf = abilityData.saveProficient;
                        const customBonus = abilityData.saveCustomBonus || 0;
                        const totalBonus = calculateSavingThrowBonus(mod, profBonus, isProf, customBonus);

                        return (
                          <div
                            key={`save_row_${key}`}
                            className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-2 items-center w-full px-2 py-1 rounded-lg border-l-2 border-transparent hover:border-[#c49d48] hover:bg-[#281b10] hover:shadow-[0_0_12px_rgba(196,157,72,0.18)] transition-all duration-150 group text-xs"
                          >
                            {/* Col 1: D20 Rolagem Imediata */}
                            <button
                              type="button"
                              onClick={() =>
                                onQuickRoll(`1d20+${totalBonus}`, `${label} (${pt})`)
                              }
                              className="w-full flex items-center justify-center text-[#8c7457] group-hover:text-[#f5d77f] hover:bg-[#3d2719] transition rounded py-0.5"
                              title={`Rolar Salvaguarda de ${label} (1d20${formatModifier(totalBonus)})`}
                            >
                              <Dices className="w-3.5 h-3.5" />
                            </button>

                            {/* Col 2: Marcador/Ícone de Proficiência */}
                            <button
                              type="button"
                              onClick={() => handleSaveProficiencyToggle(key)}
                              className={`w-full py-0.5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition ${
                                isProf
                                  ? 'bg-amber-600 border-amber-300 text-[#140d07] shadow-[0_0_8px_rgba(217,119,6,0.6)] font-black'
                                  : 'bg-[#140d08] border-[#54412c] text-stone-600 hover:border-[#8c6b32]'
                              }`}
                              title={`Proficiência em Salvaguarda: ${
                                isProf ? 'Sim (+ prof)' : 'Não'
                              } (Clique para alternar)`}
                            >
                              {isProf ? '★' : '☆'}
                            </button>

                            {/* Col 3: Nome da Salvaguarda + Atributo Base */}
                            <div className="truncate flex items-center gap-1 min-w-0">
                              <span
                                onClick={() =>
                                  onQuickRoll(`1d20+${totalBonus}`, `${label} (${pt})`)
                                }
                                title={label}
                                className="font-serif font-semibold text-[#f4ecd8] group-hover:text-amber-200 transition cursor-pointer select-none truncate text-xs"
                              >
                                {label}
                              </span>
                              <span className="text-[10px] text-[#8c7457] font-mono shrink-0">
                                ({pt})
                              </span>
                            </div>

                            {/* Col 4: Campo de Bônus Adicional / Outros */}
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9\-+]*"
                              value={customBonus === 0 ? '' : customBonus}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                                if (clean === '' || clean === '-' || clean === '+') {
                                  handleSaveCustomBonusChange(key, 0);
                                } else {
                                  const parsed = parseInt(clean, 10);
                                  handleSaveCustomBonusChange(key, isNaN(parsed) ? 0 : parsed);
                                }
                              }}
                              className="w-full bg-[#120a06] border border-[#54412c] group-hover:border-[#8c6b32] focus:border-[#c49d48] rounded px-1 py-0.5 text-center font-mono text-[11px] text-amber-200 focus:outline-none"
                              placeholder="0"
                              title="Bônus adicional / outros (itens mágicos, bênçãos, etc.)"
                            />

                            {/* Col 5: Modificador Total Calculado */}
                            <span className="font-mono font-black text-amber-300 text-right drop-shadow text-xs truncate w-full">
                              {formatModifier(totalBonus)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* 2. SEÇÃO DE PERÍCIAS (18 D&D 5E) */}
                {(skillTabFilter === 'all' || skillTabFilter === 'skills') && (
                  <div className="space-y-0.5 pt-1">
                    {skillTabFilter === 'all' && (
                      <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase font-serif font-black text-[#c49d48] tracking-wider bg-[#18110b] border-y border-[#54412c]/40 flex items-center justify-between">
                        <span>Perícias</span>
                      </div>
                    )}

                    {DEFAULT_5E_SKILLS.filter(
                      (sk) =>
                        !skillSearchQuery ||
                        sk.namePt.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                        sk.ability.toLowerCase().includes(skillSearchQuery.toLowerCase())
                    ).map((sk) => {
                      const currentSkill = character.skills[sk.id] || {
                        name: sk.name,
                        namePt: sk.namePt,
                        ability: sk.ability,
                        proficiency: 'none',
                        customBonus: 0,
                      };
                      const abilityMod = getModByName(sk.ability);
                      const customBonus = currentSkill.customBonus || 0;
                      const totalBonus = calculateSkillBonus(
                        abilityMod,
                        profBonus,
                        currentSkill.proficiency,
                        customBonus
                      );

                      const abilityLabelPt: Record<AbilityName, string> = {
                        str: 'FOR',
                        dex: 'DES',
                        con: 'CON',
                        int: 'INT',
                        wis: 'SAB',
                        cha: 'CAR',
                      };

                      return (
                        <div
                          key={sk.id}
                          className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-2 items-center w-full px-2 py-1 rounded-lg border-l-2 border-transparent hover:border-[#c49d48] hover:bg-[#281b10] hover:shadow-[0_0_12px_rgba(196,157,72,0.18)] transition-all duration-150 group text-xs"
                        >
                          {/* Col 1: D20 Rolagem Imediata */}
                          <button
                            type="button"
                            onClick={() =>
                              onQuickRoll(
                                `1d20+${totalBonus}`,
                                `Perícia: ${sk.namePt} (${abilityLabelPt[sk.ability]})`
                              )
                            }
                            className="w-full flex items-center justify-center text-[#8c7457] group-hover:text-[#f5d77f] hover:bg-[#3d2719] transition rounded py-0.5"
                            title={`Rolar teste de ${sk.namePt} (1d20${formatModifier(totalBonus)})`}
                          >
                            <Dices className="w-3.5 h-3.5" />
                          </button>

                          {/* Col 2: Marcador/Ícone de Proficiência */}
                          <button
                            type="button"
                            onClick={() => {
                              const next: Record<SkillProficiencyLevel, SkillProficiencyLevel> = {
                                none: 'proficient',
                                proficient: 'expertise',
                                expertise: 'half',
                                half: 'none',
                              };
                              handleSkillProficiencyChange(sk.id, next[currentSkill.proficiency]);
                            }}
                            className={`w-full py-0.5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition ${
                              currentSkill.proficiency === 'expertise'
                                ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)] font-black'
                                : currentSkill.proficiency === 'proficient'
                                ? 'bg-[#c49d48] border-[#e8c679] text-[#140d07] shadow-sm font-black'
                                : currentSkill.proficiency === 'half'
                                ? 'bg-[#2b1f15] border-[#8c6b32] text-amber-200'
                                : 'bg-[#140d08] border-[#54412c] text-stone-600 hover:border-[#8c6b32]'
                            }`}
                            title={`Treino: ${
                              currentSkill.proficiency === 'expertise'
                                ? 'Especialização (2x)'
                                : currentSkill.proficiency === 'proficient'
                                ? 'Proficiente (1x)'
                                : currentSkill.proficiency === 'half'
                                ? 'Meia-Proficiência (0.5x)'
                                : 'Sem Treino'
                            } (Clique para alternar)`}
                          >
                            {currentSkill.proficiency === 'expertise'
                              ? '✪'
                              : currentSkill.proficiency === 'proficient'
                              ? '●'
                              : currentSkill.proficiency === 'half'
                              ? '½'
                              : '○'}
                          </button>

                          {/* Col 3: Nome da Perícia + Atributo Base */}
                          <div className="truncate flex items-center gap-1 min-w-0">
                            <span
                              onClick={() =>
                                onQuickRoll(
                                  `1d20+${totalBonus}`,
                                  `Perícia: ${sk.namePt} (${abilityLabelPt[sk.ability]})`
                                )
                              }
                              title={sk.namePt}
                              className="font-serif font-semibold text-[#f4ecd8] group-hover:text-amber-200 transition cursor-pointer select-none truncate text-xs"
                            >
                              {sk.namePt}
                            </span>
                            <span className="text-[10px] text-[#8c7457] font-mono shrink-0">
                              ({abilityLabelPt[sk.ability]})
                            </span>
                          </div>

                          {/* Col 4: Campo de Bônus Adicional / Outros */}
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9\-+]*"
                            value={customBonus === 0 ? '' : customBonus}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                              if (clean === '' || clean === '-' || clean === '+') {
                                handleSkillCustomBonusChange(sk.id, 0);
                              } else {
                                const parsed = parseInt(clean, 10);
                                handleSkillCustomBonusChange(sk.id, isNaN(parsed) ? 0 : parsed);
                              }
                            }}
                            className="w-full bg-[#120a06] border border-[#54412c] group-hover:border-[#8c6b32] focus:border-[#c49d48] rounded px-1 py-0.5 text-center font-mono text-[11px] text-amber-200 focus:outline-none"
                            placeholder="0"
                            title="Bônus adicional / outros (itens mágicos, bênçãos, etc.)"
                          />

                          {/* Col 5: Modificador Total Calculado */}
                          <span className="font-mono font-black text-amber-300 text-right drop-shadow text-xs truncate w-full">
                            {formatModifier(totalBonus)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </div>
            </div>
          );

        case 'combate':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none">
                <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-[#e8c679]" />
                    <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
                      Combate &amp; Ataques DE ARMA
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold">
                      {character.attacks.length} ataque(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenCreateAttackModal}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[11px] rounded-lg shadow transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Novo Ataque
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryCollapse('combate')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#120a06] hover:bg-[#261a12] text-[#eedbc5] border border-[#54412c] font-serif font-bold text-[11px] rounded-lg transition cursor-pointer"
                      title={isCardCollapsed('combate') ? 'Expandir card de combate' : 'Reduzir card de combate para economizar espaço'}
                    >
                      {isCardCollapsed('combate') ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                          <span>Expandir</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                          <span>Reduzir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-3 ${
                    isCardCollapsed('combate')
                      ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                      : 'max-h-[3500px] opacity-100'
                  }`}
                >
                  {character.attacks.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-[#140d08] border-2 border-dashed border-[#54412c] rounded-2xl space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#24170e] border border-[#8c6b32]/60 flex items-center justify-center text-[#c49d48] shadow-inner">
                        <Swords className="w-6 h-6" />
                      </div>
                      <p className="font-serif font-bold text-sm text-[#eedbc5]">
                        Você ainda não possui ataques ou magias preparadas
                      </p>
                      <p className="text-xs text-[#8c7457] font-serif max-w-xs mx-auto">
                        Adicione armas brancas, à distância, magias de ataque ou manobras especiais para usar em combate.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateAttackModal}
                        className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-xl shadow-md border border-[#e8c679]/40 transition active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Novo Ataque / Ação</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {character.attacks.map((atk, idx) => {
                        const attackTestFormula = buildAttackTestFormula(atk);
                        const attackDmgFormula = buildAttackDamageFormula(atk);

                        return (
                          <div
                            key={atk.id}
                            className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2 relative hover:border-[#8c6b32] transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={atk.name}
                                  onChange={(e) => {
                                    const newAttacks = [...character.attacks];
                                    newAttacks[idx].name = e.target.value;
                                    onUpdateCharacter({ ...character, attacks: newAttacks });
                                  }}
                                  className="font-serif font-bold text-amber-200 text-sm bg-transparent border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none w-full"
                                  placeholder="Nome da Arma ou Ataque"
                                />
                                {atk.critical && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#251910] text-[#e8c679] border border-[#8c6b32]/60 font-mono flex-shrink-0">
                                    Crit: {atk.critical} (x{atk.multiplier || 2})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAttackModal(atk)}
                                  className="text-[#c49d48] hover:text-[#f4ecd8] hover:bg-[#2c1d12] p-1.5 rounded transition"
                                  title="Editar ataque no painel C.R.I.S."
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = character.attacks.filter((_, i) => i !== idx);
                                    onUpdateCharacter({ ...character, attacks: filtered });
                                  }}
                                  className="text-stone-500 hover:text-red-400 p-1.5 rounded transition"
                                  title="Remover ataque"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] text-[#8c7457] font-serif block mb-0.5">Bônus de Ataque</label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={atk.attackBonus}
                                    onChange={(e) => {
                                      const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                                      const parsed = parseInt(clean, 10);
                                      const newAttacks = [...character.attacks];
                                      newAttacks[idx].attackBonus = isNaN(parsed) ? 0 : parsed;
                                      onUpdateCharacter({ ...character, attacks: newAttacks });
                                    }}
                                    className="w-16 min-w-[4rem] bg-[#1b120b] border border-[#54412c] rounded px-1.5 py-1 text-amber-300 font-bold focus:outline-none text-center"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onQuickRoll(attackTestFormula, `Ataque com ${atk.name}`)}
                                    className="px-2.5 py-1 bg-[#2a1c12] hover:bg-[#382619] text-[#c49d48] border border-[#8c6b32]/60 rounded font-bold text-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                                    title={`Rolar Ataque (${attackTestFormula})`}
                                  >
                                    <Dices className="w-3 h-3 text-[#e8c679]" />
                                    <span>Acertar</span>
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-[#8c7457] font-serif block mb-0.5">Dano / Tipo</label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={atk.damage}
                                    onChange={(e) => {
                                      const newAttacks = [...character.attacks];
                                      newAttacks[idx].damage = e.target.value;
                                      onUpdateCharacter({ ...character, attacks: newAttacks });
                                    }}
                                    placeholder="ex: 1d8+3"
                                    className="w-20 bg-[#1b120b] border border-[#54412c] rounded px-1.5 py-1 text-white font-mono text-xs focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onQuickRoll(attackDmgFormula, `Dano de ${atk.name}`)}
                                    className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 rounded font-bold text-xs border border-red-800/60 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                                    title={`Rolar Dano (${attackDmgFormula})`}
                                  >
                                    <Flame className="w-3 h-3 text-red-400" />
                                    <span>Dano</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Tags de Dano Separado, Alcance, Vantagens e Bônus Fixo */}
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              {atk.damageType && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2b180d] border border-[#7a572a] text-[#f4ecd8] font-mono">
                                  {atk.damageType}
                                </span>
                              )}
                              {atk.fixedBonus !== undefined && atk.fixedBonus !== 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#251910] border border-[#8c6b32]/60 text-amber-300 font-mono font-bold">
                                  Fixo: {formatModifier(atk.fixedBonus)}
                                </span>
                              )}
                              {atk.advantageLevel && atk.advantageLevel > 0 ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold uppercase">
                                  ★ +{atk.advantageLevel}d Vantagem
                                </span>
                              ) : null}
                              {atk.advantageLevel && atk.advantageLevel < 0 ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-600 font-bold uppercase">
                                  ⚠️ +{Math.abs(atk.advantageLevel)}d Desvantagem
                                </span>
                              ) : null}
                              {atk.extraDamage && atk.extraDamage.map((ed) => (
                                <span
                                  key={ed.id}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-[#24170e] border border-amber-700/60 text-amber-200 font-mono"
                                >
                                  +{ed.damage} {ed.damageType}
                                </span>
                              ))}
                              {atk.range && atk.range !== '-' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e140d] border border-[#54412c] text-[#8c7457] font-sans">
                                  {atk.range}
                                </span>
                              )}
                            </div>

                            <input
                              type="text"
                              value={atk.notes || ''}
                              placeholder="Propriedades / Alcance / Efeitos (ex: Versátil, Alcance 18m...)"
                              onChange={(e) => {
                                const newAttacks = [...character.attacks];
                                newAttacks[idx].notes = e.target.value;
                                onUpdateCharacter({ ...character, attacks: newAttacks });
                              }}
                              className="w-full text-[11px] text-[#eedbc5] bg-transparent border-t border-[#54412c]/60 pt-1 focus:outline-none placeholder-[#6d573f]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
          );

        case 'habilidades':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none">
                <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e8c679]" />
                    <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
                      Habilidades &amp; Traços DE CLASSE / RAÇA
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold">
                      {featuresList.length} habilidade(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[11px] rounded-lg shadow transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Nova Habilidade
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryCollapse('habilidades')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#120a06] hover:bg-[#261a12] text-[#eedbc5] border border-[#54412c] font-serif font-bold text-[11px] rounded-lg transition cursor-pointer"
                      title={isCardCollapsed('habilidades') ? 'Expandir card de habilidades' : 'Reduzir card de habilidades para economizar espaço'}
                    >
                      {isCardCollapsed('habilidades') ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                          <span>Expandir</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                          <span>Reduzir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-3 ${
                    isCardCollapsed('habilidades')
                      ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                      : 'max-h-[4000px] opacity-100'
                  }`}
                >

                    {/* Busca Rápida de Habilidades */}
                    {featuresList.length > 3 && (
                      <div className="relative">
                        <input
                          type="text"
                          value={featureSearchQuery}
                          onChange={(e) => setFeatureSearchQuery(e.target.value)}
                          placeholder="Buscar habilidade por nome ou palavra-chave..."
                          className="w-full bg-[#1b120b] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1 text-xs font-serif text-[#eedbc5] placeholder-[#7d6750] focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Lista de Cards de Habilidades */}
                    {featuresList.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-[#120a06] border border-dashed border-[#54412c] rounded-lg space-y-2">
                        <Sparkles className="w-6 h-6 text-[#8c7457] mx-auto opacity-50" />
                        <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                          Nenhuma característica ou habilidade cadastrada.
                        </p>
                        <p className="text-[10px] text-[#8c7457] font-serif">
                          Clique em "+ Nova Habilidade" acima para adicionar talentos, habilidades de classe ou raça.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {featuresList
                          .filter(f => !featureSearchQuery || f.name.toLowerCase().includes(featureSearchQuery.toLowerCase()) || f.description.toLowerCase().includes(featureSearchQuery.toLowerCase()))
                          .map((feat) => {
                            const isCollapsed = collapsedFeatureIds[feat.id] ?? false;
                            const isEditing = editingFeatureId === feat.id;

                            if (isEditing) {
                              return (
                                <div
                                  key={feat.id}
                                  className="bg-[#1e150e] border-2 border-[#c49d48] rounded-xl p-3.5 space-y-3 shadow-xl"
                                >
                                  {/* Cabeçalho da Edição */}
                                  <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2">
                                    <span className="text-xs font-serif font-black text-amber-300 uppercase tracking-wider">
                                      Editar Habilidade
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditFeature(feat.id)}
                                        className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1 cursor-pointer shadow"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Salvar</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingFeatureId(null)}
                                        className="px-2.5 py-1 bg-[#2a1d13] hover:bg-[#3d2a1b] text-stone-300 border border-[#54412c] rounded-lg text-xs font-serif transition cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>

                                  {/* Linha 1: Nome da Habilidade (2 colunas) + Origem / Categoria (1 coluna) */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div className="sm:col-span-2">
                                      <label className="text-[10px] uppercase font-serif font-bold text-[#a89073] block mb-1">
                                        Nome da Habilidade / Traço *
                                      </label>
                                      <input
                                        type="text"
                                        value={editingFeatureName}
                                        onChange={(e) => setEditingFeatureName(e.target.value)}
                                        placeholder="Eclético, Instinto da Ceifadora..."
                                        className="w-full bg-[#140d08] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1.5 text-xs font-serif font-bold text-amber-200 focus:outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] uppercase font-serif font-bold text-[#a89073] block mb-1">
                                        Origem / Categoria
                                      </label>
                                      <input
                                        type="text"
                                        value={editingFeatureSource}
                                        onChange={(e) => setEditingFeatureSource(e.target.value)}
                                        placeholder="Classe, Raça, Talento, NEX 10%..."
                                        className="w-full bg-[#140d08] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1.5 text-xs font-serif text-[#eedbc5] focus:outline-none transition"
                                      />
                                    </div>
                                  </div>

                                  {/* Linha 2: Marcador Checkbox Custo + Input dinâmico (some se desmarcado) */}
                                  <div className="bg-[#140d08] border border-[#54412c]/80 rounded-lg p-2.5 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`hasCost_${feat.id}`}
                                        checked={editingFeatureHasCost}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setEditingFeatureHasCost(checked);
                                          if (!checked) setEditingFeatureCost('');
                                        }}
                                        className="w-4 h-4 rounded accent-[#c49d48] bg-[#1a120b] border border-[#54412c] cursor-pointer"
                                      />
                                      <label
                                        htmlFor={`hasCost_${feat.id}`}
                                        className="text-xs font-serif font-bold text-[#c49d48] cursor-pointer select-none"
                                      >
                                        Possui Custo ou Limite de Uso?
                                      </label>
                                    </div>

                                    {editingFeatureHasCost && (
                                      <div className="pt-1.5 border-t border-[#54412c]/40">
                                        <label className="text-[10px] uppercase font-serif font-bold text-[#a89073] block mb-1">
                                          Custo / Limite de Uso
                                        </label>
                                        <input
                                          type="text"
                                          value={editingFeatureCost}
                                          onChange={(e) => setEditingFeatureCost(e.target.value)}
                                          placeholder="2 PE, 1/Descanso, 3/Dia..."
                                          className="w-full sm:w-2/3 bg-[#1b120b] border border-[#8c6b32]/70 focus:border-[#c49d48] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none transition"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Linha 3: Descrição & Efeitos (Largura total) */}
                                  <div>
                                    <label className="text-[10px] uppercase font-serif font-bold text-[#a89073] block mb-1">
                                      Descrição &amp; Efeitos *
                                    </label>
                                    <textarea
                                      value={editingFeatureDescription}
                                      onChange={(e) => setEditingFeatureDescription(e.target.value)}
                                      rows={3}
                                      placeholder="Descreva detalhadamente o funcionamento e regras desta habilidade..."
                                      className="w-full bg-[#140d08] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-xs font-serif text-[#eedbc5] focus:outline-none transition"
                                    />
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={feat.id}
                                className="bg-[#150e09] border border-[#54412c] hover:border-[#8c6b32] rounded-xl overflow-hidden shadow-md transition group"
                              >
                                {/* Card Header Expandível (exatamente no estilo CRIS da imagem de referência) */}
                                <div
                                  onClick={() => handleToggleExpandFeature(feat.id)}
                                  className="px-3.5 py-2.5 bg-[#1e150e] hover:bg-[#281b12] border-b border-[#54412c]/50 flex items-center justify-between cursor-pointer select-none transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      className="text-[#c49d48] hover:text-[#f4ecd8] transition flex-shrink-0"
                                    >
                                      {isCollapsed ? (
                                        <ChevronDown className="w-4 h-4 text-[#c49d48]" />
                                      ) : (
                                        <ChevronUp className="w-4 h-4 text-[#c49d48]" />
                                      )}
                                    </button>
                                    <h4 className="font-serif font-bold text-sm text-[#f4ecd8] group-hover:text-amber-300 transition truncate">
                                      {feat.name}
                                    </h4>
                                    {feat.source && (
                                      <span className="text-[10px] font-serif px-2 py-0.2 rounded bg-[#2a1d13] text-[#d4af37] border border-[#8c6b32]/40 hidden sm:inline-block truncate">
                                        {feat.source}
                                      </span>
                                    )}
                                    {feat.cost && (
                                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold flex-shrink-0">
                                        {feat.cost}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditFeature(feat);
                                      }}
                                      className="text-[11px] font-serif font-bold text-emerald-400 hover:text-emerald-300 transition px-1.5 py-0.5 hover:bg-emerald-950/40 rounded cursor-pointer"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFeature(feat.id);
                                      }}
                                      className="text-[11px] font-serif font-bold text-red-400 hover:text-red-300 transition px-1.5 py-0.5 hover:bg-red-950/40 rounded cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>

                                {/* Conteúdo Expandido (Descrição e Detalhes) */}
                                {!isCollapsed && (
                                  <div className="p-3.5 bg-[#120a06] text-xs text-[#eedbc5] font-serif leading-relaxed space-y-2 border-t border-[#3d2a1b]/40">
                                    <p className="whitespace-pre-line text-[#eedbc5]">
                                      {feat.description || 'Sem descrição cadastrada.'}
                                    </p>
                                    {(feat.source || feat.cost) && (
                                      <div className="pt-2 border-t border-[#3d2a1b]/60 flex items-center gap-3 text-[10px] text-[#8c7457] font-mono">
                                        {feat.source && (
                                          <span>Origem: <strong className="text-[#c49d48]">{feat.source}</strong></span>
                                        )}
                                        {feat.cost && (
                                          <span>Custo: <strong className="text-amber-300">{feat.cost}</strong></span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                  {/* Sub-seção Homebrews */}
                  <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-1.5">
                      <span className="text-xs font-serif font-black uppercase text-[#d4af37] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#e8c679]" />
                        <span>Regras &amp; Traços Homebrew</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddHomebrew}
                        className="text-xs font-serif font-bold text-[#c49d48] hover:text-[#f5d77f] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    </div>

                    {(character.homebrews || []).length === 0 ? (
                      <p className="text-xs text-[#8c7457] italic text-center py-2">
                        Nenhum traço homebrew cadastrado.
                      </p>
                    ) : (
                      character.homebrews.map((hb, idx) => (
                        <div
                          key={hb.id}
                          className="bg-[#120a06] border border-[#54412c] rounded-lg p-2.5 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={hb.name}
                              onChange={(e) => {
                                const list = [...character.homebrews];
                                list[idx].name = e.target.value;
                                onUpdateCharacter({ ...character, homebrews: list });
                              }}
                              className="font-serif font-bold text-amber-200 text-xs bg-transparent border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const list = character.homebrews.filter((_, i) => i !== idx);
                                onUpdateCharacter({ ...character, homebrews: list });
                              }}
                              className="text-stone-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <textarea
                            value={hb.description}
                            onChange={(e) => {
                              const list = [...character.homebrews];
                              list[idx].description = e.target.value;
                              onUpdateCharacter({ ...character, homebrews: list });
                            }}
                            rows={2}
                            placeholder="Descrição e efeitos..."
                            className="w-full text-xs text-[#eedbc5] bg-[#1a120b] border border-[#54412c] rounded p-1.5 focus:outline-none"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
            </div>
          );

        case 'magias': {
          const spellcastingAbilityKey = character.spellcastingAbility || 'int';
              const spellAbilityScore = character.abilities[spellcastingAbilityKey]?.score || 10;
              const spellAbilityMod = calculateAbilityModifier(spellAbilityScore);
              const spellDcVal = calculateSpellSaveDc(profBonus, spellAbilityMod) + (character.spellSaveDcBonus || 0);
              const spellAttackVal = calculateSpellAttackBonus(profBonus, spellAbilityMod) + (character.spellAttackBonus || 0);

              const abilityLabelMap: Record<AbilityName, string> = {
                str: 'Força',
                dex: 'Destreza',
                con: 'Constituição',
                int: 'Inteligência',
                wis: 'Sabedoria',
                cha: 'Carisma',
              };

              const allSpells = character.spells || [];
              const preparedSpellsCount = allSpells.filter((s) => s.prepared).length;

              const filteredSpells = allSpells.filter((sp) => {
                if (spellLevelFilter === 'prepared' && !sp.prepared) return false;
                if (spellLevelFilter !== 'all' && spellLevelFilter !== 'prepared') {
                  const targetLvl = parseInt(spellLevelFilter, 10);
                  if (sp.level !== targetLvl) return false;
                }
                if (spellSearchQuery.trim()) {
                  const query = spellSearchQuery.toLowerCase();
                  const nameMatch = sp.name.toLowerCase().includes(query);
                  const schoolMatch = (sp.school || '').toLowerCase().includes(query);
                  const descMatch = (sp.description || '').toLowerCase().includes(query);
                  const formulaMatch = ((sp as any).damageFormula || '').toLowerCase().includes(query);
                  if (!nameMatch && !schoolMatch && !descMatch && !formulaMatch) return false;
                }
                return true;
              });

              return (
                <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none">
                  <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#e8c679]" />
                      <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
                        Magias &amp; Grimório DE CONJURAÇÃO
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold">
                        {allSpells.length} magia(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenCreateSpellModal}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[11px] rounded-lg shadow transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Nova Magia
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCategoryCollapse('magias')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#120a06] hover:bg-[#261a12] text-[#eedbc5] border border-[#54412c] font-serif font-bold text-[11px] rounded-lg transition cursor-pointer"
                        title={isCardCollapsed('magias') ? 'Expandir card de magias' : 'Reduzir card de magias para economizar espaço'}
                      >
                        {isCardCollapsed('magias') ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                            <span>Expandir</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                            <span>Reduzir</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-4 ${
                      isCardCollapsed('magias')
                        ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                        : 'max-h-[6000px] opacity-100'
                    }`}
                  >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {/* Atributo de Conjuração */}
                        <div className="bg-[#120a06] border border-[#54412c] rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8c7457] font-serif">
                            <span>Atributo Conjurar</span>
                            <span className="text-[#e8c679] font-mono">{formatModifier(spellAbilityMod)}</span>
                          </div>
                          <select
                            value={spellcastingAbilityKey}
                            onChange={(e) =>
                              onUpdateCharacter({
                                ...character,
                                spellcastingAbility: e.target.value as AbilityName,
                              })
                            }
                            className="mt-1 text-xs font-serif font-bold text-amber-200 bg-[#1a120b] border border-[#54412c] rounded p-1.5 focus:border-[#c49d48] focus:outline-none cursor-pointer w-full box-border"
                          >
                            <option value="int">INT (Mago / Artífice)</option>
                            <option value="wis">SAB (Clérigo / Druida / Ranger)</option>
                            <option value="cha">CAR (Bardo / Bruxo / Feiticeiro / Paladino)</option>
                            <option value="str">FOR (Força)</option>
                            <option value="dex">DES (Destreza)</option>
                            <option value="con">CON (Constituição)</option>
                          </select>
                        </div>

                        {/* CD de Salvaguarda */}
                        <div className="bg-[#120a06] border border-[#54412c] rounded-lg p-2.5 text-center min-w-0">
                          <span className="text-[10px] uppercase font-bold text-[#8c7457] font-serif block truncate">
                            CD de Salvaguarda
                          </span>
                          <span className="text-xl font-serif font-black text-amber-300 block my-0.5">
                            {spellDcVal}
                          </span>
                          <span className="text-[9px] text-[#8c7457] font-mono block truncate">
                            8 + {profBonus} (Prof) {spellAbilityMod >= 0 ? `+ ${spellAbilityMod}` : spellAbilityMod} ({abilityLabelMap[spellcastingAbilityKey].substring(0,3).toUpperCase()}) {character.spellSaveDcBonus ? (character.spellSaveDcBonus > 0 ? `+ ${character.spellSaveDcBonus}` : character.spellSaveDcBonus) : ''}
                          </span>
                        </div>

                        {/* Ataque Mágico & Preparadas */}
                        <div className="bg-[#120a06] border border-[#54412c] rounded-lg p-2.5 text-center flex flex-col justify-between min-w-0">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8c7457] font-serif block truncate">
                              Bônus de Ataque Mágico
                            </span>
                            <span className="text-xl font-serif font-black text-emerald-300 block my-0.5">
                              {formatModifier(spellAttackVal)}
                            </span>
                          </div>
                          <div className="pt-1 border-t border-[#3d2a1b]/60 flex items-center justify-between text-[10px] text-[#eedbc5] font-serif">
                            <span>Magias Preparadas:</span>
                            <strong className="text-amber-200">{preparedSpellsCount}</strong>
                          </div>
                        </div>
                      </div>

                    {/* GERENCIADOR DE ESPAÇOS DE MAGIA (1º AO 9º NÍVEL) */}
                    <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#54412c]/60 pb-2">
                        <span className="text-xs font-serif font-black uppercase text-[#d4af37] flex items-center gap-1.5 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-[#e8c679] flex-shrink-0" />
                          <span className="truncate">Espaços de Conjuração (1º ao 9º Nível)</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleResetAllSpellSlots}
                          className="text-[11px] font-serif font-bold text-[#c49d48] hover:text-[#f5d77f] flex items-center gap-1 bg-[#261a12] px-2.5 py-1 rounded border border-[#54412c] cursor-pointer transition whitespace-nowrap self-start sm:self-auto flex-shrink-0"
                          title="Restaurar todos os espaços de magia usados"
                        >
                          Restaurar Todos (Descanso Longo)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                          const slot = (character.spellSlots || []).find((s) => s.level === lvl) || {
                            level: lvl,
                            total: lvl === 1 ? 4 : lvl === 2 ? 3 : lvl === 3 ? 2 : 0,
                            used: 0,
                          };
                          const available = Math.max(0, slot.total - slot.used);

                          return (
                            <div
                              key={lvl}
                              className="bg-[#120a06] p-3 rounded-xl border border-[#54412c] flex flex-col justify-between gap-2 text-xs min-w-0 box-border shadow-inner"
                            >
                              <div className="flex items-center justify-between border-b border-[#3d2a1b]/60 pb-1.5 min-w-0">
                                <span className="text-xs text-[#c49d48] font-bold font-serif whitespace-nowrap">
                                  {lvl}º Nível
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#8c7457] font-mono flex-shrink-0">
                                  <span className="whitespace-nowrap">Total:</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={slot.total}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value.replace(/\D/g, '') || '0', 10));
                                      handleUpdateSpellSlotTotal(lvl, val);
                                    }}
                                    className="w-7 text-center bg-[#1a120b] border border-[#54412c] rounded text-amber-200 font-bold focus:outline-none focus:border-[#c49d48]"
                                  />
                                </div>
                              </div>

                              {/* Steppers de Uso */}
                              <div className="flex items-center justify-between gap-1 w-full bg-[#180f0a] px-2 py-1 rounded-lg border border-[#3d2a1b] box-border">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustSpellSlotUsed(lvl, -1)}
                                  disabled={slot.used <= 0}
                                  className="w-5 h-5 flex items-center justify-center bg-[#261a12] border border-[#54412c] rounded text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold flex-shrink-0 cursor-pointer text-xs"
                                  title="Restaurar 1 espaço"
                                >
                                  -
                                </button>
                                <div className="flex items-center gap-1 font-mono text-[11px] font-black text-[#eedbc5] whitespace-nowrap">
                                  <span>{slot.used}</span>
                                  <span className="text-[#8c7457]">/</span>
                                  <span>{slot.total}</span>
                                  <span className="text-[9px] text-[#8c7457] font-serif ml-0.5">gastos</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustSpellSlotUsed(lvl, 1)}
                                  disabled={slot.used >= slot.total && slot.total > 0}
                                  className="w-5 h-5 flex items-center justify-center bg-[#261a12] border border-[#54412c] rounded text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold flex-shrink-0 cursor-pointer text-xs"
                                  title="Gastar 1 espaço"
                                >
                                  +
                                </button>
                              </div>

                              {/* Badge de Disponibilidade com bom respiro lateral */}
                              <div className={`text-[10px] font-mono font-bold py-1 px-2 rounded-lg text-center w-full box-border truncate ${
                                available > 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-red-950/80 text-red-300 border border-red-900/60'
                              }`}>
                                {available} disponív{available === 1 ? 'el' : 'eis'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* FILTROS DE NÍVEL E BUSCA RESPONSIVA */}
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={spellSearchQuery}
                          onChange={(e) => setSpellSearchQuery(e.target.value)}
                          placeholder="Buscar magia por nome, escola ou fórmula..."
                          className="w-full text-xs text-[#eedbc5] bg-[#140e09] border border-[#54412c] rounded-lg px-2.5 py-1.5 focus:border-[#c49d48] focus:outline-none font-serif placeholder:text-[#8c7457]/70"
                        />
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#54412c] max-w-full">
                          {[
                            { id: 'all', label: 'Todas' },
                            { id: '0', label: 'Truques' },
                            { id: '1', label: '1º' },
                            { id: '2', label: '2º' },
                            { id: '3', label: '3º' },
                            { id: '4', label: '4º' },
                            { id: '5', label: '5º' },
                            { id: '6', label: '6º' },
                            { id: '7', label: '7º' },
                            { id: '8', label: '8º' },
                            { id: '9', label: '9º' },
                            { id: 'prepared', label: 'Preparadas' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSpellLevelFilter(tab.id)}
                              className={`px-2 py-1 rounded text-[11px] font-serif font-bold transition whitespace-nowrap cursor-pointer flex-shrink-0 ${
                                spellLevelFilter === tab.id
                                  ? 'bg-[#c49d48] text-[#140d07]'
                                  : 'bg-[#140e09] text-[#8c7457] hover:text-[#eedbc5] border border-[#54412c]'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* LISTA DE MAGIAS */}
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {filteredSpells.length === 0 ? (
                        <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-6 text-center space-y-2">
                          <p className="text-xs text-[#8c7457] italic font-serif">
                            {allSpells.length === 0
                              ? 'Nenhuma magia cadastrada no grimório. Clique em "+ Nova Magia" acima para começar!'
                              : 'Nenhuma magia encontrada com os filtros selecionados.'}
                          </p>
                        </div>
                      ) : (
                        filteredSpells.map((sp) => {
                          const isCollapsed = collapsedSpellIds[sp.id] ?? false;
                          const formula = (sp as any).damageFormula || '';

                          return (
                            <div
                              key={sp.id}
                              className={`bg-[#140e09] border rounded-xl overflow-hidden transition ${
                                sp.prepared ? 'border-[#8c6b32]' : 'border-[#3d2a1b]'
                              }`}
                            >
                              {/* Header Card */}
                              <div className="p-3 bg-[#1a120b] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#54412c]/40">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <input
                                    type="checkbox"
                                    checked={sp.prepared}
                                    onChange={() => handleToggleSpellPrepared(sp.id)}
                                    className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer accent-[#c49d48]"
                                    title={sp.prepared ? 'Magia Preparada (clique para desmarcar)' : 'Marcar como Preparada'}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCollapsedSpellIds((prev) => ({
                                        ...prev,
                                        [sp.id]: !isCollapsed,
                                      }))
                                    }
                                    className="font-serif font-black text-amber-200 text-sm hover:text-white text-left transition"
                                  >
                                    {sp.name}
                                  </button>

                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold">
                                    {sp.level === 0 ? 'Truque' : `${sp.level}º Nível`} • {sp.school || 'Evocação'}
                                  </span>

                                  {sp.prepared && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 font-serif font-bold">
                                      Preparada
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  {formula && (
                                    <button
                                      type="button"
                                      onClick={() => onQuickRoll(formula, sp.name)}
                                      className="flex items-center gap-1 text-[11px] font-serif font-bold px-2.5 py-1 bg-amber-950/80 text-amber-200 hover:bg-amber-900 border border-amber-700/80 rounded cursor-pointer transition shadow"
                                      title={`Rolar magia (${formula})`}
                                    >
                                      <Dices className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Rolar ({formula})</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSpellModal(sp)}
                                    className="text-[11px] font-serif font-bold text-emerald-400 hover:text-emerald-300 transition px-1.5 py-0.5 hover:bg-emerald-950/40 rounded cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSpell(sp.id)}
                                    className="text-[11px] font-serif font-bold text-red-400 hover:text-red-300 transition px-1.5 py-0.5 hover:bg-red-950/40 rounded cursor-pointer"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>

                              {/* Visualização de detalhes / Descrição */}
                              {!isCollapsed && (
                                <div className="p-3 bg-[#120a06] text-xs space-y-2 border-t border-[#3d2a1b]/40">
                                  {/* Metadados da Magia */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#8c7457] font-mono bg-[#1a120b] p-2 rounded border border-[#3d2a1b]/60">
                                    <div>
                                      <span className="block text-[#c49d48]">Conjuração:</span>
                                      <span className="text-[#eedbc5]">{sp.castingTime || '1 Ação'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[#c49d48]">Alcance:</span>
                                      <span className="text-[#eedbc5]">{sp.range || '18m'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[#c49d48]">Componentes:</span>
                                      <span className="text-[#eedbc5]">{sp.components || 'V, S'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[#c49d48]">Duração:</span>
                                      <span className="text-[#eedbc5]">{sp.duration || 'Instantâneo'}</span>
                                    </div>
                                  </div>

                                  {/* Descrição */}
                                  <p className="whitespace-pre-line text-[#eedbc5] font-serif leading-relaxed">
                                    {sp.description || 'Sem descrição cadastrada.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
            );
        }

        case 'inventario': {
          const strScore = character.abilities.str?.score || 10;
                const maxCapacityKg = Math.round((strScore * 7.5) + (character.maxWeightBonus || 0));

                const coinPl = character.coins.pl || 0;
                const coinPo = character.coins.po || 0;
                const coinPp = character.coins.pp || 0;
                const coinPe = character.coins.pe || 0;
                const coinPc = character.coins.pc || 0;
                const totalCoinCount = coinPl + coinPo + coinPp + coinPe + coinPc;
                const coinsWeightKg = Math.round((totalCoinCount / 100) * 10) / 10;

                const itemsWeightKg = Math.round(inventoryItemsList.reduce((acc, item) => acc + ((item.quantity || 1) * (item.weightKg || 0)), 0) * 10) / 10;
                const grandTotalWeightKg = Math.round((itemsWeightKg + coinsWeightKg) * 10) / 10;
                const isOvercapacity = grandTotalWeightKg > maxCapacityKg;
                const weightPercent = Math.min(100, Math.round((grandTotalWeightKg / Math.max(1, maxCapacityKg)) * 100));
                const totalQuantityCount = inventoryItemsList.reduce((acc, item) => acc + (item.quantity || 1), 0);

                const filteredInventory = inventoryItemsList.filter((item) => {
                  const matchesSearch = !inventorySearchQuery.trim() ||
                    item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
                    (item.description && item.description.toLowerCase().includes(inventorySearchQuery.toLowerCase()));

                  if (!matchesSearch) return false;
                  if (inventoryCategoryFilter === 'all') return true;
                  if (inventoryCategoryFilter === 'equipped') return !!item.equipped;
                  if (inventoryCategoryFilter === 'weapons_armor') return item.category === 'Arma' || item.category === 'Armadura';
                  if (inventoryCategoryFilter === 'potions') return item.category === 'Poção';
                  if (inventoryCategoryFilter === 'rations') return item.category === 'Ração';
                  if (inventoryCategoryFilter === 'other') return item.category === 'Geral' || item.category === 'Ferramenta' || item.category === 'Tesouro' || item.category === 'Outro';
                  return true;
                });

                return (
                  <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none">
                    <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Backpack className="w-4 h-4 text-[#e8c679]" />
                        <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
                          Inventário &amp; Equipamento
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold">
                          {inventoryItemsList.length} item(ns) ({grandTotalWeightKg} kg)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenCreateInventoryItemModal}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[11px] rounded-lg shadow transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Adicionar Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryCollapse('inventario')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#120a06] hover:bg-[#261a12] text-[#eedbc5] border border-[#54412c] font-serif font-bold text-[11px] rounded-lg transition cursor-pointer"
                          title={isCardCollapsed('inventario') ? 'Expandir card de inventário' : 'Reduzir card de inventário para economizar espaço'}
                        >
                          {isCardCollapsed('inventario') ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                              <span>Expandir</span>
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                              <span>Reduzir</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-4 ${
                        isCardCollapsed('inventario')
                          ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                          : 'max-h-[5000px] opacity-100'
                      }`}
                    >
                    {/* Card Resumo de Capacidade de Carga (kg) & Peso Total */}
                    <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3.5 space-y-3 shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#54412c]/60 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#251910] border border-[#8c6b32]/60 text-[#c49d48]">
                            <Backpack className="w-5 h-5 text-[#e8c679]" />
                          </div>
                          <div>
                            <span className="font-serif font-black uppercase text-[#d4af37] text-xs block">
                              Capacidade de Carga &amp; Peso Total
                            </span>
                            <span className="text-[10px] text-[#8c7457] font-mono">
                              FOR ({strScore}) × 7.5 kg = {(strScore * 7.5).toFixed(1)} kg base
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-[#8c7457] uppercase font-serif block">Peso Atual</span>
                            <strong className={`font-mono text-sm ${isOvercapacity ? 'text-red-400 font-black' : 'text-amber-300'}`}>
                              {grandTotalWeightKg} kg
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#8c7457] uppercase font-serif block">Carga Máxima</span>
                            <strong className="font-mono text-sm text-[#f4ecd8]">
                              {maxCapacityKg} kg
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Progresso do Peso */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#a89073]">
                            Itens ({itemsWeightKg} kg) + Moedas ({coinsWeightKg} kg)
                          </span>
                          <span className={`font-bold ${isOvercapacity ? 'text-red-400' : 'text-[#c49d48]'}`}>
                            {weightPercent}% ocupado
                          </span>
                        </div>
                        <div className="w-full bg-[#120a06] border border-[#54412c] rounded-full h-3 overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOvercapacity
                                ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                : weightPercent > 75
                                ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                            }`}
                            style={{ width: `${weightPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Banner de Aviso de Sobrepeso */}
                      {isOvercapacity && (
                        <div className="bg-red-950/80 border border-red-600/80 rounded-lg p-2 flex items-center gap-2 text-xs text-red-200">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
                          <span>
                            <strong>Aviso de Carga Pesada:</strong> O peso carregado ({grandTotalWeightKg} kg) excede sua capacidade de carga máxima ({maxCapacityKg} kg). Seu movimento pode sofrer penalidades!
                          </span>
                        </div>
                      )}

                      {/* Ajuste Rápido de Bônus de Capacidade */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#54412c]/40 text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-[#8c7457]">
                          <span>Contagem Total de Itens: <strong className="text-[#eedbc5] font-mono">{totalQuantityCount} un.</strong> ({inventoryItemsList.length} distintos)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-[#8c7457] font-serif uppercase">Bônus Capacidade (kg):</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={character.maxWeightBonus || 0}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              onUpdateCharacter({
                                ...character,
                                maxWeightBonus: clean === '' ? 0 : parseInt(clean, 10),
                              });
                            }}
                            className="w-14 bg-[#120a06] border border-[#54412c] focus:border-[#c49d48] rounded px-1.5 py-0.5 text-xs font-mono text-center text-amber-200 focus:outline-none"
                            title="Bônus de capacidade em kg para mochilas extradimensionais ou traços raciais"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bolsa de Moedas */}
                    <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-black uppercase text-[#d4af37] block">
                          Bolsa de Moedas ({totalCoinCount} moedas ≈ {coinsWeightKg} kg)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 text-center text-xs">
                        <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
                          <span className="text-[9px] uppercase font-bold text-[#e5e4e2] block font-serif">PL (Platina)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={character.coins.pl || 0}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              onUpdateCharacter({
                                ...character,
                                coins: { ...character.coins, pl: clean === '' ? 0 : parseInt(clean, 10) },
                              });
                            }}
                            className="w-full bg-transparent text-center font-bold text-[#e5e4e2] font-mono focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
                          <span className="text-[9px] uppercase font-bold text-yellow-400 block font-serif">PO (Ouro)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={character.coins.po}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              onUpdateCharacter({
                                ...character,
                                coins: { ...character.coins, po: clean === '' ? 0 : parseInt(clean, 10) },
                              });
                            }}
                            className="w-full bg-transparent text-center font-bold text-yellow-300 font-mono focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
                          <span className="text-[9px] uppercase font-bold text-stone-300 block font-serif">PP (Prata)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={character.coins.pp}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              onUpdateCharacter({
                                ...character,
                                coins: { ...character.coins, pp: clean === '' ? 0 : parseInt(clean, 10) },
                              });
                            }}
                            className="w-full bg-transparent text-center font-bold text-stone-300 font-mono focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
                          <span className="text-[9px] uppercase font-bold text-cyan-300 block font-serif">PE (Electro)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={character.coins.pe || 0}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              onUpdateCharacter({
                                ...character,
                                coins: { ...character.coins, pe: clean === '' ? 0 : parseInt(clean, 10) },
                              });
                            }}
                            className="w-full bg-transparent text-center font-bold text-cyan-300 font-mono focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
                          <span className="text-[9px] uppercase font-bold text-amber-600 block font-serif">PC (Cobre)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={character.coins.pc || 0}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              onUpdateCharacter({
                                ...character,
                                coins: { ...character.coins, pc: clean === '' ? 0 : parseInt(clean, 10) },
                              });
                            }}
                            className="w-full bg-transparent text-center font-bold text-amber-600 font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Barra de Ferramentas: Busca, Filtros & Botão Adicionar Item */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={inventorySearchQuery}
                            onChange={(e) => setInventorySearchQuery(e.target.value)}
                            placeholder="BUSCAR ITEM NO INVENTÁRIO..."
                            className="w-full bg-[#120a06] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1.5 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenCreateInventoryItemModal}
                          className="px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Adicionar Item</span>
                        </button>
                      </div>

                      {/* Filtros por Categoria */}
                      <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                        {[
                          { id: 'all', label: 'Todos' },
                          { id: 'equipped', label: 'Equipados' },
                          { id: 'weapons_armor', label: 'Armas & Armaduras' },
                          { id: 'potions', label: 'Poções' },
                          { id: 'rations', label: 'Rações' },
                          { id: 'other', label: 'Outros' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setInventoryCategoryFilter(tab.id)}
                            className={`px-2.5 py-1 rounded-lg border font-serif font-bold transition flex-shrink-0 cursor-pointer ${
                              inventoryCategoryFilter === tab.id
                                ? 'bg-[#c49d48] text-[#140d07] border-[#e8c679]'
                                : 'bg-[#140e09] text-[#8c7457] border-[#54412c] hover:text-[#eedbc5]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista de Itens do Inventário */}
                    <div className="space-y-2">
                      {filteredInventory.length === 0 ? (
                        <div className="text-center py-8 px-4 bg-[#140d08] border-2 border-dashed border-[#54412c] rounded-xl space-y-2">
                          <Backpack className="w-8 h-8 text-[#8c7457] mx-auto opacity-60" />
                          <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                            {inventorySearchQuery || inventoryCategoryFilter !== 'all'
                              ? 'Nenhum item encontrado com o filtro selecionado.'
                              : 'Nenhum item cadastrado no inventário.'}
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenCreateInventoryItemModal}
                            className="px-3 py-1.5 bg-[#24170e] hover:bg-[#382415] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/60 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar Primeiro Item</span>
                          </button>
                        </div>
                      ) : (
                        filteredInventory.map((item) => {
                          const itemTotalWeightKg = Math.round((item.quantity * item.weightKg) * 10) / 10;

                          return (
                            <div
                              key={item.id}
                              className={`bg-[#140e09] border rounded-xl p-3 space-y-2 transition ${
                                item.equipped
                                  ? 'border-emerald-700/80 bg-[#141712] shadow-sm'
                                  : 'border-[#54412c] hover:border-[#8c6b32]'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                {/* Checkbox Equipado + Nome + Badge Categoria */}
                                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEquippedInventoryItem(item.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                                      item.equipped
                                        ? 'bg-emerald-600 border-emerald-400 text-white'
                                        : 'bg-[#1e150e] border-[#54412c] text-transparent hover:border-[#8c6b32]'
                                    }`}
                                    title={item.equipped ? 'Item equipado (clique para desequipar)' : 'Clique para equipar'}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>

                                  <div>
                                    <div className="flex items-center gap-2">
                                      <strong className="font-serif font-black text-sm text-[#f4ecd8]">
                                        {item.name}
                                      </strong>
                                      {item.equipped && (
                                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600/80 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                                          Equipado
                                        </span>
                                      )}
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-serif border ${
                                          item.category === 'Arma'
                                            ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                                            : item.category === 'Armadura'
                                            ? 'bg-purple-950 text-purple-300 border-purple-700/60'
                                            : item.category === 'Poção'
                                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                                            : item.category === 'Ração'
                                            ? 'bg-orange-950 text-orange-300 border-orange-700/60'
                                            : 'bg-[#1e150e] text-[#a89073] border-[#54412c]'
                                        }`}
                                      >
                                        {item.category || 'Geral'}
                                      </span>
                                    </div>

                                    {/* Peso em kg */}
                                    <div className="text-[11px] font-mono text-[#8c7457] flex items-center gap-2 mt-0.5">
                                      <span>
                                        Peso Unit.: <strong className="text-amber-200">{item.weightKg} kg</strong>
                                      </span>
                                      <span>•</span>
                                      <span>
                                        Peso Total: <strong className="text-amber-300 font-bold">{itemTotalWeightKg} kg</strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Stepper de Quantidade + Botões de Ação */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className="flex items-center bg-[#120a06] border border-[#54412c] rounded-lg p-1 gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustQuantityInventoryItem(item.id, -1)}
                                      className="w-6 h-6 rounded bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] flex items-center justify-center font-bold text-xs cursor-pointer"
                                      title="Diminuir quantidade"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-mono font-bold text-xs text-amber-300">
                                      {item.quantity}x
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustQuantityInventoryItem(item.id, 1)}
                                      className="w-6 h-6 rounded bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] flex items-center justify-center font-bold text-xs cursor-pointer"
                                      title="Aumentar quantidade"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditInventoryItemModal(item)}
                                      className="p-1.5 rounded text-[#8c7457] hover:text-[#c49d48] hover:bg-[#251910] transition cursor-pointer"
                                      title="Editar item"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInventoryItem(item.id)}
                                      className="p-1.5 rounded text-[#8c7457] hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                                      title="Remover item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Descrição do Item */}
                              {item.description && (
                                <div className="pt-1 border-t border-[#54412c]/40 text-xs text-[#eedbc5] font-sans">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
            );
        }

        case 'biografia':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none">
                  {/* Cabeçalho do Card Biografia */}
                  <div className="flex items-center justify-between border-b-2 border-[#54412c]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#e8c679]" />
                      <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
                        Biografia &amp; Anotações
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryCollapse('biografia')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#120a06] hover:bg-[#261a12] text-[#eedbc5] border border-[#54412c] font-serif font-bold text-[11px] rounded-lg transition cursor-pointer"
                      title={isCardCollapsed('biografia') ? 'Expandir card de biografia' : 'Reduzir card de biografia para economizar espaço'}
                    >
                      {isCardCollapsed('biografia') ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                          <span>Expandir</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                          <span>Reduzir</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-3 ${
                      isCardCollapsed('biografia')
                        ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                        : 'max-h-[3000px] opacity-100'
                    }`}
                  >
                      {/* Antecedente e Traços de Personalidade */}
                      <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2 text-xs">
                        <span className="font-serif font-black uppercase text-[#d4af37] block">
                          História &amp; Personalidade
                        </span>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#8c7457] font-serif block">História de Fundo / Origem</label>
                          <textarea
                            value={character.backstory || ''}
                            onChange={(e) => onUpdateCharacter({ ...character, backstory: e.target.value })}
                            rows={3}
                            placeholder="Origem, família, juramentos e eventos marcantes..."
                            className="w-full text-xs text-[#eedbc5] bg-[#120a06] border border-[#54412c] rounded p-2 focus:outline-none focus:border-[#c49d48]"
                          />
                        </div>
                      </div>

                      {/* DM Notes Section */}
                      <div className="bg-[#1a1008] border border-amber-900/50 rounded-xl p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-black text-amber-400 uppercase flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5" /> Anotações do Mestre da Campanha
                          </span>
                          <span className="text-[10px] text-[#8c7457] font-serif">
                            {userRole === 'dm' ? 'Editável pelo Mestre' : 'Somente Leitura'}
                          </span>
                        </div>
                        <textarea
                          value={character.dmNotes || ''}
                          disabled={userRole !== 'dm'}
                          onChange={(e) => onUpdateCharacter({ ...character, dmNotes: e.target.value })}
                          rows={3}
                          placeholder={
                            userRole === 'dm'
                              ? 'Escreva notas da trama, segredos, recompensas ocultas ou maldições para este herói...'
                              : 'Anotações confidenciais do Mestre...'
                          }
                          className="w-full text-xs text-amber-200 bg-[#120a06] border border-amber-900/50 rounded p-2 focus:outline-none disabled:opacity-75"
                        />
                      </div>
                    </div>
                </div>
          );

        case 'condicoes':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl select-none">
              {renderMinimalCardHeader(
                'condicoes',
                'Condições de D&D 5E',
                <AlertCircle className="w-4 h-4 text-amber-400" />,
                (character.activeConditions || []).length > 0 || (character.exhaustionLevel || 0) > 0 ? (
                  <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 px-2 py-0.5 rounded-full">
                    {(character.activeConditions || []).length + ((character.exhaustionLevel || 0) > 0 ? 1 : 0)} Ativa(s)
                  </span>
                ) : undefined,
                <div className="flex items-center gap-1.5">
                  {((character.activeConditions || []).length > 0 || (character.exhaustionLevel || 0) > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateCharacter({
                          ...character,
                          activeConditions: [],
                          exhaustionLevel: 0,
                          updatedAt: new Date().toISOString(),
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/60 text-[10px] font-serif font-bold transition cursor-pointer"
                      title="Remover todas as condições e exaustão"
                    >
                      Limpar Todas
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryCollapse('condicoes')}
                    className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
                    title={isCardCollapsed('condicoes') ? 'Expandir condições' : 'Reduzir condições para economizar espaço'}
                  >
                    {isCardCollapsed('condicoes') ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                    )}
                  </button>
                </div>
              )}

              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-3.5 ${
                  isCardCollapsed('condicoes')
                    ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                    : 'max-h-[1600px] opacity-100'
                }`}
              >
                {/* GRID DE CONDIÇÕES OFICIAIS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'amedrontado', name: 'Amedrontado', desc: 'Desvantagem em testes de habilidade e ataques enquanto a fonte do medo estiver na linha de visão. Não pode se aproximar voluntariamente da fonte.' },
                    { id: 'agarrado', name: 'Agarrado', desc: 'Velocidade cai para 0 e nenhum bônus de velocidade se aplica. Termina se o agrilhoador estiver incapacitado ou se um efeito forçar a separação.' },
                    { id: 'atordoado', name: 'Atordoado', desc: 'Incapacitado, não pode se mover e fala gaguejando. Falha automática em testes de FOR e DES. Ataques contra o alvo têm Vantagem.' },
                    { id: 'cego', name: 'Cego', desc: 'Falha automática em testes que dependem de visão. Ataques contra o alvo têm Vantagem; os ataques do alvo têm Desvantagem.' },
                    { id: 'enfeitiçado', name: 'Enfeitiçado', desc: 'Não pode atacar o enfeitiçador nem alvejá-lo com habilidades nocivas ou mágicas benévolas. O enfeitiçador tem Vantagem em testes sociais contra o alvo.' },
                    { id: 'envenenado', name: 'Envenenado', desc: 'Desvantagem em testes de habilidade e jogadas de ataque.' },
                    { id: 'impedido', name: 'Impedido', desc: 'Velocidade cai para 0. Ataques contra o alvo têm Vantagem; ataques do alvo têm Desvantagem. Desvantagem em testes de DES.' },
                    { id: 'incapacitado', name: 'Incapacitado', desc: 'Não pode realizar ações ou reações.' },
                    { id: 'inconsciente', name: 'Inconsciente', desc: 'Incapacitado, solta o que estiver segurando, cai caído (prono) e não pode falar ou ceder atenção ao ambiente. Falha automática em testes de FOR e DES. Ataques contra têm Vantagem e qualquer acerto a até 1.5m é Crítico.' },
                    { id: 'invisivel', name: 'Invisível', desc: 'Impossível de ser visto sem magia ou sentido especial. Considerado totalmente oculto para furtividade. Ataques do alvo têm Vantagem; ataques contra têm Desvantagem.' },
                    { id: 'paralisado', name: 'Paralisado', desc: 'Incapacitado, não pode se mover ou falar. Falha automática em testes de FOR e DES. Ataques contra têm Vantagem e acertos a até 1.5m contam como Crítico.' },
                    { id: 'petrificado', name: 'Petrificado', desc: 'Transformado em matéria sólida (inanimada). Peso multiplicado por 10. Incapacitado, não pode se mover ou falar, sem noção do ambiente. Resistência a todo dano e imunidade a veneno e doença.' },
                    { id: 'prono', name: 'Caído (Prono)', desc: 'Única opção de movimento é rastejar (custa o dobro). Desvantagem em jogadas de ataque. Ataques contra o alvo a até 1.5m têm Vantagem; ataques de mais longe têm Desvantagem.' },
                    { id: 'surdo', name: 'Surdo', desc: 'Falha automática em qualquer teste que dependa de audição.' },
                  ].map((cond) => {
                    const activeConds = character.activeConditions || [];
                    const isActive = activeConds.includes(cond.id);
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => {
                          const updated = isActive
                            ? activeConds.filter((c) => c !== cond.id)
                            : [...activeConds, cond.id];
                          onUpdateCharacter({
                            ...character,
                            activeConditions: updated,
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className={`p-2 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer box-border group ${
                          isActive
                            ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-[1.02]'
                            : 'bg-[#120a06] hover:bg-[#1f130a] border-[#54412c] text-[#eedbc5]'
                        }`}
                        title={cond.desc}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-serif font-bold text-xs truncate ${isActive ? 'text-amber-300' : 'text-[#f4ecd8]'}`}>
                            {cond.name}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                            isActive ? 'bg-amber-500 border-amber-300 text-black' : 'border-[#54412c] text-transparent'
                          }`}>
                            ✓
                          </span>
                        </div>
                        <span className="text-[9px] text-[#8c7457] line-clamp-1 group-hover:text-[#bfa888] font-sans">
                          {cond.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SELETOR DE EXAUSTÃO (1 A 6) */}
                <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2 box-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold uppercase text-[#d4af37] flex items-center gap-1.5">
                      <Skull className="w-3.5 h-3.5 text-red-400" />
                      <span>Exaustão (Nível {character.exhaustionLevel || 0} / 6)</span>
                    </span>
                    {(character.exhaustionLevel || 0) > 0 && (
                      <span className="text-[9px] font-mono bg-red-950/80 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded">
                        {character.exhaustionLevel === 1 ? 'Desvantagem em testes' : character.exhaustionLevel === 2 ? 'Velocidade pela metade' : character.exhaustionLevel === 3 ? 'Desv. em ataques/salvas' : character.exhaustionLevel === 4 ? 'HP máximo pela metade' : character.exhaustionLevel === 5 ? 'Velocidade 0' : 'Morte / Incapacitado'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => {
                      const currentEx = character.exhaustionLevel || 0;
                      const isSelected = currentEx >= lvl;
                      return (
                        <button
                          key={`ex_${lvl}`}
                          type="button"
                          onClick={() => {
                            onUpdateCharacter({
                              ...character,
                              exhaustionLevel: currentEx === lvl ? 0 : lvl,
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className={`py-2 rounded-lg border text-xs font-mono font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                              : 'bg-[#1a120b] hover:bg-[#261a12] border-[#54412c] text-[#8c7457]'
                          }`}
                          title={`Definir Exaustão para Nível ${lvl}`}
                        >
                          <span>{lvl}</span>
                          <span className="text-[7px] font-serif uppercase tracking-tighter">Nível</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'atalhos':
          return (
            <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-4 select-none">
              {/* Cabeçalho do Card */}
              <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#24170e] border border-[#8c6b32]/70 text-[#d4af37]">
                    <Dices className="w-4 h-4 text-[#e8c679]" />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-xs uppercase tracking-widest text-[#d4af37]">
                      Mesa de Dados &amp; Atalhos
                    </h4>
                    <span className="text-[9px] text-[#8c7457] font-mono">
                      Rolador &amp; Atalhos Salvos C.R.I.S.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCreateShortcutModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs shadow-md border border-[#e8c679]/40 transition active:scale-95 cursor-pointer"
                    title="Abrir janela flutuante para salvar uma nova rolagem genérica (sem ser ataque)"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#140d07]" />
                    <span>+ Salvar Rolagem</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryCollapse('atalhos')}
                    className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer"
                    title={isCardCollapsed('atalhos') ? 'Expandir atalhos' : 'Reduzir atalhos para economizar espaço'}
                  >
                    {isCardCollapsed('atalhos') ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden space-y-4 ${
                  isCardCollapsed('atalhos')
                    ? 'max-h-0 opacity-0 pointer-events-none mt-0'
                    : 'max-h-[3500px] opacity-100'
                }`}
              >

              {/* Rolador Rápido Automático (Independente do criador de atalhos) */}
              <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 shadow-inner space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-serif uppercase tracking-wider text-[#a38b6c]">
                  <span>Rolador:</span>
                  <span className="text-[9px] font-mono text-[#6e5840]">Enter</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={quickDiceFormula}
                      onChange={(e) => setQuickDiceFormula(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && quickDiceFormula.trim()) {
                          onQuickRoll(quickDiceFormula.trim(), `Rolagem livre: ${quickDiceFormula.trim()}`);
                        }
                      }}
                      placeholder="ex: 1d20+5, 2d6+3, 8d6, 1d20+5 [Vantagem]..."
                      className="w-full bg-[#1b120b] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-200 placeholder-[#6d573f] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (quickDiceFormula.trim()) {
                        onQuickRoll(quickDiceFormula.trim(), `Rolagem livre: ${quickDiceFormula.trim()}`);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] active:scale-95 text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 shadow-md flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Rolar</span>
                  </button>
                </div>

                {/* Botões Rápidos de Dados Base e Flags Rápidas */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1 border-t border-[#54412c]/40 text-xs">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <span className="text-[9px] font-serif uppercase text-[#8c7457] mr-0.5 flex-shrink-0">Dados:</span>
                    {['d20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100'].map((die) => (
                      <button
                        key={die}
                        type="button"
                        onClick={() => {
                          setQuickDiceFormula(`1${die}`);
                          onQuickRoll(`1${die}`, `Rolagem: 1${die}`);
                        }}
                        className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] hover:text-[#f4ecd8] text-[10px] font-mono font-bold text-[#c49d48] border border-[#54412c] transition flex-shrink-0"
                        title={`Rolar 1${die}`}
                      >
                        {die}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const { adv: quickAdvCount, dis: quickDisCount } = getAdvDisCounts(quickDiceFormula);
                    return (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const newFormula = modifyAdvantageInFormula(quickDiceFormula, 'advantage');
                            setQuickDiceFormula(newFormula);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold border transition flex items-center gap-1 cursor-pointer ${
                            quickAdvCount > 0
                              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500 shadow-sm'
                              : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                          }`}
                          title="Adicionar +1 Vantagem à fórmula (sem rolar automaticamente)"
                        >
                          <span>+ Vantagem</span>
                          {quickAdvCount > 0 && (
                            <span className="px-1 py-0.2 bg-emerald-700 text-white rounded text-[9px] font-mono font-bold">
                              +{quickAdvCount}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newFormula = modifyAdvantageInFormula(quickDiceFormula, 'disadvantage');
                            setQuickDiceFormula(newFormula);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold border transition flex items-center gap-1 cursor-pointer ${
                            quickDisCount > 0
                              ? 'bg-red-900/90 text-red-200 border-red-500 shadow-sm'
                              : 'bg-red-950/70 hover:bg-red-900/80 text-red-300 border-red-700/60'
                          }`}
                          title="Adicionar +1 Desvantagem à fórmula (sem rolar automaticamente)"
                        >
                          <span>+ Desvantagem</span>
                          {quickDisCount > 0 && (
                            <span className="px-1 py-0.2 bg-red-700 text-white rounded text-[9px] font-mono font-bold">
                              +{quickDisCount}
                            </span>
                          )}
                        </button>
                        {(quickAdvCount > 0 || quickDisCount > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newFormula = modifyAdvantageInFormula(quickDiceFormula, 'clear');
                              setQuickDiceFormula(newFormula);
                            }}
                            className="px-1.5 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-stone-400 hover:text-stone-200 text-[9px] font-mono border border-[#54412c] transition cursor-pointer"
                            title="Remover vantagem/desvantagem"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Seção de Atalhos Salvos com Flags Visuais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-black uppercase tracking-wider text-[#d4af37] text-[11px] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#e8c679] fill-[#e8c679]" />
                    <span>Atalhos Salvos ({savedShortcuts.length})</span>
                  </span>
                </div>

                {savedShortcuts.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-[#140d08] border-2 border-dashed border-[#54412c] rounded-xl space-y-2">
                    <Dices className="w-6 h-6 text-[#8c7457] mx-auto opacity-60" />
                    <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                      Você ainda não salvou nenhum atalho de rolagem
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateShortcutModal}
                      className="px-3 py-1.5 bg-[#24170e] hover:bg-[#382415] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/60 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1 mx-auto cursor-pointer shadow active:scale-95"
                    >
                      <Star className="w-3.5 h-3.5 fill-[#c49d48]" />
                      <span>+ Criar Atalho de Rolagem</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {savedShortcuts.map((sc) => {
                      const isAdv = sc.advantageType === 'advantage' || /vantagem/i.test(sc.expression);
                      const isDis = sc.advantageType === 'disadvantage' || /desvantagem/i.test(sc.expression);
                      const isMulti = (sc.diceCount && sc.diceCount > 1) || /^[2-9]\d*d/i.test(sc.expression);

                      return (
                        <div
                          key={sc.id}
                          onClick={() => onQuickRoll(sc.expression, sc.label)}
                          className="group relative flex flex-col justify-between p-2.5 rounded-xl bg-[#150e09] hover:bg-[#25170d] border border-[#54412c] hover:border-[#8c6b32] hover:shadow-[0_0_12px_rgba(196,157,72,0.2)] transition-all duration-150 cursor-pointer text-left space-y-1.5"
                          title={`Clique para rolar ${sc.label} (${sc.expression})`}
                        >
                          {/* Linha Superior: Nome & Botões de Ação (Editar / Excluir) */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-serif font-black text-xs text-[#f4ecd8] group-hover:text-[#f5d77f] transition truncate">
                              {sc.label}
                            </span>
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditShortcutModal(sc);
                                }}
                                className="p-1 rounded text-[#8c7457] hover:text-[#c49d48] hover:bg-[#251910] transition"
                                title="Editar este atalho"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShortcut(sc.id);
                                }}
                                className="p-1 rounded text-[#8c7457] hover:text-red-400 hover:bg-red-950/40 transition"
                                title="Excluir este atalho"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Linha Central: Fórmula */}
                          <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-300">
                            <Dices className="w-3 h-3 text-[#c49d48] flex-shrink-0" />
                            <span className="truncate">{sc.expression}</span>
                          </div>

                          {sc.damageExpression && (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-red-300 font-semibold truncate">
                              <Flame className="w-3 h-3 text-red-400 flex-shrink-0" />
                              <span className="truncate">{sc.damageExpression}</span>
                            </div>
                          )}

                          {/* Botões Rápidos de Rolagem: Acertar e Dano */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickRoll(sc.expression, `Ataque: ${sc.label}`);
                              }}
                              className="px-2 py-0.5 rounded bg-[#251910] hover:bg-[#382619] text-[#c49d48] border border-[#8c6b32]/60 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                              title="Rolar Teste de Ataque"
                            >
                              <Dices className="w-3 h-3 text-[#e8c679]" />
                              <span>Acertar</span>
                            </button>

                            {sc.damageExpression && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickRoll(sc.damageExpression!, `Dano: ${sc.label}`);
                                }}
                                className="px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700/60 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                                title="Rolar Dano (com tipos separados)"
                              >
                                <Flame className="w-3 h-3 text-red-400" />
                                <span>Dano</span>
                              </button>
                            )}
                          </div>

                          {/* Linha Inferior: Badges das Flags */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {isAdv && (
                              <span className="text-[8px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                {sc.advantageCount && sc.advantageCount > 1 ? `★ +${sc.advantageCount}d Vantagem` : '★ Vantagem'}
                              </span>
                            )}
                            {isDis && (
                              <span className="text-[8px] bg-red-950/90 text-red-300 border border-red-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                {sc.disadvantageCount && sc.disadvantageCount > 1 ? `⚠️ +${sc.disadvantageCount}d Desvantagem` : '⚠️ Desvantagem'}
                              </span>
                            )}
                            {isMulti && (
                              <span className="text-[8px] bg-amber-950/90 text-amber-300 border border-amber-600/80 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                Múltiplos Dados
                              </span>
                            )}
                            {sc.bonus !== undefined && sc.bonus !== 0 && (
                              <span className="text-[8px] bg-[#24170e] text-amber-200 border border-[#8c6b32]/70 px-1.5 py-0.2 rounded font-mono font-bold">
                                {formatModifier(sc.bonus)}
                              </span>
                            )}
                            {sc.fixedBonus !== undefined && sc.fixedBonus !== 0 && (
                              <span className="text-[8px] bg-[#24170e] text-amber-300 border border-[#8c6b32]/70 px-1.5 py-0.2 rounded font-mono font-bold">
                                Fixo: {formatModifier(sc.fixedBonus)}
                              </span>
                            )}
                            {sc.damageType && (
                              <span className="text-[8px] bg-[#22172b] text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded font-serif">
                                {sc.damageType}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        default:
          return null;
      }
    })()}
                    </div>
                  );
                })}

                {isEditingLayout && (
                  <div
                    onDragOver={(e) => handleDragOverColumn(e, colIdx)}
                    onDrop={(e) => handleDropColumn(e, colIdx)}
                    className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center text-xs font-serif transition-all duration-200 cursor-pointer ${
                      isColTarget
                        ? 'border-amber-400 bg-amber-900/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'border-[#54412c]/60 text-[#8c7457] hover:border-amber-500/60 hover:text-amber-200 hover:bg-[#1a120b]/60'
                    }`}
                  >
                    + Soltar card aqui na Coluna {colIdx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
