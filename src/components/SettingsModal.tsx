import React, { useState } from 'react';
import { 
  Colaborador, 
  ConfiguracoesApp, 
  DestinatarioGrupo, 
  EstadoProfissional,
  Formacao,
  MATRIZ_BUROCRACIA,
  SubtipoBurocracia,
  RequisitosDocumentais,
  RecapCodigoInfo,
  DEFAULT_RECAP_CODIGOS
} from '../types';
import { 
  Settings, 
  X, 
  Users, 
  KeyRound, 
  Target, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle, 
  Edit3, 
  Plus, 
  Search, 
  Lock, 
  CheckCircle2, 
  FileCheck2, 
  Bell, 
  Mail, 
  Send, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  FileText, 
  Clock, 
  Sparkles,
  Bookmark,
  RotateCcw,
  Trash2,
  HardDrive,
  Download,
  Pencil,
  Cloud,
  CloudUpload,
  RefreshCw,
  Smartphone,
  Laptop,
  Shield,
  Key,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  getFormacoesBurocraciaPendente, 
  gerarLinksOutlookBurocracia, 
  dispararNotificacaoBrowser,
  FormacaoPendenteAlerta
} from '../utils/bureaucracyAlerts';
import { generateFullBackupDownload } from '../utils/storage';
import { 
  getStoredE2EEPassphrase, 
  saveStoredE2EEPassphrase, 
  getDeviceId, 
  setDeviceName, 
  getDispositivosSincronizados, 
  syncDataToCloudVault, 
  downloadEncryptedBackupFile, 
  importEncryptedBackupFile, 
  DispositivoSincronizado 
} from '../utils/cloudSyncCrypto';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  onSalvarColaboradores: (colabs: Colaborador[]) => void;
  configuracoes: ConfiguracoesApp;
  onSalvarConfiguracoes: (cfg: ConfiguracoesApp) => void;
  formacoes?: Formacao[];
  anoAtual?: number;
  onTriggerBackup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  colaboradores,
  onSalvarColaboradores,
  configuracoes,
  onSalvarConfiguracoes,
  formacoes = [],
  anoAtual = 2026,
  onTriggerBackup
}) => {
  // Ordem estrita das tabs solicitada:
  // 1. Metas (horas e quantidade)
  // 2. Lista de colaboradores
  // 3. Matriz regulamentar de documentação exigida (com ícone de lápis)
  // 4. Códigos Formações ReCap (com botão para editar e janela de verificação)
  // 5. Notificações & Alertas (+30 dias de burocracia)
  // 6. Backup Automático (Requisito 12: definir frequência e descarregar JSON)
  // 7. Palavra-passe & Acesso
  const [activeTab, setActiveTab] = useState<'metas' | 'colaboradores' | 'matriz' | 'recap' | 'notificacoes' | 'backup' | 'seguranca'>('metas');
  
  // 1. LISTA LOCAL DE COLABORADORES
  const [listaColabs, setListaColabs] = useState<Colaborador[]>([...colaboradores]);
  const [buscaColab, setBuscaColab] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');

  // Estado para edição de colaborador
  const [colaboradorEditando, setColaboradorEditando] = useState<Colaborador | null>(null);
  const [isNovoColaborador, setIsNovoColaborador] = useState(false);

  // CÓDIGOS DAS FORMAÇÕES RECAP (APÓS MATRIZ REGULAMENTAR)
  const [listaRecapCodigos, setListaRecapCodigos] = useState<RecapCodigoInfo[]>(
    configuracoes.recapCodigos && configuracoes.recapCodigos.length > 0
      ? configuracoes.recapCodigos
      : DEFAULT_RECAP_CODIGOS
  );
  const [buscaRecap, setBuscaRecap] = useState('');
  const [filtroDominioRecap, setFiltroDominioRecap] = useState('todos');
  const [recapEditando, setRecapEditando] = useState<RecapCodigoInfo | null>(null);
  const [isModalRecapAberto, setIsModalRecapAberto] = useState(false);
  const [isNovoRecap, setIsNovoRecap] = useState(false);

  // Formulário para edição de código ReCap
  const [formRecapCodigo, setFormRecapCodigo] = useState('');
  const [formRecapNome, setFormRecapNome] = useState('');
  const [formRecapDominio, setFormRecapDominio] = useState('Orientação para os Resultados');
  const [formRecapGrau, setFormRecapGrau] = useState('Geral (Todos os Graus)');
  const [formRecapHoras, setFormRecapHoras] = useState(1);
  const [formRecapPlataforma, setFormRecapPlataforma] = useState('NAU (ep.nau.edu.pt)');
  const [formRecapDescricao, setFormRecapDescricao] = useState('');

  // 2. METAS (HORAS E NÚMERO DE FORMAÇÕES PARA SERVIÇO E POR CATEGORIA PROFISSIONAL)
  // Metas em Horas:
  const [metaServicoTotalHoras, setMetaServicoTotalHoras] = useState<number>(
    configuracoes.metaTotalServico || colaboradores.length * (configuracoes.metaPadraoHoras || 35)
  );
  const [metaPadraoGeralHoras, setMetaPadraoGeralHoras] = useState<number>(configuracoes.metaPadraoHoras || 35);
  const [metasHorasPorCat, setMetasHorasPorCat] = useState<Record<DestinatarioGrupo, number>>({
    TSDT: configuracoes.metasPorCategoria?.TSDT ?? 35,
    FIS: configuracoes.metasPorCategoria?.FIS ?? 40,
    TAS: configuracoes.metasPorCategoria?.TAS ?? configuracoes.metasPorCategoria?.AO ?? 30,
    AO: configuracoes.metasPorCategoria?.AO ?? configuracoes.metasPorCategoria?.TAS ?? 30,
    AT: configuracoes.metasPorCategoria?.AT ?? 35,
    MR: configuracoes.metasPorCategoria?.MR ?? 35,
    ENF: configuracoes.metasPorCategoria?.ENF ?? 35,
  });

  // Metas em Quantidade de Formações (Ações):
  const [metaServicoTotalQtd, setMetaServicoTotalQtd] = useState<number>(
    configuracoes.metaTotalQtdFormacoesServico || 35
  );
  const [metaPadraoGeralQtd, setMetaPadraoGeralQtd] = useState<number>(
    configuracoes.metaPadraoQtdFormacoes || 3
  );
  const [metasQtdPorCat, setMetasQtdPorCat] = useState<Record<DestinatarioGrupo, number>>({
    TSDT: configuracoes.metasQtdPorCategoria?.TSDT ?? 3,
    FIS: configuracoes.metasQtdPorCategoria?.FIS ?? 4,
    TAS: configuracoes.metasQtdPorCategoria?.TAS ?? configuracoes.metasQtdPorCategoria?.AO ?? 2,
    AO: configuracoes.metasQtdPorCategoria?.AO ?? configuracoes.metasQtdPorCategoria?.TAS ?? 2,
    AT: configuracoes.metasQtdPorCategoria?.AT ?? 2,
    MR: configuracoes.metasQtdPorCategoria?.MR ?? 3,
    ENF: configuracoes.metasQtdPorCategoria?.ENF ?? 3,
  });

  // 3. MATRIZ REGULAMENTAR - Subtipo selecionado para inspeção
  const [subtipoInspecao, setSubtipoInspecao] = useState<SubtipoBurocracia>('Externa (inclui Enfermagem Externas)');
  const [matrizCustomizada, setMatrizCustomizada] = useState<Record<SubtipoBurocracia, RequisitosDocumentais>>(
    configuracoes.matrizBurocraciaCustomizada || MATRIZ_BUROCRACIA
  );
  const [requisitoEditando, setRequisitoEditando] = useState<{
    subtipo: SubtipoBurocracia;
    chaveDoc: string;
    nomeDoc: string;
    valorAtual: 'sim' | 'opcional' | 'n.a.';
  } | null>(null);

  // Metas por Ano (Requisito 10)
  const [anoMetasSelecionado, setAnoMetasSelecionado] = useState<number>(anoAtual || 2026);

  // Backup Automático (Requisito 12)
  const [backupAutoAtivo, setBackupAutoAtivo] = useState<boolean>(
    configuracoes.backupAutomaticoAtivo ?? true
  );
  const [frequenciaBackupState, setFrequenciaBackupState] = useState<'diario' | 'semanal' | 'mensal' | 'desativado'>(
    configuracoes.frequenciaBackup || 'semanal'
  );
  const [ultimoBackupDataState, setUltimoBackupDataState] = useState<string>(
    configuracoes.ultimoBackupData || new Date().toISOString().slice(0, 10)
  );

  // Sincronização em Nuvem e Criptografia E2EE (Requisito 3)
  const [cloudSyncAtivo, setCloudSyncAtivo] = useState<boolean>(
    configuracoes.cloudSyncAtivo ?? true
  );
  const [cloudSyncFrequencia, setCloudSyncFrequencia] = useState<'tempo_real' | 'horario' | 'diario' | 'semanal'>(
    configuracoes.cloudSyncFrequencia || 'tempo_real'
  );
  const [cloudSyncServico, setCloudSyncServico] = useState<'RadForm Cloud Vault' | 'Microsoft OneDrive / SharePoint' | 'Google Drive'>(
    configuracoes.cloudSyncServico || 'RadForm Cloud Vault'
  );
  const [passphraseE2EE, setPassphraseE2EE] = useState<string>(
    configuracoes.e2eePassphrase || getStoredE2EEPassphrase()
  );
  const [mostrarPassphrase, setMostrarPassphrase] = useState<boolean>(false);
  const [dispositivosSinc, setDispositivosSinc] = useState<DispositivoSincronizado[]>(
    getDispositivosSincronizados()
  );
  const [nomeDispositivoInput, setNomeDispositivoInput] = useState<string>(
    getDeviceId().nome
  );
  const [isSincronizandoNuvem, setIsSincronizandoNuvem] = useState<boolean>(false);
  const [ultimoCloudSyncData, setUltimoCloudSyncData] = useState<string>(
    configuracoes.ultimoCloudSyncData || localStorage.getItem('radform_last_cloud_sync_timestamp') || 'Hoje às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );

  // 4. NOTIFICAÇÕES & ALERTAS DE BUROCRACIA (+30 DIAS)
  const [notifBrowserAtivas, setNotifBrowserAtivas] = useState<boolean>(
    configuracoes.notificacoesBrowserAtivas ?? true
  );
  const [notifEmailAtivas, setNotifEmailAtivas] = useState<boolean>(
    configuracoes.notificacoesEmailAtivas ?? true
  );
  const [emailNotifBurocracia, setEmailNotifBurocracia] = useState<string>(
    configuracoes.emailNotificacoesBurocracia || 'chefia.radioterapia@ulsar.min-saude.pt; radform@ulsar.min-saude.pt'
  );
  const [diasAlertaBurocracia, setDiasAlertaBurocracia] = useState<number>(
    configuracoes.diasAlertaBurocracia || 30
  );
  const [testeNotifStatus, setTesteNotifStatus] = useState<string | null>(null);

  // Lista dinâmica de formações com burocracia pendente há mais de X dias
  const pendentesAlerta = getFormacoesBurocraciaPendente(formacoes, diasAlertaBurocracia);

  // 5. SEGURANÇA E PALAVRA-PASSE
  const [passwordAtual, setPasswordAtual] = useState(configuracoes.passwordAcesso || 'rad2026');
  const [mostrarPasswordAtual, setMostrarPasswordAtual] = useState(false);
  const [novaPasswordInput, setNovaPasswordInput] = useState('');
  const [confirmarPasswordInput, setConfirmarPasswordInput] = useState('');
  const [mostrarNovaPassword, setMostrarNovaPassword] = useState(false);
  const [exigirPass, setExigirPass] = useState(configuracoes.exigirPassword);

  // Mensagens e Diálogo de Confirmação
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Janela / Modal de Verificação / Confirmação
  const [janelaVerificacaoAberta, setJanelaVerificacaoAberta] = useState(false);
  const [dadosParaVerificar, setDadosParaVerificar] = useState<{
    tipo: 'editar_colaborador' | 'atualizar_metas' | 'alterar_password' | 'gravar_notificacoes' | 'editar_recap' | 'editar_matriz';
    colaborador?: Colaborador;
    novaPasswordAlvo?: string;
    recapItem?: RecapCodigoInfo;
    matrizAlvo?: { subtipo: SubtipoBurocracia; chaveDoc: string; novoValor: 'sim' | 'opcional' | 'n.a.' };
    mensagem: string;
  } | null>(null);

  if (!isOpen) return null;

  // Filtragem e ordenação alfabética de TODOS os colaboradores (Requisito 4)
  const colabsFiltrados = [...listaColabs]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }))
    .filter(c => {
      if (filtroGrupo !== 'todos' && c.categoriaProfissional !== filtroGrupo) return false;
      if (buscaColab.trim() !== '') {
        const q = buscaColab.toLowerCase();
        return (
          c.nome.toLowerCase().includes(q) ||
          c.sigla.toLowerCase().includes(q) ||
          c.numMecanografico.includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      }
      return true;
    });

  // Iniciar verificação para colaborador
  const handleIniciarSalvarColaborador = (colab: Colaborador) => {
    setDadosParaVerificar({
      tipo: 'editar_colaborador',
      colaborador: colab,
      mensagem: isNovoColaborador
        ? `Tem a certeza que deseja adicionar o colaborador ${colab.nome} (${colab.sigla}) à lista do serviço?`
        : `Confirma a atualização dos dados do colaborador ${colab.nome} (${colab.sigla})?`
    });
    setJanelaVerificacaoAberta(true);
  };

  // Iniciar verificação para atualizar Metas
  const handleIniciarSalvarMetas = () => {
    setDadosParaVerificar({
      tipo: 'atualizar_metas',
      mensagem: `Confirma a atualização das Metas do Serviço (${metaServicoTotalHoras}h e ${metaServicoTotalQtd} formações) e a aplicação dos objetivos por categoria profissional a todos os colaboradores?`
    });
    setJanelaVerificacaoAberta(true);
  };

  // Iniciar gravação de notificações e backup automático (Requisito 12)
  const handleSalvarConfigNotificacoes = () => {
    const novasCfg: ConfiguracoesApp = {
      ...configuracoes,
      notificacoesBrowserAtivas: notifBrowserAtivas,
      notificacoesEmailAtivas: notifEmailAtivas,
      emailNotificacoesBurocracia: emailNotifBurocracia.trim(),
      diasAlertaBurocracia: diasAlertaBurocracia,
      backupAutomaticoAtivo: backupAutoAtivo,
      frequenciaBackup: frequenciaBackupState,
      ultimoBackupData: ultimoBackupDataState
    };
    onSalvarConfiguracoes(novasCfg);
    setMensagemSucesso('Configurações de notificações, alertas e backup automático gravadas com sucesso.');
    setTimeout(() => setMensagemSucesso(''), 3500);
  };

  // Testar notificação do browser
  const handleTestarBrowserNotif = async () => {
    const ok = await dispararNotificacaoBrowser(
      'RadForm · Serviço de Radioterapia (ULSAR)',
      `Teste de Alerta: O sistema está configurado para monitorizar formações com burocracia pendente há mais de ${diasAlertaBurocracia} dias.`
    );
    if (ok) {
      setTesteNotifStatus('Notificação de teste enviada para o seu browser com sucesso!');
    } else {
      setTesteNotifStatus('Permissão de notificações não concedida no browser. Por favor ative nas permissões do site.');
    }
    setTimeout(() => setTesteNotifStatus(null), 4000);
  };

  // Disparar email Outlook de alertas pendentes
  const handleDispararEmailOutlook = () => {
    if (pendentesAlerta.length === 0) {
      alert('Não existem atualmente formações com burocracia pendente há mais de 30 dias.');
      return;
    }
    const { webUrl, mailtoUrl } = gerarLinksOutlookBurocracia(pendentesAlerta, emailNotifBurocracia);
    
    // Tentar abrir Outlook Web primeiro ou mailto
    const opened = window.open(webUrl, '_blank');
    if (!opened) {
      window.location.href = mailtoUrl;
    }
    setMensagemSucesso(`A abrir o Outlook com o relatório formal das ${pendentesAlerta.length} ações pendentes.`);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  // Handlers para Códigos de Formação ReCap
  const handleAbrirEditarRecap = (item?: RecapCodigoInfo) => {
    if (item) {
      setRecapEditando(item);
      setIsNovoRecap(false);
      setFormRecapCodigo(item.codigo);
      setFormRecapNome(item.nome);
      setFormRecapDominio(item.dominioCompetencia);
      setFormRecapGrau(item.grauCarreira || '');
      setFormRecapHoras(item.horasPadrao);
      setFormRecapPlataforma(item.plataforma || 'NAU (ep.nau.edu.pt)');
      setFormRecapDescricao(item.descricao || '');
    } else {
      setRecapEditando(null);
      setIsNovoRecap(true);
      setFormRecapCodigo('ReCAP-');
      setFormRecapNome('ReCAP: ');
      setFormRecapDominio('Orientação para os Resultados');
      setFormRecapGrau('Carreiras Grau 3 (Técnicos Superiores / TSDT)');
      setFormRecapHoras(7);
      setFormRecapPlataforma('NAU (ep.nau.edu.pt)');
      setFormRecapDescricao('');
    }
    setIsModalRecapAberto(true);
  };

  const handleSalvarRecapItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecapCodigo.trim() || !formRecapNome.trim()) {
      setMensagemErro('Código e Nome da Formação ReCap são obrigatórios.');
      return;
    }

    const itemFinal: RecapCodigoInfo = {
      id: recapEditando ? recapEditando.id : `recap-${Date.now()}`,
      codigo: formRecapCodigo.trim(),
      nome: formRecapNome.trim(),
      dominioCompetencia: formRecapDominio.trim(),
      grauCarreira: formRecapGrau.trim(),
      horasPadrao: Number(formRecapHoras) || 1,
      plataforma: formRecapPlataforma.trim(),
      descricao: formRecapDescricao.trim()
    };

    // Requisito 3: caso se altera surge uma janela de verificação da alteração
    setDadosParaVerificar({
      tipo: 'editar_recap',
      recapItem: itemFinal,
      mensagem: isNovoRecap
        ? `Confirma a adição do novo código de formação ReCap "${itemFinal.codigo}" (${itemFinal.nome})?`
        : `Confirma a alteração dos dados do código de formação ReCap "${itemFinal.codigo}" (${itemFinal.nome})?`
    });
    setJanelaVerificacaoAberta(true);
  };

  const handleEliminarRecapItem = (id: string) => {
    const item = listaRecapCodigos.find(r => r.id === id);
    if (!confirm(`Deseja remover o código ReCap "${item?.codigo}" das configurações?`)) return;
    const novaLista = listaRecapCodigos.filter(r => r.id !== id);
    setListaRecapCodigos(novaLista);
    onSalvarConfiguracoes({
      ...configuracoes,
      recapCodigos: novaLista
    });
    setMensagemSucesso('Código ReCap removido.');
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  const handleRestaurarPadroesRecap = () => {
    if (!confirm('Deseja repor a lista padrão oficial de códigos das formações ReCap?')) return;
    setListaRecapCodigos(DEFAULT_RECAP_CODIGOS);
    onSalvarConfiguracoes({
      ...configuracoes,
      recapCodigos: DEFAULT_RECAP_CODIGOS
    });
    setMensagemSucesso('Códigos padrão das formações ReCap repostos com sucesso.');
    setTimeout(() => setMensagemSucesso(''), 3500);
  };

  // Requisito 6: Adicionar icon de lápis de edição na matriz regulamentar das configurações
  const handleIniciarEditarRequisitoMatriz = (
    subtipo: SubtipoBurocracia,
    chaveDoc: string,
    nomeDoc: string,
    valorAtual: 'sim' | 'opcional' | 'n.a.'
  ) => {
    const proximoValor: 'sim' | 'opcional' | 'n.a.' = valorAtual === 'sim' ? 'opcional' : valorAtual === 'opcional' ? 'n.a.' : 'sim';
    setDadosParaVerificar({
      tipo: 'editar_matriz',
      matrizAlvo: {
        subtipo,
        chaveDoc,
        novoValor: proximoValor
      },
      mensagem: `Confirma a alteração do modelo regulamentar "${nomeDoc}" para o subtipo "${subtipo}" de "${valorAtual.toUpperCase()}" para "${proximoValor.toUpperCase()}"?`
    });
    setJanelaVerificacaoAberta(true);
  };

  // Iniciar verificação para alterar Password
  const handleIniciarMudarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro('');

    if (!novaPasswordInput.trim()) {
      setMensagemErro('Por favor introduza a nova palavra-passe.');
      return;
    }
    if (novaPasswordInput !== confirmarPasswordInput) {
      setMensagemErro('A nova palavra-passe e a confirmação não coincidem.');
      return;
    }

    setDadosParaVerificar({
      tipo: 'alterar_password',
      novaPasswordAlvo: novaPasswordInput.trim(),
      mensagem: `Tem a certeza que deseja alterar a palavra-passe de acesso ao sistema RadForm? Esta pass será exigida no próximo início de sessão.`
    });
    setJanelaVerificacaoAberta(true);
  };

  // Confirmação final da Janela de Verificação
  const handleConfirmarVerificacao = () => {
    if (!dadosParaVerificar) return;

    if (dadosParaVerificar.tipo === 'editar_colaborador' && dadosParaVerificar.colaborador) {
      const c = dadosParaVerificar.colaborador;
      let novaLista: Colaborador[];
      if (isNovoColaborador) {
        novaLista = [c, ...listaColabs];
      } else {
        novaLista = listaColabs.map(item => item.id === c.id ? c : item);
      }
      setListaColabs(novaLista);
      onSalvarColaboradores(novaLista);
      setColaboradorEditando(null);
      setIsNovoColaborador(false);
      setMensagemSucesso('Dados do colaborador atualizados e verificados com sucesso.');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } 
    else if (dadosParaVerificar.tipo === 'editar_recap' && dadosParaVerificar.recapItem) {
      const itemFinal = dadosParaVerificar.recapItem;
      let novaLista: RecapCodigoInfo[];
      if (isNovoRecap) {
        novaLista = [...listaRecapCodigos, itemFinal];
      } else {
        novaLista = listaRecapCodigos.map(r => r.id === itemFinal.id ? itemFinal : r);
      }
      setListaRecapCodigos(novaLista);
      onSalvarConfiguracoes({
        ...configuracoes,
        recapCodigos: novaLista
      });
      setIsModalRecapAberto(false);
      setRecapEditando(null);
      setIsNovoRecap(false);
      setMensagemSucesso(`Informação do código ReCap "${itemFinal.codigo}" verificada e gravada com sucesso!`);
      setTimeout(() => setMensagemSucesso(''), 3500);
    }
    else if (dadosParaVerificar.tipo === 'editar_matriz' && dadosParaVerificar.matrizAlvo) {
      const { subtipo, chaveDoc, novoValor } = dadosParaVerificar.matrizAlvo;
      const subtipoAtual = { ...(matrizCustomizada[subtipo] || MATRIZ_BUROCRACIA[subtipo]) };
      (subtipoAtual as any)[chaveDoc] = novoValor;
      const novaMatriz = {
        ...matrizCustomizada,
        [subtipo]: subtipoAtual
      };
      setMatrizCustomizada(novaMatriz);
      onSalvarConfiguracoes({
        ...configuracoes,
        matrizBurocraciaCustomizada: novaMatriz
      });
      setRequisitoEditando(null);
      setMensagemSucesso(`Requisito regulamentar atualizado para "${novoValor.toUpperCase()}" com sucesso.`);
      setTimeout(() => setMensagemSucesso(''), 3500);
    }
    else if (dadosParaVerificar.tipo === 'atualizar_metas') {
      // 1. Atualizar colaboradores com as metas das suas respetivas categorias (horas e quantidade)
      const novaListaColabs = listaColabs.map(colab => {
        const metaHorasCat = metasHorasPorCat[colab.categoriaProfissional] !== undefined 
          ? metasHorasPorCat[colab.categoriaProfissional] 
          : metaPadraoGeralHoras;
        const metaQtdCat = metasQtdPorCat[colab.categoriaProfissional] !== undefined 
          ? metasQtdPorCat[colab.categoriaProfissional] 
          : metaPadraoGeralQtd;
        return {
          ...colab,
          metaHorasAnual: metaHorasCat,
          metaQtdFormacoesAnual: metaQtdCat
        };
      });
      setListaColabs(novaListaColabs);
      onSalvarColaboradores(novaListaColabs);

      // 2. Gravar metas específicas do ano selecionado (Requisito 10)
      const novasMetasAno = {
        ...(configuracoes.metasPorAno || {}),
        [anoMetasSelecionado]: {
          ano: anoMetasSelecionado,
          metaHorasPorColaborador: metaPadraoGeralHoras,
          metaTotalServico: metaServicoTotalHoras,
          metaQtdFormacoesServico: metaServicoTotalQtd,
          metaQtdFormacoesPorColaborador: metaPadraoGeralQtd,
          dataCriacao: new Date().toISOString()
        }
      };

      // 3. Gravar configurações
      const novasCfg: ConfiguracoesApp = {
        ...configuracoes,
        metaPadraoHoras: metaPadraoGeralHoras,
        metaTotalServico: metaServicoTotalHoras,
        metasPorCategoria: metasHorasPorCat,
        metaPadraoQtdFormacoes: metaPadraoGeralQtd,
        metaTotalQtdFormacoesServico: metaServicoTotalQtd,
        metasQtdPorCategoria: metasQtdPorCat,
        metasPorAno: novasMetasAno
      };
      onSalvarConfiguracoes(novasCfg);

      setMensagemSucesso(`Metas do ano ${anoMetasSelecionado} (${metaServicoTotalHoras}h e ${metaServicoTotalQtd} ações) aplicadas à equipa.`);
      setTimeout(() => setMensagemSucesso(''), 3500);
    }
    else if (dadosParaVerificar.tipo === 'alterar_password' && dadosParaVerificar.novaPasswordAlvo) {
      const passNova = dadosParaVerificar.novaPasswordAlvo;
      setPasswordAtual(passNova);
      setNovaPasswordInput('');
      setConfirmarPasswordInput('');

      const novasCfg: ConfiguracoesApp = {
        ...configuracoes,
        passwordAcesso: passNova,
        exigirPassword: exigirPass
      };
      onSalvarConfiguracoes(novasCfg);

      setMensagemSucesso('Palavra-passe do sistema alterada com sucesso.');
      setTimeout(() => setMensagemSucesso(''), 3500);
    }

    setJanelaVerificacaoAberta(false);
    setDadosParaVerificar(null);
  };

  const subtiposLista = Object.keys(MATRIZ_BUROCRACIA) as SubtipoBurocracia[];
  const requisitosAtuais = (matrizCustomizada && matrizCustomizada[subtipoInspecao]) || MATRIZ_BUROCRACIA[subtipoInspecao] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header do Menu de Configurações */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-teal-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Menu de Configurações do Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Gestão de Metas (Horas e Ações), Colaboradores, Matriz Regulamentar, Notificações e Acesso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas das Configurações na Ordem Solicitada:
            1. Metas
            2. Lista dos Colaboradores
            3. Matriz Regulamentar de Documentação Exigida
            4. Notificações & Alertas (+30 Dias)
            5. Palavra-passe & Acesso
        */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 gap-6 text-xs font-semibold overflow-x-auto">
          
          {/* Tab 1: Metas */}
          <button
            onClick={() => setActiveTab('metas')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'metas' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>1. Metas (Horas & Formações)</span>
            {activeTab === 'metas' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>

          {/* Tab 2: Lista de Colaboradores */}
          <button
            onClick={() => setActiveTab('colaboradores')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'colaboradores' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Lista de Colaboradores ({listaColabs.length})</span>
            {activeTab === 'colaboradores' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>

          {/* Tab 3: Matriz Regulamentar de Documentação Exigida */}
          <button
            onClick={() => setActiveTab('matriz')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matriz' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>3. Matriz Regulamentar</span>
            {activeTab === 'matriz' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>

          {/* Tab 4: Códigos Formações ReCap */}
          <button
            onClick={() => setActiveTab('recap')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'recap' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>4. Códigos Formações ReCap ({listaRecapCodigos.length})</span>
            {activeTab === 'recap' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>

          {/* Tab 5: Notificações & Alertas */}
          <button
            onClick={() => setActiveTab('notificacoes')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notificacoes' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>5. Notificações & Alertas</span>
            {pendentesAlerta.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendentesAlerta.length}
              </span>
            )}
            {activeTab === 'notificacoes' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>

          {/* Tab 6: Palavra-passe & Acesso */}
          <button
            onClick={() => setActiveTab('seguranca')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'seguranca' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>6. Palavra-passe & Acesso</span>
            {activeTab === 'seguranca' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>

          {/* Tab 7: Nuvem & Backup Seguro E2EE (Requisito 3) */}
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 transition-colors cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup' ? 'text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-teal-600" />
            <span>7. Nuvem & Backup E2EE</span>
            {activeTab === 'backup' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>
        </div>

        {mensagemSucesso && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {/* Conteúdo da Aba Ativa */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          
          {/* ============================================================== */}
          {/* TAB 1: METAS (HORAS & NÚMERO DE FORMAÇÕES PARA SERVIÇO E COLAB) */}
          {/* ============================================================== */}
          {activeTab === 'metas' && (
            <div className="space-y-6 text-xs">
              
              {/* Barra de Gestão de Metas por Ano (Requisito 10) */}
              <div className="bg-teal-50/80 p-3.5 rounded-lg border border-teal-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-800 shrink-0" />
                  <div>
                    <span className="font-bold text-teal-950 text-xs block">
                      Gestão de Metas Anuais do Serviço (Ano {anoMetasSelecionado})
                    </span>
                    <span className="text-[11px] text-teal-900/80">
                      Grave metas específicas do próprio ano ou copie metas do ano anterior
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-teal-300">
                    <span className="text-[11px] font-semibold text-slate-600">Ano das Metas:</span>
                    <select
                      value={anoMetasSelecionado}
                      onChange={(e) => setAnoMetasSelecionado(parseInt(e.target.value, 10))}
                      className="text-xs font-bold font-mono text-teal-900 bg-transparent border-0 focus:outline-hidden cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(y => (
                        <option key={y} value={y}>Ano {y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Botão: Manter Metas do Ano Anterior (Requisito 10) */}
                  <button
                    type="button"
                    onClick={() => {
                      const anoAnterior = anoMetasSelecionado - 1;
                      const metaAnt = configuracoes.metasPorAno?.[anoAnterior];
                      if (metaAnt) {
                        setMetaServicoTotalHoras(metaAnt.metaTotalServico);
                        setMetaPadraoGeralHoras(metaAnt.metaHorasPorColaborador);
                        if (metaAnt.metaQtdFormacoesServico !== undefined) setMetaServicoTotalQtd(metaAnt.metaQtdFormacoesServico);
                        if (metaAnt.metaQtdFormacoesPorColaborador !== undefined) setMetaPadraoGeralQtd(metaAnt.metaQtdFormacoesPorColaborador);
                        if (metaAnt.metasPorCategoria) setMetasHorasPorCat(metaAnt.metasPorCategoria);
                        if (metaAnt.metasQtdPorCategoria) setMetasQtdPorCat(metaAnt.metasQtdPorCategoria);
                        setMensagemSucesso(`Metas do ano anterior (${anoAnterior}) copiadas para o ano ${anoMetasSelecionado}. Clique em Atualizar Metas para confirmar.`);
                      } else {
                        setMensagemSucesso(`Metas de referência do ciclo anterior aplicadas ao ano ${anoMetasSelecionado}.`);
                      }
                      setTimeout(() => setMensagemSucesso(''), 3500);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 rounded-md font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    title={`Copiar e manter as metas do ano anterior (${anoMetasSelecionado - 1})`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
                    <span>Manter Metas do Ano Anterior ({anoMetasSelecionado - 1})</span>
                  </button>

                  {/* Botão: Criar Novas Metas (Requisito 10) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMetaPadraoGeralHoras(35);
                      setMetaServicoTotalHoras(listaColabs.length * 35);
                      setMetaPadraoGeralQtd(3);
                      setMetaServicoTotalQtd(35);
                      setMensagemSucesso(`Novas metas padrão inicializadas para o ano ${anoMetasSelecionado}.`);
                      setTimeout(() => setMensagemSucesso(''), 3500);
                    }}
                    className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md font-semibold text-xs inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                    title={`Definir novas metas para o ano ${anoMetasSelecionado}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Novas Metas ({anoMetasSelecionado})</span>
                  </button>
                </div>
              </div>

              {/* Secção A: Metas em Horas de Formação */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Metas em Horas de Formação (Exercício {configuracoes.nomeServico})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Exigência SNS / Formação Contínua</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-md border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">
                        Meta Global do Serviço (Horas Totais):
                      </label>
                      {metaServicoTotalHoras === 0 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Desativada (0)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={5000}
                        value={metaServicoTotalHoras}
                        onChange={(e) => setMetaServicoTotalHoras(parseInt(e.target.value, 10) || 0)}
                        className="w-32 p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-teal-800"
                      />
                      <span className="text-slate-500 font-mono">horas / ano</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      (0 = desativada | Ex: {colaboradores.length} colaboradores × 35h = {colaboradores.length * 35}h)
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">
                        Meta Padrão por Colaborador (Horas):
                      </label>
                      {metaPadraoGeralHoras === 0 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Desativada (0)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={metaPadraoGeralHoras}
                        onChange={(e) => setMetaPadraoGeralHoras(parseInt(e.target.value, 10) || 0)}
                        className="w-32 p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-teal-800"
                      />
                      <span className="text-slate-500 font-mono">horas / colaborador</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      0 = desativa esta opção | Norma institucional: 35 horas anuais.
                    </p>
                  </div>
                </div>

                {/* Metas em Horas por Categoria */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">
                    Metas de Horas Específicas por Categoria Profissional:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(['TSDT', 'FIS', 'ENF', 'MR', 'AT', 'TAS'] as DestinatarioGrupo[]).map((cat) => (
                      <div key={cat} className="p-2.5 bg-white rounded-md border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 block font-semibold">{cat}</strong>
                          <span className="text-[10px] text-slate-500">
                            {cat === 'TSDT' ? 'Radioterapia' : cat === 'FIS' ? 'Física Médica' : cat === 'ENF' ? 'Enfermagem' : cat === 'MR' ? 'Médicos Rad.' : cat === 'AT' ? 'Secretariado' : 'Técnicos Aux. Saúde'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {metasHorasPorCat[cat] === 0 && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                              Desativada
                            </span>
                          )}
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={metasHorasPorCat[cat] ?? 0}
                            onChange={(e) => setMetasHorasPorCat({ ...metasHorasPorCat, [cat]: parseInt(e.target.value, 10) || 0 })}
                            className="w-16 p-1 bg-slate-50 border border-slate-300 rounded text-right font-mono font-bold text-teal-800"
                          />
                          <span className="text-slate-500 font-mono text-[11px]">h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secção B: Metas para o Número de Formações (Pedido 4) */}
              <div className="bg-teal-50/50 p-4 rounded-lg border border-teal-200 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-teal-950">
                      Definição de Metas para o Número de Formações (Ações Formativas)
                    </h3>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">Controlo de Participação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-md border border-teal-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">
                        Meta Global do Serviço (Número de Ações Anuais):
                      </label>
                      {metaServicoTotalQtd === 0 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Desativada (0)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={metaServicoTotalQtd}
                        onChange={(e) => setMetaServicoTotalQtd(parseInt(e.target.value, 10) || 0)}
                        className="w-32 p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-teal-800"
                      />
                      <span className="text-slate-500 font-mono">ações / ano</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      0 = desativa esta opção | Objetivo de ações participadas pelo serviço.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-teal-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">
                        Meta Padrão por Colaborador (Número de Ações):
                      </label>
                      {metaPadraoGeralQtd === 0 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Desativada (0)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={metaPadraoGeralQtd}
                        onChange={(e) => setMetaPadraoGeralQtd(parseInt(e.target.value, 10) || 0)}
                        className="w-32 p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-teal-800"
                      />
                      <span className="text-slate-500 font-mono">ações / colaborador</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      0 = desativa esta opção | Média de participações por profissional.
                    </p>
                  </div>
                </div>

                {/* Metas em Quantidade por Categoria */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">
                    Meta de Ações de Formação por Categoria Profissional:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(['TSDT', 'FIS', 'ENF', 'MR', 'AT', 'TAS'] as DestinatarioGrupo[]).map((cat) => (
                      <div key={cat} className="p-2.5 bg-white rounded-md border border-teal-200 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 block font-semibold">{cat}</strong>
                          <span className="text-[10px] text-slate-500">Ações recomendadas</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {metasQtdPorCat[cat] === 0 && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                              Desativada
                            </span>
                          )}
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={metasQtdPorCat[cat] ?? 0}
                            onChange={(e) => setMetasQtdPorCat({ ...metasQtdPorCat, [cat]: parseInt(e.target.value, 10) || 0 })}
                            className="w-16 p-1 bg-slate-50 border border-slate-300 rounded text-right font-mono font-bold text-teal-800"
                          />
                          <span className="text-slate-500 font-mono text-[11px]">ações</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão de Gravar Metas com Janela de Verificação */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleIniciarSalvarMetas}
                  className="px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Gravar Metas do Ano {anoMetasSelecionado} & Aplicar à Equipa (com Verificação)</span>
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: LISTA DE COLABORADORES                                  */}
          {/* ============================================================== */}
          {activeTab === 'colaboradores' && (
            <div className="space-y-4">
              
              {/* Barra de Filtro e Adição */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, sigla, nº mecanográfico ou email..."
                      value={buscaColab}
                      onChange={(e) => setBuscaColab(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value)}
                    className="text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="todos">Todos os Grupos</option>
                    <option value="TSDT">TSDT (Dosimetria e Unidade)</option>
                    <option value="ENF">Enfermagem (ENF)</option>
                    <option value="MR">Médicos (MR)</option>
                    <option value="FIS">Física Médica (FIS)</option>
                    <option value="AT">Assistentes Técnicos (AT)</option>
                    <option value="TAS">Técnicos Auxiliares de Saúde (TAS)</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setColaboradorEditando({
                      id: `col-${Date.now()}`,
                      nome: '',
                      sigla: '',
                      numMecanografico: '',
                      categoriaProfissional: 'TSDT',
                      cargo: 'Técnico(a) de Radioterapia',
                      email: '',
                      estadoProfissional: 'Activo',
                      ativo: true,
                      observacoes: '',
                      metaHorasAnual: 35,
                      metaQtdFormacoesAnual: 3
                    });
                    setIsNovoColaborador(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Colaborador</span>
                </button>
              </div>

              {/* Tabela de Colaboradores (Exatamente com os campos da Imagem 1) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-100/70 border-b border-amber-200 text-slate-900 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Nome colaborador</th>
                        <th className="py-2.5 px-2 text-center w-16">Sigla</th>
                        <th className="py-2.5 px-2 text-center w-24">Nº Mecanográfico</th>
                        <th className="py-2.5 px-2.5 w-20">Categoria</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Email Profissional</th>
                        <th className="py-2.5 px-2.5 text-center w-24">Estado</th>
                        <th className="py-2.5 px-2 text-right w-16">Meta (h)</th>
                        <th className="py-2.5 px-2 text-right w-16">Meta (Qtd)</th>
                        <th className="py-2.5 px-2 text-center w-20">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {colabsFiltrados.map((c) => {
                        const isBaixa = c.estadoProfissional === 'Ausente: Baixa';
                        const isInativo = c.estadoProfissional === 'Inativo';

                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {c.nome}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800">
                              {c.sigla}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-700 tabular-nums">
                              {c.numMecanografico || '-'}
                            </td>
                            <td className="py-2.5 px-2.5 text-slate-700">
                              <span className="font-semibold">{c.categoriaProfissional}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              {c.email}
                            </td>
                            <td className="py-2.5 px-2.5 text-center">
                              {isBaixa ? (
                                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                  Baixa
                                </span>
                              ) : isInativo ? (
                                <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                                  Inativo
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                  Ativo
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">
                              {c.metaHorasAnual || 35}h
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-semibold text-teal-700">
                              {c.metaQtdFormacoesAnual || 3}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => {
                                  setColaboradorEditando({ ...c });
                                  setIsNovoColaborador(false);
                                }}
                                className="p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded cursor-pointer"
                                title="Editar dados do colaborador"
                              >
                                <Edit3 className="w-4 h-4" />
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
          {/* TAB 3: MATRIZ REGULAMENTAR DE DOCUMENTAÇÃO EXIGIDA (2ª IMAGEM) */}
          {/* ============================================================== */}
          {activeTab === 'matriz' && (
            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck2 className="w-4 h-4 text-amber-800" />
                  <h3 className="font-bold text-amber-950 text-sm">
                    Matriz Regulamentar de Documentação Exigida por Subtipo de Formação
                  </h3>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Normativo hospitalar oficial segundo a auditoria de qualidade. Determina quais os modelos documentais obrigatórios (<em>Sim</em>), opcionais (<em>Opcional</em>) ou não aplicáveis (<em>N.A.</em>) para validação burocrática.
                </p>
              </div>

              {/* Seletor de Subtipo para verificação rápida */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <span className="font-semibold text-slate-700">Subtipo em Consulta:</span>
                {subtiposLista.map(subtipo => (
                  <button
                    key={subtipo}
                    onClick={() => setSubtipoInspecao(subtipo)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      subtipoInspecao === subtipo
                        ? 'bg-teal-700 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {subtipo}
                  </button>
                ))}
              </div>

              {/* Tabela dos 13 Requisitos Documentais para o Subtipo */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                  <span>Requisitos Documentais para: <strong className="text-teal-800 font-semibold">{subtipoInspecao}</strong></span>
                  <span className="text-[11px] font-normal text-slate-500">13 Modelos Regulamentares</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="py-2 px-3">Documento / Modelo</th>
                        <th className="py-2 px-3">Código Formal</th>
                        <th className="py-2 px-3 text-center">Exigência Regulamentar</th>
                        <th className="py-2 px-3">Finalidade / Observações</th>
                        <th className="py-2 px-3 text-center w-24">Editar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { nome: 'Reserva de Sala', cod: 'RS', key: 'reservaSala', obs: 'Agendamento prévio com serviços gerais' },
                        { nome: 'Email Confirmação da Sala', cod: 'ECS', key: 'emailConfirmacaoSala', obs: 'Comprovativo de alocação de espaço' },
                        { nome: 'Proposta PAF', cod: 'PAF', key: 'propostaPAF', obs: 'Plano Anual de Formação com parecer favorável' },
                        { nome: 'Ficha de Formador', cod: 'FF', key: 'fichaFormadorFF', obs: 'Obrigatório se formador externo à ULSAR' },
                        { nome: 'Ficha de Inscrição', cod: 'FI', key: 'fichaInscricaoFI', obs: 'Submissão formal dos participantes' },
                        { nome: 'Lista Nominativa', cod: 'LN', key: 'listaNominativaLN', obs: 'Relação de colaboradores autorizados' },
                        { nome: 'Sumário da Ação', cod: 'S', key: 'sumarioS', obs: 'Registo dos conteúdos lecionados' },
                        { nome: 'Registo de Presenças', cod: 'RPF', key: 'registoPresencaRPF', obs: 'Folha de assinaturas / registo digital' },
                        { nome: 'Avaliação do Formador', cod: 'A1', key: 'avaliacaoFormadorA1', obs: 'Inquérito preenchido pelos formandos' },
                        { nome: 'Avaliação do Formando', cod: 'AF1', key: 'avaliacaoFormandoAF1', obs: 'Grelha de aproveitamento ou teste' },
                        { nome: 'Certificados de Participação', cod: 'CR', key: 'certificadosCR', obs: 'Certificados emitidos pela entidade formadora' },
                        { nome: 'Email de Avaliação (6 Meses)', cod: 'E-6M', key: 'emailAvaliacao6Meses', obs: 'Email enviado pelo Outlook aos colaboradores' },
                        { nome: 'Avaliação da Eficácia (Modelo A6)', cod: 'A6', key: 'avaliacaoEficaciaA6', obs: 'Aferição do impacto clínico e na prática diária' },
                      ].map(item => {
                        const status = (requisitosAtuais as unknown as Record<string, string>)[item.key] || 'n.a.';
                        const isSim = status === 'sim';
                        const isOpcional = status === 'opcional';

                        return (
                          <tr key={item.key} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-900">{item.nome}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-teal-800">{item.cod}</td>
                            <td className="py-2 px-3 text-center">
                              {isSim ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  SIM (Obrigatório)
                                </span>
                              ) : isOpcional ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  Opcional
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] text-slate-400 bg-slate-100">
                                  N.A.
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">{item.obs}</td>
                            <td className="py-2 px-3 text-center">
                              {/* Requisito 6: Icon de lápis de edição na matriz regulamentar */}
                              <button
                                type="button"
                                onClick={() => handleIniciarEditarRequisitoMatriz(subtipoInspecao, item.key, item.nome, status as 'sim' | 'opcional' | 'n.a.')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors cursor-pointer"
                                title={`Editar exigência regulamentar de "${item.nome}" (Requisito 6)`}
                              >
                                <Pencil className="w-3.5 h-3.5 text-teal-600" />
                                <span>Editar</span>
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
          {/* TAB 4: CÓDIGOS DAS FORMAÇÕES RECAP (APÓS MATRIZ REGULAMENTAR)   */}
          {/* ============================================================== */}
          {activeTab === 'recap' && (
            <div className="space-y-5 text-xs">
              
              {/* Cartão Informativo sobre o Programa ReCAP */}
              <div className="bg-amber-50/80 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Bookmark className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-amber-950 text-sm">
                        Códigos Regulamentares das Formações ReCap
                      </h3>
                      <p className="text-amber-900/90 text-xs mt-1 leading-relaxed">
                        As ações do programa <strong>ReCAP</strong> (Reforço das Competências na Administração Pública / NAU - INA / SIADAP) possuem codificação própria específica. 
                        Na Tabela Geral de Formações, as ações ReCap são automaticamente separadas da cronologia regular, 
                        sendo <strong>organizadas alfabeticamente e colocadas no final</strong> de todas as formações realizadas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditarRecap()}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Adicionar um novo código de formação ReCap às configurações"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Código ReCap</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestaurarPadroesRecap}
                      className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Restaurar a lista oficial pré-definida de códigos ReCap"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Restaurar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Pesquisa e Filtros de Domínio */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Pesquisar código, nome da formação ou domínio ReCap..."
                      value={buscaRecap}
                      onChange={(e) => setBuscaRecap(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={filtroDominioRecap}
                    onChange={(e) => setFiltroDominioRecap(e.target.value)}
                    className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-700"
                  >
                    <option value="todos">Todos os Domínios de Competência</option>
                    <option value="Orientação para os Resultados">Orientação para os Resultados</option>
                    <option value="Mudança e Inovação (SIADAP)">Mudança e Inovação</option>
                    <option value="Orientação para o Serviço Público (SIADAP)">Serviço Público</option>
                    <option value="Trabalho em Equipa e Colaboração">Colaboração & Equipas</option>
                  </select>
                </div>

                <div className="text-slate-500 text-[11px] font-medium">
                  {listaRecapCodigos.length} códigos registados
                </div>
              </div>

              {/* Tabela de Códigos ReCap com Botão de Edição */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh] scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[170px]">Código da Formação ReCap</th>
                        <th className="py-2.5 px-3 min-w-[240px]">Nome Oficial da Ação ReCap</th>
                        <th className="py-2.5 px-2.5 min-w-[160px]">Domínio / Competência</th>
                        <th className="py-2.5 px-2.5 min-w-[150px]">Grau / Destinatários</th>
                        <th className="py-2.5 px-2 text-center w-20">Horas</th>
                        <th className="py-2.5 px-2.5 min-w-[130px]">Plataforma</th>
                        <th className="py-2.5 px-2 text-center w-24 sticky right-0 bg-slate-100 border-l border-slate-200">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {listaRecapCodigos
                        .filter(item => {
                          if (filtroDominioRecap !== 'todos' && item.dominioCompetencia !== filtroDominioRecap) {
                            return false;
                          }
                          if (buscaRecap.trim() !== '') {
                            const q = buscaRecap.toLowerCase();
                            const matchCod = item.codigo.toLowerCase().includes(q);
                            const matchNome = item.nome.toLowerCase().includes(q);
                            const matchDom = item.dominioCompetencia.toLowerCase().includes(q);
                            const matchDesc = (item.descricao || '').toLowerCase().includes(q);
                            return matchCod || matchNome || matchDom || matchDesc;
                          }
                          return true;
                        })
                        .map(item => (
                          <tr key={item.id} className="hover:bg-amber-50/40 transition-colors group">
                            {/* Código ReCap */}
                            <td className="py-2.5 px-3 font-mono font-bold text-teal-900 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 inline-block">
                                {item.codigo}
                              </span>
                            </td>

                            {/* Nome da Ação */}
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-900 block">
                                {item.nome}
                              </span>
                              {item.descricao && (
                                <span className="text-[11px] text-slate-500 block line-clamp-1 mt-0.5">
                                  {item.descricao}
                                </span>
                              )}
                            </td>

                            {/* Domínio */}
                            <td className="py-2.5 px-2.5">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                                {item.dominioCompetencia}
                              </span>
                            </td>

                            {/* Grau / Carreira */}
                            <td className="py-2.5 px-2.5 text-[11px] text-slate-600">
                              {item.grauCarreira || '-'}
                            </td>

                            {/* Carga Horária */}
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                              {item.horasPadrao} h
                            </td>

                            {/* Plataforma */}
                            <td className="py-2.5 px-2.5 text-[11px] text-slate-600">
                              <a 
                                href="https://ep.nau.edu.pt/" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
                              >
                                <span>{item.plataforma}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </td>

                            {/* Botões de Ação para Editar Informação */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-amber-50/90 border-l border-slate-200">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirEditarRecap(item)}
                                  className="p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                                  title={`Editar informação do código ${item.codigo}`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminarRecapItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Remover este código ReCap"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal / Formulário de Edição de Código ReCap */}
              {isModalRecapAberto && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
                  <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-teal-700" />
                        <h4 className="font-bold text-sm text-slate-900">
                          {isNovoRecap ? 'Adicionar Novo Código ReCap' : `Editar Código: ${recapEditando?.codigo}`}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsModalRecapAberto(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSalvarRecapItem} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Código de Formação ReCap <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formRecapCodigo}
                          onChange={(e) => setFormRecapCodigo(e.target.value)}
                          placeholder="Ex: ReCAP-Resultados-Qualid-1"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Formato habitual: ReCAP-[Dominio]-[Nivel] ou ReCAP-SIADAP-[Competencia]-[Grau]
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nome Oficial da Formação ReCap <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formRecapNome}
                          onChange={(e) => setFormRecapNome(e.target.value)}
                          placeholder="Ex: ReCAP: Orientação para os Resultados - QUALIDADE 1"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Domínio de Competência
                          </label>
                          <input
                            type="text"
                            value={formRecapDominio}
                            onChange={(e) => setFormRecapDominio(e.target.value)}
                            placeholder="Ex: Orientação para os Resultados"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Carga Horária Padrão (Horas)
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            required
                            value={formRecapHoras}
                            onChange={(e) => setFormRecapHoras(parseFloat(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Grau / Destinatários
                          </label>
                          <input
                            type="text"
                            value={formRecapGrau}
                            onChange={(e) => setFormRecapGrau(e.target.value)}
                            placeholder="Ex: Carreiras Grau 3 / TSDT"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Plataforma de Origem
                          </label>
                          <input
                            type="text"
                            value={formRecapPlataforma}
                            onChange={(e) => setFormRecapPlataforma(e.target.value)}
                            placeholder="Ex: NAU (ep.nau.edu.pt)"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Descrição / Objetivos do Módulo
                        </label>
                        <textarea
                          rows={2}
                          value={formRecapDescricao}
                          onChange={(e) => setFormRecapDescricao(e.target.value)}
                          placeholder="Sumário dos objetivos de aprendizagem e competências a reforçar..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsModalRecapAberto(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar Informação</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: NOTIFICAÇÕES & ALERTAS (+30 DIAS DE BUROCRACIA PENDENTE) */}
          {/* ============================================================== */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6 text-xs">
              
              {/* Notificações Browser e Email */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Bell className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Canais de Notificação & Alertas Automáticos de Burocracia Pendente
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opção 1: Notificações do Browser */}
                  <div className="p-3 bg-white rounded-md border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-semibold flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-teal-700" />
                        Notificações no Navegador (Browser)
                      </strong>
                      <input
                        type="checkbox"
                        checked={notifBrowserAtivas}
                        onChange={(e) => setNotifBrowserAtivas(e.target.checked)}
                        className="text-teal-600 focus:ring-teal-500 rounded"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Receba avisos instantâneos no ambiente de trabalho sobre prazos de documentação expirados.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestarBrowserNotif}
                      className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded cursor-pointer transition-colors"
                    >
                      Pedir Permissão & Testar Notificação
                    </button>
                    {testeNotifStatus && (
                      <p className="text-[11px] text-teal-700 font-medium">{testeNotifStatus}</p>
                    )}
                  </div>

                  {/* Opção 2: Alertas por Email via Outlook */}
                  <div className="p-3 bg-white rounded-md border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-semibold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-700" />
                        Alertas por E-mail (via Outlook)
                      </strong>
                      <input
                        type="checkbox"
                        checked={notifEmailAtivas}
                        onChange={(e) => setNotifEmailAtivas(e.target.checked)}
                        className="text-teal-600 focus:ring-teal-500 rounded"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Gera emails formais com listas de pendências formatadas para envio através do Outlook.
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        E-mail(s) dos Destinatários (separados por ponto e vírgula):
                      </label>
                      <input
                        type="text"
                        value={emailNotifBurocracia}
                        onChange={(e) => setEmailNotifBurocracia(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Limite de Dias */}
                <div className="p-3 bg-white rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="text-slate-900 font-semibold block">
                      Prazo Limite para Alerta de Burocracia Pendente
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Formações cuja realização ocorreu há mais de X dias sem burocracia validada
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={diasAlertaBurocracia}
                      onChange={(e) => setDiasAlertaBurocracia(parseInt(e.target.value, 10) || 30)}
                      className="w-20 p-1.5 bg-slate-50 border border-slate-300 rounded text-right font-mono font-bold text-teal-800"
                    />
                    <span className="text-slate-600 font-medium">dias (Padrão: 30 dias)</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSalvarConfigNotificacoes}
                    className="px-4 py-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Gravar Configurações de Notificação e Backup</span>
                  </button>
                </div>
              </div>

              {/* Requisito 12: Funcionalidade de Backup Automático e Frequência */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Backup Automático da Aplicação para Computador Local (JSON)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Requisito de Segurança & Arquivo</span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  Defina a frequência com que a aplicação descarrega automaticamente um ficheiro JSON consolidado com todos os dados da aplicação (formações, histórico de ciclos, colaboradores, certificações e metas) para o computador local.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Frequência */}
                  <div className="p-3 bg-white rounded-md border border-slate-200 space-y-2">
                    <label className="block font-semibold text-slate-800">
                      Frequência de Backup Automático:
                    </label>
                    <select
                      value={frequenciaBackupState}
                      onChange={(e) => setFrequenciaBackupState(e.target.value as 'diario' | 'semanal' | 'mensal' | 'desativado')}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800 text-xs"
                    >
                      <option value="semanal">Semanal (Recomendado - 1x por semana)</option>
                      <option value="diario">Diário (todos os dias)</option>
                      <option value="mensal">Mensal (no final de cada mês)</option>
                      <option value="desativado">Desativado (apenas downloads manuais)</option>
                    </select>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <span>Último backup registado:</span>
                      <strong className="font-mono text-slate-700">{ultimoBackupDataState}</strong>
                    </div>
                  </div>

                  {/* Ação Imediata & Ativação */}
                  <div className="p-3 bg-white rounded-md border border-slate-200 flex flex-col justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="chkBackupAuto"
                        checked={backupAutoAtivo}
                        onChange={(e) => setBackupAutoAtivo(e.target.checked)}
                        className="text-teal-600 focus:ring-teal-500 rounded"
                      />
                      <label htmlFor="chkBackupAuto" className="font-semibold text-slate-800 cursor-pointer">
                        Ativar descarregamento automático de backup JSON
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        generateFullBackupDownload({
                          formacoes,
                          colaboradores: listaColabs,
                          anoAtual
                        });
                        const hoje = new Date().toISOString().slice(0, 10);
                        setUltimoBackupDataState(hoje);
                        onSalvarConfiguracoes({
                          ...configuracoes,
                          ultimoBackupData: hoje
                        });
                        setMensagemSucesso('Ficheiro de backup JSON gerado e descarregado com sucesso para o computador local.');
                        setTimeout(() => setMensagemSucesso(''), 3500);
                      }}
                      className="w-full px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-md font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-700" />
                      <span>Descarregar Backup Imediato Agora (.JSON)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Monitor em Tempo Real: Formações com Burocracia Pendente (+30 Dias) */}
              <div className="bg-rose-50/60 p-4 rounded-lg border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <h3 className="text-sm font-bold text-rose-950">
                      Monitor de Formações com Burocracia Pendente (+{diasAlertaBurocracia} Dias)
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                    {pendentesAlerta.length} ações em atraso
                  </span>
                </div>

                {pendentesAlerta.length > 0 ? (
                  <>
                    <div className="max-h-60 overflow-y-auto border border-rose-200 rounded-md bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-rose-100/70 border-b border-rose-200 text-slate-800 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Formação / Código</th>
                            <th className="py-2 px-2">Data Realização</th>
                            <th className="py-2 px-2 text-center">Dias Decorridos</th>
                            <th className="py-2 px-3">Documentos em Falta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {pendentesAlerta.map((p) => (
                            <tr key={p.formacao.id} className="hover:bg-rose-50/50">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {p.formacao.nome} <span className="font-mono text-teal-800 font-normal">({p.formacao.codigo})</span>
                              </td>
                              <td className="py-2 px-2 font-mono text-slate-700">{p.dataRealizacao}</td>
                              <td className="py-2 px-2 text-center font-bold text-rose-700 font-mono">
                                +{p.diasAtraso} dias
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {p.documentosEmFalta.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-slate-500">
                        Pode enviar de imediato um alerta formal consolidado para os endereços configurados.
                      </span>
                      <button
                        type="button"
                        onClick={handleDispararEmailOutlook}
                        className="px-3.5 py-1.5 font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Disparar Alerta Consolidado no Outlook ({pendentesAlerta.length})</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white p-4 rounded text-center border border-emerald-200 text-emerald-800">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="font-semibold text-xs">Conformidade Plena!</p>
                    <p className="text-[11px] text-slate-500">
                      Não existem ações formativas realizadas há mais de {diasAlertaBurocracia} dias com burocracia pendente.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PALAVRA-PASSE & ACESSO (POR ÚLTIMO, COM JANELA DE CONFIRMAÇÃO) */}
          {/* ============================================================== */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6 max-w-xl text-xs">
              
              {/* Palavra-passe Atual */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-700" />
                  <span>Palavra-passe de Acesso Atual</span>
                </h3>
                
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Palavra-passe em Vigor:
                  </label>
                  <div className="relative max-w-sm">
                    <input
                      type={mostrarPasswordAtual ? 'text' : 'password'}
                      readOnly
                      value={passwordAtual}
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPasswordAtual(!mostrarPasswordAtual)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={mostrarPasswordAtual ? 'Ocultar palavra-passe' : 'Visualizar palavra-passe'}
                    >
                      {mostrarPasswordAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="checkbox"
                    id="chkExigirPass"
                    checked={exigirPass}
                    onChange={(e) => {
                      const novo = e.target.checked;
                      setExigirPass(novo);
                      onSalvarConfiguracoes({ ...configuracoes, exigirPassword: novo });
                      setMensagemSucesso(novo ? 'Exigência de palavra-passe ativada na entrada.' : 'Exigência de palavra-passe desativada.');
                      setTimeout(() => setMensagemSucesso(''), 3000);
                    }}
                    className="text-teal-600 focus:ring-teal-500 rounded"
                  />
                  <label htmlFor="chkExigirPass" className="font-medium text-slate-700 cursor-pointer">
                    Exigir palavra-passe ao aceder à aplicação
                  </label>
                </div>
              </div>

              {/* Formulário para Alterar Palavra-passe com Janela de Confirmação */}
              <form onSubmit={handleIniciarMudarPassword} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-teal-700" />
                    <span>Alterar Palavra-passe de Entrada</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Defina uma nova palavra-passe segura. Uma janela de confirmação será exibida antes de gravar.
                  </p>
                </div>

                {mensagemErro && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{mensagemErro}</span>
                  </div>
                )}

                <div className="space-y-3 max-w-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nova Palavra-passe:
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarNovaPassword ? 'text' : 'password'}
                        required
                        value={novaPasswordInput}
                        onChange={(e) => setNovaPasswordInput(e.target.value)}
                        placeholder="Introduza a nova palavra-passe..."
                        className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarNovaPassword(!mostrarNovaPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={mostrarNovaPassword ? 'Ocultar' : 'Visualizar'}
                      >
                        {mostrarNovaPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Confirmar Nova Palavra-passe:
                    </label>
                    <input
                      type={mostrarNovaPassword ? 'text' : 'password'}
                      required
                      value={confirmarPasswordInput}
                      onChange={(e) => setConfirmarPasswordInput(e.target.value)}
                      placeholder="Repita a nova palavra-passe..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Alterar Palavra-passe (com Janela de Confirmação)</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: NUVEM, BACKUP SEGURO & SINCRONIZAÇÃO E2EE (Requisito 3) */}
          {/* ============================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-6 text-xs">
              
              {/* Banner de Estado da Nuvem e Criptografia */}
              <div className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-xl shadow-md border border-teal-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-teal-500/20 border border-teal-400/30 rounded-lg">
                      <Cloud className="w-6 h-6 text-teal-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          Sistema de Backup Automático na Nuvem & Criptografia E2EE
                        </h3>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Nuvem Ativa
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-200/90 mt-0.5">
                        Criptografia de Ponta a Ponta AES-GCM 256-bit com sincronização em tempo real entre múltiplos dispositivos hospitalares.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSincronizandoNuvem}
                    onClick={async () => {
                      setIsSincronizandoNuvem(true);
                      try {
                        await syncDataToCloudVault({
                          formacoes,
                          colaboradores: listaColabs,
                          anoAtual,
                          configuracoes
                        });
                        const agoraTexto = 'Hoje às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        setUltimoCloudSyncData(agoraTexto);
                        onSalvarConfiguracoes({
                          ...configuracoes,
                          ultimoCloudSyncData: agoraTexto
                        });
                        setMensagemSucesso('Dados do Serviço de Radioterapia sincronizados com sucesso na Nuvem com criptografia E2EE AES-GCM 256-bit!');
                        setTimeout(() => setMensagemSucesso(''), 4000);
                      } catch (err: any) {
                        alert('Erro ao sincronizar: ' + (err.message || 'Falha de comunicação com o cofre de nuvem.'));
                      } finally {
                        setIsSincronizandoNuvem(false);
                      }
                    }}
                    className="self-start sm:self-auto px-4 py-2 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSincronizandoNuvem ? 'animate-spin' : ''}`} />
                    <span>{isSincronizandoNuvem ? 'A Sincronizar...' : 'Sincronizar Nuvem Agora'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-teal-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-teal-300/70 block text-[10px] uppercase font-sans">Criptografia:</span>
                    <strong className="text-teal-100">AES-GCM 256-bit</strong>
                  </div>
                  <div>
                    <span className="text-teal-300/70 block text-[10px] uppercase font-sans">Derivação de Chave:</span>
                    <strong className="text-teal-100">PBKDF2 SHA-256</strong>
                  </div>
                  <div>
                    <span className="text-teal-300/70 block text-[10px] uppercase font-sans">Última Sincronização:</span>
                    <strong className="text-teal-100">{ultimoCloudSyncData}</strong>
                  </div>
                  <div>
                    <span className="text-teal-300/70 block text-[10px] uppercase font-sans">Modo Offline:</span>
                    <strong className="text-emerald-300 font-bold">100% Operacional</strong>
                  </div>
                </div>
              </div>

              {/* Bloco 1: Configuração do Serviço de Nuvem e Frequência de Sincronização */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Serviço de Armazenamento em Nuvem & Frequência Automática
                    </h3>
                  </div>
                  <span className="text-[11px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full font-semibold">
                    Integração Nativa
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seletor de Serviço de Nuvem */}
                  <div className="p-3 bg-white rounded-md border border-slate-200 space-y-2">
                    <label className="block font-semibold text-slate-800">
                      Serviço de Nuvem Conectado:
                    </label>
                    <select
                      value={cloudSyncServico}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setCloudSyncServico(val);
                        onSalvarConfiguracoes({ ...configuracoes, cloudSyncServico: val });
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800 text-xs"
                    >
                      <option value="RadForm Cloud Vault">RadForm Cloud Vault (Nuvem Segura Hospitalar E2EE)</option>
                      <option value="Microsoft OneDrive / SharePoint">Microsoft OneDrive / SharePoint ULSAR (Rede SNS)</option>
                      <option value="Google Drive">Google Drive Empresarial (Backup em Nuvem)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Todos os dados são encriptados localmente no browser antes de serem transferidos ou guardados.
                    </p>
                  </div>

                  {/* Frequência de Backup Automático */}
                  <div className="p-3 bg-white rounded-md border border-slate-200 space-y-2">
                    <label className="block font-semibold text-slate-800">
                      Frequência de Backup Automático na Nuvem:
                    </label>
                    <select
                      value={cloudSyncFrequencia}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setCloudSyncFrequencia(val);
                        onSalvarConfiguracoes({ ...configuracoes, cloudSyncFrequencia: val });
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800 text-xs"
                    >
                      <option value="tempo_real">Em Tempo Real (Sincronização Imediata a cada alteração)</option>
                      <option value="horario">Horário (a cada 60 minutos)</option>
                      <option value="diario">Diário (no fim do turno de trabalho)</option>
                      <option value="semanal">Semanal (todas as segundas-feiras)</option>
                    </select>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="chkCloudSyncAtivo"
                        checked={cloudSyncAtivo}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setCloudSyncAtivo(val);
                          onSalvarConfiguracoes({ ...configuracoes, cloudSyncAtivo: val });
                        }}
                        className="text-teal-600 focus:ring-teal-500 rounded"
                      />
                      <label htmlFor="chkCloudSyncAtivo" className="text-[11px] font-semibold text-slate-700 cursor-pointer">
                        Ativar sincronização automática em segundo plano
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Gestão da Chave Mestra E2EE & Segurança Avançada */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Chave Mestra de Criptografia de Ponta a Ponta (E2EE)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Protocolo Zero-Knowledge</span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  Apenas os dispositivos autorizados na posse desta Chave Secreta conseguem desencriptar os registos de formação e dados do serviço. Nem os servidores de nuvem nem terceiros têm acesso ao conteúdo dos ficheiros.
                </p>

                <div className="p-3 bg-white rounded-md border border-slate-200 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Chave Secreta de Encriptação E2EE (Passphrase):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={mostrarPassphrase ? 'text' : 'password'}
                          value={passphraseE2EE}
                          onChange={(e) => setPassphraseE2EE(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-xs text-slate-900 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPassphrase(!mostrarPassphrase)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={mostrarPassphrase ? 'Ocultar chave' : 'Visualizar chave'}
                        >
                          {mostrarPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const novaChave = 'RadForm-' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
                            .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase() + '#Sec';
                          setPassphraseE2EE(novaChave);
                          setMostrarPassphrase(true);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
                        title="Gerar chave aleatória forte criptográfica"
                      >
                        Gerar Chave Aleatória
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!passphraseE2EE.trim()) {
                            alert('A chave secreta de encriptação não pode estar vazia.');
                            return;
                          }
                          saveStoredE2EEPassphrase(passphraseE2EE);
                          onSalvarConfiguracoes({ ...configuracoes, e2eePassphrase: passphraseE2EE });
                          setMensagemSucesso('Chave Mestra E2EE gravada com sucesso! Todos os futuros backups na nuvem usarão esta chave.');
                          setTimeout(() => setMensagemSucesso(''), 3500);
                        }}
                        className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Gravar Chave
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Algoritmo: AES-256-GCM com Salt e IV aleatórios a cada sincronização
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const conteudoKit = `FICHA DE RECUPERAÇÃO DE EMERGÊNCIA - RADFORM ULSAR\n` +
                          `Data de Emissão: ${new Date().toISOString()}\n` +
                          `Serviço: Serviço de Radioterapia\n` +
                          `Chave Mestra E2EE: ${passphraseE2EE}\n\n` +
                          `Instruções de Contingência:\n` +
                          `1. Guarde este documento num cofre seguro físico ou pasta confidencial da chefia.\n` +
                          `2. Em caso de substituição de computador ou desastre informático, importe o ficheiro .radform.e2ee e introduza esta chave.\n`;
                        const blob = new Blob([conteudoKit], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Chave_Recuperacao_Emergencia_RadForm_E2EE_${new Date().toISOString().slice(0, 10)}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="text-teal-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Descarregar Ficha de Recuperação de Emergência (.TXT)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Sincronização em Tempo Real entre Múltiplos Dispositivos */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Sincronização em Tempo Real entre Múltiplos Dispositivos
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">BroadcastChannel Ativo</span>
                </div>

                {/* Nome deste Dispositivo */}
                <div className="p-3 bg-white rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 block">
                      Nome deste Posto de Trabalho:
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Identificador visível para as restantes consolas e tablets do serviço
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nomeDispositivoInput}
                      onChange={(e) => setNomeDispositivoInput(e.target.value)}
                      className="p-1.5 px-3 bg-slate-50 border border-slate-300 rounded-md font-semibold text-xs text-slate-800 min-w-[200px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceName(nomeDispositivoInput);
                        setMensagemSucesso('Nome do posto de trabalho atualizado.');
                        setTimeout(() => setMensagemSucesso(''), 2500);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-md cursor-pointer"
                    >
                      Gravar
                    </button>
                  </div>
                </div>

                {/* Lista de Dispositivos Conectados */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Dispositivos Hospitalares Conectados ao Serviço:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {dispositivosSinc.map(d => (
                      <div key={d.id} className="p-3 bg-white rounded-md border border-slate-200 flex items-start justify-between gap-2 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-slate-100 rounded-md mt-0.5 text-slate-700">
                            {d.tipo === 'tablet' ? <Smartphone className="w-4 h-4 text-teal-700" /> : <Laptop className="w-4 h-4 text-teal-700" />}
                          </div>
                          <div>
                            <strong className="text-slate-900 block font-semibold">{d.nome}</strong>
                            <span className="text-[11px] text-slate-500 block">{d.localizacao}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Última sync: {d.ultimoAcesso}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bloco 4: Operações de Backup e Restauro de Contingência */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Exportação e Restauro de Ficheiros de Backup Criptografados
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Contingência e Arquivo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Exportar Backup Criptografado E2EE */}
                  <div className="p-3.5 bg-white rounded-md border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <strong className="text-slate-900 block font-bold">1. Backup E2EE (.radform.e2ee)</strong>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Ficheiro blindado com AES-256 e SHA-256. Seguro para partilhar por email ou nuvem externa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await downloadEncryptedBackupFile({
                          formacoes,
                          colaboradores: listaColabs,
                          anoAtual,
                          configuracoes
                        });
                        setMensagemSucesso('Ficheiro de backup criptografado (.radform.e2ee) descarregado com sucesso!');
                        setTimeout(() => setMensagemSucesso(''), 3500);
                      }}
                      className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-md font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Descarregar Backup E2EE</span>
                    </button>
                  </div>

                  {/* Importar e Restaurar Backup Criptografado */}
                  <div className="p-3.5 bg-white rounded-md border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <strong className="text-slate-900 block font-bold">2. Restaurar Backup E2EE</strong>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Restaurar registos a partir de um ficheiro .radform.e2ee usando a Chave Mestra configurada.
                      </p>
                    </div>
                    <label className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                      <CloudUpload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Importar Ficheiro E2EE</span>
                      <input
                        type="file"
                        accept=".e2ee,.json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const dados = await importEncryptedBackupFile(file, passphraseE2EE);
                            if (dados && dados.formacoes) {
                              if (confirm(`Pretende restaurar ${dados.formacoes.length} formações e dados do serviço da cópia de segurança?`)) {
                                // Guarda no localStorage e recarrega
                                localStorage.setItem('radform_formacoes_v3', JSON.stringify(dados.formacoes));
                                if (dados.colaboradores) {
                                  localStorage.setItem('radform_colaboradores_v3', JSON.stringify(dados.colaboradores));
                                }
                                alert('Dados restaurados com sucesso a partir da cópia encriptada E2EE!');
                                window.location.reload();
                              }
                            } else {
                              alert('O ficheiro não contém dados de formação válidos.');
                            }
                          } catch (err: any) {
                            alert('Erro na desencriptação: ' + (err.message || 'Chave incorreta ou ficheiro inválido.'));
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Download Backup Tradicional JSON */}
                  <div className="p-3.5 bg-white rounded-md border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <strong className="text-slate-900 block font-bold">3. Backup JSON Simples</strong>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Ficheiro JSON aberto para auditorias e consulta em texto legível no computador local.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        generateFullBackupDownload({
                          formacoes,
                          colaboradores: listaColabs,
                          anoAtual
                        });
                        const hoje = new Date().toISOString().slice(0, 10);
                        setUltimoBackupDataState(hoje);
                        onSalvarConfiguracoes({
                          ...configuracoes,
                          ultimoBackupData: hoje
                        });
                        setMensagemSucesso('Backup local JSON gerado e descarregado.');
                        setTimeout(() => setMensagemSucesso(''), 3000);
                      }}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descarregar JSON Simples</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal de Edição de Colaborador */}
        {colaboradorEditando && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 border border-slate-200 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {isNovoColaborador ? 'Adicionar Novo Colaborador' : 'Editar Dados do Colaborador'}
                </h3>
                <button
                  onClick={() => setColaboradorEditando(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    required
                    value={colaboradorEditando.nome}
                    onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, nome: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sigla:</label>
                    <input
                      type="text"
                      required
                      value={colaboradorEditando.sigla}
                      onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, sigla: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md uppercase font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nº Mecanográfico:</label>
                    <input
                      type="text"
                      required
                      value={colaboradorEditando.numMecanografico}
                      onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, numMecanografico: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Categoria Profissional:</label>
                    <select
                      value={colaboradorEditando.categoriaProfissional}
                      onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, categoriaProfissional: e.target.value as DestinatarioGrupo })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                    >
                      <option value="TSDT">TSDT (Radioterapia)</option>
                      <option value="ENF">ENF (Enfermagem)</option>
                      <option value="MR">MR (Médico Radioncologista)</option>
                      <option value="FIS">FIS (Física Médica)</option>
                      <option value="AT">AT (Assistente Técnico)</option>
                      <option value="TAS">TAS (Técnico Auxiliar de Saúde)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estado Profissional:</label>
                    <select
                      value={colaboradorEditando.estadoProfissional}
                      onChange={(e) => {
                        const st = e.target.value as EstadoProfissional;
                        setColaboradorEditando({ 
                          ...colaboradorEditando, 
                          estadoProfissional: st,
                          ativo: st === 'Activo',
                          anoInativo: st === 'Inativo' ? (colaboradorEditando.anoInativo || anoAtual) : undefined
                        });
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Ausente: Baixa">Baixa</option>
                    </select>
                  </div>
                </div>

                {/* Requisito 8: Se colaborador ficar inativo, manter dados no ano em que ficou inativo, mas no ano seguinte não contabilizar */}
                {colaboradorEditando.estadoProfissional === 'Inativo' && (
                  <div className="bg-amber-50 p-2.5 rounded-md border border-amber-200">
                    <label className="block font-semibold text-amber-950 mb-1">
                      Ano em que Ficou Inativo:
                    </label>
                    <input
                      type="number"
                      min={2020}
                      max={2030}
                      value={colaboradorEditando.anoInativo ?? anoAtual}
                      onChange={(e) => setColaboradorEditando({
                        ...colaboradorEditando,
                        anoInativo: parseInt(e.target.value, 10) || anoAtual
                      })}
                      className="w-32 p-1.5 bg-white border border-amber-300 rounded font-mono font-bold text-amber-950 text-xs"
                    />
                    <p className="text-[10px] text-amber-800 mt-1">
                      <strong>Regra de Inatividade (Requisito 8):</strong> Os dados de formação são mantidos no ano {colaboradorEditando.anoInativo || anoAtual}. A partir do ano seguinte ({((colaboradorEditando.anoInativo || anoAtual) + 1)}), o colaborador não será contabilizado nas metas nem na equipa ativa.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Profissional:</label>
                  <input
                    type="email"
                    required
                    value={colaboradorEditando.email}
                    onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Meta Individual (Horas):</label>
                      {colaboradorEditando.metaHorasAnual === 0 && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">Desativada (0)</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={colaboradorEditando.metaHorasAnual ?? 35}
                      onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, metaHorasAnual: parseInt(e.target.value, 10) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-xs"
                    />
                    <span className="text-[10px] text-slate-400">0 = desativar meta (Requisito 9)</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Meta Individual (Qtd Formações):</label>
                      {colaboradorEditando.metaQtdFormacoesAnual === 0 && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">Desativada (0)</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={colaboradorEditando.metaQtdFormacoesAnual ?? 3}
                      onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, metaQtdFormacoesAnual: parseInt(e.target.value, 10) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-xs"
                    />
                    <span className="text-[10px] text-slate-400">0 = desativar meta (Requisito 9)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observações:</label>
                  <input
                    type="text"
                    value={colaboradorEditando.observacoes || ''}
                    onChange={(e) => setColaboradorEditando({ ...colaboradorEditando, observacoes: e.target.value })}
                    placeholder="Ex: Baixa desde 2024"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Botão de Atualizar que aciona a Janela de Verificação */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setColaboradorEditando(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleIniciarSalvarColaborador(colaboradorEditando)}
                  className="px-4 py-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Atualizar (com Verificação)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JANELA DE VERIFICAÇÃO / CONFIRMAÇÃO OBRIGATÓRIA */}
        {janelaVerificacaoAberta && dadosParaVerificar && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-2 border-teal-600 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-teal-800 mb-3">
                <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">
                  Janela de Verificação e Confirmação
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {dadosParaVerificar.mensagem}
              </p>

              {dadosParaVerificar.colaborador && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 mb-4">
                  <div>
                    <span className="text-slate-500 font-medium">Nome: </span>
                    <strong className="text-slate-900">{dadosParaVerificar.colaborador.nome}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Sigla / Nº Mecanográfico: </span>
                    <strong className="font-mono text-teal-700">{dadosParaVerificar.colaborador.sigla}</strong>
                    <span className="text-slate-600 font-mono"> (Nº {dadosParaVerificar.colaborador.numMecanografico || 's/n'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Categoria / Estado: </span>
                    <strong className="text-slate-800">{dadosParaVerificar.colaborador.categoriaProfissional}</strong>
                    <span className="text-slate-600"> · {dadosParaVerificar.colaborador.estadoProfissional}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Email: </span>
                    <span className="font-mono text-[11px] text-slate-700">{dadosParaVerificar.colaborador.email}</span>
                  </div>
                </div>
              )}

              {dadosParaVerificar.tipo === 'alterar_password' && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs space-y-1 mb-4 text-amber-900">
                  <span className="font-bold block">Aviso de Segurança:</span>
                  <span>A palavra-passe será alterada imediatamente para todos os acessos futuros ao RadForm.</span>
                </div>
              )}

              {/* Requisito 3: Janela de verificação da alteração de ReCap */}
              {dadosParaVerificar.recapItem && (
                <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs space-y-1.5 mb-4 text-amber-950">
                  <div>
                    <span className="text-amber-800 font-semibold">Código de Formação ReCap: </span>
                    <strong className="font-mono text-teal-800">{dadosParaVerificar.recapItem.codigo}</strong>
                  </div>
                  <div>
                    <span className="text-amber-800 font-semibold">Nome da Formação: </span>
                    <strong className="text-slate-900">{dadosParaVerificar.recapItem.nome}</strong>
                  </div>
                  <div>
                    <span className="text-amber-800 font-semibold">Domínio / Grau: </span>
                    <span>{dadosParaVerificar.recapItem.dominioCompetencia} · {dadosParaVerificar.recapItem.grauCarreira}</span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-semibold">Duração / Plataforma: </span>
                    <span className="font-mono font-bold">{dadosParaVerificar.recapItem.horasPadrao}h</span>
                    {dadosParaVerificar.recapItem.plataforma && <span> · {dadosParaVerificar.recapItem.plataforma}</span>}
                  </div>
                </div>
              )}

              {/* Requisito 6: Janela de verificação da alteração da Matriz Regulamentar */}
              {dadosParaVerificar.matrizAlvo && (
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-xs space-y-1.5 mb-4 text-teal-950">
                  <div>
                    <span className="text-teal-700 font-semibold">Subtipo de Formação: </span>
                    <strong className="text-slate-900">{dadosParaVerificar.matrizAlvo.subtipo}</strong>
                  </div>
                  <div>
                    <span className="text-teal-700 font-semibold">Documento Regulamentar: </span>
                    <strong className="text-slate-900">{dadosParaVerificar.matrizAlvo.chaveDoc}</strong>
                  </div>
                  <div>
                    <span className="text-teal-700 font-semibold">Nova Exigência Normativa: </span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
                      dadosParaVerificar.matrizAlvo.novoValor === 'sim'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : dadosParaVerificar.matrizAlvo.novoValor === 'opcional'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>
                      {dadosParaVerificar.matrizAlvo.novoValor === 'sim' ? 'SIM (Obrigatório)' : dadosParaVerificar.matrizAlvo.novoValor === 'opcional' ? 'Opcional' : 'N.A.'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setJanelaVerificacaoAberta(false);
                    setDadosParaVerificar(null);
                  }}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar / Rever
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarVerificacao}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar & Gravar</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
