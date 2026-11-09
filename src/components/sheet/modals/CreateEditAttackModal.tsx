import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Dices, Flame, Plus, Minus, Trash2 } from 'lucide-react';
import {
  WeaponAttack,
  ExtraDamageEntry,
  CharacterSheet,
  AbilityName,
} from '../../../types/dnd';
import {
  calculateAbilityModifier,
  formatModifier,
  ALL_DND_DAMAGE_TYPES,
  DEFAULT_5E_SKILLS,
} from '../../../utils/dndRules';

export interface CreateEditAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (attack: WeaponAttack, saveAsShortcut?: boolean) => void;
  editingAttack?: WeaponAttack | null;
  onQuickRoll?: (expression: string, label: string) => void;
  character: CharacterSheet;
  profBonus: number;
}

export const CreateEditAttackModal: React.FC<CreateEditAttackModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAttack,
  onQuickRoll,
  character,
  profBonus,
}) => {
  const [name, setName] = useState('Novo Ataque');
  const [damage, setDamage] = useState('1d4');
  const [critical, setCritical] = useState(20);
  const [multiplier, setMultiplier] = useState(2);
  const [attackBonus, setAttackBonus] = useState(0);
  const [damageType, setDamageType] = useState('Balístico');
  const [range, setRange] = useState('-');
  const [skill, setSkill] = useState('Luta');
  const [damageAbility, setDamageAbility] = useState('Força');
  const [fixedBonus, setFixedBonus] = useState(0);
  const [advantageCount, setAdvantageCount] = useState(0);
  const [disadvantageCount, setDisadvantageCount] = useState(0);
  const [extraDamages, setExtraDamages] = useState<ExtraDamageEntry[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [saveAsShortcut, setSaveAsShortcut] = useState(true);

  // Modificadores de Atributos do Personagem
  const strMod = calculateAbilityModifier(character.abilities.str?.score || 10);
  const dexMod = calculateAbilityModifier(character.abilities.dex?.score || 10);
  const conMod = calculateAbilityModifier(character.abilities.con?.score || 10);
  const intMod = calculateAbilityModifier(character.abilities.int?.score || 10);
  const wisMod = calculateAbilityModifier(character.abilities.wis?.score || 10);
  const chaMod = calculateAbilityModifier(character.abilities.cha?.score || 10);

  const getAttrModByName = (attrName: string): number => {
    switch (attrName.toLowerCase()) {
      case 'força':
      case 'for':
        return strMod;
      case 'destreza':
      case 'des':
        return dexMod;
      case 'constituição':
      case 'con':
        return conMod;
      case 'inteligência':
      case 'int':
        return intMod;
      case 'sabedoria':
      case 'sab':
        return wisMod;
      case 'carisma':
      case 'car':
        return chaMod;
      default:
        return 0;
    }
  };

  const getSkillBonusByName = (skillName: string): number => {
    const sLower = skillName.toLowerCase();
    if (sLower.includes('luta') || sLower.includes('pontaria')) {
      return profBonus;
    }
    const found = DEFAULT_5E_SKILLS.find(
      (s) => s.namePt.toLowerCase() === sLower || s.name.toLowerCase() === sLower
    );
    if (!found) return 0;
    const abilityMod = getAttrModByName(found.ability);
    const charSkill = character.skills?.[found.id];
    let profMultiplier = 0;
    if (charSkill?.proficiency === 'half') profMultiplier = 0.5;
    else if (charSkill?.proficiency === 'proficient') profMultiplier = 1;
    else if (charSkill?.proficiency === 'expertise') profMultiplier = 2;
    return abilityMod + Math.floor(profBonus * profMultiplier) + (charSkill?.customBonus || 0);
  };

  useEffect(() => {
    if (editingAttack) {
      setName(editingAttack.name || 'Novo Ataque');
      setDamage(editingAttack.damage || '1d4');
      setCritical(editingAttack.critical ?? 20);
      setMultiplier(editingAttack.multiplier ?? 2);
      setAttackBonus(editingAttack.attackBonus ?? 0);
      setDamageType(editingAttack.damageType || 'Balístico');
      setRange(editingAttack.range || '-');
      setSkill(editingAttack.skill || 'Luta');
      setDamageAbility(editingAttack.damageAbility || 'Força');
      setFixedBonus(editingAttack.fixedBonus ?? 0);
      setAdvantageCount(
        editingAttack.advantageLevel && editingAttack.advantageLevel > 0
          ? editingAttack.advantageLevel
          : 0
      );
      setDisadvantageCount(
        editingAttack.advantageLevel && editingAttack.advantageLevel < 0
          ? Math.abs(editingAttack.advantageLevel)
          : 0
      );
      setExtraDamages(editingAttack.extraDamage || []);
      setImageUrl(editingAttack.imageUrl || '');
      setSaveAsShortcut(false);
    } else {
      setName('Novo Ataque');
      setDamage('1d4');
      setCritical(20);
      setMultiplier(2);
      setAttackBonus(0);
      setDamageType('Balístico');
      setRange('-');
      setSkill('Luta');
      setDamageAbility('Força');
      setFixedBonus(0);
      setAdvantageCount(0);
      setDisadvantageCount(0);
      setExtraDamages([]);
      setImageUrl('');
      setSaveAsShortcut(true);
    }
  }, [editingAttack, isOpen]);

  if (!isOpen) return null;

  const chosenAttrMod = getAttrModByName(damageAbility);
  const chosenSkillBonus = getSkillBonusByName(skill);
  const effectiveAttackBonus = attackBonus + chosenSkillBonus + chosenAttrMod;
  const effectiveFixedBonus = fixedBonus + chosenAttrMod;

  const computedAttackFormula = useMemo(() => {
    const sign =
      effectiveAttackBonus >= 0
        ? `+${effectiveAttackBonus}`
        : `${effectiveAttackBonus}`;
    let flag = '';
    if (advantageCount > 0) {
      flag = ` [${
        advantageCount > 1 ? `${advantageCount} Vantagens` : 'Vantagem'
      }]`;
    } else if (disadvantageCount > 0) {
      flag = ` [${
        disadvantageCount > 1 ? `${disadvantageCount} Desvantagens` : 'Desvantagem'
      }]`;
    }
    return `1d20${sign}${flag}`;
  }, [effectiveAttackBonus, advantageCount, disadvantageCount]);

  const computedDamageFormula = useMemo(() => {
    let base = damage.trim() || '1d4';
    if (effectiveFixedBonus !== 0 && !base.includes('+') && !base.includes('-')) {
      base = `${base}${
        effectiveFixedBonus >= 0
          ? `+${effectiveFixedBonus}`
          : `${effectiveFixedBonus}`
      }`;
    }
    let expr = `${base} [${damageType || 'Balístico'}]`;
    if (extraDamages.length > 0) {
      extraDamages.forEach((extra) => {
        if (extra.damage && extra.damage.trim()) {
          expr += ` + ${extra.damage.trim()} [${extra.damageType || 'Extra'}]`;
        }
      });
    }
    return expr;
  }, [damage, effectiveFixedBonus, damageType, extraDamages]);

  const handleAddExtraDamage = () => {
    setExtraDamages((prev) => [
      ...prev,
      {
        id: `extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        damage: '1d6',
        damageType: 'Fogo',
      },
    ]);
  };

  const handleUpdateExtraDamage = (
    id: string,
    field: 'damage' | 'damageType',
    value: string
  ) => {
    setExtraDamages((prev) =>
      prev.map((ed) => (ed.id === id ? { ...ed, [field]: value } : ed))
    );
  };

  const handleRemoveExtraDamage = (id: string) => {
    setExtraDamages((prev) => prev.filter((ed) => ed.id !== id));
  };

  const handleTestAttackRoll = () => {
    if (onQuickRoll) {
      onQuickRoll(computedAttackFormula, `Teste de Ataque: ${name}`);
    }
  };

  const handleTestDamageRoll = () => {
    if (onQuickRoll) {
      onQuickRoll(computedDamageFormula, `Dano: ${name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAdvantageLevel =
      advantageCount > 0
        ? advantageCount
        : disadvantageCount > 0
        ? -disadvantageCount
        : undefined;

    const attackToSave: WeaponAttack = {
      id:
        editingAttack?.id ||
        `atk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Novo Ataque',
      damage: damage.trim() || '1d4',
      critical,
      multiplier,
      attackBonus: effectiveAttackBonus,
      damageType: damageType.trim() || 'Balístico',
      range: range.trim() || '-',
      skill,
      damageAbility,
      fixedBonus: effectiveFixedBonus,
      advantageLevel: finalAdvantageLevel,
      extraDamage: extraDamages.filter((ed) => ed.damage && ed.damage.trim()),
      imageUrl: imageUrl.trim() || undefined,
    };

    onSave(attackToSave, saveAsShortcut);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141210] border-2 border-[#8c6b32] rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl text-[#f4ecd8] font-serif max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-[#54412c]/60 pb-3">
          <div>
            <h3 className="font-sans font-black text-xl sm:text-2xl text-[#f4ecd8] tracking-tight">
              {editingAttack ? 'Editar Ataque' : 'Novo Ataque'}
            </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo 1: Nome* */}
          <div className="space-y-1">
            <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
              Nome<span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Novo Ataque"
              className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2.5 text-sm text-[#f4ecd8] placeholder-[#6e5840] font-sans focus:outline-none transition"
              required
            />
          </div>

          {/* Linha 2 (3 Colunas): Dano* | Crítico* | Multiplicador* */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Dano<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                placeholder="1d4"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Crítico<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={critical}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setCritical(
                    clean === ''
                      ? 20
                      : Math.max(1, Math.min(20, parseInt(clean, 10)))
                  );
                }}
                placeholder="20"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-center text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Multiplicador<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={multiplier}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setMultiplier(
                    clean === ''
                      ? 2
                      : Math.max(1, Math.min(10, parseInt(clean, 10)))
                  );
                }}
                placeholder="2"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-center text-amber-200 placeholder-[#6e5840] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Linha 3 (2 Colunas): Ataque Bônus | Tipo de Dano */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Ataque Bônus
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-300">
                  Total Acerto: {formatModifier(effectiveAttackBonus)}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={attackBonus}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                  const parsed = parseInt(clean, 10);
                  setAttackBonus(isNaN(parsed) ? 0 : parsed);
                }}
                placeholder="0"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm font-mono text-center text-amber-300 font-bold focus:outline-none transition"
              />
              <div className="text-[10px] text-[#a89073] font-sans">
                Base ({formatModifier(attackBonus)}) + {skill || 'Perícia'} (
                {formatModifier(chosenSkillBonus)}) +{' '}
                {damageAbility || 'Atributo'} ({formatModifier(chosenAttrMod)})
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Tipo de Dano
              </label>
              <input
                type="text"
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                placeholder="Balístico"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition"
              />
              <div className="flex flex-wrap gap-1 pt-0.5 max-h-20 overflow-y-auto pr-1">
                {ALL_DND_DAMAGE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDamageType(t)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-sans transition border cursor-pointer ${
                      damageType.toLowerCase() === t.toLowerCase()
                        ? 'bg-[#c49d48] text-[#140d07] border-[#e8c679] font-bold'
                        : 'bg-[#1e1a17] text-[#a89073] border-[#3d2d1e] hover:text-[#eedbc5]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Linha 4 (3 Colunas): Alcance | Perícia | Atributo Dano */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Alcance
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="-"
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Perícia
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-300">
                  +{chosenSkillBonus}
                </span>
              </div>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition cursor-pointer"
              >
                <option value="Luta">Luta (+{profBonus})</option>
                <option value="Pontaria">Pontaria (+{profBonus})</option>
                <option value="Nenhuma">Nenhuma (+0)</option>
                {DEFAULT_5E_SKILLS.map((sk) => (
                  <option key={sk.id} value={sk.namePt}>
                    {sk.namePt} ({formatModifier(getSkillBonusByName(sk.namePt))})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                  Atributo Dano
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-300">
                  {formatModifier(chosenAttrMod)}
                </span>
              </div>
              <select
                value={damageAbility}
                onChange={(e) => setDamageAbility(e.target.value)}
                className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-sm text-[#f4ecd8] font-sans focus:outline-none transition cursor-pointer"
              >
                <option value="Força">Força ({formatModifier(strMod)})</option>
                <option value="Destreza">Destreza ({formatModifier(dexMod)})</option>
                <option value="Constituição">Constituição ({formatModifier(conMod)})</option>
                <option value="Inteligência">Inteligência ({formatModifier(intMod)})</option>
                <option value="Sabedoria">Sabedoria ({formatModifier(wisMod)})</option>
                <option value="Carisma">Carisma ({formatModifier(chaMod)})</option>
                <option value="Nenhum">Nenhum (+0)</option>
              </select>
            </div>
          </div>

          {/* Bônus Fixo de Dano */}
          <div className="space-y-1.5 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans font-bold text-[#c49d48] uppercase tracking-wider block">
                Bônus Fixo de Dano:
              </label>
              <span className="font-mono font-bold text-amber-300 text-sm">
                Total Dano: {formatModifier(effectiveFixedBonus)}
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={fixedBonus}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9\-+]/g, '');
                const parsed = parseInt(clean, 10);
                setFixedBonus(isNaN(parsed) ? 0 : parsed);
              }}
              placeholder="0"
              className="w-full bg-[#141210] border border-[#8c6b32]/60 rounded-lg py-1.5 px-3 text-center font-mono font-bold text-sm text-amber-200 focus:outline-none focus:border-[#c49d48]"
            />
            <div className="text-[10px] text-[#a89073] font-sans">
              Fixo ({formatModifier(fixedBonus)}) + {damageAbility || 'Atributo'} (
              {formatModifier(chosenAttrMod)})
            </div>
          </div>

          {/* Vantagens & Desvantagens */}
          <div className="space-y-2 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans font-bold text-[#c49d48] uppercase tracking-wider block">
                Vantagens &amp; Desvantagens (Dados Extras):
              </label>
              {(advantageCount > 0 || disadvantageCount > 0) && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border font-sans ${
                    advantageCount > 0
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-red-950 text-red-300 border-red-600'
                  }`}
                >
                  {advantageCount > 0
                    ? `${1 + advantageCount} Dados `
                    : `${1 + disadvantageCount} Dados `}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Stepper de Vantagem */}
              <div className="flex items-center justify-between bg-[#141210] border border-emerald-900/60 rounded-lg p-2">
                <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1">
                  ★ Vantagens:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdvantageCount((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded bg-[#251910] hover:bg-emerald-900/40 text-[#f4ecd8] border border-[#54412c] flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-emerald-200">
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
                  ⚠️ Desvantagens:
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
                  <span className="w-10 text-center font-mono font-bold text-sm text-red-200">
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

          {/* Dano Extra */}
          <div className="space-y-2 bg-[#1b1612] border border-[#54412c] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
                Dano extra:
              </label>
              <button
                type="button"
                onClick={handleAddExtraDamage}
                className="px-2.5 py-1 rounded bg-[#251910] hover:bg-[#382619] text-[#c49d48] hover:text-[#e8c679] border border-[#8c6b32]/60 text-xs font-sans font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Dano Extra</span>
              </button>
            </div>

            {extraDamages.length === 0 ? (
              <div className="text-[11px] text-[#78634c] italic py-2 text-center bg-[#141210] rounded-lg border border-dashed border-[#3d2d1e]">
                Nenhum dano extra configurado.
              </div>
            ) : (
              <div className="space-y-2">
                {extraDamages.map((extra, edIdx) => (
                  <div
                    key={extra.id}
                    className="flex items-center gap-2 bg-[#141210] border border-[#54412c] rounded-lg p-2"
                  >
                    <div className="flex-1">
                      <label className="text-[9px] text-[#8c7457] font-sans uppercase block mb-0.5">
                        Dano / Dado #{edIdx + 1}
                      </label>
                      <input
                        type="text"
                        value={extra.damage}
                        onChange={(e) =>
                          handleUpdateExtraDamage(extra.id, 'damage', e.target.value)
                        }
                        placeholder="ex: 1d6 ou 2"
                        className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded px-2 py-1 text-xs font-mono text-amber-200 focus:outline-none"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="text-[9px] text-[#8c7457] font-sans uppercase block mb-0.5">
                        Tipo de Dano
                      </label>
                      <select
                        value={extra.damageType}
                        onChange={(e) =>
                          handleUpdateExtraDamage(
                            extra.id,
                            'damageType',
                            e.target.value
                          )
                        }
                        className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded px-2 py-1 text-xs font-sans text-[#f4ecd8] focus:outline-none cursor-pointer"
                      >
                        {ALL_DND_DAMAGE_TYPES.map((dt) => (
                          <option key={dt} value={dt}>
                            {dt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExtraDamage(extra.id)}
                      className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded transition mt-3 cursor-pointer"
                      title="Remover dano extra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Imagem (Opcional) */}
          <div className="space-y-1">
            <label className="text-xs font-sans font-bold text-[#f4ecd8] block">
              Imagem (URL ou Ícone)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... ou vazio"
              className="w-full bg-[#1e1a17] border border-[#54412c] focus:border-[#c49d48] rounded-lg p-2 text-xs text-[#eedbc5] placeholder-[#6e5840] font-sans focus:outline-none transition"
            />
          </div>

          {/* Checkbox Salvar também na Mesa de Dados & Atalhos */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="attackSaveAsShortcut"
              checked={saveAsShortcut}
              onChange={(e) => setSaveAsShortcut(e.target.checked)}
              className="w-4 h-4 rounded accent-[#c49d48] bg-[#1e1a17] border border-[#54412c] cursor-pointer"
            />
            <label
              htmlFor="attackSaveAsShortcut"
              className="text-xs text-[#eedbc5] font-sans cursor-pointer select-none"
            >
              Salvar também na <strong>Mesa de Dados &amp; Atalhos</strong>
            </label>
          </div>

          {/* Prévia da Rolagem */}
          <div className="bg-[#100e0c] border border-[#8c6b32]/60 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wider text-[#a89073]">
              <span>Fórmulas Calculadas:</span>
              <span className="text-amber-400 font-mono font-bold">Prévia da Rolagem</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#a89073]">Teste de Acerto:</span>
                <strong className="text-amber-300">{computedAttackFormula}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a89073]">Rolagem de Dano:</span>
                <strong className="text-amber-300 truncate max-w-[280px] sm:max-w-none text-right">
                  {computedDamageFormula}
                </strong>
              </div>
            </div>
          </div>

          {/* Rodapé: Ações e Botões de Teste */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#54412c]/60 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestAttackRoll}
                className="px-3 py-1.5 rounded-lg bg-[#251910] hover:bg-[#382619] text-[#d4af37] border border-[#8c6b32] text-xs font-sans font-bold transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                title="Testar teste de ataque"
              >
                <Dices className="w-4 h-4 text-[#e8c679]" />
                <span>Testar Ataque</span>
              </button>
              <button
                type="button"
                onClick={handleTestDamageRoll}
                className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-700/60 text-xs font-sans font-bold transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                title="Testar dano"
              >
                <Flame className="w-4 h-4 text-red-400" />
                <span>Testar Dano</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
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
                <span>{editingAttack ? 'Atualizar Ataque' : 'Salvar Ataque'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
