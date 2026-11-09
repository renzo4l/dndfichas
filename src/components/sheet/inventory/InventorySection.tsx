import React, { useState } from 'react';
import {
  Backpack,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { CharacterSheet, InventoryItem } from '../../../types/dnd';

export interface InventorySectionProps {
  character: CharacterSheet;
  onUpdateCharacter: (character: CharacterSheet) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  character,
  onUpdateCharacter,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('Novo Item');
  const [itemCategory, setItemCategory] = useState<'Geral' | 'Arma' | 'Armadura' | 'Poção' | 'Ferramenta' | 'Ração' | 'Tesouro' | 'Outro'>('Geral');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemWeightKg, setItemWeightKg] = useState(0.5);
  const [itemEquipped, setItemEquipped] = useState(false);
  const [itemDescription, setItemDescription] = useState('');

  const inventoryItemsList = character.inventory || [];
  const strScore = character.abilities.str?.score || 10;
  const maxCapacityKg = Math.round(strScore * 7.5 + (character.maxWeightBonus || 0));

  const coinPl = character.coins?.pl || 0;
  const coinPo = character.coins?.po || 0;
  const coinPp = character.coins?.pp || 0;
  const coinPe = character.coins?.pe || 0;
  const coinPc = character.coins?.pc || 0;
  const totalCoinCount = coinPl + coinPo + coinPp + coinPe + coinPc;
  const coinsWeightKg = Math.round((totalCoinCount / 100) * 10) / 10;

  const itemsWeightKg =
    Math.round(
      inventoryItemsList.reduce(
        (acc, item) => acc + (item.quantity || 1) * (item.weightKg || 0),
        0
      ) * 10
    ) / 10;
  const grandTotalWeightKg = Math.round((itemsWeightKg + coinsWeightKg) * 10) / 10;
  const isOvercapacity = grandTotalWeightKg > maxCapacityKg;
  const weightPercent = Math.min(
    100,
    Math.round((grandTotalWeightKg / Math.max(1, maxCapacityKg)) * 100)
  );
  const totalQuantityCount = inventoryItemsList.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0
  );

  const filteredInventory = inventoryItemsList.filter((item) => {
    const matchesSearch =
      !inventorySearchQuery.trim() ||
      item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(inventorySearchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (inventoryCategoryFilter === 'all') return true;
    if (inventoryCategoryFilter === 'equipped') return !!item.equipped;
    if (inventoryCategoryFilter === 'weapons_armor')
      return item.category === 'Arma' || item.category === 'Armadura';
    if (inventoryCategoryFilter === 'potions') return item.category === 'Poção';
    if (inventoryCategoryFilter === 'rations') return item.category === 'Ração';
    if (inventoryCategoryFilter === 'other')
      return (
        item.category === 'Geral' ||
        item.category === 'Ferramenta' ||
        item.category === 'Tesouro' ||
        item.category === 'Outro'
      );
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingItemId(null);
    setItemName('Novo Item');
    setItemCategory('Geral');
    setItemQuantity(1);
    setItemWeightKg(0.5);
    setItemEquipped(false);
    setItemDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setItemName(item.name || 'Item');
    setItemCategory((item.category as any) || 'Geral');
    setItemQuantity(item.quantity ?? 1);
    setItemWeightKg(item.weightKg ?? 0.5);
    setItemEquipped(!!item.equipped);
    setItemDescription(item.description || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    const itemData: InventoryItem = {
      id:
        editingItemId ||
        `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: itemName.trim() || 'Novo Item',
      category: itemCategory,
      quantity: Math.max(1, itemQuantity),
      weightKg: Math.max(0, itemWeightKg),
      equipped: itemEquipped,
      description: itemDescription.trim() || undefined,
    };

    let updatedInventory: InventoryItem[];
    if (editingItemId) {
      updatedInventory = inventoryItemsList.map((i) =>
        i.id === editingItemId ? itemData : i
      );
    } else {
      updatedInventory = [...inventoryItemsList, itemData];
    }

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    const updated = inventoryItemsList.filter((item) => item.id !== id);
    onUpdateCharacter({
      ...character,
      inventory: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleEquipped = (id: string) => {
    const updated = inventoryItemsList.map((item) =>
      item.id === id ? { ...item, equipped: !item.equipped } : item
    );
    onUpdateCharacter({
      ...character,
      inventory: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAdjustQuantity = (id: string, delta: number) => {
    const updated = inventoryItemsList
      .map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    onUpdateCharacter({
      ...character,
      inventory: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-2xl space-y-3 select-none sheet-card-optimized">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-[#54412c]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Backpack className="w-4 h-4 text-[#e8c679] flex-shrink-0" />
          <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
            Inventário &amp; Equipamento
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold text-[0.7rem] whitespace-nowrap min-w-fit">
            {inventoryItemsList.length} item(ns) ({grandTotalWeightKg} kg)
          </span>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[0.75rem] rounded-lg shadow transition cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> + Adicionar Item
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer flex items-center justify-center flex-shrink-0"
              title={
                isCollapsed
                  ? 'Expandir inventário'
                  : 'Reduzir inventário para economizar espaço'
              }
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-4 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none mt-0'
            : 'max-h-[5000px] opacity-100'
        }`}
      >
        {/* Card Resumo de Capacidade de Carga */}
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
                <span className="text-[10px] text-[#8c7457] uppercase font-serif block">
                  Peso Atual
                </span>
                <strong
                  className={`font-mono text-sm ${
                    isOvercapacity ? 'text-red-400 font-black' : 'text-amber-300'
                  }`}
                >
                  {grandTotalWeightKg} kg
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8c7457] uppercase font-serif block">
                  Carga Máxima
                </span>
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
              <span
                className={`font-bold ${
                  isOvercapacity ? 'text-red-400' : 'text-[#c49d48]'
                }`}
              >
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
                <strong>Aviso de Carga Pesada:</strong> O peso ({grandTotalWeightKg}{' '}
                kg) excede sua capacidade de carga ({maxCapacityKg} kg).
              </span>
            </div>
          )}

          {/* Ajuste de Bônus de Capacidade */}
          <div className="flex items-center justify-between pt-1 border-t border-[#54412c]/40 text-xs">
            <div className="flex items-center gap-2 text-[11px] text-[#8c7457]">
              <span>
                Total Itens:{' '}
                <strong className="text-[#eedbc5] font-mono">
                  {totalQuantityCount} un.
                </strong>{' '}
                ({inventoryItemsList.length} distintos)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-[#8c7457] font-serif uppercase">
                Bônus Capacidade (kg):
              </label>
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
                title="Bônus de capacidade em kg para mochilas mágicas"
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
              <span className="text-[9px] uppercase font-bold text-[#e5e4e2] block font-serif">
                PL (Platina)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={character.coins?.pl || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  onUpdateCharacter({
                    ...character,
                    coins: {
                      ...character.coins,
                      pl: clean === '' ? 0 : parseInt(clean, 10),
                    },
                  });
                }}
                className="w-full bg-transparent text-center font-bold text-[#e5e4e2] font-mono focus:outline-none"
              />
            </div>
            <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
              <span className="text-[9px] uppercase font-bold text-yellow-400 block font-serif">
                PO (Ouro)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={character.coins?.po || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  onUpdateCharacter({
                    ...character,
                    coins: {
                      ...character.coins,
                      po: clean === '' ? 0 : parseInt(clean, 10),
                    },
                  });
                }}
                className="w-full bg-transparent text-center font-bold text-yellow-300 font-mono focus:outline-none"
              />
            </div>
            <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
              <span className="text-[9px] uppercase font-bold text-stone-300 block font-serif">
                PP (Prata)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={character.coins?.pp || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  onUpdateCharacter({
                    ...character,
                    coins: {
                      ...character.coins,
                      pp: clean === '' ? 0 : parseInt(clean, 10),
                    },
                  });
                }}
                className="w-full bg-transparent text-center font-bold text-stone-300 font-mono focus:outline-none"
              />
            </div>
            <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
              <span className="text-[9px] uppercase font-bold text-cyan-300 block font-serif">
                PE (Electro)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={character.coins?.pe || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  onUpdateCharacter({
                    ...character,
                    coins: {
                      ...character.coins,
                      pe: clean === '' ? 0 : parseInt(clean, 10),
                    },
                  });
                }}
                className="w-full bg-transparent text-center font-bold text-cyan-300 font-mono focus:outline-none"
              />
            </div>
            <div className="bg-[#120a06] p-1.5 rounded border border-[#54412c]">
              <span className="text-[9px] uppercase font-bold text-amber-600 block font-serif">
                PC (Cobre)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={character.coins?.pc || 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  onUpdateCharacter({
                    ...character,
                    coins: {
                      ...character.coins,
                      pc: clean === '' ? 0 : parseInt(clean, 10),
                    },
                  });
                }}
                className="w-full bg-transparent text-center font-bold text-amber-600 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Busca & Filtros */}
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
              onClick={handleOpenCreateModal}
              className="px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Item</span>
            </button>
          </div>

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

        {/* Lista de Itens */}
        <div className="space-y-2">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[#140d08] border border-dashed border-[#54412c] rounded-xl space-y-2">
              <Backpack className="w-6 h-6 text-[#8c7457] mx-auto opacity-60" />
              <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                {inventorySearchQuery || inventoryCategoryFilter !== 'all'
                  ? 'Nenhum item encontrado com o filtro selecionado.'
                  : 'Mochila vazia.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3 py-1.5 bg-[#24170e] hover:bg-[#382415] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/60 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Item</span>
              </button>
            </div>
          ) : (
            filteredInventory.map((item) => {
              const itemTotalWeightKg =
                Math.round(item.quantity * item.weightKg * 10) / 10;

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
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => handleToggleEquipped(item.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                          item.equipped
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-[#1e150e] border-[#54412c] text-transparent hover:border-[#8c6b32]'
                        }`}
                        title={
                          item.equipped
                            ? 'Item equipado (clique para desequipar)'
                            : 'Clique para equipar'
                        }
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

                        <div className="text-[11px] font-mono text-[#8c7457] flex items-center gap-2 mt-0.5">
                          <span>
                            Peso Unit.:{' '}
                            <strong className="text-amber-200">
                              {item.weightKg} kg
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Peso Total:{' '}
                            <strong className="text-amber-300 font-bold">
                              {itemTotalWeightKg} kg
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper de Quantidade & Ações */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center bg-[#120a06] border border-[#54412c] rounded-lg p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustQuantity(item.id, -1)}
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
                          onClick={() => handleAdjustQuantity(item.id, 1)}
                          className="w-6 h-6 rounded bg-[#261a12] hover:bg-[#382619] text-[#eedbc5] flex items-center justify-center font-bold text-xs cursor-pointer"
                          title="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded text-[#8c7457] hover:text-[#c49d48] hover:bg-[#251910] transition cursor-pointer"
                          title="Editar item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded text-[#8c7457] hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

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

      {/* Modal Flutuante para Adicionar / Editar Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
              <div>
                <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
                  <Backpack className="w-5 h-5 text-[#c49d48]" />
                  <span>
                    {editingItemId
                      ? 'Editar Item do Inventário'
                      : 'Novo Item no Inventário'}
                  </span>
                </h3>
                <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
                  Adicione ou edite detalhes do item, quantidade e peso unitário em kg.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                      setItemName(preset.name);
                      setItemWeightKg(preset.weight);
                      setItemCategory(preset.cat as any);
                    }}
                    className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
                  >
                    {preset.name} ({preset.weight}kg)
                  </button>
                ))}
              </div>
            </div>

            {/* Campo 1: Nome */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nome do Item<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
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
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as any)}
                  className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-sans text-[#f4ecd8] focus:outline-none transition"
                >
                  <option value="Geral" className="bg-[#1e1a17]">
                    Geral
                  </option>
                  <option value="Arma" className="bg-[#1e1a17]">
                    Arma
                  </option>
                  <option value="Armadura" className="bg-[#1e1a17]">
                    Armadura
                  </option>
                  <option value="Poção" className="bg-[#1e1a17]">
                    Poção
                  </option>
                  <option value="Ferramenta" className="bg-[#1e1a17]">
                    Ferramenta
                  </option>
                  <option value="Ração" className="bg-[#1e1a17]">
                    Ração
                  </option>
                  <option value="Tesouro" className="bg-[#1e1a17]">
                    Tesouro
                  </option>
                  <option value="Outro" className="bg-[#1e1a17]">
                    Outro
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Quantidade<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={itemQuantity}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setItemQuantity(clean === '' ? 1 : Math.max(1, parseInt(clean, 10)));
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
                  value={itemWeightKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    setItemWeightKg(isNaN(val) ? 0 : Math.max(0, val));
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
                checked={itemEquipped}
                onChange={(e) => setItemEquipped(e.target.checked)}
                className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c] cursor-pointer"
              />
              <label
                htmlFor="inventoryItemEquipped"
                className="text-xs text-[#eedbc5] font-sans cursor-pointer select-none"
              >
                Item está <strong>Equipado / Vestido / Sintonizado</strong> no momento
              </label>
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Descrição ou Notas (Opcional)
              </label>
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={2}
                placeholder="Propriedades mágicas, CA, dano, utilidade, etc."
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>

            {/* Cálculo Total */}
            <div className="bg-[#100e0c] border border-[#8c6b32]/60 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-[#a89073]">Peso Total do Item:</span>
              <strong className="text-amber-300">
                {(itemQuantity * itemWeightKg).toFixed(1)} kg ({itemQuantity}x{' '}
                {itemWeightKg} kg)
              </strong>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingItemId ? 'Atualizar Item' : 'Adicionar Item'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
