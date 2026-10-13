import React, { useState, useMemo } from 'react';
import { 
  Formacao, 
  Colaborador, 
  FormacaoCategoria, 
  DestinatarioGrupo,
  DESTINATARIOS_INFO,
  ConfiguracoesApp,
  SubtipoBurocracia,
  MATRIZ_BUROCRACIA,
  RequisitosDocumentais,
  DocumentosValidacaoFormacao
} from '../types';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Paperclip, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload,
  Clock,
  Award,
  Users,
  AlertCircle,
  FileCheck,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  ArrowUpDown,
  Calendar
} from 'lucide-react';
import { exportFormacoesToExcel } from '../utils/exportUtils';

interface TrainingTableProps {
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
  configuracoes?: ConfiguracoesApp;
  onEdit: (formacao: Formacao) => void;
  onDelete: (id: string) => void;
  onToggleRealizada: (id: string) => void;
  onToggleBurocracia: (id: string) => void;
  onViewCertificado: (formacao: Formacao) => void;
  onOpenNovoRegisto: () => void;
  onOpenImportPnf: () => void;
  onOpenImportRealizadas?: () => void;
  onOpenConfigurarExcel: () => void;
  onAbrirEmailOutlook: (formacao: Formacao) => void;
  onNavigateToBurocracia?: (formacaoId: string) => void;
}

export const TrainingTable: React.FC<TrainingTableProps> = ({
  formacoes,
  colaboradores,
  anoAtual,
  configuracoes,
  onEdit,
  onDelete,
  onToggleRealizada,
  onToggleBurocracia,
  onViewCertificado,
  onOpenNovoRegisto,
  onOpenImportPnf,
  onOpenImportRealizadas,
  onOpenConfigurarExcel,
  onAbrirEmailOutlook,
  onNavigateToBurocracia
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [selectedDestinatario, setSelectedDestinatario] = useState<string>('todos');
  const [selectedColaborador, setSelectedColaborador] = useState<string>('todos');
  const [selectedPnf, setSelectedPnf] = useState<string>('todos');
  const [selectedBurocracia, setSelectedBurocracia] = useState<string>('todos');
  const [ordemCronologica, setOrdemCronologica] = useState<'desc' | 'asc'>('desc');

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedCategoria !== 'todas' ||
    selectedDestinatario !== 'todos' ||
    selectedColaborador !== 'todos' ||
    selectedPnf !== 'todos' ||
    selectedBurocracia !== 'todos'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('todas');
    setSelectedDestinatario('todos');
    setSelectedColaborador('todos');
    setSelectedPnf('todos');
    setSelectedBurocracia('todos');
  };

  // Identificação e separação de formações ReCap
  const isRecapFormacao = (f: Formacao): boolean => {
    const cod = (f.codigo || '').toLowerCase().trim();
    const nome = (f.nome || '').toLowerCase().trim();
    if (cod.startsWith('recap') || cod.includes('recap')) return true;
    if (nome.startsWith('recap') || nome.includes('recap:')) return true;
    if (configuracoes?.recapCodigos && configuracoes.recapCodigos.some(rc => rc.codigo.toLowerCase().trim() === cod)) {
      return true;
    }
    return false;
  };

  // Filtragem e ordenação reativa das formações:
  // - Ordem cronológica para todas as formações exceto formações ReCap
  // - Formações ReCap organizadas alfabeticamente e no final de todas as formações realizadas
  const filteredFormacoes = useMemo(() => {
    const filtradas = formacoes.filter(f => {
      // Filtro de ano
      if (f.ano !== anoAtual) return false;

      // Filtro de pesquisa de texto
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesName = f.nome.toLowerCase().includes(query);
        const matchesCode = (f.codigo || '').toLowerCase().includes(query);
        const matchesObs = (f.observacoes || '').toLowerCase().includes(query);
        const matchesColab = f.colaboradores.some(c => c.toLowerCase().includes(query));
        if (!matchesName && !matchesCode && !matchesObs && !matchesColab) {
          return false;
        }
      }

      // Filtro de Categoria
      if (selectedCategoria !== 'todas' && f.categoria !== selectedCategoria) {
        return false;
      }

      // Filtro de Destinatário
      if (selectedDestinatario !== 'todos' && !f.destinatarios.includes(selectedDestinatario as DestinatarioGrupo)) {
        return false;
      }

      // Filtro de Colaborador
      if (selectedColaborador !== 'todos' && !f.colaboradores.includes(selectedColaborador)) {
        return false;
      }

      // Filtro de PNF
      if (selectedPnf !== 'todos' && f.incluidaPlanoNecessidades !== selectedPnf) {
        return false;
      }

      // Filtro de Burocracia
      if (selectedBurocracia !== 'todos') {
        const querValidada = selectedBurocracia === 'sim';
        if (f.burocracia !== querValidada) return false;
      }

      return true;
    });

    // Separar formações padrão das formações ReCap
    const normais = filtradas.filter(f => !isRecapFormacao(f));
    const recaps = filtradas.filter(f => isRecapFormacao(f));

    // 1. Formações normais são ordenadas cronologicamente
    normais.sort((a, b) => {
      const timeA = a.data ? new Date(a.data).getTime() : 0;
      const timeB = b.data ? new Date(b.data).getTime() : 0;
      if (timeA !== timeB) {
        return ordemCronologica === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return (b.codigo || '').localeCompare(a.codigo || '');
    });

    // 2. Formações ReCap organizadas alfabeticamente e colocadas no final de todas as formações
    recaps.sort((a, b) => {
      const compNome = a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' });
      if (compNome !== 0) return compNome;
      return (a.codigo || '').localeCompare(b.codigo || '', 'pt', { sensitivity: 'base' });
    });

    return [...normais, ...recaps];
  }, [formacoes, anoAtual, searchTerm, selectedCategoria, selectedDestinatario, selectedColaborador, selectedPnf, selectedBurocracia, ordemCronologica, configuracoes]);

  // Indicadores rápidos
  const totalHorasFiltradas = useMemo(() => {
    return filteredFormacoes.reduce((acc, curr) => acc + (curr.horas || 0), 0);
  }, [filteredFormacoes]);

  const totalComBurocraciaOk = useMemo(() => {
    return filteredFormacoes.filter(f => f.burocracia).length;
  }, [filteredFormacoes]);

  const totalRealizadas = useMemo(() => {
    return filteredFormacoes.filter(f => f.realizada).length;
  }, [filteredFormacoes]);

  const totalNoPnf = useMemo(() => {
    return filteredFormacoes.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
  }, [filteredFormacoes]);

  return (
    <div className="space-y-4">
      
      {/* Resumo de Indicadores da Tabela */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">Formações Registadas</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {filteredFormacoes.length} <span className="text-xs font-normal text-slate-500">ações ({anoAtual})</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">Volume Total de Horas</span>
          <span className="text-xl font-bold text-teal-700 tabular-nums font-mono">
            {totalHorasFiltradas.toLocaleString('pt-PT')} <span className="text-xs font-normal text-slate-500">horas</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">Validação de Realização</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {filteredFormacoes.length > 0 ? Math.round((totalRealizadas / filteredFormacoes.length) * 100) : 0}%
            <span className="text-xs font-normal text-slate-500 ml-1">({totalRealizadas}/{filteredFormacoes.length})</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">Conformidade Burocrática</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {filteredFormacoes.length > 0 ? Math.round((totalComBurocraciaOk / filteredFormacoes.length) * 100) : 0}%
            <span className="text-xs font-normal text-slate-500 ml-1">({totalComBurocraciaOk}/{filteredFormacoes.length})</span>
          </span>
        </div>
      </div>

      {/* Barra de Pesquisa, Filtros e Ações da Tabela */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        
        {/* Linha 1: Campo de Busca e Filtros Dropdowns */}
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar formação por nome, código, sigla do colaborador ou palavras-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden transition-all"
            />
          </div>

          {/* Grupo de Filtros Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Categoria */}
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              title="Filtrar por Categoria"
            >
              <option value="todas">Todas Categorias</option>
              <option value="Externa">Externa</option>
              <option value="Interna">Interna</option>
              <option value="Enfermagem">Enfermagem</option>
              <option value="ACAF">ACAF</option>
            </select>

            {/* Destinatário */}
            <select
              value={selectedDestinatario}
              onChange={(e) => setSelectedDestinatario(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              title="Filtrar por Destinatários"
            >
              <option value="todos">Todos Destinatários</option>
              <option value="TSDT">TSDT</option>
              <option value="ENF">ENF</option>
              <option value="MR">MR</option>
              <option value="FIS">FIS</option>
              <option value="AT">AT</option>
              <option value="AO">AO</option>
            </select>

            {/* Colaborador */}
            <select
              value={selectedColaborador}
              onChange={(e) => setSelectedColaborador(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden max-w-[140px]"
              title="Filtrar por Colaborador"
            >
              <option value="todos">Colaborador: Todos</option>
              {[...colaboradores]
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }))
                .map(c => (
                  <option key={c.id} value={c.sigla}>
                    {c.sigla} - {c.nome}
                  </option>
                ))}
            </select>

            {/* PNF */}
            <select
              value={selectedPnf}
              onChange={(e) => setSelectedPnf(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              title="Filtrar por Inclusão no PNF"
            >
              <option value="todos">PNF: Todos</option>
              <option value="Sim">No PNF (Sim)</option>
              <option value="Não">Fora do PNF (Não)</option>
            </select>

            {/* Alternar Ordem Cronológica */}
            <button
              onClick={() => setOrdemCronologica(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title={`Alternar ordenação cronológica das formações (atual: ${ordemCronologica === 'desc' ? 'Mais recentes no topo' : 'Mais antigas no topo'})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-700" />
              <span>{ordemCronologica === 'desc' ? 'Mais Recentes ↓' : 'Mais Antigas ↑'}</span>
            </button>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                title="Limpar todos os filtros de pesquisa"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}

          </div>
        </div>

        {/* Linha 2: Barra de Ações - Todos os Botões de Importar e Ações Principais no Mesmo Lado */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          {/* Lado Esquerdo: Contador de registos listados */}
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span>
              A apresentar <strong className="text-slate-900 font-bold font-mono">{filteredFormacoes.length}</strong> {filteredFormacoes.length === 1 ? 'formação' : 'formações'}
              {filteredFormacoes.length !== formacoes.filter(f => f.ano === anoAtual).length && (
                <span className="text-slate-400 font-normal ml-1">
                  (de {formacoes.filter(f => f.ano === anoAtual).length} no ano {anoAtual})
                </span>
              )}
            </span>
          </div>

          {/* Lado Direito: Todos os Botões de Importar e Ações Agrupados no Mesmo Lado */}
          <div className="flex flex-wrap items-center gap-2 sm:self-auto self-stretch justify-start sm:justify-end">
            {/* Botão Principal: Nova Formação (mesmo tom de verde de Importar Formações e posicionado antes) */}
            <button
              onClick={onOpenNovoRegisto}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="Registar nova formação no sistema"
            >
              <Plus className="w-3.5 h-3.5 text-teal-200" />
              <span>Nova Formação</span>
            </button>

            {/* Botão 1: Importar Formações */}
            {onOpenImportRealizadas && (
              <button
                onClick={onOpenImportRealizadas}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                title="Importar lista de formações realizadas (PDF, DOC, JPEG, PNG)"
              >
                <Upload className="w-3.5 h-3.5 text-teal-200" />
                <span>Importar Formações</span>
              </button>
            )}

            {/* Botão 2: Importar Plano Anual (PNF) */}
            <button
              onClick={onOpenImportPnf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="Importar Plano Anual e verificar automaticamente inclusão no PNF"
            >
              <FileCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Importar Plano Anual (PNF)</span>
            </button>

            {/* Botão 3: Exportar Excel */}
            <button
              onClick={onOpenConfigurarExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="Definir campos e exportar para Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

      </div>

      {/* TABELA DE DADOS COM CABEÇALHO FIXO (STICKY HEADER) E NOME DA FORMAÇÃO FIXO AO SCROLL (STICKY COLUMN) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden relative">
        <div className="overflow-auto max-h-[70vh] relative scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Header Sticky (Fixado no topo ao fazer scroll down) */}
            <thead className="sticky top-0 z-30 bg-amber-100/95 backdrop-blur-xs shadow-xs border-b border-amber-300 select-none">
              <tr className="text-slate-900 font-bold text-[11px] leading-tight">
                
                {/* Col 0: Burocracia (Fixa à esquerda) */}
                <th className="sticky left-0 z-40 bg-amber-100 py-3 px-1.5 text-center w-12 border-r border-amber-200 shadow-xs" title="Burocracia validada (pisga)">
                  Buroc.
                </th>

                {/* Col 1: Realizada (Fixa à esquerda após col 0) */}
                <th className="sticky left-12 z-40 bg-amber-100 py-3 px-1.5 text-center w-12 border-r border-amber-200 shadow-xs" title="Formação Realizada (pisga)">
                  Realiz.
                </th>

                {/* Col 2: Nome da Formação (Fixa à esquerda mantendo-se sempre visível ao scrollar para a direita) */}
                <th className="sticky left-24 z-40 bg-amber-100 py-3 px-3 min-w-[280px] border-r border-amber-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                  Nome da Formação
                </th>

                {/* Colunas Restantes com Largura Aumentada e Whitespace-Nowrap */}
                <th className="py-3 px-2.5 text-center min-w-[95px] border-r border-amber-200">
                  Tipo / Categoria
                </th>

                <th className="py-3 px-2.5 text-center min-w-[110px] border-r border-amber-200">
                  Destinatários
                </th>

                <th className="py-3 px-2.5 text-center min-w-[120px] whitespace-nowrap border-r border-amber-200">
                  Data da Realização
                </th>

                <th className="py-3 px-2 text-center w-20 border-r border-amber-200" title="Frequentada por Colaborador RAD">
                  Freq. RAD
                </th>

                {/* COLUNA DAS HORAS: AUMENTADA E SEM QUEBRA DE LINHA (WHITESPACE-NOWRAP) */}
                <th className="py-3 px-3 text-center min-w-[115px] whitespace-nowrap border-r border-amber-200 font-mono" title="Duração Total em Horas">
                  Horas (h)
                </th>

                {/* COLUNA DO CÓDIGO: AUMENTADA E SEM QUEBRA DE LINHA (WHITESPACE-NOWRAP, VISÍVEL PARA RECAP) */}
                <th className="py-3 px-3 text-center min-w-[150px] whitespace-nowrap border-r border-amber-200 font-mono" title="Código da Formação">
                  Código Formação
                </th>

                <th className="py-3 px-2 text-center w-20 border-r border-amber-200">
                  Relevância
                </th>

                <th className="py-3 px-2 text-center min-w-[95px] border-r border-amber-200" title="Incluída no Plano de Necessidades Formativas">
                  No PNF
                </th>

                <th className="py-3 px-2 text-center min-w-[95px] border-r border-amber-200">
                  Certificado
                </th>

                <th className="py-3 px-3 text-center min-w-[220px] border-r border-amber-200">
                  Observações & Colaboradores
                </th>

                <th className="py-3 px-2.5 text-center min-w-[105px] sticky right-0 z-30 bg-amber-100 border-l border-amber-200">
                  Ações & Outlook
                </th>
              </tr>
            </thead>

            {/* Linhas da Tabela */}
            <tbody className="divide-y divide-slate-100">
              {filteredFormacoes.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-14 text-center text-slate-500 bg-white">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Nenhuma formação registada para os filtros aplicados</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste a pesquisa ou clique abaixo para introduzir um novo registo.</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={onOpenNovoRegisto}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-md cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-200" />
                        <span>Nova Formação</span>
                      </button>
                      {onOpenImportRealizadas && (
                        <button
                          onClick={onOpenImportRealizadas}
                          className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-300 rounded-md hover:bg-teal-100 cursor-pointer inline-flex items-center gap-1.5"
                          title="Importar lista de ficheiros (PDF, DOC, JPEG, PNG)"
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-700" />
                          <span>Importar Formações</span>
                        </button>
                      )}
                      <button
                        onClick={onOpenImportPnf}
                        className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-300 rounded-md hover:bg-teal-100 cursor-pointer inline-flex items-center gap-1.5"
                        title="Importar Plano Anual (PNF)"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-teal-700" />
                        <span>Importar Plano Anual (PNF)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFormacoes.map((formacao) => {
                  return (
                    <tr 
                      key={formacao.id} 
                      className="hover:bg-amber-50/40 transition-colors group text-slate-700"
                    >
                      {/* Burocracia pisga (Sticky left-0) */}
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-amber-50/90 py-2.5 px-1.5 text-center border-r border-slate-100 shadow-xs">
                        <button
                          onClick={() => onToggleBurocracia(formacao.id)}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center transition-colors cursor-pointer ${
                            formacao.burocracia 
                              ? 'text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold border border-teal-200' 
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title={formacao.burocracia ? 'Burocracia validada (pisga ativa)' : 'Burocracia pendente (clique para validar)'}
                        >
                          {formacao.burocracia ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="text-xs">·</span>
                          )}
                        </button>
                      </td>

                      {/* Realizada pisga (Sticky left-12) */}
                      <td className="sticky left-12 z-20 bg-white group-hover:bg-amber-50/90 py-2.5 px-1.5 text-center border-r border-slate-100 shadow-xs">
                        <button
                          onClick={() => onToggleRealizada(formacao.id)}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center transition-colors cursor-pointer ${
                            formacao.realizada 
                              ? 'text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold border border-teal-200' 
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title={formacao.realizada ? 'Formação Realizada (pisga ativa)' : 'Pendente de realização'}
                        >
                          {formacao.realizada ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="text-xs">·</span>
                          )}
                        </button>
                      </td>

                      {/* Nome da Formação (Sticky left-24 mantendo-se sempre fixo ao scrollar a informação para a direita) */}
                      <td className="sticky left-24 z-20 bg-white group-hover:bg-amber-50/90 py-2.5 px-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] min-w-[280px]">
                        <span className="font-semibold text-slate-900 block leading-tight text-xs">
                          {formacao.nome}
                        </span>
                        {formacao.colaboradores && formacao.colaboradores.length > 0 && (
                          <span className="text-[11px] text-teal-800 font-mono mt-0.5 block truncate max-w-[260px]">
                            Part: {formacao.colaboradores.join(', ')}
                          </span>
                        )}
                      </td>

                      {/* Tipo / Categoria */}
                      <td className="py-2.5 px-2.5 border-r border-slate-100 whitespace-nowrap text-center">
                        <span className="text-slate-800 font-semibold text-xs">
                          {formacao.categoria}
                        </span>
                      </td>

                      {/* Destinatários */}
                      <td className="py-2.5 px-2.5 border-r border-slate-100 text-[11px] text-slate-600 font-medium text-center">
                        {formacao.destinatarios.join(', ')}
                      </td>

                      {/* Data da Realização */}
                      <td className="py-2.5 px-2.5 border-r border-slate-100 whitespace-nowrap tabular-nums text-slate-700 font-mono text-[11px] text-center">
                        {formacao.data}
                        {formacao.dataFim && ` a ${formacao.dataFim}`}
                      </td>

                      {/* Frequentada por Colaborador RAD */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          formacao.frequentadaColaboradorRad ? 'text-teal-800 bg-teal-50' : 'text-slate-400 bg-slate-50'
                        }`}>
                          {formacao.frequentadaColaboradorRad ? 'Sim' : 'Não'}
                        </span>
                      </td>

                      {/* HORAS: SEM QUEBRA DE LINHA, CENTRADO */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 tabular-nums font-mono font-bold text-slate-900 whitespace-nowrap min-w-[115px]">
                        {formacao.horasTexto ? formacao.horasTexto : `${formacao.horas} h`}
                      </td>

                      {/* CÓDIGO DA FORMAÇÃO: LARGURA ALARGADA, CENTRADO (EX: RECAP, ETC.) */}
                      <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-[11px] font-bold text-teal-900 whitespace-nowrap min-w-[150px] text-center">
                        {formacao.codigo || '-'}
                      </td>

                      {/* Relevância */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          formacao.relevancia === 'Sim' ? 'text-slate-900 font-bold' : 'text-slate-400'
                        }`}>
                          {formacao.relevancia}
                        </span>
                      </td>

                      {/* No Plano (PNF) */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          formacao.incluidaPlanoNecessidades === 'Sim' 
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' 
                            : 'text-slate-500 bg-slate-100'
                        }`}>
                          {formacao.incluidaPlanoNecessidades}
                        </span>
                      </td>

                      {/* Certificado Anexo */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100">
                        {formacao.certificado ? (
                          <button
                            onClick={() => onViewCertificado(formacao)}
                            className="inline-flex items-center justify-center gap-1 px-2 py-0.5 text-[11px] text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 cursor-pointer transition-colors mx-auto"
                            title={`Certificado: ${formacao.certificado.nomeFicheiro} (Clique para visualizar/descarregar)`}
                          >
                            <Paperclip className="w-3 h-3 text-teal-700" />
                            <span className="truncate max-w-[65px] font-mono">{formacao.certificado.nomeFicheiro}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onEdit(formacao)}
                            className="text-[11px] text-slate-400 hover:text-teal-700 transition-colors inline-flex items-center justify-center gap-0.5 cursor-pointer mx-auto"
                            title="Carregar certificado de formação"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Anexar</span>
                          </button>
                        )}
                      </td>

                      {/* Observações */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-[11px] text-slate-600 min-w-[220px] text-center">
                        <div className="line-clamp-2 text-center" title={formacao.observacoes || ''}>
                          {formacao.observacoes || '-'}
                        </div>
                      </td>

                      {/* Ações & Outlook Email (Sticky right) */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap sticky right-0 z-20 bg-white group-hover:bg-amber-50/90 border-l border-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Disparo de Email Outlook 6 Meses - Requisito 14 */}
                          {(() => {
                            const isEmailEnviado = !!(
                              formacao.documentosBurocracia?.emailAvaliacao6Meses || 
                              formacao.documentosBurocracia?.emailEnviadoData
                            );
                            
                            let jaPassaramSeisMeses = false;
                            if (formacao.data) {
                              const match = formacao.data.match(/\d{4}-\d{2}-\d{2}/);
                              if (match) {
                                const dataForm = new Date(match[0]).getTime();
                                const seisMesesEmMs = 180 * 24 * 60 * 60 * 1000;
                                jaPassaramSeisMeses = (Date.now() - dataForm) >= seisMesesEmMs;
                              }
                            }

                            let corBotao = "text-blue-600 hover:text-blue-800 hover:bg-blue-50";
                            let titulo = "Enviar Notificação de Avaliação aos 6 Meses via Outlook";

                            if (isEmailEnviado) {
                              corBotao = "text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold";
                              titulo = `Email aos 6 meses já enviado (${formacao.documentosBurocracia?.emailEnviadoData || 'Enviado'}). Clique para reenviar se necessário.`;
                            } else if (jaPassaramSeisMeses) {
                              corBotao = "text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 animate-pulse font-bold";
                              titulo = "Atenção: Já passaram mais de 6 meses desde a data da formação! O email tem de ser enviado.";
                            }

                            return (
                              <button
                                onClick={() => onAbrirEmailOutlook(formacao)}
                                className={`p-1 rounded transition-colors cursor-pointer relative ${corBotao}`}
                                title={titulo}
                              >
                                <Mail className="w-3.5 h-3.5" />
                                {isEmailEnviado && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                                )}
                                {!isEmailEnviado && jaPassaramSeisMeses && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-1 ring-white" />
                                )}
                              </button>
                            );
                          })()}

                          {/* Editar */}
                          <button
                            onClick={() => onEdit(formacao)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Editar dados da formação"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => onDelete(formacao.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Remover formação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
