import React, { useState } from 'react';
import { HomebrewItem, CharacterSheet } from '../types/dnd';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Search,
  Wand2,
  Shield,
  Sword,
  BookOpen,
  Settings,
  Skull,
} from 'lucide-react';

interface HomebrewManagerProps {
  homebrews: HomebrewItem[];
  onAddHomebrew: (hb: HomebrewItem) => void;
  onDeleteHomebrew: (id: string) => void;
  activeCharacter?: CharacterSheet;
  onApplyToCharacter?: (hb: HomebrewItem) => void;
  userName: string;
}

export const HomebrewManager: React.FC<HomebrewManagerProps> = ({
  homebrews,
  onAddHomebrew,
  onDeleteHomebrew,
  activeCharacter,
  onApplyToCharacter,
  userName,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'trait' | 'spell' | 'item' | 'rule'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // New Homebrew Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HomebrewItem['category']>('trait');
  const [description, setDescription] = useState('');
  const [mechanics, setMechanics] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const hb: HomebrewItem = {
      id: `hb_${Date.now()}`,
      name: name.trim(),
      category,
      description: description.trim(),
      mechanics: mechanics.trim() || undefined,
      author: userName || 'Mestre',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddHomebrew(hb);
    setShowAddModal(false);
    setName('');
    setDescription('');
    setMechanics('');
  };

  const handleApply = (hb: HomebrewItem) => {
    if (onApplyToCharacter) {
      onApplyToCharacter(hb);
      setAppliedId(hb.id);
      setTimeout(() => setAppliedId(null), 2500);
    }
  };

  const filtered = homebrews.filter((hb) => {
    const matchesCat = activeCategory === 'all' || hb.category === activeCategory;
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      hb.name.toLowerCase().includes(q) ||
      hb.description.toLowerCase().includes(q) ||
      (hb.mechanics && hb.mechanics.toLowerCase().includes(q))
    );
  });

  const getCategoryTheme = (cat: HomebrewItem['category']) => {
    switch (cat) {
      case 'spell':
        return {
          label: 'Magia Customizada',
          btnBg: 'bg-[#2a1d13] hover:bg-[#382618] text-[#e8c679] border-[#8c6b32]/60',
          gradient: 'from-amber-950/40 via-amber-900/10 to-transparent',
        };
      case 'item':
        return {
          label: 'Item Mágico / Equipamento',
          btnBg: 'bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 border-amber-700/60',
          gradient: 'from-amber-950/40 via-amber-900/10 to-transparent',
        };
      case 'rule':
        return {
          label: 'Regra da Mesa',
          btnBg: 'bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 border-emerald-700/60',
          gradient: 'from-emerald-950/40 via-emerald-900/10 to-transparent',
        };
      default:
        return {
          label: 'Habilidade / Talento',
          btnBg: 'bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 border-blue-700/60',
          gradient: 'from-blue-950/40 via-blue-900/10 to-transparent',
        };
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Sub-navigation Tabs Bar */}
      <div className="border-b border-[#382b1d] pb-1">
        <nav className="flex space-x-6 overflow-x-auto">
          {[
            { id: 'all', label: 'TODOS' },
            { id: 'trait', label: 'HABILIDADES' },
            { id: 'spell', label: 'MAGIAS' },
            { id: 'item', label: 'ITENS' },
            { id: 'rule', label: 'REGRAS' },
          ].map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`py-3 text-sm font-serif font-bold tracking-wider uppercase transition relative whitespace-nowrap ${
                  isActive ? 'text-[#f7eedc]' : 'text-[#8c7b67] hover:text-[#eedbc5]'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] rounded-full shadow-[0_0_8px_#c49d48]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Top Header: Count & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-[#f7eedc] tracking-tight">
            Homebrew {homebrews.length}
          </h2>
          <p className="text-xs text-[#a3907a]">
            Grimório de regras caseiras, magias e itens arcaicos da sua mesa
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs sm:text-sm rounded-lg shadow-lg border border-[#e8c679]/60 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8c7b67] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar homebrew por nome ou efeito..."
          className="w-full bg-[#18130e] border border-[#382b1d] rounded-xl pl-10 pr-4 py-3 text-sm text-[#eedbc5] placeholder-[#7d6e5d] focus:outline-none focus:border-[#d4af37] transition shadow-inner font-serif"
        />
      </div>

      {/* List of Banner Cards */}
      {homebrews.length === 0 ? (
        <div className="py-20 text-center bg-[#18130e] rounded-2xl border border-[#382b1d] p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#292017] text-[#d4af37] border border-[#523f2b] flex items-center justify-center mx-auto shadow-xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#f5ebd7]">
              Nenhum conteúdo homebrew cadastrado
            </h3>
            <p className="text-xs text-[#9d8a74] max-w-sm mx-auto">
              Crie regras caseiras, magias, itens mágicos ou habilidades originais para suas sessões.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-sm rounded-lg shadow-lg border border-[#e8c679]/60 transition"
          >
            + Criar Homebrew
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-[#9d8a74] text-sm font-serif">
          Nenhum homebrew encontrado com a busca "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hb) => {
            const theme = getCategoryTheme(hb.category);

            return (
              <div
                key={hb.id}
                className="bg-[#18130e] border border-[#382b1d] hover:border-[#6b5237] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition shadow-md relative overflow-hidden"
              >
                {/* Left: Thumbnail & Content */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#1a1b26] border border-stone-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                    {hb.category === 'spell' && <Wand2 className="w-6 h-6 text-[#d4af37]" />}
                    {hb.category === 'item' && <Sword className="w-6 h-6 text-amber-400" />}
                    {hb.category === 'rule' && <BookOpen className="w-6 h-6 text-emerald-400" />}
                    {hb.category === 'trait' && <Shield className="w-6 h-6 text-blue-400" />}
                    {hb.category === 'class_feature' && <Sparkles className="w-6 h-6 text-pink-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base truncate">
                        {hb.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/60 text-stone-300 border border-stone-800">
                        {theme.label}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 line-clamp-1 mt-0.5">
                      {hb.description}
                    </p>

                    {hb.mechanics && (
                      <p className="text-[11px] text-[#e8c679] font-mono mt-1">
                        Mecânica: {hb.mechanics}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {activeCharacter && onApplyToCharacter && (
                    <button
                      onClick={() => handleApply(hb)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                        appliedId === hb.id
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : theme.btnBg
                      }`}
                    >
                      {appliedId === hb.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Adicionado!</span>
                        </>
                      ) : (
                        <span>Adicionar à Ficha</span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteHomebrew(hb.id)}
                    className="p-1.5 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800/80 transition"
                    title="Excluir Homebrew"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADICIONAR NOVO HOMEBREW */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18130e] border border-[#8c6b32]/80 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-serif font-black text-[#f7eedc] text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d4af37]" /> Criar Conteúdo Homebrew
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do talento, magia, item ou regra"
                  className="w-full bg-[#0d0e14] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#f7eedc] focus:outline-none focus:border-[#c49d48]"
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0d0e14] border border-[#4a3928] rounded-lg px-2.5 py-2 text-xs text-[#e8c679] focus:outline-none focus:border-[#c49d48]"
                >
                  <option value="trait">Habilidade / Talento</option>
                  <option value="spell">Magia Customizada</option>
                  <option value="item">Item Mágico / Equipamento</option>
                  <option value="rule">Regra da Mesa</option>
                  <option value="class_feature">Habilidade de Classe</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Descrição
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição narrativa ou detalhes..."
                  className="w-full bg-[#0d0e14] border border-[#4a3928] rounded-lg px-3 py-2 text-xs text-[#f7eedc] focus:outline-none focus:border-[#c49d48]"
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Mecânica de Jogo (Opcional)
                </label>
                <input
                  type="text"
                  value={mechanics}
                  onChange={(e) => setMechanics(e.target.value)}
                  placeholder="Ex: +2 na CA, 2d6 de dano perfurante, etc."
                  className="w-full bg-[#0d0e14] border border-[#4a3928] rounded-lg px-3 py-2 text-xs text-[#e8c679] font-mono focus:outline-none focus:border-[#c49d48]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#eedbc5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg shadow-sm"
                >
                  Salvar Homebrew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
