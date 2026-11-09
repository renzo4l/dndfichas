import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Plus,
  Skull,
  Shield,
  Heart,
  Zap,
  Star,
  Dices,
  X,
  Check,
} from 'lucide-react';
import { CharacterSheet, MulticlassEntry } from '../../../types/dnd';
import {
  calculateAbilityModifier,
  formatModifier,
} from '../../../utils/dndRules';
import { useCharacterSheet } from '../../../context/CharacterSheetContext';
import { SpeedCounter } from './SpeedCounter';

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

export interface CharacterHeaderProps {
  character?: CharacterSheet;
  onUpdateCharacter?: (updated: CharacterSheet) => void;
  onQuickRoll?: (expression: string, label: string) => void;
  className?: string;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = (props) => {
  let ctx: ReturnType<typeof useCharacterSheet> | null = null;
  try {
    ctx = useCharacterSheet();
  } catch {
    ctx = null;
  }

  const character = props.character || ctx?.character;
  const onUpdateCharacter = props.onUpdateCharacter || ctx?.onUpdateCharacter;
  const onQuickRoll = props.onQuickRoll || ctx?.onQuickRoll;

  // Modais locais de Avatar e Multiclasse
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState('');
  const [showMulticlassModal, setShowMulticlassModal] = useState(false);
  const [newMulticlassName, setNewMulticlassName] = useState('Bruxo');
  const [newMulticlassLevel, setNewMulticlassLevel] = useState(1);

  if (!character || !onUpdateCharacter) return null;

  const multiclasses = character.multiclasses || [];
  const primaryClass =
    character.primaryClass || character.classAndLevel || 'Guerreiro';
  const totalLevel =
    character.level + multiclasses.reduce((sum, mc) => sum + mc.level, 0);

  const dexScore = character.abilities.dex?.score || 10;
  const dexMod = calculateAbilityModifier(dexScore);
  const totalInitiative = dexMod + (character.initiativeBonus || 0);

  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((character.currentHp / (character.maxHp || 1)) * 100))
  );

  const handlePrimaryClassChange = (newClassName: string) => {
    const nextClassAndLevel =
      multiclasses.length > 0
        ? `${newClassName} ${character.level} / ${multiclasses
            .map((m) => `${m.className} ${m.level}`)
            .join(' / ')}`
        : `${newClassName} ${character.level}`;

    onUpdateCharacter({
      ...character,
      primaryClass: newClassName,
      classAndLevel: nextClassAndLevel,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePrimaryLevelChange = (newLevel: number) => {
    const validLevel = Math.max(1, newLevel);
    const nextClassAndLevel =
      multiclasses.length > 0
        ? `${primaryClass} ${validLevel} / ${multiclasses
            .map((m) => `${m.className} ${m.level}`)
            .join(' / ')}`
        : `${primaryClass} ${validLevel}`;

    onUpdateCharacter({
      ...character,
      level: validLevel,
      classAndLevel: nextClassAndLevel,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddMulticlass = () => {
    const newEntry: MulticlassEntry = {
      id: `mc_${Date.now()}`,
      className: newMulticlassName,
      level: Math.max(1, newMulticlassLevel),
    };
    const nextMulticlasses = [...multiclasses, newEntry];
    const nextClassAndLevel = `${primaryClass} ${character.level} / ${nextMulticlasses
      .map((m) => `${m.className} ${m.level}`)
      .join(' / ')}`;

    onUpdateCharacter({
      ...character,
      multiclasses: nextMulticlasses,
      classAndLevel: nextClassAndLevel,
      updatedAt: new Date().toISOString(),
    });
    setShowMulticlassModal(false);
  };

  const handleRemoveMulticlass = (id: string) => {
    const nextMulticlasses = multiclasses.filter((m) => m.id !== id);
    const nextClassAndLevel =
      nextMulticlasses.length > 0
        ? `${primaryClass} ${character.level} / ${nextMulticlasses
            .map((m) => `${m.className} ${m.level}`)
            .join(' / ')}`
        : `${primaryClass} ${character.level}`;

    onUpdateCharacter({
      ...character,
      multiclasses: nextMulticlasses,
      classAndLevel: nextClassAndLevel,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveAvatar = () => {
    onUpdateCharacter({
      ...character,
      avatarUrl: avatarUrlDraft.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingAvatar(false);
  };

  const handleToggleInspiration = () => {
    onUpdateCharacter({
      ...character,
      inspiration: !character.inspiration,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickHeal = (amount: number) => {
    const newHp = Math.min(character.maxHp, character.currentHp + amount);
    onUpdateCharacter({
      ...character,
      currentHp: newHp,
      isDead: false,
      deathSaves:
        newHp > 0
          ? { successes: 0, failures: 0 }
          : character.deathSaves,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeathSaveSuccess = (slot: number) => {
    const current = character.deathSaves?.successes || 0;
    const next = current === slot ? slot - 1 : slot;
    onUpdateCharacter({
      ...character,
      deathSaves: {
        ...character.deathSaves,
        successes: Math.max(0, Math.min(3, next)),
        failures: character.deathSaves?.failures || 0,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeathSaveFailure = (slot: number) => {
    const current = character.deathSaves?.failures || 0;
    const next = current === slot ? slot - 1 : slot;
    const isNowDead = next >= 3;
    onUpdateCharacter({
      ...character,
      isDead: isNowDead,
      deathSaves: {
        ...character.deathSaves,
        failures: Math.max(0, Math.min(3, next)),
        successes: character.deathSaves?.successes || 0,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className={`space-y-4 ${props.className || ''}`}>
      {/* 1. Header do Personagem Integrado com Avatar, Campos de Linha Limpa */}
      <div className="bg-[#1f1711] border border-[#54412c] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl select-none">
        {/* Parte Superior: Avatar à Esquerda + Campos de Texto Alinhados à Direita */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6">
          {/* Avatar do Personagem */}
          <div className="relative group flex-shrink-0">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden border-2 border-[#8c6b32]/70 bg-[#120c08] shadow-2xl flex items-center justify-center">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.characterName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2a1c12] via-[#1a110a] to-[#0f0905] flex flex-col items-center justify-center select-none">
                  <span className="font-serif font-black text-3xl sm:text-4xl text-[#c49d48] tracking-widest">
                    {character.characterName
                      ? character.characterName.slice(0, 2).toUpperCase()
                      : 'HP'}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#8c7457] mt-1 font-mono">
                    Sem Retrato
                  </span>
                </div>
              )}
            </div>

            {/* Botão de Editar Avatar */}
            <button
              type="button"
              onClick={() => {
                setAvatarUrlDraft(character.avatarUrl || '');
                setIsEditingAvatar(true);
              }}
              className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-[#261a12]/90 hover:bg-[#3d2a1b] text-[#c49d48] hover:text-[#f4ecd8] border border-[#8c6b32]/60 shadow-lg transition cursor-pointer"
              title="Alterar Retrato do Personagem"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Informações Centrais em Linhas Limpas */}
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
                        className="ml-1 text-[10px] text-amber-300 underline hover:text-white cursor-pointer"
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
                  onChange={(e) =>
                    onUpdateCharacter({
                      ...character,
                      characterName: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    onUpdateCharacter({
                      ...character,
                      playerName: e.target.value,
                    })
                  }
                  className="w-full bg-transparent text-sm sm:text-base font-serif font-semibold text-[#eedbc5] border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                  placeholder="Nome do Jogador"
                />
              </div>
            </div>

            {/* Linha 2: Classe & Nível com Multiclasse e Raça */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Classe Principal */}
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-bold text-[#a3907a]">
                    Classe Principal
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMulticlassModal(true)}
                    className="text-[10px] text-[#c49d48] hover:text-[#f4ecd8] flex items-center gap-1 font-bold transition hover:underline cursor-pointer"
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
                    className="p-1 rounded bg-[#261a12] border border-[#8c6b32]/50 hover:border-[#c49d48] text-[#c49d48] hover:text-white transition flex-shrink-0 cursor-pointer"
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
                        <span>
                          {mc.className} {mc.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMulticlass(mc.id)}
                          className="hover:text-red-300 ml-0.5 cursor-pointer"
                          title="Remover"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Nível do Personagem */}
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
                    handlePrimaryLevelChange(
                      clean === '' ? 1 : Math.max(1, parseInt(clean, 10))
                    );
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
                  onChange={(e) =>
                    onUpdateCharacter({ ...character, race: e.target.value })
                  }
                  className="w-full bg-transparent text-sm font-serif font-semibold text-[#eedbc5] border-b border-[#54412c] focus:border-[#c49d48] focus:outline-none"
                  placeholder="Ex: Humano, Elfo"
                />
              </div>
            </div>

            {/* Linha 3: Antecedente, Tendência e XP */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Antecedente */}
              <div className="sm:col-span-5">
                <label className="text-[10px] uppercase font-bold text-[#a3907a] block mb-0.5">
                  Antecedente (Origem)
                </label>
                <select
                  value={character.background}
                  onChange={(e) =>
                    onUpdateCharacter({
                      ...character,
                      background: e.target.value,
                    })
                  }
                  className="w-full bg-[#150f0a] text-sm font-serif font-semibold text-[#eedbc5] border border-[#54412c] rounded-lg px-2.5 py-1 focus:border-[#c49d48] focus:outline-none cursor-pointer"
                >
                  {!STANDARD_5E_BACKGROUNDS.includes(character.background) &&
                    character.background && (
                      <option value={character.background}>
                        {character.background}
                      </option>
                    )}
                  {STANDARD_5E_BACKGROUNDS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tendência */}
              <div className="sm:col-span-4">
                <label className="text-[10px] uppercase font-bold text-[#a3907a] block mb-0.5">
                  Tendência
                </label>
                <select
                  value={character.alignment}
                  onChange={(e) =>
                    onUpdateCharacter({
                      ...character,
                      alignment: e.target.value,
                    })
                  }
                  className="w-full bg-[#150f0a] text-sm font-serif font-semibold text-[#eedbc5] border border-[#54412c] rounded-lg px-2.5 py-1 focus:border-[#c49d48] focus:outline-none cursor-pointer"
                >
                  {!STANDARD_5E_ALIGNMENTS.includes(character.alignment) &&
                    character.alignment && (
                      <option value={character.alignment}>
                        {character.alignment}
                      </option>
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

        {/* 2. Barra de Status de Combate / HUD Rápido do Cabeçalho */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-[#54412c]/60">
          {/* Card 1: PV (Pontos de Vida) */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2.5 flex flex-col justify-between shadow-sm min-w-0">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#bfa888] font-serif">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
                <span>PV</span>
              </span>
              {character.tempHp > 0 && (
                <span className="text-amber-400 font-mono font-bold text-[9px]">
                  +{character.tempHp} Temp
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className="text-xl sm:text-2xl font-serif font-black text-red-200">
                {character.currentHp}
              </span>
              <span className="text-xs text-[#8c7457] font-mono">
                / {character.maxHp}
              </span>
            </div>

            {/* Barra de Progresso de Vida */}
            <div className="w-full bg-[#20140c] h-1.5 rounded-full overflow-hidden border border-[#3d2719]">
              <div
                className={`h-full transition-all duration-300 ${
                  hpPercent > 50
                    ? 'bg-emerald-500'
                    : hpPercent > 25
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: CA (Classe de Armadura) */}
          <div className="bg-[#140e09] border border-[#54412c] rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm min-w-0 text-center">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] font-serif">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Classe Armadura</span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black text-amber-300 my-0.5">
              {character.armorClass}
            </div>
            <span
              className="text-[9px] text-[#8c7457] font-serif truncate max-w-full"
              title={character.armorClassType || 'Armadura Padrão'}
            >
              {character.armorClassType || 'CA Básica'}
            </span>
          </div>

          {/* Card 3: Iniciativa */}
          <div
            onClick={() => {
              if (onQuickRoll) {
                onQuickRoll(
                  `1d20${formatModifier(totalInitiative)}`,
                  `Iniciativa: ${character.characterName}`
                );
              }
            }}
            className="bg-[#140e09] border border-[#54412c] hover:border-[#8c6b32] hover:bg-[#20140c] rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm min-w-0 text-center cursor-pointer transition group"
            title={`Clique para rolar Iniciativa (1d20${formatModifier(totalInitiative)})`}
          >
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#bfa888] group-hover:text-amber-200 font-serif">
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:animate-bounce" />
              <span>Iniciativa</span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black text-amber-300 my-0.5 group-hover:text-amber-100">
              {formatModifier(totalInitiative)}
            </div>
            <span className="text-[9px] text-[#8c7457] font-serif flex items-center gap-1">
              <Dices className="w-3 h-3 text-amber-400" /> Rolar 1d20
            </span>
          </div>

          {/* Card 4: Inspiração */}
          <button
            type="button"
            onClick={handleToggleInspiration}
            className={`border rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm min-w-0 text-center transition cursor-pointer ${
              character.inspiration
                ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-[#140e09] border-[#54412c] text-[#8c7457] hover:border-[#8c6b32]'
            }`}
            title="Alternar Inspiração do Mestre (Vantagem)"
          >
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold font-serif">
              <Star
                className={`w-3.5 h-3.5 ${
                  character.inspiration
                    ? 'text-amber-300 fill-amber-300'
                    : 'text-[#8c7457]'
                }`}
              />
              <span>Inspiração</span>
            </div>
            <div className="text-sm font-serif font-black my-1">
              {character.inspiration ? '★ ATIVA' : 'INATIVA'}
            </div>
            <span className="text-[9px] font-mono">
              {character.inspiration ? '+ Vantagem' : 'Clique p/ ativar'}
            </span>
          </button>

          {/* Card 5: Deslocamento (SpeedCounter modular centralizado) */}
          <div className="col-span-2 sm:col-span-1">
            <SpeedCounter
              speed={character.speed}
              onUpdateSpeed={(val) => {
                onUpdateCharacter({
                  ...character,
                  speed: val,
                  updatedAt: new Date().toISOString(),
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Caixa de Salvaguardas contra a Morte ao Cair a Zero de Vida */}
      {character.currentHp === 0 && !character.isDead && (
        <div className="bg-[#1c0f0a] border-2 border-red-700/80 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in relative select-none">
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
              onClick={() => handleQuickHeal(1)}
              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 rounded-lg text-xs font-serif font-bold transition shadow cursor-pointer"
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
                  const checked =
                    (character.deathSaves?.successes || 0) >= slot;
                  return (
                    <button
                      key={`modal_succ_${slot}`}
                      type="button"
                      onClick={() => handleDeathSaveSuccess(slot)}
                      className={`w-10 h-10 rounded-full border-2 transition flex items-center justify-center font-bold text-sm cursor-pointer ${
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
                  const checked =
                    (character.deathSaves?.failures || 0) >= slot;
                  return (
                    <button
                      key={`modal_fail_${slot}`}
                      type="button"
                      onClick={() => handleDeathSaveFailure(slot)}
                      className={`w-10 h-10 rounded-full border-2 transition flex items-center justify-center font-bold text-sm cursor-pointer ${
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

          <div>
            <button
              type="button"
              onClick={() => {
                if (onQuickRoll) {
                  onQuickRoll(
                    '1d20',
                    `Salvaguarda contra a Morte: ${character.characterName}`
                  );
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-[#f4ecd8] font-serif font-black text-sm rounded-xl shadow-lg border border-amber-500/50 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
            >
              <Dices className="w-5 h-5 text-amber-300" />
              <span>Rolar Salvaguarda contra a Morte (1d20)</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Avatar */}
      {isEditingAvatar && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#1e140d] border-2 border-[#8c6b32] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            <div className="flex items-center justify-between border-b border-[#8c6b32]/40 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#c49d48]" />
                <h3 className="font-black text-base text-[#f4ecd8]">
                  Retrato do Personagem
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAvatar(false)}
                className="p-1 rounded text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#2c1d13] cursor-pointer"
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
                type="button"
                onClick={() => {
                  setAvatarUrlDraft('');
                  onUpdateCharacter({ ...character, avatarUrl: undefined });
                  setIsEditingAvatar(false);
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 cursor-pointer"
              >
                Remover Foto
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                className="px-4 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md cursor-pointer"
              >
                Salvar Retrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Multiclasse */}
      {showMulticlassModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#1e140d] border-2 border-[#8c6b32] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
            <div className="flex items-center justify-between border-b border-[#8c6b32]/40 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#c49d48]" />
                <h3 className="font-black text-lg text-[#f4ecd8]">
                  Gerenciar Multiclasse
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMulticlassModal(false)}
                className="p-1 rounded text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#2c1d13] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Classes Atuais */}
            <div className="space-y-2.5">
              <div className="text-xs uppercase font-bold text-[#c49d48] tracking-wider">
                Classes do Personagem:
              </div>

              {/* Classe Principal */}
              <div className="flex items-center justify-between p-2.5 bg-[#140d08] border border-[#8c6b32]/40 rounded-lg">
                <div>
                  <span className="font-bold text-sm text-[#f4ecd8]">
                    {primaryClass}
                  </span>
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
                      handlePrimaryLevelChange(
                        clean === '' ? 1 : Math.max(1, parseInt(clean, 10))
                      );
                    }}
                    className="w-16 min-w-[4rem] bg-[#1e140d] border border-[#8c6b32]/60 rounded px-1.5 py-0.5 text-center text-sm font-bold text-amber-300 focus:outline-none focus:border-[#c49d48]"
                  />
                </div>
              </div>

              {/* Multiclasses */}
              {multiclasses.map((mc) => (
                <div
                  key={mc.id}
                  className="flex items-center justify-between p-2.5 bg-[#140d08] border border-[#8c6b32]/30 rounded-lg"
                >
                  <div>
                    <span className="font-bold text-sm text-[#f4ecd8]">
                      {mc.className}
                    </span>
                    <span className="text-[10px] text-[#e8c679] ml-2 font-mono uppercase bg-[#2a1d13] px-1.5 py-0.5 rounded border border-[#8c6b32]/60">
                      Nível {mc.level}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMulticlass(mc.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/40 rounded border border-red-800/40 cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar Nova Multiclasse */}
            <div className="pt-3 border-t border-[#8c6b32]/40 space-y-3">
              <div className="text-xs uppercase font-bold text-[#c49d48] tracking-wider">
                Adicionar Nova Classe:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newMulticlassName}
                  onChange={(e) => setNewMulticlassName(e.target.value)}
                  className="bg-[#140d08] border border-[#8c6b32]/60 rounded-lg p-2 text-xs text-[#f4ecd8] focus:outline-none focus:border-[#c49d48] cursor-pointer"
                >
                  {STANDARD_5E_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#bfa888]">Nível:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newMulticlassLevel}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setNewMulticlassLevel(
                        clean === '' ? 1 : Math.max(1, parseInt(clean, 10))
                      );
                    }}
                    className="w-full bg-[#140d08] border border-[#8c6b32]/60 rounded-lg p-2 text-center text-xs font-bold text-amber-300 focus:outline-none focus:border-[#c49d48]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMulticlassModal(false)}
                  className="px-3 py-1.5 text-xs text-[#bfa888] hover:text-[#f4ecd8] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddMulticlass}
                  className="px-4 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Adicionar Classe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
