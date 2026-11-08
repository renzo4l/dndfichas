import React, { useState, useEffect } from 'react';
import {
  CharacterSheet,
  Campaign,
  SessionLog,
  SessionEvent,
  HomebrewItem,
  DiceRollResult,
} from './types/dnd';
import {
  getSavedCharacters,
  saveCharacters,
  getSavedCampaigns,
  saveCampaigns,
  getSavedHomebrews,
  saveHomebrews,
  getActiveCampaignId,
  setActiveCampaignId,
  getActiveCharacterId,
  setActiveCharacterId,
  getUserRole,
  setUserRole as saveUserRole,
  getUserName,
  setUserName as saveUserName,
  getDiceHistory,
  saveDiceHistory,
  createBlankCharacter,
  getCurrentUserId,
} from './services/storage';
import { normalizeCampaignCode, rollDice } from './utils/dndRules';
import { initAuth } from './services/firebaseAuth';
import { Sidebar, MainView } from './components/Sidebar';
import { CharacterListView } from './components/CharacterListView';
import { CharacterSheetView } from './components/CharacterSheetView';
import { CampaignManager } from './components/CampaignManager';
import { HomebrewManager } from './components/HomebrewManager';
import { DiceRollerModal } from './components/DiceRollerModal';
import { DiceRollResultManager } from './components/DiceRollResultManager';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { Menu, Dices } from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<MainView>('characters_list');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User Identity State - Stable User ID ensures only table creator is DM!
  const [currentUserId] = useState<string>(() => getCurrentUserId());
  const [userRole, setUserRoleState] = useState<'dm' | 'player'>('player');
  const [userName, setUserNameState] = useState<string>('Aventureiro');

  // Application Data State (CLEAN - NO SAMPLE EXAMPLES)
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);
  const [activeCharId, setActiveCharIdState] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampId, setActiveCampIdState] = useState<string>('');
  const [homebrews, setHomebrews] = useState<HomebrewItem[]>([]);
  const [diceHistory, setDiceHistory] = useState<DiceRollResult[]>([]);

  // Modals & Floating Toasts
  const [rollToasts, setRollToasts] = useState<DiceRollResult[]>([]);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Google Drive & Auth State
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  // Initialize on mount
  useEffect(() => {
    const loadedChars = getSavedCharacters();
    setCharacters(loadedChars);
    if (loadedChars.length > 0) {
      const activeId = getActiveCharacterId();
      setActiveCharIdState(
        loadedChars.some((c) => c.id === activeId) ? activeId : loadedChars[0].id
      );
    }

    const loadedCampaigns = getSavedCampaigns();
    setCampaigns(loadedCampaigns);
    setActiveCampIdState(''); // Start with empty so Campanhas tab shows the list grid!

    const loadedHbs = getSavedHomebrews();
    setHomebrews(loadedHbs);

    setUserRoleState(getUserRole());
    setUserNameState(getUserName());
    setDiceHistory(getDiceHistory());

    // Firebase Auth listener for Google Drive integration
    initAuth(
      (user, token) => {
        setIsDriveConnected(!!token || !!user);
        setUserEmail(user?.email || undefined);
      },
      () => {
        setIsDriveConnected(false);
        setUserEmail(undefined);
      }
    );
  }, []);

  // Update Role & User Name
  const handleToggleRole = () => {
    const nextRole = userRole === 'dm' ? 'player' : 'dm';
    setUserRoleState(nextRole);
    saveUserRole(nextRole);
  };

  // Character Management
  const handleCreateNewCharacter = () => {
    const newChar = createBlankCharacter(`Novo Personagem ${characters.length + 1}`);
    const nextList = [newChar, ...characters];
    setCharacters(nextList);
    saveCharacters(nextList);
    setActiveCharIdState(newChar.id);
    setActiveCharacterId(newChar.id);
    setCurrentView('character_sheet');
  };

  const handleSelectCharacter = (char: CharacterSheet) => {
    setActiveCharIdState(char.id);
    setActiveCharacterId(char.id);
    setCurrentView('character_sheet');
  };

  const handleUpdateCharacter = (updated: CharacterSheet) => {
    const updatedList = characters.map((c) => (c.id === updated.id ? updated : c));
    setCharacters(updatedList);
    saveCharacters(updatedList);

    // Sync member in campaigns if bound
    if (updated.campaignId) {
      setCampaigns((prev) => {
        const next = prev.map((camp) => {
          if (camp.id === updated.campaignId) {
            return {
              ...camp,
              members: camp.members.map((m) =>
                m.characterId === updated.id
                  ? {
                      ...m,
                      characterName: updated.characterName,
                      characterClass: updated.classAndLevel,
                      characterLevel: updated.level,
                      currentHp: updated.currentHp,
                      maxHp: updated.maxHp,
                      armorClass: updated.armorClass,
                      passivePerception: updated.passivePerception,
                    }
                  : m
              ),
            };
          }
          return camp;
        });
        saveCampaigns(next);
        return next;
      });
    }
  };

  const handleDeleteCharacter = (charId: string) => {
    const nextList = characters.filter((c) => c.id !== charId);
    setCharacters(nextList);
    saveCharacters(nextList);
    if (activeCharId === charId) {
      const nextActive = nextList[0]?.id || '';
      setActiveCharIdState(nextActive);
      setActiveCharacterId(nextActive);
      if (!nextActive) setCurrentView('characters_list');
    }
  };

  // Campaign Management
  const handleCreateCampaign = (newCamp: Campaign) => {
    const campWithDm: Campaign = {
      ...newCamp,
      dmUserId: currentUserId,
      dmName: userName || 'Mestre da Mesa',
    };
    const nextList = [campWithDm, ...campaigns];
    setCampaigns(nextList);
    saveCampaigns(nextList);
    setActiveCampIdState(campWithDm.id);
    setActiveCampaignId(campWithDm.id);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    const nextList = campaigns.filter((c) => c.id !== campaignId);
    setCampaigns(nextList);
    saveCampaigns(nextList);
    if (activeCampId === campaignId) {
      const nextActive = nextList[0]?.id || '';
      setActiveCampIdState(nextActive);
      setActiveCampaignId(nextActive);
    }
  };

  const handleRemoveMemberFromCampaign = (campaignId: string, memberId: string) => {
    const nextList = campaigns.map((camp) => {
      if (camp.id === campaignId) {
        return {
          ...camp,
          members: camp.members.filter((m) => m.id !== memberId),
        };
      }
      return camp;
    });
    setCampaigns(nextList);
    saveCampaigns(nextList);
  };

  const handleJoinCampaign = (code: string, characterId: string): boolean => {
    const norm = normalizeCampaignCode(code);
    const targetCamp = campaigns.find(
      (c) => normalizeCampaignCode(c.code) === norm
    );

    if (!targetCamp) return false;

    const charToJoin = characters.find((c) => c.id === characterId);
    if (!charToJoin) return false;

    // Check if already in campaign
    const alreadyMember = targetCamp.members.some((m) => m.characterId === characterId);
    if (!alreadyMember) {
      const newMember = {
        id: `mem_${Date.now()}`,
        characterId: charToJoin.id,
        playerName: charToJoin.playerName,
        characterName: charToJoin.characterName,
        characterClass: charToJoin.classAndLevel,
        characterLevel: charToJoin.level,
        currentHp: charToJoin.currentHp,
        maxHp: charToJoin.maxHp,
        armorClass: charToJoin.armorClass,
        passivePerception: charToJoin.passivePerception,
        role: 'player' as const,
        joinedAt: new Date().toISOString(),
      };

      const updatedCamp: Campaign = {
        ...targetCamp,
        members: [...targetCamp.members, newMember],
      };

      const nextCampList = campaigns.map((c) => (c.id === updatedCamp.id ? updatedCamp : c));
      setCampaigns(nextCampList);
      saveCampaigns(nextCampList);
    }

    // Link character to campaign
    const updatedChar = { ...charToJoin, campaignId: targetCamp.id };
    handleUpdateCharacter(updatedChar);
    setActiveCampIdState(targetCamp.id);
    setActiveCampaignId(targetCamp.id);
    return true;
  };

  // Sessions Management
  const handleAddSessionLog = (newLog: SessionLog) => {
    const currentCamp = campaigns.find((c) => c.id === activeCampId);
    if (!currentCamp) return;

    const updatedCamp: Campaign = {
      ...currentCamp,
      sessionLogs: [newLog, ...(currentCamp.sessionLogs || [])],
    };

    const nextCampList = campaigns.map((c) => (c.id === updatedCamp.id ? updatedCamp : c));
    setCampaigns(nextCampList);
    saveCampaigns(nextCampList);
  };

  const handleAddEventToSession = (sessionId: string, newEvent: SessionEvent) => {
    const currentCamp = campaigns.find((c) => c.id === activeCampId);
    if (!currentCamp) return;

    const updatedLogs = (currentCamp.sessionLogs || []).map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          events: [...s.events, newEvent],
        };
      }
      return s;
    });

    const updatedCamp = { ...currentCamp, sessionLogs: updatedLogs };
    const nextCampList = campaigns.map((c) => (c.id === updatedCamp.id ? updatedCamp : c));
    setCampaigns(nextCampList);
    saveCampaigns(nextCampList);
  };

  // Homebrews Management
  const handleAddHomebrew = (hb: HomebrewItem) => {
    const nextList = [hb, ...homebrews];
    setHomebrews(nextList);
    saveHomebrews(nextList);
  };

  const handleDeleteHomebrew = (id: string) => {
    const nextList = homebrews.filter((h) => h.id !== id);
    setHomebrews(nextList);
    saveHomebrews(nextList);
  };

  // Dice Roller
  const handleAddDiceRoll = (roll: DiceRollResult) => {
    const nextHistory = [roll, ...diceHistory.slice(0, 30)];
    setDiceHistory(nextHistory);
    saveDiceHistory(nextHistory);
  };

  const handleQuickRoll = (expression: string, label: string) => {
    const activeChar = characters.find((c) => c.id === activeCharId);
    const roller = activeChar ? activeChar.characterName : userName;
    const res = rollDice(expression, roller, label);
    handleAddDiceRoll(res);
    // Accumulate up to 3 results; 4th roll automatically drops the oldest (slice(0, 2))
    setRollToasts((prev) => [res, ...prev.slice(0, 2)]);
  };

  const handleDismissToast = (id: string) => {
    setRollToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleQuickUpdateHp = (characterId: string, newHp: number) => {
    const target = characters.find((c) => c.id === characterId);
    if (target) {
      handleUpdateCharacter({ ...target, currentHp: newHp });
    }
  };

  // Google Drive Import
  const handleImportSheet = (sheet: CharacterSheet) => {
    const exists = characters.some((c) => c.id === sheet.id);
    let nextList: CharacterSheet[];
    if (exists) {
      nextList = characters.map((c) => (c.id === sheet.id ? sheet : c));
    } else {
      nextList = [sheet, ...characters];
    }
    setCharacters(nextList);
    saveCharacters(nextList);
    setActiveCharIdState(sheet.id);
    setCurrentView('character_sheet');
  };

  const handleImportBackup = (bundle: { characters: CharacterSheet[]; campaigns: Campaign[] }) => {
    if (bundle.characters && bundle.characters.length > 0) {
      setCharacters(bundle.characters);
      saveCharacters(bundle.characters);
      setActiveCharIdState(bundle.characters[0].id);
    }
    if (bundle.campaigns && bundle.campaigns.length > 0) {
      setCampaigns(bundle.campaigns);
      saveCampaigns(bundle.campaigns);
      setActiveCampIdState(bundle.campaigns[0].id);
    }
  };

  const handleNavigate = (view: MainView) => {
    if (view === 'campaigns') {
      setActiveCampIdState('');
      setActiveCampaignId('');
    }
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const activeChar = characters.find((c) => c.id === activeCharId) || characters[0];
  const activeCamp = activeCampId ? (campaigns.find((c) => c.id === activeCampId) || null) : null;
  const dmCampaignsCount = campaigns.filter((c) => c.dmUserId === currentUserId).length;
  const isDmOfActiveCampaign = Boolean(activeCamp && activeCamp.dmUserId && activeCamp.dmUserId === currentUserId);

  return (
    <div className="min-h-screen bg-transparent text-[#f4ecd8] flex flex-col font-serif selection:bg-[#c49d48]/40 selection:text-white">
      {/* Archdice Authentic Top Header Navigation Bar */}
      <header className="bg-[#1a120b]/92 backdrop-blur-md border-b border-[#3d2a1b] sticky top-0 z-40 select-none shadow-2xl">
        <div className="w-full px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c49d48] to-[#6e4e1a] flex items-center justify-center text-[#140d07] shadow-lg shadow-[#140d07]/60 font-black text-xs border border-[#e8c679]/60 font-serif tracking-wider">
              ARCH
            </div>
            <div className="hidden sm:block">
              <div className="font-serif font-black text-[#f7eedc] text-base tracking-wide flex items-center gap-1.5">
                <span>ARCHDICE</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-[#2a1d13] text-[#d4af37] border border-[#8c6b32]/60 rounded">
                  D&amp;D 5E
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-4 sm:gap-8 h-full">
            <button
              onClick={() => handleNavigate('characters_list')}
              className={`h-full flex items-center px-1 font-serif text-sm sm:text-base font-bold transition relative ${
                currentView === 'characters_list' || currentView === 'character_sheet'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Personagens</span>
              {characters.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-[#201811] text-[#d4af37] border border-[#423120]">
                  {characters.length}
                </span>
              )}
              {(currentView === 'characters_list' || currentView === 'character_sheet') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] shadow-[0_0_8px_#c49d48]" />
              )}
            </button>

            <button
              onClick={() => handleNavigate('campaigns')}
              className={`h-full flex items-center px-1 font-serif text-sm sm:text-base font-bold transition relative ${
                currentView === 'campaigns'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Campanhas</span>
              {campaigns.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-[#201811] text-[#d4af37] border border-[#423120]">
                  {campaigns.length}
                </span>
              )}
              {currentView === 'campaigns' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] shadow-[0_0_8px_#c49d48]" />
              )}
            </button>

            <button
              onClick={() => handleNavigate('homebrew')}
              className={`h-full flex items-center px-1 font-serif text-sm sm:text-base font-bold transition relative ${
                currentView === 'homebrew'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Homebrew</span>
              {homebrews.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-[#201811] text-[#d4af37] border border-[#423120]">
                  {homebrews.length}
                </span>
              )}
              {currentView === 'homebrew' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] shadow-[0_0_8px_#c49d48]" />
              )}
            </button>

            <button
              onClick={() => handleNavigate('drive')}
              className={`h-full flex items-center px-1 font-serif text-sm sm:text-base font-bold transition relative ${
                currentView === 'drive'
                  ? 'text-[#f5ebd7]'
                  : 'text-[#8c7b67] hover:text-[#c4b199]'
              }`}
            >
              <span>Google Drive</span>
              {currentView === 'drive' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c49d48] shadow-[0_0_8px_#c49d48]" />
              )}
            </button>
          </nav>

          {/* Right Controls: User Profile Badge, Dice Roller */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDiceModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#201811] hover:bg-[#2c2117] text-[#d4af37] border border-[#422e1c] transition text-xs font-serif font-bold flex items-center gap-1.5 shadow"
              title="Rolar Dados (d20)"
            >
              <Dices className="w-4 h-4 text-[#d4af37]" />
              <span className="hidden md:inline">Rolar Dados</span>
            </button>

            {/* Profile Info */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#18130e] border border-[#382b1d] text-xs">
              <span className="text-[#eedbc5] font-serif font-bold truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-amber-400 font-serif">
                {dmCampaignsCount > 0 ? `👑 Mestre (${dmCampaignsCount})` : '🛡️ Jogador'}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Archdice Gold Accent Underline Bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-700 via-[#c49d48] via-[#f5d77f] via-[#c49d48] to-amber-800 opacity-90 shadow-[0_0_8px_rgba(196,157,72,0.4)]" />
      </header>

      {/* Main Content Area */}
      <main className="w-full min-h-screen px-4 sm:px-8 py-6 flex-1 overflow-y-auto">
        {/* VIEW 1: Characters Grid List */}
        {currentView === 'characters_list' && (
          <CharacterListView
            characters={characters}
            onSelectCharacter={handleSelectCharacter}
            onCreateNewCharacter={handleCreateNewCharacter}
            onDeleteCharacter={handleDeleteCharacter}
          />
        )}

        {/* VIEW 2: Character Sheet View */}
        {currentView === 'character_sheet' && (
          activeChar ? (
            <CharacterSheetView
              character={activeChar}
              onUpdateCharacter={handleUpdateCharacter}
              allCharacters={characters}
              onSelectCharacterId={(id) => {
                setActiveCharIdState(id);
                setActiveCharacterId(id);
              }}
              onCreateNewCharacter={handleCreateNewCharacter}
              onBackToList={() => setCurrentView('characters_list')}
              userRole={isDmOfActiveCampaign ? 'dm' : 'player'}
              onQuickRoll={handleQuickRoll}
              onOpenDriveModal={() => setIsDriveModalOpen(true)}
            />
          ) : (
            <div className="py-20 text-center bg-[#18130e] rounded-2xl border border-[#382b1d] p-8 space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#f7eedc]">Nenhum personagem selecionado</h3>
              <button
                onClick={handleCreateNewCharacter}
                className="px-5 py-2.5 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-sm rounded-lg shadow-md transition"
              >
                + Criar Personagem
              </button>
            </div>
          )
        )}

        {/* VIEW 3: Campaigns Grid & Details */}
        {currentView === 'campaigns' && (
          <CampaignManager
            campaigns={campaigns}
            activeCampaign={activeCamp}
            onSelectCampaign={(c) => {
              if (c) {
                setActiveCampIdState(c.id);
                setActiveCampaignId(c.id);
              } else {
                setActiveCampIdState('');
                setActiveCampaignId('');
              }
            }}
            onCreateCampaign={handleCreateCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onJoinCampaign={handleJoinCampaign}
            onRemoveMemberFromCampaign={handleRemoveMemberFromCampaign}
            characters={characters}
            currentUserId={currentUserId}
            userName={userName}
            onViewCharacterSheet={(charId) => {
              setActiveCharIdState(charId);
              setCurrentView('character_sheet');
            }}
            onQuickUpdateHp={handleQuickUpdateHp}
            onAddSessionLog={handleAddSessionLog}
            onAddEventToSession={handleAddEventToSession}
          />
        )}

        {/* VIEW 4: Homebrew Manager */}
        {currentView === 'homebrew' && (
          <HomebrewManager
            homebrews={homebrews}
            onAddHomebrew={handleAddHomebrew}
            onDeleteHomebrew={handleDeleteHomebrew}
            activeCharacter={activeChar}
            onApplyToCharacter={(hb) => {
              if (activeChar) {
                handleUpdateCharacter({
                  ...activeChar,
                  homebrews: [...(activeChar.homebrews || []), hb],
                });
              }
            }}
            userName={userName}
          />
        )}

        {/* VIEW 6: Google Drive */}
        {currentView === 'drive' && (
          <div className="space-y-4">
            <div className="bg-[#12131c] p-6 rounded-2xl border border-[#212330] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-white text-xl">
                  Google Drive &amp; Nuvem
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Busque arquivos na sua pasta "biblioteca rpg -&gt; dungeons and dragons", salve ou faça backup na nuvem
                </p>
              </div>
              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-lg shadow-md"
              >
                Abrir Explorador do Drive
              </button>
            </div>

            <GoogleDriveModal
              isOpen={true}
              onClose={() => setCurrentView('characters_list')}
              activeCharacter={activeChar || createBlankCharacter()}
              allCharacters={characters}
              campaigns={campaigns}
              onImportCharacter={handleImportSheet}
              onImportCampaignBackup={handleImportBackup}
              isDriveConnected={isDriveConnected}
              setIsDriveConnected={setIsDriveConnected}
              userEmail={userEmail}
            />
          </div>
        )}
      </main>

      {/* Floating Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isDiceModalOpen}
        onClose={() => setIsDiceModalOpen(false)}
        rollerName={activeChar?.characterName || userName}
        history={diceHistory}
        onAddRoll={handleAddDiceRoll}
        onClearHistory={() => {
          setDiceHistory([]);
          saveDiceHistory([]);
        }}
      />

      {/* Archdice Style Floating Dice Roll Toast Stack (Fixed bottom-right, max 3) */}
      <DiceRollResultManager
        toasts={rollToasts}
        onDismissToast={handleDismissToast}
      />

      {/* Drive Modal if opened from another view */}
      {isDriveModalOpen && currentView !== 'drive' && (
        <GoogleDriveModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          activeCharacter={activeChar || createBlankCharacter()}
          allCharacters={characters}
          campaigns={campaigns}
          onImportCharacter={handleImportSheet}
          onImportCampaignBackup={handleImportBackup}
          isDriveConnected={isDriveConnected}
          setIsDriveConnected={setIsDriveConnected}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}
