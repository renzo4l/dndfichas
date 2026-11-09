export const DEFAULT_CARD_ORDER = [
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
];

export const DEFAULT_CARD_COLUMNS = [
  ['atributos', 'recursos', 'defesa'],
  ['pericias', 'combate', 'condicoes', 'atalhos'],
  ['habilidades', 'magias', 'inventario', 'biografia'],
];

export const normalizeCardId = (id: string): string => {
  const map: Record<string, string> = {
    attributes: 'atributos',
    vitality: 'recursos',
    defense: 'defesa',
    skills: 'pericias',
    combat: 'combate',
    traits: 'habilidades',
    spells: 'magias',
    inventory: 'inventario',
    bio: 'biografia',
    shortcuts: 'atalhos',
    conditions: 'condicoes',
  };
  return map[id.toLowerCase()] || id.toLowerCase();
};

export const getCardTitle = (cardId: string): string => {
  const titles: Record<string, string> = {
    atributos: 'Atributos',
    recursos: 'Recursos Vitais',
    defesa: 'Defesa & Movimento',
    pericias: 'Perícias & Salvaguardas',
    combate: 'Combate & Ataques',
    habilidades: 'Habilidades',
    magias: 'Magias',
    inventario: 'Inventário',
    biografia: 'Biografia',
    condicoes: 'Condições',
    atalhos: 'Mesa de Dados & Atalhos',
  };
  return titles[cardId] || cardId;
};

export const filterMatchesCard = (categoryFilter: string, cardId: string): boolean => {
  if (categoryFilter === 'all') return true;
  if (categoryFilter === 'combat')
    return ['combate', 'recursos', 'defesa', 'pericias', 'atalhos', 'atributos'].includes(cardId);
  if (categoryFilter === 'traits') return ['habilidades', 'pericias'].includes(cardId);
  if (categoryFilter === 'spells') return ['magias', 'pericias'].includes(cardId);
  if (categoryFilter === 'inventory') return ['inventario'].includes(cardId);
  if (categoryFilter === 'bio') return ['biografia'].includes(cardId);
  return true;
};
