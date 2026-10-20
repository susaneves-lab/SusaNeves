import React, { useState } from 'react';
import { Formacao } from '../types';
import { 
  FileCheck, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  Search, 
  ListCheck, 
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface ImportPnfModalProps {
  isOpen: boolean;
  onClose: () => void;
  formacoes: Formacao[];
  anoAtual: number;
  onAtualizarFormacoesPnf: (formacoesAtualizadas: Formacao[]) => void;
}

// Lista oficial do Plano de Necessidades Formativas (PNF) / Plano Anual de Formação para o Serviço de Radioterapia
export const DEFAULT_PLANO_ANUAL_2026: Array<{
  codigoPlano: string;
  designacao: string;
  categoria: string;
  publicoAlvo: string;
  horasPrevistas: number;
  prioridade: 'Alta' | 'Média' | 'Normal';
}> = [
  {
    codigoPlano: 'PNF-26-01',
    designacao: 'Oncossexualidade no Doente Oncológico',
    categoria: 'Externa',
    publicoAlvo: 'MR, ENF, TSDT',
    horasPrevistas: 8,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-02',
    designacao: 'DIBH - Deep Inspiration Breath Hold em Radioterapia',
    categoria: 'Interna',
    publicoAlvo: 'TSDT, FIS',
    horasPrevistas: 4,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-03',
    designacao: 'Cuidados de Suporte e Radiodermite na Consulta de Enfermagem',
    categoria: 'Enfermagem',
    publicoAlvo: 'ENF',
    horasPrevistas: 6,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-04',
    designacao: 'Comunicação e Relação de Ajuda com o Doente Oncológico',
    categoria: 'ACAF',
    publicoAlvo: 'Todos',
    horasPrevistas: 7,
    prioridade: 'Média'
  },
  {
    codigoPlano: 'PNF-26-05',
    designacao: 'Gestão de Emergências e Suporte Básico de Vida (SBV)',
    categoria: 'Interna',
    publicoAlvo: 'Todos',
    horasPrevistas: 8,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-06',
    designacao: 'Proteção Radiológica Operacional e Dosimetria Clínica',
    categoria: 'Externa',
    publicoAlvo: 'MR, TSDT, FIS',
    horasPrevistas: 12,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-07',
    designacao: 'SBRT / SRS - Radiocirurgia e Radioterapia Estereotáxica',
    categoria: 'Externa',
    publicoAlvo: 'MR, FIS, TSDT',
    horasPrevistas: 16,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-08',
    designacao: 'Boas Práticas de Higiene das Mãos e Controlo de Infeção Hospitalar',
    categoria: 'ACAF',
    publicoAlvo: 'Todos',
    horasPrevistas: 4,
    prioridade: 'Alta'
  },
  {
    codigoPlano: 'PNF-26-09',
    designacao: 'Controlo de Qualidade em Aceleradores Lineares (Linac QC)',
    categoria: 'Interna',
    publicoAlvo: 'FIS, TSDT',
    horasPrevistas: 6,
    prioridade: 'Média'
  },
  {
    codigoPlano: 'PNF-26-10',
    designacao: 'Ergonomia e Movimentação Manual de Doentes na Radioterapia',
    categoria: 'Interna',
    publicoAlvo: 'TAS, TSDT, ENF',
    horasPrevistas: 4,
    prioridade: 'Normal'
  },
  {
    codigoPlano: 'PNF-26-11',
    designacao: 'Inteligência Artificial no Contorno de Órgãos de Risco (OAR)',
    categoria: 'Externa',
    publicoAlvo: 'MR, FIS, TSDT',
    horasPrevistas: 5,
    prioridade: 'Média'
  },
  {
    codigoPlano: 'PNF-26-12',
    designacao: 'Atualização no Sistema de Informação Hospitalar (SONHO / SAM / Glintt)',
    categoria: 'ACAF',
    publicoAlvo: 'AT, ENF',
    horasPrevistas: 4,
    prioridade: 'Normal'
  }
];

export const ImportPnfModal: React.FC<ImportPnfModalProps> = ({
  isOpen,
  onClose,
  formacoes,
  anoAtual,
  onAtualizarFormacoesPnf,
}) => {
  // Lista do Plano Anual carregada
  const [planoAnual, setPlanoAnual] = useState<typeof DEFAULT_PLANO_ANUAL_2026>(DEFAULT_PLANO_ANUAL_2026);
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemCategoria, setNovoItemCategoria] = useState('Externa');
  
  // Estado do resultado da verificação
  const [resultadoVerificacao, setResultadoVerificacao] = useState<{
    executado: boolean;
    validadasSim: Array<{ formacao: Formacao; motivoMatch: string }>;
    validadasNao: Array<{ formacao: Formacao; motivo: string }>;
  } | null>(null);

  if (!isOpen) return null;

  // Executa a verificação automática contra o Plano Anual
  const handleExecutarVerificacao = () => {
    const formacoesDoAno = formacoes.filter(f => f.ano === anoAtual);
    const validadasSim: Array<{ formacao: Formacao; motivoMatch: string }> = [];
    const validadasNao: Array<{ formacao: Formacao; motivo: string }> = [];

    // Normalizador de texto para comparação flexível
    const normalizar = (txt: string) => {
      return txt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .trim();
    };

    formacoesDoAno.forEach((formacao) => {
      const nomeFormacaoNorm = normalizar(formacao.nome);
      const codigoFormacaoNorm = normalizar(formacao.codigo || '');

      let matchedItem: typeof DEFAULT_PLANO_ANUAL_2026[0] | null = null;
      let matchReason = '';

      for (const item of planoAnual) {
        const itemNomeNorm = normalizar(item.designacao);
        const itemCodNorm = normalizar(item.codigoPlano);

        // Correspondência por código
        if (codigoFormacaoNorm && itemCodNorm && codigoFormacaoNorm.includes(itemCodNorm)) {
          matchedItem = item;
          matchReason = `Correspondência pelo código ${item.codigoPlano}`;
          break;
        }

        // Correspondência por nome completo ou substrings significativas
        if (nomeFormacaoNorm.includes(itemNomeNorm) || itemNomeNorm.includes(nomeFormacaoNorm)) {
          matchedItem = item;
          matchReason = `Correspondência com: "${item.designacao}"`;
          break;
        }

        // Correspondência por palavras-chave principais (mais de 4 caracteres)
        const palavrasChave = itemNomeNorm.split(/\s+/).filter(w => w.length > 4);
        const palavrasCoincidentes = palavrasChave.filter(w => nomeFormacaoNorm.includes(w));
        if (palavrasCoincidentes.length >= 2 || (palavrasChave.length === 1 && palavrasCoincidentes.length === 1)) {
          matchedItem = item;
          matchReason = `Palavras-chave coincidentes: "${palavrasCoincidentes.join(', ')}"`;
          break;
        }
      }

      // Se já estava marcada com Sim na semente original ou se houve match
      if (matchedItem) {
        validadasSim.push({ formacao, motivoMatch: matchReason });
      } else if (formacao.incluidaPlanoNecessidades === 'Sim') {
        // Mantém pré-validadas do arquivo de dados
        validadasSim.push({ formacao, motivoMatch: 'Previsto no plano de necessidades inicial' });
      } else {
        validadasNao.push({ formacao, motivo: 'Não consta das rubricas do Plano Anual' });
      }
    });

    setResultadoVerificacao({
      executado: true,
      validadasSim,
      validadasNao
    });
  };

  // Aplica as alterações e grava
  const handleAplicarAlteracoes = () => {
    if (!resultadoVerificacao) return;

    const idsSim = new Set(resultadoVerificacao.validadasSim.map(i => i.formacao.id));
    const idsNao = new Set(resultadoVerificacao.validadasNao.map(i => i.formacao.id));

    const novasFormacoes = formacoes.map(f => {
      if (idsSim.has(f.id)) {
        return { ...f, incluidaPlanoNecessidades: 'Sim' as const };
      }
      if (idsNao.has(f.id)) {
        return { ...f, incluidaPlanoNecessidades: 'Não' as const };
      }
      return f;
    });

    onAtualizarFormacoesPnf(novasFormacoes);
    onClose();
  };

  // Importar ficheiro JSON ou texto
  const handleUploadFicheiro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setPlanoAnual(parsed);
          }
        } else {
          // Linhas de texto ou CSV simples
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          const novosItens = lines.map((linha, idx) => ({
            codigoPlano: `PNF-IMP-${idx + 1}`,
            designacao: linha.replace(/^[0-9.-;,\s]+/, '').trim(),
            categoria: 'Geral',
            publicoAlvo: 'Todos',
            horasPrevistas: 6,
            prioridade: 'Alta' as const
          }));
          setPlanoAnual(novosItens);
        }
      } catch (err) {
        console.error('Erro ao ler plano anual:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleAdicionarItemManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItemNome.trim()) return;

    setPlanoAnual(prev => [
      ...prev,
      {
        codigoPlano: `PNF-26-${prev.length + 1}`,
        designacao: novoItemNome.trim(),
        categoria: novoItemCategoria,
        publicoAlvo: 'Todos',
        horasPrevistas: 6,
        prioridade: 'Alta'
      }
    ]);
    setNovoItemNome('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header do Modal */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-teal-200" />
            <div>
              <h2 className="text-base font-bold">
                Importação do Plano Anual de Formações & Verificação Automática (PNF)
              </h2>
              <p className="text-xs text-teal-100/90">
                Verifica automaticamente se cada formação realizada consta do plano anual aprovado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white rounded-md cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          
          {/* Instruções e Carregamento de Ficheiro */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ListCheck className="w-4 h-4 text-teal-700" />
                  <span>Plano Anual Carregado ({planoAnual.length} Ações Formativas Aprovadas)</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Pode utilizar o plano anual hospitalar padrão, carregar um novo ficheiro ou adicionar rubricas manualmente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Importar Ficheiro (JSON/CSV)</span>
                  <input
                    type="file"
                    accept=".json,.csv,.txt"
                    onChange={handleUploadFicheiro}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleExecutarVerificacao}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer transition-colors active:scale-98"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Executar Verificação Automática</span>
                </button>
              </div>
            </div>

            {/* Adicionar Rápido */}
            <form onSubmit={handleAdicionarItemManual} className="flex gap-2 pt-2 border-t border-slate-200">
              <input
                type="text"
                placeholder="Adicionar nova ação prevista ao Plano Anual (ex: Proteção Radiológica em Braquiterapia)..."
                value={novoItemNome}
                onChange={(e) => setNovoItemNome(e.target.value)}
                className="flex-1 p-2 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={novoItemCategoria}
                onChange={(e) => setNovoItemCategoria(e.target.value)}
                className="p-2 bg-white border border-slate-300 rounded-md text-xs"
              >
                <option value="Externa">Externa</option>
                <option value="Interna">Interna</option>
                <option value="Enfermagem">Enfermagem</option>
                <option value="ACAF">ACAF</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          </div>

          {/* Se a verificação foi executada, mostra o relatório detalhado */}
          {resultadoVerificacao && (
            <div className="bg-white border-2 border-teal-600 rounded-lg p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Resultado da Verificação Automática do Plano Anual (Ciclo {anoAtual})
                  </h3>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    {resultadoVerificacao.validadasSim.length} com Sim (No Plano)
                  </span>
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
                    {resultadoVerificacao.validadasNao.length} com Não (Fora do Plano)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Validadas com Sim */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Validadas com "Sim" ({resultadoVerificacao.validadasSim.length})</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-emerald-100">
                    {resultadoVerificacao.validadasSim.map(({ formacao, motivoMatch }) => (
                      <div key={formacao.id} className="pt-1.5 first:pt-0">
                        <div className="font-semibold text-slate-900 leading-snug">{formacao.nome}</div>
                        <div className="text-[10px] text-emerald-800 flex items-center justify-between">
                          <span>{formacao.categoria} · {formacao.data}</span>
                          <span className="font-medium italic">{motivoMatch}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validadas com Não */}
                <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold mb-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Validadas com "Não" ({resultadoVerificacao.validadasNao.length})</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-rose-100">
                    {resultadoVerificacao.validadasNao.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px] py-2">
                        Todas as ações constam do Plano Anual.
                      </p>
                    ) : (
                      resultadoVerificacao.validadasNao.map(({ formacao, motivo }) => (
                        <div key={formacao.id} className="pt-1.5 first:pt-0">
                          <div className="font-semibold text-slate-900 leading-snug">{formacao.nome}</div>
                          <div className="text-[10px] text-rose-800 flex items-center justify-between">
                            <span>{formacao.categoria} · {formacao.data}</span>
                            <span className="font-medium italic">{motivo}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de Aplicação */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <p className="text-[11px] text-slate-500">
                  Ao aplicar, a coluna <strong>"No Plano (PNF)"</strong> de cada formação será atualizada de imediato para <strong>Sim</strong> ou <strong>Não</strong>.
                </p>
                <button
                  onClick={handleAplicarAlteracoes}
                  className="px-4 py-2 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar & Atualizar Formações</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabela do Plano Anual */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Rubricas Atuais do Plano Anual (PNF):</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 text-[11px] text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Código PNF</th>
                    <th className="py-2 px-3">Designação da Ação</th>
                    <th className="py-2 px-2.5">Categoria</th>
                    <th className="py-2 px-2.5">Público</th>
                    <th className="py-2 px-2.5 text-right">Horas</th>
                    <th className="py-2 px-2.5 text-center">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planoAnual.map((item) => (
                    <tr key={item.codigoPlano} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-teal-800">{item.codigoPlano}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{item.designacao}</td>
                      <td className="py-2 px-2.5 text-slate-600">{item.categoria}</td>
                      <td className="py-2 px-2.5 text-slate-600">{item.publicoAlvo}</td>
                      <td className="py-2 px-2.5 text-right font-mono">{item.horasPrevistas} h</td>
                      <td className="py-2 px-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.prioridade === 'Alta' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.prioridade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
