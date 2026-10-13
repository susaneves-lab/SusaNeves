import React, { useState, useMemo } from 'react';
import { 
  Formacao, 
  Colaborador, 
  MetaAno, 
  HistoricoAno, 
  FormacaoCategoria, 
  DestinatarioGrupo,
  DESTINATARIOS_INFO 
} from '../types';
import { 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle2, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar, 
  ChevronRight, 
  Search, 
  Filter, 
  Check, 
  AlertTriangle, 
  Clock,
  Layers,
  ShieldCheck,
  UserCheck,
  User,
  ChevronLeft,
  Mail,
  FileText,
  Sparkles,
  Paperclip,
  AlertCircle,
  Briefcase
} from 'lucide-react';

interface AdminDashboardProps {
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
  metaAtual: MetaAno;
  historicos: HistoricoAno[];
  onSelectColaboradorFilter?: (sigla: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  formacoes,
  colaboradores,
  anoAtual,
  metaAtual,
  historicos,
  onSelectColaboradorFilter
}) => {
  // Aba ativa na Dashboard: 'geral' (Visão Geral & Indicadores) ou 'individual' (Perfil Individual)
  const [abaDashboard, setAbaDashboard] = useState<'geral' | 'individual'>('geral');

  // Estado para a aba de Perfil Individual
  const [colaboradorSelecionadoId, setColaboradorSelecionadoId] = useState<string>(
    colaboradores.length > 0 ? colaboradores[0].id : ''
  );
  const [filtroGrupoPerfil, setFiltroGrupoPerfil] = useState<string>('todos');
  const [buscaPerfil, setBuscaPerfil] = useState<string>('');

  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [buscaColaborador, setBuscaColaborador] = useState<string>('');
  const [colaboradorDetalhe, setColaboradorDetalhe] = useState<Colaborador | null>(null);
  const [tipoGraficoAtivo, setTipoGraficoAtivo] = useState<'ambos' | 'barras' | 'circulares'>('ambos');
  const [ordenacaoColabs, setOrdenacaoColabs] = useState<'alfabetica' | 'horas'>('alfabetica');

  // Formações do ano selecionado
  const formacoesDoAno = useMemo(() => {
    return formacoes.filter(f => f.ano === anoAtual);
  }, [formacoes, anoAtual]);

  // Total de horas e formações no ano
  const totalHorasAno = useMemo(() => {
    return formacoesDoAno.reduce((acc, curr) => acc + (curr.horas || 0), 0);
  }, [formacoesDoAno]);

  // Taxa de cumprimento da meta global do serviço
  const percentagemMetaServico = useMemo(() => {
    const meta = metaAtual?.metaTotalServico || (colaboradores.length * 35);
    return Math.min(100, Math.round((totalHorasAno / meta) * 100));
  }, [totalHorasAno, metaAtual, colaboradores.length]);

  // Taxa de inclusão no PNF
  const taxaPnf = useMemo(() => {
    if (formacoesDoAno.length === 0) return 0;
    const noPnf = formacoesDoAno.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
    return Math.round((noPnf / formacoesDoAno.length) * 100);
  }, [formacoesDoAno]);

  // Taxa de validação burocrática
  const taxaBurocracia = useMemo(() => {
    if (formacoesDoAno.length === 0) return 0;
    const burocraticaOk = formacoesDoAno.filter(f => f.burocracia).length;
    return Math.round((burocraticaOk / formacoesDoAno.length) * 100);
  }, [formacoesDoAno]);

  // Métricas por Categoria de Formação (Externa, Interna, Enfermagem, ACAF)
  const metricasCategorias = useMemo(() => {
    const cats: FormacaoCategoria[] = ['Externa', 'Interna', 'Enfermagem', 'ACAF'];
    const cores: Record<FormacaoCategoria, { bg: string; text: string; fill: string }> = {
      Externa: { bg: 'bg-blue-100', text: 'text-blue-800', fill: '#0284c7' },
      Interna: { bg: 'bg-teal-100', text: 'text-teal-800', fill: '#0d9488' },
      Enfermagem: { bg: 'bg-emerald-100', text: 'text-emerald-800', fill: '#10b981' },
      ACAF: { bg: 'bg-amber-100', text: 'text-amber-800', fill: '#f59e0b' }
    };

    return cats.map(cat => {
      const lista = formacoesDoAno.filter(f => f.categoria === cat);
      const horas = lista.reduce((sum, f) => sum + f.horas, 0);
      const perc = totalHorasAno > 0 ? Math.round((horas / totalHorasAno) * 100) : 0;
      return { 
        categoria: cat, 
        count: lista.length, 
        horas, 
        perc,
        cores: cores[cat]
      };
    });
  }, [formacoesDoAno, totalHorasAno]);

  // Distribuição Mensal de Horas (Janeiro a Dezembro) para o Gráfico de Barras
  const distribuicaoMensal = useMemo(() => {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const mapa = meses.map((nome, idx) => {
      const mesNum = idx + 1;
      const formacoesMes = formacoesDoAno.filter(f => {
        if (!f.data) return false;
        const d = new Date(f.data);
        if (isNaN(d.getTime())) {
          const match = f.data.match(/-(\d{2})-/);
          return match ? parseInt(match[1], 10) === mesNum : false;
        }
        return d.getMonth() + 1 === mesNum;
      });

      const horas = formacoesMes.reduce((acc, f) => acc + f.horas, 0);
      return {
        mes: nome,
        mesIndex: mesNum,
        horas,
        count: formacoesMes.length
      };
    });

    const maxHoras = Math.max(...mapa.map(m => m.horas), 1);
    return { mapa, maxHoras };
  }, [formacoesDoAno]);

  // Métricas por Grupo de Colaboradores (TSDT, ENF, MR, FIS, AT, AO)
  const metricasGrupos = useMemo(() => {
    const grupos: DestinatarioGrupo[] = ['TSDT', 'ENF', 'MR', 'FIS', 'AT', 'AO'];
    return grupos.map(grp => {
      const colabs = colaboradores.filter(c => c.categoriaProfissional === grp);
      const acoesDestinadas = formacoesDoAno.filter(f => f.destinatarios.includes(grp));
      
      const horasAcumuladas = colabs.reduce((acc, c) => {
        const horasC = formacoesDoAno
          .filter(f => f.colaboradores.includes(c.sigla))
          .reduce((sum, f) => sum + f.horas, 0);
        return acc + horasC;
      }, 0);

      const mediaHoras = colabs.length > 0 ? (horasAcumuladas / colabs.length).toFixed(1) : '0';

      return {
        grupo: grp,
        nome: DESTINATARIOS_INFO[grp]?.nomeCompleto || grp,
        totalColabs: colabs.length,
        acoesDestinadas: acoesDestinadas.length,
        horasAcumuladas,
        mediaHoras
      };
    });
  }, [colaboradores, formacoesDoAno]);

  // Evolução individual de cada colaborador
  const evolucaoColaboradores = useMemo(() => {
    return colaboradores
      .filter(c => {
        if (filtroGrupo !== 'todos' && c.categoriaProfissional !== filtroGrupo) return false;
        if (buscaColaborador.trim() !== '') {
          const q = buscaColaborador.toLowerCase();
          return c.nome.toLowerCase().includes(q) || c.sigla.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q);
        }
        return true;
      })
      .map(c => {
        const participacoes = formacoesDoAno.filter(f => f.colaboradores.includes(c.sigla));
        const totalHoras = participacoes.reduce((sum, f) => sum + f.horas, 0);
        const meta = c.metaHorasAnual || metaAtual?.metaHorasPorColaborador || 35;
        const metaQtd = c.metaQtdFormacoesAnual || metaAtual?.metaQtdFormacoesPorColaborador || 3;
        const progressoPerc = Math.round((totalHoras / meta) * 100);
        const progressoQtdPerc = Math.round((participacoes.length / metaQtd) * 100);

        return {
          ...c,
          participacoes,
          totalFormacoes: participacoes.length,
          totalHoras,
          meta,
          metaQtd,
          progressoPerc,
          progressoQtdPerc
        };
      })
      .sort((a, b) => {
        if (ordenacaoColabs === 'alfabetica') {
          return a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' });
        }
        return b.totalHoras - a.totalHoras;
      });
  }, [colaboradores, formacoesDoAno, filtroGrupo, buscaColaborador, metaAtual, ordenacaoColabs]);

  // Colaborador ativo no Perfil Individual
  const colaboradorSelecionado = useMemo(() => {
    return colaboradores.find(c => c.id === colaboradorSelecionadoId) || colaboradores[0] || null;
  }, [colaboradores, colaboradorSelecionadoId]);

  // Lista de colaboradores filtrada para o seletor do Perfil Individual
  const colaboradoresFiltradosPerfil = useMemo(() => {
    return colaboradores.filter(c => {
      if (filtroGrupoPerfil !== 'todos' && c.categoriaProfissional !== filtroGrupoPerfil) {
        return false;
      }
      if (buscaPerfil.trim() !== '') {
        const q = buscaPerfil.toLowerCase();
        return c.nome.toLowerCase().includes(q) || c.sigla.toLowerCase().includes(q);
      }
      return true;
    });
  }, [colaboradores, filtroGrupoPerfil, buscaPerfil]);

  // Formações do colaborador selecionado no ano corrente
  const formacoesDoColaborador = useMemo(() => {
    if (!colaboradorSelecionado) return [];
    return formacoesDoAno.filter(f => f.colaboradores.includes(colaboradorSelecionado.sigla));
  }, [formacoesDoAno, colaboradorSelecionado]);

  // Métricas do perfil individual e percentagens de cumprimento
  const metricasPerfilIndividual = useMemo(() => {
    if (!colaboradorSelecionado) {
      return {
        totalHoras: 0,
        metaHoras: 35,
        percentagemHoras: 0,
        saldoHoras: 0,
        totalAcoes: 0,
        metaAcoes: 3,
        percentagemAcoes: 0,
        saldoAcoes: 0,
        taxaBurocracia: 0,
        acoesBurocraciaOk: 0,
        taxaPnf: 0,
        acoesPnfOk: 0,
        horasPorCategoria: { Externa: 0, Interna: 0, Enfermagem: 0, ACAF: 0 }
      };
    }

    const totalHoras = formacoesDoColaborador.reduce((sum, f) => sum + (f.horas || 0), 0);
    const metaHoras = colaboradorSelecionado.metaHorasAnual || metaAtual?.metaHorasPorColaborador || 35;
    const percentagemHoras = Math.round((totalHoras / metaHoras) * 100);
    const saldoHoras = Math.round((totalHoras - metaHoras) * 10) / 10;

    const totalAcoes = formacoesDoColaborador.length;
    const metaAcoes = colaboradorSelecionado.metaQtdFormacoesAnual || metaAtual?.metaQtdFormacoesPorColaborador || 3;
    const percentagemAcoes = Math.round((totalAcoes / metaAcoes) * 100);
    const saldoAcoes = totalAcoes - metaAcoes;

    const acoesBurocraciaOk = formacoesDoColaborador.filter(f => f.burocracia).length;
    const taxaBurocracia = totalAcoes > 0 ? Math.round((acoesBurocraciaOk / totalAcoes) * 100) : 0;

    const acoesPnfOk = formacoesDoColaborador.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
    const taxaPnf = totalAcoes > 0 ? Math.round((acoesPnfOk / totalAcoes) * 100) : 0;

    const horasPorCategoria = {
      Externa: formacoesDoColaborador.filter(f => f.categoria === 'Externa').reduce((s, f) => s + f.horas, 0),
      Interna: formacoesDoColaborador.filter(f => f.categoria === 'Interna').reduce((s, f) => s + f.horas, 0),
      Enfermagem: formacoesDoColaborador.filter(f => f.categoria === 'Enfermagem').reduce((s, f) => s + f.horas, 0),
      ACAF: formacoesDoColaborador.filter(f => f.categoria === 'ACAF').reduce((s, f) => s + f.horas, 0),
    };

    return {
      totalHoras,
      metaHoras,
      percentagemHoras,
      saldoHoras,
      totalAcoes,
      metaAcoes,
      percentagemAcoes,
      saldoAcoes,
      taxaBurocracia,
      acoesBurocraciaOk,
      taxaPnf,
      acoesPnfOk,
      horasPorCategoria
    };
  }, [colaboradorSelecionado, formacoesDoColaborador, metaAtual]);

  // Dados comparativos anuais (Histórico vs Ano Atual)
  const dadosComparativos = useMemo(() => {
    const list: Array<{ ano: number; horasRealizadas: number; meta: number; percentagem: number }> = [];

    historicos.forEach(h => {
      list.push({
        ano: h.ano,
        horasRealizadas: h.totalHoras,
        meta: h.meta.metaTotalServico,
        percentagem: h.percentagemMetaAtingida
      });
    });

    list.push({
      ano: anoAtual,
      horasRealizadas: totalHorasAno,
      meta: metaAtual?.metaTotalServico || (colaboradores.length * 35),
      percentagem: percentagemMetaServico
    });

    return list.sort((a, b) => a.ano - b.ano);
  }, [historicos, anoAtual, totalHorasAno, metaAtual, percentagemMetaServico, colaboradores.length]);

  // Helper para gerar caminhos SVG de gráfico circular (Pie / Donut Chart)
  const gerarCaminhosDonut = (dados: Array<{ perc: number; fill: string; label: string }>) => {
    let acumulado = 0;
    const raio = 70;
    const raioInterno = 40;
    const centroX = 100;
    const centroY = 100;

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
          className="transition-all hover:opacity-85"
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      
      {/* SELETOR DE ABA DA DASHBOARD: VISÃO GERAL VS PERFIL INDIVIDUAL */}
      <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAbaDashboard('geral')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
              abaDashboard === 'geral'
                ? 'bg-teal-700 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Visão Geral & Indicadores Globais</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaDashboard('individual')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
              abaDashboard === 'individual'
                ? 'bg-teal-700 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Perfil Individual do Colaborador</span>
            {colaboradorSelecionado && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                abaDashboard === 'individual' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {colaboradorSelecionado.sigla}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pr-2">
          <span className="font-medium">Ano de Referência:</span>
          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded font-mono">
            {anoAtual}
          </span>
        </div>
      </div>

      {/* SEPARADOR 1: VISÃO GERAL & INDICADORES GLOBAIS */}
      {abaDashboard === 'geral' && (
        <div className="space-y-6">
      
      {/* 1. Visão Geral dos Indicadores Principais de Produtividade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Horas Totais */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volume de Formação</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {totalHorasAno}
            </span>
            <span className="text-xs text-slate-500 font-medium">horas realizadas ({anoAtual})</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Meta: {metaAtual?.metaTotalServico || 875} h</span>
            <span className="font-semibold text-teal-700">{percentagemMetaServico}% atingida</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div 
              className="bg-teal-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, percentagemMetaServico)}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: Total de Formações & Meta de Quantidade */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Meta de Formações (Qtd)</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {formacoesDoAno.length}
            </span>
            <span className="text-xs text-slate-500">ações realizadas</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Meta: {metaAtual?.metaQtdFormacoesServico || 35} ações</span>
            <span className="font-semibold text-teal-700">
              {Math.min(100, Math.round((formacoesDoAno.length / (metaAtual?.metaQtdFormacoesServico || 35)) * 100))}% atingida
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div 
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.round((formacoesDoAno.length / (metaAtual?.metaQtdFormacoesServico || 35)) * 100))}%` }} 
            />
          </div>
        </div>

        {/* KPI 3: Inclusão no PNF */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Plano Anual (PNF)</span>
            <Target className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {taxaPnf}%
            </span>
            <span className="text-xs text-slate-500">taxa de alinhamento</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Formações enquadradas no Plano de Necessidades aprovado
          </p>
        </div>

        {/* KPI 4: Conformidade Burocrática */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Burocracia Validada</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {taxaBurocracia}%
            </span>
            <span className="text-xs text-slate-500">conformidade documental</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Conforme a matriz documental da 2ª imagem
          </p>
        </div>
      </div>

      {/* SELETOR DE VISUALIZAÇÃO DE GRÁFICOS */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <BarChart3 className="w-4 h-4 text-teal-700" />
          <span>Painel Visual de Resultados Gráficos</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
          <button
            onClick={() => setTipoGraficoAtivo('ambos')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
              tipoGraficoAtivo === 'ambos' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos os Gráficos
          </button>
          <button
            onClick={() => setTipoGraficoAtivo('barras')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
              tipoGraficoAtivo === 'barras' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gráficos de Barras
          </button>
          <button
            onClick={() => setTipoGraficoAtivo('circulares')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
              tipoGraficoAtivo === 'circulares' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gráficos Circulares
          </button>
        </div>
      </div>

      {/* 2. GRÁFICOS DE BARRAS (VERTICAL & COMPARATIVO) */}
      {(tipoGraficoAtivo === 'ambos' || tipoGraficoAtivo === 'barras') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Gráfico de Barras 1: Evolução Mensal de Horas de Formação */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-teal-700" />
                  <span>Gráfico de Barras: Horas Formativas por Mês ({anoAtual})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Distribuição temporal ao longo dos 12 meses do ano
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Total: {totalHorasAno} h
              </span>
            </div>

            {/* Visualizador de Barras Verticais em SVG / HTML puro */}
            <div className="h-56 flex items-end justify-between gap-1.5 pt-6 pb-2 px-2 bg-slate-50/70 rounded-lg border border-slate-100">
              {distribuicaoMensal.mapa.map((m) => {
                const alturaPerc = distribuicaoMensal.maxHoras > 0 
                  ? Math.round((m.horas / distribuicaoMensal.maxHoras) * 100) 
                  : 0;

                return (
                  <div key={m.mes} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-600 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.horas}h
                    </span>
                    <div className="w-full max-w-[28px] bg-slate-200 rounded-t-md h-full flex items-end overflow-hidden">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          m.horas > 0 ? 'bg-teal-600 group-hover:bg-teal-700' : 'bg-transparent'
                        }`}
                        style={{ height: `${Math.max(alturaPerc, m.horas > 0 ? 8 : 0)}%` }}
                        title={`${m.mes}: ${m.horas} horas (${m.count} ações)`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 mt-2 font-mono">
                      {m.mes}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico de Barras 2: Comparativo Histórico de Cumprimento de Metas */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <span>Gráfico de Barras Comparativo: Metas vs Realizado</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Comparação anual com ciclos arquivados no serviço
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {dadosComparativos.map((item) => {
                const isCurrent = item.ano === anoAtual;
                return (
                  <div key={item.ano} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono ${isCurrent ? 'text-teal-800 text-sm' : 'text-slate-700'}`}>
                          Ciclo {item.ano}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                            Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-900 font-bold">{item.horasRealizadas} h</span>
                        <span className="text-slate-400">/ {item.meta} h</span>
                        <span className={`font-bold tabular-nums ${item.percentagem >= 100 ? 'text-emerald-600' : 'text-teal-700'}`}>
                          ({item.percentagem}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-md h-4 flex overflow-hidden border border-slate-200">
                      <div 
                        className={`h-full transition-all duration-700 flex items-center justify-end pr-1 text-[9px] font-bold text-white ${
                          isCurrent ? 'bg-teal-600' : 'bg-slate-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentagem)}%` }}
                      >
                        {item.percentagem > 15 && `${item.percentagem}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 3. GRÁFICOS CIRCULARES / DONUT COM RESULTADOS OBTIDOS */}
      {(tipoGraficoAtivo === 'ambos' || tipoGraficoAtivo === 'circulares') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Gráfico Circular 1: Distribuição por Categoria de Formação */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-teal-700" />
              <span>Gráfico Circular: Categorias</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Proporção de horas por tipo de formação
            </p>

            <div className="flex flex-col items-center justify-center py-2">
              <svg width="180" height="180" viewBox="0 0 200 200" className="drop-shadow-xs">
                {gerarCaminhosDonut(metricasCategorias.map(m => ({ perc: m.perc, fill: m.cores.fill, label: m.categoria })))}
                <circle cx="100" cy="100" r="38" fill="#ffffff" />
                <text x="100" y="96" textAnchor="middle" className="text-[14px] font-bold fill-slate-900 font-mono">
                  {totalHorasAno}h
                </text>
                <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                  Total Horas
                </text>
              </svg>

              {/* Legenda do Gráfico Circular */}
              <div className="w-full grid grid-cols-2 gap-2 mt-3 text-xs">
                {metricasCategorias.map(c => (
                  <div key={c.categoria} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: c.cores.fill }} />
                    <span className="text-slate-700 text-[11px] truncate">
                      <strong>{c.categoria}</strong>: {c.perc}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico Circular 2: Validação Burocrática */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Gráfico Circular: Burocracia</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Conformidade com a documentação da matriz
            </p>

            <div className="flex flex-col items-center justify-center py-2">
              <svg width="180" height="180" viewBox="0 0 200 200" className="drop-shadow-xs">
                {gerarCaminhosDonut([
                  { perc: taxaBurocracia, fill: '#0d9488', label: 'Validada' },
                  { perc: 100 - taxaBurocracia, fill: '#f1f5f9', label: 'Pendente' }
                ])}
                <circle cx="100" cy="100" r="38" fill="#ffffff" />
                <text x="100" y="96" textAnchor="middle" className="text-[16px] font-bold fill-slate-900 font-mono">
                  {taxaBurocracia}%
                </text>
                <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                  Conformidade
                </text>
              </svg>

              <div className="w-full flex items-center justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-teal-600 shrink-0" />
                  <span className="text-slate-700 text-[11px]">Validada ({taxaBurocracia}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-200 shrink-0" />
                  <span className="text-slate-700 text-[11px]">Pendente ({100 - taxaBurocracia}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico Circular 3: Enquadramento no Plano Anual (PNF) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-700" />
              <span>Gráfico Circular: Plano Anual</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Taxa de inclusão no Plano de Necessidades (PNF)
            </p>

            <div className="flex flex-col items-center justify-center py-2">
              <svg width="180" height="180" viewBox="0 0 200 200" className="drop-shadow-xs">
                {gerarCaminhosDonut([
                  { perc: taxaPnf, fill: '#10b981', label: 'No Plano (Sim)' },
                  { perc: 100 - taxaPnf, fill: '#f1f5f9', label: 'Fora do Plano (Não)' }
                ])}
                <circle cx="100" cy="100" r="38" fill="#ffffff" />
                <text x="100" y="96" textAnchor="middle" className="text-[16px] font-bold fill-slate-900 font-mono">
                  {taxaPnf}%
                </text>
                <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                  No Plano (Sim)
                </text>
              </svg>

              <div className="w-full flex items-center justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 shrink-0" />
                  <span className="text-slate-700 text-[11px]">No PNF ({taxaPnf}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-200 shrink-0" />
                  <span className="text-slate-700 text-[11px]">Fora PNF ({100 - taxaPnf}%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. Distribuição de Horas por Grupo Profissional (Destinatários) */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
          Volume de Horas Acumulado por Corpo Profissional
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Monitorização de horas ofertadas e acumuladas por categoria profissional no Serviço de Radioterapia
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">Grupo Profissional</th>
                <th className="py-2.5 px-2 text-center font-semibold">Elementos</th>
                <th className="py-2.5 px-2 text-center font-semibold">Ações Destinadas</th>
                <th className="py-2.5 px-3 text-right font-semibold">Horas Acumuladas</th>
                <th className="py-2.5 px-3 text-right font-semibold">Média / Colab.</th>
                <th className="py-2.5 px-3 min-w-[120px] font-semibold">Progresso Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metricasGrupos.map((g) => {
                const maxHorasGrupo = Math.max(...metricasGrupos.map(item => item.horasAcumuladas), 1);
                const perc = Math.round((g.horasAcumuladas / maxHorasGrupo) * 100);

                return (
                  <tr key={g.grupo} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <strong className="font-mono text-teal-800 font-bold mr-1.5">{g.grupo}</strong>
                      <span className="text-slate-700">{g.nome}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                      {g.totalColabs}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                      {g.acoesDestinadas}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                      {g.horasAcumuladas} h
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {g.mediaHoras} h
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-teal-600 h-2 rounded-full" 
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Evolução Anual Individual de Cada Profissional */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Evolução Anual Individual de Cada Profissional</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitorização do cumprimento da meta individual ({metaAtual?.metaHorasPorColaborador || 35}h) por colaborador
            </p>
          </div>

          {/* Filtros da tabela de colaboradores */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar profissional por nome ou sigla..."
                value={buscaColaborador}
                onChange={(e) => setBuscaColaborador(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="text-xs py-1 px-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="todos">Todos os Grupos</option>
              <option value="TSDT">TSDT</option>
              <option value="ENF">Enfermagem</option>
              <option value="MR">Médicos Rad.</option>
              <option value="FIS">Física Médica</option>
              <option value="AT">Assistentes Técnicos</option>
              <option value="AO">Assistentes Operacionais</option>
            </select>

            {/* Ordenação Alfabética / Horas */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setOrdenacaoColabs('alfabetica')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  ordenacaoColabs === 'alfabetica'
                    ? 'bg-white text-teal-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ordenar colaboradores por ordem alfabética de nome (A-Z)"
              >
                Ordem Alfabética (A-Z)
              </button>
              <button
                type="button"
                onClick={() => setOrdenacaoColabs('horas')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  ordenacaoColabs === 'horas'
                    ? 'bg-white text-teal-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ordenar por volume de horas concluídas"
              >
                Por Horas
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Profissionais */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Sigla</th>
                <th className="py-2.5 px-3 font-semibold">Nome Colaborador</th>
                <th className="py-2.5 px-2 text-center font-semibold">Grupo</th>
                <th className="py-2.5 px-2 text-center font-semibold">Ações / Meta Qtd</th>
                <th className="py-2.5 px-3 text-right font-semibold">Horas Acumuladas</th>
                <th className="py-2.5 px-3 min-w-[140px] font-semibold">Cumprimento Horas ({metaAtual?.metaHorasPorColaborador || 35}h)</th>
                <th className="py-2.5 px-2 text-center font-semibold">Estado</th>
                <th className="py-2.5 px-2 text-center font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evolucaoColaboradores.map((c) => {
                const atingiuHoras = c.totalHoras >= c.meta;
                const atingiuQtd = c.totalFormacoes >= c.metaQtd;
                const atingiuAmbos = atingiuHoras && atingiuQtd;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                      {c.sigla}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          setColaboradorSelecionadoId(c.id);
                          setAbaDashboard('individual');
                        }}
                        className="text-left font-medium text-slate-900 hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer group/colab"
                        title={`Abrir perfil individual detalhado de ${c.nome}`}
                      >
                        <span>{c.nome}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover/colab:text-teal-700 transition-transform group-hover/colab:translate-x-0.5" />
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-semibold">
                      {c.categoriaProfissional}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">
                      <span className={`font-bold ${atingiuQtd ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {c.totalFormacoes}
                      </span>
                      <span className="text-slate-400">/{c.metaQtd}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {c.totalHoras} h
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              atingiuHoras ? 'bg-emerald-600' : 'bg-teal-600'
                            }`}
                            style={{ width: `${Math.min(100, c.progressoPerc)}%` }}
                          />
                        </div>
                        <span className={`font-mono text-[11px] font-semibold w-10 text-right ${
                          atingiuHoras ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {c.progressoPerc}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        atingiuAmbos ? 'bg-emerald-100 text-emerald-800' : atingiuHoras ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {atingiuAmbos ? 'Ambas Metas' : atingiuHoras ? 'Horas OK' : 'Em Curso'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setColaboradorSelecionadoId(c.id);
                          setAbaDashboard('individual');
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        title={`Ver perfil individual detalhado de ${c.nome}`}
                      >
                        <span>Ver Perfil</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )}

  {/* ============================================================== */}
  {/* SEPARADOR 2: ABA DE PERFIL INDIVIDUAL DO COLABORADOR           */}
  {/* ============================================================== */}
  {abaDashboard === 'individual' && (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* BARRA SUPERIOR DE SELEÇÃO E NAVEGAÇÃO DE COLABORADORES */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>Selecionar Colaborador do Serviço</span>
            </h3>
            <p className="text-xs text-slate-500">
              Filtre as formações por colaborador específico e acompanhe o cumprimento das metas anuais em {anoAtual}
            </p>
          </div>

          {/* Controles de Navegação Anterior / Seguinte */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const idxAtual = colaboradores.findIndex(c => c.id === colaboradorSelecionadoId);
                const prevIdx = idxAtual <= 0 ? colaboradores.length - 1 : idxAtual - 1;
                setColaboradorSelecionadoId(colaboradores[prevIdx].id);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Colaborador anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <span className="text-xs font-mono font-medium text-slate-600 px-2">
              {colaboradores.findIndex(c => c.id === colaboradorSelecionadoId) + 1} de {colaboradores.length}
            </span>

            <button
              type="button"
              onClick={() => {
                const idxAtual = colaboradores.findIndex(c => c.id === colaboradorSelecionadoId);
                const nextIdx = idxAtual >= colaboradores.length - 1 ? 0 : idxAtual + 1;
                setColaboradorSelecionadoId(colaboradores[nextIdx].id);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Próximo colaborador"
            >
              <span>Seguinte</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filtros e Dropdown de Seleção */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          
          {/* Filtro por Categoria Profissional */}
          <div className="md:col-span-3">
            <select
              value={filtroGrupoPerfil}
              onChange={(e) => setFiltroGrupoPerfil(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-700"
            >
              <option value="todos">Todos os Grupos Profissionais</option>
              <option value="TSDT">TSDT</option>
              <option value="ENF">Enfermagem</option>
              <option value="MR">Médicos Radioterapeutas</option>
              <option value="FIS">Física Médica</option>
              <option value="AT">Assistentes Técnicos</option>
              <option value="AO">Assistentes Operacionais</option>
            </select>
          </div>

          {/* Campo de Pesquisa Rápida */}
          <div className="md:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por nome ou sigla..."
              value={buscaPerfil}
              onChange={(e) => setBuscaPerfil(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Seletor Principal de Colaborador */}
          <div className="md:col-span-5">
            <select
              value={colaboradorSelecionadoId}
              onChange={(e) => setColaboradorSelecionadoId(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-teal-50/70 border border-teal-300 rounded-md font-semibold text-teal-950 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              {colaboradoresFiltradosPerfil.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.sigla}] {c.nome} ({c.categoriaProfissional} - {c.cargo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {colaboradorSelecionado && (
        <>
          {/* CARTÃO DE IDENTIFICAÇÃO DO COLABORADOR */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3.5">
                {/* Avatar com Sigla e cor da categoria */}
                <div className="w-14 h-14 rounded-full bg-teal-800 text-white flex items-center justify-center font-mono font-bold text-lg shadow-sm shrink-0 border-2 border-teal-100">
                  {colaboradorSelecionado.sigla}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">
                      {colaboradorSelecionado.nome}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-teal-100 text-teal-900 border border-teal-200">
                      Sigla: {colaboradorSelecionado.sigla}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {colaboradorSelecionado.categoriaProfissional}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      colaboradorSelecionado.estadoProfissional === 'Activo'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {colaboradorSelecionado.estadoProfissional}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-slate-800">
                      {colaboradorSelecionado.cargo}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Nº Mecanográfico: <strong className="font-mono text-slate-900">{colaboradorSelecionado.numMecanografico || '-'}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Email: <a href={`mailto:${colaboradorSelecionado.email}`} className="text-teal-700 hover:underline">{colaboradorSelecionado.email}</a>
                    </span>
                  </p>
                </div>
              </div>

              {/* Detalhe de Admissão & Ano */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <span className="text-[11px]">Ano Analisado: <strong className="text-slate-900 font-mono">{anoAtual}</strong></span>
                {colaboradorSelecionado.dataAdmissao && (
                  <span className="text-[11px] text-slate-400">Admissão: {colaboradorSelecionado.dataAdmissao}</span>
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DE CUMPRIMENTO DAS METAS ANUAIS INDIVIDUAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CARD 1: CUMPRIMENTO DA META ANUAL DE HORAS */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Meta Anual de Horas</span>
                <Clock className="w-4 h-4 text-teal-600" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {metricasPerfilIndividual.totalHoras}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    / {metricasPerfilIndividual.metaHoras} h
                  </span>
                </div>

                <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                  metricasPerfilIndividual.percentagemHoras >= 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : metricasPerfilIndividual.percentagemHoras >= 70
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {metricasPerfilIndividual.percentagemHoras}%
                </span>
              </div>

              {/* Barra de Progresso de Horas */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metricasPerfilIndividual.percentagemHoras >= 100
                      ? 'bg-emerald-600'
                      : metricasPerfilIndividual.percentagemHoras >= 70
                      ? 'bg-teal-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, metricasPerfilIndividual.percentagemHoras)}%` }}
                />
              </div>

              {/* Diagnóstico de Horas */}
              <p className="text-[11px] font-medium text-slate-600 pt-0.5">
                {metricasPerfilIndividual.percentagemHoras >= 100 ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Meta de horas atingida! (+{metricasPerfilIndividual.saldoHoras}h)
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Faltam {Math.abs(metricasPerfilIndividual.saldoHoras)}h para a meta anual
                  </span>
                )}
              </p>
            </div>

            {/* CARD 2: CUMPRIMENTO DA META ANUAL DE QUANTIDADE DE FORMAÇÕES */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Meta de Formações (Qtd)</span>
                <Award className="w-4 h-4 text-teal-600" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {metricasPerfilIndividual.totalAcoes}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    / {metricasPerfilIndividual.metaAcoes} ações
                  </span>
                </div>

                <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                  metricasPerfilIndividual.percentagemAcoes >= 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : metricasPerfilIndividual.percentagemAcoes >= 70
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {metricasPerfilIndividual.percentagemAcoes}%
                </span>
              </div>

              {/* Barra de Progresso de Ações */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metricasPerfilIndividual.percentagemAcoes >= 100
                      ? 'bg-emerald-600'
                      : metricasPerfilIndividual.percentagemAcoes >= 70
                      ? 'bg-teal-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, metricasPerfilIndividual.percentagemAcoes)}%` }}
                />
              </div>

              {/* Diagnóstico de Ações */}
              <p className="text-[11px] font-medium text-slate-600 pt-0.5">
                {metricasPerfilIndividual.percentagemAcoes >= 100 ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Meta de ações cumprida! (+{metricasPerfilIndividual.saldoAcoes} ações)
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Falta(m) {Math.abs(metricasPerfilIndividual.saldoAcoes)} ação(ões) para a meta
                  </span>
                )}
              </p>
            </div>

            {/* CARD 3: CONFORMIDADE BUROCRÁTICA INDIVIDUAL */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Conformidade Burocrática</span>
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
                    {metricasPerfilIndividual.taxaBurocracia}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    regularizada
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-600">
                  {metricasPerfilIndividual.acoesBurocraciaOk}/{metricasPerfilIndividual.totalAcoes}
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metricasPerfilIndividual.taxaBurocracia}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 pt-0.5">
                {metricasPerfilIndividual.totalAcoes - metricasPerfilIndividual.acoesBurocraciaOk > 0 ? (
                  <span className="text-amber-700">
                    {metricasPerfilIndividual.totalAcoes - metricasPerfilIndividual.acoesBurocraciaOk} ação(ões) com burocracia pendente
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Toda a documentação em conformidade</span>
                )}
              </p>
            </div>

            {/* CARD 4: ENQUADRAMENTO NO PLANO (PNF) */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Inclusão no PNF</span>
                <Target className="w-4 h-4 text-teal-600" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                    {metricasPerfilIndividual.taxaPnf}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    no plano
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-600">
                  {metricasPerfilIndividual.acoesPnfOk}/{metricasPerfilIndividual.totalAcoes}
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metricasPerfilIndividual.taxaPnf}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 pt-0.5">
                Alinhamento com o Plano de Necessidades Formativas
              </p>
            </div>

          </div>

          {/* RESUMO DE HORAS POR TIPO DE FORMAÇÃO */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Distribuição de Horas por Categoria de Formação ({colaboradorSelecionado.sigla})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200">
                <span className="text-[11px] text-blue-700 font-semibold block">Formação Externa</span>
                <span className="text-lg font-bold font-mono text-blue-900 block mt-0.5">
                  {metricasPerfilIndividual.horasPorCategoria.Externa} h
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-teal-50 border border-teal-200">
                <span className="text-[11px] text-teal-700 font-semibold block">Formação Interna</span>
                <span className="text-lg font-bold font-mono text-teal-900 block mt-0.5">
                  {metricasPerfilIndividual.horasPorCategoria.Interna} h
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-semibold block">Enfermagem</span>
                <span className="text-lg font-bold font-mono text-emerald-900 block mt-0.5">
                  {metricasPerfilIndividual.horasPorCategoria.Enfermagem} h
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-700 font-semibold block">ACAF</span>
                <span className="text-lg font-bold font-mono text-amber-900 block mt-0.5">
                  {metricasPerfilIndividual.horasPorCategoria.ACAF} h
                </span>
              </div>
            </div>
          </div>

          {/* TABELA DE FORMAÇÕES DO COLABORADOR */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>Formações Frequentadas por {colaboradorSelecionado.nome} ({anoAtual})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total de {formacoesDoColaborador.length} ação(ões) registada(s) para este profissional
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
                Total: {metricasPerfilIndividual.totalHoras} Horas
              </span>
            </div>

            {formacoesDoColaborador.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/70 rounded-lg border border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma formação registada para {colaboradorSelecionado.nome} em {anoAtual}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Para atribuir participações a este colaborador, adicione ou edite uma ação na Tabela Geral e inclua a sigla <strong className="font-mono text-slate-600">{colaboradorSelecionado.sigla}</strong>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[140px]">Código Formação</th>
                      <th className="py-2.5 px-3 min-w-[240px]">Nome da Formação</th>
                      <th className="py-2.5 px-2 text-center">Tipo</th>
                      <th className="py-2.5 px-2.5 text-center min-w-[110px]">Data Realização</th>
                      <th className="py-2.5 px-2 text-center font-mono w-20">Horas</th>
                      <th className="py-2.5 px-2 text-center w-20">Realizada</th>
                      <th className="py-2.5 px-2 text-center w-20">Burocracia</th>
                      <th className="py-2.5 px-2 text-center w-20">No PNF</th>
                      <th className="py-2.5 px-2.5 text-center min-w-[100px]">Certificado</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {formacoesDoColaborador.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-900 whitespace-nowrap">
                          {f.codigo || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {f.nome}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                            {f.categoria}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {f.data}{f.dataFim && ` a ${f.dataFim}`}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                          {f.horasTexto || `${f.horas} h`}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.realizada ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {f.realizada ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.burocracia ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {f.burocracia ? 'Validada' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.incluidaPlanoNecessidades === 'Sim' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {f.incluidaPlanoNecessidades}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center">
                          {f.certificado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 font-mono">
                              <Paperclip className="w-3 h-3 text-teal-600" />
                              <span className="truncate max-w-[80px]">{f.certificado.nomeFicheiro}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[220px] truncate" title={f.observacoes || ''}>
                          {f.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )}

    </div>
  );
};
