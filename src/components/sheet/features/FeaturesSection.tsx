import React, { useState } from 'react';
import { Sparkles, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { CharacterSheet, CharacterFeature, HomebrewItem } from '../../../types/dnd';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';
import { FeatureCard } from './FeatureCard';
import { CreateEditFeatureModal } from '../modals/CreateEditFeatureModal';

export interface FeaturesSectionProps {
  character?: CharacterSheet;
  onUpdateCharacter?: (updated: CharacterSheet) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = (props) => {
  let ctx: ReturnType<typeof useCharacterSheet> | null = null;
  try {
    ctx = useCharacterSheet();
  } catch {
    ctx = null;
  }

  const character = props.character || ctx?.character;
  const onUpdateCharacter = props.onUpdateCharacter || ctx?.onUpdateCharacter;
  const isCollapsed =
    props.isCollapsed ?? (ctx ? ctx.isCardCollapsed('habilidades') : false);
  const onToggleCollapse =
    props.onToggleCollapse || (() => ctx?.handleToggleCategoryCollapse('habilidades'));

  const [featureSearchQuery, setFeatureSearchQuery] = useState('');
  const [collapsedFeatureIds, setCollapsedFeatureIds] = useState<Record<string, boolean>>({});
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<CharacterFeature | null>(null);

  if (!character || !onUpdateCharacter) return null;

  const featuresList = character.featuresList || [];

  const handleOpenCreateModal = () => {
    setEditingFeature(null);
    setShowFeatureModal(true);
  };

  const handleOpenEditModal = (feat: CharacterFeature) => {
    setEditingFeature(feat);
    setShowFeatureModal(true);
  };

  const handleSaveFeature = (savedFeat: CharacterFeature) => {
    const existing = character.featuresList || [];
    const updated = editingFeature
      ? existing.map((f) => (f.id === savedFeat.id ? savedFeat : f))
      : [...existing, savedFeat];

    onUpdateCharacter({
      ...character,
      featuresList: updated,
      updatedAt: new Date().toISOString(),
    });
    setShowFeatureModal(false);
  };

  const handleRemoveFeature = (id: string) => {
    const updated = (character.featuresList || []).filter((f) => f.id !== id);
    onUpdateCharacter({
      ...character,
      featuresList: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleCollapseFeature = (id: string) => {
    setCollapsedFeatureIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? false),
    }));
  };

  // Homebrew Helpers
  const handleAddHomebrew = () => {
    const newHb: HomebrewItem = {
      id: `hb_${Date.now()}`,
      name: 'Nova Regra / Traço Homebrew',
      category: 'trait',
      description: 'Descrição das regras da casa...',
      createdAt: new Date().toISOString(),
    };
    onUpdateCharacter({
      ...character,
      homebrews: [...(character.homebrews || []), newHb],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateHomebrew = (idx: number, updated: HomebrewItem) => {
    const list = [...(character.homebrews || [])];
    list[idx] = updated;
    onUpdateCharacter({
      ...character,
      homebrews: list,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveHomebrew = (idx: number) => {
    const list = (character.homebrews || []).filter((_, i) => i !== idx);
    onUpdateCharacter({
      ...character,
      homebrews: list,
      updatedAt: new Date().toISOString(),
    });
  };

  const filteredFeatures = featuresList.filter((f) => {
    if (!featureSearchQuery.trim()) return true;
    const q = featureSearchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.source && f.source.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div
        className={`bg-[#1a120b]/95 border-2 border-[#8c6b32]/60 rounded-2xl p-4 shadow-xl space-y-3 select-none sheet-card-optimized ${
          props.className || ''
        }`}
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-[#54412c]/60 pb-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 mr-1">
              <Sparkles className="w-4 h-4 text-[#e8c679] shrink-0" />
              <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#d4af37]">
                Habilidades &amp; Traços DE CLASSE / RAÇA
              </span>
            </div>

            <span className="relative inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32] font-mono font-bold text-[0.7rem] whitespace-nowrap shrink-0">
              {featuresList.length} habilidade(s)
            </span>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-[0.75rem] rounded-lg shadow transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> + Nova Habilidade
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded bg-[#24170e] hover:bg-[#382619] text-[#eedbc5] border border-[#54412c] transition cursor-pointer flex items-center justify-center shrink-0 self-start"
            title={isCollapsed ? 'Expandir habilidades' : 'Reduzir habilidades para economizar espaço'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#c49d48]" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-[#c49d48]" />
            )}
          </button>
        </div>

        {/* Conteúdo Expansível */}
        <div
          className={`transition-[max-height,opacity] duration-200 ease-out overflow-hidden space-y-3 ${
            isCollapsed
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
                placeholder="Buscar habilidade por nome, origem ou palavra-chave..."
                className="w-full bg-[#1b120b] border border-[#54412c] focus:border-[#c49d48] rounded-lg px-2.5 py-1 text-xs font-serif text-[#eedbc5] placeholder-[#7d6750] focus:outline-none"
              />
            </div>
          )}

          {/* Lista de Cards de Habilidades */}
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[#120a06] border border-dashed border-[#54412c] rounded-xl space-y-2">
              <Sparkles className="w-6 h-6 text-[#8c7457] mx-auto opacity-50" />
              <p className="text-xs text-[#eedbc5] font-serif font-semibold">
                {featuresList.length === 0
                  ? 'Nenhuma habilidade adicionada ainda. Clique em "+ Nova Habilidade".'
                  : 'Nenhuma habilidade encontrada com os termos buscados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredFeatures.map((feat) => (
                <FeatureCard
                  key={feat.id}
                  feature={feat}
                  isCollapsed={collapsedFeatureIds[feat.id] ?? false}
                  onToggleCollapse={() => handleToggleCollapseFeature(feat.id)}
                  onEdit={() => handleOpenEditModal(feat)}
                  onDelete={() => handleRemoveFeature(feat.id)}
                />
              ))}
            </div>
          )}

          {/* Sub-seção Homebrews */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-3 space-y-2.5 mt-3">
            <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-1.5">
              <span className="text-xs font-serif font-black uppercase text-[#d4af37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e8c679]" />
                <span>Regras &amp; Traços Homebrew</span>
              </span>
              <button
                type="button"
                onClick={handleAddHomebrew}
                className="text-xs font-serif font-bold text-[#c49d48] hover:text-[#f5d77f] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>

            {(character.homebrews || []).length === 0 ? (
              <p className="text-xs text-[#8c7457] italic text-center py-2">
                Nenhum traço homebrew cadastrado.
              </p>
            ) : (
              <div className="space-y-2">
                {character.homebrews.map((hb, idx) => (
                  <div
                    key={hb.id}
                    className="bg-[#120a06] border border-[#54412c] rounded-lg p-2.5 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={hb.name}
                        onChange={(e) =>
                          handleUpdateHomebrew(idx, { ...hb, name: e.target.value })
                        }
                        className="font-serif font-bold text-amber-200 text-xs bg-transparent border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none w-full"
                        placeholder="Nome do Homebrew"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHomebrew(idx)}
                        className="text-stone-500 hover:text-red-400 p-1 cursor-pointer transition"
                        title="Remover Homebrew"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={hb.description}
                      onChange={(e) =>
                        handleUpdateHomebrew(idx, {
                          ...hb,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Mecânicas e efeitos..."
                      className="w-full bg-[#170e08] border border-[#54412c]/60 rounded p-1.5 text-xs text-[#eedbc5] focus:outline-none focus:border-[#c49d48] font-serif leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação / Edição de Habilidade */}
      <CreateEditFeatureModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        onSave={handleSaveFeature}
        editingFeature={editingFeature}
      />
    </>
  );
};
