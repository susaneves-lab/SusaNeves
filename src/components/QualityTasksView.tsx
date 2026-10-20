import React, { useState, useMemo } from 'react';
import { 
  TarefaQualidade, 
  Colaborador, 
  PeriodicidadeTarefa 
} from '../types';
import { 
  MESES_NOMES, 
  CRITERIOS_RELEVANCIA_QUALIDADE, 
  NOTAS_REGULAMENTARES_QUALIDADE, 
  gerarTarefasPadraoAno 
} from '../data/qualityTasksData';
import { 
  Check, 
  CheckSquare, 
  Square, 
  Pencil, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  RotateCcw, 
  Mail, 
  FileText, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  Award, 
  Target, 
  HelpCircle, 
  Download, 
  Printer, 
  User, 
  CheckCircle2,
  CalendarCheck,
  ListTodo,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Send,
  Copy
} from 'lucide-react';

interface QualityTasksViewProps {
  anoAtual: number;
  tarefas: TarefaQualidade[];
  colaboradores: Colaborador[];
  onSalvarTarefas: (novasTarefas: TarefaQualidade[]) => void;
  onNavigateTab: (tab: 'tabela' | 'burocracia' | 'relatorios' | 'dashboard') => void;
}

export const QualityTasksView: React.FC<QualityTasksViewProps> = ({
  anoAtual,
  tarefas,
  colaboradores,
  onSalvarTarefas,
  onNavigateTab
}) => {
  // Sub-abas principais: 1. Checklist de Tarefas | 2. Cronograma Mensal/Trimestral | 3. Critérios de Relevância
  const [viewMode, setViewMode] = useState<'checklist' | 'cronograma' | 'criterios'>('checklist');

  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodicidadeTarefa | 'todas'>('todas');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [mesSelecionadoCronograma, setMesSelecionadoCronograma] = useState<number | 'todos'>('todos');
  const [trimestreSelecionadoCronograma, setTrimestreSelecionadoCronograma] = useState<number | 'todos'>('todos');

  // Estados de Edição / Modal
  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<TarefaQualidade | null>(null);

  // Modal Email Enf. Tânia
  const [modalEmailTaniaAberto, setModalEmailTaniaAberto] = useState(false);
  const [tarefaParaEmailTania, setTarefaParaEmailTania] = useState<TarefaQualidade | null>(null);
  const [copiadoEmailTania, setCopiadoEmailTania] = useState(false);

  // Confirmações sem window.confirm
  const [tarefaParaEliminarId, setTarefaParaEliminarId] = useState<string | null>(null);
  const [modalRestaurarAberto, setModalRestaurarAberto] = useState(false);

  // Colaboradora Tânia
  const colabTania = useMemo(() => {
    return colaboradores.find(c => 
      c.sigla === 'TMV' || 
      c.nome.toLowerCase().includes('tânia') || 
      c.email.toLowerCase().includes('tania')
    ) || {
      nome: 'Tânia Isabel Espadinha de Matos Vitoriano',
      sigla: 'TMV',
      email: 'taniavitoriano@ulsar.min-saude.pt',
      cargo: 'Enfermeira'
    };
  }, [colaboradores]);

  // Estatísticas globais das tarefas do ano
  const totalTarefas = tarefas.length;
  const concluidasCount = tarefas.filter(t => t.concluida).length;
  const pendentesCount = totalTarefas - concluidasCount;
  const percentagemConcluida = totalTarefas > 0 ? Math.round((concluidasCount / totalTarefas) * 100) : 0;

  // Filtragem para o modo Checklist
  const tarefasFiltradasChecklist = useMemo(() => {
    return tarefas.filter(t => {
      if (filtroPeriodo !== 'todas' && t.periodicidade !== filtroPeriodo) return false;
      if (filtroStatus === 'pendentes' && t.concluida) return false;
      if (filtroStatus === 'concluidas' && !t.concluida) return false;
      if (buscaTexto.trim() !== '') {
        const q = buscaTexto.toLowerCase();
        const titulo = t.titulo.toLowerCase();
        const desc = (t.descricao || '').toLowerCase();
        const resp = (t.responsavel || '').toLowerCase();
        return titulo.includes(q) || desc.includes(q) || resp.includes(q);
      }
      return true;
    });
  }, [tarefas, filtroPeriodo, filtroStatus, buscaTexto]);

  // Filtragem para o modo Cronograma
  const tarefasFiltradasCronograma = useMemo(() => {
    return tarefas.filter(t => {
      if (mesSelecionadoCronograma !== 'todos' && t.mes !== mesSelecionadoCronograma) return false;
      if (trimestreSelecionadoCronograma !== 'todos' && t.trimestre !== trimestreSelecionadoCronograma) return false;
      if (filtroStatus === 'pendentes' && t.concluida) return false;
      if (filtroStatus === 'concluidas' && !t.concluida) return false;
      if (buscaTexto.trim() !== '') {
        const q = buscaTexto.toLowerCase();
        return t.titulo.toLowerCase().includes(q) || (t.descricao || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [tarefas, mesSelecionadoCronograma, trimestreSelecionadoCronograma, filtroStatus, buscaTexto]);

  // Alternar bisga (conclusão)
  const handleToggleBisga = (id: string) => {
    const agora = new Date().toISOString().slice(0, 10);
    const novas = tarefas.map(t => {
      if (t.id === id) {
        const novoStatus = !t.concluida;
        return {
          ...t,
          concluida: novoStatus,
          dataConclusao: novoStatus ? agora : undefined
        };
      }
      return t;
    });
    onSalvarTarefas(novas);
  };

  // Abrir modal de criação
  const handleAbrirCriarTarefa = () => {
    setTarefaEditando({
      id: `task-${anoAtual}-${Date.now()}`,
      ano: anoAtual,
      titulo: '',
      descricao: '',
      periodicidade: 'mensal',
      mes: new Date().getMonth() + 1,
      trimestre: (Math.floor(new Date().getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
      prazoDescritivo: '',
      dataLimite: '',
      concluida: false,
      responsavel: 'Responsável da Qualidade / RAD',
      prioridade: 'normal'
    });
    setModalTarefaAberto(true);
  };

  // Abrir modal de edição
  const handleAbrirEditarTarefa = (t: TarefaQualidade) => {
    setTarefaEditando({ ...t });
    setModalTarefaAberto(true);
  };

  // Gravar tarefa editada / criada
  const handleSalvarTarefaForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaEditando || !tarefaEditando.titulo.trim()) return;

    const existe = tarefas.some(t => t.id === tarefaEditando.id);
    let novas: TarefaQualidade[];
    if (existe) {
      novas = tarefas.map(t => t.id === tarefaEditando.id ? tarefaEditando : t);
    } else {
      novas = [...tarefas, tarefaEditando];
    }

    onSalvarTarefas(novas);
    setModalTarefaAberto(false);
    setTarefaEditando(null);
  };

  // Solicitar confirmação de eliminação de tarefa
  const handlePedirEliminarTarefa = (id: string) => {
    setTarefaParaEliminarId(id);
  };

  const handleConfirmarEliminarTarefa = () => {
    if (!tarefaParaEliminarId) return;
    const novas = tarefas.filter(t => t.id !== tarefaParaEliminarId);
    onSalvarTarefas(novas);
    setTarefaParaEliminarId(null);
  };

  // Restaurar tarefas padrão
  const handlePedirRestaurarPadrao = () => {
    setModalRestaurarAberto(true);
  };

  const handleConfirmarRestaurarPadrao = () => {
    const padrao = gerarTarefasPadraoAno(anoAtual);
    onSalvarTarefas(padrao);
    setModalRestaurarAberto(false);
  };

  // Ação rápida: Preparar Email Enf. Tânia
  const handlePrepararEmailTania = (t: TarefaQualidade) => {
    setTarefaParaEmailTania(t);
    setCopiadoEmailTania(false);
    setModalEmailTaniaAberto(true);
  };

  const corpoEmailTania = `Exma. Colega Enf.ª Tânia Vitoriano,

No âmbito da Gestão da Qualidade e do acompanhamento do Plano de Formação do Serviço de Radioterapia da ULSAR para o ano civil de ${anoAtual}, solicitamos o envio das informações e respetiva documentação das ações formativas da equipa de Enfermagem:

1. Folhas de Registo de Presença de Formandos (RPF) devidamente preenchidas e assinadas;
2. Comprovativos de frequência ou certificados das ações realizadas no período;
3. Atualização do plano de necessidades e calendarização das próximas ações formativas.

Agradecemos o envio dos ficheiros digitalizados com a brevidade possível para efeitos de consolidação e auditoria hospitalar.

Com os melhores cumprimentos,
Serviço de Radioterapia · Qualidade & Formação
Unidade Local de Saúde (ULSAR, EPE)`;

  const handleCopiarTextoEmailTania = () => {
    navigator.clipboard?.writeText(corpoEmailTania);
    setCopiadoEmailTania(true);
    setTimeout(() => setCopiadoEmailTania(false), 3000);
  };

  const handleDispararOutlookTania = () => {
    const emailDest = colabTania.email || 'taniavitoriano@ulsar.min-saude.pt';
    const emailCc = 'chefia.radioterapia@ulsar.min-saude.pt; coordenacao.qualidade@ulsar.min-saude.pt';
    const assunto = `[RadForm · ULSAR] Solicitação de Registo de Presenças (RPF) e Formações de Enfermagem · ${anoAtual}`;

    const mailtoUrl = `mailto:${emailDest}?cc=${encodeURIComponent(emailCc)}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmailTania)}`;
    const webOutlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(emailDest)}&cc=${encodeURIComponent(emailCc)}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmailTania)}`;

    // Se houver tarefa associada, marca bisga automaticamente
    if (tarefaParaEmailTania) {
      handleToggleBisga(tarefaParaEmailTania.id);
    }

    setModalEmailTaniaAberto(false);
    setTarefaParaEmailTania(null);

    // Tentar abrir ou redirecionar suavemente
    try {
      window.location.href = mailtoUrl;
    } catch {
      // Ignora erro se sandbox restringir
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── BANNER SUPERIOR DE QUALIDADE & PROGRESSO ─── */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
              <h2 className="text-base font-bold text-slate-900">
                Tarefas a Fazer – Gestão da Qualidade & Cronograma Anual
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Plano de conformidade hospitalar baseado no normativo oficial da Qualidade. 
              Controle as tarefas de <strong>Início do Ano</strong>, <strong>Fim de Trimestre</strong> e <strong>Rotinas Mensais</strong>, 
              assinalando a respetiva <strong>bisga (✔)</strong> quando concluídas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleAbrirCriarTarefa}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Tarefa</span>
            </button>
            <button
              onClick={handlePedirRestaurarPadrao}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors flex items-center gap-1"
              title="Restaurar lista oficial de tarefas do normativo"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Repor Padrão</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Barra de Progresso Global */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div className="sm:col-span-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Progresso Geral das Tarefas do Ano {anoAtual}:</span>
              <span className="font-mono font-bold text-teal-800">{concluidasCount} de {totalTarefas} concluídas ({percentagemConcluida}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentagemConcluida}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> {concluidasCount} com Bisga
            </span>
            <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200">
              ⏳ {pendentesCount} Pendentes
            </span>
          </div>
        </div>
      </div>

      {/* ─── NAVEGAÇÃO DE VISTAS (CHECKLIST vs CRONOGRAMA vs CRITÉRIOS) ─── */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setViewMode('checklist')}
          className={`py-3 px-1 transition-colors cursor-pointer relative flex items-center gap-2 ${
            viewMode === 'checklist' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>1. Checklist de Tarefas da Qualidade ({tarefasFiltradasChecklist.length})</span>
          {viewMode === 'checklist' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setViewMode('cronograma')}
          className={`py-3 px-1 transition-colors cursor-pointer relative flex items-center gap-2 ${
            viewMode === 'cronograma' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Cronograma Anual & Prazos ({tarefasFiltradasCronograma.length})</span>
          {viewMode === 'cronograma' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setViewMode('criterios')}
          className={`py-3 px-1 transition-colors cursor-pointer relative flex items-center gap-2 ${
            viewMode === 'criterios' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Critérios de Relevância & Prazos Oficiais</span>
          {viewMode === 'criterios' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      </div>

      {/* ─── BARRA DE FILTROS & PESQUISA ─── */}
      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'checklist' && (
            <>
              <span className="text-slate-500 font-medium">Período:</span>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value as PeriodicidadeTarefa | 'todas')}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="todas">Todos os Períodos</option>
                <option value="inicio_ano">Início do Ano (12 Tarefas)</option>
                <option value="mensal">Mensais / Recorrentes</option>
                <option value="trimestral">Final do Trimestre (T1, T2, T3, T4)</option>
                <option value="durante_ano">Durante o Ano (Operacionais)</option>
              </select>
            </>
          )}

          {viewMode === 'cronograma' && (
            <>
              <span className="text-slate-500 font-medium">Trimestre:</span>
              <select
                value={trimestreSelecionadoCronograma}
                onChange={(e) => {
                  const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                  setTrimestreSelecionadoCronograma(val);
                }}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="todos">Todos os Trimestres</option>
                <option value={1}>1º Trimestre (Jan - Mar)</option>
                <option value={2}>2º Trimestre (Abr - Jun)</option>
                <option value={3}>3º Trimestre (Jul - Set)</option>
                <option value={4}>4º Trimestre (Out - Dez)</option>
              </select>

              <span className="text-slate-500 font-medium ml-1">Mês:</span>
              <select
                value={mesSelecionadoCronograma}
                onChange={(e) => {
                  const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                  setMesSelecionadoCronograma(val);
                }}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="todos">Todos os Meses</option>
                {MESES_NOMES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </>
          )}

          <span className="text-slate-500 font-medium ml-1">Estado:</span>
          <div className="inline-flex rounded-md shadow-2xs">
            <button
              onClick={() => setFiltroStatus('todas')}
              className={`px-2.5 py-1 rounded-l text-xs font-semibold cursor-pointer border ${
                filtroStatus === 'todas' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroStatus('pendentes')}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer border-t border-b border-r ${
                filtroStatus === 'pendentes' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              A Fazer
            </button>
            <button
              onClick={() => setFiltroStatus('concluidas')}
              className={`px-2.5 py-1 rounded-r text-xs font-semibold cursor-pointer border-t border-b border-r ${
                filtroStatus === 'concluidas' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Com Bisga (✔)
            </button>
          </div>
        </div>

        {/* Caixa de Pesquisa */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar tarefa, responsável..."
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* ─── VISTA 1: CHECKLIST DE TAREFAS DA QUALIDADE ─── */}
      {viewMode === 'checklist' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Lista Interativa de Tarefas da Qualidade
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Clique no botão de Bisga (✔) para marcar a conclusão
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {tarefasFiltradasChecklist.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Nenhuma tarefa encontrada para os filtros selecionados.</p>
                <button
                  onClick={() => {
                    setFiltroPeriodo('todas');
                    setFiltroStatus('todas');
                    setBuscaTexto('');
                  }}
                  className="px-3 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded text-xs font-semibold cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              tarefasFiltradasChecklist.map((tarefa, index) => {
                const isConcluida = tarefa.concluida;

                return (
                  <div 
                    key={tarefa.id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isConcluida ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Zona Esquerda: Botão de Bisga + Detalhes da Tarefa */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* BOTÃO PROEMINENTE PARA BISGA (PISGA / VISTO) */}
                      <button
                        type="button"
                        onClick={() => handleToggleBisga(tarefa.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs ${
                          isConcluida
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                            : 'bg-white hover:bg-teal-50 text-slate-400 hover:text-teal-700 border-2 border-slate-300 hover:border-teal-500'
                        }`}
                        title={isConcluida ? 'Tarefa Concluída (clique para desmarcar bisga)' : 'Marcar Bisga de Conclusão (✔)'}
                      >
                        {isConcluida ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-xs bg-transparent" />
                        )}
                      </button>

                      {/* Informações da Tarefa */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            #{index + 1}
                          </span>
                          <h4 className={`text-xs font-bold leading-snug ${
                            isConcluida ? 'text-slate-800 line-through opacity-85' : 'text-slate-900'
                          }`}>
                            {tarefa.titulo}
                          </h4>

                          {/* Badge de Periodicidade */}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            tarefa.periodicidade === 'inicio_ano' 
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : tarefa.periodicidade === 'trimestral'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : tarefa.periodicidade === 'mensal'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tarefa.periodicidade === 'inicio_ano' && 'Início do Ano'}
                            {tarefa.periodicidade === 'trimestral' && (tarefa.trimestre ? `${tarefa.trimestre}º Trimestre` : 'Trimestral')}
                            {tarefa.periodicidade === 'mensal' && (tarefa.mes ? `Mensal (${MESES_NOMES[tarefa.mes - 1]})` : 'Mensal')}
                            {tarefa.periodicidade === 'durante_ano' && 'Durante o Ano'}
                            {tarefa.periodicidade === 'anual' && 'Anual'}
                          </span>

                          {/* Estado de Conclusão / Data */}
                          {isConcluida && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Concluída{tarefa.dataConclusao ? ` (${tarefa.dataConclusao})` : ''}
                            </span>
                          )}
                        </div>

                        {tarefa.descricao && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {tarefa.descricao}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono flex-wrap pt-0.5">
                          {tarefa.prazoDescritivo && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Prazo: <strong>{tarefa.prazoDescritivo}</strong>
                            </span>
                          )}
                          {tarefa.responsavel && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <User className="w-3 h-3 text-slate-400" />
                              Resp: {tarefa.responsavel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Zona Direita: Ações Rápidas & Botões de Edição */}
                    <div className="flex items-center gap-2 shrink-0 md:self-center pl-11 md:pl-0">
                      {/* Ação Rápida Específica (Exemplos solicitados pelo utilizador) */}
                      {tarefa.acaoRapidaTipo === 'atualizar_formacoes' && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('tabela')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <span>Registo Geral</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {tarefa.acaoRapidaTipo === 'atualizar_burocracias' && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('burocracia')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <span>Burocracias</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {(tarefa.acaoRapidaTipo === 'relatorio_trimestral' || tarefa.acaoRapidaTipo === 'relatorio_anual') && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('relatorios')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <span>Relatórios</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {tarefa.acaoRapidaTipo === 'email_enfermagem_tania' && (
                        <button
                          type="button"
                          onClick={() => handlePrepararEmailTania(tarefa)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#0078D4] hover:bg-[#0060A8] rounded cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Enviar email via Outlook à Enf.ª Tânia para solicitar RPF de Enfermagem"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Solicitar à Enf.ª Tânia</span>
                        </button>
                      )}

                      {/* Botão de Edição */}
                      <button
                        type="button"
                        onClick={() => handleAbrirEditarTarefa(tarefa)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                        title="Editar esta tarefa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Botão de Eliminação */}
                      <button
                        type="button"
                        onClick={() => handlePedirEliminarTarefa(tarefa.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        title="Eliminar tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── VISTA 2: CRONOGRAMA ANUAL & MENSAL DE TAREFAS ─── */}
      {viewMode === 'cronograma' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>Cronograma Anual de Tarefas da Qualidade ({anoAtual})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Distribuição temporal das obrigações da qualidade por Trimestre e Mês, com registo de execução.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMesSelecionadoCronograma('todos');
                    setTrimestreSelecionadoCronograma('todos');
                  }}
                  className="text-xs text-teal-700 hover:underline cursor-pointer font-semibold"
                >
                  Ver Ano Completo
                </button>
              </div>
            </div>

            {/* Seletor Visual de Trimestres */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[1, 2, 3, 4].map(trim => {
                const tarefasDoTrim = tarefas.filter(t => t.trimestre === trim || (t.mes && Math.ceil(t.mes / 3) === trim));
                const concluidasDoTrim = tarefasDoTrim.filter(t => t.concluida).length;
                const percTrim = tarefasDoTrim.length > 0 ? Math.round((concluidasDoTrim / tarefasDoTrim.length) * 100) : 0;
                const isSelected = trimestreSelecionadoCronograma === trim;

                return (
                  <div
                    key={trim}
                    onClick={() => {
                      setTrimestreSelecionadoCronograma(isSelected ? 'todos' : trim);
                      setMesSelecionadoCronograma('todos');
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-200 shadow-2xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>{trim}º Trimestre</span>
                      <span className="font-mono text-[11px] text-teal-800">{percTrim}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {trim === 1 && 'Jan · Fev · Mar'}
                      {trim === 2 && 'Abr · Mai · Jun'}
                      {trim === 3 && 'Jul · Ago · Set'}
                      {trim === 4 && 'Out · Nov · Dez'}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${percTrim}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5 font-mono text-right">
                      {concluidasDoTrim}/{tarefasDoTrim.length} com bisga
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendário Mensal do Cronograma */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MESES_NOMES.map((nomeMes, idxMes) => {
              const mesNum = idxMes + 1;
              const trimNum = Math.ceil(mesNum / 3);
              
              // Se houver filtro de trimestre e este mês não pertencer, oculta
              if (trimestreSelecionadoCronograma !== 'todos' && trimNum !== trimestreSelecionadoCronograma) {
                return null;
              }
              // Se houver filtro de mês e não for este, oculta
              if (mesSelecionadoCronograma !== 'todos' && mesNum !== mesSelecionadoCronograma) {
                return null;
              }

              // Tarefas deste mês ou trimestrais que calham neste mês (fecho de trimestre)
              const tarefasMes = tarefas.filter(t => {
                if (t.mes === mesNum) return true;
                if (t.periodicidade === 'inicio_ano' && mesNum === 1) return true;
                if (t.periodicidade === 'trimestral' && (mesNum === 3 && t.trimestre === 1)) return true;
                if (t.periodicidade === 'trimestral' && (mesNum === 6 && t.trimestre === 2)) return true;
                if (t.periodicidade === 'trimestral' && (mesNum === 9 && t.trimestre === 3)) return true;
                if (t.periodicidade === 'trimestral' && (mesNum === 12 && t.trimestre === 4)) return true;
                return false;
              });

              const tarefasMesFiltradas = tarefasMes.filter(t => {
                if (filtroStatus === 'pendentes' && t.concluida) return false;
                if (filtroStatus === 'concluidas' && !t.concluida) return false;
                if (buscaTexto.trim() !== '') {
                  return t.titulo.toLowerCase().includes(buscaTexto.toLowerCase());
                }
                return true;
              });

              const concluidasMes = tarefasMes.filter(t => t.concluida).length;
              const percMes = tarefasMes.length > 0 ? Math.round((concluidasMes / tarefasMes.length) * 100) : 0;
              const mesAtualReal = new Date().getMonth() + 1;
              const isMesAtual = mesNum === mesAtualReal;

              return (
                <div 
                  key={mesNum} 
                  className={`bg-white rounded-lg border shadow-2xs overflow-hidden flex flex-col ${
                    isMesAtual ? 'border-teal-400 ring-1 ring-teal-200' : 'border-slate-200'
                  }`}
                >
                  {/* Cabeçalho do Mês */}
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isMesAtual ? 'bg-teal-50/70 border-teal-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{nomeMes}</span>
                        {isMesAtual && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded font-mono">
                            Mês Atual
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {trimNum}º Trimestre · {anoAtual}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-teal-800">{percMes}%</span>
                      <span className="text-[10px] text-slate-400 block">{concluidasMes}/{tarefasMes.length}</span>
                    </div>
                  </div>

                  {/* Lista de Tarefas do Mês */}
                  <div className="p-3 space-y-2 flex-1 max-h-[300px] overflow-y-auto">
                    {tarefasMesFiltradas.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-4 text-center">
                        Nenhuma tarefa para este período.
                      </p>
                    ) : (
                      tarefasMesFiltradas.map(t => {
                        const isDone = t.concluida;

                        return (
                          <div 
                            key={t.id}
                            className={`p-2 rounded border transition-colors flex items-start gap-2 ${
                              isDone ? 'bg-emerald-50/40 border-emerald-200 text-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Botão Bisga */}
                            <button
                              type="button"
                              onClick={() => handleToggleBisga(t.id)}
                              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                                isDone 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-white text-slate-300 hover:text-teal-600 border border-slate-300 hover:border-teal-400'
                              }`}
                              title={isDone ? 'Desmarcar bisga' : 'Marcar bisga (✔)'}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className={`text-[11px] font-semibold leading-snug ${
                                isDone ? 'line-through opacity-80 text-slate-600' : 'text-slate-900'
                              }`}>
                                {t.titulo}
                              </p>

                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-1">
                                <span>{t.prazoDescritivo || 'Mensal'}</span>
                                {t.acaoRapidaTipo === 'email_enfermagem_tania' && (
                                  <button
                                    onClick={() => handlePrepararEmailTania(t)}
                                    className="text-blue-700 hover:underline font-bold"
                                  >
                                    ✉ Enf.ª Tânia
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── VISTA 3: CRITÉRIOS DE RELEVÂNCIA & NOTAS REGULAMENTARES ─── */}
      {viewMode === 'criterios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 5 Critérios de Relevância */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-700" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Critérios de Inclusão de Relevância para Formações (2ª Página da Norma)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Só serão consideradas as formações que preencham <strong>3 ou mais critérios</strong>:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {CRITERIOS_RELEVANCIA_QUALIDADE.map(crit => (
                <div key={crit.num} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    {crit.num}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{crit.titulo}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{crit.descricao}</p>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded font-mono mt-1.5 inline-block">
                      Avaliação: Sim ou Não
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas Regulamentares & Prazos Oficiais */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Prazos Regulamentares de Certificados & Documentos
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Regras oficiais hospitalares de auditoria do Serviço de Radioterapia:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {NOTAS_REGULAMENTARES_QUALIDADE.map((nota, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 space-y-1">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{nota.regra}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed pl-6">
                    {nota.detalhe}
                  </p>
                </div>
              ))}

              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-2 mt-4">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  Dica de Boas Práticas da Qualidade:
                </span>
                <p className="text-[11px] text-teal-900 leading-relaxed">
                  As tarefas com o símbolo <strong>✉ Enf.ª Tânia</strong> permitem o disparo imediato de uma mensagem de email via Outlook com as minutas oficiais pré-preenchidas, acelerando a recolha do Registo de Presenças (RPF) e das formações de enfermagem.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE ADIÇÃO / EDIÇÃO DE TAREFA ─── */}
      {modalTarefaAberto && tarefaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-5 py-3.5 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  {tarefas.some(t => t.id === tarefaEditando.id) ? 'Editar Tarefa da Qualidade' : 'Nova Tarefa da Qualidade'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTarefaAberto(false)}
                className="p-1 hover:bg-teal-700 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarTarefaForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={tarefaEditando.titulo}
                  onChange={(e) => setTarefaEditando({ ...tarefaEditando, titulo: e.target.value })}
                  placeholder="Ex: Atualizar registo de formações, Enviar relatório trimestral..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Descrição e Orientações Operacionais
                </label>
                <textarea
                  rows={2}
                  value={tarefaEditando.descricao || ''}
                  onChange={(e) => setTarefaEditando({ ...tarefaEditando, descricao: e.target.value })}
                  placeholder="Instruções sobre como executar esta tarefa de qualidade..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Periodicidade
                  </label>
                  <select
                    value={tarefaEditando.periodicidade}
                    onChange={(e) => setTarefaEditando({ ...tarefaEditando, periodicidade: e.target.value as PeriodicidadeTarefa })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="inicio_ano">Início do Ano</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Final do Trimestre</option>
                    <option value="durante_ano">Durante o Ano</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mês Previsto
                  </label>
                  <select
                    value={tarefaEditando.mes || ''}
                    onChange={(e) => setTarefaEditando({ ...tarefaEditando, mes: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Não especificado</option>
                    {MESES_NOMES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Prazo Descritivo
                  </label>
                  <input
                    type="text"
                    value={tarefaEditando.prazoDescritivo || ''}
                    onChange={(e) => setTarefaEditando({ ...tarefaEditando, prazoDescritivo: e.target.value })}
                    placeholder="Ex: Até final de Janeiro, Fim do Trimestre..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={tarefaEditando.responsavel || ''}
                    onChange={(e) => setTarefaEditando({ ...tarefaEditando, responsavel: e.target.value })}
                    placeholder="Ex: Responsável da Qualidade, Enf.ª Tânia..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Atalho de Ação Rápida
                  </label>
                  <select
                    value={tarefaEditando.acaoRapidaTipo || 'outro'}
                    onChange={(e) => setTarefaEditando({ ...tarefaEditando, acaoRapidaTipo: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="outro">Sem atalho rápido</option>
                    <option value="atualizar_formacoes">Atalho: Registo de Formações</option>
                    <option value="atualizar_burocracias">Atalho: Matriz de Burocracias</option>
                    <option value="relatorio_trimestral">Atalho: Relatórios Trimestrais</option>
                    <option value="relatorio_anual">Atalho: Relatório Anual</option>
                    <option value="email_enfermagem_tania">Atalho: Email Outlook à Enf.ª Tânia</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chkConcluidaModal"
                    checked={tarefaEditando.concluida}
                    onChange={(e) => setTarefaEditando({ 
                      ...tarefaEditando, 
                      concluida: e.target.checked,
                      dataConclusao: e.target.checked ? new Date().toISOString().slice(0, 10) : undefined
                    })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="chkConcluidaModal" className="font-bold text-slate-800 cursor-pointer">
                    Marcar já como concluída (Bisga ✔)
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalTarefaAberto(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Guardar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL EMAIL SOLICITAÇÃO ENFERMAGEM (ENF.ª TÂNIA) ─── */}
      {modalEmailTaniaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-5 py-3.5 bg-[#0078D4] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Disparar Email via Outlook · Solicitar Formações de Enfermagem
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEmailTaniaAberto(false)}
                className="p-1 hover:bg-[#0060A8] rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-blue-950 font-bold">
                  <span>Destinatário Oficial:</span>
                  <span className="font-mono">{colabTania.email}</span>
                </div>
                <div className="text-[11px] text-blue-900">
                  <strong>Colaborador:</strong> {colabTania.nome} ({colabTania.sigla} - {colabTania.cargo})
                </div>
                <div className="text-[10px] text-blue-800 font-mono">
                  CC: chefia.radioterapia@ulsar.min-saude.pt; coordenacao.qualidade@ulsar.min-saude.pt
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assunto da Mensagem:
                </label>
                <input
                  type="text"
                  readOnly
                  value={`[RadForm · ULSAR] Solicitação de Registo de Presenças (RPF) e Formações de Enfermagem · ${anoAtual}`}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Corpo do Email Formatado (Norma de Qualidade):
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 font-sans space-y-2 max-h-48 overflow-y-auto leading-relaxed">
                  <p>Exma. Colega Enf.ª Tânia Vitoriano,</p>
                  <p>No âmbito da Gestão da Qualidade e do acompanhamento do Plano de Formação do Serviço de Radioterapia da ULSAR para o ano civil de {anoAtual}, solicitamos o envio das informações e respetiva documentação das ações formativas da equipa de Enfermagem:</p>
                  <ul className="list-disc list-inside space-y-1 font-medium pl-1">
                    <li>Folhas de Registo de Presença de Formandos (RPF) devidamente preenchidas e assinadas;</li>
                    <li>Comprovativos de frequência ou certificados das ações realizadas no período;</li>
                    <li>Atualização do plano de necessidades e calendarização das próximas ações formativas.</li>
                  </ul>
                  <p>Agradecemos o envio dos ficheiros com a brevidade possível para efeitos de consolidação e auditoria hospitalar.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 italic">
                  Ao abrir o Outlook ou copiar a mensagem, a tarefa será marcada com a bisga (✔) de concluída.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCopiarTextoEmailTania();
                      if (tarefaParaEmailTania) {
                        handleToggleBisga(tarefaParaEmailTania.id);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    {copiadoEmailTania ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-emerald-700 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Mensagem</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEmailTaniaAberto(false)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleDispararOutlookTania}
                    className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#0060A8] text-white rounded font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Abrir Outlook & Marcar Bisga</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMAÇÃO DE ELIMINAÇÃO ─── */}
      {tarefaParaEliminarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Eliminar Tarefa do Plano?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Esta ação irá remover a tarefa da lista deste ano civil.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTarefaParaEliminarId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarTarefa}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer transition-colors shadow-2xs"
              >
                Confirmar Eliminação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMAÇÃO DE RESTAURAÇÃO PADRÃO ─── */}
      {modalRestaurarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Repor Tarefas Oficiais da Qualidade?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deseja repor a lista oficial de tarefas da qualidade conforme a documentação hospitalar? As alterações manuais serão reinicializadas.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalRestaurarAberto(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRestaurarPadrao}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer transition-colors shadow-2xs"
              >
                Repor Lista Oficial
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
