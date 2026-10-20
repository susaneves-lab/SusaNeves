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
  Building2,
  PieChart as PieChartIcon,
  Target
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
  const [tipoRelatorio, setTipoRelatorio] = useState<'desempenho' | 'mensal' | 'trimestral' | 'anual' | 'acumulativo'>('desempenho');
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
  const grupos: DestinatarioGrupo[] = ['TSDT', 'FIS', 'ENF', 'MR', 'AT', 'TAS'];
  const desempenhoCategorias = useMemo(() => {
    return grupos.map(grp => {
      const colabsGrupo = colaboradores.filter(c => c.categoriaProfissional === grp || (grp === 'TAS' && c.categoriaProfissional === 'AO'));
      const acoesGrupo = formacoesDoAno.filter(f => f.destinatarios.includes(grp) || (grp === 'TAS' && f.destinatarios.includes('AO' as any)));

      const horasGrupo = formacoesDoAno.reduce((sum, f) => {
        const temColabDoGrupo = f.colaboradores?.some(sigla => {
          const c = colaboradores.find(col => col.sigla === sigla);
          return c?.categoriaProfissional === grp || (grp === 'TAS' && c?.categoriaProfissional === 'AO');
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
  const coresCategorias: Record<FormacaoCategoria, { bg: string; text: string; fill: string }> = {
    Externa: { bg: 'bg-blue-100', text: 'text-blue-800', fill: '#0284c7' },
    Interna: { bg: 'bg-teal-100', text: 'text-teal-800', fill: '#0d9488' },
    Enfermagem: { bg: 'bg-purple-100', text: 'text-purple-800', fill: '#8b5cf6' },
    ACAF: { bg: 'bg-amber-100', text: 'text-amber-800', fill: '#f59e0b' }
  };

  const metricasCategorias = useMemo(() => {
    return tipos.map(t => {
      const subset = formacoesDoAno.filter(f => f.categoria === t);
      const horas = subset.reduce((sum, f) => sum + f.horas, 0);
      const perc = totalHorasAno > 0 ? Math.round((horas / totalHorasAno) * 100) : 0;
      return {
        categoria: t,
        count: subset.length,
        horas,
        perc,
        cores: coresCategorias[t]
      };
    });
  }, [formacoesDoAno, totalHorasAno]);

  const desempenhoTipos = useMemo(() => {
    return metricasCategorias.map(m => ({
      tipo: m.categoria,
      acoes: m.count,
      horas: m.horas,
      percentagemHoras: m.perc
    }));
  }, [metricasCategorias]);

  const categoriaMaisRepresentada = useMemo(() => {
    return [...metricasCategorias].sort((a, b) => b.horas - a.horas)[0];
  }, [metricasCategorias]);

  // Helper para gerar caminhos SVG de gráfico circular (Pie / Donut Chart)
  const gerarCaminhosDonut = (dados: Array<{ perc: number; fill: string; label: string }>) => {
    let acumulado = 0;
    const raio = 70;
    const raioInterno = 40;
    const centroX = 100;
    const centroY = 100;

    const validos = dados.filter(d => d.perc > 0);
    if (validos.length === 1 && validos[0].perc >= 99.5) {
      const item = validos[0];
      const rMedio = (raio + raioInterno) / 2;
      const espessura = raio - raioInterno;
      return (
        <circle
          cx={centroX}
          cy={centroY}
          r={rMedio}
          fill="none"
          stroke={item.fill}
          strokeWidth={espessura}
        />
      );
    }

    return dados.map((item, idx) => {
      if (item.perc <= 0) return null;
      const anguloInicio = (acumulado * 360) / 100;
      acumulado += item.perc;
      const anguloFim = (acumulado * 360) / 100;

      const inicioRad = ((anguloInicio - 90) * Math.PI) / 180;
      const fimRad = ((anguloFim - 90) * Math.PI) / 180;

      const x1 = centroX + raio * Math.cos(inicioRad);
      const y1 = centroY + raio * Math.sin(inicioRad);
      const x2 = centroX + raio * Math.cos(fimRad);
      const y2 = centroY + raio * Math.sin(fimRad);

      const x3 = centroX + raioInterno * Math.cos(fimRad);
      const y3 = centroY + raioInterno * Math.sin(fimRad);
      const x4 = centroX + raioInterno * Math.cos(inicioRad);
      const y4 = centroY + raioInterno * Math.sin(inicioRad);

      const grandeArco = item.perc > 50 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${raio} ${raio} 0 ${grandeArco} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${raioInterno} ${raioInterno} 0 ${grandeArco} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');

      return (
        <path
          key={idx}
          d={pathData}
          fill={item.fill}
          stroke="#ffffff"
          strokeWidth="2"
        />
      );
    });
  };

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

    if (tipoRelatorio === 'acumulativo') {
      return doAno.filter(f => {
        const parts = f.data.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          return m >= 1 && m <= mesSelecionado;
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

  // Evolução Cumulativa Mês a Mês (para relatório acumulativo)
  const dadosAcumuladosMesAMes = useMemo(() => {
    let acumuladoHoras = 0;
    let acumuladoAcoes = 0;
    const meses = [];
    for (let m = 1; m <= mesSelecionado; m++) {
      const doMes = formacoesDoAno.filter(f => {
        const parts = f.data.split('-');
        return parts.length >= 2 && parseInt(parts[1], 10) === m;
      });
      const horasMes = doMes.reduce((sum, f) => sum + (f.horas || 0), 0);
      const acoesMes = doMes.length;
      acumuladoHoras += horasMes;
      acumuladoAcoes += acoesMes;
      const percMeta = metaHoras > 0 ? Math.round((acumuladoHoras / metaHoras) * 100) : 0;
      meses.push({
        mesNumero: m,
        nomeMes: nomesMeses[m - 1],
        acoesMes,
        horasMes,
        acumuladoAcoes,
        acumuladoHoras,
        percMeta
      });
    }
    return meses;
  }, [formacoesDoAno, mesSelecionado, metaHoras, nomesMeses]);

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
    } else if (tipoRelatorio === 'acumulativo') {
      exportFormacoesToExcel(
        formacoesFiltradas,
        colaboradores,
        anoAtual,
        `Relatorio_Formacoes_Acumulativas_Jan_a_${nomesMeses[mesSelecionado - 1]}_${anoAtual}`
      );
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
    if (tipoRelatorio === 'acumulativo') return `Relatório de Formações Acumulativas (Janeiro a ${nomesMeses[mesSelecionado - 1]}) · Ano ${anoAtual}`;
    return `Relatório Anual Consolidado do Plano de Formação · Ano ${anoAtual}`;
  }, [tipoRelatorio, mesSelecionado, trimestreSelecionado, anoAtual, nomesMeses]);

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
            <button
              onClick={() => setTipoRelatorio('acumulativo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tipoRelatorio === 'acumulativo' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
              <span>Formações Acumulativas</span>
            </button>
          </div>

          {/* Botões de Ação na Mesma Posição para Todos os Relatórios */}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              title={
                tipoRelatorio === 'desempenho' ? 'Exportar Relatório de Desempenho em PDF' :
                tipoRelatorio === 'anual' ? 'Exportar Relatório Anual em PDF' :
                tipoRelatorio === 'trimestral' ? 'Exportar Relatório Trimestral em PDF' :
                tipoRelatorio === 'mensal' ? 'Exportar Relatório Mensal em PDF' :
                'Exportar Relatório de Formações Acumulativas em PDF'
              }
            >
              <FileDown className="w-4 h-4 text-emerald-700" />
              <span>
                {tipoRelatorio === 'desempenho' && 'Exportar Relatório de Desempenho (PDF)'}
                {tipoRelatorio === 'anual' && 'Exportar Relatório Anual (PDF)'}
                {tipoRelatorio === 'trimestral' && 'Exportar Relatório Trimestral (PDF)'}
                {tipoRelatorio === 'mensal' && 'Exportar Relatório Mensal (PDF)'}
                {tipoRelatorio === 'acumulativo' && 'Exportar Relatório Acumulativo (PDF)'}
              </span>
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

        {/* Linha Secundária de Filtro de Período (Aparece em Mensal, Trimestral ou Acumulativo) */}
        {(tipoRelatorio === 'mensal' || tipoRelatorio === 'trimestral' || tipoRelatorio === 'acumulativo') && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-2.5 rounded-md border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="font-semibold text-slate-700">
                {tipoRelatorio === 'mensal' && 'Mês do Relatório:'}
                {tipoRelatorio === 'trimestral' && 'Trimestre do Relatório:'}
                {tipoRelatorio === 'acumulativo' && 'Acumular até ao Mês de:'}
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

              {tipoRelatorio === 'acumulativo' && (
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(parseInt(e.target.value, 10))}
                  className="py-1 px-3 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  {nomesMeses.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      Janeiro a {m} ({idx + 1} {idx === 0 ? 'mês' : 'meses'} acumulados)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              <span>{tipoRelatorio === 'acumulativo' ? 'Formações acumuladas: ' : 'Formações no período: '}</span>
              <strong className="text-teal-800 font-bold">{formacoesFiltradas.length}</strong>
              <span className="mx-1.5">·</span>
              <span>Total horas: </span>
              <strong className="text-teal-800 font-bold">{totalHoras} h</strong>
              {tipoRelatorio === 'acumulativo' && (
                <>
                  <span className="mx-1.5">·</span>
                  <span>Meta anual: </span>
                  <strong className="text-emerald-700 font-bold">
                    {metaHoras > 0 ? Math.round((totalHoras / metaHoras) * 100) : 0}% ({metaHoras}h)
                  </strong>
                </>
              )}
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

          {/* 3. GRÁFICOS CIRCULARES DE DISTRIBUIÇÃO & CONFORMIDADE (ANÁLISE DE DADOS) */}
          <div className="space-y-3 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-teal-700" />
              <span>3. Gráficos Circulares de Distribuição & Conformidade (Análise de Dados)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gráfico Circular 1: Distribuição por Categoria */}
              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-center gap-1.5">
                    <PieChartIcon className="w-3.5 h-3.5 text-teal-700" />
                    <span>Categorias de Formação</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Proporção do volume horário por tipo
                  </p>
                </div>

                <div className="py-2">
                  <svg width="150" height="150" viewBox="0 0 200 200" className="mx-auto drop-shadow-2xs">
                    {gerarCaminhosDonut(metricasCategorias.map(m => ({ perc: m.perc, fill: m.cores.fill, label: m.categoria })))}
                    <circle cx="100" cy="100" r="38" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="100" y="96" textAnchor="middle" className="text-[14px] font-bold fill-slate-900 font-mono">
                      {totalHorasAno}h
                    </text>
                    <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                      Total Horas
                    </text>
                  </svg>
                </div>

                <div className="w-full grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80 text-[10.5px]">
                  {metricasCategorias.map(c => (
                    <div key={c.categoria} className="flex items-center gap-1.5 justify-start">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: c.cores.fill }} />
                      <span className="text-slate-700 truncate">
                        <strong>{c.categoria}</strong>: {c.perc}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico Circular 2: Validação Burocrática */}
              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Validação Burocrática</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Conformidade com a matriz documental
                  </p>
                </div>

                <div className="py-2">
                  <svg width="150" height="150" viewBox="0 0 200 200" className="mx-auto drop-shadow-2xs">
                    {gerarCaminhosDonut([
                      { perc: percBurocracia, fill: '#0d9488', label: 'Validada' },
                      { perc: Math.max(0, 100 - percBurocracia), fill: '#cbd5e1', label: 'Pendente' }
                    ])}
                    <circle cx="100" cy="100" r="38" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="100" y="96" textAnchor="middle" className="text-[16px] font-bold fill-slate-900 font-mono">
                      {percBurocracia}%
                    </text>
                    <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                      Conforme
                    </text>
                  </svg>
                </div>

                <div className="w-full flex items-center justify-center gap-4 pt-2 border-t border-slate-200/80 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 shrink-0" />
                    <span className="text-slate-700">Validada ({percBurocracia}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 shrink-0" />
                    <span className="text-slate-700">Pendente ({Math.max(0, 100 - percBurocracia)}%)</span>
                  </div>
                </div>
              </div>

              {/* Gráfico Circular 3: Enquadramento no Plano Anual (PNF) */}
              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-teal-700" />
                    <span>Plano Anual (PNF)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Taxa de inclusão no plano de necessidades
                  </p>
                </div>

                <div className="py-2">
                  <svg width="150" height="150" viewBox="0 0 200 200" className="mx-auto drop-shadow-2xs">
                    {gerarCaminhosDonut([
                      { perc: percPnf, fill: '#10b981', label: 'No Plano' },
                      { perc: Math.max(0, 100 - percPnf), fill: '#cbd5e1', label: 'Fora do Plano' }
                    ])}
                    <circle cx="100" cy="100" r="38" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="100" y="96" textAnchor="middle" className="text-[16px] font-bold fill-slate-900 font-mono">
                      {percPnf}%
                    </text>
                    <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                      No PNF (Sim)
                    </text>
                  </svg>
                </div>

                <div className="w-full flex items-center justify-center gap-4 pt-2 border-t border-slate-200/80 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                    <span className="text-slate-700">No PNF ({percPnf}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 shrink-0" />
                    <span className="text-slate-700">Fora PNF ({Math.max(0, 100 - percPnf)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. DISTRIBUIÇÃO POR TIPOLOGIA DE AÇÃO FORMATIVA */}
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

          {/* 5. DESEMPENHO E CUMPRIMENTO POR GRUPO PROFISSIONAL */}
          <div className="space-y-3 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>5. Desempenho e Cumprimento por Grupo Profissional</span>
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

          {/* 6. PARECER E VALIDAÇÃO DA AUDITORIA DA QUALIDADE */}
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-lg text-xs space-y-1.5 print-break-inside-avoid">
            <strong className="text-teal-950 font-bold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              6. Conclusões da Auditoria de Desempenho e Conformidade:
            </strong>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              O presente relatório comprova que no exercício de <strong>{anoAtual}</strong> foram concluídas <strong>{totalAcoesAno}</strong> ações formativas perfazendo um volume total de <strong>{totalHorasAno} horas</strong>. A análise dos gráficos circulares de distribuição evidencia que a tipologia com maior volume foi <strong>{categoriaMaisRepresentada?.categoria || 'Externa'}</strong> com <strong>{categoriaMaisRepresentada?.horas || 0} horas</strong> ({categoriaMaisRepresentada?.perc || 0}% do total). No âmbito da governação clínica e planeamento, a taxa de integração no Plano de Necessidades Formativas (PNF) fixou-se em <strong>{percPnf}%</strong> ({acoesPnfAno} ações no plano) e a conformidade burocrática dos processos atingiu <strong>{percBurocracia}%</strong> ({acoesBurocraciaOkAno} ações validadas). O documento cumpre os normativos de acreditação hospitalar da ULSAR, EPE e encontra-se devidamente auditado no sistema RadForm.
            </p>
          </div>

          {/* 7. BLOCO DE ASSINATURAS OFICIAIS */}
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

          {/* Tabela de Evolução Cumulativa Mês a Mês (Apenas para Relatório Acumulativo) */}
          {tipoRelatorio === 'acumulativo' && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-700" />
                <span>Evolução Cumulativa Mês a Mês (Janeiro a {nomesMeses[mesSelecionado - 1]}):</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Mês</th>
                      <th className="py-2.5 px-3 text-center">Ações no Mês</th>
                      <th className="py-2.5 px-3 text-right">Horas no Mês</th>
                      <th className="py-2.5 px-3 text-center font-bold text-teal-900 bg-teal-50/50">Ações Acumuladas</th>
                      <th className="py-2.5 px-3 text-right font-bold text-teal-900 bg-teal-50/50 font-mono">Horas Acumuladas</th>
                      <th className="py-2.5 px-3 text-center">Progresso Meta Anual ({metaHoras}h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {dadosAcumuladosMesAMes.map(m => (
                      <tr key={m.mesNumero} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                          {m.nomeMes}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700">
                          {m.acoesMes}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          {m.horasMes} h
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-teal-900 bg-teal-50/30">
                          {m.acumuladoAcoes}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-teal-900 bg-teal-50/30">
                          {m.acumuladoHoras} h
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-2 rounded-full ${m.percMeta >= 100 ? 'bg-emerald-600' : 'bg-teal-600'}`}
                                style={{ width: `${Math.min(100, m.percMeta)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-slate-800">{m.percMeta}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
        tipoRelatorioInicial={tipoRelatorio}
        mesInicial={mesSelecionado}
        trimestreInicial={trimestreSelecionado}
      />
    </div>
  );
};
