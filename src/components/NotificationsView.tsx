import React, { useState } from 'react';
import { 
  Formacao, 
  Colaborador, 
  CertificacaoObrigatoria, 
  ConfiguracoesApp 
} from '../types';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Mail, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  Calendar, 
  FileCheck2, 
  ExternalLink,
  Send,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { getFormacoesBurocraciaPendente, gerarLinksOutlookBurocracia } from '../utils/bureaucracyAlerts';

interface NotificationsViewProps {
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  certificacoes: CertificacaoObrigatoria[];
  anoAtual: number;
  configuracoes: ConfiguracoesApp;
  onAbrirEmailOutlook: (formacao: Formacao) => void;
  onToggleBurocracia: (formacaoId: string) => void;
  onOpenSettings: () => void;
  onEditFormacao: (formacao: Formacao) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  formacoes,
  colaboradores,
  certificacoes,
  anoAtual,
  configuracoes,
  onAbrirEmailOutlook,
  onToggleBurocracia,
  onOpenSettings,
  onEditFormacao
}) => {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'burocracia' | 'seisMeses' | 'certificacoes' | 'colaboradores'>('todos');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const diasAlertaBurocracia = configuracoes.diasAlertaBurocracia || 30;

  // 1. Formações com burocracia pendente há mais de X dias
  const pendentesBurocracia = getFormacoesBurocraciaPendente(formacoes, diasAlertaBurocracia);

  // 2. Formações onde já passaram 6 meses e email Outlook ainda não foi enviado
  const pendentesSeisMeses = formacoes.filter(f => {
    const isEmailEnviado = !!(f.documentosBurocracia?.emailAvaliacao6Meses || f.documentosBurocracia?.emailEnviadoData);
    if (isEmailEnviado) return false;
    if (!f.data) return false;
    const match = f.data.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return false;
    const dataForm = new Date(match[0]).getTime();
    const seisMesesEmMs = 180 * 24 * 60 * 60 * 1000;
    return (Date.now() - dataForm) >= seisMesesEmMs;
  });

  // 3. Certificações a expirar ou expiradas
  const certificacoesUrgentes = certificacoes.filter(c => c.estado === 'expirado' || c.estado === 'a_expirar');

  // 4. Colaboradores Inativos ou em Baixa
  const colaboradoresAtencao = colaboradores.filter(c => 
    c.estadoProfissional === 'Inativo' || c.estadoProfissional === 'Ausente: Baixa'
  );

  const totalAlertas = pendentesBurocracia.length + pendentesSeisMeses.length + certificacoesUrgentes.length;

  const handleDispararEmailBurocraciaGeral = () => {
    if (pendentesBurocracia.length === 0) {
      alert('Não existem atualmente formações com burocracia pendente há mais de ' + diasAlertaBurocracia + ' dias.');
      return;
    }
    const emailDest = configuracoes.emailNotificacoesBurocracia || 'chefia.radioterapia@ulsar.min-saude.pt';
    const { webUrl, mailtoUrl } = gerarLinksOutlookBurocracia(pendentesBurocracia, emailDest);

    const opened = window.open(webUrl, '_blank');
    if (!opened) {
      window.location.href = mailtoUrl;
    }
    setMensagemSucesso('Notificação de burocracia pendente preparada no Outlook.');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header da Aba Notificações */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Centro de Notificações & Alertas Hospitalares
              </h1>
              {totalAlertas > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {totalAlertas} {totalAlertas === 1 ? 'alerta pendente' : 'alertas pendentes'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Conformidade total
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitorização contínua de burocracias com mais de 30 dias, avaliações aos 6 meses, certificações obrigatórias e equipa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDispararEmailBurocraciaGeral}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0078D4] hover:bg-[#0060aa] rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Enviar resumo geral de burocracias pendentes via Outlook"
          >
            <Mail className="w-4 h-4" />
            <span>Notificar Burocracia via Outlook</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ajustar prazos e preferências de notificação no Menu de Configurações"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Cards de Métricas de Alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Burocracia Pendente (+30 Dias) */}
        <div 
          onClick={() => setFiltroTipo('burocracia')}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-2xs ${
            filtroTipo === 'burocracia' ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Burocracia Pendente (+{diasAlertaBurocracia}d)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-900">{pendentesBurocracia.length}</span>
            <span className="text-xs text-slate-500">ações em atraso</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium block mt-1">
            Necessitam de validação documental
          </span>
        </div>

        {/* Card 2: Avaliação de Eficácia aos 6 Meses */}
        <div 
          onClick={() => setFiltroTipo('seisMeses')}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-2xs ${
            filtroTipo === 'seisMeses' ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avaliação 6 Meses Pendente</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-900">{pendentesSeisMeses.length}</span>
            <span className="text-xs text-slate-500">ações &gt; 6 meses</span>
          </div>
          <span className="text-[11px] text-rose-700 font-medium block mt-1">
            Requerem envio de notificação Outlook
          </span>
        </div>

        {/* Card 3: Certificações a Expirar */}
        <div 
          onClick={() => setFiltroTipo('certificacoes')}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-2xs ${
            filtroTipo === 'certificacoes' ? 'border-purple-400 bg-purple-50/60 ring-2 ring-purple-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Certificações em Risco</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-900">{certificacoesUrgentes.length}</span>
            <span className="text-xs text-slate-500">prazos críticos</span>
          </div>
          <span className="text-[11px] text-purple-700 font-medium block mt-1">
            Certificados válidos ou a expirar
          </span>
        </div>

        {/* Card 4: Situação de Colaboradores */}
        <div 
          onClick={() => setFiltroTipo('colaboradores')}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-2xs ${
            filtroTipo === 'colaboradores' ? 'border-teal-400 bg-teal-50/60 ring-2 ring-teal-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Colaboradores Inativos/Baixa</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-teal-900">{colaboradoresAtencao.length}</span>
            <span className="text-xs text-slate-500">colaboradores</span>
          </div>
          <span className="text-[11px] text-teal-700 font-medium block mt-1">
            Mantidos no ano, excluídos no seguinte
          </span>
        </div>

      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <span className="text-slate-500 mr-1">Filtrar Alertas:</span>
        <button
          onClick={() => setFiltroTipo('todos')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filtroTipo === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Todos ({totalAlertas + colaboradoresAtencao.length})
        </button>
        <button
          onClick={() => setFiltroTipo('burocracia')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filtroTipo === 'burocracia' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          Burocracia Pendente ({pendentesBurocracia.length})
        </button>
        <button
          onClick={() => setFiltroTipo('seisMeses')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filtroTipo === 'seisMeses' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          Avaliação 6 Meses ({pendentesSeisMeses.length})
        </button>
        <button
          onClick={() => setFiltroTipo('certificacoes')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filtroTipo === 'certificacoes' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          Certificações ({certificacoesUrgentes.length})
        </button>
        <button
          onClick={() => setFiltroTipo('colaboradores')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filtroTipo === 'colaboradores' ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          Inativos / Baixas ({colaboradoresAtencao.length})
        </button>
      </div>

      {/* Conteúdo dos Alertas */}
      <div className="space-y-4">
        
        {/* SECÇÃO 1: FORMAÇÕES COM MAIS DE 6 MESES PENDENTES DE EMAIL OUTLOOK */}
        {(filtroTipo === 'todos' || filtroTipo === 'seisMeses') && pendentesSeisMeses.length > 0 && (
          <div className="bg-white rounded-lg border border-rose-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-700" />
                <h3 className="font-bold text-xs text-rose-950 uppercase tracking-wider">
                  Avaliação da Eficácia aos 6 Meses Pendente ({pendentesSeisMeses.length} ações)
                </h3>
              </div>
              <span className="text-[11px] text-rose-700 font-medium">
                Envelope vermelho no registo de formações
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendentesSeisMeses.map((f) => (
                <div key={f.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-rose-50/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-teal-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        {f.codigo}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{f.nome}</h4>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {f.categoria}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span>Data: <strong className="font-mono text-slate-700">{f.data}</strong></span>
                      <span>Horas: <strong className="font-mono text-slate-700">{f.horas}h</strong></span>
                      <span>Participantes: <strong className="text-slate-800">{f.colaboradores.join(', ') || 'Equipa'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAbrirEmailOutlook(f)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs animate-pulse"
                      title="Enviar email de avaliação da eficácia aos 6 meses no Outlook agora"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Disparar Outlook (Envelope Vermelho)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditFormacao(f)}
                      className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECÇÃO 2: BUROCRACIA PENDENTE HÁ MAIS DE 30 DIAS */}
        {(filtroTipo === 'todos' || filtroTipo === 'burocracia') && pendentesBurocracia.length > 0 && (
          <div className="bg-white rounded-lg border border-amber-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                  Burocracia Regulamentar Pendente há mais de {diasAlertaBurocracia} Dias ({pendentesBurocracia.length} ações)
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Pendente de modelos e arquivo formal
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendentesBurocracia.map((item) => {
                const f = item.formacao;
                return (
                  <div key={f.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-amber-50/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          {f.codigo}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{f.nome}</h4>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {f.categoria}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>Realizada em: <strong className="font-mono text-slate-700">{item.dataRealizacao}</strong></span>
                        <span>Dias em atraso: <strong className="font-mono text-amber-800 font-bold">{item.diasAtraso} dias</strong></span>
                        <span>Colaboradores: <strong className="text-slate-800">{(f.colaboradores || []).join(', ') || 'Geral'}</strong></span>
                        {item.documentosEmFalta.length > 0 && (
                          <span className="text-rose-700 font-medium">Em falta: {item.documentosEmFalta.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleBurocracia(f.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Validar burocracia desta formação"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Validar Burocracia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditFormacao(f)}
                        className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECÇÃO 3: CERTIFICAÇÕES OBRIGATÓRIAS A EXPIRAR OU EXPIRADAS */}
        {(filtroTipo === 'todos' || filtroTipo === 'certificacoes') && certificacoesUrgentes.length > 0 && (
          <div className="bg-white rounded-lg border border-purple-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                <h3 className="font-bold text-xs text-purple-950 uppercase tracking-wider">
                  Certificações Clínicas & Prazos Críticos ({certificacoesUrgentes.length} certificações)
                </h3>
              </div>
              <span className="text-[11px] text-purple-800 font-medium">
                Conformidade hospitalar e licenciamento
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {certificacoesUrgentes.map((c) => (
                <div key={c.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-purple-50/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.estado === 'expirado' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {c.estado === 'expirado' ? 'EXPIRADO' : 'A EXPIRAR'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{c.nomeCertificacao}</h4>
                      <span className="font-mono text-xs font-bold text-teal-800">
                        {c.colaboradorNome} ({c.colaboradorSigla} - {c.categoriaProfissional})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span>Validade até: <strong className="font-mono text-slate-700">{c.dataExpiracao}</strong></span>
                      <span>Dias restantes: <strong className="font-mono text-purple-800 font-bold">{c.diasParaExpirar} dias</strong></span>
                      <span>Entidade: <strong className="text-slate-800">{c.entidadeCertificadora}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECÇÃO 4: COLABORADORES INATIVOS OU EM BAIXA */}
        {(filtroTipo === 'todos' || filtroTipo === 'colaboradores') && colaboradoresAtencao.length > 0 && (
          <div className="bg-white rounded-lg border border-teal-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-teal-50 border-b border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-xs text-teal-950 uppercase tracking-wider">
                  Situação de Colaboradores (Inativos / Baixas) ({colaboradoresAtencao.length})
                </h3>
              </div>
              <span className="text-[11px] text-teal-800 font-medium">
                Regra: mantidos no ano de inativação, excluídos nos anos posteriores
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {colaboradoresAtencao.map((colab) => (
                <div key={colab.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-teal-50/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        colab.estadoProfissional === 'Inativo'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {colab.estadoProfissional}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{colab.nome}</h4>
                      <span className="font-mono text-xs font-bold text-teal-800">
                        [{colab.sigla}] - {colab.categoriaProfissional}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span>Cargo: <strong className="text-slate-700">{colab.cargo}</strong></span>
                      {colab.anoInativo && (
                        <span>Ano de Inativação: <strong className="font-mono text-slate-800">{colab.anoInativo}</strong></span>
                      )}
                      <span>Meta atribuída: <strong className="font-mono text-slate-700">{colab.metaHorasAnual || 0}h</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalAlertas === 0 && colaboradoresAtencao.length === 0 && (
          <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">Tudo em conformidade!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Não existem burocracias em atraso, avaliações aos 6 meses pendentes ou certificações expiradas no Serviço de Radioterapia.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
