export interface WorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  category: string;
  badge: string;
  description: string;
  actionSummary: string;
  url: string;
  cursorTarget?: { x: number; y: number; label: string };
  logLines: string[];
  metrics: { label: string; value: string }[];
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Goal Ingestion & Planning",
    category: "LLM Planner",
    badge: "Intent",
    description: "Decomposes natural language commands into a deterministic execution graph.",
    actionSummary: "Generating DOM navigation heuristics & step milestones",
    url: "agent://orchestrator/v1/init",
    cursorTarget: { x: 28, y: 35, label: "parse_user_intent()" },
    logLines: [
      "agent.init() -> Session context allocated",
      "Goal: \"Search top arxiv reasoning papers & extract PDFs\"",
      "DAG generated: 5 sub-tasks identified with checkpoint gates",
    ],
    metrics: [
      { label: "Planning Latency", value: "84ms" },
      { label: "Confidence", value: "99.4%" },
    ],
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "DOM Grounding & Element Mapping",
    category: "Vision & CDP",
    badge: "Perception",
    description: "Connects to headless Chromium via CDP, snapshots accessibility tree and interactive coordinates.",
    actionSummary: "Mapping semantic inputs and verifying clickability",
    url: "https://arxiv.org/list/cs.AI/recent",
    cursorTarget: { x: 58, y: 24, label: "input#query_search" },
    logLines: [
      "CDP session connected: Chromium 128.0.0 (Isolated VM)",
      "Indexed 38 interactable anchors & 2 input forms",
      "Resolved selector: input[name='search_query'] (confidence: 0.98)",
    ],
    metrics: [
      { label: "DOM Nodes", value: "1,248" },
      { label: "Grounding", value: "12ms" },
    ],
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Synthetic Action Execution",
    category: "Action Engine",
    badge: "Execution",
    description: "Dispatches human-like mouse movements, simulated keystrokes, and scroll events.",
    actionSummary: "Typing 'Reasoning Models' and triggering search",
    url: "https://arxiv.org/search/advanced",
    cursorTarget: { x: 74, y: 48, label: "btn[type='submit']" },
    logLines: [
      "keyboard.type('Reasoning Models', { delay: 35ms })",
      "mouse.moveTo(x: 482, y: 190, { bezierJitter: true })",
      "mouse.click() -> Triggering AJAX response",
    ],
    metrics: [
      { label: "Keystrokes", value: "16 keys" },
      { label: "HTTP Status", value: "200 OK" },
    ],
  },
  {
    id: "step-4",
    stepNumber: 4,
    title: "Visual Diff & Self-Correction",
    category: "Safety & Guardrails",
    badge: "Verification",
    description: "Evaluates screenshot diffs, checks network idle status, and recovers from unexpected modal popups.",
    actionSummary: "Verifying table content rendered without Captcha roadblocks",
    url: "https://arxiv.org/search/advanced?q=Reasoning",
    cursorTarget: { x: 50, y: 65, label: "div.results-list" },
    logLines: [
      "Checking networkIdle0: 0 pending HTTP requests",
      "Vision assertion: results table successfully matched template",
      "Anti-bot checkpoint: passed (fingerprint entropy: low)",
    ],
    metrics: [
      { label: "Visual Match", value: "100%" },
      { label: "Captcha Flag", value: "0 Clean" },
    ],
  },
  {
    id: "step-5",
    stepNumber: 5,
    title: "Structured Extraction & Export",
    category: "Artifact Engine",
    badge: "Extraction",
    description: "Serializes queried records into validated JSON and creates a session video recording artifact.",
    actionSummary: "Extracting 15 PDF URLs, metadata & generating signed download bundle",
    url: "agent://artifacts/export_bundle.json",
    cursorTarget: { x: 80, y: 78, label: "export_json_payload" },
    logLines: [
      "Extracted 15 paper entries with title, authors, DOI, PDF url",
      "Schema validated against ArxivSearchResultSchema (Zod)",
      "Webhook delivered: POST 200 -> client dashboard notified",
    ],
    metrics: [
      { label: "Records", value: "15 papers" },
      { label: "Export Size", value: "32.4 KB" },
    ],
  },
];
