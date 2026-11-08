import React, { useState } from 'react';
import { CharacterSheet } from '../types/dnd';
import {
  Search,
  Plus,
  Settings,
  Trash2,
  User,
  Shield,
  Heart,
  Eye,
} from 'lucide-react';

interface CharacterListViewProps {
  characters: CharacterSheet[];
  onSelectCharacter: (char: CharacterSheet) => void;
  onCreateNewCharacter: () => void;
  onDeleteCharacter: (id: string) => void;
}

export const CharacterListView: React.FC<CharacterListViewProps> = ({
  characters,
  onSelectCharacter,
  onCreateNewCharacter,
  onDeleteCharacter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuCharId, setActiveMenuCharId] = useState<string | null>(null);

  const filtered = characters.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.characterName.toLowerCase().includes(q) ||
      c.classAndLevel.toLowerCase().includes(q) ||
      c.playerName.toLowerCase().includes(q) ||
      c.race.toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recente';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return 'Recente';
    }
  };

  return (
    <div className="space-y-5 pb-20 max-w-7xl mx-auto">
      {/* 4. Barra Superior: Contagem à esquerda e Botão + Novo Personagem à extrema direita no mesmo nível visual */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-[#f4ecd8] tracking-wide flex items-center gap-2">
            <span>Personagens:</span>
            <span className="text-[#c49d48]">{characters.length}</span>
            <span className="text-xs text-[#bfa888] font-normal tracking-normal hidden sm:inline">
              / 15
            </span>
          </h1>
        </div>

        <button
          onClick={onCreateNewCharacter}
          className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs sm:text-sm rounded-lg shadow-[0_0_14px_rgba(196,157,72,0.4)] border border-[#e8c679]/60 transition flex items-center gap-2 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Personagem</span>
        </button>
      </div>

      {/* 4. Barra de busca em largura total logo abaixo do cabeçalho, com bordas arredondadas sutis, fundo escuro semitransparente */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#8c6b32] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar personagem por nome, classe ou raça..."
          className="w-full bg-[#18110b]/85 border border-[#8c6b32]/40 rounded-lg pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#f4ecd8] placeholder-[#8c7457] focus:outline-none focus:border-[#c49d48] focus:ring-1 focus:ring-[#c49d48]/40 transition shadow-inner font-serif backdrop-blur-sm"
        />
      </div>

      {/* Empty State */}
      {characters.length === 0 ? (
        <div className="py-20 text-center bg-[#1e140d]/90 parchment-card rounded-2xl border-2 border-[#8c6b32]/50 p-8 space-y-4 shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#261a12] text-[#c49d48] border border-[#8c6b32]/60 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#f4ecd8]">
              Nenhum personagem criado ainda
            </h3>
            <p className="text-xs sm:text-sm text-[#bfa888] max-w-md mx-auto font-serif">
              Crie seu primeiro aventureiro para ter cálculos automáticos de atributos, perícias, magias e rolagens de dados.
            </p>
          </div>
          <button
            onClick={onCreateNewCharacter}
            className="px-6 py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-sm rounded-lg shadow-[0_0_14px_rgba(196,157,72,0.4)] border border-[#e8c679]/60 transition transform active:scale-95"
          >
            + Criar Primeiro Personagem
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#bfa888] text-sm font-serif bg-[#1e140d]/70 rounded-xl border border-[#8c6b32]/30 p-6">
          Nenhum personagem corresponde à busca "{searchQuery}".
        </div>
      ) : (
        /* 2. Grid de exibição de fichas em 3 colunas responsivas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((char) => (
            <div
              key={char.id}
              className="bg-[#1e140d]/95 hover:bg-[#261a12] border border-[#8c6b32]/50 hover:border-[#c49d48] rounded-xl overflow-hidden transition-all duration-200 shadow-xl flex h-32 relative group"
            >
              {/* 2. Avatar/Retrato: Ocupa toda a lateral esquerda do card, de cima a baixo */}
              <div className="w-28 sm:w-32 h-full bg-[#18110b] flex-shrink-0 overflow-hidden relative border-r border-[#8c6b32]/30 flex items-center justify-center select-none">
                {char.avatarUrl ? (
                  <img
                    src={char.avatarUrl}
                    alt={char.characterName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2a1c12] via-[#1e140d] to-[#120c08] flex items-center justify-center">
                    <span className="font-serif font-black text-2xl text-[#c49d48] tracking-wider">
                      {char.characterName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Nível do Personagem Badge */}
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/85 text-[#f4ecd8] font-bold px-1.5 py-0.2 rounded border border-[#8c6b32]/40 font-mono">
                  Nv.{char.level}
                </span>
              </div>

              {/* 3. Hierarquia das Informações no Card (Ao lado da foto, sem bordas internas excessivas) */}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0 pr-8">
                {/* Linhas 1, 2 e 3 */}
                <div className="space-y-0.5">
                  {/* Linha 1: Nome do Personagem em destaque negrito */}
                  <h3
                    className="font-serif font-black text-base text-[#f4ecd8] leading-tight truncate group-hover:text-[#c49d48] transition-colors"
                    title={char.characterName}
                  >
                    {char.characterName}
                  </h3>

                  {/* Linha 2: Classe e Nível */}
                  <p className="text-xs text-[#eedbc5] truncate font-serif">
                    {char.classAndLevel || 'Aventureiro 1'}
                  </p>

                  {/* Linha 3: Data de registro em tom atenuado */}
                  <p className="text-[11px] text-[#bfa888] font-serif">
                    Registrado em {formatDate(char.createdAt)}
                  </p>
                </div>

                {/* Linha inferior: Marcadores sutis de HP e CA */}
                <div className="flex items-center gap-2 text-[11px] text-[#bfa888] font-serif">
                  <span className="flex items-center gap-1 text-red-300">
                    <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span>{char.currentHp}/{char.maxHp}</span>
                  </span>
                  <span className="text-[#8c6b32]">•</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>CA {char.armorClass}</span>
                  </span>
                </div>
              </div>

              {/* 2. Ícone de configurações (engrenagem) posicionado precisamente no canto superior direito */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <button
                  onClick={() =>
                    setActiveMenuCharId(activeMenuCharId === char.id ? null : char.id)
                  }
                  className="p-1 rounded text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#3d2a1b]/70 transition"
                  title="Opções do Personagem"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {activeMenuCharId === char.id && (
                  <div className="absolute right-0 mt-1 w-44 bg-[#261a12] border border-[#8c6b32] rounded-lg shadow-2xl p-1.5 z-30 text-xs font-serif backdrop-blur-md">
                    <button
                      onClick={() => {
                        onSelectCharacter(char);
                        setActiveMenuCharId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[#3d2a1b] rounded text-[#f4ecd8] flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Abrir Ficha</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a ficha de "${char.characterName}"?`)) {
                          onDeleteCharacter(char.id);
                        }
                        setActiveMenuCharId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/70 rounded text-red-300 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Ficha</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Botão 'Acessar Ficha' fixado no canto inferior direito do card */}
              <div className="absolute bottom-2.5 right-2.5 z-10">
                <button
                  onClick={() => onSelectCharacter(char)}
                  className="px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-md shadow-[0_0_10px_rgba(196,157,72,0.4)] border border-[#e8c679]/60 transition transform active:scale-95"
                >
                  Acessar Ficha
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
