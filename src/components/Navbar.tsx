import React from 'react';
import {
  Scroll,
  Users,
  BookOpen,
  Sparkles,
  Database,
  Cloud,
  Dices,
  Shield,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

export type TabType = 'sheet' | 'campaigns' | 'sessions' | 'homebrew' | 'mysql' | 'drive';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userRole: 'dm' | 'player';
  setUserRole: (role: 'dm' | 'player') => void;
  userName: string;
  setUserName: (name: string) => void;
  onOpenDiceRoller: () => void;
  isDriveConnected: boolean;
  onOpenDrive: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  userName,
  setUserName,
  onOpenDiceRoller,
  isDriveConnected,
  onOpenDrive,
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(userName);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'sheet', label: 'Ficha D&D 5e', icon: <Scroll className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Campanhas & Grupo', icon: <Users className="w-4 h-4" /> },
    { id: 'sessions', label: 'Diário de Sessões', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'homebrew', label: 'Homebrews', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'mysql', label: 'MySQL & PHP', icon: <Database className="w-4 h-4" /> },
    { id: 'drive', label: 'Google Drive', icon: <Cloud className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-[#12141c] border-b border-[#2d2922] sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-red-900 flex items-center justify-center shadow-lg border border-amber-500/30 text-amber-100 font-bold text-lg font-serif">
              <Dices className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wider text-amber-400 text-lg sm:text-xl">
                  GRIMÓRIO 5E
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-950/80 text-amber-400 border border-amber-800/60 px-1.5 py-0.5 rounded">
                  D&D 5ª Edição
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                Fichas Automáticas • Campanhas • Homebrew • Google Drive
              </p>
            </div>
          </div>

          {/* User Role Switcher & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Dice Roller Button */}
            <button
              onClick={onOpenDiceRoller}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 border border-stone-600/70 text-amber-300 hover:text-amber-200 transition font-medium text-xs sm:text-sm shadow-sm"
              title="Abrir rolador de dados rápido"
            >
              <Dices className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden md:inline">Rolar Dados</span>
            </button>

            {/* Google Drive Status Button */}
            <button
              onClick={onOpenDrive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs sm:text-sm font-medium border ${
                isDriveConnected
                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Cloud className={`w-4 h-4 ${isDriveConnected ? 'text-emerald-400' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">
                {isDriveConnected ? 'Google Drive Conectado' : 'Google Drive'}
              </span>
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs sm:text-sm font-medium transition ${
                  userRole === 'dm'
                    ? 'bg-amber-950/70 border-amber-600/60 text-amber-200 hover:bg-amber-900/60'
                    : 'bg-indigo-950/70 border-indigo-600/60 text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                {userRole === 'dm' ? (
                  <Shield className="w-4 h-4 text-amber-400" />
                ) : (
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                )}
                <span className="font-semibold">
                  {userRole === 'dm' ? 'Mestre' : 'Jogador'}: <span className="text-stone-300 font-normal">{userName}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* Role Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1a1c26] border border-stone-700 rounded-lg shadow-2xl p-3 z-50 text-stone-200">
                  <div className="mb-2 pb-2 border-b border-stone-800">
                    <span className="text-xs uppercase tracking-wider text-stone-400 font-bold block mb-1">
                      Identificação na Mesa
                    </span>
                    {isEditingName ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="w-full text-xs bg-stone-900 border border-stone-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => {
                            if (tempName.trim()) setUserName(tempName.trim());
                            setIsEditingName(false);
                          }}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded"
                        >
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-200">{userName}</span>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Editar nome
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-xs uppercase tracking-wider text-stone-400 font-bold block mb-2">
                    Alternar Papel
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setUserRole('dm');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between ${
                        userRole === 'dm'
                          ? 'bg-amber-900/40 text-amber-300 border border-amber-600/40 font-semibold'
                          : 'hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <div>
                          <div>Mestre da Campanha (DM)</div>
                          <div className="text-[10px] text-stone-400 font-normal">
                            Edita qualquer ficha, cria campanhas e gerencia o mundo
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setUserRole('player');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between ${
                        userRole === 'player'
                          ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-600/40 font-semibold'
                          : 'hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div>Jogador da Mesa</div>
                          <div className="text-[10px] text-stone-400 font-normal">
                            Edita sua própria ficha, entra em campanhas via código
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-stone-800/80 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
