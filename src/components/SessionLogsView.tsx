import React, { useState } from 'react';
import { Campaign, SessionLog, SessionEvent } from '../types/dnd';
import {
  BookOpen,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Shield,
  UserCheck,
  Search,
  Swords,
  Scroll,
  Gift,
  Award,
} from 'lucide-react';

interface SessionLogsViewProps {
  campaign: Campaign | null;
  allCampaigns?: Campaign[];
  onSelectCampaign?: (campaign: Campaign) => void;
  onNavigateToCampaigns?: () => void;
  onAddSessionLog: (newLog: SessionLog) => void;
  onAddEventToSession: (sessionId: string, newEvent: SessionEvent) => void;
  userRole: 'dm' | 'player';
  userName: string;
}

export const SessionLogsView: React.FC<SessionLogsViewProps> = ({
  campaign,
  allCampaigns = [],
  onSelectCampaign,
  onNavigateToCampaigns,
  onAddSessionLog,
  onAddEventToSession,
  userRole,
  userName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [activeSessionForEvent, setActiveSessionForEvent] = useState<string | null>(null);

  // New Session Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSessionNum, setNewSessionNum] = useState(
    (campaign?.sessionLogs?.length || 0) + 1
  );
  const [newRealDate, setNewRealDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInGameDate, setNewInGameDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newXp, setNewXp] = useState<number>(0);
  const [newLoot, setNewLoot] = useState('');

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState<SessionEvent['category']>('combat');

  if (!campaign) {
    return (
      <div className="bg-[#12131c] p-8 rounded-2xl border border-[#212330] text-center space-y-4 max-w-lg mx-auto my-8">
        <BookOpen className="w-12 h-12 text-[#d4af37] mx-auto" />
        <h3 className="font-serif font-bold text-white text-xl">Nenhuma campanha selecionada</h3>
        <p className="text-sm text-stone-400">
          Selecione uma campanha ativa ou crie uma nova para registrar sessões, crônicas e eventos colaborativos.
        </p>
        {allCampaigns && allCampaigns.length > 0 && onSelectCampaign && (
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs text-stone-400 font-semibold uppercase">Escolha uma Campanha:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {allCampaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCampaign(c)}
                  className="px-3.5 py-2 bg-[#1b1d28] hover:bg-[#2e2316] border border-[#8c6b32]/50 text-[#e8c679] text-xs font-semibold rounded-lg transition"
                >
                  {c.name} ({c.code})
                </button>
              ))}
            </div>
          </div>
        )}
        {onNavigateToCampaigns && (
          <div className="pt-2">
            <button
              onClick={onNavigateToCampaigns}
              className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs rounded-lg transition shadow-md"
            >
              Ir para Gerenciador de Campanhas
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const log: SessionLog = {
      id: `sess_${Date.now()}`,
      campaignId: campaign.id,
      sessionNumber: newSessionNum,
      realDate: newRealDate,
      inGameDate: newInGameDate.trim() || undefined,
      title: newTitle.trim(),
      location: newLocation.trim() || undefined,
      summary: newSummary.trim(),
      events: [],
      xpAwarded: newXp || undefined,
      lootAwarded: newLoot.trim() || undefined,
      authorName: userName,
      authorRole: userRole,
      createdAt: new Date().toISOString(),
    };

    onAddSessionLog(log);
    setShowNewSessionModal(false);
    setNewTitle('');
    setNewSummary('');
    setNewLocation('');
    setNewLoot('');
    setNewXp(0);
    setNewSessionNum(newSessionNum + 1);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionForEvent || !eventTitle.trim()) return;

    const ev: SessionEvent = {
      id: `ev_${Date.now()}`,
      timestamp: eventTime.trim() || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      authorName: userName,
      authorRole: userRole,
      category: eventCategory,
    };

    onAddEventToSession(activeSessionForEvent, ev);
    setActiveSessionForEvent(null);
    setEventTitle('');
    setEventDesc('');
    setEventTime('');
  };

  const filteredLogs = (campaign.sessionLogs || []).filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.title.toLowerCase().includes(q) ||
      log.summary.toLowerCase().includes(q) ||
      (log.location && log.location.toLowerCase().includes(q)) ||
      log.events.some((ev) => ev.title.toLowerCase().includes(q) || ev.description.toLowerCase().includes(q))
    );
  });

  const getCategoryBadge = (cat?: SessionEvent['category']) => {
    switch (cat) {
      case 'combat':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
            <Swords className="w-3 h-3" /> Combate
          </span>
        );
      case 'lore':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            <Scroll className="w-3 h-3" /> História / Lore
          </span>
        );
      case 'loot':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
            <Gift className="w-3 h-3" /> Recompensa
          </span>
        );
      case 'milestone':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950 text-[#e8c679] border border-amber-800/80">
            <Award className="w-3 h-3" /> Marco
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
            <Sparkles className="w-3 h-3" /> Interpretação
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#18130e] p-4 sm:p-5 rounded-xl border border-[#382b1d] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2b2016] text-[#d4af37] border border-[#523f2b]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-black text-xl text-[#f7eedc]">
                Diário de Sessões &amp; Linha do Tempo
              </h2>
              <span className="text-[10px] uppercase font-bold bg-[#291b10] text-[#f59e0b] border border-[#5c3a1e] px-1.5 py-0.5 rounded">
                Mestre &amp; Jogadores
              </span>
            </div>
            <p className="text-xs text-[#a3907a]">
              Campanha: <strong className="text-[#eedbc5]">{campaign.name}</strong> • Registro colaborativo de acontecimentos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#8c7b67] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar registros..."
              className="w-full bg-[#110e0b] border border-[#4a3928] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#eedbc5] focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <button
            onClick={() => setShowNewSessionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs shadow-md border border-[#e8c679]/60 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Sessão</span>
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      <div className="bg-[#18130e] border border-[#382b1d] rounded-lg px-4 py-2.5 text-xs text-[#a3907a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {userRole === 'dm' ? (
            <Shield className="w-4 h-4 text-amber-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-indigo-400" />
          )}
          <span>
            Você está logado como: <strong className="text-[#eedbc5]">{userName}</strong> ({userRole === 'dm' ? 'Mestre da Mesa' : 'Jogador'}). Tanto Mestres quanto Jogadores podem adicionar novas sessões e registrar eventos na linha do tempo da mesa.
          </span>
        </div>
      </div>

      {/* Sessions Feed */}
      <div className="space-y-6">
        {filteredLogs.length === 0 ? (
          <div className="bg-stone-900/40 border border-dashed border-stone-800 rounded-xl p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
            <p className="text-stone-300 text-sm">
              Nenhuma sessão encontrada para esta campanha.
            </p>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="text-xs text-amber-400 hover:underline"
            >
              + Adicionar o primeiro relato de sessão
            </button>
          </div>
        ) : (
          filteredLogs.map((session) => (
            <div
              key={session.id}
              className="bg-[#171924] border border-stone-800 hover:border-amber-900/50 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
            >
              {/* Session Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-serif font-black px-2 py-0.5 rounded bg-amber-600/20 text-amber-300 border border-amber-500/40">
                      Sessão #{session.sessionNumber}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" /> {session.realDate}
                    </span>
                    {session.inGameDate && (
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        • Tempo no Jogo: <strong className="text-stone-300">{session.inGameDate}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-black text-amber-100">
                    {session.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {session.location && (
                    <span className="text-xs text-stone-400 flex items-center gap-1 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" /> {session.location}
                    </span>
                  )}
                  <span className="text-[11px] text-stone-500">
                    Registrado por: <strong>{session.authorName}</strong> ({session.authorRole === 'dm' ? 'Mestre' : 'Jogador'})
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="text-sm text-stone-300 leading-relaxed bg-stone-900/40 p-4 rounded-xl border border-stone-800/80">
                {session.summary}
              </div>

              {/* Rewards / XP / Loot */}
              {(session.xpAwarded || session.lootAwarded) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-950/60 p-3 rounded-lg border border-stone-800">
                  {session.xpAwarded ? (
                    <div className="flex items-center gap-2 text-[#e8c679]">
                      <Award className="w-4 h-4 text-[#d4af37]" />
                      <span>Experiência Concedida: <strong>+{session.xpAwarded} XP</strong></span>
                    </div>
                  ) : null}
                  {session.lootAwarded ? (
                    <div className="flex items-center gap-2 text-amber-300">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>Tesouros &amp; Itens: <strong>{session.lootAwarded}</strong></span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Events Timeline within the session */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Histórico de Eventos da Sessão ({session.events.length})
                  </span>

                  <button
                    onClick={() => setActiveSessionForEvent(session.id)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Evento
                  </button>
                </div>

                {session.events.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-2">
                    Nenhum evento detalhado adicionado ainda a esta sessão.
                  </p>
                ) : (
                  <div className="space-y-2 border-l-2 border-amber-900/40 pl-4 ml-2">
                    {session.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-stone-900/70 border border-stone-800 rounded-lg p-3 space-y-1 relative"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-amber-400 bg-stone-950 px-1.5 py-0.5 rounded">
                              {ev.timestamp}
                            </span>
                            <span className="font-serif font-bold text-stone-200 text-sm">
                              {ev.title}
                            </span>
                            {getCategoryBadge(ev.category)}
                          </div>

                          <span className="text-[10px] text-stone-500">
                            Por: {ev.authorName} ({ev.authorRole === 'dm' ? 'Mestre' : 'Jogador'})
                          </span>
                        </div>

                        <p className="text-xs text-stone-300 pt-1">
                          {ev.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: NOVA SESSÃO */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171924] border border-amber-900/60 rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-black text-amber-200 text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> Registrar Relato de Sessão
            </h3>

            <form onSubmit={handleCreateSession} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Número da Sessão
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newSessionNum}
                    onChange={(e) => setNewSessionNum(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Data Real da Partida
                  </label>
                  <input
                    type="date"
                    value={newRealDate}
                    onChange={(e) => setNewRealDate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Título da Sessão *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: A Batalha na Torre dos Goblins"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Local / Cenário
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Taverna da Colina, Castelo Cragmaw"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Data no Mundo (Calendário do RPG)
                  </label>
                  <input
                    type="text"
                    value={newInGameDate}
                    onChange={(e) => setNewInGameDate(e.target.value)}
                    placeholder="Ex: 14 de Eleint, 1492 DR"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Resumo Geral dos Acontecimentos *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="O que o grupo fez, quem encontrou e o que aconteceu..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    XP Total Distribuído
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newXp}
                    onChange={(e) => setNewXp(parseInt(e.target.value, 10) || 0)}
                    placeholder="Ex: 500"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-[#e8c679] font-bold focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Loot e Itens Adquiridos
                  </label>
                  <input
                    type="text"
                    value={newLoot}
                    onChange={(e) => setNewLoot(e.target.value)}
                    placeholder="Ex: 50 PO, Poção de Cura"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-amber-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg shadow-sm"
                >
                  Salvar Relato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR EVENTO PONTUAL */}
      {activeSessionForEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171924] border border-amber-900/60 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-serif font-black text-amber-200 text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> Registrar Evento no Histórico
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex: Emboscada na ponte, Descoberta do baú"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Horário ou Momento
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="Ex: 21:30 ou Noite"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-semibold block mb-1">
                    Categoria
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-2 text-xs text-amber-300 focus:outline-none"
                  >
                    <option value="combat">Combate</option>
                    <option value="lore">História / Revelação</option>
                    <option value="roleplay">Interpretação</option>
                    <option value="loot">Tesouro / Recompensa</option>
                    <option value="milestone">Marco Épico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-300 font-semibold block mb-1">
                  Detalhes do Acontecimento
                </label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Como o herói ou monstro reagiu..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSessionForEvent(null)}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg shadow-sm"
                >
                  Adicionar à Linha do Tempo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
