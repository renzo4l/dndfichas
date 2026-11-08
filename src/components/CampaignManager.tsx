import React, { useState } from 'react';
import { Campaign, CharacterSheet, SessionLog, SessionEvent } from '../types/dnd';
import { generateCampaignCode, normalizeCampaignCode } from '../utils/dndRules';
import {
  Users,
  Copy,
  Check,
  Plus,
  LogIn,
  Shield,
  Heart,
  Eye,
  Crown,
  BookOpen,
  Sparkles,
  Trash2,
  Settings,
  ArrowLeft,
  Calendar,
  Clock,
  Swords,
  Scroll,
  MapPin,
  Image as ImageIcon,
  UserCheck,
  FileDown,
} from 'lucide-react';

interface CampaignManagerProps {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  onSelectCampaign: (campaign: Campaign | null) => void;
  onCreateCampaign: (newCampaign: Campaign) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onUpdateCampaign?: (updated: Campaign) => void;
  onJoinCampaign: (code: string, characterId: string) => boolean;
  onRemoveMemberFromCampaign?: (campaignId: string, memberId: string) => void;
  characters: CharacterSheet[];
  currentUserId: string;
  userName: string;
  onViewCharacterSheet: (characterId: string, isDmOfThisCampaign: boolean) => void;
  onQuickUpdateHp: (characterId: string, newHp: number) => void;
  onGoToSessionLogs?: () => void;
  onAddSessionLog: (newLog: SessionLog) => void;
  onAddEventToSession: (sessionId: string, newEvent: SessionEvent) => void;
}

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80';

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  campaigns,
  activeCampaign,
  onSelectCampaign,
  onCreateCampaign,
  onDeleteCampaign,
  onUpdateCampaign,
  onJoinCampaign,
  onRemoveMemberFromCampaign,
  characters,
  currentUserId,
  userName,
  onViewCharacterSheet,
  onQuickUpdateHp,
  onAddSessionLog,
  onAddEventToSession,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'characters' | 'players' | 'sessions'>('characters');
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);

  // Create Campaign State
  const [newCampName, setNewCampName] = useState('');
  const [newCampSetting, setNewCampSetting] = useState('Forgotten Realms (D&D 5e)');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampBanner, setNewCampBanner] = useState('');

  // Join Campaign State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinCharId, setJoinCharId] = useState(characters[0]?.id || '');
  const [joinError, setJoinError] = useState('');

  // Quick Add Character to Active Campaign State
  const [quickAddCharId, setQuickAddCharId] = useState('');

  // Session Logging Modals State
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [activeSessionForEvent, setActiveSessionForEvent] = useState<string | null>(null);

  // New Session Form State
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNum, setSessionNum] = useState(
    (activeCampaign?.sessionLogs?.length || 0) + 1
  );
  const [sessionRealDate, setSessionRealDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sessionInGameDate, setSessionInGameDate] = useState('');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionXp, setSessionXp] = useState<number>(0);
  const [sessionLoot, setSessionLoot] = useState('');

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState<SessionEvent['category']>('combat');

  // Check if current user is the true creator DM of active campaign
  const isDm = Boolean(
    activeCampaign && activeCampaign.dmUserId && activeCampaign.dmUserId === currentUserId
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;

    const code = generateCampaignCode();
    const camp: Campaign = {
      id: `camp_${Date.now()}`,
      code,
      name: newCampName.trim(),
      description: newCampDesc.trim(),
      bannerUrl: newCampBanner.trim() || DEFAULT_BANNER,
      dmName: userName || 'Mestre da Mesa',
      dmUserId: currentUserId, // STRICT: Only creator becomes DM
      setting: newCampSetting.trim() || 'D&D 5e',
      createdAt: new Date().toISOString(),
      members: [],
      sessionLogs: [],
    };

    onCreateCampaign(camp);
    setShowCreateModal(false);
    setNewCampName('');
    setNewCampDesc('');
    setNewCampBanner('');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCodeInput.trim() || !joinCharId) {
      setJoinError('Informe o código de 8 dígitos e selecione uma ficha.');
      return;
    }

    const success = onJoinCampaign(joinCodeInput, joinCharId);
    if (success) {
      setShowJoinModal(false);
      setJoinCodeInput('');
    } else {
      setJoinError('Código de campanha inválido. Verifique os 8 caracteres alfanuméricos.');
    }
  };

  const handleQuickAddCharacter = (charId: string) => {
    if (!activeCampaign || !charId) return;
    onJoinCampaign(activeCampaign.code, charId);
    setQuickAddCharId('');
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !sessionTitle.trim()) return;

    const newLog: SessionLog = {
      id: `sess_${Date.now()}`,
      campaignId: activeCampaign.id,
      sessionNumber: sessionNum,
      realDate: sessionRealDate,
      inGameDate: sessionInGameDate.trim() || undefined,
      title: sessionTitle.trim(),
      location: sessionLocation.trim() || undefined,
      summary: sessionSummary.trim(),
      events: [],
      xpAwarded: sessionXp > 0 ? sessionXp : undefined,
      lootAwarded: sessionLoot.trim() || undefined,
      authorName: userName,
      authorRole: isDm ? 'dm' : 'player',
      createdAt: new Date().toISOString(),
    };

    onAddSessionLog(newLog);
    setShowNewSessionModal(false);
    setSessionTitle('');
    setSessionSummary('');
    setSessionLoot('');
    setSessionXp(0);
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionForEvent || !eventTitle.trim()) return;

    const newEvent: SessionEvent = {
      id: `ev_${Date.now()}`,
      timestamp:
        eventTime.trim() ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      authorName: userName,
      authorRole: isDm ? 'dm' : 'player',
      category: eventCategory,
    };

    onAddEventToSession(activeSessionForEvent, newEvent);
    setActiveSessionForEvent(null);
    setEventTitle('');
    setEventDesc('');
    setEventTime('');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recente';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return 'Recente';
    }
  };

  // Unplaced characters that can be placed in this table by current player
  const unplacedCharacters = characters.filter(
    (c) => !activeCampaign?.members.some((m) => m.characterId === c.id)
  );

  // -------------------------------------------------------------
  // VIEW A: ACTIVE CAMPAIGN DETAILS
  // -------------------------------------------------------------
  if (activeCampaign) {
    return (
      <div className="space-y-6 pb-20 max-w-7xl mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onSelectCampaign(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e1913] hover:bg-[#2c241c] text-[#d9c7af] font-serif font-bold text-xs border border-[#4d3b2a] transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
            <span>Voltar a Todas as Campanhas</span>
          </button>

          {/* DM Ownership Status Tag */}
          <div className="flex items-center gap-2">
            {isDm ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2e1d0f] text-[#f59e0b] border border-[#78350f] rounded-lg text-xs font-serif font-bold shadow">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Mestre da Mesa (Criador)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c29] text-[#a5b4fc] border border-[#3730a3] rounded-lg text-xs font-serif font-semibold shadow">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Jogador na Mesa</span>
              </span>
            )}
          </div>
        </div>

        {/* Campaign Hero Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-[#f7eedc] tracking-wide">
            {activeCampaign.name}
          </h1>
          <p className="text-xs text-[#b8a287] flex items-center gap-2 flex-wrap font-serif">
            <span className="uppercase font-bold tracking-widest text-[#d4af37]">
              {activeCampaign.setting || 'D&D 5e'}
            </span>
            <span>•</span>
            <span>
              Mestre:{' '}
              <strong className="text-[#f7eedc]">{activeCampaign.dmName}</strong>
            </span>
            <span>•</span>
            <span>Criada em {formatDate(activeCampaign.createdAt)}</span>
          </p>
        </div>

        {/* Hero Section: Parchment Textured Table Banner Artwork (Left) + Lore/Synopsis (Right) */}
        <div className="parchment-mesa border-2 border-[#54412c] rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch relative z-10">
            {/* Banner Artwork (Left) */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-center">
              <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border-2 border-[#634e38] bg-[#0d0a08] relative shadow-2xl group">
                <img
                  src={activeCampaign.bannerUrl || DEFAULT_BANNER}
                  alt={activeCampaign.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_BANNER;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-[#eedbc5] font-serif font-medium">
                  <span className="bg-black/75 px-2.5 py-1 rounded backdrop-blur-sm border border-[#524131]">
                    {activeCampaign.setting || 'D&D 5e'}
                  </span>
                  <span className="bg-[#2a1d13] text-[#e8c679] px-2.5 py-1 rounded border border-[#8c6b32]/80 font-mono font-bold">
                    {activeCampaign.members.length} Jogador(es)
                  </span>
                </div>
              </div>
            </div>

            {/* Lore, Synopsis & 8-Digit Invite Code (Right) */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-sm sm:text-base text-[#e8dac7] leading-relaxed font-serif whitespace-pre-line max-h-52 overflow-y-auto pr-2 italic tracking-wide">
                  {activeCampaign.description ||
                    'Nenhuma sinopse definida para esta mesa de aventura. O mestre da campanha pode registrar o resumo dos mistérios e acontecimentos aqui.'}
                </div>
              </div>

              {/* 8-Digit Unique Invite Code Bar */}
              <div className="pt-3 border-t border-[#4a3928]/80 flex flex-wrap items-center justify-between gap-3 bg-[#16110c]/85 backdrop-blur-sm p-3.5 rounded-xl border border-[#4d3a27]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs uppercase font-serif font-bold tracking-widest text-[#d4af37]">
                    Código de Convite:
                  </span>
                  <span className="font-mono font-black text-lg sm:text-xl text-[#f59e0b] tracking-widest bg-[#22180f] px-3 py-1 rounded border border-[#63492e] select-all shadow-inner">
                    {activeCampaign.code}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(activeCampaign.code)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-serif font-bold transition shadow-lg ${
                      copiedCode
                        ? 'bg-emerald-900 text-emerald-200 border border-emerald-600'
                        : 'bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] border border-[#e8c679]/60 font-serif font-black'
                    }`}
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>

                  {isDm && onDeleteCampaign && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Deseja realmente excluir a mesa "${activeCampaign.name}"? Esta ação é irreversível.`
                          )
                        ) {
                          onDeleteCampaign(activeCampaign.id);
                        }
                      }}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/70 transition border border-red-900/50"
                      title="Excluir Campanha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs: Agentes / Personagens | Jogadores | Diário de Sessão */}
        <div className="border-b border-[#3b2e20] flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('characters')}
              className={`pb-3 text-sm sm:text-base font-serif font-bold transition relative flex items-center gap-2 ${
                activeTab === 'characters'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Personagens</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#261e16] border border-[#4a3928] text-[#d4af37]">
                {activeCampaign.members.length}
              </span>
              {activeTab === 'characters' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] rounded-t shadow-[0_0_8px_#c49d48]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('players')}
              className={`pb-3 text-sm sm:text-base font-serif font-bold transition relative flex items-center gap-2 ${
                activeTab === 'players'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Jogadores</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#261e16] border border-[#4a3928] text-stone-300">
                {activeCampaign.members.length}
              </span>
              {activeTab === 'players' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] rounded-t shadow-[0_0_8px_#c49d48]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`pb-3 text-sm sm:text-base font-serif font-bold transition relative flex items-center gap-2 ${
                activeTab === 'sessions'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Diário de Sessões</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#261e16] border border-[#4a3928] text-[#d4af37]">
                {activeCampaign.sessionLogs?.length || 0}
              </span>
              {activeTab === 'sessions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] rounded-t shadow-[0_0_8px_#c49d48]" />
              )}
            </button>
          </div>

          {/* Quick Action in Header */}
          {activeTab === 'characters' && unplacedCharacters.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <select
                value={quickAddCharId}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuickAddCharId(val);
                  if (val) handleQuickAddCharacter(val);
                }}
                className="bg-[#1c1712] border border-[#4d3d2c] rounded-lg px-2.5 py-1 text-xs text-[#eedbc5] focus:outline-none"
              >
                <option value="">+ Vincular Personagem Meu...</option>
                {unplacedCharacters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.characterName} ({c.classAndLevel})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="pb-2">
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="px-3 py-1 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] text-xs font-serif font-black rounded-lg transition shadow flex items-center gap-1 border border-[#e8c679]/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Sessão</span>
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: PERSONAGENS - ONLY characters put in by players */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            {activeCampaign.members.length === 0 ? (
              <div className="bg-[#19140f] border border-dashed border-[#443525] rounded-2xl p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2b2118] text-[#d4af37] border border-[#52402e] flex items-center justify-center mx-auto shadow-inner">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-lg text-[#f5ebd7]">
                    Nenhum personagem conectado a esta mesa ainda
                  </h3>
                  <p className="text-xs text-[#a3907a] max-w-md mx-auto">
                    Os jogadores entram utilizando o código de 8 dígitos{' '}
                    <strong className="text-amber-400 font-mono select-all">
                      {activeCampaign.code}
                    </strong>{' '}
                    ou você pode vincular uma das suas fichas existentes.
                  </p>
                </div>

                {unplacedCharacters.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleQuickAddCharacter(unplacedCharacters[0].id)}
                      className="px-5 py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg shadow-lg border border-[#e8c679]/60 transition"
                    >
                      + Vincular {unplacedCharacters[0].characterName} à Mesa
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Character Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCampaign.members.map((member) => {
                  const linkedChar = characters.find((c) => c.id === member.characterId);
                  const charName = linkedChar ? linkedChar.characterName : member.characterName;
                  const charClass = linkedChar ? linkedChar.classAndLevel : member.characterClass;
                  const currentHp = linkedChar ? linkedChar.currentHp : member.currentHp;
                  const maxHp = linkedChar ? linkedChar.maxHp : member.maxHp;
                  const ac = linkedChar ? linkedChar.armorClass : member.armorClass;
                  const joinedDate = formatDate(member.joinedAt);

                  return (
                    <div
                      key={member.id}
                      className="bg-[#1e140d]/95 hover:bg-[#261a12] border border-[#8c6b32]/50 hover:border-[#c49d48] rounded-xl overflow-hidden transition-all duration-200 shadow-xl flex h-32 relative group"
                    >
                      {/* Left Avatar / Portrait: Full height on left side */}
                      <div className="w-28 sm:w-32 h-full bg-[#18110b] flex-shrink-0 overflow-hidden relative border-r border-[#8c6b32]/30 flex items-center justify-center select-none">
                        {linkedChar?.avatarUrl ? (
                          <img
                            src={linkedChar.avatarUrl}
                            alt={charName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#2a1c12] via-[#1e140d] to-[#120c08] flex items-center justify-center">
                            <span className="font-serif font-black text-2xl text-[#c49d48] tracking-wider">
                              {charName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 text-[9px] bg-black/85 text-[#f4ecd8] font-bold px-1.5 py-0.2 rounded border border-[#8c6b32]/40 font-mono">
                          Nv.{member.characterLevel || 1}
                        </span>
                      </div>

                      {/* Main Details Alongside Photo */}
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0 pr-8">
                        {/* Linhas 1, 2 e 3 */}
                        <div className="space-y-0.5">
                          <h3
                            className="font-serif font-black text-base text-[#f4ecd8] leading-tight truncate group-hover:text-[#c49d48] transition-colors"
                            title={charName}
                          >
                            {charName}
                          </h3>
                          <p className="text-xs text-[#eedbc5] truncate font-serif">
                            {charClass}
                          </p>
                          <p className="text-[11px] text-[#bfa888] font-serif">
                            Registrado em {joinedDate}
                          </p>
                        </div>

                        {/* Linha inferior: Marcadores sutis de HP e CA */}
                        <div className="flex items-center gap-2 text-[11px] text-[#bfa888] font-serif">
                          <span className="flex items-center gap-1 text-red-300">
                            <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
                            <span>{currentHp}/{maxHp}</span>
                          </span>
                          <span className="text-[#8c6b32]">•</span>
                          <span className="flex items-center gap-1 text-amber-300">
                            <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>CA {ac}</span>
                          </span>

                          {/* DM Quick HP controls */}
                          {isDm && (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() =>
                                  onQuickUpdateHp(
                                    member.characterId,
                                    Math.max(0, currentHp - 5)
                                  )
                                }
                                className="px-1 py-0.2 text-[9px] rounded bg-[#331d1d] hover:bg-red-900/60 text-red-200 border border-red-800/40"
                                title="Subtrair 5 HP"
                              >
                                -5
                              </button>
                              <button
                                onClick={() =>
                                  onQuickUpdateHp(
                                    member.characterId,
                                    Math.min(maxHp + 20, currentHp + 5)
                                  )
                                }
                                className="px-1 py-0.2 text-[9px] rounded bg-[#173022] hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/40"
                                title="Adicionar 5 HP"
                              >
                                +5
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gear Icon: precisely in the top right corner */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          onClick={() =>
                            setActiveMenuMemberId(
                              activeMenuMemberId === member.id ? null : member.id
                            )
                          }
                          className="p-1 rounded text-[#bfa888] hover:text-[#f4ecd8] hover:bg-[#3d2a1b]/70 transition"
                          title="Opções do Aventureiro"
                        >
                          <Settings className="w-4 h-4" />
                        </button>

                        {activeMenuMemberId === member.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-[#261a12] border border-[#8c6b32] rounded-lg shadow-2xl p-1.5 z-30 text-xs font-serif backdrop-blur-md">
                            <button
                              onClick={() => {
                                onViewCharacterSheet(member.characterId, isDm);
                                setActiveMenuMemberId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-[#3d2a1b] rounded text-[#f4ecd8] flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>Abrir Ficha</span>
                            </button>
                            {(isDm || member.playerName === userName) &&
                              onRemoveMemberFromCampaign && (
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Desconectar ${charName} desta mesa de campanha?`
                                      )
                                    ) {
                                      onRemoveMemberFromCampaign(
                                        activeCampaign.id,
                                        member.id
                                      );
                                      setActiveMenuMemberId(null);
                                    }
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/70 rounded text-red-300 flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remover da Mesa</span>
                                </button>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Botão 'Acessar Ficha' fixado no canto inferior direito do card */}
                      <div className="absolute bottom-2.5 right-2.5 z-10">
                        <button
                          onClick={() => onViewCharacterSheet(member.characterId, isDm)}
                          className="px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-md shadow-[0_0_10px_rgba(196,157,72,0.4)] border border-[#e8c679]/60 transition transform active:scale-95"
                        >
                          Acessar Ficha
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: JOGADORES - Roster of real players in this table */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'players' && (
          <div className="bg-[#18130e] border border-[#382b1d] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#312519]">
              <h3 className="font-serif font-bold text-[#f5ebd7] text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#d4af37]" />
                <span>Jogadores Participantes da Mesa</span>
              </h3>
              <span className="text-xs text-[#a3907a]">
                Total de Membros: {activeCampaign.members.length + 1} (1 Mestre +{' '}
                {activeCampaign.members.length} Jogadores)
              </span>
            </div>

            <div className="space-y-2">
              {/* Table DM Leader */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#261c13] border border-[#543f29]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/60 flex items-center justify-center font-bold text-sm">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-bold text-[#f7eedc] text-sm flex items-center gap-2">
                      <span>{activeCampaign.dmName}</span>
                      <span className="text-[10px] bg-amber-900/60 text-amber-200 border border-amber-600/50 px-1.5 py-0.2 rounded font-bold uppercase">
                        Mestre da Mesa (DM)
                      </span>
                    </div>
                    <p className="text-xs text-[#9d8a74]">Criador e Narrador da Campanha</p>
                  </div>
                </div>
              </div>

              {/* Player Members */}
              {activeCampaign.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1d1610] border border-[#382b1d] hover:border-[#57422c] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#292017] text-[#eedbc5] border border-[#4d3a27] flex items-center justify-center font-bold text-sm">
                      <UserCheck className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#f7eedc] text-sm flex items-center gap-2">
                        <span>{m.playerName}</span>
                        <span className="text-[10px] bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32]/60 px-1.5 py-0.2 rounded font-bold">
                          Jogador
                        </span>
                      </div>
                      <p className="text-xs text-[#a3907a]">
                        Personagem:{' '}
                        <strong className="text-[#eedbc5]">{m.characterName}</strong> (
                        {m.characterClass})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewCharacterSheet(m.characterId, isDm)}
                      className="px-3 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition border border-[#e8c679]/60"
                    >
                      Ver Ficha
                    </button>
                    {(isDm || m.playerName === userName) &&
                      onRemoveMemberFromCampaign && (
                        <button
                          onClick={() => {
                            if (confirm(`Remover ${m.playerName} da mesa?`)) {
                              onRemoveMemberFromCampaign(activeCampaign.id, m.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/60 transition border border-red-900/40"
                          title="Remover Jogador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: DIÁRIO DE SESSÃO - Strictly linked to this campaign */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-[#18130e] border border-[#382b1d] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#312519]">
                <div>
                  <h3 className="font-serif font-bold text-[#f5ebd7] text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#d4af37]" />
                    <span>Crônicas e Diários da Campanha</span>
                  </h3>
                  <p className="text-xs text-[#a3907a]">
                    Registros oficiais das sessões, linha do tempo dos eventos e recompensas
                  </p>
                </div>

                <button
                  onClick={() => setShowNewSessionModal(true)}
                  className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition shadow flex items-center gap-1.5 border border-[#e8c679]/60"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Sessão</span>
                </button>
              </div>

              {/* Sessions List */}
              {(!activeCampaign.sessionLogs || activeCampaign.sessionLogs.length === 0) ? (
                <div className="py-12 text-center space-y-3">
                  <Scroll className="w-12 h-12 text-[#6e5840] mx-auto" />
                  <h4 className="font-serif font-bold text-[#f5ebd7] text-base">
                    Nenhuma sessão registrada nesta mesa
                  </h4>
                  <p className="text-xs text-[#9d8a74] max-w-sm mx-auto">
                    Mestres e jogadores podem registrar as sessões jogadas para guardar o
                    histórico da campanha.
                  </p>
                  <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="px-4 py-2 bg-[#2c2016] hover:bg-[#3b2b1d] text-[#eedbc5] border border-[#57412b] rounded-lg text-xs font-bold transition"
                  >
                    + Registrar Primeira Sessão
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeCampaign.sessionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-[#130f0b] border border-[#312519] rounded-xl p-4 sm:p-5 space-y-4 shadow-md"
                    >
                      {/* Session Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#261c13] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-serif font-extrabold px-2 py-0.5 rounded bg-[#2a1d13] text-[#e8c679] border border-[#8c6b32]/80">
                              Sessão #{log.sessionNumber}
                            </span>
                            <h4 className="font-serif font-bold text-lg text-[#f7eedc]">
                              {log.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8c7b67] mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {log.realDate}
                            </span>
                            {log.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                {log.location}
                              </span>
                            )}
                            <span className="text-[11px] text-[#b39e85]">
                              Registrado por: <strong>{log.authorName}</strong> (
                              {log.authorRole === 'dm' ? 'Mestre' : 'Jogador'})
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveSessionForEvent(log.id)}
                          className="px-3 py-1.5 bg-[#261d15] hover:bg-[#382b1d] text-[#eedbc5] border border-[#4a3928] text-xs font-bold rounded-lg transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Adicionar Evento</span>
                        </button>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-[#d4c3ae] leading-relaxed whitespace-pre-line font-serif">
                        {log.summary}
                      </p>

                      {/* Rewards */}
                      {(log.xpAwarded || log.lootAwarded) && (
                        <div className="flex items-center gap-4 text-xs bg-[#1a140f] p-2.5 rounded-lg border border-[#33261a]">
                          {log.xpAwarded && (
                            <span className="text-amber-400 font-bold">
                              ✦ {log.xpAwarded} XP Concedidos
                            </span>
                          )}
                          {log.lootAwarded && (
                            <span className="text-[#eedbc5]">
                              Tesouro/Loot: {log.lootAwarded}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Events Timeline */}
                      {log.events && log.events.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#9d8a74]">
                            Acontecimentos &amp; Linha do Tempo:
                          </h5>
                          <div className="space-y-2 border-l-2 border-[#8c6b32]/60 pl-3 ml-2">
                            {log.events.map((ev) => (
                              <div
                                key={ev.id}
                                className="bg-[#1b1510] border border-[#2f2216] p-2.5 rounded-lg text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between text-[#8c7b67]">
                                  <span className="font-bold text-[#eedbc5] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#d4af37]" />
                                    {ev.timestamp} • {ev.title}
                                  </span>
                                  <span className="text-[10px] uppercase font-semibold text-amber-500">
                                    {ev.category || 'combate'}
                                  </span>
                                </div>
                                <p className="text-[#cfbeaa]">{ev.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Nova Sessão */}
        {showNewSessionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#18130e] border-2 border-[#54412c] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-serif font-black text-xl text-[#f7eedc] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
                <span>Registrar Nova Sessão</span>
              </h3>

              <form onSubmit={handleCreateSessionSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                      Número da Sessão *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={sessionNum}
                      onChange={(e) => setSessionNum(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                      Data Real *
                    </label>
                    <input
                      type="date"
                      value={sessionRealDate}
                      onChange={(e) => setSessionRealDate(e.target.value)}
                      className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                    Título do Episódio / Sessão *
                  </label>
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Ex: A Caverna dos Goblins / O Encontro no Pântano"
                    className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                    Local Principal
                  </label>
                  <input
                    type="text"
                    value={sessionLocation}
                    onChange={(e) => setSessionLocation(e.target.value)}
                    placeholder="Ex: Phandalin / Mina dos Três Dragões"
                    className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                    Resumo dos Acontecimentos *
                  </label>
                  <textarea
                    rows={4}
                    value={sessionSummary}
                    onChange={(e) => setSessionSummary(e.target.value)}
                    placeholder="O que o grupo realizou, descobertas, combates e ganchos narrativos..."
                    className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                      XP Concedido
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={sessionXp}
                      onChange={(e) => setSessionXp(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                      Tesouro / Loot
                    </label>
                    <input
                      type="text"
                      value={sessionLoot}
                      onChange={(e) => setSessionLoot(e.target.value)}
                      placeholder="Ex: 50 PO, Poção de Cura"
                      className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSessionModal(false)}
                    className="px-4 py-2 bg-[#261d15] hover:bg-[#382b1d] text-[#eedbc5] text-xs font-bold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] text-xs font-serif font-black rounded-lg transition shadow"
                  >
                    Salvar Sessão
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Adicionar Evento na Sessão */}
        {activeSessionForEvent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#18130e] border-2 border-[#54412c] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-serif font-black text-lg text-[#f7eedc] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#d4af37]" />
                <span>Adicionar Momento na Linha do Tempo</span>
              </h3>

              <form onSubmit={handleCreateEventSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                      Horário / Momento
                    </label>
                    <input
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="Ex: 20:30 ou Início do Combate"
                      className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                      Categoria
                    </label>
                    <select
                      value={eventCategory}
                      onChange={(e) =>
                        setEventCategory(e.target.value as SessionEvent['category'])
                      }
                      className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    >
                      <option value="combat">⚔️ Combate</option>
                      <option value="roleplay">🎭 Interpretação</option>
                      <option value="lore">📜 Investigação / Lore</option>
                      <option value="loot">💎 Tesouro / Loot</option>
                      <option value="milestone">🏆 Conquista / Marco</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                    Título do Evento *
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Ex: Derrota do Bugbear / Descoberta da Runa"
                    className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={3}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Descreva o que ocorreu neste momento..."
                    className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveSessionForEvent(null)}
                    className="px-4 py-2 bg-[#261d15] hover:bg-[#382b1d] text-[#eedbc5] text-xs font-bold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] text-xs font-serif font-black rounded-lg transition shadow"
                  >
                    Adicionar Evento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: CAMPAIGNS LIST
  // -------------------------------------------------------------
  const filteredCampaigns = campaigns.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.setting.toLowerCase().includes(q) ||
      c.dmName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Header: Count & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-[#f7eedc]">
            Campanhas: {campaigns.length}
          </h1>
          <p className="text-xs text-[#a3907a]">
            Crie sua própria mesa como Mestre ou entre com o código de 8 dígitos de outra campanha
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-[#221a14] hover:bg-[#33261c] text-[#eedbc5] font-bold text-xs rounded-lg transition border border-[#4a3928] flex items-center gap-1.5 shadow"
          >
            <LogIn className="w-4 h-4 text-[#d4af37]" />
            <span>Entrar com Código</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition shadow-lg border border-[#e8c679]/60 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="py-20 text-center bg-[#19140f] rounded-2xl border border-[#382b1d] p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#292017] text-[#d4af37] border border-[#523f2b] flex items-center justify-center mx-auto shadow-xl">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#f5ebd7]">
              Nenhuma campanha criada ainda
            </h3>
            <p className="text-xs text-[#9d8a74] max-w-md mx-auto">
              Crie sua primeira campanha para se tornar o Mestre com código único de 8 dígitos,
              ou entre em uma mesa existente.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-sm rounded-lg shadow-lg border border-[#e8c679]/60 transition"
          >
            + Criar Campanha Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((camp) => {
            const isCreator = camp.dmUserId === currentUserId;
            return (
              <div
                key={camp.id}
                className="bg-[#1e140d]/95 hover:bg-[#261a12] border border-[#8c6b32]/50 hover:border-[#c49d48] rounded-xl overflow-hidden shadow-2xl transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Banner Thumbnail */}
                <div className="h-44 bg-[#0d0a08] relative overflow-hidden">
                  <img
                    src={camp.bannerUrl || DEFAULT_BANNER}
                    alt={camp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_BANNER;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e140d] via-black/30 to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-black/80 backdrop-blur-sm text-[#f4ecd8] text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-[#8c6b32]/40">
                      <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                      {camp.members.length}
                    </span>
                    {isCreator && (
                      <span className="bg-amber-950/90 text-amber-300 text-[10px] font-serif font-bold px-2 py-0.5 rounded border border-amber-600/60 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>Você é Mestre</span>
                      </span>
                    )}
                  </div>

                  {/* Trash Icon if Creator */}
                  {isCreator && onDeleteCampaign && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir a campanha "${camp.name}"?`)) {
                          onDeleteCampaign(camp.id);
                        }
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 hover:bg-red-950/80 text-red-400 border border-red-900/50 transition"
                      title="Excluir Campanha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* 8-Digit Invite Code Pill */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="font-mono text-xs font-black tracking-wider bg-black/85 text-[#f59e0b] px-2 py-0.5 rounded border border-[#8c6b32]/60">
                      {camp.code}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="font-serif font-black text-[#f4ecd8] text-lg line-clamp-1 group-hover:text-[#c49d48] transition-colors"
                      title={camp.name}
                    >
                      {camp.name}
                    </h3>
                    <p className="text-xs text-[#bfa888] mt-0.5 font-serif">
                      Iniciada em {formatDate(camp.createdAt)} |{' '}
                      <strong className="text-[#f4ecd8]">{camp.dmName}</strong>
                    </p>
                    <p className="text-xs text-[#eedbc5] mt-2 line-clamp-2 font-serif">
                      {camp.description || 'Nenhuma descrição fornecida.'}
                    </p>
                  </div>

                  {/* Card Bottom: Refined Arcane Purple "Acessar" Button */}
                  <div className="pt-3 border-t border-[#8c6b32]/30 flex items-center justify-between">
                    <span className="text-[11px] text-[#bfa888] font-serif">
                      {camp.sessionLogs?.length || 0} sessão(ões)
                    </span>

                    <button
                      onClick={() => onSelectCampaign(camp)}
                      className="px-4 py-1.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-md shadow-[0_0_10px_rgba(196,157,72,0.4)] border border-[#e8c679]/60 transition transform active:scale-95"
                    >
                      Acessar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar Nova Campanha */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18130e] border-2 border-[#54412c] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="font-serif font-black text-xl text-[#f7eedc] flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Criar Nova Campanha D&amp;D 5e</span>
              </h3>
              <p className="text-xs text-[#a3907a] mt-1">
                Você será registrado como o <strong>Mestre (DM)</strong> exclusivo desta mesa.
                Um código único de 8 caracteres alfanuméricos será gerado para os jogadores entrarem.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="Ex: A Mina Perdida de Phandelver / Talassofobia"
                  className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                  Cenário de Campanha
                </label>
                <input
                  type="text"
                  value={newCampSetting}
                  onChange={(e) => setNewCampSetting(e.target.value)}
                  placeholder="Ex: Forgotten Realms, Eberron, Ravenloft, Homebrew..."
                  className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                  URL da Imagem de Banner (Opcional)
                </label>
                <input
                  type="url"
                  value={newCampBanner}
                  onChange={(e) => setNewCampBanner(e.target.value)}
                  placeholder="https://exemplo.com/arte_campanha.jpg"
                  className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                  Descrição e Sinopse da Campanha
                </label>
                <textarea
                  rows={4}
                  value={newCampDesc}
                  onChange={(e) => setNewCampDesc(e.target.value)}
                  placeholder="Breve resumo da aventura para os jogadores..."
                  className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#261d15] hover:bg-[#382b1d] text-[#eedbc5] text-xs font-bold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] text-xs font-serif font-black rounded-lg transition shadow"
                >
                  Criar &amp; Virar Mestre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Entrar com Código */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18130e] border-2 border-[#54412c] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-serif font-black text-lg text-[#f7eedc] flex items-center gap-2">
                <LogIn className="w-5 h-5 text-[#d4af37]" />
                <span>Entrar em uma Campanha</span>
              </h3>
              <p className="text-xs text-[#a3907a] mt-1">
                Digite o código único de 8 letras/números fornecido pelo Mestre da mesa (ex:{' '}
                <code className="text-[#f59e0b]">DRG7-K92X</code>).
              </p>
            </div>

            {joinError && (
              <div className="p-3 bg-red-950/80 border border-red-700/60 rounded-lg text-xs text-red-200">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                  Código de 8 Dígitos *
                </label>
                <input
                  type="text"
                  maxLength={9}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="EX: DRG7-K92X"
                  className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5] font-mono tracking-widest text-center"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#eedbc5] block mb-1">
                  Selecione sua Ficha para a Mesa *
                </label>
                {characters.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    Você ainda não tem nenhum personagem criado. Crie uma ficha primeiro.
                  </p>
                ) : (
                  <select
                    value={joinCharId}
                    onChange={(e) => setJoinCharId(e.target.value)}
                    className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg px-3 py-2 text-sm text-[#eedbc5]"
                    required
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.characterName} ({c.classAndLevel}) - {c.playerName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 bg-[#261d15] hover:bg-[#382b1d] text-[#eedbc5] text-xs font-bold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={characters.length === 0}
                  className="px-5 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] text-xs font-serif font-black rounded-lg transition shadow disabled:opacity-50"
                >
                  Vincular &amp; Entrar no Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
