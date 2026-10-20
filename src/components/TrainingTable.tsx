import React, { useState, useMemo, useRef } from 'react';
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
  Users,
  AlertCircle,
  FileCheck,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  ArrowUpDown,
  Calendar,
  FileDown,
  Loader2,
  Printer
} from 'lucide-react';
import { exportFormacoesToExcel } from '../utils/exportUtils';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper para determinar se a burocracia de uma formação está 100% completa
export const verificarBurocraciaCompleta = (formacao: Formacao, configuracoes?: ConfiguracoesApp): boolean => {
  if (formacao.burocracia) {
    return true;
  }
  const subtipo: SubtipoBurocracia = formacao.subtipoBurocracia || (
    formacao.categoria === 'ACAF' ? 'ACAF (inclui NIFTSDT)' :
    formacao.categoria === 'Enfermagem' ? 'Enfermagem (só Internas)' :
    formacao.categoria === 'Externa' ? 'Externa (inclui Enfermagem Externas)' :
    formacao.categoria === 'Interna' ? 'Interna - Formador Interno (i.e. só TSDT)' :
    'Externa (inclui Enfermagem Externas)'
  );
  const matrizReq = configuracoes?.matrizBurocraciaCustomizada?.[subtipo] || MATRIZ_BUROCRACIA[subtipo];
  if (!matrizReq) return !!formacao.burocracia;

  const docs = formacao.documentosBurocracia || {};
  let temObrigatorios = false;
  for (const k of Object.keys(matrizReq) as Array<keyof RequisitosDocumentais>) {
    if (matrizReq[k] === 'sim') {
      temObrigatorios = true;
      if (!docs[k as keyof DocumentosValidacaoFormacao]) {
        return false;
      }
    }
  }

  return temObrigatorios ? true : !!formacao.burocracia;
};

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
  onCriarFormacaoDeCertificado?: (novaFormacao: Formacao) => void;
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

  // PDF Export States and Handler (Requisito 5)
  const pdfTableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMensagem, setPdfMensagem] = useState<string | null>(null);

  const handleExportarPdf = async () => {
    if (filteredFormacoes.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      // Criação de documento PDF oficial em formato Paisagem (Landscape) A4 (297mm x 210mm)
      const pdf = new jsPDF('l', 'mm', 'a4');
      const ano = anoAtual;
      const totalAcoes = filteredFormacoes.length;
      const totalHoras = totalHorasFiltradas;
      const totalRealiz = totalRealizadas;
      const totalConforme = filteredFormacoes.filter(f => verificarBurocraciaCompleta(f, configuracoes)).length;
      const percConforme = totalAcoes > 0 ? Math.round((totalConforme / totalAcoes) * 100) : 0;

      // ─── CABEÇALHO HOSPITALAR OFICIAL (PÁGINA 1) ───
      // Barra superior institucional em tom teal
      pdf.setDrawColor(15, 118, 110);
      pdf.setLineWidth(1.2);
      pdf.line(8, 7, 289, 7);

      // Canto superior esquerdo: apenas "ULSAR - Serviço de Radioterapia"
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(19, 78, 74);
      pdf.text('ULSAR - Serviço de Radioterapia', 8, 18);

      // Bloco de Emissão à Direita
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(205, 9, 84, 18.5, 1.5, 1.5, 'FD');

      const emissaoData = new Date().toLocaleDateString('pt-PT');
      const emissaoHora = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Emissão: ${emissaoData} às ${emissaoHora}`, 208, 14);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 118, 110);
      pdf.text(`${totalAcoes} Formações · ${totalHoras} Horas Acumuladas`, 208, 19);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Realizadas: ${totalRealiz} · Burocracia Conforme: ${totalConforme}`, 208, 24);

      // ─── 4 CAIXAS DE RESUMO DE MÉTRICAS (LARGURA TOTAL = 281mm) ───
      const kpiW = (281 - 6) / 4; // ~68.75mm cada
      const kpis = [
        { label: 'FORMAÇÕES LISTADAS', val: `${totalAcoes}`, bg: [248, 250, 252], text: [30, 41, 59] },
        { label: 'VOLUME TOTAL HORAS', val: `${totalHoras}h`, bg: [240, 253, 250], text: [15, 118, 110] },
        { label: 'FORMAÇÕES REALIZADAS', val: `${totalRealiz} / ${totalAcoes}`, bg: [236, 253, 245], text: [4, 120, 87] },
        { label: 'BUROCRACIA CONFORME', val: `${totalConforme} (${percConforme}%)`, bg: [239, 246, 255], text: [29, 78, 216] }
      ];

      kpis.forEach((kpi, i) => {
        const kpiX = 8 + i * (kpiW + 2);
        pdf.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(kpiX, 29.5, kpiW, 9.5, 1, 1, 'FD');

        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 116, 139);
        pdf.text(kpi.label, kpiX + 3, 33);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
        pdf.text(kpi.val, kpiX + 3, 37.2);
      });

      // ─── DADOS DAS FORMAÇÕES NAS 8 COLUNAS SELECIONADAS (SEM AS 4 COLUNAS APÓS HORAS) ───
      const tableData = filteredFormacoes.map(f => {
        const dataStr = f.data ? `${f.data}${f.dataFim ? ` a ${f.dataFim}` : ''}` : '-';
        const destStr = f.destinatarios && f.destinatarios.length > 0 ? f.destinatarios.join(', ') : '-';
        let obsColab = '';
        if (f.colaboradores && f.colaboradores.length > 0) {
          obsColab += `Colab: ${f.colaboradores.join(', ')}`;
        }
        if (f.observacoes) {
          obsColab += (obsColab ? `\nObs: ${f.observacoes}` : f.observacoes);
        }
        if (!obsColab) obsColab = '-';

        return [
          f.realizada ? 'BISGA' : '-',
          f.nome || '-',
          f.categoria || '-',
          destStr,
          dataStr,
          f.frequentadaColaboradorRad ? 'Sim' : 'Não',
          f.horasTexto || `${f.horas}h`,
          obsColab
        ];
      });

      // Ajustar espaçamento generoso entre linhas e altura confortável das células
      pdf.setLineHeightFactor(1.55);

      // ─── TABELA VETORIAL AUTOTABLE (NUNCA CORTA NA DIREITA NEM ENTRE FOLHAS) ───
      autoTable(pdf, {
        startY: 42,
        tableWidth: 281,
        margin: { left: 8, right: 8, top: 14, bottom: 12 },
        head: [[
          'Realiz.',
          'Nome da Formação',
          'Tipo / Categoria',
          'Destinatários',
          'Data Realiz.',
          'Freq. RAD',
          'Horas',
          'Observações & Colaboradores'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 118, 110], // Teal 700 (#0f766e)
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10.5,
          halign: 'center',
          valign: 'middle',
          cellPadding: 3.5,
          lineColor: [148, 163, 184],
          lineWidth: 0.15
        },
        styles: {
          fontSize: 10.5,
          cellPadding: { top: 4.2, bottom: 4.2, left: 2.5, right: 2.5 },
          minCellHeight: 11.5,
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
          overflow: 'linebreak',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate 50
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 76, halign: 'left', fontStyle: 'bold' },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 32, halign: 'center' },
          4: { cellWidth: 28, halign: 'center' },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          7: { cellWidth: 70, halign: 'left' }
        },
        willDrawCell: (data) => {
          // Limpa o texto da célula quando for bisga para desenhar vetor nítido
          if (data.section === 'body' && data.column.index === 0 && data.cell.raw === 'BISGA') {
            data.cell.text = [''];
          }
        },
        didDrawCell: (data) => {
          // Desenhar bisga pequena e delicada (checkmark vetorizado nítido em verde esmeralda) na coluna "Realiz."
          if (data.section === 'body' && data.column.index === 0 && data.cell.raw === 'BISGA') {
            const x = data.cell.x + data.cell.width / 2;
            const y = data.cell.y + data.cell.height / 2;
            pdf.setDrawColor(4, 120, 87); // emerald-700
            pdf.setLineWidth(0.42);
            pdf.line(x - 1.2, y, x - 0.4, y + 1.1);
            pdf.line(x - 0.4, y + 1.1, x + 1.5, y - 1.3);
          }
        },
        pageBreak: 'auto',
        showHead: 'everyPage',
        didDrawPage: (data) => {
          // Cabeçalho institucional discreto de continuação nas folhas seguintes (página 2 em diante)
          if (data.pageNumber > 1) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(19, 78, 74);
            pdf.text('ULSAR - Serviço de Radioterapia · Continuação', 8, 8.5);
            pdf.setDrawColor(15, 118, 110);
            pdf.setLineWidth(0.4);
            pdf.line(8, 10.5, 289, 10.5);
          }
        }
      });

      // Numeração de páginas rigorosa (Página X de Y) em todas as folhas após renderização completa
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          289,
          204,
          { align: 'right' }
        );
      }

      const dataHoje = new Date().toISOString().slice(0, 10);
      pdf.save(`RadForm_Registo_Formacoes_${ano}_${dataHoje}.pdf`);
      setPdfMensagem('Documento oficial em PDF (orientação horizontal / sem quebras nem cortes) exportado com sucesso.');
      setTimeout(() => setPdfMensagem(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF das formações via autoTable:', err);
      // Fallback para impressão caso ocorra algum imprevisto
      handlePrintTable();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintTable = () => {
    window.print();
  };

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

      // Filtro de Destinatário (suporta TAS e retrocompatibilidade com AO)
      if (selectedDestinatario !== 'todos') {
        const matchesDest = f.destinatarios.includes(selectedDestinatario as DestinatarioGrupo) || 
          (selectedDestinatario === 'TAS' && f.destinatarios.includes('AO' as any));
        if (!matchesDest) return false;
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
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
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
      <div className="no-print bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        
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
              <option value="AT">AT</option>
              <option value="ENF">ENF</option>
              <option value="FIS">FIS</option>
              <option value="MR">MR</option>
              <option value="TAS">TAS</option>
              <option value="TSDT">TSDT</option>
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

        {/* Linha 2: Barra de Ações na ordem: "Nova Formação", "Importar Burocracia", "Importar Plano Anual", "Exportar Excel" e "Exportar PDF" */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {/* Botão 1: Nova Formação */}
          <button
            onClick={onOpenNovoRegisto}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Registar nova formação no sistema"
          >
            <Plus className="w-3.5 h-3.5 text-teal-200" />
            <span>Nova Formação</span>
          </button>

          {/* Botão 2: Importar Burocracia */}
          {onOpenImportRealizadas && (
            <button
              onClick={onOpenImportRealizadas}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="Importar documentação e burocracia das formações (PDF, DOC, JPEG, PNG)"
            >
              <Upload className="w-3.5 h-3.5 text-teal-200" />
              <span>Importar Burocracia</span>
            </button>
          )}

          {/* Botão 3: Importar Plano Anual (com a mesma cor de "Início do Ano" da aba "Tarefas & Cronograma": bg-blue-50 text-blue-800 border-blue-200) */}
          <button
            onClick={onOpenImportPnf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Importar Plano Anual e verificar automaticamente inclusão no PNF"
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Importar Plano Anual</span>
          </button>

          {/* Botão 4: Exportar Excel */}
          <button
            onClick={onOpenConfigurarExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Definir campos e exportar para Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exportar Excel</span>
          </button>

          {/* Botão 5: Exportar PDF (com a mesma cor do Exportar Excel de Relatórios, orientação horizontal) */}
          <button
            type="button"
            onClick={handleExportarPdf}
            disabled={filteredFormacoes.length === 0 || isGeneratingPdf}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs whitespace-nowrap ${
              filteredFormacoes.length > 0 && !isGeneratingPdf
                ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer active:scale-98'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title="Exportar documento visual oficial das formações com orientação na horizontal (Landscape) para PDF"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>A gerar PDF horizontal...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-700" />
                <span>Exportar PDF</span>
              </>
            )}
          </button>

          {/* Botão 6: Imprimir Tabela de Formações (cinzento como na aba Relatórios, na horizontal / landscape) */}
          <button
            type="button"
            onClick={handlePrintTable}
            disabled={filteredFormacoes.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-2xs whitespace-nowrap ${
              filteredFormacoes.length > 0
                ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer active:scale-98'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title="Imprimir a tabela de formações com orientação na horizontal (Landscape)"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir</span>
          </button>
        </div>

        {/* Linha 3: Nível inferior e esquerdo - Contador de registos listados */}
        <div className="pt-2 text-xs text-slate-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>
            A apresentar <strong className="text-slate-900 font-bold font-mono">{filteredFormacoes.length}</strong> {filteredFormacoes.length === 1 ? 'formação' : 'formações'}
            {filteredFormacoes.length !== formacoes.filter(f => f.ano === anoAtual).length && (
              <span className="text-slate-400 font-normal ml-1">
                (de {formacoes.filter(f => f.ano === anoAtual).length} no ano {anoAtual})
              </span>
            )}
          </span>
        </div>

      </div>

      {/* TABELA DE DADOS COM CABEÇALHO FIXO (STICKY HEADER) E NOME DA FORMAÇÃO FIXO AO SCROLL (STICKY COLUMN) */}
      <div className="no-print bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden relative">
        <div className="overflow-auto max-h-[70vh] relative scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Header Sticky (Fixado no topo ao fazer scroll down) */}
            <thead className="sticky top-0 z-30 bg-amber-100/95 backdrop-blur-xs shadow-xs border-b border-amber-300 select-none">
              <tr className="text-slate-900 font-bold text-[11px] leading-tight">
                
                {/* Col 0: Realizada (Fixa à esquerda) */}
                <th className="sticky left-0 z-40 bg-amber-100 py-3 px-1.5 text-center w-12 border-r border-amber-200 shadow-xs" title="Formação Realizada (pisga)">
                  Realiz.
                </th>

                {/* Col 1: Nome da Formação (Fixa à esquerda mantendo-se sempre visível ao scrollar para a direita) */}
                <th className="sticky left-12 z-40 bg-amber-100 py-3 px-3 min-w-[280px] border-r border-amber-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
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

                <th className="py-3 px-2.5 text-center min-w-[130px] sticky right-0 z-30 bg-amber-100 border-l border-amber-200">
                  Ações & Outlook
                </th>
              </tr>
            </thead>

            {/* Linhas da Tabela */}
            <tbody className="divide-y divide-slate-100">
              {filteredFormacoes.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-14 text-center text-slate-500 bg-white">
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
                      {/* Realizada pisga (Sticky left-0) */}
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-amber-50/90 py-2.5 px-1.5 text-center border-r border-slate-100 shadow-xs">
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

                      {/* Nome da Formação (Sticky left-12 mantendo-se sempre fixo ao scrollar a informação para a direita) */}
                      <td className="sticky left-12 z-20 bg-white group-hover:bg-amber-50/90 py-2.5 px-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] min-w-[280px]">
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
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Botão Editar */}
                          <button
                            onClick={() => onEdit(formacao)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Editar dados da formação"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Disparo de Email Outlook 6 Meses */}
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

                          {/* 3. Botão Burocracia (Verde se completa, Vermelho se incompleta) */}
                          {(() => {
                            const isCompleta = verificarBurocraciaCompleta(formacao, configuracoes);
                            return (
                              <button
                                onClick={() => onNavigateToBurocracia && onNavigateToBurocracia(formacao.id)}
                                className={`p-1 rounded transition-colors cursor-pointer border flex items-center justify-center ${
                                  isCompleta
                                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 font-bold'
                                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300 font-bold'
                                }`}
                                title={
                                  isCompleta
                                    ? 'Burocracia Completa (100% dos requisitos cumpridos) - Clique para ver na aba Burocracia'
                                    : 'Burocracia Incompleta (Documentos pendentes) - Clique para gerir e validar na aba Burocracia'
                                }
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}

                          {/* 4. Botão Eliminar / Remover */}
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

      {/* Mensagem de sucesso da exportação PDF */}
      {pdfMensagem && (
        <div className="no-print p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-700" />
            <span>{pdfMensagem}</span>
          </div>
          <button 
            type="button"
            onClick={() => setPdfMensagem(null)} 
            className="text-teal-600 hover:text-teal-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Container do Documento Oficial em Alta Definição (Utilizado para Exportar PDF e Imprimir com orientação na horizontal / Landscape) */}
      <div 
        className="print-document-container fixed -left-[9999px] -top-[9999px] z-[-100] print:static print:left-0 print:top-0 print:z-auto print:block print:w-full print:max-w-full print:overflow-visible print:m-0 print:p-0"
      >
        <div 
          ref={pdfTableRef}
          className="bg-white p-6 text-slate-800 font-sans space-y-3 w-full max-w-full print:p-0 print:space-y-3 print:w-full print:max-w-full print:m-0"
          style={{ width: '100%', maxWidth: '100%', backgroundColor: '#ffffff' }}
        >
          {/* Cabeçalho Hospitalar Oficial (ULSAR, EPE · Serviço de Radioterapia) */}
          <div className="border-b-2 border-teal-700 pb-3 print-break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-teal-900 leading-tight">
                  ULSAR - Serviço de Radioterapia
                </h1>
              </div>
              <div className="text-right text-[11px] text-slate-600 font-mono space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200 shrink-0">
                <p><span className="text-slate-400 font-sans">Emissão:</span> <strong>{new Date().toLocaleDateString('pt-PT')}</strong></p>
                <p><span className="text-slate-400 font-sans">Hora:</span> <strong>{new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</strong></p>
                <p className="text-teal-700 font-bold font-sans mt-0.5">{filteredFormacoes.length} Formações Registadas</p>
                <p className="text-slate-500 font-sans text-[10px]">{totalHorasFiltradas} Horas Acumuladas</p>
              </div>
            </div>

            {/* Painel Resumo de Métricas para o PDF / Impressão */}
            <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Formações Listadas</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{filteredFormacoes.length}</span>
              </div>
              <div className="bg-teal-50 p-1.5 rounded border border-teal-200">
                <span className="text-[9px] text-teal-700 uppercase font-bold block">Volume Total Horas</span>
                <span className="text-sm font-bold text-teal-800 font-mono">{totalHorasFiltradas}h</span>
              </div>
              <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200">
                <span className="text-[9px] text-emerald-700 uppercase font-bold block">Formações Realizadas</span>
                <span className="text-sm font-bold text-emerald-800 font-mono">{totalRealizadas} / {filteredFormacoes.length}</span>
              </div>
              <div className="bg-blue-50 p-1.5 rounded border border-blue-200">
                <span className="text-[9px] text-blue-700 uppercase font-bold block">Burocracia Conforme</span>
                <span className="text-sm font-bold text-blue-800 font-mono">
                  {filteredFormacoes.filter(f => verificarBurocraciaCompleta(f, configuracoes)).length} ({filteredFormacoes.length > 0 ? Math.round((filteredFormacoes.filter(f => verificarBurocraciaCompleta(f, configuracoes)).length / filteredFormacoes.length) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Formações com a Ordem Exata das Colunas (largura fixa proporcional 100% que nunca corta à direita) */}
          <div className="border border-slate-300 rounded-lg overflow-visible print:border-slate-300 print:rounded-none print:w-full print:max-w-full">
            <table className="w-full max-w-full table-fixed text-left text-xs border-collapse border border-slate-300">
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '24%' }} />
              </colgroup>
              <thead style={{ display: 'table-header-group' }} className="print-break-inside-avoid">
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 leading-tight text-[13px]">
                  <th className="py-2.5 px-1 text-center border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Realiz.</th>
                  <th className="py-2.5 px-2 text-left border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Nome da Formação</th>
                  <th className="py-2.5 px-1 text-center border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Tipo / Cat.</th>
                  <th className="py-2.5 px-1 text-center border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Destinatários</th>
                  <th className="py-2.5 px-1 text-center border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Data Realiz.</th>
                  <th className="py-2.5 px-0.5 text-center border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Freq.</th>
                  <th className="py-2.5 px-0.5 text-center border-r border-slate-300 break-words" style={{ wordBreak: 'break-word' }}>Horas</th>
                  <th className="py-2.5 px-2 text-left break-words" style={{ wordBreak: 'break-word' }}>Observações & Colab.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFormacoes.map((f, idx) => (
                  <tr 
                    key={f.id} 
                    className={`print-break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}`}
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    {/* 1. Realiz. (bisga quando realizada) */}
                    <td className="py-3 px-0.5 text-center border-r border-slate-200 align-top">
                      {f.realizada ? (
                        <span className="inline-flex items-center justify-center text-emerald-700 font-bold text-sm leading-none">
                          ✔
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </td>

                    {/* 2. Nome da Formação */}
                    <td className="py-3 px-2 border-r border-slate-200 font-bold text-slate-900 text-[13.5px] leading-snug align-top break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {f.nome}
                    </td>

                    {/* 3. Tipo / Categoria */}
                    <td className="py-3 px-1 text-center border-r border-slate-200 font-medium text-slate-800 text-[13px] leading-snug align-top break-words" style={{ wordBreak: 'break-word' }}>
                      {f.categoria}
                    </td>

                    {/* 4. Destinatários */}
                    <td className="py-3 px-1 text-center border-r border-slate-200 text-slate-700 text-[13px] leading-snug align-top break-words" style={{ wordBreak: 'break-word' }}>
                      {f.destinatarios && f.destinatarios.length > 0 ? f.destinatarios.join(', ') : '-'}
                    </td>

                    {/* 5. Data da Realização */}
                    <td className="py-3 px-1 text-center font-mono text-slate-700 border-r border-slate-200 text-[12.5px] leading-snug align-top break-words" style={{ wordBreak: 'break-word' }}>
                      {f.data}{f.dataFim ? ` a ${f.dataFim}` : ''}
                    </td>

                    {/* 6. Freq. RAD */}
                    <td className="py-3 px-0.5 text-center border-r border-slate-200 font-medium text-[13px] align-top">
                      <span className={f.frequentadaColaboradorRad ? 'text-teal-800 font-bold' : 'text-slate-400'}>
                        {f.frequentadaColaboradorRad ? 'Sim' : 'Não'}
                      </span>
                    </td>

                    {/* 7. Horas (h) */}
                    <td className="py-3 px-0.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200 text-[13.5px] align-top">
                      {f.horasTexto || `${f.horas}h`}
                    </td>

                    {/* 8. Observações & Colaboradores */}
                    <td className="py-3 px-2 text-slate-700 leading-snug text-[13px] align-top break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {f.colaboradores && f.colaboradores.length > 0 && (
                        <div className="font-mono text-teal-900 font-semibold mb-1">
                          Colab: {f.colaboradores.join(', ')}
                        </div>
                      )}
                      {f.observacoes ? <span>{f.observacoes}</span> : (!f.colaboradores || f.colaboradores.length === 0 ? '-' : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
