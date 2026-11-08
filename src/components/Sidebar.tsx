import React, { useState } from 'react';
import {
  Users,
  Scroll,
  BookOpen,
  Sparkles,
  Cloud,
  Dices,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Check,
} from 'lucide-react';

export type MainView = 'characters_list' | 'character_sheet' | 'campaigns' | 'homebrew' | 'drive';

interface SidebarProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  onOpenDiceRoller: () => void;
  isDriveConnected: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  characterCount: number;
  campaignCount: number;
  dmCampaignsCount: number;
  onQuickNewCharacter: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userName,
  onUpdateUserName,
  onOpenDiceRoller,
  isDriveConnected,
  collapsed,
  onToggleCollapse,
  characterCount,
  campaignCount,
  dmCampaignsCount,
  onQuickNewCharacter,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const navItems: { id: MainView; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'characters_list',
      label: 'Fichas / Personagens',
      icon: <Scroll className="w-5 h-5 flex-shrink-0" />,
      badge: characterCount,
    },
    {
      id: 'campaigns',
      label: 'Campanhas',
      icon: <Users className="w-5 h-5 flex-shrink-0" />,
      badge: campaignCount,
    },
    {
      id: 'homebrew',
      label: 'Homebrews',
      icon: <Sparkles className="w-5 h-5 flex-shrink-0" />,
    },
    {
      id: 'drive',
      label: 'Google Drive',
      icon: <Cloud className="w-5 h-5 flex-shrink-0" />,
    },
  ];

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <aside
      className={`bg-[#14100c] border-r border-[#2d2217] flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Brand & Title */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2d2217]">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c49d48] to-[#6e4e1a] flex items-center justify-center text-[#140d07] shadow-lg shadow-[#140d07]/60 font-black text-sm border border-[#e8c679]/60 font-serif">
                CRIS
              </div>
              <div>
                <div className="font-serif font-black text-[#f7eedc] text-base tracking-wide flex items-center gap-1.5">
                  <span>CRIS 5E</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-[#2a1d13] text-[#d4af37] border border-[#8c6b32]/60 rounded">
                    D&amp;D
                  </span>
                </div>
                <p className="text-[10px] text-[#9d8a74]">Sistema Arcaico &amp; Fichas</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="w-9 h-9 mx-auto rounded-lg bg-gradient-to-br from-[#c49d48] to-[#6e4e1a] flex items-center justify-center text-[#140d07] shadow-lg font-black text-xs border border-[#e8c679]/60 font-serif">
              CRIS
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-[#a3907a] hover:text-[#f7eedc] hover:bg-[#251b12] transition hidden sm:block"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Action: New Character Button */}
        {!collapsed && (
          <div className="p-3">
            <button
              onClick={onQuickNewCharacter}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-serif font-black text-xs shadow-lg shadow-[#140d07]/40 border border-[#e8c679]/60 transition transform active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Personagem</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'characters_list' && currentView === 'character_sheet');

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-[#2b2016] text-[#f7eedc] border border-[#5c4631] shadow-inner'
                    : 'text-[#a3907a] hover:text-[#f7eedc] hover:bg-[#201912]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator Glow Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#c49d48] rounded-r shadow-[0_0_8px_#c49d48]" />
                )}

                <div className={`${isActive ? 'text-[#d4af37]' : 'text-[#8c7b67]'}`}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <span className="flex-1 text-left truncate font-serif font-semibold">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#201811] text-[#d4af37] border border-[#423120]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Dice Roller, User Identity, Google Drive Status */}
      <div className="p-3 border-t border-[#2d2217] space-y-2">
        {/* Quick Dice Roller Button */}
        <button
          onClick={onOpenDiceRoller}
          className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg bg-[#1c1610] hover:bg-[#281f16] text-[#d4af37] border border-[#422e1c] transition text-xs font-semibold shadow-sm ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Rolador de Dados Rápido"
        >
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-[#d4af37]" />
            {!collapsed && <span className="font-serif">Rolar Dados</span>}
          </div>
          {!collapsed && <span className="text-[10px] text-[#8c7b67] font-mono">d20</span>}
        </button>

        {/* User Identity Box (Strictly no manual role override: DM is strictly earned by table creation!) */}
        <div
          className={`p-2 rounded-lg bg-[#1a140f] border border-[#382b1d] text-xs ${
            collapsed ? 'text-center' : ''
          }`}
        >
          {collapsed ? (
            <div title={`Perfil: ${userName}`} className="flex justify-center text-[#d4af37]">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c7b67]">
                  Seu Perfil
                </span>
                {!isEditingName ? (
                  <button
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(true);
                    }}
                    className="text-[10px] text-[#a3907a] hover:text-[#f7eedc] flex items-center gap-0.5"
                    title="Editar nome do jogador"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveName}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                    title="Salvar nome"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>

              {!isEditingName ? (
                <div className="font-serif font-bold text-[#f7eedc] truncate text-sm">
                  {userName}
                </div>
              ) : (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="w-full bg-[#110e0b] border border-[#523f2c] rounded px-1.5 py-0.5 text-xs text-[#eedbc5]"
                  autoFocus
                />
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-[#b39e85] pt-0.5">
                {dmCampaignsCount > 0 ? (
                  <span className="text-amber-400 font-semibold">
                    👑 Mestre ({dmCampaignsCount} mesa{dmCampaignsCount > 1 ? 's' : ''})
                  </span>
                ) : (
                  <span className="text-[#a3907a]">🛡️ Jogador</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drive Indicator */}
        {!collapsed && (
          <div className="flex items-center justify-between text-[10px] px-1 text-[#8c7b67]">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDriveConnected ? 'bg-emerald-500' : 'bg-stone-600'
                }`}
              />
              <span>{isDriveConnected ? 'Drive Conectado' : 'Drive Offline'}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
