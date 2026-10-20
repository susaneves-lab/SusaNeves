import React, { useState, useEffect, useMemo } from 'react';
import { 
  Formacao, 
  Colaborador, 
  CertificacaoObrigatoria, 
  MetaAno, 
  HistoricoAno, 
  FormacaoFutura,
  DestinatarioGrupo,
  ConfiguracoesApp,
  TarefaQualidade
} from './types';
import { 
  getStoredFormacoes, 
  saveStoredFormacoes, 
  getStoredColaboradores, 
  saveStoredColaboradores,
  getStoredCertificacoes,
  saveStoredCertificacoes,
  getStoredMetas,
  saveStoredMetas,
  getStoredHistoricos,
  saveStoredHistoricos,
  getStoredCurrentYear,
  saveStoredCurrentYear,
  getStoredConfiguracoes,
  saveStoredConfiguracoes,
  generateFullBackupDownload,
  getStoredTarefasQualidade,
  saveStoredTarefasQualidade
} from './utils/storage';
import { syncDataToCloudVault } from './utils/cloudSyncCrypto';
import { Header } from './components/Header';
import { TrainingTable } from './components/TrainingTable';
import { AdminDashboard } from './components/AdminDashboard';
import { ReportsView } from './components/ReportsView';
import { FutureRadarView } from './components/FutureRadarView';
import { CertificationAlerts } from './components/CertificationAlerts';
import { BureaucracyMatrixView } from './components/BureaucracyMatrixView';
import { QualityTasksView } from './components/QualityTasksView';
import { TrainingModal } from './components/TrainingModal';
import { NewCycleModal } from './components/NewCycleModal';
import { CertificateViewerModal } from './components/CertificateViewerModal';
import { ImportPnfModal } from './components/ImportPnfModal';
import { ExcelExportModal } from './components/ExcelExportModal';
import { OutlookEmailModal } from './components/OutlookEmailModal';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsView } from './components/NotificationsView';
import { ImportFormacoesRealizadasModal } from './components/ImportFormacoesRealizadasModal';
import { 
  AlertCircle, 
  Check, 
  Bell, 
  Clock, 
  Download, 
  ShieldCheck,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { 
  getFormacoesBurocraciaPendente, 
  gerarLinksOutlookBurocracia, 
  dispararNotificacaoBrowser 
} from './utils/bureaucracyAlerts';

export default function App() {
  // Tab ativa (Requisito 11: Aba Notificações no menu principal)
  const [currentTab, setCurrentTab] = useState<'tabela' | 'dashboard' | 'relatorios' | 'burocracia' | 'tarefas' | 'radar' | 'certificacoes' | 'notificacoes'>('tabela');
  const [formacaoSelecionadaBurocraciaId, setFormacaoSelecionadaBurocraciaId] = useState<string | null>(null);
  
  // Autenticação com palavra-passe
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesApp>(getStoredConfiguracoes());
  const [isAutenticado, setIsAutenticado] = useState<boolean>(() => {
    return sessionStorage.getItem('radform_autenticado') === 'true';
  });

  // Dados persistidos
  const [anoAtual, setAnoAtual] = useState<number>(getStoredCurrentYear());
  const [formacoes, setFormacoes] = useState<Formacao[]>(getStoredFormacoes());
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(getStoredColaboradores());
  const [certificacoes, setCertificacoes] = useState<CertificacaoObrigatoria[]>(getStoredCertificacoes());
  const [metas, setMetas] = useState<Record<number, MetaAno>>(getStoredMetas());
  const [historicos, setHistoricos] = useState<HistoricoAno[]>(getStoredHistoricos());
  const [tarefas, setTarefas] = useState<TarefaQualidade[]>(() => getStoredTarefasQualidade(getStoredCurrentYear()));

  // Modais
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [formacaoToEdit, setFormacaoToEdit] = useState<Formacao | null>(null);
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [formacaoVisualizarCert, setFormacaoVisualizarCert] = useState<Formacao | null>(null);
  const [isImportPnfOpen, setIsImportPnfOpen] = useState(false);
  const [isImportRealizadasOpen, setIsImportRealizadasOpen] = useState(false); // Requisito 5
  const [isExcelExportOpen, setIsExcelExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Modal de Email Outlook
  const [isOutlookEmailOpen, setIsOutlookEmailOpen] = useState(false);
  const [formacaoParaEmail, setFormacaoParaEmail] = useState<Formacao | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Anos disponíveis para visualização
  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>();
    set.add(anoAtual);
    formacoes.forEach(f => set.add(f.ano));
    historicos.forEach(h => set.add(h.ano));
    return Array.from(set).sort((a, b) => b - a);
  }, [anoAtual, formacoes, historicos]);

  const metaDoAnoAtual = useMemo(() => {
    return metas[anoAtual] || {
      ano: anoAtual,
      metaHorasPorColaborador: configuracoes.metaPadraoHoras || 35,
      metaTotalServico: colaboradores.length * (configuracoes.metaPadraoHoras || 35),
      metaQtdFormacoesServico: configuracoes.metaTotalQtdFormacoesServico || 35,
      metaQtdFormacoesPorColaborador: configuracoes.metaPadraoQtdFormacoes || 3,
      dataCriacao: `${anoAtual}-01-01`
    };
  }, [metas, anoAtual, colaboradores.length, configuracoes.metaPadraoHoras, configuracoes.metaTotalQtdFormacoesServico, configuracoes.metaPadraoQtdFormacoes]);

  // Alertas urgentes de certificação
  const certificacoesUrgentes = useMemo(() => {
    return certificacoes.filter(c => c.estado === 'expirado' || c.estado === 'a_expirar');
  }, [certificacoes]);

  // Alertas automáticos de formações com burocracia pendente (+30 dias)
  const formacoesBurocraciaPendente30Dias = useMemo(() => {
    return getFormacoesBurocraciaPendente(formacoes, configuracoes.diasAlertaBurocracia || 30);
  }, [formacoes, configuracoes.diasAlertaBurocracia]);

  // Total de alertas consolidados para exibir exclusivamente no separador de Notificações
  const totalAlertas = useMemo(() => {
    const pendentesSeisMeses = formacoes.filter(f => {
      const isEmailEnviado = !!(f.documentosBurocracia?.emailAvaliacao6Meses || f.documentosBurocracia?.emailEnviadoData);
      if (isEmailEnviado) return false;
      if (!f.data) return false;
      const match = f.data.match(/\d{4}-\d{2}-\d{2}/);
      if (!match) return false;
      const dataForm = new Date(match[0]).getTime();
      return (Date.now() - dataForm) >= (180 * 24 * 60 * 60 * 1000);
    });
    return formacoesBurocraciaPendente30Dias.length + pendentesSeisMeses.length + certificacoesUrgentes.length;
  }, [formacoes, formacoesBurocraciaPendente30Dias.length, certificacoesUrgentes.length]);

  // Sincronização e gravação no LocalStorage
  useEffect(() => {
    saveStoredFormacoes(formacoes);
  }, [formacoes]);

  useEffect(() => {
    saveStoredColaboradores(colaboradores);
  }, [colaboradores]);

  useEffect(() => {
    saveStoredCertificacoes(certificacoes);
  }, [certificacoes]);

  useEffect(() => {
    saveStoredMetas(metas);
  }, [metas]);

  useEffect(() => {
    saveStoredHistoricos(historicos);
  }, [historicos]);

  useEffect(() => {
    saveStoredCurrentYear(anoAtual);
    setTarefas(getStoredTarefasQualidade(anoAtual));
  }, [anoAtual]);

  const handleSalvarTarefas = (novasTarefas: TarefaQualidade[]) => {
    setTarefas(novasTarefas);
    saveStoredTarefasQualidade(anoAtual, novasTarefas);
    showToast('Tarefas e cronograma da qualidade atualizados com sucesso.');
  };

  useEffect(() => {
    saveStoredConfiguracoes(configuracoes);
  }, [configuracoes]);

  // Requisito 12: Execução de Backup Automático periódico que descarrega ficheiro JSON com todos os dados
  useEffect(() => {
    if (!configuracoes.backupAutomaticoAtivo) return;
    if (!configuracoes.frequenciaBackup || configuracoes.frequenciaBackup === 'desativado') return;

    const ultimoBackup = configuracoes.ultimoBackupData ? new Date(configuracoes.ultimoBackupData).getTime() : 0;
    const agora = Date.now();
    const umDiaMs = 24 * 60 * 60 * 1000;
    const diasPassados = Math.floor((agora - ultimoBackup) / umDiaMs);

    let deveExecutarBackup = false;
    if (configuracoes.frequenciaBackup === 'diario' && diasPassados >= 1) deveExecutarBackup = true;
    if (configuracoes.frequenciaBackup === 'semanal' && diasPassados >= 7) deveExecutarBackup = true;
    if (configuracoes.frequenciaBackup === 'mensal' && diasPassados >= 30) deveExecutarBackup = true;

    if (deveExecutarBackup && formacoes.length > 0) {
      const timer = setTimeout(() => {
        generateFullBackupDownload({
          formacoes,
          colaboradores,
          certificacoes,
          metas,
          historicos,
          anoAtual
        });
        const hojeIso = new Date().toISOString().slice(0, 10);
        setConfiguracoes(prev => ({
          ...prev,
          ultimoBackupData: hojeIso
        }));
        showToast(`Backup automático (${configuracoes.frequenciaBackup}) descarregado com sucesso para ficheiro local.`);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [configuracoes.backupAutomaticoAtivo, configuracoes.frequenciaBackup, configuracoes.ultimoBackupData]);

  // Suporte Offline Total e Estado de Rede (Requisito 4)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Ligação à Internet restabelecida: Sincronização em nuvem ativa.');
      syncDataToCloudVault({
        formacoes,
        colaboradores,
        certificacoes,
        metas,
        historicos,
        configuracoes,
        anoAtual
      }).catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Modo Offline ativado: Todos os dados permanecem 100% acessíveis e operacionais localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // BroadcastChannel para sincronização em tempo real entre múltiplos dispositivos/separadores
    try {
      const channel = new BroadcastChannel('radform_cross_device_sync');
      channel.onmessage = (event) => {
        if (event.data?.tipo === 'NOVA_SINCRONIZACAO_NUVEM') {
          showToast(`Dados atualizados em tempo real pelo posto "${event.data.dispositivo?.nome || 'Hospital'}"`);
        }
      };
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        channel.close();
      };
    } catch {
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [formacoes, colaboradores, certificacoes, metas, historicos, configuracoes, anoAtual]);

  // Sincronização em Nuvem em Tempo Real com Criptografia E2EE (Requisito 3)
  const handleTriggerCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      await syncDataToCloudVault({
        formacoes,
        colaboradores,
        certificacoes,
        metas,
        historicos,
        configuracoes,
        anoAtual
      });
      const agoraTexto = 'Hoje às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      setConfiguracoes(prev => ({
        ...prev,
        ultimoCloudSyncData: agoraTexto
      }));
      showToast('Sincronização em Nuvem (E2EE AES-256) concluída com sucesso!');
    } catch (err: any) {
      showToast('Erro ao sincronizar na nuvem: ' + (err.message || 'Erro de comunicação.'));
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Helper para feedback ao utilizador
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sucesso de login
  const handleLoginSucesso = () => {
    setIsAutenticado(true);
    sessionStorage.setItem('radform_autenticado', 'true');
    showToast('Acesso autorizado ao Serviço de Radioterapia.');
  };

  // Terminar sessão / Logoff (Requisito 1)
  const handleLogoff = () => {
    setIsAutenticado(false);
    sessionStorage.removeItem('radform_autenticado');
    if (!configuracoes.exigirPassword) {
      setConfiguracoes(prev => ({ ...prev, exigirPassword: true }));
    }
    showToast('Sessão terminada com sucesso. Introduza a palavra-passe para aceder.');
  };

  // Ordenador cronológico oficial (Mais recente primeiro)
  const ordenarCronologicamente = (lista: Formacao[]): Formacao[] => {
    return [...lista].sort((a, b) => {
      const timeA = a.data ? new Date(a.data).getTime() : 0;
      const timeB = b.data ? new Date(b.data).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.codigo || '').localeCompare(a.codigo || '');
    });
  };

  // Handlers para Formações com ordenação cronológica automática
  const handleSaveFormacao = (novaOuEditada: Formacao) => {
    if (formacaoToEdit) {
      setFormacoes(prev => ordenarCronologicamente(prev.map(f => f.id === novaOuEditada.id ? novaOuEditada : f)));
      showToast('Formação atualizada com sucesso (ordem cronológica mantida).');
    } else {
      setFormacoes(prev => ordenarCronologicamente([novaOuEditada, ...prev]));
      showToast('Nova formação registada com sucesso (organizada cronologicamente).');
    }
    setFormacaoToEdit(null);
  };

  // Criação automática de novo registo a partir do upload de um certificado (Requisito 2)
  const handleCriarFormacaoDeCertificado = (novaFormacao: Formacao) => {
    setFormacoes(prev => ordenarCronologicamente([novaFormacao, ...prev]));
    showToast(`Novo registo criado automaticamente a partir do certificado «${novaFormacao.certificado?.nomeFicheiro || ''}».`);
  };

  const handleUpdateFormacaoDireta = (atualizada: Formacao) => {
    setFormacoes(prev => prev.map(f => f.id === atualizada.id ? atualizada : f));
    showToast('Documentos e estado de burocracia atualizados.');
  };

  const handleDeleteFormacao = (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta formação do registo hospitalar?')) {
      setFormacoes(prev => prev.filter(f => f.id !== id));
      showToast('Formação removida do registo.');
    }
  };

  const handleToggleRealizada = (id: string) => {
    setFormacoes(prev => prev.map(f => {
      if (f.id === id) {
        const novo = !f.realizada;
        showToast(novo ? 'Formação validada como Realizada (pisga ativa).' : 'Validação de realização removida.');
        return { ...f, realizada: novo };
      }
      return f;
    }));
  };

  const handleToggleBurocracia = (id: string) => {
    setFormacoes(prev => prev.map(f => {
      if (f.id === id) {
        const novo = !f.burocracia;
        showToast(novo ? 'Burocracia validada com sucesso (pisga ativa).' : 'Burocracia pendente.');
        return { ...f, burocracia: novo };
      }
      return f;
    }));
  };

  // Handler de atualização em massa do PNF
  const handleAtualizarFormacoesPnf = (novasFormacoes: Formacao[]) => {
    setFormacoes(novasFormacoes);
    showToast('Verificação automática do Plano Anual (PNF) aplicada a todas as formações.');
  };

  // Requisito 5: Importar lista de formações realizadas (PDF, JPEG, PNG, DOC) com toda a informação introduzida
  const handleImportarFormacoesRealizadas = (novasFormacoes: Formacao[]) => {
    setFormacoes(prev => ordenarCronologicamente([...novasFormacoes, ...prev]));
    setIsImportRealizadasOpen(false);
    showToast(`${novasFormacoes.length} formações importadas e adicionadas aos dados da aplicação!`);
  };

  // Handler de marcação de email enviado
  const handleMarcarEmailEnviado = (formacaoId: string) => {
    setFormacoes(prev => prev.map(f => {
      if (f.id === formacaoId) {
        const docs = f.documentosBurocracia || {};
        return {
          ...f,
          documentosBurocracia: {
            ...docs,
            emailAvaliacao6Meses: true,
            emailEnviadoData: new Date().toISOString().slice(0, 10)
          }
        };
      }
      return f;
    }));
    showToast('Envio de email registado nos documentos de conformidade da formação.');
  };

  // Abrir modal de email do Outlook para uma formação
  const handleAbrirEmailOutlook = (f: Formacao) => {
    setFormacaoParaEmail(f);
    setIsOutlookEmailOpen(true);
  };

  // Quick Backup imediato
  const handleTriggerQuickBackup = () => {
    generateFullBackupDownload({
      formacoes,
      colaboradores,
      certificacoes,
      metas,
      historicos,
      anoAtual
    });
    showToast('Backup descarregado com sucesso para arquivo seguro.');
  };

  // Novo Ciclo Anual (Transição de Ano com Backup Automático e Definição de Nova Meta)
  const handleConfirmNovoCiclo = (
    novoAno: number, 
    metaHorasPorColab: number, 
    metaTotalServico: number,
    metaQtdPorColab = 3,
    metaTotalQtdServico = 35
  ) => {
    const formacoesDoAnoAtual = formacoes.filter(f => f.ano === anoAtual);
    const totalHorasAnoAtual = formacoesDoAnoAtual.reduce((sum, f) => sum + f.horas, 0);
    const metaAtualObj = metaDoAnoAtual;

    const novoHistorico: HistoricoAno = {
      ano: anoAtual,
      totalFormacoes: formacoesDoAnoAtual.length,
      totalHoras: totalHorasAnoAtual,
      totalColaboradoresAtivos: colaboradores.length,
      percentagemMetaAtingida: Math.round((totalHorasAnoAtual / (metaAtualObj.metaTotalServico || 875)) * 100),
      percentagemMetaQtdAtingida: Math.round((formacoesDoAnoAtual.length / (metaAtualObj.metaQtdFormacoesServico || 35)) * 100),
      formacoes: formacoesDoAnoAtual,
      meta: {
        ...metaAtualObj,
        dataFecho: new Date().toISOString().slice(0, 10),
        concluido: true
      },
      dataArquivo: new Date().toISOString()
    };

    setHistoricos(prev => [novoHistorico, ...prev.filter(h => h.ano !== anoAtual)]);

    const novaMeta: MetaAno = {
      ano: novoAno,
      metaHorasPorColaborador: metaHorasPorColab,
      metaTotalServico: metaTotalServico,
      metaQtdFormacoesPorColaborador: metaQtdPorColab,
      metaQtdFormacoesServico: metaTotalQtdServico,
      dataCriacao: new Date().toISOString().slice(0, 10),
      observacoes: `Ciclo formativo iniciado para o ano ${novoAno}.`
    };

    setMetas(prev => ({
      ...prev,
      [novoAno]: novaMeta
    }));

    setColaboradores(prev => prev.map(c => ({
      ...c,
      metaHorasAnual: metaHorasPorColab,
      metaQtdFormacoesAnual: metaQtdPorColab
    })));

    setAnoAtual(novoAno);
    setCurrentTab('tabela');
    showToast(`Novo ciclo de ${novoAno} iniciado com sucesso! Registos do ano ${anoAtual} arquivados.`);
  };

  // Planear formação futura a partir do Radar
  const handlePlanearFormacaoFutura = (futura: FormacaoFutura) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const dataAlvo = futura.dataInicio.startsWith(anoAtual.toString()) 
      ? futura.dataInicio 
      : `${anoAtual}-${futura.dataInicio.slice(5)}`;
    
    const randomSeq = Math.floor(Math.random() * 89 + 10);
    const codSugerido = `${anoAtual.toString().slice(2)}${dataAlvo.slice(5, 7)}${dataAlvo.slice(8, 10)}-E${randomSeq}`;

    const novaPreenchida: Formacao = {
      id: `form-${Date.now()}`,
      ano: anoAtual,
      nome: futura.titulo,
      categoria: 'Externa',
      destinatarios: futura.destinatariosSugeridos,
      data: dataAlvo,
      dataFim: futura.dataFim,
      frequentadaColaboradorRad: true,
      colaboradores: [],
      horas: futura.horasEstimadas || 2,
      horasTexto: futura.horasEstimadas ? `${futura.horasEstimadas} h` : '2 h',
      codigo: codSugerido,
      relevancia: 'Sim',
      incluidaPlanoNecessidades: 'Sim',
      realizada: false,
      burocracia: false,
      observacoes: `Entidade: ${futura.entidade}. Local: ${futura.local}. Info: ${futura.url}`,
      dataRegisto: hoje
    };

    setFormacaoToEdit(novaPreenchida);
    setIsTrainingModalOpen(true);
  };

  // Renovar certificação
  const handleRenovarCertificacao = (id: string, novaDataExpiracao: string) => {
    const hoje = new Date();
    const expDate = new Date(novaDataExpiracao);
    const diff = Math.ceil((expDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    setCertificacoes(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          dataExpiracao: novaDataExpiracao,
          dataObtencao: hoje.toISOString().slice(0, 10),
          estado: diff <= 60 ? 'a_expirar' : 'valido',
          diasParaExpirar: diff,
          observacoes: `Renovado com sucesso em ${hoje.toLocaleDateString('pt-PT')}.`
        };
      }
      return c;
    }));

    showToast('Certificação renovada com sucesso.');
  };

  const handleAdicionarCertificacao = (nova: CertificacaoObrigatoria) => {
    setCertificacoes(prev => [nova, ...prev]);
    showToast('Nova certificação registada no processo do colaborador.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      
      {/* Modal de Palavra-passe de Entrada Obrigatório */}
      {(!isAutenticado || (configuracoes.exigirPassword && !isAutenticado)) && (
        <LoginModal
          isOpen={true}
          onSuccess={handleLoginSucesso}
          passwordCorreta={configuracoes.passwordAcesso || 'rad2026'}
        />
      )}

      {/* Top Navigation Bar com Menu de Configurações */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        anoAtual={anoAtual}
        anosDisponiveis={anosDisponiveis}
        onChangeAno={setAnoAtual}
        onOpenNovoRegisto={() => {
          setFormacaoToEdit(null);
          setIsTrainingModalOpen(true);
        }}
        onOpenNovoCiclo={() => setIsNewCycleModalOpen(true)}
        onQuickBackup={handleTriggerQuickBackup}
        onOpenSettings={() => setIsSettingsOpen(true)}
        certificacoes={certificacoes}
        totalAlertas={totalAlertas}
        isOnline={isOnline}
        onTriggerCloudSync={handleTriggerCloudSync}
        isCloudSyncing={isCloudSyncing}
        onLogoff={handleLogoff}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Separador 1: Registo Geral de Formações */}
        {currentTab === 'tabela' && (
          <TrainingTable
            formacoes={formacoes}
            colaboradores={colaboradores}
            anoAtual={anoAtual}
            configuracoes={configuracoes}
            onEdit={(f) => {
              setFormacaoToEdit(f);
              setIsTrainingModalOpen(true);
            }}
            onDelete={handleDeleteFormacao}
            onToggleRealizada={handleToggleRealizada}
            onToggleBurocracia={handleToggleBurocracia}
            onViewCertificado={(f) => setFormacaoVisualizarCert(f)}
            onOpenNovoRegisto={() => {
              setFormacaoToEdit(null);
              setIsTrainingModalOpen(true);
            }}
            onOpenImportPnf={() => setIsImportPnfOpen(true)}
            onOpenImportRealizadas={() => setIsImportRealizadasOpen(true)}
            onOpenConfigurarExcel={() => setIsExcelExportOpen(true)}
            onAbrirEmailOutlook={handleAbrirEmailOutlook}
            onCriarFormacaoDeCertificado={handleCriarFormacaoDeCertificado}
            onNavigateToBurocracia={(formacaoId) => {
              const formacaoAlvo = formacoes.find(f => f.id === formacaoId);
              if (formacaoAlvo?.ano && formacaoAlvo.ano !== anoAtual) {
                setAnoAtual(formacaoAlvo.ano);
              }
              setFormacaoSelecionadaBurocraciaId(formacaoId);
              setCurrentTab('burocracia');
            }}
          />
        )}

        {/* Separador 2: Análise de Dados (Métricas, Indicadores e Gráficos) */}
        {currentTab === 'dashboard' && (
          <AdminDashboard
            formacoes={formacoes}
            colaboradores={colaboradores}
            anoAtual={anoAtual}
            metaAtual={metaDoAnoAtual}
            historicos={historicos}
          />
        )}

        {/* Separador 3: Matriz e Gestão de Burocracias (Segunda Imagem) */}
        {currentTab === 'burocracia' && (
          <BureaucracyMatrixView
            formacoes={formacoes}
            colaboradores={colaboradores}
            anoAtual={anoAtual}
            configuracoes={configuracoes}
            onAtualizarFormacao={handleUpdateFormacaoDireta}
            onAbrirEmailOutlook={handleAbrirEmailOutlook}
            selectedFormacaoId={formacaoSelecionadaBurocraciaId}
            onSelectFormacao={setFormacaoSelecionadaBurocraciaId}
          />
        )}

        {/* Separador: Tarefas Mensais & Cronograma da Qualidade */}
        {currentTab === 'tarefas' && (
          <QualityTasksView
            anoAtual={anoAtual}
            tarefas={tarefas}
            colaboradores={colaboradores}
            onSalvarTarefas={handleSalvarTarefas}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Separador 4: Relatórios Mensais e Trimestrais */}
        {currentTab === 'relatorios' && (
          <ReportsView
            formacoes={formacoes}
            colaboradores={colaboradores}
            anoAtual={anoAtual}
            metaAtual={metaDoAnoAtual}
          />
        )}

        {/* Separador 5: Radar de Formações Futuras */}
        {currentTab === 'radar' && (
          <FutureRadarView
            onPlanearFormacao={handlePlanearFormacaoFutura}
          />
        )}

        {/* Separador 6: Certificações & Prazos */}
        {currentTab === 'certificacoes' && (
          <CertificationAlerts
            certificacoes={certificacoes}
            colaboradores={colaboradores}
            onRenovar={handleRenovarCertificacao}
            onAdicionar={handleAdicionarCertificacao}
          />
        )}

        {/* Separador 7: Notificações & Alertas no Menu Principal (Requisito 11) */}
        {currentTab === 'notificacoes' && (
          <NotificationsView
            formacoes={formacoes}
            colaboradores={colaboradores}
            certificacoes={certificacoes}
            anoAtual={anoAtual}
            configuracoes={configuracoes}
            onAbrirEmailOutlook={handleAbrirEmailOutlook}
            onToggleBurocracia={handleToggleBurocracia}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onEditFormacao={(f) => {
              setFormacaoToEdit(f);
              setIsTrainingModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Toast de Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modais do Sistema montados condicionalmente para cumprir as regras de Hooks */}
      {isTrainingModalOpen && (
        <TrainingModal
          isOpen={true}
          onClose={() => {
            setIsTrainingModalOpen(false);
            setFormacaoToEdit(null);
          }}
          onSave={handleSaveFormacao}
          formacaoToEdit={formacaoToEdit}
          anoAtual={anoAtual}
          colaboradores={colaboradores}
        />
      )}

      {isImportPnfOpen && (
        <ImportPnfModal
          isOpen={true}
          onClose={() => setIsImportPnfOpen(false)}
          formacoes={formacoes}
          anoAtual={anoAtual}
          onAtualizarFormacoesPnf={handleAtualizarFormacoesPnf}
        />
      )}

      {/* Requisito 5: Modal de Importação de Formações Realizadas (PDF, JPEG, PNG, DOC) */}
      {isImportRealizadasOpen && (
        <ImportFormacoesRealizadasModal
          isOpen={true}
          onClose={() => setIsImportRealizadasOpen(false)}
          anoAtual={anoAtual}
          colaboradores={colaboradores}
          onImportarFormacoes={handleImportarFormacoesRealizadas}
        />
      )}

      {isExcelExportOpen && (
        <ExcelExportModal
          isOpen={true}
          onClose={() => setIsExcelExportOpen(false)}
          formacoes={formacoes}
          colaboradores={colaboradores}
          anoAtual={anoAtual}
        />
      )}

      {isOutlookEmailOpen && formacaoParaEmail && (
        <OutlookEmailModal
          isOpen={true}
          onClose={() => {
            setIsOutlookEmailOpen(false);
            setFormacaoParaEmail(null);
          }}
          formacao={formacaoParaEmail}
          colaboradores={colaboradores}
          onMarcarEmailEnviado={handleMarcarEmailEnviado}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          isOpen={true}
          onClose={() => setIsSettingsOpen(false)}
          colaboradores={colaboradores}
          onSalvarColaboradores={(novosColabs) => {
            setColaboradores(novosColabs);
            showToast('Lista de colaboradores atualizada e verificada com sucesso.');
          }}
          configuracoes={configuracoes}
          onSalvarConfiguracoes={(novasCfg) => {
            setConfiguracoes(novasCfg);
            showToast('Configurações gravadas com sucesso.');
          }}
          formacoes={formacoes}
          anoAtual={anoAtual}
          onTriggerBackup={handleTriggerQuickBackup}
        />
      )}

      {isNewCycleModalOpen && (
        <NewCycleModal
          isOpen={true}
          onClose={() => setIsNewCycleModalOpen(false)}
          anoAtual={anoAtual}
          totalFormacoesAtuais={formacoes.filter(f => f.ano === anoAtual).length}
          totalHorasAtuais={formacoes.filter(f => f.ano === anoAtual).reduce((acc, curr) => acc + curr.horas, 0)}
          totalColaboradores={colaboradores.length}
          onConfirmNovoCiclo={handleConfirmNovoCiclo}
          onTriggerBackupDownload={handleTriggerQuickBackup}
        />
      )}

      {formacaoVisualizarCert && (
        <CertificateViewerModal
          formacao={formacaoVisualizarCert}
          onClose={() => setFormacaoVisualizarCert(null)}
        />
      )}

      {/* Footer Hospitalar */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            RadForm · Serviço de Radioterapia · Unidade Local de Saúde (ULSAR, EPE)
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Exercício Ativo: {anoAtual}</span>
            <span>·</span>
            <span>Conformidade & Auditoria Hospitalar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
