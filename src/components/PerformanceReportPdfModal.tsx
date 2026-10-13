import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  BarChart2, 
  Calendar,
  FileText,
  Building2,
  Download,
  Loader2
} from 'lucide-react';

interface PerformanceReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
  metaAtual: MetaAno;
}

export const PerformanceReportPdfModal: React.FC<PerformanceReportPdfModalProps> = ({
  isOpen,
  onClose,
  formacoes,
  colaboradores,
  anoAtual,
  metaAtual
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const formacoesDoAno = formacoes.filter(f => f.ano === anoAtual);
  const totalHoras = formacoesDoAno.reduce((sum, f) => sum + (f.horas || 0), 0);
  const totalAcoes = formacoesDoAno.length;

  const metaHoras = metaAtual.metaTotalServico || 875;
  const metaAcoes = metaAtual.metaQtdFormacoesServico || 35;

  const percHoras = metaHoras > 0 ? Math.round((totalHoras / metaHoras) * 100) : 100;
  const percAcoes = metaAcoes > 0 ? Math.round((totalAcoes / metaAcoes) * 100) : 100;

  const acoesPnf = formacoesDoAno.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
  const percPnf = totalAcoes > 0 ? Math.round((acoesPnf / totalAcoes) * 100) : 0;

  const acoesBurocraciaOk = formacoesDoAno.filter(f => f.burocracia).length;
  const percBurocracia = totalAcoes > 0 ? Math.round((acoesBurocraciaOk / totalAcoes) * 100) : 0;

  // Participações totais
  const totalParticipacoes = formacoesDoAno.reduce((sum, f) => sum + (f.colaboradores?.length || 0), 0);
  const mediaHorasPorColaborador = colaboradores.length > 0 
    ? (Math.round((totalHoras / colaboradores.length) * 10) / 10) 
    : 0;

  // Repartição por Categoria Profissional
  const grupos: DestinatarioGrupo[] = ['TSDT', 'FIS', 'ENF', 'MR', 'AT', 'AO'];
  const desempenhoCategorias = grupos.map(grp => {
    const colabsGrupo = colaboradores.filter(c => c.categoriaProfissional === grp);
    const acoesGrupo = formacoesDoAno.filter(f => f.destinatarios.includes(grp));
    
    // Horas frequentadas por colaboradores deste grupo
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

  // Repartição por Tipo de Formação (Externa, Interna, etc.)
  const tipos: FormacaoCategoria[] = ['Externa', 'Interna', 'Enfermagem', 'ACAF'];
  const desempenhoTipos = tipos.map(t => {
    const subset = formacoesDoAno.filter(f => f.categoria === t);
    const horas = subset.reduce((sum, f) => sum + f.horas, 0);
    return {
      tipo: t,
      acoes: subset.length,
      horas,
      percentagemHoras: totalHoras > 0 ? Math.round((horas / totalHoras) * 100) : 0
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = printAreaRef.current;
      // Gerar imagem com alta densidade de píxeis para nitidez tipográfica
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // largura A4 mm
      const pdfHeight = 297; // altura A4 mm
      const margin = 8; // margem lateral mm
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = contentHeight;
      let position = margin;
      let pageNumber = 1;

      // Primeira página
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - margin * 2);

      // Páginas subsequentes com paginação limpa
      while (heightLeft > 0) {
        position = margin - (pageNumber * (pdfHeight - margin * 2));
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - margin * 2);
      }

      pdf.save(`Relatorio_Desempenho_Radioterapia_${anoAtual}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar ficheiro PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-4 flex flex-col max-h-[92vh]">
        
        {/* Barra Superior de Ações (Não Imprime) */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-lg">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Relatório de Desempenho e Evolução Formativa · Exercício {anoAtual}
              </h2>
              <p className="text-xs text-slate-400">
                Exportação oficial em PDF profissional com gráficos de barras D3.js e validação hospitalar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botão de Descarregar PDF Direto via jsPDF */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Gerar e descarregar documento PDF de alta definição com gráficos"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
                  <span>A Gerar PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>Descarregar PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* Botão de Impressão do Sistema */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
              title="Abrir diálogo de impressão e Guardar em PDF nativo do navegador"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Imprimir / Diálogo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
              title="Fechar janela de exportação"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Documento Formatado para Ecrã e Impressão PDF */}
        <div 
          ref={printAreaRef}
          className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-white print:p-0 print:overflow-visible text-slate-900"
        >
          
          {/* CABEÇALHO HOSPITALAR OFICIAL ULSAR */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-widest">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>Unidade Local de Saúde · ULSAR, EPE</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
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
                <p className="text-[11px] text-slate-400 mt-1">RadForm · Sistema Hospitalar</p>
              </div>
            </div>
          </div>

          {/* PAINEL DE INDICADORES CHAVE DE DESEMPENHO (KPIS) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>1. Indicadores Chave de Desempenho (KPIs do Serviço)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* KPI 1: Horas */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg">
                <span className="text-[10px] font-semibold text-teal-900 uppercase block">Horas Realizadas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <strong className="text-xl font-bold font-mono text-teal-950">{totalHoras}</strong>
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
                  <strong className="text-xl font-bold font-mono text-blue-950">{totalAcoes}</strong>
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
                  {acoesPnf} de {totalAcoes} no plano
                </span>
              </div>

              {/* KPI 4: Burocracia */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <span className="text-[10px] font-semibold text-amber-900 uppercase block">Conformidade Burocrática</span>
                <div className="mt-1">
                  <strong className="text-xl font-bold font-mono text-amber-950">{percBurocracia}%</strong>
                </div>
                <span className="text-[10px] text-amber-800 mt-1.5 block">
                  {acoesBurocraciaOk} de {totalAcoes} validadas
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

          {/* GRÁFICO DE BARRAS D3 DE EVOLUÇÃO MENSAL (VETORIAL DE ALTA DEFINIÇÃO PARA PDF) */}
          <div className="space-y-2 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-700" />
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

          {/* DESEMPENHO POR GRUPO E CATEGORIA PROFISSIONAL */}
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

          {/* DISTRIBUIÇÃO POR TIPO DE FORMAÇÃO */}
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

          {/* PARECER E VALIDAÇÃO DA AUDITORIA DA QUALIDADE */}
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-lg text-xs space-y-1.5 print-break-inside-avoid">
            <strong className="text-teal-950 font-bold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Conclusões da Auditoria de Desempenho e Conformidade:
            </strong>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              O presente relatório comprova que no exercício de <strong>{anoAtual}</strong> foram concluídas <strong>{totalAcoes}</strong> ações formativas perfazendo um volume total de <strong>{totalHoras} horas</strong>. A taxa global de integração com o Plano de Necessidades Formativas (PNF) fixou-se em <strong>{percPnf}%</strong> e o nível de conformidade burocrática atingiu <strong>{percBurocracia}%</strong>. O documento cumpre com os normativos hospitalares da ULSAR, EPE e encontra-se devidamente auditado no sistema RadForm.
            </p>
          </div>

          {/* BLOCO DE ASSINATURAS OFICIAIS */}
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

      </div>
    </div>
  );
};
