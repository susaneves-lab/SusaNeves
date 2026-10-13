import { TarefaQualidade } from '../types';

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

export const CRITERIOS_RELEVANCIA_QUALIDADE = [
  {
    num: 1,
    titulo: 'Pertinência e Relevância do Tema ou Programa',
    descricao: 'Conteúdo estritamente relacionado com a atividade profissional e prática clínica no Serviço de Radioterapia.'
  },
  {
    num: 2,
    titulo: 'Atualização Tecnológica',
    descricao: 'Aborda novas tecnologias, aceleradores lineares, software dosimétrico, novos fármacos ou metodologias inovadoras.'
  },
  {
    num: 3,
    titulo: 'Impacto Profissional na Atividade Laboral',
    descricao: 'Produz melhoria mensurável na prestação de cuidados, segurança do doente oncológico ou eficiência do serviço.'
  },
  {
    num: 4,
    titulo: 'Aplicabilidade & Viabilidade de Implementação',
    descricao: 'Os conhecimentos adquiridos são passíveis de aplicação real e sustentável no contexto de trabalho da ULSAR.'
  },
  {
    num: 5,
    titulo: 'Desenvolvimento de Competências Práticas',
    descricao: 'Capacitação prática e técnica dos colaboradores em procedimentos, protocolos clínicos ou suporte assistencial.'
  }
] as const;

export const NOTAS_REGULAMENTARES_QUALIDADE = [
  {
    regra: 'Limite de 3 meses para receção de documentação de Certificados dos Colaboradores.',
    detalhe: 'Após a frequência de qualquer ação formativa, o colaborador tem o prazo limite de 90 dias para entregar o respetivo certificado à equipa da qualidade.'
  },
  {
    regra: 'Após término do ano civil, o colaborador tem 1 mês para efetuar o envio de certificados referentes ao ano anterior.',
    detalhe: 'Até ao final de Janeiro do ano subsequente, todos os certificados em atraso do ano findo devem ser impreterivelmente remetidos.'
  },
  {
    regra: 'Critério de Inclusão de Relevância para Formações: Mínimo de 3 critérios cumpridos.',
    detalhe: 'Para ser considerada relevante e validada para efeitos de plano e avaliação de desempenho, a formação tem de preencher pelo menos 3 dos 5 critérios oficiais.'
  }
] as const;

export const gerarTarefasPadraoAno = (ano: number): TarefaQualidade[] => [
  // ─── 1. INÍCIO DO ANO (12 Tarefas da Imagem - Página 1) ───
  {
    id: `task-${ano}-ini-1`,
    ano,
    titulo: 'Criar pasta e documentos de Excel para o novo ano',
    descricao: 'Criar a estrutura de diretórios e folhas de cálculo oficiais para registo das formações do novo ano civil.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Primeira semana de Janeiro',
    dataLimite: `${ano}-01-08`,
    concluida: true,
    dataConclusao: `${ano}-01-05`,
    responsavel: 'Responsável da Qualidade / RAD',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-2`,
    ano,
    titulo: 'Criar pastas no email de Formação para o novo ano',
    descricao: 'Criar subpastas dedicadas no Outlook de Formação para organizar a correspondência e comprovativos do ano.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Primeira semana de Janeiro',
    dataLimite: `${ano}-01-08`,
    concluida: true,
    dataConclusao: `${ano}-01-06`,
    responsavel: 'Responsável da Qualidade / RAD',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-ini-3`,
    ano,
    titulo: 'Entregar as necessidades formativas para cada categoria profissional (6) para o novo ano',
    descricao: 'Distribuir formulários de levantamento de necessidades para as 6 categorias: MR, ENF, TSDT, FIS, AT e AO.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Até meio de Janeiro',
    dataLimite: `${ano}-01-15`,
    concluida: true,
    dataConclusao: `${ano}-01-14`,
    responsavel: 'Coordenação de Formação RAD',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-4`,
    ano,
    titulo: 'Fazer reunião de equipa para o novo ano, para definir objetivos anuais e respetiva ata',
    descricao: 'Reunião plenária de serviço para definir metas de horas por colaborador, metas de ações e lavrar a ata oficial.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Janeiro',
    dataLimite: `${ano}-01-20`,
    concluida: true,
    dataConclusao: `${ano}-01-18`,
    responsavel: 'Diretoria de Serviço & Qualidade',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-5`,
    ano,
    titulo: 'Enviar email a solicitar certificados de emails do ano anterior com o prazo até final do mês de Janeiro',
    descricao: 'Disparar convocatória por email a todos os colaboradores com prazo limite de 31 de Janeiro para entrega de certificados do ano transato.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Até final de Janeiro',
    dataLimite: `${ano}-01-31`,
    concluida: true,
    dataConclusao: `${ano}-01-25`,
    responsavel: 'Responsável da Qualidade / RAD',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-6`,
    ano,
    titulo: 'Atualizar lista de nomes de colaboradores RAD com respetivos dados',
    descricao: 'Verificar novas admissões, saídas, números mecanográficos, categorias profissionais e estado no RadForm.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Final de Janeiro',
    dataLimite: `${ano}-01-31`,
    concluida: true,
    dataConclusao: `${ano}-01-28`,
    responsavel: 'Gestão de Recursos / Qualidade',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-7`,
    ano,
    titulo: 'Atualizar documentação necessária e os impressos do ACAF',
    descricao: 'Rever as minutas em vigor do ACAF: Proposta PAF, Ficha Formador, Ficha Inscrição, Registo de Presenças e Impressos.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Janeiro',
    dataLimite: `${ano}-01-31`,
    concluida: true,
    dataConclusao: `${ano}-01-29`,
    responsavel: 'Interlocutor ACAF / RAD',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-ini-8`,
    ano,
    titulo: 'Rever Instrução técnica do Objetivo',
    descricao: 'Aferir conformidade da Instrução de Trabalho com os indicadores de qualidade hospitalar e normas do CHUSJ/ULSAR.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Final de Janeiro',
    dataLimite: `${ano}-01-31`,
    concluida: true,
    dataConclusao: `${ano}-01-30`,
    responsavel: 'Gabinete da Qualidade',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-ini-9`,
    ano,
    titulo: 'Fechar o ano anterior',
    descricao: 'Consolidação final dos dados de horas, arquivo de históricos e fecho contabilístico formativo do ano findo.',
    periodicidade: 'inicio_ano',
    mes: 1,
    trimestre: 1,
    prazoDescritivo: 'Fim de Janeiro',
    dataLimite: `${ano}-01-31`,
    concluida: true,
    dataConclusao: `${ano}-01-31`,
    responsavel: 'Responsável da Qualidade / RAD',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-10`,
    ano,
    titulo: 'Criar e organizar futuras formações para o ano',
    descricao: 'Alimentar o Radar de Formações Futuras com eventos científicos previstos, congressos, webinars e cursos internos.',
    periodicidade: 'inicio_ano',
    mes: 2,
    trimestre: 1,
    prazoDescritivo: 'Primeira quinzena de Fevereiro',
    dataLimite: `${ano}-02-15`,
    concluida: true,
    dataConclusao: `${ano}-02-10`,
    responsavel: 'Equipa de Formação RAD',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-ini-11`,
    ano,
    titulo: 'Recolher as necessidades formativas do serviço para o novo ano, fixar o mesmo no painel de formações e enviar para o ACAF, devidamente assinado pelo diretor(a) de Serviço',
    descricao: 'Compilar todas as propostas, afixar no placard oficial do serviço e submeter ao ACAF com chancela da Direção.',
    periodicidade: 'inicio_ano',
    mes: 2,
    trimestre: 1,
    prazoDescritivo: 'Fevereiro',
    dataLimite: `${ano}-02-28`,
    concluida: true,
    dataConclusao: `${ano}-02-24`,
    responsavel: 'Diretor de Serviço / Qualidade',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-ini-12`,
    ano,
    titulo: 'Marcar formações obrigatórias com os intervenientes: "Proteção Radiológica" e "Higiene das Mãos"',
    descricao: 'Contactar interlocutores da Física Médica e do GCL-PPCIRA para agendamento das ações obrigatórias regulamentares.',
    periodicidade: 'inicio_ano',
    mes: 2,
    trimestre: 1,
    prazoDescritivo: 'Fevereiro',
    dataLimite: `${ano}-02-28`,
    concluida: true,
    dataConclusao: `${ano}-02-26`,
    responsavel: 'Comissão de Formação RAD',
    prioridade: 'alta'
  },

  // ─── 2. NO FINAL DO TRIMESTRE (Página 1 e 2) ───
  // Trimestre 1
  {
    id: `task-${ano}-trim-t1-1`,
    ano,
    titulo: 'Fazer relatório trimestral (1º Trimestre) e enviar o mesmo e os dados do período para os Responsáveis da qualidade',
    descricao: 'Gerar o relatório consolidado de horas, ações e burocracia do 1º Trimestre e enviar à Gestão da Qualidade.',
    periodicidade: 'trimestral',
    mes: 3,
    trimestre: 1,
    prazoDescritivo: 'Final de Março',
    dataLimite: `${ano}-03-31`,
    concluida: true,
    dataConclusao: `${ano}-03-29`,
    responsavel: 'Responsável da Qualidade / RAD',
    acaoRapidaTipo: 'relatorio_trimestral',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-trim-t1-2`,
    ano,
    titulo: 'Atualizar o plano de formações (1º Trimestre)',
    descricao: 'Confrontar as ações do PNF realizadas versus planeadas no encerramento do primeiro trimestre.',
    periodicidade: 'trimestral',
    mes: 3,
    trimestre: 1,
    prazoDescritivo: 'Final de Março',
    dataLimite: `${ano}-03-31`,
    concluida: true,
    dataConclusao: `${ano}-03-30`,
    responsavel: 'Coordenação de Formação',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-trim-t1-3`,
    ano,
    titulo: 'Solicitar à Enfermagem o Registo de Presença de Formandos (RPF) das formações de Enfermagem (T1 - Colaboradora Tânia)',
    descricao: 'Enviar solicitação formal à Enf.ª Tânia para remeter as folhas de presença e comprovativos de ações da equipa de Enfermagem.',
    periodicidade: 'trimestral',
    mes: 3,
    trimestre: 1,
    prazoDescritivo: 'Final de Março',
    dataLimite: `${ano}-03-31`,
    concluida: true,
    dataConclusao: `${ano}-03-28`,
    responsavel: 'Interlocutor RAD',
    acaoRapidaTipo: 'email_enfermagem_tania',
    prioridade: 'alta'
  },

  // Trimestre 2
  {
    id: `task-${ano}-trim-t2-1`,
    ano,
    titulo: 'Fazer relatório trimestral (2º Trimestre) e enviar o mesmo e os dados do período para os Responsáveis da qualidade',
    descricao: 'Balanço semestral de horas e grau de execução das metas para os Responsáveis da Qualidade hospitalar.',
    periodicidade: 'trimestral',
    mes: 6,
    trimestre: 2,
    prazoDescritivo: 'Final de Junho',
    dataLimite: `${ano}-06-30`,
    concluida: true,
    dataConclusao: `${ano}-06-28`,
    responsavel: 'Responsável da Qualidade / RAD',
    acaoRapidaTipo: 'relatorio_trimestral',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-trim-t2-2`,
    ano,
    titulo: 'Atualizar o plano de formações (2º Trimestre / Semestral)',
    descricao: 'Revisão das rubricas de formação executadas e reprogramação para o segundo semestre.',
    periodicidade: 'trimestral',
    mes: 6,
    trimestre: 2,
    prazoDescritivo: 'Final de Junho',
    dataLimite: `${ano}-06-30`,
    concluida: true,
    dataConclusao: `${ano}-06-29`,
    responsavel: 'Coordenação de Formação',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-trim-t2-3`,
    ano,
    titulo: 'Solicitar à Enfermagem o Registo de Presença de Formandos (RPF) das formações de Enfermagem (T2 - Colaboradora Tânia)',
    descricao: 'Contactar a Enf.ª Tânia para colheita dos registos de presença RPF de Enfermagem referentes ao 2º Trimestre.',
    periodicidade: 'trimestral',
    mes: 6,
    trimestre: 2,
    prazoDescritivo: 'Final de Junho',
    dataLimite: `${ano}-06-30`,
    concluida: true,
    dataConclusao: `${ano}-06-27`,
    responsavel: 'Interlocutor RAD',
    acaoRapidaTipo: 'email_enfermagem_tania',
    prioridade: 'alta'
  },

  // Trimestre 3
  {
    id: `task-${ano}-trim-t3-1`,
    ano,
    titulo: 'Fazer relatório trimestral (3º Trimestre) e enviar o mesmo e os dados do período para os Responsáveis da qualidade',
    descricao: 'Avaliação da evolução das horas no terceiro trimestre e reporte aos Responsáveis da qualidade.',
    periodicidade: 'trimestral',
    mes: 9,
    trimestre: 3,
    prazoDescritivo: 'Final de Setembro',
    dataLimite: `${ano}-09-30`,
    concluida: true,
    dataConclusao: `${ano}-09-29`,
    responsavel: 'Responsável da Qualidade / RAD',
    acaoRapidaTipo: 'relatorio_trimestral',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-trim-t3-2`,
    ano,
    titulo: 'Atualizar o plano de formações (3º Trimestre)',
    descricao: 'Aferir desvios face ao plano anual e sinalizar formações obrigatórias ainda não realizadas.',
    periodicidade: 'trimestral',
    mes: 9,
    trimestre: 3,
    prazoDescritivo: 'Final de Setembro',
    dataLimite: `${ano}-09-30`,
    concluida: true,
    dataConclusao: `${ano}-09-30`,
    responsavel: 'Coordenação de Formação',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-trim-t3-3`,
    ano,
    titulo: 'Solicitar à Enfermagem o Registo de Presença de Formandos (RPF) das formações de Enfermagem (T3 - Colaboradora Tânia)',
    descricao: 'Solicitar os documentos e presenças das formações de Enfermagem do terceiro trimestre à Enf.ª Tânia.',
    periodicidade: 'trimestral',
    mes: 9,
    trimestre: 3,
    prazoDescritivo: 'Final de Setembro',
    dataLimite: `${ano}-09-30`,
    concluida: true,
    dataConclusao: `${ano}-09-26`,
    responsavel: 'Interlocutor RAD',
    acaoRapidaTipo: 'email_enfermagem_tania',
    prioridade: 'alta'
  },

  // Trimestre 4 (Fecho)
  {
    id: `task-${ano}-trim-t4-1`,
    ano,
    titulo: 'Fazer relatório trimestral e anual final e enviar para os Responsáveis da qualidade',
    descricao: 'Emissão do Relatório Anual Final de Desempenho e Formação Hospitalar do Serviço de Radioterapia.',
    periodicidade: 'trimestral',
    mes: 12,
    trimestre: 4,
    prazoDescritivo: 'Final de Dezembro',
    dataLimite: `${ano}-12-31`,
    concluida: false,
    responsavel: 'Responsável da Qualidade / RAD',
    acaoRapidaTipo: 'relatorio_anual',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-trim-t4-2`,
    ano,
    titulo: 'Atualizar e fechar o plano anual de formações (4º Trimestre)',
    descricao: 'Validação final de cumprimento do PNF e preparação do fecho estatístico anual.',
    periodicidade: 'trimestral',
    mes: 12,
    trimestre: 4,
    prazoDescritivo: 'Final de Dezembro',
    dataLimite: `${ano}-12-31`,
    concluida: false,
    responsavel: 'Coordenação de Formação',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-trim-t4-3`,
    ano,
    titulo: 'Solicitar à Enfermagem o Registo de Presença de Formandos (RPF) das formações de Enfermagem (T4 - Colaboradora Tânia)',
    descricao: 'Colheita final de todos os RPF e comprovativos de enfermagem com a Enf.ª Tânia para fechar o ano civil.',
    periodicidade: 'trimestral',
    mes: 12,
    trimestre: 4,
    prazoDescritivo: 'Final de Dezembro',
    dataLimite: `${ano}-12-20`,
    concluida: false,
    responsavel: 'Interlocutor RAD',
    acaoRapidaTipo: 'email_enfermagem_tania',
    prioridade: 'alta'
  },

  // ─── 3. TAREFAS MENSAIS / PERIÓDICAS (Operacional Contínuo) ───
  // Outubro (Mês Corrente)
  {
    id: `task-${ano}-mes-10-form`,
    ano,
    titulo: 'Atualizar registo geral de formações do mês (Outubro)',
    descricao: 'Inserir no RadForm todas as ações formativas decorridas no mês de Outubro com cargas horárias e participantes.',
    periodicidade: 'mensal',
    mes: 10,
    trimestre: 4,
    prazoDescritivo: 'Até dia 31 de Outubro',
    dataLimite: `${ano}-10-31`,
    concluida: false,
    responsavel: 'Operador RadForm / Qualidade',
    acaoRapidaTipo: 'atualizar_formacoes',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-mes-10-buro`,
    ano,
    titulo: 'Atualizar e validar burocracias das ações de formação concluídas (Outubro)',
    descricao: 'Validar documentos obrigatórios na Matriz (RPF, Sumários, Certificados, A6) para ações de Outubro.',
    periodicidade: 'mensal',
    mes: 10,
    trimestre: 4,
    prazoDescritivo: 'Até dia 31 de Outubro',
    dataLimite: `${ano}-10-31`,
    concluida: false,
    responsavel: 'Responsável da Qualidade',
    acaoRapidaTipo: 'atualizar_burocracias',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-mes-10-cert`,
    ano,
    titulo: 'Monitorizar receção de certificados de colaboradores (Regra dos 3 Meses)',
    descricao: 'Verificar ações realizadas há 90 dias sem certificado anexado e notificar formandos para cumprimento do prazo.',
    periodicidade: 'mensal',
    mes: 10,
    trimestre: 4,
    prazoDescritivo: 'Mensal',
    dataLimite: `${ano}-10-31`,
    concluida: false,
    responsavel: 'Equipa de Formação RAD',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-mes-10-enf`,
    ano,
    titulo: 'Enviar email a solicitar as formações de enfermagem para o colaborador Tânia (Outubro)',
    descricao: 'Contacto regular com a Enf.ª Tânia para receção dos dados das formações de enfermagem em curso.',
    periodicidade: 'mensal',
    mes: 10,
    trimestre: 4,
    prazoDescritivo: 'Até dia 25 de Outubro',
    dataLimite: `${ano}-10-25`,
    concluida: false,
    responsavel: 'Interlocutor RAD',
    acaoRapidaTipo: 'email_enfermagem_tania',
    prioridade: 'alta'
  },

  // Novembro
  {
    id: `task-${ano}-mes-11-form`,
    ano,
    titulo: 'Atualizar registo geral de formações do mês (Novembro)',
    descricao: 'Inserir no RadForm as formações realizadas no mês de Novembro.',
    periodicidade: 'mensal',
    mes: 11,
    trimestre: 4,
    prazoDescritivo: 'Até dia 30 de Novembro',
    dataLimite: `${ano}-11-30`,
    concluida: false,
    responsavel: 'Operador RadForm / Qualidade',
    acaoRapidaTipo: 'atualizar_formacoes',
    prioridade: 'alta'
  },
  {
    id: `task-${ano}-mes-11-buro`,
    ano,
    titulo: 'Atualizar e validar burocracias das ações de formação concluídas (Novembro)',
    descricao: 'Conferir matriz documental e validar burocracias de ações de Novembro.',
    periodicidade: 'mensal',
    mes: 11,
    trimestre: 4,
    prazoDescritivo: 'Até dia 30 de Novembro',
    dataLimite: `${ano}-11-30`,
    concluida: false,
    responsavel: 'Responsável da Qualidade',
    acaoRapidaTipo: 'atualizar_burocracias',
    prioridade: 'alta'
  },

  // ─── 4. DURANTE O ANO (Rotinas Contínuas da Imagem - Página 2) ───
  {
    id: `task-${ano}-dur-1`,
    ano,
    titulo: 'Saber quais as formações que irão ocorrer no portal interno e em sites internacionais e adicionar no calendário do Outlook para todos os profissionais',
    descricao: 'Pesquisa periódica de webinars, jornadas ESTRO/SPFM e eventos NAU, replicando os convites na agenda partilhada.',
    periodicidade: 'durante_ano',
    prazoDescritivo: 'Contínuo durante o ano',
    concluida: true,
    dataConclusao: `${ano}-05-15`,
    responsavel: 'Equipa de Formação RAD',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-dur-2`,
    ano,
    titulo: 'Quando existir alguma formação interna, reservar sala para formação atempadamente, solicitando também o retroprojetor e o apontador',
    descricao: 'Gestão logística prévia das sessões presenciais no auditório/sala clínica com o apoio administrativo e multimédia.',
    periodicidade: 'durante_ano',
    prazoDescritivo: 'Sempre que houver formação interna',
    concluida: true,
    dataConclusao: `${ano}-04-10`,
    responsavel: 'Organizador da Sessão / Qualidade',
    prioridade: 'normal'
  },
  {
    id: `task-${ano}-dur-3`,
    ano,
    titulo: 'No dia da formação: (a) Arranjar toda a documentação necessária para a realização da formação; (b) Ir buscar as chaves da sala onde irá decorrer',
    descricao: 'Checklist no próprio dia: imprimir folha de presenças RPF, sumário pedagógico, abrir a sala física e testar equipamentos.',
    periodicidade: 'durante_ano',
    prazoDescritivo: 'No próprio dia de cada formação interna',
    concluida: true,
    dataConclusao: `${ano}-04-12`,
    responsavel: 'Apoio Logístico / Formador',
    prioridade: 'alta'
  }
];
