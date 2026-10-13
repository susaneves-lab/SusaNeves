import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Formacao } from '../types';
import { Clock, Calendar, BarChart2, TrendingUp, Award, Layers } from 'lucide-react';

export interface MonthlyDataPoint {
  mesIndex: number; // 0..11
  mesNomeCurto: string;
  mesNomeCompleto: string;
  horas: number;
  acoes: number;
  participantesCount: number;
  acoesPnf: number;
  burocraciaOk: number;
}

interface MonthlyEvolutionBarChartProps {
  formacoes: Formacao[];
  ano: number;
  metaHorasAnual?: number;
  metaAcoesAnual?: number;
  isPrintMode?: boolean;
}

export const MonthlyEvolutionBarChart: React.FC<MonthlyEvolutionBarChartProps> = ({
  formacoes,
  ano,
  metaHorasAnual = 875,
  metaAcoesAnual = 35,
  isPrintMode = false
}) => {
  const [metricaAtiva, setMetricaAtiva] = useState<'horas' | 'acoes' | 'duplo'>('horas');
  const [mesHover, setMesHover] = useState<MonthlyDataPoint | null>(null);

  const nomesMesesCurto = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const nomesMesesCompleto = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Agregação dos dados mensais
  const dadosMensais: MonthlyDataPoint[] = useMemo(() => {
    const doAno = formacoes.filter(f => f.ano === ano);
    
    return nomesMesesCurto.map((curto, idx) => {
      const mesNum = idx + 1;
      const formacoesDoMes = doAno.filter(f => {
        if (!f.data) return false;
        const match = f.data.match(/\d{4}-(\d{2})-\d{2}/);
        if (match) {
          return parseInt(match[1], 10) === mesNum;
        }
        return false;
      });

      const horas = formacoesDoMes.reduce((sum, f) => sum + (f.horas || 0), 0);
      const acoes = formacoesDoMes.length;
      const participantesCount = formacoesDoMes.reduce((sum, f) => sum + (f.colaboradores?.length || 0), 0);
      const acoesPnf = formacoesDoMes.filter(f => f.incluidaPlanoNecessidades === 'Sim').length;
      const burocraciaOk = formacoesDoMes.filter(f => f.burocracia).length;

      return {
        mesIndex: idx,
        mesNomeCurto: curto,
        mesNomeCompleto: nomesMesesCompleto[idx],
        horas: Math.round(horas * 10) / 10,
        acoes,
        participantesCount,
        acoesPnf,
        burocraciaOk
      };
    });
  }, [formacoes, ano]);

  // Totais e estatísticas
  const totalHorasAno = useMemo(() => dadosMensais.reduce((s, m) => s + m.horas, 0), [dadosMensais]);
  const totalAcoesAno = useMemo(() => dadosMensais.reduce((s, m) => s + m.acoes, 0), [dadosMensais]);
  const mediaMensalHoras = Math.round((totalHorasAno / 12) * 10) / 10;
  const mediaMensalAcoes = Math.round((totalAcoesAno / 12) * 10) / 10;

  const mesMaisAtivoHoras = useMemo(() => {
    return [...dadosMensais].sort((a, b) => b.horas - a.horas)[0];
  }, [dadosMensais]);

  // Dimensões do Gráfico D3
  const width = 760;
  const height = 300;
  const margin = { top: 32, right: 30, bottom: 42, left: 52 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Escalas D3
  const xScale = useMemo(() => {
    return d3.scaleBand<string>()
      .domain(dadosMensais.map(d => d.mesNomeCurto))
      .range([0, innerWidth])
      .padding(metricaAtiva === 'duplo' ? 0.32 : 0.38);
  }, [dadosMensais, innerWidth, metricaAtiva]);

  // Escala Y para Horas
  const maxHoras = Math.max(d3.max(dadosMensais, d => d.horas) || 20, 20);
  const yScaleHoras = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, maxHoras * 1.18])
      .nice()
      .range([innerHeight, 0]);
  }, [maxHoras, innerHeight]);

  // Escala Y para Ações
  const maxAcoes = Math.max(d3.max(dadosMensais, d => d.acoes) || 6, 6);
  const yScaleAcoes = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, maxAcoes * 1.25])
      .nice()
      .range([innerHeight, 0]);
  }, [maxAcoes, innerHeight]);

  // Meta mensal calculada
  const metaHorasMensal = Math.round(metaHorasAnual / 12);
  const metaAcoesMensal = Math.round(metaAcoesAnual / 12);

  // Ticks para eixos
  const ticksYHoras = yScaleHoras.ticks(5);
  const ticksYAcoes = yScaleAcoes.ticks(5);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 print:border-slate-300 print:shadow-none print:p-3">
      
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Evolução Mensal das Formações ({ano}) · Análise D3
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribuição temporal do volume de horas e frequência de ações formativas ao longo dos 12 meses
          </p>
        </div>

        {/* Controlo de Métrica (Oculto em Impressão) */}
        {!isPrintMode && (
          <div className="no-print inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setMetricaAtiva('horas')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricaAtiva === 'horas'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>Horas (h)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricaAtiva('acoes')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricaAtiva === 'acoes'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-blue-700" />
              <span>Ações (Qtd)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricaAtiva('duplo')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricaAtiva === 'duplo'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-700" />
              <span>Combinado</span>
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas gerado com D3 Scales e Geometria Vetorial */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[340px] font-sans select-none"
          style={{ minWidth: '600px' }}
        >
          {/* Definições de Gradientes SVG Profissionais */}
          <defs>
            <linearGradient id="gradBarraHoras" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.80" />
            </linearGradient>

            <linearGradient id="gradBarraAcoes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.80" />
            </linearGradient>

            <linearGradient id="gradBarraHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#042f2e" stopOpacity="1" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Área interna com translação de margem */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            
            {/* Linhas de Grade Horizontais */}
            {(metricaAtiva === 'horas' ? ticksYHoras : ticksYAcoes).map(tick => {
              const y = metricaAtiva === 'horas' ? yScaleHoras(tick) : yScaleAcoes(tick);
              return (
                <g key={tick} className="text-slate-200">
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={-8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400 font-semibold"
                  >
                    {tick}
                    {metricaAtiva === 'horas' ? 'h' : ''}
                  </text>
                </g>
              );
            })}

            {/* Linha de Meta / Média de Referência */}
            {metricaAtiva === 'horas' && (
              <g className="text-amber-500">
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={yScaleHoras(mediaMensalHoras)}
                  y2={yScaleHoras(mediaMensalHoras)}
                  stroke="#d97706"
                  strokeDasharray="5 4"
                  strokeWidth="1.5"
                />
                <text
                  x={innerWidth - 6}
                  y={yScaleHoras(mediaMensalHoras) - 6}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-amber-700 font-bold"
                >
                  Média: {mediaMensalHoras}h/mês
                </text>
              </g>
            )}

            {metricaAtiva === 'acoes' && (
              <g className="text-blue-500">
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={yScaleAcoes(mediaMensalAcoes)}
                  y2={yScaleAcoes(mediaMensalAcoes)}
                  stroke="#2563eb"
                  strokeDasharray="5 4"
                  strokeWidth="1.5"
                />
                <text
                  x={innerWidth - 6}
                  y={yScaleAcoes(mediaMensalAcoes) - 6}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-blue-700 font-bold"
                >
                  Média: {mediaMensalAcoes} ações/mês
                </text>
              </g>
            )}

            {/* Renderização das Barras D3 por Mês */}
            {dadosMensais.map((d) => {
              const xBand = xScale(d.mesNomeCurto) || 0;
              const bandWidth = xScale.bandwidth();
              const isHovered = mesHover?.mesIndex === d.mesIndex;

              if (metricaAtiva === 'horas') {
                const barHeight = Math.max(0, innerHeight - yScaleHoras(d.horas));
                const yPos = yScaleHoras(d.horas);

                return (
                  <g 
                    key={d.mesIndex}
                    onMouseEnter={() => setMesHover(d)}
                    onMouseLeave={() => setMesHover(null)}
                    className="cursor-pointer transition-opacity"
                  >
                    {/* Barra de Horas */}
                    <rect
                      x={xBand}
                      y={yPos}
                      width={bandWidth}
                      height={barHeight}
                      rx={3}
                      ry={3}
                      fill={isHovered ? 'url(#gradBarraHover)' : 'url(#gradBarraHoras)'}
                      className="transition-all duration-200"
                    />

                    {/* Rótulo Numérico no Topo da Barra */}
                    {d.horas > 0 && (
                      <text
                        x={xBand + bandWidth / 2}
                        y={Math.max(12, yPos - 5)}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-teal-900"
                      >
                        {d.horas}h
                      </text>
                    )}
                  </g>
                );
              }

              if (metricaAtiva === 'acoes') {
                const barHeight = Math.max(0, innerHeight - yScaleAcoes(d.acoes));
                const yPos = yScaleAcoes(d.acoes);

                return (
                  <g 
                    key={d.mesIndex}
                    onMouseEnter={() => setMesHover(d)}
                    onMouseLeave={() => setMesHover(null)}
                    className="cursor-pointer transition-opacity"
                  >
                    {/* Barra de Ações */}
                    <rect
                      x={xBand}
                      y={yPos}
                      width={bandWidth}
                      height={barHeight}
                      rx={3}
                      ry={3}
                      fill={isHovered ? '#1e3a8a' : 'url(#gradBarraAcoes)'}
                      className="transition-all duration-200"
                    />

                    {/* Rótulo Numérico */}
                    {d.acoes > 0 && (
                      <text
                        x={xBand + bandWidth / 2}
                        y={Math.max(12, yPos - 5)}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-blue-900"
                      >
                        {d.acoes}
                      </text>
                    )}
                  </g>
                );
              }

              // Modo Combinado: Barras Lado a Lado
              const subWidth = bandWidth / 2 - 1.5;
              const barHeightHoras = Math.max(0, innerHeight - yScaleHoras(d.horas));
              const yPosHoras = yScaleHoras(d.horas);

              const barHeightAcoes = Math.max(0, innerHeight - yScaleAcoes(d.acoes));
              const yPosAcoes = yScaleAcoes(d.acoes);

              return (
                <g 
                  key={d.mesIndex}
                  onMouseEnter={() => setMesHover(d)}
                  onMouseLeave={() => setMesHover(null)}
                  className="cursor-pointer"
                >
                  {/* Barra 1: Horas */}
                  <rect
                    x={xBand}
                    y={yPosHoras}
                    width={subWidth}
                    height={barHeightHoras}
                    rx={2.5}
                    fill="url(#gradBarraHoras)"
                  />
                  {d.horas > 0 && (
                    <text
                      x={xBand + subWidth / 2}
                      y={Math.max(10, yPosHoras - 4)}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-teal-900"
                    >
                      {d.horas}h
                    </text>
                  )}

                  {/* Barra 2: Ações */}
                  <rect
                    x={xBand + subWidth + 3}
                    y={yPosAcoes}
                    width={subWidth}
                    height={barHeightAcoes}
                    rx={2.5}
                    fill="url(#gradBarraAcoes)"
                  />
                  {d.acoes > 0 && (
                    <text
                      x={xBand + subWidth + 3 + subWidth / 2}
                      y={Math.max(10, yPosAcoes - 4)}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-blue-900"
                    >
                      {d.acoes}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Eixo Horizontal (X) */}
            <line
              x1={0}
              x2={innerWidth}
              y1={innerHeight}
              y2={innerHeight}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {dadosMensais.map(d => {
              const xPos = (xScale(d.mesNomeCurto) || 0) + xScale.bandwidth() / 2;
              const isSelected = mesHover?.mesIndex === d.mesIndex;
              return (
                <text
                  key={d.mesIndex}
                  x={xPos}
                  y={innerHeight + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold transition-colors ${
                    isSelected ? 'fill-teal-700 font-bold' : 'fill-slate-600'
                  }`}
                >
                  {d.mesNomeCurto}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Tooltip Interativo ao Passar o Rato */}
        {mesHover && !isPrintMode && (
          <div className="no-print absolute top-3 right-4 bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700 backdrop-blur-xs min-w-[200px] pointer-events-none animate-in fade-in duration-100">
            <div className="font-bold border-b border-slate-700 pb-1 text-teal-300 flex items-center justify-between">
              <span>{mesHover.mesNomeCompleto} {ano}</span>
              <span className="text-[10px] text-slate-400 font-mono">Mês {mesHover.mesIndex + 1}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Volume Horário:</span>
              <strong className="font-mono text-teal-400 text-sm">{mesHover.horas} h</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Ações Formativas:</span>
              <strong className="font-mono text-blue-400 text-sm">{mesHover.acoes} ações</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Participações:</span>
              <span className="font-mono text-slate-200">{mesHover.participantesCount} colaboradores</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Conformidade PNF:</span>
              <span className="font-mono text-emerald-400">{mesHover.acoesPnf}/{mesHover.acoes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legendas e Indicadores Resumo D3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-100">
          <span className="text-[11px] text-teal-800 font-medium block">Total Anual Realizado</span>
          <strong className="text-base font-bold font-mono text-teal-950 block mt-0.5">
            {totalHorasAno} h ({totalAcoesAno} ações)
          </strong>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Média Mensal</span>
          <strong className="text-base font-bold font-mono text-slate-900 block mt-0.5">
            {mediaMensalHoras} h / mês
          </strong>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
          <span className="text-[11px] text-amber-800 font-medium block">Mês de Pico Horário</span>
          <strong className="text-base font-bold font-mono text-amber-950 block mt-0.5">
            {mesMaisAtivoHoras ? `${mesMaisAtivoHoras.mesNomeCurto} (${mesMaisAtivoHoras.horas}h)` : '-'}
          </strong>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <span className="text-[11px] text-blue-800 font-medium block">Cumprimento da Meta</span>
          <strong className="text-base font-bold font-mono text-blue-950 block mt-0.5">
            {metaHorasAnual > 0 ? Math.round((totalHorasAno / metaHorasAnual) * 100) : 0}% da meta
          </strong>
        </div>
      </div>

    </div>
  );
};
