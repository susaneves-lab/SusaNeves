import "dotenv/config";
import http from "http";
import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AgentMode = "atualidade" | "noticias" | "factcheck";

interface ChatHistoryTurn {
  role: "user" | "model";
  text: string;
}

interface GroundingSource {
  title: string;
  uri: string;
  domain: string;
}

interface DiscoveredRadarEvent {
  titulo: string;
  entidade: string;
  dataInicio: string;
  dataFim?: string;
  local: string;
  formato: "Webinar" | "Presencial" | "Híbrido" | "E-learning";
  ambito: "Nacional" | "Internacional";
  temaPrincipal: string;
  descricao: string;
  destinatariosSugeridos: string[];
  horasEstimadas?: number;
  url: string;
  gratis: boolean;
  custoTexto: string;
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

function extractDomain(uri: string): string {
  try {
    const parsed = new URL(uri);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function extractGroundingData(response: any): {
  sources: GroundingSource[];
  searchQueries: string[];
} {
  const metadata = response?.candidates?.[0]?.groundingMetadata;
  const chunks = Array.isArray(metadata?.groundingChunks)
    ? metadata.groundingChunks
    : [];

  const seenUris = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of chunks) {
    const uri = chunk?.web?.uri;
    if (typeof uri === "string" && uri.trim().length > 0 && !seenUris.has(uri)) {
      seenUris.add(uri);
      const rawTitle =
        typeof chunk?.web?.title === "string" && chunk.web.title.trim().length > 0
          ? chunk.web.title.trim()
          : extractDomain(uri);
      sources.push({
        title: rawTitle,
        uri: uri.trim(),
        domain: extractDomain(uri),
      });
    }
  }

  const rawQueries = Array.isArray(metadata?.webSearchQueries)
    ? metadata.webSearchQueries
    : [];
  const searchQueries: string[] = Array.from(
    new Set<string>(
      rawQueries
        .filter((q: unknown): q is string => typeof q === "string" && q.trim().length > 0)
        .map((q: string) => q.trim())
    )
  );

  return { sources, searchQueries };
}

function buildSystemInstruction(
  mode: AgentMode,
  monitoredThemes: string[],
  monitoredPortals: Array<{ nome: string; url: string }>
): string {
  const todayStr = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const themesContext =
    monitoredThemes.length > 0
      ? `Temas prioritários monitorizados pelo Serviço de Radioterapia: ${monitoredThemes.slice(0, 18).join(", ")}.`
      : "";

  const portalsContext =
    monitoredPortals.length > 0
      ? `Portais científicos e institucionais de referência no Radar: ${monitoredPortals
          .slice(0, 12)
          .map((p) => `${p.nome} (${p.url})`)
          .join("; ")}.`
      : "";

  const baseInstruction = `És o Agente de Inteligência e Pesquisa em Tempo Real do módulo "Radar Futuro" da plataforma RadForm (Serviço de Radioterapia · ULSAR, EPE), com acesso direto à Pesquisa Google em tempo real.
Data atual do sistema: ${todayStr}.
Responde sempre em Português de Portugal (pt-PT), com rigor técnico, clareza executiva e fundamentação factual baseada nos resultados atuais da Pesquisa Google.
${themesContext}
${portalsContext}

Regras essenciais:
1. Usa SEMPRE dados reais e atualizados obtidos através da ferramenta de Pesquisa Google para sustentar datas, acontecimentos recentes, notícias, diretrizes clínicas, congressos ou estatísticas.
2. Cita explicitamente as entidades, publicações ou órgãos de comunicação social e datas relevantes no corpo do texto (ex.: "Segundo a ESTRO em...", "De acordo com dados publicados pela DGS / SNS...").
3. Nunca inventes URLs, datas ou factos não verificados. Quando uma informação ainda não for pública ou estiver em atualização, indica-o com transparência.
4. Podes responder tanto a questões especializadas de Radioterapia, Oncologia, Física Médica, Dosimetria e Saúde como a qualquer tema de atualidade nacional ou internacional solicitado pelo utilizador.`;

  if (mode === "noticias") {
    return `${baseInstruction}

MODO ATIVO: NOTÍCIAS RECENTES & CITAÇÕES.
- Prioriza notícias recentes, comunicados oficiais, artigos científicos recém-publicados e atualizações regulamentares.
- Organiza a resposta com títulos claros, pontos-chave datados e referências explícitas às fontes consultadas.
- Para cada notícia relevante, indica: contexto, data aproximada/exata, entidade/fonte e impacto prático.`;
  }

  if (mode === "factcheck") {
    return `${baseInstruction}

MODO ATIVO: VERIFICAÇÃO DE FACTOS (FACT-CHECKING).
- Analisa rigorosamente a afirmação, notícia, estatística ou dúvida apresentada pelo utilizador cruzando múltiplas fontes fidedignas via Pesquisa Google.
- Inicia SEMPRE a resposta com uma linha de veredito destacada num destes formatos exatos:
  **Veredito: VERIFICADO (Verdadeiro)**
  **Veredito: PARCIALMENTE VERDADEIRO (Carece de Contexto)**
  **Veredito: FALSO / CONTRADITO PELAS EVIDÊNCIAS**
  **Veredito: SEM EVIDÊNCIA CONCLUSIVA / EM ATUALIZAÇÃO**
- De seguida, apresenta:
  1. **Resumo Executivo da Verificação** (2-3 frases diretas).
  2. **Evidências e Factos Apurados** (dados concretos, datas e consenso científico/oficial).
  3. **Fontes de Referência Consultadas** (entidades oficiais, estudos ou imprensa de referência).`;
  }

  return `${baseInstruction}

MODO ATIVO: DEBATE DE ATUALIDADE & RADAR DO FUTURO.
- Discute acontecimentos atuais, tendências emergentes, avanços tecnológicos, congressos futuros e temas da atualidade com profundidade analítica.
- Relaciona, quando pertinente, o impacto para profissionais de saúde/radioterapia ou apresenta uma síntese objetiva e contextualizada se for um tema de atualidade geral.`;
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      // Do not retry auth / invalid request / quota errors
      if (status === 400 || status === 401 || status === 403 || status === 404 || status === 429) {
        throw err;
      }
      if (attempt < maxRetries) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function formatGeminiError(err: any): { status: number; error: string } {
  const msg = String(err?.message || err || "");
  const status = Number(err?.status || err?.code || 500);

  if (msg === "MISSING_API_KEY" || status === 401 || status === 403 || msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      error:
        "A chave da API Gemini não está configurada ou é inválida. Verifique a chave no painel Settings > Secrets do AI Studio.",
    };
  }

  if (status === 429 || msg.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      error:
        "Limite de pedidos da API atingido temporariamente (Quota Exhausted). Aguarde alguns segundos ou selecione uma chave com faturação ativa em Settings > Secrets.",
    };
  }

  return {
    status: 500,
    error: "Não foi possível concluir a pesquisa em tempo real neste momento. Tente novamente dentro de instantes.",
  };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "2mb" }));

  // Healthcheck
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // 1. Conversational Agent grounded with real-time Google Search
  app.post("/api/radar/agent", async (req: Request, res: Response) => {
    try {
      const {
        message,
        history = [],
        mode = "atualidade",
        monitoredThemes = [],
        monitoredPortals = [],
      } = req.body as {
        message?: string;
        history?: ChatHistoryTurn[];
        mode?: AgentMode;
        monitoredThemes?: string[];
        monitoredPortals?: Array<{ nome: string; url: string }>;
      };

      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "Introduza uma questão ou afirmação para pesquisar." });
        return;
      }

      const ai = getGenAIClient();

      const sanitizedHistory = Array.isArray(history)
        ? history
            .filter(
              (turn) =>
                turn &&
                (turn.role === "user" || turn.role === "model") &&
                typeof turn.text === "string" &&
                turn.text.trim().length > 0
            )
            .slice(-14)
            .map((turn) => ({
              role: turn.role,
              parts: [{ text: turn.text.trim() }],
            }))
        : [];

      const contents = [
        ...sanitizedHistory,
        {
          role: "user" as const,
          parts: [{ text: message.trim() }],
        },
      ];

      const validMode: AgentMode =
        mode === "noticias" || mode === "factcheck" ? mode : "atualidade";

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction: buildSystemInstruction(
              validMode,
              Array.isArray(monitoredThemes) ? monitoredThemes : [],
              Array.isArray(monitoredPortals) ? monitoredPortals : []
            ),
            tools: [{ googleSearch: {} }],
            temperature: validMode === "factcheck" ? 0.2 : 0.4,
          },
        })
      );

      const text =
        response.text?.trim() ||
        "Não foram encontrados resultados textuais para esta consulta.";
      const { sources, searchQueries } = extractGroundingData(response);

      res.json({
        text,
        sources,
        searchQueries,
        mode: validMode,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[/api/radar/agent] Error:", err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.error });
    }
  });

  // 2. Real-time Google Search Discovery for upcoming Radiotherapy / Oncology events
  app.post("/api/radar/discover-events", async (req: Request, res: Response) => {
    try {
      const { theme = "Radioterapia e Oncologia", ambito = "todos" } = req.body as {
        theme?: string;
        ambito?: string;
      };

      const ai = getGenAIClient();
      const todayIso = new Date().toISOString().slice(0, 10);
      const scopeHint =
        ambito === "Nacional"
          ? "em Portugal (sociedades científicas portuguesas, IPO, SPRO, APFMB, hospitais SNS ou universidades portuguesas)"
          : ambito === "Internacional"
          ? "internacionais (ESTRO, ASTRO, IAEA, ESMO, AAPM, ESO)"
          : "nacionais (Portugal) e internacionais (ESTRO, ASTRO, IAEA, ESMO, SPRO, IPO, APFMB)";

      const prompt = `Pesquisa no Google em tempo real congressos, cursos, webinars, simpósios ou jornadas reais e futuras (com data igual ou posterior a ${todayIso}) sobre o tema "${theme}" ${scopeHint}.

Seleciona entre 3 e 5 eventos reais confirmados na pesquisa web.
Devolve um breve resumo introdutório em Português de Portugal (2 frases) seguido OBRIGATORIAMENTE de um bloco de código \`\`\`json contendo um array de objetos com esta estrutura exata:
\`\`\`json
[
  {
    "titulo": "Nome oficial do congresso, curso ou webinar",
    "entidade": "Entidade organizadora (ex: ESTRO, SPRO, IAEA, ASTRO, IPO)",
    "dataInicio": "YYYY-MM-DD",
    "dataFim": "YYYY-MM-DD",
    "local": "Cidade, País ou Online",
    "formato": "Presencial",
    "ambito": "Internacional",
    "temaPrincipal": "${theme}",
    "descricao": "Resumo factual do programa, público-alvo e relevância clínica/científica.",
    "destinatariosSugeridos": ["MR", "TSDT", "FIS", "ENF"],
    "horasEstimadas": 16,
    "url": "https://...",
    "gratis": false,
    "custoTexto": "Sob Inscrição Oficial"
  }
]
\`\`\`
Regras estritas para os campos:
- "formato" tem de ser apenas um destes: "Webinar", "Presencial", "Híbrido" ou "E-learning".
- "ambito" tem de ser "Nacional" (se em Portugal) ou "Internacional".
- "destinatariosSugeridos" usa siglas de: "MR", "ENF", "TSDT", "FIS", "AT", "TAS".
- "dataInicio" no formato YYYY-MM-DD (se apenas o mês/ano for conhecido, usa o dia 01 desse mês).
- Usa apenas eventos reais encontrados na pesquisa Google.`;

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
          },
        })
      );

      const rawText = response.text || "";
      const { sources, searchQueries } = extractGroundingData(response);

      let events: DiscoveredRadarEvent[] = [];
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)```/i) ||
        rawText.match(/(\[\s*\{[\s\S]*\}\s*\])/);

      if (jsonMatch?.[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (Array.isArray(parsed)) {
            events = parsed
              .filter((item) => item && typeof item.titulo === "string")
              .map((item, idx) => {
                const fallbackSource = sources[idx]?.uri || sources[0]?.uri || "https://www.estro.org";
                const rawUrl =
                  typeof item.url === "string" && item.url.startsWith("http")
                    ? item.url
                    : fallbackSource;

                const validFormatos = ["Webinar", "Presencial", "Híbrido", "E-learning"];
                const formato = validFormatos.includes(item.formato)
                  ? item.formato
                  : "Presencial";

                const validGrupos = ["MR", "ENF", "TSDT", "FIS", "AT", "TAS", "AO"];
                const destinatarios = Array.isArray(item.destinatariosSugeridos)
                  ? item.destinatariosSugeridos.filter((g: string) => validGrupos.includes(g))
                  : ["MR", "TSDT", "FIS", "ENF"];

                return {
                  titulo: String(item.titulo).trim(),
                  entidade: String(item.entidade || "Sociedade Científica").trim(),
                  dataInicio:
                    typeof item.dataInicio === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.dataInicio)
                      ? item.dataInicio
                      : todayIso,
                  dataFim:
                    typeof item.dataFim === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.dataFim)
                      ? item.dataFim
                      : undefined,
                  local: String(item.local || "Consultar Portal Oficial").trim(),
                  formato,
                  ambito: item.ambito === "Nacional" ? "Nacional" : "Internacional",
                  temaPrincipal: String(item.temaPrincipal || theme).trim(),
                  descricao: String(item.descricao || "").trim(),
                  destinatariosSugeridos: destinatarios.length > 0 ? destinatarios : ["MR", "TSDT", "FIS"],
                  horasEstimadas: Number(item.horasEstimadas) > 0 ? Number(item.horasEstimadas) : 8,
                  url: rawUrl,
                  gratis: Boolean(item.gratis),
                  custoTexto: String(
                    item.custoTexto || (item.gratis ? "Gratuito" : "Sob Inscrição")
                  ).trim(),
                };
              });
          }
        } catch (parseErr) {
          console.warn("[/api/radar/discover-events] JSON parse warning:", parseErr);
        }
      }

      const summary = rawText.replace(/```json[\s\S]*?```/gi, "").trim();

      res.json({
        summary,
        events,
        sources,
        searchQueries,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[/api/radar/discover-events] Error:", err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.error });
    }
  });

  // Vite middleware in dev, static serving in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const hmrDisabled = process.env.DISABLE_HMR === "true";

    const vite = await createViteServer({
      plugins: [
        {
          name: "radform-safe-vite-ws",
          enforce: "post",
          transform(code: string, id: string) {
            if (!id.includes("client/client.mjs")) return null;

            let patched = code.replace(
              'throw new SendBeforeConnectError("send was called before connect");',
              "return;"
            );

            if (hmrDisabled) {
              patched = patched
                .replace(
                  "transport.connect(createHMRHandler(handleMessage));",
                  "/* HMR WebSocket disabled */"
                )
                .replace(
                  "setupForwardConsoleHandler(transport, forwardConsole);",
                  "/* forwardConsole disabled */"
                );
            } else {
              patched = patched
                .replace(
                  "transport.connect(createHMRHandler(handleMessage));",
                  "transport.connect(createHMRHandler(handleMessage)).catch(() => {});"
                )
                .replaceAll(
                  "console.error(`[vite] failed to connect to websocket",
                  "console.debug(`[vite] failed to connect to websocket"
                );
            }

            return { code: patched, map: null };
          },
        },
      ],
      server: {
        middlewareMode: { server: httpServer },
        ws: hmrDisabled ? false : { server: httpServer },
        allowedHosts: true,
        forwardConsole: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`RadForm Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
