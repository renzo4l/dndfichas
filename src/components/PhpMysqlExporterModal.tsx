import React, { useState } from 'react';
import {
  X,
  Database,
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  FileCode,
} from 'lucide-react';
import { generateMySQLDump, getPhpBackendFiles } from '../services/sqlExporter';
import { CharacterSheet, Campaign, HomebrewItem } from '../types/dnd';

interface PhpMysqlExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterSheet[];
  campaigns: Campaign[];
  homebrews: HomebrewItem[];
}

export const PhpMysqlExporterModal: React.FC<PhpMysqlExporterModalProps> = ({
  isOpen,
  onClose,
  characters,
  campaigns,
  homebrews,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'php'>('sql');
  const [selectedPhpFile, setSelectedPhpFile] = useState('config.php');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlDump = generateMySQLDump(characters, campaigns, homebrews);
  const phpFiles = getPhpBackendFiles();
  const currentPhp = phpFiles.find((f) => f.name === selectedPhpFile) || phpFiles[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlDump], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnd5e_mysql_database_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPhpFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('/', '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#171924] border border-amber-900/60 rounded-xl shadow-2xl max-w-4xl w-full p-5 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-amber-200 text-lg">
                Exportador &amp; Arquitetura Backend PHP &amp; MySQL
              </h3>
              <p className="text-xs text-stone-400">
                Gere o banco relacional MySQL completo com tabelas, chaves e endpoints REST em PHP para suas fichas
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

        {/* Tab switch between SQL and PHP */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'sql'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Banco de Dados MySQL (database.sql)</span>
            </button>
            <button
              onClick={() => setActiveTab('php')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'php'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Endpoints &amp; API PHP</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeTab === 'sql' ? sqlDump : currentPhp.content)}
              className="flex items-center gap-1 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg border border-stone-700 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            {activeTab === 'sql' ? (
              <button
                onClick={handleDownloadSql}
                className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg shadow-sm transition"
              >
                <Download className="w-3 h-3" />
                <span>Baixar database.sql</span>
              </button>
            ) : (
              <button
                onClick={() => handleDownloadPhpFile(currentPhp.name, currentPhp.content)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                <Download className="w-3 h-3" />
                <span>Baixar {currentPhp.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-stone-900/60 p-3 rounded-lg border border-stone-800 text-xs text-stone-300 flex items-start gap-2.5">
          <Server className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              <strong>Estrutura Pronta para Produção:</strong> O script abaixo cria o banco relacional <code className="text-amber-300">dnd5e_rpg</code> com tabelas indexadas para personagens, campanhas com código único de 8 dígitos, logs de sessões e homebrews.
            </p>
            <p className="text-[11px] text-stone-400">
              Pode ser importado diretamente no phpMyAdmin, MySQL Workbench, XAMPP, Docker ou servidores Linux via comando: <code className="text-stone-300 font-mono">mysql -u root -p &lt; database.sql</code>.
            </p>
          </div>
        </div>

        {/* Code Content Viewer */}
        {activeTab === 'sql' ? (
          <div className="flex-1 overflow-hidden flex flex-col bg-stone-950 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border-b border-stone-800 text-[11px] text-stone-400">
              <span className="font-mono">database.sql (MySQL 5.7+ / 8.0+)</span>
              <span>{sqlDump.split('\n').length} linhas geradas</span>
            </div>
            <pre className="flex-1 p-4 overflow-y-auto text-xs font-mono text-amber-200/90 leading-relaxed select-all">
              {sqlDump}
            </pre>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col bg-stone-950 rounded-xl border border-stone-800">
            {/* PHP File Selector Bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-900 border-b border-stone-800 overflow-x-auto">
              {phpFiles.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedPhpFile(f.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition ${
                    selectedPhpFile === f.name
                      ? 'bg-stone-800 text-amber-300 border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <pre className="flex-1 p-4 overflow-y-auto text-xs font-mono text-stone-200 leading-relaxed select-all">
              {currentPhp.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
