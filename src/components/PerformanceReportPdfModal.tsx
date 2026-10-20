import React, { useRef, useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { 
  Formacao, 
  Colaborador, 
  MetaAno, 
  DESTINATARIOS_INFO, 
  DestinatarioGrupo,
  FormacaoCategoria
} from '../types';
import { MonthlyEvolutionBarChart } from './MonthlyEvolutionBarChart';
import { 
  Printer, 
  X, 
  FileDown, 
  Award, 
  Clock, 
  ShieldCheck, 
  Users, 
  BarChart2, 
  Calendar,
  Building2,
  Download,
  Loader2,
  PieChart as PieChartIcon,
  Target,
  TrendingUp
} from 'lucide-react';

export interface PerformanceReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
  metaAtual: MetaAno;
  tipoRelatorioInicial?: 'desempenho' | 'mensal' | 'trimestral' | 'anual' | 'acumulativo';
  mesInicial?: number;
  trimestreInicial?: 1 | 2 | 3 | 4;
}

export const PerformanceReportPdfModal: React.FC<PerformanceReportPdfModalProps> = ({
  isOpen,
  onClose,
  formacoes,
  colaboradores,
  anoAtual,
  metaAtual,
  tipoRelatorioInicial = 'desempenho',
  mesInicial = 1,
  trimestreInicial = 1
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<'desempenho' | 'anual' | 'trimestral' | 'mensal' | 'acumulativo'>(tipoRelatorioInicial);
  const [mesSelecionado, setMesSelecionado] = useState<number>(mesInicial);
  const [trimestreSelecionado, setTrimestreSelecionado] = useState<1 | 2 | 3 | 4>(trimestreInicial);

  useEffect(() => {
    if (isOpen) {
      if (tipoRelatorioInicial) setTipoRelatorio(tipoRelatorioInicial);
      if (mesInicial) setMesSelecionado(mesInicial);
      if (trimestreInicial) setTrimestreSelecionado(trimestreInicial);
    }
  }, [isOpen, tipoRelatorioInicial, mesInicial, trimestreInicial]);

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

  // Repartição por Categoria Profissional (Desempenho)
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

  // Filtragem para relatórios periódicos ou acumulativos
  const formacoesFiltradas = useMemo(() => {
    if (tipoRelatorio === 'anual' || tipoRelatorio === 'desempenho') {
      return formacoesDoAno;
    }
    if (tipoRelatorio === 'mensal') {
      return formacoesDoAno.filter(f => {
        const parts = f.data.split('-');
        return parts.length >= 2 && parseInt(parts[1], 10) === mesSelecionado;
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
      return formacoesDoAno.filter(f => {
        const parts = f.data.split('-');
        return parts.length >= 2 && permitidos.includes(parseInt(parts[1], 10));
      });
    }
    if (tipoRelatorio === 'acumulativo') {
      return formacoesDoAno.filter(f => {
        const parts = f.data.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          return m >= 1 && m <= mesSelecionado;
        }
        return false;
      });
    }
    return formacoesDoAno;
  }, [formacoesDoAno, tipoRelatorio, mesSelecionado, trimestreSelecionado]);

  const totalHorasPeriodo = useMemo(() => {
    return formacoesFiltradas.reduce((sum, f) => sum + (f.horas || 0), 0);
  }, [formacoesFiltradas]);
  const totalAcoesPeriodo = formacoesFiltradas.length;
  const acoesNoPnfPeriodo = useMemo(() => {
    return formacoesFiltradas.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
  }, [formacoesFiltradas]);
  const acoesBurocraciaOkPeriodo = useMemo(() => {
    return formacoesFiltradas.filter(f => f.burocracia).length;
  }, [formacoesFiltradas]);

  const breakdownCategoriasPeriodo = useMemo(() => {
    return tipos.map(c => {
      const subset = formacoesFiltradas.filter(f => f.categoria === c);
      const horas = subset.reduce((sum, f) => sum + f.horas, 0);
      return { categoria: c, count: subset.length, horas };
    });
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

  // Helper para desenhar gráficos circulares SVG
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

  const handlePrint = () => {
    window.print();
  };

  // Exportação em PDF Multi-Página de Alta Fidelidade (Sem cortes, incluindo toda a informação)
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 8;
      const contentWidth = pdfWidth - margin * 2; // 194 mm

      // Procurar todos os contentores de página dedicados (.pdf-page-container)
      const pageElements = printAreaRef.current.querySelectorAll<HTMLElement>('.pdf-page-container');

      if (pageElements && pageElements.length > 0) {
        for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i];
          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          if (i > 0) {
            pdf.addPage('a4', 'p');
          }
          const contentHeight = (canvas.height * contentWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, Math.min(contentHeight, pdfHeight - margin * 2), undefined, 'FAST');
        }
      } else {
        // Fallback contínuo
        const element = printAreaRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: element.scrollHeight,
          height: element.scrollHeight
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        const contentHeight = (canvas.height * contentWidth) / canvas.width;
        let heightLeft = contentHeight;
        let position = margin;
        let pageNumber = 1;

        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = margin - (pageNumber * (pdfHeight - margin * 2));
          pdf.addPage('a4', 'p');
          pageNumber++;
          pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
          heightLeft -= (pdfHeight - margin * 2);
        }
      }

      let nomeFicheiro = `Relatorio_Desempenho_Radioterapia_${anoAtual}.pdf`;
      if (tipoRelatorio === 'anual') nomeFicheiro = `Relatorio_Anual_Radioterapia_${anoAtual}.pdf`;
      else if (tipoRelatorio === 'trimestral') nomeFicheiro = `Relatorio_Trimestral_Q${trimestreSelecionado}_Radioterapia_${anoAtual}.pdf`;
      else if (tipoRelatorio === 'mensal') nomeFicheiro = `Relatorio_Mensal_${nomesMeses[mesSelecionado - 1]}_Radioterapia_${anoAtual}.pdf`;
      else if (tipoRelatorio === 'acumulativo') nomeFicheiro = `Relatorio_Acumulativo_Jan_a_${nomesMeses[mesSelecionado - 1]}_Radioterapia_${anoAtual}.pdf`;

      pdf.save(nomeFicheiro);
    } catch (err) {
      console.error('Erro ao gerar ficheiro PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-4 flex flex-col max-h-[94vh]">
        
        {/* BARRA SUPERIOR DE AÇÕES E CONFIGURAÇÃO (NÃO IMPRIME) */}
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-lg shrink-0">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded">
                  {tipoRelatorio === 'desempenho' && 'Desempenho & D3'}
                  {tipoRelatorio === 'anual' && 'Relatório Anual'}
                  {tipoRelatorio === 'trimestral' && `Trimestral · Q${trimestreSelecionado}`}
                  {tipoRelatorio === 'mensal' && `Mensal · ${nomesMeses[mesSelecionado - 1]}`}
                  {tipoRelatorio === 'acumulativo' && `Acumulado · Jan a ${nomesMeses[mesSelecionado - 1]}`}
                </span>
                <span className="text-xs text-slate-400 font-mono">Ciclo {anoAtual}</span>
              </div>
              <h2 className="text-sm font-bold tracking-tight text-white mt-0.5">
                Exportação Oficial em PDF de Alta Definição
              </h2>
            </div>
          </div>

          {/* Seletor Rápido de Tipo de Relatório dentro do Modal */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="inline-flex rounded-md bg-slate-800 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setTipoRelatorio('desempenho')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  tipoRelatorio === 'desempenho' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Desempenho
              </button>
              <button
                type="button"
                onClick={() => setTipoRelatorio('anual')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  tipoRelatorio === 'anual' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Anual
              </button>
              <button
                type="button"
                onClick={() => setTipoRelatorio('trimestral')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  tipoRelatorio === 'trimestral' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Trimestral
              </button>
              <button
                type="button"
                onClick={() => setTipoRelatorio('mensal')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  tipoRelatorio === 'mensal' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setTipoRelatorio('acumulativo')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  tipoRelatorio === 'acumulativo' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Acumulado</span>
              </button>
            </div>

            {/* Seletores de Período Específico */}
            {tipoRelatorio === 'mensal' && (
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(parseInt(e.target.value, 10))}
                className="py-1 px-2 bg-slate-800 text-white text-[11px] font-semibold rounded border border-slate-700 cursor-pointer"
              >
                {nomesMeses.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            )}

            {tipoRelatorio === 'trimestral' && (
              <select
                value={trimestreSelecionado}
                onChange={(e) => setTrimestreSelecionado(parseInt(e.target.value, 10) as 1 | 2 | 3 | 4)}
                className="py-1 px-2 bg-slate-800 text-white text-[11px] font-semibold rounded border border-slate-700 cursor-pointer"
              >
                <option value={1}>1º Trimestre (Jan-Mar)</option>
                <option value={2}>2º Trimestre (Abr-Jun)</option>
                <option value={3}>3º Trimestre (Jul-Set)</option>
                <option value={4}>4º Trimestre (Out-Dez)</option>
              </select>
            )}

            {tipoRelatorio === 'acumulativo' && (
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(parseInt(e.target.value, 10))}
                className="py-1 px-2 bg-slate-800 text-white text-[11px] font-semibold rounded border border-slate-700 cursor-pointer"
              >
                {nomesMeses.map((m, idx) => (
                  <option key={m} value={idx + 1}>Jan a {m}</option>
                ))}
              </select>
            )}

            {/* Botão de Descarregar PDF */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded shadow-xs transition-colors cursor-pointer"
              title="Gerar e transferir PDF completo de alta resolução"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-100" />
                  <span>A Gerar...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Descarregar PDF</span>
                </>
              )}
            </button>

            {/* Botão de Impressão */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors cursor-pointer"
              title="Imprimir ou Guardar em PDF nativo"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO DOCUMENTO (FORMATADO EM PÁGINAS A4 INDEPENDENTES) */}
        <div 
          ref={printAreaRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-100 print:bg-white print:p-0 print:space-y-0 text-slate-900"
        >

          {/* ========================================================================= */}
          {/* CASO 1: RELATÓRIO DE DESEMPENHO & GRÁFICOS D3 (3 PÁGINAS COMPLETAS)       */}
          {/* ========================================================================= */}
          {tipoRelatorio === 'desempenho' && (
            <>
              {/* PÁGINA 1: Síntese Executiva, KPIs e Gráficos de Barras D3 */}
              <div className="pdf-page-container bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                
                {/* Cabeçalho Hospitalar ULSAR */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold uppercase tracking-widest">
                        <Building2 className="w-4 h-4 text-teal-700" />
                        <span>Unidade Local de Saúde · ULSAR, EPE</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                        Serviço de Radioterapia
                      </h1>
                      <p className="text-xs sm:text-sm font-semibold text-teal-800">
                        Relatório Oficial de Desempenho e Evolução Formativa · Ciclo {anoAtual}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Auditoria Interna de Formação Profissional Contínua & Acreditação da Qualidade
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
                      <p>Data de Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-PT')}</strong></p>
                      <p>Exercício: <strong className="text-slate-900 font-bold">{anoAtual}</strong></p>
                      <p>Classificação: <span className="text-teal-800 font-bold">Relatório Executivo</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">RadForm · Sistema Hospitalar</p>
                    </div>
                  </div>
                </div>

                {/* 1. Painel de Indicadores Chave de Desempenho (KPIs) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-teal-700" />
                    <span>1. Indicadores Chave de Desempenho (KPIs do Serviço)</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {/* KPI 1: Horas */}
                    <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-teal-900 uppercase block">Horas Realizadas</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-lg font-bold font-mono text-teal-950">{totalHorasAno}</strong>
                        <span className="text-[10px] text-teal-800 font-mono">/ {metaHoras}h</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                        percHoras >= 100 ? 'bg-emerald-200 text-emerald-900' : 'bg-teal-200 text-teal-900'
                      }`}>
                        {percHoras}% da Meta
                      </span>
                    </div>

                    {/* KPI 2: Ações */}
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-blue-900 uppercase block">Ações Formação</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-lg font-bold font-mono text-blue-950">{totalAcoesAno}</strong>
                        <span className="text-[10px] text-blue-800 font-mono">/ {metaAcoes}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                        percAcoes >= 100 ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
                      }`}>
                        {percAcoes}% da Meta
                      </span>
                    </div>

                    {/* KPI 3: Taxa PNF */}
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-emerald-900 uppercase block">Integração PNF</span>
                      <div className="mt-0.5">
                        <strong className="text-lg font-bold font-mono text-emerald-950">{percPnf}%</strong>
                      </div>
                      <span className="text-[10px] text-emerald-800 mt-1 block">
                        {acoesPnfAno} de {totalAcoesAno} no plano
                      </span>
                    </div>

                    {/* KPI 4: Burocracia */}
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-amber-900 uppercase block">Conformidade Matriz</span>
                      <div className="mt-0.5">
                        <strong className="text-lg font-bold font-mono text-amber-950">{percBurocracia}%</strong>
                      </div>
                      <span className="text-[10px] text-amber-800 mt-1 block">
                        {acoesBurocraciaOkAno} de {totalAcoesAno} validadas
                      </span>
                    </div>

                    {/* KPI 5: Média Horas */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-slate-700 uppercase block">Média / Profissional</span>
                      <div className="mt-0.5">
                        <strong className="text-lg font-bold font-mono text-slate-900">{mediaHorasPorColaborador} h</strong>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {colaboradores.length} colaboradores
                      </span>
                    </div>

                    {/* KPI 6: Participações */}
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-indigo-900 uppercase block">Participações Totais</span>
                      <div className="mt-0.5">
                        <strong className="text-lg font-bold font-mono text-indigo-950">{totalParticipacoes}</strong>
                      </div>
                      <span className="text-[10px] text-indigo-800 mt-1 block">
                        Presenças da equipa
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Gráfico de Barras D3 de Evolução Mensal */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>2. Evolução Mensal do Volume de Formação (Gráficos D3.js)</span>
                  </h3>

                  <MonthlyEvolutionBarChart 
                    formacoes={formacoes}
                    ano={anoAtual}
                    metaHorasAnual={metaHoras}
                    metaAcoesAnual={metaAcoes}
                    isPrintMode={true}
                  />
                </div>

                {/* Rodapé da Página 1 */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>ULSAR, EPE · Serviço de Radioterapia · Relatório de Desempenho {anoAtual}</span>
                  <span className="font-bold text-slate-700">Página 1 de 3</span>
                </div>
              </div>

              {/* PÁGINA 2: Gráficos Circulares, Tipologia e Grupos Profissionais */}
              <div className="pdf-page-container bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                
                {/* Cabeçalho de Continuação */}
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">ULSAR, EPE · Serviço de Radioterapia</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-teal-800 font-semibold">Relatório Oficial de Desempenho {anoAtual}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Continuação · Secções 3, 4 e 5</span>
                </div>

                {/* 3. Gráficos Circulares de Distribuição & Conformidade */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <PieChartIcon className="w-3.5 h-3.5 text-teal-700" />
                    <span>3. Gráficos Circulares de Distribuição & Conformidade (Análise de Dados)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Donut 1: Categorias de Formação */}
                    <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                          Categorias de Formação
                        </h4>
                        <p className="text-[9.5px] text-slate-500">Proporção horária por tipo</p>
                      </div>

                      <div className="py-1">
                        <svg width="135" height="135" viewBox="0 0 200 200" className="mx-auto">
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

                      <div className="w-full grid grid-cols-2 gap-1 pt-2 border-t border-slate-200/80 text-[10px]">
                        {metricasCategorias.map(c => (
                          <div key={c.categoria} className="flex items-center gap-1 justify-start">
                            <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: c.cores.fill }} />
                            <span className="text-slate-700 truncate">
                              <strong>{c.categoria}</strong>: {c.perc}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Donut 2: Validação Burocrática */}
                    <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                          Validação Burocrática
                        </h4>
                        <p className="text-[9.5px] text-slate-500">Conformidade documental</p>
                      </div>

                      <div className="py-1">
                        <svg width="135" height="135" viewBox="0 0 200 200" className="mx-auto">
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

                      <div className="w-full flex items-center justify-center gap-3 pt-2 border-t border-slate-200/80 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-teal-600 shrink-0" />
                          <span className="text-slate-700">Validada ({percBurocracia}%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-slate-300 shrink-0" />
                          <span className="text-slate-700">Pendente ({Math.max(0, 100 - percBurocracia)}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut 3: Enquadramento PNF */}
                    <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                          Plano Anual (PNF)
                        </h4>
                        <p className="text-[9.5px] text-slate-500">Inclusão nas necessidades</p>
                      </div>

                      <div className="py-1">
                        <svg width="135" height="135" viewBox="0 0 200 200" className="mx-auto">
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

                      <div className="w-full flex items-center justify-center gap-3 pt-2 border-t border-slate-200/80 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-emerald-500 shrink-0" />
                          <span className="text-slate-700">No PNF ({percPnf}%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-slate-300 shrink-0" />
                          <span className="text-slate-700">Fora ({Math.max(0, 100 - percPnf)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DISTRIBUIÇÃO POR TIPOLOGIA DE AÇÃO FORMATIVA (COLOCADO ANTES DO DESEMPENHO POR GRUPO) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-700" />
                    <span>4. Distribuição por Tipologia de Ação Formativa</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {desempenhoTipos.map(t => (
                      <div key={t.tipo} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-900">{t.tipo}</strong>
                          <span className="font-mono text-teal-800 font-bold">{t.percentagemHoras}%</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[10.5px] mt-1 font-mono">
                          <span>{t.acoes} ações</span>
                          <strong className="text-slate-900">{t.horas} h</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. DESEMPENHO E CUMPRIMENTO POR GRUPO PROFISSIONAL */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-700" />
                    <span>5. Desempenho e Cumprimento por Grupo Profissional</span>
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[11px]">
                          <th className="py-2 px-3">Grupo Profissional</th>
                          <th className="py-2 px-2 text-center w-16">Efetivo</th>
                          <th className="py-2 px-2 text-center w-24">Ações Destinadas</th>
                          <th className="py-2 px-3 text-right w-24 font-mono">Horas Reais</th>
                          <th className="py-2 px-3 text-right w-24 font-mono">Meta Grupo</th>
                          <th className="py-2 px-3 text-center w-36">Cumprimento %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {desempenhoCategorias.map(c => (
                          <tr key={c.grupo} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3 font-semibold text-slate-900">
                              <span className="font-mono text-teal-800 font-bold mr-1.5">[{c.grupo}]</span>
                              <span>{c.nomeCompleto}</span>
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono font-medium text-slate-700">
                              {c.totalColabs}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono font-medium text-slate-700">
                              {c.totalAcoes}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-teal-900">
                              {c.totalHoras} h
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                              {c.metaHoras} h
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <div className="flex items-center gap-1.5 justify-center">
                                <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-1.5 rounded-full ${c.taxaCumprimento >= 100 ? 'bg-emerald-600' : 'bg-teal-600'}`}
                                    style={{ width: `${Math.min(100, c.taxaCumprimento)}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold font-mono px-1 rounded ${
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

                {/* Rodapé da Página 2 */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>ULSAR, EPE · Serviço de Radioterapia · Relatório de Desempenho {anoAtual}</span>
                  <span className="font-bold text-slate-700">Página 2 de 3</span>
                </div>
              </div>

              {/* PÁGINA 3: Quadro de Formações Realizadas, Auditoria e Assinaturas */}
              <div className="pdf-page-container bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                
                {/* Cabeçalho de Continuação */}
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">ULSAR, EPE · Serviço de Radioterapia</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-teal-800 font-semibold">Relatório Oficial de Desempenho {anoAtual}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Continuação · Secções 6, 7 e Validação</span>
                </div>

                {/* 6. Registo Síntese de Formações do Ciclo (Garante Toda a Informação) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-teal-700" />
                      <span>6. Registo Síntese das Formações Realizadas no Ciclo ({formacoesDoAno.length} Ações)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">
                      Total: {totalHorasAno} horas
                    </span>
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[10.5px]">
                          <th className="py-2 px-2.5 w-16">Código</th>
                          <th className="py-2 px-3">Nome da Formação</th>
                          <th className="py-2 px-2 w-20">Tipo</th>
                          <th className="py-2 px-2 w-24">Destinatários</th>
                          <th className="py-2 px-2.5 w-24">Data</th>
                          <th className="py-2 px-2 w-16 text-right">Horas</th>
                          <th className="py-2 px-2 w-14 text-center">PNF</th>
                          <th className="py-2 px-2.5">Participantes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10.5px]">
                        {formacoesDoAno.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-slate-400">
                              Não existem formações registadas no ciclo.
                            </td>
                          </tr>
                        ) : (
                          formacoesDoAno.slice(0, 15).map(f => (
                            <tr key={f.id} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-mono text-slate-600">{f.codigo || '-'}</td>
                              <td className="py-1.5 px-3 font-medium text-slate-900 truncate max-w-[200px]">{f.nome}</td>
                              <td className="py-1.5 px-2 text-slate-700">{f.categoria}</td>
                              <td className="py-1.5 px-2 text-slate-600 truncate max-w-[100px]">{f.destinatarios.join(', ')}</td>
                              <td className="py-1.5 px-2.5 font-mono text-slate-700 whitespace-nowrap">{f.data}</td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-teal-800">{f.horas}h</td>
                              <td className="py-1.5 px-2 text-center">
                                <span className={f.incluidaPlanoNecessidades === 'Sim' ? 'text-teal-700 font-semibold' : 'text-slate-400'}>
                                  {f.incluidaPlanoNecessidades}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-[140px]">
                                {f.colaboradores && f.colaboradores.length > 0 ? f.colaboradores.join(', ') : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                        {formacoesDoAno.length > 15 && (
                          <tr className="bg-slate-50 font-mono text-[10px] text-slate-500">
                            <td colSpan={8} className="py-1.5 px-3 text-center">
                              ... e mais {formacoesDoAno.length - 15} ações formativas consolidadas no histórico digital RadForm.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 7. Parecer e Validação da Auditoria da Qualidade */}
                <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-lg text-xs space-y-1">
                  <strong className="text-teal-950 font-bold block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    7. Conclusões da Auditoria de Desempenho e Conformidade:
                  </strong>
                  <p className="text-slate-700 leading-relaxed text-[10.5px]">
                    O presente relatório comprova que no exercício de <strong>{anoAtual}</strong> foram concluídas <strong>{totalAcoesAno}</strong> ações formativas perfazendo um volume total de <strong>{totalHorasAno} horas</strong>. A análise dos gráficos circulares de distribuição evidencia que a tipologia com maior volume foi <strong>{categoriaMaisRepresentada?.categoria || 'Externa'}</strong> com <strong>{categoriaMaisRepresentada?.horas || 0} horas</strong> ({categoriaMaisRepresentada?.perc || 0}% do total). No âmbito da governação clínica e planeamento, a taxa de integração no Plano de Necessidades Formativas (PNF) fixou-se em <strong>{percPnf}%</strong> ({acoesPnfAno} ações no plano) e a conformidade burocrática dos processos atingiu <strong>{percBurocracia}%</strong> ({acoesBurocraciaOkAno} ações validadas). O documento cumpre os normativos de acreditação hospitalar da ULSAR, EPE e encontra-se devidamente auditado no sistema RadForm.
                  </p>
                </div>

                {/* 8. Bloco de Assinaturas Oficiais */}
                <div className="pt-6 border-t border-slate-300">
                  <div className="grid grid-cols-2 gap-10 text-center text-xs text-slate-700">
                    <div>
                      <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                      <p className="font-bold text-slate-900">O/A Responsável pelo Plano de Formação</p>
                      <p className="text-[10px] text-slate-500">Serviço de Radioterapia · ULSAR</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                      <p className="font-bold text-slate-900">A Direção do Serviço de Radioterapia</p>
                      <p className="text-[10px] text-slate-500">ULSAR, EPE</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Página 3 */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>ULSAR, EPE · Serviço de Radioterapia · Relatório de Desempenho {anoAtual}</span>
                  <span className="font-bold text-slate-700">Página 3 de 3 (Final)</span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* CASO 2: RELATÓRIO DE FORMAÇÕES ACUMULATIVAS (AGREGANDO MESES ANTERIORES)   */}
          {/* ========================================================================= */}
          {tipoRelatorio === 'acumulativo' && (
            <>
              {/* Página 1 do Relatório Acumulativo */}
              <div className="pdf-page-container bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                {/* Cabeçalho Hospitalar ULSAR */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold uppercase tracking-widest">
                        <Building2 className="w-4 h-4 text-teal-700" />
                        <span>Unidade Local de Saúde · ULSAR, EPE</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                        Serviço de Radioterapia
                      </h1>
                      <p className="text-xs sm:text-sm font-semibold text-teal-800">
                        Relatório de Formações Acumulativas · Janeiro a {nomesMeses[mesSelecionado - 1]} de {anoAtual}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Agregação Progressiva Mensal de Indicadores de Formação e Cumprimento de Metas
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
                      <p>Data de Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-PT')}</strong></p>
                      <p>Período Acumulado: <strong className="text-slate-900 font-bold">Jan a {nomesMeses[mesSelecionado - 1]}</strong></p>
                      <p>Exercício: <strong className="text-slate-900 font-bold">{anoAtual}</strong></p>
                      <p className="text-[10px] text-teal-800 font-bold mt-0.5">Relatório Acumulativo</p>
                    </div>
                  </div>
                </div>

                {/* Resumo de Indicadores Acumulados */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Ações Acumuladas:</span>
                    <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                      {totalAcoesPeriodo}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {metaAcoes > 0 ? Math.round((totalAcoesPeriodo / metaAcoes) * 100) : 0}% da meta anual
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Volume Horário Acumulado:</span>
                    <strong className="text-xl font-bold text-teal-700 font-mono tabular-nums">
                      {totalHorasPeriodo} h
                    </strong>
                    <span className="text-[10px] text-teal-800 block mt-0.5 font-bold">
                      {metaHoras > 0 ? Math.round((totalHorasPeriodo / metaHoras) * 100) : 0}% da meta anual ({metaHoras}h)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Taxa PNF Acumulada:</span>
                    <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                      {totalAcoesPeriodo > 0 ? Math.round((acoesNoPnfPeriodo / totalAcoesPeriodo) * 100) : 0}%
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      ({acoesNoPnfPeriodo}/{totalAcoesPeriodo} no plano)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Conformidade Burocrática:</span>
                    <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                      {totalAcoesPeriodo > 0 ? Math.round((acoesBurocraciaOkPeriodo / totalAcoesPeriodo) * 100) : 0}%
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      ({acoesBurocraciaOkPeriodo}/{totalAcoesPeriodo} validadas)
                    </span>
                  </div>
                </div>

                {/* Tabela de Evolução Cumulativa Mês a Mês */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
                    <span>Evolução Cumulativa Mês a Mês (Janeiro a {nomesMeses[mesSelecionado - 1]})</span>
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[11px]">
                          <th className="py-2 px-3">Mês</th>
                          <th className="py-2 px-3 text-center">Ações no Mês</th>
                          <th className="py-2 px-3 text-right">Horas no Mês</th>
                          <th className="py-2 px-3 text-center">Ações Acumuladas</th>
                          <th className="py-2 px-3 text-right">Horas Acumuladas</th>
                          <th className="py-2 px-3 text-center">% Meta Anual ({metaHoras}h)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {dadosAcumuladosMesAMes.map(d => (
                          <tr key={d.mesNumero} className={d.mesNumero === mesSelecionado ? 'bg-teal-50/50 font-semibold' : 'hover:bg-slate-50/50'}>
                            <td className="py-2 px-3 text-slate-900">{d.nomeMes}</td>
                            <td className="py-2 px-3 text-center font-mono text-slate-700">{d.acoesMes}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">{d.horasMes} h</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-teal-900">{d.acumuladoAcoes}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-teal-900">{d.acumuladoHoras} h</td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {d.percMeta}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Repartição por Categoria no Período Acumulado */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Repartição por Categoria no Período Acumulado:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {breakdownCategoriasPeriodo.map(c => (
                      <div key={c.categoria} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span className="font-semibold text-slate-800">{c.categoria}</span>
                        <div className="flex justify-between text-slate-600 mt-1 font-mono text-[11px]">
                          <span>{c.count} ações</span>
                          <strong className="text-teal-800">{c.horas} h</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rodapé da Página 1 */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>ULSAR, EPE · Serviço de Radioterapia · Relatório Acumulativo Jan a {nomesMeses[mesSelecionado - 1]}</span>
                  <span className="font-bold text-slate-700">Página 1 de 2</span>
                </div>
              </div>

              {/* Página 2 do Relatório Acumulativo */}
              <div className="pdf-page-container bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                {/* Cabeçalho de Continuação */}
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">ULSAR, EPE · Serviço de Radioterapia</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-teal-800 font-semibold">Relatório de Formações Acumulativas (Jan a {nomesMeses[mesSelecionado - 1]})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Registo Detalhado e Validação</span>
                </div>

                {/* Tabela Detalhada das Formações Acumuladas */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Registo Detalhado das Formações Acumuladas no Período ({formacoesFiltradas.length} Ações):
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[10.5px]">
                          <th className="py-2 px-2.5 w-16">Código</th>
                          <th className="py-2 px-3">Nome da Formação</th>
                          <th className="py-2 px-2 w-20">Tipo</th>
                          <th className="py-2 px-2 w-24">Destinatários</th>
                          <th className="py-2 px-2.5 w-24">Data</th>
                          <th className="py-2 px-2 w-16 text-right">Horas</th>
                          <th className="py-2 px-2 w-14 text-center">PNF</th>
                          <th className="py-2 px-2.5">Participantes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10.5px]">
                        {formacoesFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-slate-400">
                              Não existem formações registadas no período acumulado.
                            </td>
                          </tr>
                        ) : (
                          formacoesFiltradas.slice(0, 18).map(f => (
                            <tr key={f.id} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-mono text-slate-600">{f.codigo || '-'}</td>
                              <td className="py-1.5 px-3 font-medium text-slate-900 truncate max-w-[200px]">{f.nome}</td>
                              <td className="py-1.5 px-2 text-slate-700">{f.categoria}</td>
                              <td className="py-1.5 px-2 text-slate-600 truncate max-w-[100px]">{f.destinatarios.join(', ')}</td>
                              <td className="py-1.5 px-2.5 font-mono text-slate-700 whitespace-nowrap">{f.data}</td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-teal-800">{f.horas}h</td>
                              <td className="py-1.5 px-2 text-center">
                                <span className={f.incluidaPlanoNecessidades === 'Sim' ? 'text-teal-700 font-semibold' : 'text-slate-400'}>
                                  {f.incluidaPlanoNecessidades}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-[140px]">
                                {f.colaboradores && f.colaboradores.length > 0 ? f.colaboradores.join(', ') : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                        {formacoesFiltradas.length > 18 && (
                          <tr className="bg-slate-50 font-mono text-[10px] text-slate-500">
                            <td colSpan={8} className="py-1.5 px-3 text-center">
                              ... e mais {formacoesFiltradas.length - 18} ações acumuladas no período.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Parecer Acumulativo */}
                <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-lg text-xs space-y-1">
                  <strong className="text-teal-950 font-bold block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    Conclusões da Auditoria Acumulativa:
                  </strong>
                  <p className="text-slate-700 leading-relaxed text-[10.5px]">
                    No intervalo compreendido entre <strong>Janeiro</strong> e <strong>{nomesMeses[mesSelecionado - 1]}</strong> de {anoAtual}, foram acumuladas <strong>{totalAcoesPeriodo} ações</strong> correspondendo a <strong>{totalHorasPeriodo} horas</strong> de formação. O progresso em relação à meta anual ({metaHoras}h) situa-se em <strong>{metaHoras > 0 ? Math.round((totalHorasPeriodo / metaHoras) * 100) : 0}%</strong>, com taxa de inclusão no PNF de <strong>{totalAcoesPeriodo > 0 ? Math.round((acoesNoPnfPeriodo / totalAcoesPeriodo) * 100) : 0}%</strong> e conformidade documental de <strong>{totalAcoesPeriodo > 0 ? Math.round((acoesBurocraciaOkPeriodo / totalAcoesPeriodo) * 100) : 0}%</strong>.
                  </p>
                </div>

                {/* Assinaturas */}
                <div className="pt-6 border-t border-slate-300">
                  <div className="grid grid-cols-2 gap-10 text-center text-xs text-slate-700">
                    <div>
                      <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                      <p className="font-bold text-slate-900">O/A Responsável pelo Plano de Formação</p>
                      <p className="text-[10px] text-slate-500">Serviço de Radioterapia · ULSAR</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                      <p className="font-bold text-slate-900">A Direção do Serviço de Radioterapia</p>
                      <p className="text-[10px] text-slate-500">ULSAR, EPE</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Página 2 */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>ULSAR, EPE · Serviço de Radioterapia · Relatório Acumulativo Jan a {nomesMeses[mesSelecionado - 1]}</span>
                  <span className="font-bold text-slate-700">Página 2 de 2 (Final)</span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* CASO 3: RELATÓRIOS PERIÓDICOS (ANUAL / TRIMESTRAL / MENSAL)               */}
          {/* ========================================================================= */}
          {(tipoRelatorio === 'anual' || tipoRelatorio === 'trimestral' || tipoRelatorio === 'mensal') && (
            <div className="pdf-page-container bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
              
              {/* Cabeçalho Oficial do Relatório */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-widest text-slate-500">
                      Unidade Local de Saúde · ULSAR, EPE
                    </p>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                      Serviço de Radioterapia
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-teal-800">
                      {tipoRelatorio === 'anual' && `Relatório Anual Consolidado do Plano de Formação · Ano ${anoAtual}`}
                      {tipoRelatorio === 'trimestral' && `Relatório Trimestral de Formação · ${trimestreSelecionado}º Trimestre de ${anoAtual}`}
                      {tipoRelatorio === 'mensal' && `Relatório Mensal de Formação · ${nomesMeses[mesSelecionado - 1]} de ${anoAtual}`}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Registo Hospitalar de Formação Contínua & Acreditação
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
                    <p>Data de Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-PT')}</strong></p>
                    <p>Exercício: <strong className="text-slate-900 font-bold">{anoAtual}</strong></p>
                    <p className="text-[10px] text-teal-800 font-bold mt-0.5">
                      {tipoRelatorio === 'anual' ? 'Relatório Anual' : tipoRelatorio === 'trimestral' ? `${trimestreSelecionado}º Trimestre` : `Mês ${mesSelecionado}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumo Estatístico do Período */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10.5px] text-slate-500 block font-medium">Ações Realizadas:</span>
                  <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                    {totalAcoesPeriodo}
                  </strong>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block font-medium">Volume Horário:</span>
                  <strong className="text-xl font-bold text-teal-700 font-mono tabular-nums">
                    {totalHorasPeriodo} h
                  </strong>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block font-medium">No Plano (PNF):</span>
                  <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                    {totalAcoesPeriodo > 0 ? Math.round((acoesNoPnfPeriodo / totalAcoesPeriodo) * 100) : 0}%
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">({acoesNoPnfPeriodo}/{totalAcoesPeriodo})</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block font-medium">Conformidade Burocrática:</span>
                  <strong className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                    {totalAcoesPeriodo > 0 ? Math.round((acoesBurocraciaOkPeriodo / totalAcoesPeriodo) * 100) : 0}%
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">({acoesBurocraciaOkPeriodo}/{totalAcoesPeriodo})</span>
                </div>
              </div>

              {/* Repartição por Categoria */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Repartição por Categoria no Período:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {breakdownCategoriasPeriodo.map(c => (
                    <div key={c.categoria} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                      <span className="font-semibold text-slate-800">{c.categoria}</span>
                      <div className="flex justify-between text-slate-600 mt-1 font-mono text-[11px]">
                        <span>{c.count} ações</span>
                        <strong className="text-teal-800">{c.horas} h</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela Detalhada das Formações */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                  Registo Detalhado das Formações do Período ({formacoesFiltradas.length} Ações):
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-[10.5px]">
                        <th className="py-2 px-2.5 w-16">Código</th>
                        <th className="py-2 px-3">Nome da Formação</th>
                        <th className="py-2 px-2 w-20">Tipo</th>
                        <th className="py-2 px-2 w-24">Destinatários</th>
                        <th className="py-2 px-2.5 w-24">Data</th>
                        <th className="py-2 px-2 w-16 text-right">Horas</th>
                        <th className="py-2 px-2 w-14 text-center">PNF</th>
                        <th className="py-2 px-2.5">Participantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10.5px]">
                      {formacoesFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            Não existem formações registadas para este período selecionado.
                          </td>
                        </tr>
                      ) : (
                        formacoesFiltradas.slice(0, 18).map(f => (
                          <tr key={f.id} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-2.5 font-mono text-slate-600">{f.codigo || '-'}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-900 truncate max-w-[200px]">{f.nome}</td>
                            <td className="py-1.5 px-2 text-slate-700">{f.categoria}</td>
                            <td className="py-1.5 px-2 text-slate-600 truncate max-w-[100px]">{f.destinatarios.join(', ')}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-700 whitespace-nowrap">{f.data}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-teal-800">{f.horas}h</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={f.incluidaPlanoNecessidades === 'Sim' ? 'text-teal-700 font-semibold' : 'text-slate-400'}>
                                {f.incluidaPlanoNecessidades}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-[140px]">
                              {f.colaboradores && f.colaboradores.length > 0 ? f.colaboradores.join(', ') : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                      {formacoesFiltradas.length > 18 && (
                        <tr className="bg-slate-50 font-mono text-[10px] text-slate-500">
                          <td colSpan={8} className="py-1.5 px-3 text-center">
                            ... e mais {formacoesFiltradas.length - 18} ações consolidadas no histórico digital RadForm.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Parecer do Período */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-lg text-xs space-y-1">
                <strong className="text-teal-950 font-bold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  Conclusões e Validação da Auditoria:
                </strong>
                <p className="text-slate-700 leading-relaxed text-[10.5px]">
                  O presente documento certifica a realização de <strong>{totalAcoesPeriodo} ações</strong> formativas no período ({totalHorasPeriodo} horas), com taxa de inclusão no PNF de <strong>{totalAcoesPeriodo > 0 ? Math.round((acoesNoPnfPeriodo / totalAcoesPeriodo) * 100) : 0}%</strong> e conformidade documental de <strong>{totalAcoesPeriodo > 0 ? Math.round((acoesBurocraciaOkPeriodo / totalAcoesPeriodo) * 100) : 0}%</strong>.
                </p>
              </div>

              {/* Assinaturas */}
              <div className="pt-6 border-t border-slate-300">
                <div className="grid grid-cols-2 gap-10 text-center text-xs text-slate-700">
                  <div>
                    <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                    <p className="font-bold text-slate-900">O/A Responsável pelo Plano de Formação</p>
                    <p className="text-[10px] text-slate-500">Serviço de Radioterapia · ULSAR</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
                    <p className="font-bold text-slate-900">A Direção do Serviço de Radioterapia</p>
                    <p className="text-[10px] text-slate-500">ULSAR, EPE</p>
                  </div>
                </div>
              </div>

              {/* Rodapé */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>ULSAR, EPE · Serviço de Radioterapia</span>
                <span className="font-bold text-slate-700">Página 1 de 1</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
