import React, { useState, useEffect } from 'react';
import { 
  Formacao, 
  Colaborador, 
  FormacaoCategoria, 
  DestinatarioGrupo, 
  DESTINATARIOS_INFO,
  CertificadoAnexo 
} from '../types';
import { 
  X, 
  Upload, 
  Check, 
  FileText, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { gerarCodigoFormacaoAutomatico } from '../utils/codeGenerator';
import { extrairDadosECriarFormacaoDeCertificado } from '../utils/certificateParser';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formacao: Formacao) => void;
  formacaoToEdit: Formacao | null;
  anoAtual: number;
  colaboradores: Colaborador[];
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formacaoToEdit,
  anoAtual,
  colaboradores
}) => {
  // Form states
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<FormacaoCategoria>('Externa');
  const [destinatarios, setDestinatarios] = useState<DestinatarioGrupo[]>(['TSDT']);
  const [data, setData] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [frequentadaColaboradorRad, setFrequentadaColaboradorRad] = useState(true);
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<string[]>([]);
  const [horas, setHoras] = useState<number>(1);
  const [horasTexto, setHorasTexto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [relevancia, setRelevancia] = useState<'Sim' | 'Não'>('Sim');
  const [incluidaPlanoNecessidades, setIncluidaPlanoNecessidades] = useState<'Sim' | 'Não'>('Não');
  const [realizada, setRealizada] = useState(true);
  const [burocracia, setBurocracia] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [certificado, setCertificado] = useState<CertificadoAnexo | undefined>(undefined);
  const [erroValidacao, setErroValidacao] = useState('');
  const [mostrarExplicacaoCodigo, setMostrarExplicacaoCodigo] = useState(false);

  const handleRecalcularCodigoAutomatico = (d = data, cat = categoria) => {
    const res = gerarCodigoFormacaoAutomatico(d, cat);
    setCodigo(res.codigo);
  };

  // Populate data when editing
  useEffect(() => {
    if (!isOpen) return;

    if (formacaoToEdit) {
      setNome(formacaoToEdit.nome);
      setCategoria(formacaoToEdit.categoria);
      setDestinatarios(formacaoToEdit.destinatarios);
      setData(formacaoToEdit.data);
      setDataFim(formacaoToEdit.dataFim || '');
      setFrequentadaColaboradorRad(formacaoToEdit.frequentadaColaboradorRad);
      setColaboradoresSelecionados(formacaoToEdit.colaboradores);
      setHoras(formacaoToEdit.horas);
      setHorasTexto(formacaoToEdit.horasTexto || '');
      setCodigo(formacaoToEdit.codigo);
      setRelevancia(formacaoToEdit.relevancia);
      setIncluidaPlanoNecessidades(formacaoToEdit.incluidaPlanoNecessidades);
      setRealizada(formacaoToEdit.realizada);
      setBurocracia(formacaoToEdit.burocracia);
      setObservacoes(formacaoToEdit.observacoes || '');
      setCertificado(formacaoToEdit.certificado);
    } else {
      // Default new entry
      const hoje = new Date().toISOString().slice(0, 10);
      const dataFormatada = hoje.startsWith(anoAtual.toString()) ? hoje : `${anoAtual}-01-15`;
      const resCodigo = gerarCodigoFormacaoAutomatico(dataFormatada, 'Externa');

      setNome('');
      setCategoria('Externa');
      setDestinatarios(['TSDT']);
      setData(dataFormatada);
      setDataFim('');
      setFrequentadaColaboradorRad(true);
      setColaboradoresSelecionados([]);
      setHoras(1);
      setHorasTexto('');
      setCodigo(resCodigo.codigo);
      setRelevancia('Sim');
      setIncluidaPlanoNecessidades('Não');
      setRealizada(true);
      setBurocracia(true);
      setObservacoes('');
      setCertificado(undefined);
    }
    setErroValidacao('');
  }, [formacaoToEdit, isOpen, anoAtual]);

  // Recalcular código sugerido caso mude categoria ou data em novo registo
  const handleCategoriaChange = (novaCat: FormacaoCategoria) => {
    setCategoria(novaCat);
    if (!formacaoToEdit) {
      handleRecalcularCodigoAutomatico(data, novaCat);
    }
  };

  const handleDataChange = (novaData: string) => {
    setData(novaData);
    if (!formacaoToEdit) {
      handleRecalcularCodigoAutomatico(novaData, categoria);
    }
  };

  const handleToggleDestinatario = (grupo: DestinatarioGrupo) => {
    const isCurrentlyPresent = destinatarios.includes(grupo) || (grupo === 'TAS' && destinatarios.includes('AO' as any));
    if (isCurrentlyPresent) {
      if (destinatarios.length > 1) {
        setDestinatarios(destinatarios.filter(g => g !== grupo && !(grupo === 'TAS' && (g as string) === 'AO')));
      }
    } else {
      setDestinatarios([...destinatarios.filter(g => !(grupo === 'TAS' && (g as string) === 'AO')), grupo]);
    }
  };

  const handleToggleColaborador = (sigla: string) => {
    if (colaboradoresSelecionados.includes(sigla)) {
      setColaboradoresSelecionados(colaboradoresSelecionados.filter(s => s !== sigla));
    } else {
      setColaboradoresSelecionados([...colaboradoresSelecionados, sigla]);
    }
  };

  // Upload do ficheiro de certificado (converte para base64 e auto-preenche dados conhecidos)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErroValidacao('O ficheiro é demasiado grande. Por favor selecione um certificado com menos de 8MB.');
      return;
    }

    try {
      const res = await extrairDadosECriarFormacaoDeCertificado(file, colaboradores, anoAtual);
      setCertificado(res.certificado);

      // Se for novo registo ou se o título estiver vazio, preencher com os dados extraídos
      if (!formacaoToEdit || !nome.trim()) {
        setNome(res.formacao.nome);
        if (res.formacao.colaboradores.length > 0 && colaboradoresSelecionados.length === 0) {
          setColaboradoresSelecionados(res.formacao.colaboradores);
        }
        if (res.formacao.destinatarios.length > 0) {
          setDestinatarios(res.formacao.destinatarios);
        }
        if (res.formacao.data) {
          setData(res.formacao.data);
        }
        if (res.formacao.horas > 1) {
          setHoras(res.formacao.horas);
        }
        setRealizada(true);
      }
      setErroValidacao('');
    } catch (err) {
      console.error('Erro ao processar certificado:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setErroValidacao('Por favor indique o Nome da Formação.');
      return;
    }

    if (!data) {
      setErroValidacao('Por favor selecione a Data de Realização.');
      return;
    }

    if (horas <= 0) {
      setErroValidacao('A duração em horas deve ser superior a zero.');
      return;
    }

    if (!codigo.trim()) {
      setErroValidacao('Por favor atribua um Código à formação.');
      return;
    }

    const formacaoFinal: Formacao = {
      id: formacaoToEdit ? formacaoToEdit.id : `form-${Date.now()}`,
      ano: anoAtual,
      nome: nome.trim(),
      categoria,
      prioridade: formacaoToEdit?.prioridade,
      destinatarios,
      data,
      dataFim: dataFim.trim() || undefined,
      frequentadaColaboradorRad,
      colaboradores: colaboradoresSelecionados,
      horas: Number(horas),
      horasTexto: horasTexto.trim() || `${horas} h`,
      codigo: codigo.trim(),
      relevancia,
      incluidaPlanoNecessidades,
      realizada,
      burocracia,
      subtipoBurocracia: formacaoToEdit?.subtipoBurocracia,
      documentosBurocracia: formacaoToEdit?.documentosBurocracia,
      observacoes: observacoes.trim(),
      certificado,
      dataRegisto: formacaoToEdit ? formacaoToEdit.dataRegisto : new Date().toISOString().slice(0, 10)
    };

    onSave(formacaoFinal);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {formacaoToEdit ? 'Editar Registo de Formação' : 'Registar Nova Formação Realizada'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ano de Exercício: <strong className="text-teal-700">{anoAtual}</strong> · Serviço de Radioterapia
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {erroValidacao && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erroValidacao}</span>
            </div>
          )}

          {/* Nome da Formação */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Nome da Formação <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Webinar Radioterapia da Mama em DIBH ou Proteção Radiológica"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Categoria e Destinatários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Categoria de Formação (sub-opções: Externa, Interna, Enfermagem, ACAF) */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Categoria de Formação <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Externa', 'Interna', 'Enfermagem', 'ACAF'] as FormacaoCategoria[]).map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleCategoriaChange(cat)}
                    className={`py-1.5 px-3 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                      categoria === cat
                        ? 'bg-teal-50 text-teal-800 border-teal-500 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Destinatários (sub-opções: MR, ENF, TSDT, FIS, AT, TAS) */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Destinatários da Ação (seleção múltipla) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['AT', 'ENF', 'FIS', 'MR', 'TAS', 'TSDT'] as DestinatarioGrupo[]).map((grp) => {
                  const isSelected = destinatarios.includes(grp) || (grp === 'TAS' && destinatarios.includes('AO' as any));
                  return (
                    <button
                      type="button"
                      key={grp}
                      onClick={() => handleToggleDestinatario(grp)}
                      title={DESTINATARIOS_INFO[grp]?.nomeCompleto}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Datas, Horas e Código */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Data da Realização */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Data da Realização <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => handleDataChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden font-mono"
              />
            </div>

            {/* Duração em Horas */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Duração (Horas) <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={horas}
                  onChange={(e) => setHoras(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden font-mono text-right font-semibold"
                />
                <input
                  type="text"
                  placeholder="Texto (ex: 1 h 30 mins)"
                  value={horasTexto}
                  onChange={(e) => setHorasTexto(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Código da Formação com Atribuição Automática */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-800">
                  Código da Formação <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRecalcularCodigoAutomatico()}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 cursor-pointer"
                  title="Recalcular código segundo a regra oficial: [AAMMDD]-[CAT][SEQ]"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Gerar Auto</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ex: 260104-E01"
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden font-mono font-semibold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setMostrarExplicacaoCodigo(!mostrarExplicacaoCodigo)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-teal-700 p-0.5 rounded cursor-pointer"
                  title="Ver como funciona a atribuição automática do código"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cartão de Explicação de Como é Atribuído o Código de Formação */}
          {mostrarExplicacaoCodigo && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-700" />
                  Regra Oficial de Atribuição Automática do Código:
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarExplicacaoCodigo(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                O código é construído sozinho pelo sistema segundo o formato normalizado do Serviço de Radioterapia:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono bg-white p-2 rounded border border-sky-100 text-center">
                <div className="bg-sky-100/70 p-1 rounded">
                  <strong className="block text-sky-900">AA</strong>
                  <span className="text-slate-500">Ano (ex: 26)</span>
                </div>
                <div className="bg-sky-100/70 p-1 rounded">
                  <strong className="block text-sky-900">MM</strong>
                  <span className="text-slate-500">Mês (ex: 01)</span>
                </div>
                <div className="bg-sky-100/70 p-1 rounded">
                  <strong className="block text-sky-900">DD</strong>
                  <span className="text-slate-500">Dia (ex: 15)</span>
                </div>
                <div className="bg-amber-100/70 p-1 rounded">
                  <strong className="block text-amber-900">CAT</strong>
                  <span className="text-slate-500">E/I/ENF/A</span>
                </div>
                <div className="bg-emerald-100/70 p-1 rounded">
                  <strong className="block text-emerald-900">SEQ</strong>
                  <span className="text-slate-500">01, 02...</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                • <strong>E</strong>: Formação Externa · <strong>I</strong>: Formação Interna · <strong>ENF</strong>: Formação Enfermagem · <strong>A</strong>: ACAF<br />
                Sempre que altera a <em>Data</em> ou a <em>Categoria</em>, o código é recalculado de forma autónoma.
              </p>
            </div>
          )}

          {/* Colaboradores Participantes (Frequentada por Colaborador RAD) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Frequentada por Colaborador do Serviço RAD:
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="freqRad"
                    checked={frequentadaColaboradorRad}
                    onChange={() => setFrequentadaColaboradorRad(true)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Sim</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="freqRad"
                    checked={!frequentadaColaboradorRad}
                    onChange={() => setFrequentadaColaboradorRad(false)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>

            {/* Seleção rápida de Colaboradores por Sigla */}
            {frequentadaColaboradorRad && (
              <div>
                <span className="block text-[11px] text-slate-500 mb-1.5">
                  Selecione as siglas dos colaboradores presentes (clique para alternar):
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded">
                  {colaboradores.map((c) => {
                    const isSelected = colaboradoresSelecionados.includes(c.sigla);
                    return (
                      <button
                        type="button"
                        key={c.sigla}
                        onClick={() => handleToggleColaborador(c.sigla)}
                        title={`${c.nome} (${c.categoriaProfissional})`}
                        className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.sigla}
                      </button>
                    );
                  })}
                </div>
                {colaboradoresSelecionados.length > 0 && (
                  <span className="text-[11px] text-teal-700 font-medium mt-1 block">
                    Participantes ({colaboradoresSelecionados.length}): {colaboradoresSelecionados.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>


          {/* Validações: Relevância, PNF, Realizada e Burocracia */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-3.5 rounded-lg border border-amber-200">
            
            {/* Relevância */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Relevância
              </label>
              <select
                value={relevancia}
                onChange={(e) => setRelevancia(e.target.value as 'Sim' | 'Não')}
                className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            {/* Inclusão no PNF */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1" title="Plano de Necessidades Formativas">
                Incluída no PNF
              </label>
              <select
                value={incluidaPlanoNecessidades}
                onChange={(e) => setIncluidaPlanoNecessidades(e.target.value as 'Sim' | 'Não')}
                className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            {/* Realizada pisga */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Realizada (Pisga)
              </label>
              <button
                type="button"
                onClick={() => setRealizada(!realizada)}
                className={`w-full py-1.5 px-2 text-xs font-medium rounded-md border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  realizada 
                    ? 'bg-teal-700 text-white border-teal-700' 
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${realizada ? 'opacity-100' : 'opacity-0'}`} />
                <span>{realizada ? 'Validada' : 'Pendente'}</span>
              </button>
            </div>

            {/* Burocracia pisga */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Burocracia (Pisga)
              </label>
              <button
                type="button"
                onClick={() => setBurocracia(!burocracia)}
                className={`w-full py-1.5 px-2 text-xs font-medium rounded-md border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  burocracia 
                    ? 'bg-teal-700 text-white border-teal-700' 
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${burocracia ? 'opacity-100' : 'opacity-0'}`} />
                <span>{burocracia ? 'Validada' : 'Pendente'}</span>
              </button>
            </div>
          </div>

          {/* Upload do Certificado */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Certificado de Formação (Upload PDF ou Imagem)
            </label>
            {certificado ? (
              <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-700" />
                  <div>
                    <p className="text-xs font-semibold text-teal-900">{certificado.nomeFicheiro}</p>
                    <p className="text-[11px] text-teal-700">
                      {certificado.tamanhoKb} KB · Anexado em {new Date(certificado.dataUpload).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCertificado(undefined)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Remover anexo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-lg p-4 text-center bg-slate-50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-slate-700">
                  Clique ou arraste o certificado para este local
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Suporta PDF, JPG, PNG até 8 MB
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Observações & Notas de Tramitação
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Documentação remetente para Enfermagem / Sala de Reuniões do Serviço RAD / Falta ACAF assinar"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              {formacaoToEdit ? 'Guardar Alterações' : 'Registar Formação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
