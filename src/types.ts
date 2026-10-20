export type FormacaoCategoria = 'Externa' | 'Interna' | 'Enfermagem' | 'ACAF';

export type DestinatarioGrupo = 'MR' | 'ENF' | 'TSDT' | 'FIS' | 'AT' | 'TAS' | 'AO';

export interface DestinatarioInfo {
  codigo: DestinatarioGrupo;
  nomeCompleto: string;
  descricao: string;
}

export const DESTINATARIOS_INFO: Record<DestinatarioGrupo, DestinatarioInfo> = {
  MR: { codigo: 'MR', nomeCompleto: 'Médico(a) Radioncologista', descricao: 'Corpo Clínico Médico de Radioncologia' },
  ENF: { codigo: 'ENF', nomeCompleto: 'Enfermeiro(a)', descricao: 'Equipa de Enfermagem Oncológica' },
  TSDT: { codigo: 'TSDT', nomeCompleto: 'Técnico(a) Sup. Diagnóstico e Terapêutica', descricao: 'Técnicos de Radioterapia e Imagem' },
  FIS: { codigo: 'FIS', nomeCompleto: 'Físico(a) Médico(a)', descricao: 'Física Médica e Dosimetria' },
  AT: { codigo: 'AT', nomeCompleto: 'Assistente Técnico(a)', descricao: 'Secretariado Clínico e Apoio Administrativo' },
  TAS: { codigo: 'TAS', nomeCompleto: 'Técnico(a) Auxiliar de Saúde', descricao: 'Apoio Operacional e Cuidados de Saúde' },
  AO: { codigo: 'TAS', nomeCompleto: 'Técnico(a) Auxiliar de Saúde', descricao: 'Apoio Operacional e Cuidados de Saúde' },
};

export type SubtipoBurocracia = 
  | 'ACAF (inclui NIFTSDT)'
  | 'ACAF - Obrigatória'
  | 'Enfermagem (só Internas)'
  | 'Externa (inclui Enfermagem Externas)'
  | 'Interna - Formador Interno (i.e. só TSDT)'
  | 'Interna - Formador Externo (i.e. só TSDT)'
  | 'Interna - Obrigatória';

export interface RequisitosDocumentais {
  reservaSala: 'sim' | 'n.a.';
  emailConfirmacaoSala: 'sim' | 'n.a.';
  propostaPAF: 'sim' | 'n.a.';
  fichaFormadorFF: 'sim' | 'n.a.';
  fichaInscricaoFI: 'sim' | 'n.a.';
  listaNominativaLN: 'sim' | 'n.a.';
  sumarioS: 'sim' | 'n.a.';
  registoPresencaRPF: 'sim' | 'n.a.';
  avaliacaoFormadorA1: 'sim' | 'n.a.';
  avaliacaoFormandoAF1: 'sim' | 'n.a.';
  certificadosCR: 'sim' | 'opcional' | 'n.a.';
  emailAvaliacao6Meses: 'sim' | 'n.a.';
  avaliacaoEficaciaA6: 'sim' | 'n.a.';
}

export const MATRIZ_BUROCRACIA: Record<SubtipoBurocracia, RequisitosDocumentais> = {
  'ACAF (inclui NIFTSDT)': {
    reservaSala: 'n.a.',
    emailConfirmacaoSala: 'n.a.',
    propostaPAF: 'n.a.',
    fichaFormadorFF: 'n.a.',
    fichaInscricaoFI: 'n.a.',
    listaNominativaLN: 'n.a.',
    sumarioS: 'n.a.',
    registoPresencaRPF: 'sim',
    avaliacaoFormadorA1: 'n.a.',
    avaliacaoFormandoAF1: 'n.a.',
    certificadosCR: 'opcional',
    emailAvaliacao6Meses: 'sim',
    avaliacaoEficaciaA6: 'sim',
  },
  'ACAF - Obrigatória': {
    reservaSala: 'n.a.',
    emailConfirmacaoSala: 'n.a.',
    propostaPAF: 'n.a.',
    fichaFormadorFF: 'n.a.',
    fichaInscricaoFI: 'sim',
    listaNominativaLN: 'sim',
    sumarioS: 'n.a.',
    registoPresencaRPF: 'sim',
    avaliacaoFormadorA1: 'n.a.',
    avaliacaoFormandoAF1: 'n.a.',
    certificadosCR: 'opcional',
    emailAvaliacao6Meses: 'sim',
    avaliacaoEficaciaA6: 'sim',
  },
  'Enfermagem (só Internas)': {
    reservaSala: 'n.a.',
    emailConfirmacaoSala: 'n.a.',
    propostaPAF: 'n.a.',
    fichaFormadorFF: 'n.a.',
    fichaInscricaoFI: 'n.a.',
    listaNominativaLN: 'n.a.',
    sumarioS: 'n.a.',
    registoPresencaRPF: 'n.a.',
    avaliacaoFormadorA1: 'n.a.',
    avaliacaoFormandoAF1: 'n.a.',
    certificadosCR: 'n.a.',
    emailAvaliacao6Meses: 'n.a.',
    avaliacaoEficaciaA6: 'n.a.',
  },
  'Externa (inclui Enfermagem Externas)': {
    reservaSala: 'n.a.',
    emailConfirmacaoSala: 'n.a.',
    propostaPAF: 'n.a.',
    fichaFormadorFF: 'n.a.',
    fichaInscricaoFI: 'n.a.',
    listaNominativaLN: 'n.a.',
    sumarioS: 'n.a.',
    registoPresencaRPF: 'n.a.',
    avaliacaoFormadorA1: 'n.a.',
    avaliacaoFormandoAF1: 'n.a.',
    certificadosCR: 'sim',
    emailAvaliacao6Meses: 'sim',
    avaliacaoEficaciaA6: 'sim',
  },
  'Interna - Formador Interno (i.e. só TSDT)': {
    reservaSala: 'sim',
    emailConfirmacaoSala: 'sim',
    propostaPAF: 'sim',
    fichaFormadorFF: 'n.a.',
    fichaInscricaoFI: 'n.a.',
    listaNominativaLN: 'n.a.',
    sumarioS: 'sim',
    registoPresencaRPF: 'sim',
    avaliacaoFormadorA1: 'sim',
    avaliacaoFormandoAF1: 'sim',
    certificadosCR: 'opcional',
    emailAvaliacao6Meses: 'sim',
    avaliacaoEficaciaA6: 'sim',
  },
  'Interna - Formador Externo (i.e. só TSDT)': {
    reservaSala: 'sim',
    emailConfirmacaoSala: 'sim',
    propostaPAF: 'sim',
    fichaFormadorFF: 'sim',
    fichaInscricaoFI: 'n.a.',
    listaNominativaLN: 'n.a.',
    sumarioS: 'sim',
    registoPresencaRPF: 'sim',
    avaliacaoFormadorA1: 'sim',
    avaliacaoFormandoAF1: 'sim',
    certificadosCR: 'opcional',
    emailAvaliacao6Meses: 'sim',
    avaliacaoEficaciaA6: 'sim',
  },
  'Interna - Obrigatória': {
    reservaSala: 'sim',
    emailConfirmacaoSala: 'sim',
    propostaPAF: 'sim',
    fichaFormadorFF: 'n.a.',
    fichaInscricaoFI: 'sim',
    listaNominativaLN: 'sim',
    sumarioS: 'sim',
    registoPresencaRPF: 'sim',
    avaliacaoFormadorA1: 'sim',
    avaliacaoFormandoAF1: 'sim',
    certificadosCR: 'opcional',
    emailAvaliacao6Meses: 'sim',
    avaliacaoEficaciaA6: 'sim',
  },
};

export interface DocumentosValidacaoFormacao {
  reservaSala?: boolean;
  emailConfirmacaoSala?: boolean;
  propostaPAF?: boolean;
  fichaFormadorFF?: boolean;
  fichaInscricaoFI?: boolean;
  listaNominativaLN?: boolean;
  sumarioS?: boolean;
  registoPresencaRPF?: boolean;
  avaliacaoFormadorA1?: boolean;
  avaliacaoFormandoAF1?: boolean;
  certificadosCR?: boolean;
  emailAvaliacao6Meses?: boolean;
  emailEnviadoData?: string;
  avaliacaoEficaciaA6?: boolean;
}

export interface CertificadoAnexo {
  id: string;
  nomeFicheiro: string;
  tamanhoKb?: number;
  dataUpload: string;
  conteudoBase64?: string;
  tipoMime?: string;
}

export type PrioridadeFormacao = 'Baixa' | 'Média' | 'Alta';

export interface Formacao {
  id: string;
  ano: number;
  nome: string;
  categoria: FormacaoCategoria;
  prioridade?: PrioridadeFormacao;
  subtipoBurocracia?: SubtipoBurocracia;
  destinatarios: DestinatarioGrupo[];
  data: string; // Formato YYYY-MM-DD ou intervalo descritivo
  dataFim?: string;
  frequentadaColaboradorRad: boolean;
  colaboradores: string[]; // Siglas dos colaboradores
  horas: number;
  horasTexto?: string;
  codigo: string;
  relevancia: 'Sim' | 'Não';
  incluidaPlanoNecessidades: 'Sim' | 'Não';
  realizada: boolean;
  burocracia: boolean;
  observacoes?: string;
  certificado?: CertificadoAnexo;
  documentosBurocracia?: DocumentosValidacaoFormacao;
  localOuPlataforma?: string;
  entidadeFormadora?: string;
  dataRegisto: string;
}

export type EstadoProfissional = 'Activo' | 'Inativo' | 'Ausente: Baixa';

export interface Colaborador {
  id: string;
  sigla: string; // Ex: BOM, CRP, FGF, MAM, LMS, etc.
  nome: string;
  numMecanografico: string;
  categoriaProfissional: DestinatarioGrupo;
  cargo: string;
  email: string;
  estadoProfissional: EstadoProfissional;
  ativo: boolean;
  anoInativo?: number; // Ano em que ficou inativo (mantém dados nesse ano, exclui em anos posteriores)
  observacoes?: string;
  dataAdmissao?: string;
  metaHorasAnual?: number;
  metaQtdFormacoesAnual?: number;
}

export interface CertificacaoObrigatoria {
  id: string;
  colaboradorSigla: string;
  colaboradorNome: string;
  categoriaProfissional: DestinatarioGrupo;
  nomeCertificacao: string;
  dataObtencao: string;
  dataExpiracao: string;
  entidadeCertificadora: string;
  estado: 'valido' | 'a_expirar' | 'expirado';
  diasParaExpirar: number;
  observacoes?: string;
}

export interface FormacaoFutura {
  id: string;
  titulo: string;
  entidade: string;
  dataInicio: string;
  dataFim?: string;
  local: string;
  formato: 'Webinar' | 'Presencial' | 'Híbrido' | 'E-learning';
  ambito: 'Nacional' | 'Internacional';
  temaPrincipal: 
    | 'Efeitos secundários de Radioterapia'
    | 'Dosimetria'
    | 'Comunicação ao doente oncológico'
    | 'Radioterapia' 
    | 'Oncologia' 
    | 'Cancro' 
    | 'Desenvolvimento Pessoal' 
    | 'Desenvolvimento Pessoal e Emocional' 
    | 'Tumores' 
    | 'Doente Oncológico' 
    | 'Radiação' 
    | 'Radiobiologia' 
    | 'Física Médica' 
    | 'Qualidade e Gestão'
    | 'Inteligência emocional'
    | 'Gestão de tempo'
    | 'Burnout'
    | 'Acelerador linear'
    | 'Elaborar investigação'
    | 'Elaborar artigos científicos'
    | (string & {});
  descricao: string;
  destinatariosSugeridos: DestinatarioGrupo[];
  horasEstimadas?: number;
  url: string;
  destaque?: boolean;
  gratis?: boolean; // true = Gratuito, false = Pago
  custoTexto?: string; // Ex: 'Gratuito', 'Pago (Sob Inscrição)'
}

export interface SiteFormacaoRadar {
  id: string;
  nome: string;
  url: string;
  ambito: 'Nacional' | 'Internacional';
  temas: string[];
  ativo: boolean;
  dataAdicao?: string;
}

export interface MetaAno {
  ano: number;
  metaHorasPorColaborador: number;
  metaTotalServico: number;
  metaQtdFormacoesServico?: number;
  metaQtdFormacoesPorColaborador?: number;
  metasPorCategoria?: Record<string, number>;
  metasQtdPorCategoria?: Record<string, number>;
  dataCriacao: string;
  dataFecho?: string;
  concluido?: boolean;
  observacoes?: string;
}

export interface HistoricoAno {
  ano: number;
  totalFormacoes: number;
  totalHoras: number;
  totalColaboradoresAtivos: number;
  percentagemMetaAtingida: number;
  percentagemMetaQtdAtingida?: number;
  formacoes: Formacao[];
  meta: MetaAno;
  dataArquivo: string;
}

export interface RecapCodigoInfo {
  id: string;
  codigo: string;
  nome: string;
  dominioCompetencia: string;
  grauCarreira?: string;
  horasPadrao: number;
  plataforma: string;
  descricao?: string;
}

export type PeriodicidadeTarefa = 'inicio_ano' | 'mensal' | 'trimestral' | 'durante_ano' | 'anual';

export interface TarefaQualidade {
  id: string;
  ano: number;
  titulo: string;
  descricao?: string;
  periodicidade: PeriodicidadeTarefa;
  mes?: number; // 1 a 12
  trimestre?: 1 | 2 | 3 | 4;
  prazoDescritivo?: string;
  dataLimite?: string;
  concluida: boolean; // Bisga (checkmark / pisga)
  dataConclusao?: string;
  responsavel?: string;
  observacoes?: string;
  acaoRapidaTipo?: 'atualizar_formacoes' | 'atualizar_burocracias' | 'relatorio_trimestral' | 'relatorio_anual' | 'email_enfermagem_tania' | 'outro';
  prioridade?: 'alta' | 'media' | 'normal';
}

export const DEFAULT_RECAP_CODIGOS: RecapCodigoInfo[] = [
  {
    id: 'recap-res-qual-1',
    codigo: 'ReCAP-Resultados-Qualid-1',
    nome: 'ReCAP: Orientação para os Resultados - QUALIDADE 1',
    dominioCompetencia: 'Orientação para os Resultados',
    grauCarreira: 'Geral (Todos os Graus)',
    horasPadrao: 1,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Conceitos fundamentais de qualidade e foco no utente na prestação de cuidados.'
  },
  {
    id: 'recap-res-qual-2',
    codigo: 'ReCAP-Resultados-Qualid-2',
    nome: 'ReCAP: Orientação para os Resultados - QUALIDADE 2',
    dominioCompetencia: 'Orientação para os Resultados',
    grauCarreira: 'Geral (Todos os Graus)',
    horasPadrao: 1,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Melhoria contínua de processos e gestão de fluxos de trabalho assistenciais.'
  },
  {
    id: 'recap-res-qual-3',
    codigo: 'ReCAP-Resultados-Qualid-3',
    nome: 'ReCAP: Orientação para os Resultados - QUALIDADE 3',
    dominioCompetencia: 'Orientação para os Resultados',
    grauCarreira: 'Geral (Todos os Graus)',
    horasPadrao: 1,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Auditoria clínica interna, segurança do doente e indicadores de desempenho.'
  },
  {
    id: 'recap-res-qual-4',
    codigo: 'ReCAP-Resultados-Qualid-4',
    nome: 'ReCAP: Orientação para os Resultados - QUALIDADE 4',
    dominioCompetencia: 'Orientação para os Resultados',
    grauCarreira: 'Geral (Todos os Graus)',
    horasPadrao: 1,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Gestão do risco, notificação de incidentes e conformidade regulamentar.'
  },
  {
    id: 'recap-res-qual-5',
    codigo: 'ReCAP-Resultados-Qualid-5',
    nome: 'ReCAP: Orientação para os Resultados - QUALIDADE 5',
    dominioCompetencia: 'Orientação para os Resultados',
    grauCarreira: 'Geral (Todos os Graus)',
    horasPadrao: 1,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Excelência operacional, cultura de segurança e avaliação de resultados em saúde.'
  },
  {
    id: 'recap-siadap-mudanca-3',
    codigo: 'ReCAP-SIADAP-Mudanca-3',
    nome: 'ReCAP: Orientação para a Mudança e Inovação - MODERNA 3',
    dominioCompetencia: 'Mudança e Inovação (SIADAP)',
    grauCarreira: 'Carreiras Grau 3 (Técnicos Superiores / TSDT)',
    horasPadrao: 7,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Adaptação a novas tecnologias clínicas, otimização de procedimentos e inovação nos serviços.'
  },
  {
    id: 'recap-siadap-servpubl-3',
    codigo: 'ReCAP-SIADAP-ServPubl-3',
    nome: 'ReCAP: Orientação para o Serviço Público - Carreiras Grau 3',
    dominioCompetencia: 'Orientação para o Serviço Público (SIADAP)',
    grauCarreira: 'Carreiras Grau 3 (Técnicos Superiores / TSDT)',
    horasPadrao: 7,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Missão pública, ética, transparência e valor acrescentado ao Serviço Nacional de Saúde.'
  },
  {
    id: 'recap-siadap-colaboracao-1',
    codigo: 'ReCAP-SIADAP-Colaboracao-1',
    nome: 'ReCAP: Orientação para a Colaboração - COLABORAÇÃO 1',
    dominioCompetencia: 'Trabalho em Equipa e Colaboração',
    grauCarreira: 'Grau 1 e Equipas Multidisciplinares',
    horasPadrao: 7,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Comunicação interpessoal, cooperação multidisciplinar e articulação entre grupos profissionais.'
  },
  {
    id: 'recap-siadap-resultados-3',
    codigo: 'ReCAP-SIADAP-Resultados-3',
    nome: 'ReCAP: Orientação para os Resultados - Carreiras Grau 3',
    dominioCompetencia: 'Orientação para os Resultados (SIADAP)',
    grauCarreira: 'Carreiras Grau 3 (Técnicos Superiores / TSDT)',
    horasPadrao: 7,
    plataforma: 'NAU (ep.nau.edu.pt)',
    descricao: 'Planeamento, cumprimento de objetivos individuais e contratualização de metas assistenciais.'
  }
];

export interface ConfiguracoesApp {
  passwordAcesso: string;
  nomeHospital: string;
  nomeServico: string;
  metaPadraoHoras: number;
  metaTotalServico?: number;
  metasPorCategoria?: Record<DestinatarioGrupo, number>;
  metaPadraoQtdFormacoes?: number;
  metaTotalQtdFormacoesServico?: number;
  metasQtdPorCategoria?: Record<DestinatarioGrupo, number>;
  exigirPassword: boolean;
  notificacoesBrowserAtivas?: boolean;
  notificacoesEmailAtivas?: boolean;
  emailNotificacoesBurocracia?: string;
  diasAlertaBurocracia?: number; // 30 dias
  recapCodigos?: RecapCodigoInfo[];
  backupAutomaticoAtivo?: boolean;
  frequenciaBackup?: 'diario' | 'semanal' | 'mensal' | 'desativado';
  ultimoBackupData?: string;
  // Sincronização em Nuvem e Criptografia E2EE (Requisito 3)
  cloudSyncAtivo?: boolean;
  cloudSyncFrequencia?: 'tempo_real' | 'horario' | 'diario' | 'semanal';
  cloudSyncServico?: 'RadForm Cloud Vault' | 'Microsoft OneDrive / SharePoint' | 'Google Drive';
  e2eePassphrase?: string;
  ultimoCloudSyncData?: string;
  matrizBurocraciaCustomizada?: Record<SubtipoBurocracia, RequisitosDocumentais>;
  metasPorAno?: Record<number, MetaAno>;
}

/**
 * Regra de negócio: Se o colaborador ficar inativo, mantêm-se os dados no ano
 * em que ficou inativo, mas nos anos seguintes ele não é contabilizado na equipa ativa.
 */
export const isColaboradorAtivoNoAno = (c: Colaborador, ano: number): boolean => {
  if (c.ativo && c.estadoProfissional !== 'Inativo') return true;
  if (c.anoInativo !== undefined && c.anoInativo !== null) {
    return ano <= c.anoInativo;
  }
  return c.ativo;
};
