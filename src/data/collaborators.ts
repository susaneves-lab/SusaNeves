import { Colaborador, CertificacaoObrigatoria, Formacao } from '../types';

export const DATA_LIMITE_LISTA_MARCO_2026 = '2026-03-03';

export const INITIAL_COLABORADORES: Colaborador[] = [
  // Técnicos Auxiliares de Saúde (TAS)
  {
    id: 'col-1',
    nome: 'Bárbara Micaela Ortega Macedo',
    sigla: 'BOM',
    numMecanografico: '34532',
    categoriaProfissional: 'TAS',
    cargo: 'Técnica Auxiliar de Saúde',
    email: 'barbaraomacedo@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrada a 10-03-25 e Saiu a 01-08-26',
    metaHorasAnual: 30
  },
  {
    id: 'col-2',
    nome: 'Carla Maria Ribeiro Rosário Pinto',
    sigla: 'CRP',
    numMecanografico: '30716',
    categoriaProfissional: 'TAS',
    cargo: 'Técnica Auxiliar de Saúde',
    email: 'carlarpinto@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 30
  },
  {
    id: 'col-3',
    nome: 'Filipa Alexandra Gonçalves Ferrão',
    sigla: 'FGF',
    numMecanografico: '34182',
    categoriaProfissional: 'TAS',
    cargo: 'Técnica Auxiliar de Saúde',
    email: 'filipagferrao@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrou a 01-04-2025',
    metaHorasAnual: 30
  },
  {
    id: 'col-4',
    nome: 'Maria Amélia Plácido Martins',
    sigla: 'MAM',
    numMecanografico: '33000',
    categoriaProfissional: 'TAS',
    cargo: 'Técnica Auxiliar de Saúde',
    email: 'mariaapmartins@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 30
  },
  {
    id: 'col-5',
    nome: 'Maria de Lurdes Marcelino Monteiro Soares',
    sigla: 'LMS',
    numMecanografico: '32084',
    categoriaProfissional: 'TAS',
    cargo: 'Técnica Auxiliar de Saúde',
    email: 'mariamsoares@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 30
  },

  // Assistentes Técnicos (AT)
  {
    id: 'col-6',
    nome: 'Ana Isabel Vieira Milhinhos',
    sigla: 'AVM',
    numMecanografico: '32198',
    categoriaProfissional: 'AT',
    cargo: 'Assistente Técnica',
    email: 'anavmilhinhos@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-7',
    nome: 'Edite Carina Silva Tavares',
    sigla: 'EST',
    numMecanografico: '34743',
    categoriaProfissional: 'AT',
    cargo: 'Assistente Técnica',
    email: 'editestavares@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-8',
    nome: 'Hernâni Franklim Évora Rodrigues',
    sigla: 'HER',
    numMecanografico: '32475',
    categoriaProfissional: 'AT',
    cargo: 'Assistente Técnico',
    email: 'hernanierodrigues@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-9',
    nome: 'Sílvia Cristina Silveiro Cardoso Gomes de Sousa',
    sigla: 'SGS',
    numMecanografico: '35161',
    categoriaProfissional: 'AT',
    cargo: 'Assistente Técnica',
    email: 'silviascardoso@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },

  // Enfermagem (ENF)
  {
    id: 'col-10',
    nome: 'Ana Catarina de Jesus Alcaria',
    sigla: 'ACA',
    numMecanografico: '31506',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'anaalcaria@ulsar.min-saude.pt',
    estadoProfissional: 'Ausente: Baixa',
    ativo: false,
    observacoes: 'Baixa desde 2024',
    metaHorasAnual: 35
  },
  {
    id: 'col-11',
    nome: 'Ana Raquel Ramos Feijão',
    sigla: 'ARF',
    numMecanografico: '32270',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira Especialista em Oncologia',
    email: 'anafeijao@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-12',
    nome: 'Elisabete da Conceição Barradas Dias',
    sigla: 'EBD',
    numMecanografico: '31222',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'elisabetebdias@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-13',
    nome: 'Elsa Sofia Jorge Alves',
    sigla: 'EJA',
    numMecanografico: '31795',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'elsasalves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-14',
    nome: 'Maria Manuel Castilho Romão Madaleno',
    sigla: 'MMM',
    numMecanografico: '31033',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'mariarmadaleno@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-15',
    nome: 'Sandra Isabel Rodrigues Pimenta',
    sigla: 'SRP',
    numMecanografico: '30554',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'sandrarpimenta@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrou a 01-04-2026',
    metaHorasAnual: 35
  },
  {
    id: 'col-16',
    nome: 'Tânia Isabel Espadinha de Matos Vitoriano',
    sigla: 'TMV',
    numMecanografico: '32168',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'taniavitoriano@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },

  // Física (FIS)
  {
    id: 'col-17',
    nome: 'Ana Sofia Lourenço de Oliveira Pinheiro',
    sigla: 'AOP',
    numMecanografico: '32807',
    categoriaProfissional: 'FIS',
    cargo: 'Física Médica',
    email: 'anaopinheiro@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 45
  },
  {
    id: 'col-18',
    nome: 'Edgar Alexandre Piazendim Ferreira da Mota e Sousa',
    sigla: 'EMS',
    numMecanografico: '35374',
    categoriaProfissional: 'FIS',
    cargo: 'Físico Médico',
    email: 'edgarmsousa@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrou a 23-02-2026',
    metaHorasAnual: 45
  },
  {
    id: 'col-19',
    nome: 'João Miguel Esteves Ramos',
    sigla: 'JER',
    numMecanografico: '34475',
    categoriaProfissional: 'FIS',
    cargo: 'Físico Médico',
    email: 'joaoeramos@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 45
  },

  // Médicos (MR)
  {
    id: 'col-20',
    nome: 'Ana Isabel Martins Pimenta',
    sigla: 'AMP',
    numMecanografico: '34714',
    categoriaProfissional: 'MR',
    cargo: 'Médica Radioncologista',
    email: 'anampimenta@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },
  {
    id: 'col-21',
    nome: 'Cláudia dos Santos Viveiros',
    sigla: 'CSV',
    numMecanografico: '34422',
    categoriaProfissional: 'MR',
    cargo: 'Médica Radioncologista',
    email: 'claudiasviveiros@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },
  {
    id: 'col-22',
    nome: 'João Henrique Vera Ulrich',
    sigla: 'JVU',
    numMecanografico: '34643',
    categoriaProfissional: 'MR',
    cargo: 'Médico Radioncologista',
    email: 'joaovulrich@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },
  {
    id: 'col-23',
    nome: 'Maria Inmaculada Maldonado Pareja',
    sigla: 'IMP',
    numMecanografico: '32707',
    categoriaProfissional: 'MR',
    cargo: 'Médica Radioncologista',
    email: 'inmaculadamaldonado@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },

  // Terapeutas Dosimetria (TSDT)
  {
    id: 'col-24',
    nome: 'Carla Sofia Gonçalves Borges',
    sigla: 'CGB',
    numMecanografico: '33992',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'carlagborges@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-25',
    nome: 'Jorge Manuel Duarte Faria',
    sigla: 'JDF',
    numMecanografico: '32798',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'jorgedfaria@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-26',
    nome: 'Liliana Isabel Tomé Martins',
    sigla: 'LTM',
    numMecanografico: '32728',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'lilianamartins@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-27',
    nome: 'Vanessa Alexandra Baptista Esteves',
    sigla: 'VBE',
    numMecanografico: '32940',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'vanessaesteves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },

  // Terapeutas Unidade (TSDT)
  {
    id: 'col-28',
    nome: 'Ana Margarida da Silva Lopes',
    sigla: 'AML',
    numMecanografico: '33334',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'anaslopes@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-29',
    nome: 'Andreia Susana Rico da Silva Neves',
    sigla: 'ASN',
    numMecanografico: '32727',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'andreiasneves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-30',
    nome: 'Eliana Filipa Pais Gomes Lima',
    sigla: 'EGL',
    numMecanografico: '34909',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'elianaglima@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-31',
    nome: 'Irina dos Reis Lourenço',
    sigla: 'IRL',
    numMecanografico: '32729',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'irinarlourenco@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-32',
    nome: 'Joana Isabel Gonçalves Pereira',
    sigla: 'JIP',
    numMecanografico: '35363',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'joanagpereira@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrou a 09-02-2026',
    metaHorasAnual: 35
  },
  {
    id: 'col-33',
    nome: 'Lina Márcia Custódio Silva',
    sigla: 'LCS',
    numMecanografico: '32239',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'linacsilva@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-34',
    nome: 'Lúcia de Fátima Letras Rodrigues',
    sigla: 'LLR',
    numMecanografico: '34642',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'lucialrodrigues@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-35',
    nome: 'Magda Gonçalves Tavares',
    sigla: 'MGT',
    numMecanografico: '32115',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'magdagtavares@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-36',
    nome: 'Marco Nuno Silva Meneses',
    sigla: 'MSM',
    numMecanografico: '32238',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'marcosmeneses@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-37',
    nome: 'Maria João Batista Colaço',
    sigla: 'MJC',
    numMecanografico: '32116',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'mariacpaiva@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-38',
    nome: 'Sara Joana Santos Alves',
    sigla: 'SSA',
    numMecanografico: '32310',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'sarasalves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-39',
    nome: 'Sónia Cristina Guerra Baptista',
    sigla: 'SGB',
    numMecanografico: '32162',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'soniagbatista@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-40',
    nome: 'Vera Mónica Amaro Vieira',
    sigla: 'VAV',
    numMecanografico: '32163',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'veraavieira@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  }
];

// Lista exclusiva para o ano de 2026 até à data 03-03-2026 (inclusive)
export const INITIAL_COLABORADORES_ATE_MARCO_2026: Colaborador[] = [
  // Enfermeiros (ENF)
  {
    id: 'col-m26-1',
    nome: 'Ana Catarina de Jesus Alcaria',
    sigla: 'ACA',
    numMecanografico: '31506',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'anaalcaria@ulsar.min-saude.pt',
    estadoProfissional: 'Ausente: Baixa',
    ativo: false,
    observacoes: 'Ausente: Baixa',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-2',
    nome: 'Ana Raquel Ramos Feijão',
    sigla: 'ARF',
    numMecanografico: '32270',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira Especialista em Oncologia',
    email: 'anafeijao@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Especialista em Oncologia',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-3',
    nome: 'Elisabete da Conceição Barradas Dias',
    sigla: 'ECD',
    numMecanografico: '31222',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'elisabetebdias@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-4',
    nome: 'Elsa Sofia Jorge Alves',
    sigla: 'ESA',
    numMecanografico: '31795',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'elsasalves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-5',
    nome: 'Maria Manuel Castilho Romão Madaleno',
    sigla: 'MMM',
    numMecanografico: '31033',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'mariarmadaleno@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-6',
    nome: 'Tânia Isabel Espadinha de Matos Vitoriano',
    sigla: 'TIV',
    numMecanografico: '32168',
    categoriaProfissional: 'ENF',
    cargo: 'Enfermeira',
    email: 'taniavitoriano@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },

  // Físicos (FIS)
  {
    id: 'col-m26-7',
    nome: 'Ana Sofia Lourenço de Oliveira Pinheiro',
    sigla: 'ASP',
    numMecanografico: '32807',
    categoriaProfissional: 'FIS',
    cargo: 'Física Médica',
    email: 'anaopinheiro@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 45
  },
  {
    id: 'col-m26-8',
    nome: 'Edgar Alexandre Piazentim Ferreira da Mota e Sousa',
    sigla: 'EAS',
    numMecanografico: '35374',
    categoriaProfissional: 'FIS',
    cargo: 'Físico Médico',
    email: 'edgarmsousa@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrou a 23-02-2026',
    metaHorasAnual: 45
  },
  {
    id: 'col-m26-9',
    nome: 'João Miguel Esteves Ramos',
    sigla: 'JMR',
    numMecanografico: '34475',
    categoriaProfissional: 'FIS',
    cargo: 'Físico Médico',
    email: 'joaoeramos@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 45
  },

  // Médicos Radioncologistas (MR)
  {
    id: 'col-m26-10',
    nome: 'Ana Isabel Martins Pimenta',
    sigla: 'AIP',
    numMecanografico: '34714',
    categoriaProfissional: 'MR',
    cargo: 'Médica Radioncologista',
    email: 'anampimenta@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },
  {
    id: 'col-m26-11',
    nome: 'Cláudia dos Santos Viveiros',
    sigla: 'CSV',
    numMecanografico: '34422',
    categoriaProfissional: 'MR',
    cargo: 'Médica Radioncologista',
    email: 'claudiasviveiros@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },
  {
    id: 'col-m26-12',
    nome: 'João Henrique Vera Ulrich',
    sigla: 'JHU',
    numMecanografico: '34643',
    categoriaProfissional: 'MR',
    cargo: 'Médico Radioncologista',
    email: 'joaovulrich@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },
  {
    id: 'col-m26-13',
    nome: 'Maria Inmaculada Maldonado Pareja',
    sigla: 'MIP',
    numMecanografico: '32707',
    categoriaProfissional: 'MR',
    cargo: 'Médica Radioncologista',
    email: 'inmaculadamaldonado@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 50
  },

  // Terapeutas de Dosimetria (TSDT)
  {
    id: 'col-m26-14',
    nome: 'Carla Sofia Gonçalves Borges',
    sigla: 'CSB',
    numMecanografico: '33992',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'carlagborges@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-m26-15',
    nome: 'Jorge Manuel Duarte Faria',
    sigla: 'JMF',
    numMecanografico: '32798',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'jorgedfaria@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-m26-16',
    nome: 'Liliana Isabel Tomé Martins',
    sigla: 'LIM',
    numMecanografico: '32728',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'lilianamartins@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-m26-17',
    nome: 'Vanessa Alexandra Baptista Esteves',
    sigla: 'VAE',
    numMecanografico: '32940',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Dosimetria',
    email: 'vanessaesteves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },

  // Terapeutas de Unidade de Radioterapia (TSDT)
  {
    id: 'col-m26-18',
    nome: 'Ana Margarida da Silva Lopes',
    sigla: 'AML',
    numMecanografico: '33334',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'anaslopes@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-19',
    nome: 'Andreia Susana Rico da Silva Neves',
    sigla: 'ASN',
    numMecanografico: '32727',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'andreiasneves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 40
  },
  {
    id: 'col-m26-20',
    nome: 'Eliana Filipa Pais Gomes Lima',
    sigla: 'EFL',
    numMecanografico: '34909',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'elianaglima@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-21',
    nome: 'Irina dos Reis Lourenço',
    sigla: 'IRL',
    numMecanografico: '32729',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'irinarlourenco@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-22',
    nome: 'Joana Isabel Gonçalves Pereira',
    sigla: 'JIP',
    numMecanografico: '35363',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'joanagpereira@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: 'Entrou a 09-02-2026',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-23',
    nome: 'Lina Márcia Custódio Silva',
    sigla: 'LMS',
    numMecanografico: '32239',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'linacsilva@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-24',
    nome: 'Lúcia de Fátima Letras Rodrigues',
    sigla: 'LFR',
    numMecanografico: '34642',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'lucialrodrigues@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-25',
    nome: 'Magda Gonçalves Tavares',
    sigla: 'MGT',
    numMecanografico: '32115',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'magdagtavares@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-26',
    nome: 'Marco Nuno Silva Meneses',
    sigla: 'MNM',
    numMecanografico: '32238',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'marcosmeneses@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-27',
    nome: 'Maria João Batista Colaço',
    sigla: 'MJC',
    numMecanografico: '32116',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'mariacpaiva@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-28',
    nome: 'Sara Joana Santos Alves',
    sigla: 'SJA',
    numMecanografico: '32310',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'sarasalves@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-29',
    nome: 'Sónia Cristina Guerra Baptista',
    sigla: 'SCB',
    numMecanografico: '32162',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'soniagbatista@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  },
  {
    id: 'col-m26-30',
    nome: 'Vera Mónica Amaro Vieira',
    sigla: 'VMV',
    numMecanografico: '32163',
    categoriaProfissional: 'TSDT',
    cargo: 'Terapeuta de Unidade de Radioterapia',
    email: 'veraavieira@ulsar.min-saude.pt',
    estadoProfissional: 'Activo',
    ativo: true,
    observacoes: '',
    metaHorasAnual: 35
  }
];

export const extrairDataIso = (dataStr?: string): string | null => {
  if (!dataStr) return null;
  const isoMatch = dataStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const ptMatch = dataStr.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (ptMatch) return `${ptMatch[3]}-${ptMatch[2]}-${ptMatch[1]}`;
  return null;
};

/**
 * Aplica a lista especial apenas no ano 2026 e apenas até à data 03-03-2026 (inclusive).
 * Para todos os restantes anos (e datas após 03-03-2026) mantém a lista atual.
 */
export const usaListaAteMarco2026 = (dataStr?: string, anoContexto?: number): boolean => {
  if (anoContexto !== undefined && anoContexto !== 2026) {
    return false;
  }
  const iso = extrairDataIso(dataStr);
  if (!iso) return false;
  return iso >= '2026-01-01' && iso <= DATA_LIMITE_LISTA_MARCO_2026;
};

export const obterColaboradoresPorData = (
  dataStr: string | undefined,
  anoContexto: number,
  colaboradoresAtuais: Colaborador[],
  colaboradoresAteMarco2026: Colaborador[] = INITIAL_COLABORADORES_ATE_MARCO_2026
): Colaborador[] => {
  return usaListaAteMarco2026(dataStr, anoContexto)
    ? colaboradoresAteMarco2026
    : colaboradoresAtuais;
};

const normalizarNomeComparacao = (nome: string): string =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const encontrarColaboradorEquivalente = (
  alvo: Colaborador,
  listaDestino: Colaborador[]
): Colaborador | undefined => {
  const numMec = alvo.numMecanografico?.trim();
  if (numMec) {
    const porNum = listaDestino.find(c => c.numMecanografico?.trim() === numMec);
    if (porNum) return porNum;
  }
  const email = alvo.email?.trim().toLowerCase();
  if (email) {
    const porEmail = listaDestino.find(c => c.email?.trim().toLowerCase() === email);
    if (porEmail) return porEmail;
  }
  const nomeNorm = normalizarNomeComparacao(alvo.nome || '');
  if (nomeNorm) {
    return listaDestino.find(c => normalizarNomeComparacao(c.nome || '') === nomeNorm);
  }
  return undefined;
};

export const obterSiglaAteMarco2026 = (
  colab: Colaborador,
  colaboradoresAteMarco2026: Colaborador[] = INITIAL_COLABORADORES_ATE_MARCO_2026
): string | null => {
  const eq = encontrarColaboradorEquivalente(colab, colaboradoresAteMarco2026);
  return eq ? eq.sigla : null;
};

export const obterParticipantesDaFormacao = (
  formacao: Formacao,
  colaboradoresAtuais: Colaborador[],
  colaboradoresAteMarco2026: Colaborador[] = INITIAL_COLABORADORES_ATE_MARCO_2026
): Colaborador[] => {
  if (
    !formacao.frequentadaColaboradorRad ||
    !Array.isArray(formacao.colaboradores) ||
    formacao.colaboradores.length === 0
  ) {
    return [];
  }

  const usaMarco = usaListaAteMarco2026(formacao.data, formacao.ano);
  const encontrados = new Map<string, Colaborador>();

  formacao.colaboradores.forEach(siglaRaw => {
    if (typeof siglaRaw !== 'string') return;
    const siglaNorm = siglaRaw.trim().toUpperCase();
    if (!siglaNorm) return;

    if (usaMarco) {
      const colabMarco = colaboradoresAteMarco2026.find(
        c => c.sigla.trim().toUpperCase() === siglaNorm
      );
      if (colabMarco) {
        const equivalenteAtual =
          encontrarColaboradorEquivalente(colabMarco, colaboradoresAtuais) || colabMarco;
        encontrados.set(equivalenteAtual.id, equivalenteAtual);
        return;
      }

      const colabAtualFallback = colaboradoresAtuais.find(
        c => c.sigla.trim().toUpperCase() === siglaNorm
      );
      if (colabAtualFallback) {
        encontrados.set(colabAtualFallback.id, colabAtualFallback);
      }
      return;
    }

    const colabAtual = colaboradoresAtuais.find(
      c => c.sigla.trim().toUpperCase() === siglaNorm
    );
    if (colabAtual) {
      encontrados.set(colabAtual.id, colabAtual);
      return;
    }

    if (formacao.ano === 2026) {
      const colabMarcoFallback = colaboradoresAteMarco2026.find(
        c => c.sigla.trim().toUpperCase() === siglaNorm
      );
      if (colabMarcoFallback) {
        const equivalenteAtual =
          encontrarColaboradorEquivalente(colabMarcoFallback, colaboradoresAtuais) ||
          colabMarcoFallback;
        encontrados.set(equivalenteAtual.id, equivalenteAtual);
      }
    }
  });

  return Array.from(encontrados.values());
};

export const colaboradorParticipouNaFormacao = (
  colab: Colaborador,
  formacao: Formacao,
  colaboradoresAtuais: Colaborador[],
  colaboradoresAteMarco2026: Colaborador[] = INITIAL_COLABORADORES_ATE_MARCO_2026
): boolean => {
  const participantes = obterParticipantesDaFormacao(
    formacao,
    colaboradoresAtuais,
    colaboradoresAteMarco2026
  );
  const numMecAlvo = colab.numMecanografico?.trim();
  return participantes.some(
    p =>
      p.id === colab.id ||
      (Boolean(numMecAlvo) && p.numMecanografico?.trim() === numMecAlvo)
  );
};

export const INITIAL_CERTIFICACOES: CertificacaoObrigatoria[] = [
  {
    id: 'cert-1',
    colaboradorSigla: 'ASN',
    colaboradorNome: 'Andreia Susana Rico da Silva Neves',
    categoriaProfissional: 'TSDT',
    nomeCertificacao: 'Proteção Radiológica Nível II (DGS / APA)',
    dataObtencao: '2021-11-15',
    dataExpiracao: '2026-11-15',
    entidadeCertificadora: 'Agência Portuguesa do Ambiente (APA)',
    estado: 'a_expirar',
    diasParaExpirar: 41,
    observacoes: 'Necessária inscrição no curso de atualização de 5 em 5 anos.'
  },
  {
    id: 'cert-2',
    colaboradorSigla: 'VAV',
    colaboradorNome: 'Vera Mónica Amaro Vieira',
    categoriaProfissional: 'TSDT',
    nomeCertificacao: 'Proteção Radiológica Operacional e Dosimetria',
    dataObtencao: '2021-10-30',
    dataExpiracao: '2026-10-30',
    entidadeCertificadora: 'ACAF / DGS',
    estado: 'a_expirar',
    diasParaExpirar: 25,
    observacoes: 'A aguardar confirmação de sessão de reciclagem.'
  },
  {
    id: 'cert-3',
    colaboradorSigla: 'ARF',
    colaboradorNome: 'Ana Raquel Ramos Feijão',
    categoriaProfissional: 'ENF',
    nomeCertificacao: 'Suporte Básico de Vida com DAE (SBV-DAE)',
    dataObtencao: '2024-10-18',
    dataExpiracao: '2026-10-18',
    entidadeCertificadora: 'INEM / Hospital ULSAR',
    estado: 'a_expirar',
    diasParaExpirar: 13,
    observacoes: 'Renovação bianual prioritária para equipa de enfermagem.'
  },
  {
    id: 'cert-4',
    colaboradorSigla: 'CGB',
    colaboradorNome: 'Carla Sofia Gonçalves Borges',
    categoriaProfissional: 'TSDT',
    nomeCertificacao: 'Acreditação Clínica em SGRT / Catalyst',
    dataObtencao: '2024-03-10',
    dataExpiracao: '2027-03-10',
    entidadeCertificadora: 'C-RAD Medical Systems',
    estado: 'valido',
    diasParaExpirar: 521,
    observacoes: 'Válido até 2027.'
  },
  {
    id: 'cert-5',
    colaboradorSigla: 'AOP',
    colaboradorNome: 'Ana Sofia Lourenço de Oliveira Pinheiro',
    categoriaProfissional: 'FIS',
    nomeCertificacao: 'Certificado de Especialista em Física Médica',
    dataObtencao: '2022-05-20',
    dataExpiracao: '2027-05-20',
    entidadeCertificadora: 'Ordem dos Físicos / EFOMP',
    estado: 'valido',
    diasParaExpirar: 592
  },
  {
    id: 'cert-6',
    colaboradorSigla: 'LMS',
    colaboradorNome: 'Maria de Lurdes Marcelino Monteiro Soares',
    categoriaProfissional: 'TAS',
    nomeCertificacao: 'Boas Práticas e Higienização em Oncologia',
    dataObtencao: '2023-09-01',
    dataExpiracao: '2026-09-01',
    entidadeCertificadora: 'Comissão de Infeção ULSAR',
    estado: 'expirado',
    diasParaExpirar: -34,
    observacoes: 'Expirou há 34 dias! Requer agendamento de reciclagem.'
  }
];
