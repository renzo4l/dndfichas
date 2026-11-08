import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Search,
  Download,
  Upload,
  Check,
  Folder,
  FileText,
  AlertTriangle,
  RotateCw,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import {
  searchDriveFiles,
  findRpgFoldersAndFiles,
  downloadDriveFile,
  saveFileToDrive,
  DriveFileItem,
} from '../services/googleDrive';
import {
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/firebaseAuth';
import { CharacterSheet, Campaign } from '../types/dnd';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: CharacterSheet;
  allCharacters: CharacterSheet[];
  campaigns: Campaign[];
  onImportCharacter: (sheet: CharacterSheet) => void;
  onImportCampaignBackup?: (data: { characters: CharacterSheet[]; campaigns: Campaign[] }) => void;
  isDriveConnected: boolean;
  setIsDriveConnected: (connected: boolean) => void;
  userEmail?: string;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  allCharacters,
  campaigns,
  onImportCharacter,
  onImportCampaignBackup,
  isDriveConnected,
  setIsDriveConnected,
  userEmail,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('dungeons and dragons');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [uploadFileName, setUploadFileName] = useState(
    `ficha_${activeCharacter.characterName.toLowerCase().replace(/\s+/g, '_')}_dnd5e.json`
  );

  useEffect(() => {
    if (isOpen && isDriveConnected) {
      handleSearchRpgFiles();
    }
  }, [isOpen, isDriveConnected]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsDriveConnected(true);
        setSuccessMsg('Conectado ao Google Drive com sucesso!');
        await handleSearchRpgFiles();
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar com o Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsDriveConnected(false);
    setDriveFiles([]);
    setSuccessMsg('Desconectado do Google Drive.');
  };

  const handleSearch = async (customQuery?: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const query = customQuery !== undefined ? customQuery : searchQuery;
      const files = await searchDriveFiles(query);
      setDriveFiles(files);
      if (files.length === 0) {
        setError(`Nenhum arquivo encontrado para a busca: "${query}".`);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao consultar Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRpgFiles = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const files = await findRpgFoldersAndFiles();
      setDriveFiles(files);
      if (files.length === 0) {
        setError('Nenhum arquivo ou pasta de RPG localizado diretamente. Use o campo de busca abaixo para pesquisar nomes específicos.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar arquivos no Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async (file: DriveFileItem) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const content = await downloadDriveFile(file.id);
      try {
        const parsed = JSON.parse(content);
        if (parsed.characterName && parsed.abilities) {
          onImportCharacter(parsed as CharacterSheet);
          setSuccessMsg(`Ficha de "${parsed.characterName}" importada do Google Drive com sucesso!`);
        } else if (parsed.characters && parsed.campaigns && onImportCampaignBackup) {
          onImportCampaignBackup(parsed);
          setSuccessMsg('Backup de campanhas e personagens restaurado com sucesso!');
        } else {
          setError('O arquivo selecionado não possui o formato de ficha ou backup do sistema.');
        }
      } catch {
        setError(`O arquivo "${file.name}" não é um JSON válido. Certifique-se de selecionar uma ficha D&D salva no formato JSON.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao baixar arquivo do Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentSheet = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const content = JSON.stringify(activeCharacter, null, 2);
      const res = await saveFileToDrive(uploadFileName, content);
      setSuccessMsg(`Ficha salva no seu Google Drive como "${res.name}"!`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar ficha no Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFullBackup = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const bundle = {
        exportedAt: new Date().toISOString(),
        campaigns,
        characters: allCharacters,
      };
      const name = `dnd5e_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
      const res = await saveFileToDrive(name, JSON.stringify(bundle, null, 2));
      setSuccessMsg(`Backup completo salvo no Google Drive como "${res.name}"!`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar backup completo no Drive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#171924] border border-amber-900/60 rounded-xl shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/60">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-amber-200 text-lg">
                Integração com Google Drive
              </h3>
              <p className="text-xs text-stone-400">
                Sincronize, salve e importe fichas da sua pasta "biblioteca rpg -&gt; dungeons and dragons"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Not Connected State */}
        {!isDriveConnected ? (
          <div className="py-8 text-center space-y-4 bg-stone-900/40 rounded-xl border border-stone-800 p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 flex items-center justify-center mx-auto">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-stone-200 text-base">
                Conectar ao Google Drive
              </h4>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Conecte sua conta Google para salvar suas fichas de D&amp;D 5e na nuvem e importar arquivos das suas pastas de RPG (como <em>biblioteca rpg -&gt; dungeons and dragons</em>).
              </p>
            </div>

            {/* Official Google Sign-In Button as required by skill */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs sm:text-sm rounded-lg shadow-md transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{loading ? 'Conectando...' : 'Entrar com o Google'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-5">
            {/* Account Info Bar */}
            <div className="flex items-center justify-between bg-stone-900/60 p-3 rounded-lg border border-stone-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-stone-300">
                  Google Drive Conectado {userEmail ? `(${userEmail})` : ''}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-stone-500 hover:text-red-400 text-xs transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Desconectar
              </button>
            </div>

            {/* Quick Upload / Backup Section */}
            <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Salvar Ficha Atual no Google Drive
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSaveCurrentSheet}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                >
                  Salvar Ficha no Drive
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveFullBackup}
                  disabled={loading}
                  className="text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Salvar Backup Completo (Todas as Fichas &amp; Campanhas)
                </button>
              </div>
            </div>

            {/* Drive Explorer & Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  Explorador de Arquivos no Drive
                </span>

                {/* Quick Shortcuts */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      setSearchQuery('biblioteca rpg');
                      handleSearch('biblioteca rpg');
                    }}
                    className="text-amber-400 hover:underline"
                  >
                    "biblioteca rpg"
                  </button>
                  <span className="text-stone-600">•</span>
                  <button
                    onClick={() => {
                      setSearchQuery('dungeons and dragons');
                      handleSearch('dungeons and dragons');
                    }}
                    className="text-amber-400 hover:underline"
                  >
                    "dungeons and dragons"
                  </button>
                </div>
              </div>

              {/* Search Form */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar pasta ou nome de arquivo no Drive..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg border border-stone-700 transition"
                >
                  Buscar
                </button>
                <button
                  onClick={handleSearchRpgFiles}
                  disabled={loading}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-700 transition"
                  title="Atualizar lista"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Files List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-800/60 bg-stone-950/80 p-2 rounded-lg border border-stone-800">
                {driveFiles.length === 0 ? (
                  <p className="text-xs text-stone-500 italic text-center py-6">
                    Nenhum arquivo listado. Busque pela pasta "biblioteca rpg" ou digite o nome do arquivo.
                  </p>
                ) : (
                  driveFiles.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isJson = file.name.endsWith('.json') || file.mimeType === 'application/json';

                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-2 px-2 hover:bg-stone-900/60 rounded text-xs transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isFolder ? (
                            <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-medium text-stone-200 block truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {isFolder ? 'Pasta do Drive' : file.mimeType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isFolder ? (
                            <button
                              onClick={() => {
                                setSearchQuery(`'${file.id}' in parents`);
                                handleSearch(`'${file.id}' in parents`);
                              }}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px]"
                            >
                              Abrir Pasta
                            </button>
                          ) : (
                            <button
                              onClick={() => handleImportFile(file)}
                              disabled={loading}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded text-[11px] font-semibold border border-amber-600/40"
                              title="Baixar e carregar na ficha"
                            >
                              <Download className="w-3 h-3" />
                              <span>Importar Ficha</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
