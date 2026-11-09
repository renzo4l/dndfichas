import React, { useState, useEffect } from 'react';
import { X, Check, Dices, Star, Plus, Minus } from 'lucide-react';
import { SavedRollShortcut } from '../../../types/dnd';

export interface EditRollShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shortcut: SavedRollShortcut, rollImmediately?: boolean) => void;
  editingShortcut?: SavedRollShortcut | null;
}

export const EditRollShortcutModal: React.FC<EditRollShortcutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingShortcut,
}) => {
  const [shortcutName, setShortcutName] = useState('Nova Rolagem');
  const [shortcutFormula, setShortcutFormula] = useState('1d20+5');
  const [advantageCount, setAdvantageCount] = useState(0);
  const [disadvantageCount, setDisadvantageCount] = useState(0);
  const [shortcutNotes, setShortcutNotes] = useState('');

  useEffect(() => {
    if (editingShortcut) {
      setShortcutName(editingShortcut.label || 'Rolagem Salva');
      setShortcutFormula(editingShortcut.expression || '1d20');
      setAdvantageCount(editingShortcut.advantageCount || 0);
      setDisadvantageCount(editingShortcut.disadvantageCount || 0);
      setShortcutNotes(editingShortcut.notes || '');
    } else {
      setShortcutName('Nova Rolagem');
      setShortcutFormula('1d20+5');
      setAdvantageCount(0);
      setDisadvantageCount(0);
      setShortcutNotes('');
    }
  }, [editingShortcut, isOpen]);

  if (!isOpen) return null;

  const handleSave = (rollImmediately: boolean = false) => {
    const advType =
      advantageCount > 0
        ? 'advantage'
        : disadvantageCount > 0
        ? 'disadvantage'
        : 'normal';

    const newShortcut: SavedRollShortcut = {
      id:
        editingShortcut?.id ||
        `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: shortcutName.trim() || 'Rolagem Salva',
      expression: shortcutFormula.trim() || '1d20',
      advantageType: advType,
      advantageCount,
      disadvantageCount,
      notes: shortcutNotes.trim() || undefined,
    };

    onSave(newShortcut, rollImmediately);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
          <div>
            <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
              <Star className="w-5 h-5 text-[#e8c679] fill-[#e8c679]" />
              <span>
                {editingShortcut ? 'Editar Rolagem Salva' : 'Salvar Nova Rolagem'}
              </span>
            </h3>
            <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
              Crie um atalho rápido para rolagens frequentes (perícias, curas, salvaguardas).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c7457] hover:text-[#f4ecd8] hover:bg-[#251910] transition cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campo 1: Nome da Rolagem */}
        <div className="space-y-1">
          <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
            Nome da Rolagem / Etiqueta<span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={shortcutName}
            onChange={(e) => setShortcutName(e.target.value)}
            placeholder="ex: Cura da Poção, Teste de Percepção, Iniciativa"
            className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
          />
        </div>

        {/* Campo 2: Fórmula de Dados */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
              Fórmula de Dados<span className="text-amber-400">*</span>
            </label>
            <span className="text-[10px] text-[#8c7457] font-mono">
              ex: 1d20+5, 2d8+3, 8d6
            </span>
          </div>
          <input
            type="text"
            value={shortcutFormula}
            onChange={(e) => setShortcutFormula(e.target.value)}
            placeholder="ex: 1d20+5 ou 2d8+3"
            className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm font-mono text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
          />

          {/* Presets Rápidos */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            <span className="text-[9px] text-[#8c7457] font-sans uppercase flex-shrink-0">
              Presets:
            </span>
            {['1d20+5', '1d20+2', '2d6+3', '1d8+3', '1d4+1', '8d6'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setShortcutFormula(preset)}
                className="px-1.5 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono font-bold text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Flags de Vantagem e Desvantagem: Coluna Única Flex */}
        <div className="space-y-2 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
          <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
            Modo de Vantagem / Desvantagem (Opcional)
          </label>

          <div className="flex flex-col gap-2">
            {/* Stepper de Vantagem */}
            <div className="flex items-center justify-between bg-[#141210] border border-emerald-900/60 rounded-lg p-2">
              <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1">
                ★ Vantagem:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAdvantageCount((prev) => Math.max(0, prev - 1))}
                  className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-mono font-bold text-sm text-emerald-200">
                  +{advantageCount}d
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdvantageCount((prev) => prev + 1);
                    setDisadvantageCount(0);
                  }}
                  className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stepper de Desvantagem */}
            <div className="flex items-center justify-between bg-[#141210] border border-red-900/60 rounded-lg p-2">
              <span className="text-xs font-serif font-bold text-red-300 flex items-center gap-1">
                ⚠️ Desvantagem:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setDisadvantageCount((prev) => Math.max(0, prev - 1))
                  }
                  className="w-7 h-7 rounded bg-[#251910] hover:bg-red-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-mono font-bold text-sm text-red-200">
                  +{disadvantageCount}d
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDisadvantageCount((prev) => prev + 1);
                    setAdvantageCount(0);
                  }}
                  className="w-7 h-7 rounded bg-[#251910] hover:bg-red-900/40 text-red-300 border border-red-700/60 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Campo 3: Observação */}
        <div className="space-y-1">
          <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
            Notas / Observação (Opcional)
          </label>
          <input
            type="text"
            value={shortcutNotes}
            onChange={(e) => setShortcutNotes(e.target.value)}
            placeholder="ex: Poção de Cura, Bônus da Armadura"
            className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
          />
        </div>

        {/* Rodapé: Botões de Ação */}
        <div className="flex items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-3 py-2 bg-[#251910] hover:bg-[#382619] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/80 text-xs font-sans font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <Dices className="w-4 h-4 text-[#e8c679]" />
              <span>Salvar &amp; Rolar</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {editingShortcut ? 'Atualizar Atalho' : 'Salvar Atalho'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
