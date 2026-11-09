import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { CharacterFeature } from '../../../types/dnd';

export interface CreateEditFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feature: CharacterFeature) => void;
  editingFeature?: CharacterFeature | null;
}

const PRESET_FEATURES = [
  {
    name: 'Fúria',
    source: 'Bárbaro',
    cost: '2/Descanso Longo',
    description:
      'Em batalha, você luta com ferocidade primal. Você tem vantagem em testes de Força e salvaguardas de Força, bônus nas jogadas de dano corpo a corpo e resistência a dano concussão, cortante e perfurante.',
  },
  {
    name: 'Ataque Furtivo',
    source: 'Ladino',
    cost: '1x por Turno',
    description:
      'Você sabe como atacar sutilmente e explorar a distração de um adversário. Uma vez por turno, você pode causar dano extra a uma criatura que acertar com um ataque usando arma acurada ou à distância.',
  },
  {
    name: 'Inspiração de Bardo',
    source: 'Bardo',
    cost: 'Bônus de CAR/Descanso Longo',
    description:
      'Você pode inspirar outros através de palavras ou música. Com uma ação bônus, escolha uma criatura a até 18m. Ela ganha um dado de inspiração para adicionar a um teste de habilidade, jogada de ataque ou salvaguarda.',
  },
  {
    name: 'Cura pelas Mãos',
    source: 'Paladino',
    cost: 'Nível x 5 PV',
    description:
      'Seu toque abençoado pode curar ferimentos. Você possui uma reserva de poder de cura que se recupera após um descanso longo. Como uma ação, você pode tocar uma criatura e drenar poder da sua reserva para restaurar PV.',
  },
  {
    name: 'Retomar o Fôlego',
    source: 'Guerreiro',
    cost: '1/Descanso Curto',
    description:
      'Você possui uma reserva limitada de resistência que pode usar para se proteger de perigos. No seu turno, você pode usar uma ação bônus para recuperar PV iguais a 1d10 + seu nível de guerreiro.',
  },
];

export const CreateEditFeatureModal: React.FC<CreateEditFeatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFeature,
}) => {
  const [name, setName] = useState('');
  const [source, setSource] = useState('Classe');
  const [hasCost, setHasCost] = useState(false);
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingFeature) {
      setName(editingFeature.name || '');
      setSource(editingFeature.source || '');
      setHasCost(Boolean(editingFeature.cost));
      setCost(editingFeature.cost || '');
      setDescription(editingFeature.description || '');
    } else {
      setName('');
      setSource('Classe');
      setHasCost(false);
      setCost('');
      setDescription('');
    }
  }, [editingFeature, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const featureToSave: CharacterFeature = {
      id:
        editingFeature?.id ||
        `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Nova Habilidade',
      source: source.trim() || undefined,
      cost: hasCost && cost.trim() ? cost.trim() : undefined,
      description: description.trim() || '',
    };
    onSave(featureToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
          <div>
            <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>
                {editingFeature
                  ? 'Editar Habilidade / Traço'
                  : 'Nova Habilidade / Traço'}
              </span>
            </h3>
            <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
              Cadastre habilidades de classe, raça, talentos ou características únicas.
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

        {/* Presets Rápidos de Habilidades Clássicas */}
        <div className="space-y-1">
          <span className="text-[10px] font-sans uppercase font-bold text-[#8c7457] block">
            Exemplos Rápidos do D&amp;D 5e:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PRESET_FEATURES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setName(preset.name);
                  setSource(preset.source);
                  setHasCost(Boolean(preset.cost));
                  setCost(preset.cost);
                  setDescription(preset.description);
                }}
                className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
              >
                {preset.name} ({preset.source})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linha 1: Nome e Origem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nome da Habilidade / Traço<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Fúria, Ataque Furtivo, Visão no Escuro"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-xs text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Origem / Categoria
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="ex: Classe, Raça, Talento"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
              />
            </div>
          </div>

          {/* Linha 2: Checkbox Custo / Usos */}
          <div className="bg-[#1b1510] border border-[#54412c] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featureHasCostCheckbox"
                checked={hasCost}
                onChange={(e) => {
                  setHasCost(e.target.checked);
                  if (!e.target.checked) setCost('');
                }}
                className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c] cursor-pointer"
              />
              <label
                htmlFor="featureHasCostCheckbox"
                className="text-xs font-sans font-bold text-[#c49d48] cursor-pointer select-none"
              >
                Possui Custo ou Limite de Uso?
              </label>
            </div>

            {hasCost && (
              <div className="pt-2 border-t border-[#54412c]/40 space-y-1">
                <label className="text-[10px] font-sans uppercase font-bold text-[#a89073] block">
                  Custo / Recarga
                </label>
                <input
                  type="text"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="ex: 2 PE, 1/Descanso Curto, 3/Dia..."
                  className="w-full bg-[#140e09] border border-[#8c6b32]/60 focus:border-[#c49d48] rounded-lg p-2 text-xs font-mono font-bold text-amber-300 focus:outline-none transition"
                />
              </div>
            )}
          </div>

          {/* Campo Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
              Descrição &amp; Regras de Funcionamento<span className="text-amber-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descreva detalhadamente o efeito, gatilho, dados adicionais ou testes envolvidos..."
              className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition leading-relaxed min-h-[100px]"
              required
            />
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8c7457] hover:text-[#eedbc5] font-sans transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#c49d48] hover:bg-[#b08a34] text-[#140d07] font-sans font-black text-xs rounded-lg transition border border-[#e8c679]/40 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingFeature ? 'Atualizar Habilidade' : 'Salvar Habilidade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
