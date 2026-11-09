import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { Spell } from '../../../types/dnd';

export interface CreateEditSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (spell: Spell) => void;
  editingSpell?: Spell | null;
}

const PRESET_SPELLS = [
  {
    name: 'Bola de Fogo',
    lvl: 3,
    sch: 'Evocação',
    time: '1 Ação',
    range: '45m',
    dmg: '8d6 [Fogo]',
    desc: 'Explosão flamejante em esfera de 6m. Teste de RES de Destreza para metade do dano.',
  },
  {
    name: 'Míssil Mágico',
    lvl: 1,
    sch: 'Evocação',
    time: '1 Ação',
    range: '36m',
    dmg: '3d4+3 [Energia]',
    desc: 'Cria 3 dardos infalíveis de energia arcana. Cada dardo causa 1d4+1.',
  },
  {
    name: 'Escudo Arcano',
    lvl: 1,
    sch: 'Abjuração',
    time: '1 Reação',
    range: 'Pessoal',
    dmg: '',
    desc: '+5 na CA e imunidade a Míssil Mágico até o início do seu próximo turno.',
  },
  {
    name: 'Curar Ferimentos',
    lvl: 1,
    sch: 'Evocação',
    time: '1 Ação',
    range: 'Toque',
    dmg: '1d8+3 [Cura]',
    desc: 'Uma criatura que você tocar recupera PV iguais a 1d8 + modificador de conjuração.',
  },
  {
    name: 'Raio de Fogo',
    lvl: 0,
    sch: 'Evocação',
    time: '1 Ação',
    range: '36m',
    dmg: '1d10 [Fogo]',
    desc: 'Lança um feixe flamejante com ataque à distância mágico. 1d10 dano de fogo.',
  },
  {
    name: 'Passo Nebuloso',
    lvl: 2,
    sch: 'Transmutação',
    time: '1 Ação Bônus',
    range: '9m',
    dmg: '',
    desc: 'Teleporta-se instantaneamente para um local não ocupado que você veja a até 9m.',
  },
];

const SPELL_SCHOOLS = [
  'Evocação',
  'Abjuração',
  'Necromancia',
  'Adivinhação',
  'Encantamento',
  'Ilusão',
  'Invocação',
  'Transmutação',
  'Outra',
];

export const CreateEditSpellModal: React.FC<CreateEditSpellModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSpell,
}) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(1);
  const [school, setSchool] = useState('Evocação');
  const [castingTime, setCastingTime] = useState('1 Ação');
  const [range, setRange] = useState('18m');
  const [components, setComponents] = useState('V, S');
  const [duration, setDuration] = useState('Instantâneo');
  const [description, setDescription] = useState('');
  const [prepared, setPrepared] = useState(true);
  const [damageFormula, setDamageFormula] = useState('');

  useEffect(() => {
    if (editingSpell) {
      setName(editingSpell.name || '');
      setLevel(editingSpell.level ?? 1);
      setSchool(editingSpell.school || 'Evocação');
      setCastingTime(editingSpell.castingTime || '1 Ação');
      setRange(editingSpell.range || '18m');
      setComponents(editingSpell.components || 'V, S');
      setDuration(editingSpell.duration || 'Instantâneo');
      setDescription(editingSpell.description || '');
      setPrepared(!!editingSpell.prepared);
      setDamageFormula(
        editingSpell.damageFormula || (editingSpell as any).damageFormula || ''
      );
    } else {
      setName('');
      setLevel(1);
      setSchool('Evocação');
      setCastingTime('1 Ação');
      setRange('18m');
      setComponents('V, S');
      setDuration('Instantâneo');
      setDescription('');
      setPrepared(true);
      setDamageFormula('');
    }
  }, [editingSpell, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spellToSave: Spell = {
      id:
        editingSpell?.id ||
        `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Nova Magia',
      level,
      school: school.trim() || 'Evocação',
      castingTime: castingTime.trim() || '1 Ação',
      range: range.trim() || 'Pessoal',
      components: components.trim() || 'V, S',
      duration: duration.trim() || 'Instantâneo',
      description: description.trim() || '',
      prepared,
      ...(damageFormula.trim() ? { damageFormula: damageFormula.trim() } : {}),
    };
    onSave(spellToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho do Modal no Estilo Grimório Arcaico */}
        <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
          <div>
            <h3 className="font-sans font-black text-xl text-[#f4ecd8] tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>
                {editingSpell
                  ? 'Editar Magia do Grimório'
                  : 'Nova Magia no Grimório'}
              </span>
            </h3>
            <p className="text-[11px] text-[#a89073] font-sans mt-0.5">
              Insira os detalhes arcanos, nível (Truque a 9º Nível), escola, ritual e descrição.
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

        {/* Presets Rápidos de Magias Famosas */}
        <div className="space-y-1">
          <span className="text-[10px] font-sans uppercase font-bold text-[#8c7457] block">
            Presenciais Rápidos do D&amp;D 5e:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PRESET_SPELLS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setName(preset.name);
                  setLevel(preset.lvl);
                  setSchool(preset.sch);
                  setCastingTime(preset.time);
                  setRange(preset.range);
                  setDamageFormula(preset.dmg);
                  setDescription(preset.desc);
                }}
                className="px-2 py-0.5 rounded bg-[#1e150e] hover:bg-[#332014] text-[10px] font-mono text-[#c49d48] border border-[#54412c] transition cursor-pointer flex-shrink-0"
              >
                {preset.name} ({preset.lvl === 0 ? 'Truque' : `${preset.lvl}º Nível`})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo 1: Nome da Magia */}
          <div className="space-y-1">
            <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
              Nome da Magia<span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Bola de Fogo, Escudo Arcano, Raio de Fogo"
              className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
              required
            />
          </div>

          {/* Linha 2: Nível (0 a 9) & Escola de Magia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Nível da Magia<span className="text-amber-400">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-sans text-amber-200 focus:outline-none transition cursor-pointer"
              >
                <option value={0}>Truque (Cantrip - Nível 0)</option>
                <option value={1}>1º Nível</option>
                <option value={2}>2º Nível</option>
                <option value={3}>3º Nível</option>
                <option value={4}>4º Nível</option>
                <option value={5}>5º Nível</option>
                <option value={6}>6º Nível</option>
                <option value={7}>7º Nível</option>
                <option value={8}>8º Nível</option>
                <option value={9}>9º Nível</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Escola de Magia
              </label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-sans text-[#f4ecd8] focus:outline-none transition cursor-pointer"
              >
                {SPELL_SCHOOLS.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 3: Tempo de Conjuração | Alcance | Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Tempo
              </label>
              <input
                type="text"
                value={castingTime}
                onChange={(e) => setCastingTime(e.target.value)}
                placeholder="1 Ação, 1 Reação..."
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Alcance
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Pessoal, Toque, 18m..."
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Duração
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Instantâneo, 1 min..."
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 4: Componentes | Fórmula de Dano/Cura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Componentes
              </label>
              <input
                type="text"
                value={components}
                onChange={(e) => setComponents(e.target.value)}
                placeholder="V, S ou V, S, M (materiais)"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Fórmula Rolável (Opcional)
              </label>
              <input
                type="text"
                value={damageFormula}
                onChange={(e) => setDamageFormula(e.target.value)}
                placeholder="ex: 8d6 [Fogo], 1d8+3 [Cura]"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs font-mono text-amber-200 placeholder-[#6e5840] focus:outline-none"
              />
            </div>
          </div>

          {/* Checkbox Magia Preparada */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="spellPreparedCheckbox"
              checked={prepared}
              onChange={(e) => setPrepared(e.target.checked)}
              className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c] cursor-pointer"
            />
            <label
              htmlFor="spellPreparedCheckbox"
              className="text-xs text-[#eedbc5] font-sans cursor-pointer select-none"
            >
              Magia está <strong>Preparada / Memorizada</strong> no momento
            </label>
          </div>

          {/* Campo Descrição Detalhada da Magia / Ritual */}
          <div className="space-y-1">
            <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
              Descrição Detalhada &amp; Efeitos Arcanos / Mecânica do Ritual<span className="text-amber-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Escreva a descrição completa da magia/ritual, dano, testes de salvaguarda, efeitos em níveis superiores, componentes especiais..."
              className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition leading-relaxed min-h-[120px]"
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
              <span>{editingSpell ? 'Atualizar Magia' : 'Salvar no Grimório'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
