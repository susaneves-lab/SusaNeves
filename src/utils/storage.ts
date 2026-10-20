import { Formacao, Colaborador, CertificacaoObrigatoria, MetaAno, HistoricoAno, ConfiguracoesApp, DEFAULT_RECAP_CODIGOS, TarefaQualidade } from '../types';
import { SEED_FORMACOES_2026, INITIAL_META_2026, INITIAL_HISTORICO_2025 } from '../data/seedData2026';
import { INITIAL_COLABORADORES, INITIAL_CERTIFICACOES } from '../data/collaborators';
import { gerarTarefasPadraoAno } from '../data/qualityTasksData';

const STORAGE_KEYS = {
  FORMACOES: 'radform_formacoes_v3',
  COLABORADORES: 'radform_colaboradores_v3',
  CERTIFICACOES: 'radform_certificacoes_v3',
  METAS: 'radform_metas_v3',
  HISTORICOS: 'radform_historicos_v3',
  CURRENT_YEAR: 'radform_current_year_v3',
  CONFIGURACOES: 'radform_configuracoes_v3',
  TAREFAS: 'radform_tarefas_qualidade_v3',
};

export const DEFAULT_CONFIGURACOES: ConfiguracoesApp = {
  passwordAcesso: 'rad2026',
  nomeHospital: 'Unidade Local de Saúde · ULSAR, EPE',
  nomeServico: 'Serviço de Radioterapia',
  metaPadraoHoras: 35,
  metaTotalServico: 875,
  metaPadraoQtdFormacoes: 3,
  metaTotalQtdFormacoesServico: 35,
  exigirPassword: true,
  notificacoesBrowserAtivas: true,
  notificacoesEmailAtivas: true,
  emailNotificacoesBurocracia: 'chefia.radioterapia@ulsar.min-saude.pt; radform@ulsar.min-saude.pt',
  diasAlertaBurocracia: 30,
  recapCodigos: DEFAULT_RECAP_CODIGOS,
  backupAutomaticoAtivo: true,
  frequenciaBackup: 'semanal',
  ultimoBackupData: new Date().toISOString().slice(0, 10)
};

export const getStoredConfiguracoes = (): ConfiguracoesApp => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIGURACOES);
    if (!raw) return DEFAULT_CONFIGURACOES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIGURACOES,
      ...parsed,
      recapCodigos: parsed.recapCodigos && parsed.recapCodigos.length > 0 ? parsed.recapCodigos : DEFAULT_RECAP_CODIGOS
    };
  } catch {
    return DEFAULT_CONFIGURACOES;
  }
};

export const saveStoredConfiguracoes = (cfg: ConfiguracoesApp): void => {
  localStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(cfg));
};

export const getStoredFormacoes = (): Formacao[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORMACOES);
    if (!raw) return SEED_FORMACOES_2026;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_FORMACOES_2026;
    return parsed.map((f: Formacao) => ({
      ...f,
      destinatarios: (f.destinatarios || []).map((d: any) => d === 'AO' ? 'TAS' : d)
    }));
  } catch (err) {
    console.error('Error loading formacoes:', err);
    return SEED_FORMACOES_2026;
  }
};

export const saveStoredFormacoes = (formacoes: Formacao[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FORMACOES, JSON.stringify(formacoes));
  } catch (err) {
    console.error('Error saving formacoes:', err);
  }
};

export const getStoredColaboradores = (): Colaborador[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLABORADORES);
    if (!raw) return INITIAL_COLABORADORES;
    const parsed: Colaborador[] = JSON.parse(raw);
    return parsed.map(c => ({
      ...c,
      categoriaProfissional: (c.categoriaProfissional as any) === 'AO' ? 'TAS' : c.categoriaProfissional
    }));
  } catch {
    return INITIAL_COLABORADORES;
  }
};

export const saveStoredColaboradores = (colabs: Colaborador[]): void => {
  localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(colabs));
};

export const getStoredCertificacoes = (): CertificacaoObrigatoria[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CERTIFICACOES);
    if (!raw) return INITIAL_CERTIFICACOES;
    return JSON.parse(raw);
  } catch {
    return INITIAL_CERTIFICACOES;
  }
};

export const saveStoredCertificacoes = (certs: CertificacaoObrigatoria[]): void => {
  localStorage.setItem(STORAGE_KEYS.CERTIFICACOES, JSON.stringify(certs));
};

export const getStoredMetas = (): Record<number, MetaAno> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.METAS);
    if (!raw) return { 2026: INITIAL_META_2026 };
    return JSON.parse(raw);
  } catch {
    return { 2026: INITIAL_META_2026 };
  }
};

export const saveStoredMetas = (metas: Record<number, MetaAno>): void => {
  localStorage.setItem(STORAGE_KEYS.METAS, JSON.stringify(metas));
};

export const getStoredHistoricos = (): HistoricoAno[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORICOS);
    if (!raw) return [INITIAL_HISTORICO_2025];
    return JSON.parse(raw);
  } catch {
    return [INITIAL_HISTORICO_2025];
  }
};

export const saveStoredHistoricos = (hist: HistoricoAno[]): void => {
  localStorage.setItem(STORAGE_KEYS.HISTORICOS, JSON.stringify(hist));
};

export const getStoredCurrentYear = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_YEAR);
    return raw ? parseInt(raw, 10) : 2026;
  } catch {
    return 2026;
  }
};

export const saveStoredCurrentYear = (year: number): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_YEAR, year.toString());
};

// Gera backup completo em ficheiro JSON para download e conformidade
export const generateFullBackupDownload = (dados: {
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  certificacoes?: CertificacaoObrigatoria[];
  metas?: Record<number, MetaAno>;
  historicos?: HistoricoAno[];
  anoAtual: number;
}): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupObject = {
    versaoSistema: 'RadForm-2.4',
    dataBackup: new Date().toISOString(),
    servico: 'Serviço de Radioterapia - Hospital ULSAR',
    certificacoes: dados.certificacoes || getStoredCertificacoes(),
    metas: dados.metas || getStoredMetas(),
    historicos: dados.historicos || getStoredHistoricos(),
    ...dados
  };

  const blob = new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Formacao_Servico_RAD_${dados.anoAtual}_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getStoredTarefasQualidade = (ano: number): TarefaQualidade[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TAREFAS}_${ano}`);
    if (!raw) return gerarTarefasPadraoAno(ano);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return gerarTarefasPadraoAno(ano);
    return (parsed as TarefaQualidade[]).map(t => ({
      ...t,
      descricao: t.descricao ? t.descricao.replace(/\be AO\b/g, 'e TAS').replace(/\bAO\b/g, 'TAS') : t.descricao
    }));
  } catch (err) {
    console.error('Erro ao ler tarefas da qualidade:', err);
    return gerarTarefasPadraoAno(ano);
  }
};

export const saveStoredTarefasQualidade = (ano: number, tarefas: TarefaQualidade[]): void => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.TAREFAS}_${ano}`, JSON.stringify(tarefas));
  } catch (err) {
    console.error('Erro ao gravar tarefas da qualidade:', err);
  }
};
