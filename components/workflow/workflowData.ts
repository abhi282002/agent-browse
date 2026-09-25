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
      "Goal: \"Monitor Nike sneaker prices & alert on drops > 20%\"",
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
    actionSummary: "Mapping product cards, price selectors and CTA buttons",
    url: "https://nike.com/w/shoes-y7ok",
    cursorTarget: { x: 58, y: 24, label: "input#search_bar" },
    logLines: [
      "CDP session connected: Chromium 128.0.0 (Isolated VM)",
      "Indexed 124 interactable anchors & 8 product price nodes",
      "Resolved selector: span[data-test='product-price'] (confidence: 0.97)",
    ],
    metrics: [
      { label: "DOM Nodes", value: "3,812" },
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
    actionSummary: "Scrolling product grid & clicking Air Max 270 listing",
    url: "https://nike.com/t/air-max-270",
    cursorTarget: { x: 74, y: 48, label: "btn[add-to-cart]" },
    logLines: [
      "mouse.scroll({ deltaY: 480, smooth: true })",
      "mouse.moveTo(x: 388, y: 210, { bezierJitter: true })",
      "mouse.click() -> Product detail page loaded (200 OK)",
    ],
    metrics: [
      { label: "Keystrokes", value: "8 keys" },
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
    actionSummary: "Verifying price extracted without CAPTCHA or cookie wall",
    url: "https://nike.com/t/air-max-270",
    cursorTarget: { x: 50, y: 65, label: "div.price-display" },
    logLines: [
      "Checking networkIdle0: 0 pending HTTP requests",
      "Vision assertion: price node matched template ($67.49 detected)",
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
    description: "Serializes scraped records into validated JSON and triggers a webhook to the client dashboard.",
    actionSummary: "Exporting 12 products with prices, deltas & stock status",
    url: "agent://artifacts/price_report.json",
    cursorTarget: { x: 80, y: 78, label: "export_json_payload" },
    logLines: [
      "Extracted 12 products: title, price, delta, stock, URL",
      "Schema validated against PriceMonitorSchema (Zod)",
      "Webhook delivered: POST 200 -> client dashboard notified",
    ],
    metrics: [
      { label: "Records", value: "12 items" },
      { label: "Export Size", value: "18.2 KB" },
    ],
  },
];

