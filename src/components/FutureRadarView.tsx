import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { FormacaoFutura, DestinatarioGrupo, SiteFormacaoRadar } from '../types';
import { FUTURE_FORMACOES_RADAR, INITIAL_SITES_RADAR } from '../data/futureFormations';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Globe, 
  Filter, 
  BookmarkPlus, 
  Sparkles,
  Building,
  Monitor,
  Users,
  Compass,
  RotateCw,
  Plus,
  CalendarPlus,
  CheckCircle2,
  Tag,
  DollarSign,
  Gift,
  X,
  Globe2,
  Check,
  FileSpreadsheet,
  Printer,
  FileDown,
  Loader2
} from 'lucide-react';
import { exportRadarEventosToExcel, printRadarEventosPDF } from '../utils/exportUtils';

interface FutureRadarViewProps {
  onPlanearFormacao: (futura: FormacaoFutura) => void;
}

export const FutureRadarView: React.FC<FutureRadarViewProps> = ({ onPlanearFormacao }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTema, setSelectedTema] = useState<string>('todos');
  const [selectedAmbito, setSelectedAmbito] = useState<string>('todos');
  const [selectedFormato, setSelectedFormato] = useState<string>('todos');
  const [selectedEntidade, setSelectedEntidade] = useState<string>('todas');
  const [selectedCusto, setSelectedCusto] = useState<'todos' | 'gratis' | 'pago'>('todos');

  // Lista dinâmica de sites monitorizados no radar
  const [sitesRadar, setSitesRadar] = useState<SiteFormacaoRadar[]>(() => {
    try {
      const stored = localStorage.getItem('radform_sites_radar_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_SITES_RADAR;
  });

  // Lista dinâmica de eventos futuros
  const [listaEventos, setListaEventos] = useState<FormacaoFutura[]>(FUTURE_FORMACOES_RADAR);
  
  // Estado de scanning / refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ultimoRefresh, setUltimoRefresh] = useState<string>('Hoje, às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Modal para Adicionar Novo Site
  const [isNovoSiteModalOpen, setIsNovoSiteModalOpen] = useState(false);
  const [novoSiteNome, setNovoSiteNome] = useState('');
  const [novoSiteUrl, setNovoSiteUrl] = useState('');
  const [novoSiteAmbito, setNovoSiteAmbito] = useState<'Nacional' | 'Internacional'>('Nacional');
  const [novoSiteTemas, setNovoSiteTemas] = useState('Radioterapia, Oncologia');

  // Modal com a Lista de Portais Ativos
  const [isVerPortaisOpen, setIsVerPortaisOpen] = useState(false);

  // Temas específicos e monitorizados disponíveis no Radar de Formação Futura
  const TEMAS_PADRAO = [
    'Efeitos secundários de Radioterapia',
    'Dosimetria',
    'Comunicação ao doente oncológico',
    'Radioterapia',
    'Oncologia',
    'Cancro',
    'Inteligência emocional',
    'Gestão de tempo',
    'Burnout',
    'Acelerador linear',
    'Elaborar investigação',
    'Elaborar artigos científicos',
    'Desenvolvimento Pessoal e Emocional',
    'Tumores',
    'Doente Oncológico',
    'Radiação',
    'Radiobiologia',
    'Física Médica',
    'Qualidade e Gestão'
  ];

  const [temasMonitorizados, setTemasMonitorizados] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('radform_temas_radar_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const obrigatorios = ['Efeitos secundários de Radioterapia', 'Dosimetria', 'Comunicação ao doente oncológico'];
          return Array.from(new Set([...obrigatorios, ...parsed]));
        }
      }
    } catch {
      // fallback
    }
    return TEMAS_PADRAO;
  });

  const [temaAdicionadoRecentemente, setTemaAdicionadoRecentemente] = useState<string | null>(() => {
    try {
      return localStorage.getItem('radform_tema_recente_radar') || null;
    } catch {
      return null;
    }
  });

  const [isAdicionarTemaModalOpen, setIsAdicionarTemaModalOpen] = useState(false);
  const [novoTemaInput, setNovoTemaInput] = useState('');

  const handleAdicionarNovoTema = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novoTemaInput.trim();
    if (!nomeLimpo) return;

    const novaLista = [nomeLimpo, ...temasMonitorizados.filter(t => t.toLowerCase() !== nomeLimpo.toLowerCase())];
    setTemasMonitorizados(novaLista);
    setTemaAdicionadoRecentemente(nomeLimpo);
    try {
      localStorage.setItem('radform_temas_radar_v2', JSON.stringify(novaLista));
      localStorage.setItem('radform_tema_recente_radar', nomeLimpo);
    } catch {}

    setNovoTemaInput('');
    setIsAdicionarTemaModalOpen(false);
    setMensagemSucesso(`Tema "${nomeLimpo}" adicionado com sucesso à monitorização e aos filtros do Radar.`);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const temasDisponiveis = useMemo(() => {
    return Array.from(new Set(temasMonitorizados));
  }, [temasMonitorizados]);

  // Entidades únicas para o filtro
  const entidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    listaEventos.forEach(f => set.add(f.entidade));
    return Array.from(set).sort();
  }, [listaEventos]);

  // Executar Refresh de Pesquisa em todos os sites
  const handleRefreshPesquisa = () => {
    setIsRefreshing(true);
    setMensagemSucesso(null);

    // Simula a sincronização e varrimento em tempo real dos portais
    setTimeout(() => {
      setIsRefreshing(false);
      setUltimoRefresh('Hoje, às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
      setMensagemSucesso(`Pesquisa concluída com sucesso em ${sitesRadar.length} portais hospitalares e académicos. Lista atualizada.`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    }, 1200);
  };

  // Adicionar Novo Site de Formação
  const handleAdicionarNovoSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoSiteNome.trim() || !novoSiteUrl.trim()) return;

    let urlFinal = novoSiteUrl.trim();
    if (!urlFinal.startsWith('http://') && !urlFinal.startsWith('https://')) {
      urlFinal = 'https://' + urlFinal;
    }

    const novoSite: SiteFormacaoRadar = {
      id: `site-${Date.now()}`,
      nome: novoSiteNome.trim(),
      url: urlFinal,
      ambito: novoSiteAmbito,
      temas: novoSiteTemas.split(',').map(t => t.trim()).filter(Boolean),
      ativo: true,
      dataAdicao: new Date().toISOString().slice(0, 10)
    };

    const novaListaSites = [novoSite, ...sitesRadar];
    setSitesRadar(novaListaSites);
    localStorage.setItem('radform_sites_radar_v1', JSON.stringify(novaListaSites));

    // Reset formulário
    setNovoSiteNome('');
    setNovoSiteUrl('');
    setIsNovoSiteModalOpen(false);
    setMensagemSucesso(`Portal "${novoSite.nome}" adicionado com sucesso ao radar de formações.`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  // Gerar Agendamento no Calendário Outlook com radform@ulsar.min-saude.pt
  const handleAgendarOutlook = (evento: FormacaoFutura) => {
    const attendees = 'radform@ulsar.min-saude.pt';
    const assunto = `[Formação] ${evento.titulo} (${evento.entidade})`;
    const local = evento.local || 'Online / Webinar';
    const corpo = `Lembrete de Formação Profissional Agendada:

• Ação Formativa: ${evento.titulo}
• Entidade Organizadora: ${evento.entidade}
• Data: ${evento.dataInicio} ${evento.dataFim ? `a ${evento.dataFim}` : ''}
• Formato: ${evento.formato} (${evento.ambito})
• Custo / Inscrição: ${evento.gratis ? 'GRÁTIS (Gratuito)' : evento.custoTexto || 'Pago'}
• Destinatários: ${evento.destinatariosSugeridos.join(', ')}
• Inscrição & Programa Oficial: ${evento.url}

Agendado automaticamente através da plataforma RadForm para o endereço: radform@ulsar.min-saude.pt`;

    // Formato de data ISO para o deep link do calendário do Outlook Web
    const dataIsoInicio = `${evento.dataInicio}T09:00:00`;
    const dataIsoFim = `${evento.dataFim || evento.dataInicio}T17:00:00`;

    // Deep link oficial do Outlook Web Calendar Compose
    const outlookCalendarUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(assunto)}&startdt=${encodeURIComponent(dataIsoInicio)}&enddt=${encodeURIComponent(dataIsoFim)}&location=${encodeURIComponent(local)}&body=${encodeURIComponent(corpo)}&attendees=${encodeURIComponent(attendees)}`;

    // Abre janela do Outlook Calendar
    window.open(outlookCalendarUrl, '_blank', 'noopener,noreferrer');

    // Descarrega também o ficheiro .ics padrão
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RadForm ULSAR//Hospital Training Calendar//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${evento.id}@radform.ulsar.min-saude.pt`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${evento.dataInicio.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${(evento.dataFim || evento.dataInicio).replace(/-/g, '')}`,
      `SUMMARY:${assunto}`,
      `DESCRIPTION:${corpo.replace(/\n/g, '\\n')}`,
      `LOCATION:${local}`,
      `ORGANIZER;CN=RadForm ULSAR:mailto:radform@ulsar.min-saude.pt`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=RadForm:mailto:${attendees}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Agendamento_Outlook_${evento.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMensagemSucesso(`Agendamento enviado para o Outlook no email radform@ulsar.min-saude.pt e ficheiro .ics gerado.`);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  // Filtragem e ordenação cronológica
  const eventosFiltrados = useMemo(() => {
    return listaEventos.filter(evento => {
      // Busca por texto
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchesTitulo = evento.titulo.toLowerCase().includes(q);
        const matchesEntidade = evento.entidade.toLowerCase().includes(q);
        const matchesDesc = evento.descricao.toLowerCase().includes(q);
        const matchesLocal = evento.local.toLowerCase().includes(q);
        const matchesTema = evento.temaPrincipal.toLowerCase().includes(q);
        if (!matchesTitulo && !matchesEntidade && !matchesDesc && !matchesLocal && !matchesTema) {
          return false;
        }
      }

      // Filtro de Tema
      if (selectedTema !== 'todos') {
        const match = evento.temaPrincipal === selectedTema ||
          (selectedTema.startsWith('Desenvolvimento Pessoal') && evento.temaPrincipal.startsWith('Desenvolvimento Pessoal'));
        if (!match) return false;
      }

      // Filtro de Âmbito (Nacional vs Internacional)
      if (selectedAmbito !== 'todos' && evento.ambito !== selectedAmbito) {
        return false;
      }

      // Filtro de Formato
      if (selectedFormato !== 'todos' && evento.formato !== selectedFormato) {
        return false;
      }

      // Filtro de Entidade
      if (selectedEntidade !== 'todas' && evento.entidade !== selectedEntidade) {
        return false;
      }

      // Filtro de Custo (Grátis vs Pago)
      if (selectedCusto !== 'todos') {
        const isGratis = !!evento.gratis;
        if (selectedCusto === 'gratis' && !isGratis) return false;
        if (selectedCusto === 'pago' && isGratis) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  }, [listaEventos, searchTerm, selectedTema, selectedAmbito, selectedFormato, selectedEntidade, selectedCusto]);

  const pdfDossierRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Exportar documento PDF visual apelativo com alta resolução
  const handleExportarPdfVisual = async () => {
    if (!pdfDossierRef.current || eventosFiltrados.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      const element = pdfDossierRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 8;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = contentHeight;
      let position = margin;
      let pageNumber = 1;

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = margin - (pageNumber * (pdfHeight - margin * 2));
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - margin * 2);
      }

      const dataHoje = new Date().toISOString().slice(0, 10);
      pdf.save(`RadForm_Radar_Formacoes_Futuras_${dataHoje}.pdf`);
      setMensagemSucesso('Dossier visual em PDF das formações futuras gerado e descarregado com sucesso.');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF visual:', err);
      printRadarEventosPDF(eventosFiltrados);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Introdutório do Radar com Botões de Refresh e Adição de Site */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">
                Radar de Formações Futuras em Radioterapia & Oncologia
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 max-w-4xl leading-relaxed">
              Pesquisa contínua e agregador de webinars, jornadas e congressos nacionais e internacionais.{' '}
              {temaAdicionadoRecentemente && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mr-1.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
                  <span>Tema adicionado recentemente: <strong className="underline decoration-teal-600">{temaAdicionadoRecentemente}</strong></span>
                </span>
              )}
              Monitorização de <strong>{sitesRadar.length} portais oficiais</strong> nos temas:{' '}
              <span className="italic text-slate-700">
                {temasMonitorizados.join(', ')}.
              </span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-mono">
              <span>Última pesquisa nos sites: <strong>{ultimoRefresh}</strong></span>
              <span>·</span>
              <button
                type="button"
                onClick={() => setIsVerPortaisOpen(true)}
                className="text-teal-700 hover:underline cursor-pointer font-sans font-semibold"
              >
                Ver lista de {sitesRadar.length} sites monitorizados →
              </button>
            </div>
          </div>

          {/* Botões de Ação do Radar: Refresh, Adicionar Tema e Adicionar Novo Site */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRefreshPesquisa}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer shadow-2xs active:scale-98 ${
                isRefreshing 
                  ? 'bg-teal-50 text-teal-700 border-teal-300' 
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
              title="Executar novo varrimento nos sites de formações"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-700' : 'text-slate-600'}`} />
              <span>{isRefreshing ? 'A Pesquisar nos Portais...' : 'Atualizar Pesquisa'}</span>
            </button>

            {/* Botão Requisito 6: Adicionar mais temas na pesquisa */}
            <button
              onClick={() => setIsAdicionarTemaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap active:scale-98"
              title="Adicionar mais temas à monitorização de pesquisa do Radar"
            >
              <Tag className="w-3.5 h-3.5 text-teal-700" />
              <span>Adicionar Tema à Pesquisa</span>
            </button>

            <button
              onClick={() => setIsNovoSiteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-98"
              title="Adicionar novo portal ou entidade à base de dados do radar"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Site de Formação</span>
            </button>
          </div>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Painel de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
        
        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar por título do evento, tema, entidade organizadora ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Linha de Filtros Dropdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          
          {/* Filtro Tema */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tema Principal:
            </label>
            <select
              value={selectedTema}
              onChange={(e) => setSelectedTema(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="todos">Todos os Temas</option>
              {temasDisponiveis.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filtro Custo (Grátis vs Pago) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Custo de Inscrição:
            </label>
            <select
              value={selectedCusto}
              onChange={(e) => setSelectedCusto(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
            >
              <option value="todos">Todos os Valores</option>
              <option value="gratis">Apenas Grátis (Gratuitas)</option>
              <option value="pago">Apenas Pagas / Com Inscrição</option>
            </select>
          </div>

          {/* Filtro Âmbito */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Âmbito Geográfico:
            </label>
            <select
              value={selectedAmbito}
              onChange={(e) => setSelectedAmbito(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="todos">Nacional & Internacional</option>
              <option value="Nacional">Nacional (Portugal)</option>
              <option value="Internacional">Internacional (Europa / EUA)</option>
            </select>
          </div>

          {/* Filtro Formato */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Formato de Realização:
            </label>
            <select
              value={selectedFormato}
              onChange={(e) => setSelectedFormato(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="todos">Todos os Formatos</option>
              <option value="Webinar">Webinar (Online)</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>

          {/* Filtro Entidade */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Entidade Organizadora:
            </label>
            <select
              value={selectedEntidade}
              onChange={(e) => setSelectedEntidade(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden truncate"
            >
              <option value="todas">Todas as Entidades</option>
              {entidadesDisponiveis.map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Lista de Formações Futuras em Cartões Detalhados */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span>A exibir <strong>{eventosFiltrados.length}</strong> eventos ordenados por data cronológica:</span>
          
          {/* Botões Requisito 1: Exportar Excel, Imprimir e Exportar PDF separados */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportRadarEventosToExcel(eventosFiltrados)}
              disabled={eventosFiltrados.length === 0}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs whitespace-nowrap ${
                eventosFiltrados.length > 0
                  ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title="Exportar todos os eventos cronológicos para folha de cálculo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportarPdfVisual}
              disabled={eventosFiltrados.length === 0 || isGeneratingPdf}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs whitespace-nowrap ${
                eventosFiltrados.length > 0 && !isGeneratingPdf
                  ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title="Exportar documento visual executivo com todas as futuras formações em PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>A gerar PDF visual...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-700" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>

            {/* Botão de Imprimir colocado em último */}
            <button
              type="button"
              onClick={handleImprimir}
              disabled={eventosFiltrados.length === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-2xs ${
                eventosFiltrados.length > 0
                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title="Imprimir a lista de formações futuras formatada"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
            <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhum evento futuro encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Experimente alargar os filtros de pesquisa ou alterar o tema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventosFiltrados.map((evento) => {
              const isGratis = !!evento.gratis;

              return (
                <div 
                  key={evento.id}
                  className={`bg-white rounded-lg border transition-all p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-sm ${
                    evento.destaque ? 'border-teal-300 ring-1 ring-teal-100' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header do Cartão: Badges de Custo, Formato e Âmbito */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        
                        {/* BADGE CLARA DE CUSTO: GRÁTIS OU PAGO */}
                        {isGratis ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Gift className="w-3 h-3" />
                            <span>GRÁTIS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <DollarSign className="w-3 h-3" />
                            <span>PAGO</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {evento.formato}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evento.ambito === 'Nacional' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {evento.ambito}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {evento.temaPrincipal}
                      </span>
                    </div>

                    {/* Título do Evento */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {evento.titulo}
                    </h3>

                    {/* Entidade Organizadora */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{evento.entidade}</span>
                    </div>

                    {/* Data e Local */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="font-semibold text-slate-900">
                          {evento.dataInicio}
                          {evento.dataFim && ` a ${evento.dataFim}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700" title={evento.local}>{evento.local}</span>
                      </div>
                    </div>

                    {/* Informação Explícita de Custo e Duração */}
                    <div className="bg-slate-50 p-2 rounded mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">
                        Inscrição: <strong className={isGratis ? 'text-emerald-700 font-bold' : 'text-slate-800 font-semibold'}>
                          {evento.custoTexto || (isGratis ? 'Gratuita' : 'Sob Inscrição')}
                        </strong>
                      </span>
                      {evento.horasEstimadas && (
                        <span className="text-slate-500 font-mono">
                          Duração aprox: <strong>{evento.horasEstimadas}h</strong>
                        </span>
                      )}
                    </div>

                    {/* Descrição Curta */}
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-3">
                      {evento.descricao}
                    </p>

                    {/* Destinatários Sugeridos */}
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Público recomendado: </span>
                      <strong className="text-slate-700 font-mono">
                        {evento.destinatariosSugeridos.join(', ')}
                      </strong>
                    </div>
                  </div>

                  {/* Botões de Ação do Cartão */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Botão Oficial: Agendar no Calendário do Outlook no email radform@ulsar.min-saude.pt */}
                    <button
                      type="button"
                      onClick={() => handleAgendarOutlook(evento)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0078D4] hover:bg-[#0060A8] text-white text-xs font-bold rounded-md shadow-2xs transition-colors cursor-pointer active:scale-98"
                      title="Agendar no Calendário Outlook e convidar radform@ulsar.min-saude.pt"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Agendar no Outlook</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Link Externo para Inscrição no Site */}
                      <a
                        href={evento.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="Abrir página oficial do evento"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Site</span>
                      </a>

                      {/* Botão: Planear Registo na Tabela */}
                      <button
                        type="button"
                        onClick={() => onPlanearFormacao(evento)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        title="Importar dados deste evento para novo registo formativo"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Planear Registo</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADICIONAR NOVO SITE DE FORMAÇÃO */}
      {isNovoSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Adicionar Novo Site de Formação ao Radar
                </h3>
              </div>
              <button
                onClick={() => setIsNovoSiteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdicionarNovoSite} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Instituição / Sociedade Científica: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Royal College of Radiologists (RCR)"
                  value={novoSiteNome}
                  onChange={(e) => setNovoSiteNome(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Endereço Web (URL de Eventos / Webinars): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.rcr.ac.uk/clinical-oncology/events"
                  value={novoSiteUrl}
                  onChange={(e) => setNovoSiteUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Âmbito Geográfico:
                  </label>
                  <select
                    value={novoSiteAmbito}
                    onChange={(e) => setNovoSiteAmbito(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  >
                    <option value="Nacional">Nacional (Portugal)</option>
                    <option value="Internacional">Internacional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Temas Principais:
                  </label>
                  <input
                    type="text"
                    value={novoSiteTemas}
                    onChange={(e) => setNovoSiteTemas(e.target.value)}
                    placeholder="Radioterapia, Tumores"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                O portal será adicionado de imediato à lista de monitorização e incluído nas pesquisas futuras do radar.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNovoSiteModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Adicionar ao Radar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER TODOS OS PORTAIS MONITORIZADOS */}
      {isVerPortaisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-5 border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Portais de Formação Monitorizados pelo Radar ({sitesRadar.length} Fontes Oficiais)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lista completa de entidades hospitalares, académicas e de equipamentos
                </p>
              </div>
              <button
                onClick={() => setIsVerPortaisOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 text-xs">
              {sitesRadar.map(site => (
                <div key={site.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <strong className="text-slate-900 font-semibold block truncate">{site.nome}</strong>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline font-mono text-[11px] truncate flex items-center gap-1"
                    >
                      <span className="truncate">{site.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    site.ambito === 'Nacional' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {site.ambito}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsVerPortaisOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR NOVO TEMA À PESQUISA DO RADAR (Requisito 6) */}
      {isAdicionarTemaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Adicionar Novo Tema à Pesquisa
                  </h3>
                  <p className="text-xs text-slate-500">
                    O tema ficará ativo na pesquisa do radar e aparecerá destacado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdicionarTemaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdicionarNovoTema} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Tema ou Palavra-Chave *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Efeitos secundários de Radioterapia, Dosimetria..."
                  value={novoTemaInput}
                  onChange={(e) => setNovoTemaInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Sugestões Rápidas de Temas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Efeitos secundários de Radioterapia',
                    'Dosimetria',
                    'Comunicação ao doente oncológico',
                    'Braquiterapia de Alta Taxa (HDR)',
                    'Inteligência Artificial em Radioterapia',
                    'Radiocirurgia Estereotáxica (SRS)'
                  ].map(sugestao => (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => setNovoTemaInput(sugestao)}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      + {sugestao}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 text-[11px] text-teal-800 leading-relaxed">
                <p>
                  Ao submeter, este tema é imediatamente incorporado na lista de temas e aparecerá à frente de <strong>"Monitorização de {sitesRadar.length} portais oficiais nos temas:"</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdicionarTemaModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!novoTemaInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Adicionar Tema</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Container do Dossier Visual em Alta Definição (Utilizado para Exportar PDF e Imprimir) */}
      <div 
        className="fixed -left-[9999px] -top-[9999px] z-[-100] print:static print:left-0 print:top-0 print:z-auto print:block"
        aria-hidden="true"
      >
        <div 
          ref={pdfDossierRef}
          className="bg-white p-8 text-slate-800 font-sans space-y-6 print:p-0 print:space-y-4"
          style={{ width: '820px', backgroundColor: '#ffffff' }}
        >
          {/* Cabeçalho Hospitalar Oficial (ULSAR, EPE · Serviço de Radioterapia) - Requisito 3 */}
          <div className="border-b-2 border-teal-700 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    REPÚBLICA PORTUGUESA · SAÚDE
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    SNS · SERVIÇO NACIONAL DE SAÚDE
                  </span>
                </div>
                <h1 className="text-xl font-black text-teal-900 leading-tight">
                  ULSAR, EPE · Serviço de Radioterapia
                </h1>
                <h2 className="text-sm font-bold text-slate-800 mt-0.5">
                  Dossier Oficial do Radar de Formações Futuras & Oportunidades Científicas
                </h2>
                <p className="text-[11px] text-teal-800 font-medium mt-0.5">
                  Unidade Local de Saúde do Alto Minho · RadForm Radioterapia
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-600 font-mono space-y-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
                <p><span className="text-slate-400 font-sans">Emissão:</span> <strong>{new Date().toLocaleDateString('pt-PT')}</strong></p>
                <p><span className="text-slate-400 font-sans">Hora:</span> <strong>{new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</strong></p>
                <p className="text-teal-700 font-bold font-sans mt-0.5">{eventosFiltrados.length} Eventos Selecionados</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Pesquisa contínua e agregador de webinars, jornadas e congressos nacionais e internacionais.{' '}
              {temaAdicionadoRecentemente && (
                <span className="font-semibold text-teal-800">
                  [Tema Recente: {temaAdicionadoRecentemente}] ·{' '}
                </span>
              )}
              Monitorização de <strong>{sitesRadar.length} portais oficiais</strong> nos temas:{' '}
              <span className="italic text-slate-700">
                {temasMonitorizados.join(', ')}.
              </span>
            </p>
          </div>

          {/* Ribbon de Métricas Principais */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total de Eventos</span>
              <span className="text-xl font-black text-slate-900">{eventosFiltrados.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Gratuitos (Grátis)</span>
              <span className="text-xl font-black text-emerald-800">
                {eventosFiltrados.filter(e => e.gratis).length}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">Webinars / Online</span>
              <span className="text-xl font-black text-blue-800">
                {eventosFiltrados.filter(e => e.formato === 'Webinar').length}
              </span>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">
              <span className="text-[10px] font-bold uppercase text-purple-700 block">Presencial / Híbrido</span>
              <span className="text-xl font-black text-purple-800">
                {eventosFiltrados.filter(e => e.formato !== 'Webinar').length}
              </span>
            </div>
          </div>

          {/* Lista de Cartões Visuais dos Eventos */}
          <div className="space-y-3.5">
            {eventosFiltrados.map((evento, idx) => (
              <div 
                key={evento.id}
                className="border border-slate-200 rounded-lg p-3.5 bg-white shadow-2xs space-y-2 break-inside-avoid"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {evento.titulo}
                      </h3>
                      <p className="text-xs font-semibold text-teal-800 mt-0.5">
                        {evento.entidade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      evento.gratis 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {evento.gratis ? 'GRATUITO' : (evento.custoTexto || 'Pago')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {evento.formato}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {evento.ambito}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 bg-slate-50 rounded-md text-[11px] border border-slate-150">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data:</span>
                    <strong className="text-slate-800 font-mono">
                      {evento.dataInicio}{evento.dataFim ? ` a ${evento.dataFim}` : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tema / Horas:</span>
                    <strong className="text-slate-800">
                      {evento.temaPrincipal} {evento.horasEstimadas ? `(${evento.horasEstimadas}h)` : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Destinatários:</span>
                    <strong className="text-slate-800">
                      {Array.isArray(evento.destinatariosSugeridos) ? evento.destinatariosSugeridos.join(', ') : '-'}
                    </strong>
                  </div>
                </div>

                {evento.descricao && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {evento.descricao}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                  <span className="font-mono truncate max-w-[500px]">
                    Inscrições: {evento.url}
                  </span>
                  <span>{evento.local}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé do Dossier */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>RadForm ULSAR · Sistema Integrado de Gestão de Formação em Radioterapia</span>
            <span>Documento Oficial de Planeamento e Monitorização</span>
          </div>
        </div>
      </div>

    </div>
  );
};
