import React, { useState, useMemo } from 'react';
import { 
  Formacao, 
  Colaborador, 
  MetaAno, 
  DESTINATARIOS_INFO, 
  FormacaoCategoria, 
  DestinatarioGrupo 
} from '../types';
import { 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Award,
  Users,
  BarChart2,
  FileDown,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { exportRelatorioMensalToExcel, exportRelatorioTrimestralToExcel, exportFormacoesToExcel } from '../utils/exportUtils';
import { MonthlyEvolutionBarChart } from './MonthlyEvolutionBarChart';
import { PerformanceReportPdfModal } from './PerformanceReportPdfModal';

interface ReportsViewProps {
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
  metaAtual: MetaAno;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  formacoes,
  colaboradores,
  anoAtual,
  metaAtual
}) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<'desempenho' | 'mensal' | 'trimestral' | 'anual'>('desempenho');
  const [mesSelecionado, setMesSelecionado] = useState<number>(1); // Janeiro por defeito
  const [trimestreSelecionado, setTrimestreSelecionado] = useState<1 | 2 | 3 | 4>(1); // Q1 por defeito
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Dados consolidados do ano
  const formacoesDoAno = useMemo(() => formacoes.filter(f => f.ano === anoAtual), [formacoes, anoAtual]);
  const totalHorasAno = useMemo(() => formacoesDoAno.reduce((sum, f) => sum + (f.horas || 0), 0), [formacoesDoAno]);
  const totalAcoesAno = formacoesDoAno.length;

  const metaHoras = metaAtual.metaTotalServico || 875;
  const metaAcoes = metaAtual.metaQtdFormacoesServico || 35;

  const percHoras = metaHoras > 0 ? Math.round((totalHorasAno / metaHoras) * 100) : 100;
  const percAcoes = metaAcoes > 0 ? Math.round((totalAcoesAno / metaAcoes) * 100) : 100;

  const acoesPnfAno = useMemo(() => formacoesDoAno.filter(f => f.incluidaPlanoNecessidades === 'Sim').length, [formacoesDoAno]);
  const percPnf = totalAcoesAno > 0 ? Math.round((acoesPnfAno / totalAcoesAno) * 100) : 0;

  const acoesBurocraciaOkAno = useMemo(() => formacoesDoAno.filter(f => f.burocracia).length, [formacoesDoAno]);
  const percBurocracia = totalAcoesAno > 0 ? Math.round((acoesBurocraciaOkAno / totalAcoesAno) * 100) : 0;

  const totalParticipacoes = useMemo(() => formacoesDoAno.reduce((sum, f) => sum + (f.colaboradores?.length || 0), 0), [formacoesDoAno]);
  const mediaHorasPorColaborador = colaboradores.length > 0
    ? (Math.round((totalHorasAno / colaboradores.length) * 10) / 10)
    : 0;

  // Repartição por Categoria Profissional
  const grupos: DestinatarioGrupo[] = ['TSDT', 'FIS', 'ENF', 'MR', 'AT', 'AO'];
  const desempenhoCategorias = useMemo(() => {
    return grupos.map(grp => {
      const colabsGrupo = colaboradores.filter(c => c.categoriaProfissional === grp);
      const acoesGrupo = formacoesDoAno.filter(f => f.destinatarios.includes(grp));

      const horasGrupo = formacoesDoAno.reduce((sum, f) => {
        const temColabDoGrupo = f.colaboradores?.some(sigla => {
          const c = colaboradores.find(col => col.sigla === sigla);
          return c?.categoriaProfissional === grp;
        });
        return temColabDoGrupo ? sum + f.horas : sum;
      }, 0);

      const metaHorasGrupo = colabsGrupo.length * (metaAtual.metaHorasPorColaborador || 35);
      const taxaCumprimento = metaHorasGrupo > 0 ? Math.round((horasGrupo / metaHorasGrupo) * 100) : 100;

      return {
        grupo: grp,
        nomeCompleto: DESTINATARIOS_INFO[grp]?.nomeCompleto || grp,
        totalColabs: colabsGrupo.length,
        totalAcoes: acoesGrupo.length,
        totalHoras: horasGrupo,
        metaHoras: metaHorasGrupo,
        taxaCumprimento
      };
    });
  }, [formacoesDoAno, colaboradores, metaAtual]);

  // Repartição por Tipo de Formação
  const tipos: FormacaoCategoria[] = ['Externa', 'Interna', 'Enfermagem', 'ACAF'];
  const desempenhoTipos = useMemo(() => {
    return tipos.map(t => {
      const subset = formacoesDoAno.filter(f => f.categoria === t);
      const horas = subset.reduce((sum, f) => sum + f.horas, 0);
      return {
        tipo: t,
        acoes: subset.length,
        horas,
        percentagemHoras: totalHorasAno > 0 ? Math.round((horas / totalHorasAno) * 100) : 0
      };
    });
  }, [formacoesDoAno, totalHorasAno]);

  // Formações filtradas de acordo com o tipo de relatório selecionado
  const formacoesFiltradas = useMemo(() => {
    const doAno = formacoes.filter(f => f.ano === anoAtual);

    if (tipoRelatorio === 'anual' || tipoRelatorio === 'desempenho') {
      return doAno;
    }

    if (tipoRelatorio === 'mensal') {
      return doAno.filter(f => {
        const parts = f.data.split('-');
        if (parts.length >= 2) {
          return parseInt(parts[1], 10) === mesSelecionado;
        }
        return false;
      });
    }

    if (tipoRelatorio === 'trimestral') {
      const mesesQ: Record<number, number[]> = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12]
      };
      const permitidos = mesesQ[trimestreSelecionado];
      return doAno.filter(f => {
        const parts = f.data.split('-');
        if (parts.length >= 2) {
          return permitidos.includes(parseInt(parts[1], 10));
        }
        return false;
      });
    }

    return doAno;
  }, [formacoes, anoAtual, tipoRelatorio, mesSelecionado, trimestreSelecionado]);

  // Estatísticas do Relatório em foco
  const totalHoras = useMemo(() => {
    return formacoesFiltradas.reduce((sum, f) => sum + (f.horas || 0), 0);
  }, [formacoesFiltradas]);

  const totalAcoes = formacoesFiltradas.length;

  const acoesNoPnf = useMemo(() => {
    return formacoesFiltradas.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
  }, [formacoesFiltradas]);

  const acoesBurocraciaOk = useMemo(() => {
    return formacoesFiltradas.filter(f => f.burocracia).length;
  }, [formacoesFiltradas]);

  // Horas por Categoria
  const breakdownCategorias = useMemo(() => {
    const cats: FormacaoCategoria[] = ['Externa', 'Interna', 'Enfermagem', 'ACAF'];
    return cats.map(c => {
      const subset = formacoesFiltradas.filter(f => f.categoria === c);
      const horas = subset.reduce((sum, f) => sum + f.horas, 0);
      return { categoria: c, count: subset.length, horas };
    });
  }, [formacoesFiltradas]);

  // Exportar Excel correspondente ao relatório atual
  const handleExportExcel = () => {
    if (tipoRelatorio === 'mensal') {
      exportRelatorioMensalToExcel(formacoes, colaboradores, anoAtual, mesSelecionado);
    } else if (tipoRelatorio === 'trimestral') {
      exportRelatorioTrimestralToExcel(formacoes, colaboradores, anoAtual, trimestreSelecionado);
    } else {
      exportFormacoesToExcel(formacoesFiltradas, colaboradores, anoAtual, `Relatorio_Anual_Servico_RAD_${anoAtual}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tituloRelatorio = useMemo(() => {
    if (tipoRelatorio === 'desempenho') return `Relatório Executivo de Desempenho e Evolução Formativa · Exercício ${anoAtual}`;
    if (tipoRelatorio === 'mensal') return `Relatório Mensal de Formação · ${nomesMeses[mesSelecionado - 1]} de ${anoAtual}`;
    if (tipoRelatorio === 'trimestral') return `Relatório Trimestral de Formação · ${trimestreSelecionado}º Trimestre de ${anoAtual}`;
    return `Relatório Anual Consolidado do Plano de Formação · Ano ${anoAtual}`;
  }, [tipoRelatorio, mesSelecionado, trimestreSelecionado, anoAtual]);

  return (
    <div className="space-y-6">
      
      {/* Barra de Controlo e Configuração do Relatório (No-Print) */}
      <div className="no-print bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        
        {/* Linha Principal: Abas à Esquerda e Botões de Ação Fixos à Direita */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Seletor de Tipo de Relatório */}
          <div className="inline-flex rounded-md bg-slate-100 p-0.5 overflow-x-auto self-start">
            <button
              onClick={() => setTipoRelatorio('desempenho')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tipoRelatorio === 'desempenho' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-teal-700" />
              <span>Desempenho & Gráficos D3</span>
            </button>
            <button
              onClick={() => setTipoRelatorio('anual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                tipoRelatorio === 'anual' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relatório Anual
            </button>
            <button
              onClick={() => setTipoRelatorio('trimestral')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                tipoRelatorio === 'trimestral' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relatório Trimestral
            </button>
            <button
              onClick={() => setTipoRelatorio('mensal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                tipoRelatorio === 'mensal' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relatório Mensal
            </button>
          </div>

          {/* Botões de Ação na Mesma Posição para Todos os Relatórios (Anual, Trimestral e Mensal) */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto ml-0 lg:ml-auto shrink-0">
            {tipoRelatorio !== 'desempenho' && (
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                title="Exportar dados do relatório para Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Exportar Excel</span>
              </button>
            )}

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors cursor-pointer"
              title="Exportar Relatório de Desempenho em PDF profissional com gráficos de barras D3.js"
            >
              <FileDown className="w-4 h-4 text-teal-200" />
              <span>Exportar Relatório de Desempenho (PDF)</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer"
              title="Imprimir relatório atual via navegador"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Linha Secundária de Filtro de Período (Aparece em Mensal ou Trimestral sem Deslocar os Botões de Ação) */}
        {(tipoRelatorio === 'mensal' || tipoRelatorio === 'trimestral') && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-2.5 rounded-md border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="font-semibold text-slate-700">
                {tipoRelatorio === 'mensal' ? 'Mês do Relatório:' : 'Trimestre do Relatório:'}
              </span>
              
              {tipoRelatorio === 'mensal' && (
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(parseInt(e.target.value, 10))}
                  className="py-1 px-3 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  {nomesMeses.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      Mês de {m} ({anoAtual})
                    </option>
                  ))}
                </select>
              )}

              {tipoRelatorio === 'trimestral' && (
                <select
                  value={trimestreSelecionado}
                  onChange={(e) => setTrimestreSelecionado(parseInt(e.target.value, 10) as 1 | 2 | 3 | 4)}
                  className="py-1 px-3 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value={1}>1º Trimestre (Janeiro - Março)</option>
                  <option value={2}>2º Trimestre (Abril - Junho)</option>
                  <option value={3}>3º Trimestre (Julho - Setembro)</option>
                  <option value={4}>4º Trimestre (Outubro - Dezembro)</option>
                </select>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              <span>Formações no período: </span>
              <strong className="text-teal-800 font-bold">{formacoesFiltradas.length}</strong>
              <span className="mx-1.5">·</span>
              <span>Total horas: </span>
              <strong className="text-teal-800 font-bold">{totalHoras} h</strong>
            </div>
          </div>
        )}

      </div>

      {/* Visualização do Relatório (Formatado para Ecrã e Impressão) */}
      {tipoRelatorio === 'desempenho' ? (
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-2xs space-y-8 print:border-none print:shadow-none print:p-0">
          
          {/* Cabeçalho Oficial do Relatório */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-widest">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>Unidade Local de Saúde · ULSAR, EPE</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  Serviço de Radioterapia
                </h1>
                <p className="text-sm font-semibold text-teal-800 mt-0.5">
                  Relatório Oficial de Desempenho e Evolução Formativa · Ciclo {anoAtual}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auditoria Interna de Formação Profissional Contínua & Acreditação da Qualidade
                </p>
              </div>

              <div className="text-right text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
                <p>Data de Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-PT')}</strong></p>
                <p>Exercício: <strong className="text-slate-900 font-bold">{anoAtual}</strong></p>
                <p>Classificação: <span className="text-teal-800 font-bold">Relatório Executivo</span></p>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Exportar em PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. PAINEL DE INDICADORES CHAVE DE DESEMPENHO (KPIS) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>1. Indicadores Chave de Desempenho (KPIs do Serviço)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* KPI 1: Horas */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg">
                <span className="text-[10px] font-semibold text-teal-900 uppercase block">Horas Realizadas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <strong className="text-xl font-bold font-mono text-teal-950">{totalHorasAno}</strong>
                  <span className="text-[11px] text-teal-800 font-mono">/ {metaHoras}h</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1.5 inline-block ${
                  percHoras >= 100 ? 'bg-emerald-200 text-emerald-900' : 'bg-teal-200 text-teal-900'
                }`}>
                  {percHoras}% da Meta
                </span>
              </div>

              {/* KPI 2: Ações */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-[10px] font-semibold text-blue-900 uppercase block">Ações de Formação</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <strong className="text-xl font-bold font-mono text-blue-950">{totalAcoesAno}</strong>
                  <span className="text-[11px] text-blue-800 font-mono">/ {metaAcoes}</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1.5 inline-block ${
                  percAcoes >= 100 ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
                }`}>
                  {percAcoes}% da Meta
                </span>
              </div>

              {/* KPI 3: Taxa PNF */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <span className="text-[10px] font-semibold text-emerald-900 uppercase block">Integração PNF</span>
                <div className="mt-1">
                  <strong className="text-xl font-bold font-mono text-emerald-950">{percPnf}%</strong>
                </div>
                <span className="text-[10px] text-emerald-800 mt-1.5 block">
                  {acoesPnfAno} de {totalAcoesAno} no plano
                </span>
              </div>

              {/* KPI 4: Burocracia */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <span className="text-[10px] font-semibold text-amber-900 uppercase block">Conformidade Burocrática</span>
                <div className="mt-1">
                  <strong className="text-xl font-bold font-mono text-amber-950">{percBurocracia}%</strong>
                </div>
                <span className="text-[10px] text-amber-800 mt-1.5 block">
                  {acoesBurocraciaOkAno} de {totalAcoesAno} validadas
                </span>
              </div>

              {/* KPI 5: Média Horas */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-700 uppercase block">Média / Colaborador</span>
                <div className="mt-1">
                  <strong className="text-xl font-bold font-mono text-slate-900">{mediaHorasPorColaborador} h</strong>
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {colaboradores.length} profissionais
                </span>
              </div>

              {/* KPI 6: Participações */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                <span className="text-[10px] font-semibold text-indigo-900 uppercase block">Participações Totais</span>
                <div className="mt-1">
                  <strong className="text-xl font-bold font-mono text-indigo-950">{totalParticipacoes}</strong>
                </div>
                <span className="text-[10px] text-indigo-800 mt-1.5 block">
                  Presenças individuais
                </span>
              </div>
            </div>
          </div>

          {/* 2. GRÁFICOS DE BARRAS D3 DE EVOLUÇÃO MENSAL DAS FORMAÇÕES */}
          <div className="space-y-2 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-700" />
              <span>2. Evolução Mensal do Volume de Formação (Gráficos Interativos D3.js)</span>
            </h3>

            <MonthlyEvolutionBarChart 
              formacoes={formacoes}
              ano={anoAtual}
              metaHorasAnual={metaHoras}
              metaAcoesAnual={metaAcoes}
              isPrintMode={false}
            />
          </div>

          {/* 3. DESEMPENHO POR GRUPO E CATEGORIA PROFISSIONAL */}
          <div className="space-y-3 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>3. Desempenho e Cumprimento por Grupo Profissional</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold">
                    <th className="py-2.5 px-3">Grupo Profissional</th>
                    <th className="py-2.5 px-2 text-center w-20">Efetivo</th>
                    <th className="py-2.5 px-2 text-center w-24">Ações Destinadas</th>
                    <th className="py-2.5 px-3 text-right w-24 font-mono">Horas Reais</th>
                    <th className="py-2.5 px-3 text-right w-24 font-mono">Meta Grupo</th>
                    <th className="py-2.5 px-3 text-center w-36">Progresso / Cumprimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {desempenhoCategorias.map(c => (
                    <tr key={c.grupo} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <span className="font-mono text-teal-800 font-bold mr-1.5">[{c.grupo}]</span>
                        <span>{c.nomeCompleto}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700">
                        {c.totalColabs}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700">
                        {c.totalAcoes}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-900">
                        {c.totalHoras} h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {c.metaHoras} h
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full ${c.taxaCumprimento >= 100 ? 'bg-emerald-600' : 'bg-teal-600'}`}
                              style={{ width: `${Math.min(100, c.taxaCumprimento)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            c.taxaCumprimento >= 100 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {c.taxaCumprimento}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. DISTRIBUIÇÃO POR TIPOLOGIA DE FORMAÇÃO */}
          <div className="space-y-3 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>4. Distribuição por Tipologia de Ação Formativa</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {desempenhoTipos.map(t => (
                <div key={t.tipo} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-900">{t.tipo}</strong>
                    <span className="font-mono text-teal-800 font-bold">{t.percentagemHoras}%</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px] mt-1.5 font-mono">
                    <span>{t.acoes} formações</span>
                    <strong className="text-slate-900">{t.horas} horas</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. PARECER E VALIDAÇÃO DA AUDITORIA DA QUALIDADE */}
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-lg text-xs space-y-1.5 print-break-inside-avoid">
            <strong className="text-teal-950 font-bold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Conclusões da Auditoria de Desempenho e Conformidade:
            </strong>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              O presente relatório comprova que no exercício de <strong>{anoAtual}</strong> foram concluídas <strong>{totalAcoesAno}</strong> ações formativas perfazendo um volume total de <strong>{totalHorasAno} horas</strong>. A taxa global de integração com o Plano de Necessidades Formativas (PNF) fixou-se em <strong>{percPnf}%</strong> e o nível de conformidade burocrática atingiu <strong>{percBurocracia}%</strong>. O documento cumpre com os normativos hospitalares da ULSAR, EPE e encontra-se devidamente auditado no sistema RadForm.
            </p>
          </div>

          {/* 6. BLOCO DE ASSINATURAS OFICIAIS */}
          <div className="pt-8 border-t border-slate-300 mt-6 print-break-inside-avoid">
            <div className="grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                <p className="font-bold text-slate-900">O/A Responsável pelo Plano de Formação</p>
                <p className="text-[11px] text-slate-500">Serviço de Radioterapia · ULSAR</p>
              </div>
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                <p className="font-bold text-slate-900">A Direção do Serviço de Radioterapia</p>
                <p className="text-[11px] text-slate-500">ULSAR, EPE</p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Visualização de Relatórios Periódicos (Mensal / Trimestral / Anual) */
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-2xs space-y-6 print:border-none print:shadow-none print:p-0">
          
          {/* Cabeçalho Oficial do Relatório */}
          <div className="border-b-2 border-slate-800 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-slate-500">
                  Unidade Local de Saúde · ULSAR, EPE
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Serviço de Radioterapia
                </h1>
                <p className="text-sm font-semibold text-teal-800 mt-0.5">
                  {tituloRelatorio}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono flex flex-col items-end gap-1.5">
                <p>Data de Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-PT')}</strong></p>
                <p>Documento de Conformidade Hospitalar · Exercício <strong className="text-slate-900">{anoAtual}</strong></p>
                <div className="no-print mt-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors cursor-pointer"
                    title="Exportar para Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                    title="Imprimir relatório"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Estatístico do Período */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Ações Realizadas:</span>
              <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {totalAcoes}
              </strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Volume Horário:</span>
              <strong className="text-xl font-bold text-teal-700 font-mono tabular-nums">
                {totalHoras} h
              </strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">No Plano de Necessidades (PNF):</span>
              <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {totalAcoes > 0 ? Math.round((acoesNoPnf / totalAcoes) * 100) : 0}%
              </strong>
              <span className="text-[11px] text-slate-500 ml-1">({acoesNoPnf}/{totalAcoes})</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Conformidade Burocrática:</span>
              <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {totalAcoes > 0 ? Math.round((acoesBurocraciaOk / totalAcoes) * 100) : 0}%
              </strong>
              <span className="text-[11px] text-slate-500 ml-1">({acoesBurocraciaOk}/{totalAcoes})</span>
            </div>
          </div>

          {/* Repartição por Categoria */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {breakdownCategorias.map(c => (
              <div key={c.categoria} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-semibold text-slate-800">{c.categoria}</span>
                <div className="flex justify-between text-slate-600 mt-1 font-mono">
                  <span>{c.count} ações</span>
                  <strong className="text-teal-800">{c.horas} h</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela Detalhada de Formações do Período */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700 mb-2">
              Registo Detalhado das Formações do Período:
            </h3>
            
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[11px]">
                    <th className="py-2 px-2.5 w-20">Código</th>
                    <th className="py-2 px-3">Nome da Formação</th>
                    <th className="py-2 px-2">Tipo</th>
                    <th className="py-2 px-2">Destinatários</th>
                    <th className="py-2 px-2.5">Data</th>
                    <th className="py-2 px-2 text-right">Horas</th>
                    <th className="py-2 px-2 text-center">PNF</th>
                    <th className="py-2 px-3">Participantes (Siglas)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formacoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Não existem formações registadas para este período selecionado.
                      </td>
                    </tr>
                  ) : (
                    formacoesFiltradas.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600">
                          {f.codigo}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {f.nome}
                        </td>
                        <td className="py-2 px-2 text-slate-700">
                          {f.categoria}
                        </td>
                        <td className="py-2 px-2 text-[11px] text-slate-600">
                          {f.destinatarios.join(', ')}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {f.data}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-teal-700">
                          {f.horas} h
                        </td>
                        <td className="py-2 px-2 text-center text-[11px]">
                          <span className={f.incluidaPlanoNecessidades === 'Sim' ? 'text-teal-700 font-semibold' : 'text-slate-400'}>
                            {f.incluidaPlanoNecessidades}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">
                          {f.colaboradores && f.colaboradores.length > 0 ? f.colaboradores.join(', ') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloco de Assinaturas e Validação de Conformidade */}
          <div className="pt-8 border-t border-slate-200 mt-8 print-break-inside-avoid">
            <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">O/A Responsável pelo Plano de Formação</p>
                <p className="text-[11px] text-slate-500">Serviço de Radioterapia · ULSAR</p>
              </div>
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">A Direção do Serviço de Radioterapia</p>
                <p className="text-[11px] text-slate-500">ULSAR, EPE</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportação do Relatório de Desempenho em PDF de Alta Definição */}
      <PerformanceReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        formacoes={formacoes}
        colaboradores={colaboradores}
        anoAtual={anoAtual}
        metaAtual={metaAtual}
      />
    </div>
  );
};
