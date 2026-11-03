import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FormacaoFutura, DestinatarioGrupo, SiteFormacaoRadar } from '../types';
import {
  Search,
  Globe,
  Newspaper,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  CalendarPlus,
  BookmarkPlus,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Compass,
  Plus,
  Building,
  Calendar,
  MapPin
} from 'lucide-react';

export type AgentMode = 'atualidade' | 'noticias' | 'factcheck';

export interface GroundingSource {
  title: string;
  uri: string;
  domain: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  mode: AgentMode;
  sources?: GroundingSource[];
  searchQueries?: string[];
  timestamp: string;
}

interface DiscoveredEventItem {
  titulo: string;
  entidade: string;
  dataInicio: string;
  dataFim?: string;
  local: string;
  formato: 'Webinar' | 'Presencial' | 'Híbrido' | 'E-learning';
  ambito: 'Nacional' | 'Internacional';
  temaPrincipal: string;
  descricao: string;
  destinatariosSugeridos: DestinatarioGrupo[];
  horasEstimadas?: number;
  url: string;
  gratis: boolean;
  custoTexto: string;
}

interface RadarSearchAgentProps {
  temasMonitorizados: string[];
  sitesRadar: SiteFormacaoRadar[];
  onAdicionarEventoAoRadar: (evento: FormacaoFutura) => void;
  onPlanearFormacao: (futura: FormacaoFutura) => void;
}

const MODE_CONFIG: Record<
  AgentMode,
  {
    label: string;
    shortLabel: string;
    subtitle: string;
    placeholder: string;
    badgeClass: string;
    activeTabClass: string;
    quickPrompts: string[];
  }
> = {
  atualidade: {
    label: 'Atualidade & Eventos em Tempo Real',
    shortLabel: 'Atualidade & Eventos',
    subtitle:
      'Debata acontecimentos atuais, tendências clínicas/tecnológicas, congressos mundiais ou atualidade geral com dados Google em tempo real.',
    placeholder:
      'Ex: Quais os principais avanços e eventos atuais em Radioterapia Adaptativa e IA este ano?',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    activeTabClass: 'bg-teal-700 text-white border-teal-700 shadow-xs',
    quickPrompts: [
      'Quais são os próximos congressos e cursos da ESTRO, ASTRO e SPRO confirmados?',
      'Que desenvolvimentos recentes existem em Radioterapia FLASH e Radioterapia Adaptativa?',
      'Qual é o panorama atual dos investimentos e equipamentos de Oncologia/Radioterapia no SNS em Portugal?',
      'Resume os principais temas em destaque na saúde e ciência na Europa esta semana.'
    ]
  },
  noticias: {
    label: 'Notícias Recentes & Citações Verificadas',
    shortLabel: 'Citar Notícias Recentes',
    subtitle:
      'Pesquisa notícias recentes, comunicados da DGS/SNS/EMA/IAEA e artigos científicos com citação direta das fontes web.',
    placeholder:
      'Ex: Cita notícias recentes sobre novos tratamentos oncológicos, diretrizes europeias ou atualidade nacional...',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    activeTabClass: 'bg-blue-700 text-white border-blue-700 shadow-xs',
    quickPrompts: [
      'Cita as notícias mais recentes sobre Oncologia e Radioterapia publicadas em Portugal e na Europa.',
      'Que novas orientações ou relatórios publicaram recentemente a IAEA, a EMA ou a DGS sobre proteção radiológica e cancro?',
      'Quais as últimas notícias científicas sobre Inteligência Artificial aplicada ao planeamento dosimétrico?',
      'Cita notícias recentes sobre prevenção de burnout e gestão de equipas nos hospitais do SNS.'
    ]
  },
  factcheck: {
    label: 'Verificação de Factos (Fact-Checking)',
    shortLabel: 'Verificar Factos',
    subtitle:
      'Valide afirmações clínicas, manchetes de notícias, datas de eventos ou estatísticas cruzando fontes fidedignas no Google.',
    placeholder:
      'Cole aqui uma afirmação, notícia ou estatística para verificar a sua veracidade com fontes oficiais...',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    activeTabClass: 'bg-amber-700 text-white border-amber-700 shadow-xs',
    quickPrompts: [
      'Verifica: "A radioterapia hipofracionada no cancro da próstata e da mama já é recomendada como padrão pelas guidelines internacionais atuais?"',
      'Verifica os dados mais recentes da OMS / Agência Internacional de Investigação sobre o Cancro (IARC) sobre a incidência oncológica em Portugal.',
      'Verifica se a Diretiva Europeia EURATOM 2013/59 continua a ser o referencial em vigor para proteção contra radiações médicas em Portugal.',
      'Verifica: "Mais de 50% dos doentes oncológicos têm indicação para radioterapia em algum momento do tratamento?"'
    ]
  }
};

export const RadarSearchAgent: React.FC<RadarSearchAgentProps> = ({
  temasMonitorizados,
  sitesRadar,
  onAdicionarEventoAoRadar,
  onPlanearFormacao
}) => {
  const [mode, setMode] = useState<AgentMode>('atualidade');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Google Event Discovery state
  const [discoveryTheme, setDiscoveryTheme] = useState<string>(
    temasMonitorizados[0] || 'Radioterapia'
  );
  const [discoveryAmbito, setDiscoveryAmbito] = useState<string>('todos');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredEvents, setDiscoveredEvents] = useState<DiscoveredEventItem[]>([]);
  const [discoverySummary, setDiscoverySummary] = useState<string | null>(null);
  const [discoverySources, setDiscoverySources] = useState<GroundingSource[]>([]);
  const [addedEventTitles, setAddedEventTitles] = useState<Record<string, boolean>>({});
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);

  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('radform_radar_google_agent_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [
      {
        id: 'welcome-msg',
        role: 'model',
        mode: 'atualidade',
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        text: `Olá! Sou o **Agente de Pesquisa Google em Tempo Real** do **Radar Futuro** (Serviço de Radioterapia · ULSAR, EPE).

Estou ligado aos resultados atualizados da Pesquisa Google para o apoiar em três frentes:
- **Atualidade & Eventos**: Discutir acontecimentos atuais, inovações tecnológicas/clínicas e congressos nacionais ou internacionais.
- **Notícias Recentes & Citações**: Recolher e citar notícias recentes, diretrizes oficiais e publicações científicas com hiperligações verificadas.
- **Verificação de Factos (Fact-Checking)**: Validar qualquer notícia, estatística ou afirmação técnica cruzando fontes oficiais em tempo real.

Selecione um modo acima, escolha uma sugestão rápida ou escreva qualquer questão sobre atualidade, ciência ou formação.`
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('radform_radar_google_agent_v1', JSON.stringify(messages));
    } catch {
      // ignore quota
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1 || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, isLoading]);

  const sendQuery = async (customPrompt?: string, overrideMode?: AgentMode) => {
    const queryText = (customPrompt !== undefined ? customPrompt : input).trim();
    if (!queryText || isLoading) return;

    const activeMode = overrideMode || mode;
    if (overrideMode && overrideMode !== mode) {
      setMode(overrideMode);
    }

    setErrorMsg(null);
    if (customPrompt === undefined) {
      setInput('');
    }

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: queryText,
      mode: activeMode,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome-msg')
      .map((m) => ({
        role: m.role,
        text: m.text
      }));

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/radar/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
          mode: activeMode,
          monitoredThemes: temasMonitorizados,
          monitoredPortals: sitesRadar.map((s) => ({ nome: s.nome, url: s.url }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao comunicar com o servidor de pesquisa.');
      }

      const modelMsg: AgentMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text,
        mode: activeMode,
        sources: Array.isArray(data.sources) ? data.sources : [],
        searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro ao consultar o Google Search.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery();
  };

  const handleClearConversation = () => {
    const freshWelcome: AgentMessage = {
      id: 'welcome-msg',
      role: 'model',
      mode,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      text: `Nova sessão iniciada no modo **${MODE_CONFIG[mode].shortLabel}**. Coloque a sua questão, notícia ou afirmação para pesquisar em tempo real no Google.`
    };
    setMessages([freshWelcome]);
    setErrorMsg(null);
    sessionStorage.removeItem('radform_radar_google_agent_v1');
  };

  const handleCopyText = async (msg: AgentMessage) => {
    const sourcesAppendix =
      msg.sources && msg.sources.length > 0
        ? '\n\nFontes Verificadas (Google Search):\n' +
          msg.sources.map((s, idx) => `[${idx + 1}] ${s.title} - ${s.uri}`).join('\n')
        : '';

    try {
      await navigator.clipboard.writeText(msg.text + sourcesAppendix);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleDiscoverEvents = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDiscovering) return;

    setIsDiscovering(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/radar/discover-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: discoveryTheme,
          ambito: discoveryAmbito
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao pesquisar eventos futuros no Google.');
      }

      setDiscoveredEvents(Array.isArray(data.events) ? data.events : []);
      setDiscoverySummary(data.summary || null);
      setDiscoverySources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro na descoberta de eventos em tempo real.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const convertToFormacaoFutura = (item: DiscoveredEventItem, index: number): FormacaoFutura => ({
    id: `google-radar-${Date.now()}-${index}`,
    titulo: item.titulo,
    entidade: item.entidade,
    dataInicio: item.dataInicio,
    dataFim: item.dataFim,
    local: item.local,
    formato: item.formato,
    ambito: item.ambito,
    temaPrincipal: item.temaPrincipal,
    descricao: item.descricao,
    destinatariosSugeridos: item.destinatariosSugeridos,
    horasEstimadas: item.horasEstimadas,
    url: item.url,
    destaque: true,
    gratis: item.gratis,
    custoTexto: item.custoTexto
  });

  const currentModeCfg = MODE_CONFIG[mode];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Globe className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">
                Agente Radar Futuro · Pesquisa Google em Tempo Real
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Google Search Ativo
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Discuta eventos atuais, cite notícias e publicações recentes ou verifique factos com fundamentação web em tempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDiscoveryPanel((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showDiscoveryPanel
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>
              {showDiscoveryPanel
                ? 'Ocultar Descoberta de Congressos'
                : 'Descobrir Formações no Google'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleClearConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Iniciar nova conversa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nova Conversa</span>
          </button>
        </div>
      </div>

      {/* Collapsible Live Event Discovery via Google Search */}
      {showDiscoveryPanel && (
        <div className="bg-teal-50/60 border-b border-teal-200 p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Pesquisar Congressos, Webinars e Cursos Reais via Google Search</span>
              </h4>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Encontra eventos reais futuros na web e permite adicioná-los diretamente ao Catálogo do Radar Futuro.
              </p>
            </div>

            <form onSubmit={handleDiscoverEvents} className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-[10px] font-bold text-teal-900 mb-0.5">
                  Tema ou Área Científica
                </label>
                <select
                  value={discoveryTheme}
                  onChange={(e) => setDiscoveryTheme(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-teal-300 rounded-md text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  {temasMonitorizados.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-teal-900 mb-0.5">
                  Âmbito
                </label>
                <select
                  value={discoveryAmbito}
                  onChange={(e) => setDiscoveryAmbito(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-teal-300 rounded-md text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="todos">Nacional & Internacional</option>
                  <option value="Nacional">Nacional (Portugal)</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isDiscovering}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>A pesquisar no Google...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Procurar Eventos Reais</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {discoverySummary && (
            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-teal-200">
              {discoverySummary}
            </p>
          )}

          {discoveredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {discoveredEvents.map((ev, idx) => {
                const alreadyAdded = !!addedEventTitles[ev.titulo];
                return (
                  <div
                    key={`${ev.titulo}-${idx}`}
                    className="bg-white rounded-lg border border-teal-200 p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {ev.formato} · {ev.ambito}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {ev.custoTexto}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 leading-snug">
                        {ev.titulo}
                      </h5>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-slate-400" />
                          {ev.entidade}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-teal-800 font-semibold">
                          <Calendar className="w-3 h-3 text-teal-700" />
                          {ev.dataInicio}
                          {ev.dataFim ? ` a ${ev.dataFim}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {ev.local}
                        </span>
                      </div>
                      {ev.descricao && (
                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                          {ev.descricao}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Fonte Oficial</span>
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => {
                            const formatted = convertToFormacaoFutura(ev, idx);
                            onAdicionarEventoAoRadar(formatted);
                            setAddedEventTitles((prev) => ({ ...prev, [ev.titulo]: true }));
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            alreadyAdded
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {alreadyAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>No Radar</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Adicionar ao Radar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onPlanearFormacao(convertToFormacaoFutura(ev, idx))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          <span>Planear</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {discoverySources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase text-teal-900">
                Fontes Google consultadas:
              </span>
              {discoverySources.slice(0, 6).map((src, i) => (
                <a
                  key={src.uri}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-teal-200 text-[11px] text-teal-800 hover:bg-teal-100 transition-colors"
                >
                  <span className="font-mono font-bold text-[10px]">[{i + 1}]</span>
                  <span className="truncate max-w-[180px]">{src.title}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode Selector Bar: Current Events | Cite Recent News | Fact-Check */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('atualidade')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              mode === 'atualidade'
                ? MODE_CONFIG.atualidade.activeTabClass
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Atualidade & Eventos</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('noticias')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              mode === 'noticias'
                ? MODE_CONFIG.noticias.activeTabClass
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Citar Notícias Recentes</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('factcheck')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              mode === 'factcheck'
                ? MODE_CONFIG.factcheck.activeTabClass
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verificar Factos (Fact-Check)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500">
          {currentModeCfg.subtitle}
        </span>
      </div>

      {/* Quick Prompts & Monitored Theme Shortcuts */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-100 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Sugestões ({currentModeCfg.shortLabel}):
          </span>
          {currentModeCfg.quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => sendQuery(promptText)}
              className="text-left px-2.5 py-1 rounded-md text-[11px] bg-slate-50 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 text-slate-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 truncate max-w-xs sm:max-w-md"
              title={promptText}
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Monitored Themes Instant Search Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 shrink-0">
            Pesquisa Rápida por Tema:
          </span>
          {temasMonitorizados.slice(0, 8).map((tema) => (
            <button
              key={tema}
              type="button"
              disabled={isLoading}
              onClick={() =>
                sendQuery(
                  mode === 'noticias'
                    ? `Cita as notícias e publicações científicas mais recentes sobre "${tema}", indicando datas e fontes.`
                    : mode === 'factcheck'
                    ? `Quais são as recomendações científicas oficiais mais recentes e verificadas sobre "${tema}"?`
                    : `Quais são as novidades atuais, tendências e próximos eventos formativos sobre "${tema}"?`
                )
              }
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50/70 hover:bg-teal-100 text-teal-800 border border-teal-200 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {tema}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="p-5 space-y-4 max-h-[540px] overflow-y-auto bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const msgModeCfg = MODE_CONFIG[msg.mode || 'atualidade'];

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-4xl w-full rounded-xl p-4 border ${
                  isUser
                    ? 'bg-teal-800 text-white border-teal-900 sm:w-auto sm:max-w-2xl shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                }`}
              >
                {/* Message Metadata Header */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold ${
                        isUser ? 'text-teal-100' : 'text-slate-900'
                      }`}
                    >
                      {isUser ? 'Utilizador · Serviço de Radioterapia' : 'Agente Radar Google'}
                    </span>
                    {!isUser && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${msgModeCfg.badgeClass}`}
                      >
                        {msgModeCfg.shortLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${
                        isUser ? 'text-teal-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                    {!isUser && msg.id !== 'welcome-msg' && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copiar resposta e fontes"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Markdown Body */}
                {isUser ? (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="text-xs text-slate-700 leading-relaxed space-y-2 [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-3 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-3 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-teal-900 [&_h3]:mt-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_strong]:font-bold [&_strong]:text-slate-900 [&_blockquote]:border-l-2 [&_blockquote]:border-teal-600 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_a]:text-teal-700 [&_a]:underline">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 font-semibold underline hover:text-teal-900"
                          >
                            {children}
                          </a>
                        )
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Real-time Google Search Queries Executed */}
                {!isUser && msg.searchQueries && msg.searchQueries.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide mr-1">
                      <Search className="w-3 h-3 text-teal-700" />
                      Pesquisas Google:
                    </span>
                    {msg.searchQueries.map((q, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]"
                      >
                        "{q}"
                      </span>
                    ))}
                  </div>
                )}

                {/* Verified Web Sources / Citations (groundingChunks) */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Fontes Web Verificadas ({msg.sources.length} citações diretas)</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {msg.sources.map((src, idx) => (
                        <a
                          key={`${src.uri}-${idx}`}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2 p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-colors"
                          title={src.title}
                        >
                          <span className="w-5 h-5 rounded bg-teal-700 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-slate-800 group-hover:text-teal-900 truncate">
                              {src.title}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1 truncate">
                              <span className="truncate">{src.domain}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-400 group-hover:text-teal-700" />
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contextual Follow-up Actions on Agent Answers */}
                {!isUser && msg.id !== 'welcome-msg' && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        sendQuery(
                          'Aprofunda os pontos principais da resposta anterior citando notícias ou estudos ainda mais recentes e detalhados.',
                          'noticias'
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Newspaper className="w-3 h-3" />
                      <span>Citar mais notícias sobre este tema</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        sendQuery(
                          'Faz uma verificação rigorosa de factos (fact-check) aos dados, datas e números mencionados na resposta anterior cruzando fontes oficiais independentes.',
                          'factcheck'
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 hover:bg-amber-50 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verificar factos desta informação</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3 text-xs text-slate-700">
              <Loader2 className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">
                  A consultar resultados Google Search em tempo real...
                </p>
                <p className="text-[11px] text-slate-500">
                  A cruzar fontes atuais, notícias e referências verificadas ({currentModeCfg.shortLabel})
                </p>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleFormSubmit}
        className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={currentModeCfg.placeholder}
            className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>A Pesquisar...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Pesquisar & Analisar</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
