import type { NodeTemplate } from "../types";

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    archetype: "navigation",
    title: "Navigate to Web Page",
    category: "Navigation",
    badge: "CDP Nav",
    description: "Navigates to target URL, monitors network idle, and waits for DOM ready state.",
    actionSummary: "Opening target page and verifying HTTP 200 status",
    defaultMetrics: [
      { label: "Status", value: "200 OK" },
      { label: "Nav Latency", value: "62ms" },
    ],
    defaultLogs: [
      "Page.navigate() -> URL dispatched",
      "Network.responseReceived: HTTP 200 OK",
      "Page.loadEventFired: DOM interactive",
    ],
  },
  {
    archetype: "grounding",
    title: "DOM Grounding & Vision",
    category: "Vision & CDP",
    badge: "Perception",
    description: "Snapshots accessibility tree, captures 1080p viewport diff, and indexes interactable nodes.",
    actionSummary: "Mapping interactable anchors and verifying bounding boxes",
    defaultMetrics: [
      { label: "Indexed Nodes", value: "48 targets" },
      { label: "Confidence", value: "98.9%" },
    ],
    defaultLogs: [
      "Accessibility.getFullAXTree() computed",
      "Identified primary search container",
      "Coordinate map generated: 48 interactable elements",
    ],
  },
  {
    archetype: "action",
    title: "Dispatch Action & Keystrokes",
    category: "Action Engine",
    badge: "Action",
    description: "Performs human-like mouse movements, clicks targeted element, or types simulated input.",
    actionSummary: "Dispatching input keystrokes with randomized jitter",
    defaultMetrics: [
      { label: "Keystrokes", value: "24 chars" },
      { label: "Jitter", value: "±15ms" },
    ],
    defaultLogs: [
      "Input.dispatchMouseEvent(moved, { bezier: true })",
      "Input.dispatchKeyEvent(rawKeyDown, 'Enter')",
      "Triggered AJAX state update",
    ],
  },
  {
    archetype: "form",
    title: "Form Submission & Roadblocks",
    category: "Auth & Form",
    badge: "Form",
    description: "Fills login or data forms, solves Cloudflare/Turnstile challenges, and verifies session cookies.",
    actionSummary: "Injecting credentials into password/email fields",
    defaultMetrics: [
      { label: "Fields Filled", value: "3 inputs" },
      { label: "Captcha", value: "Passed" },
    ],
    defaultLogs: [
      "Resolved form[data-testid='login-form']",
      "Populated email and encrypted token",
      "Session authenticated -> Cookie saved",
    ],
  },
  {
    archetype: "extraction",
    title: "Extract Structured Data",
    category: "Data Scraper",
    badge: "Extraction",
    description: "Queries repeater rows or article lists, normalizes attributes, and validates against Zod schema.",
    actionSummary: "Serializing DOM table records into JSON payload",
    defaultMetrics: [
      { label: "Records", value: "25 rows" },
      { label: "Schema", value: "Valid Zod" },
    ],
    defaultLogs: [
      "Scraping table.results-grid > tr",
      "Extracted fields: title, price, sku, url",
      "25 records validated against schema",
    ],
  },
  {
    archetype: "webhook",
    title: "Export Artifacts & Webhook",
    category: "Artifact Engine",
    badge: "Export",
    description: "Compiles session telemetry, captures WebP session replay video, and triggers webhook endpoint.",
    actionSummary: "Posting extraction payload to webhook destination",
    defaultMetrics: [
      { label: "Payload Size", value: "48.2 KB" },
      { label: "Webhook", value: "POST 200" },
    ],
    defaultLogs: [
      "Artifact created: session_recording.webp",
      "Payload exported to S3 storage bucket",
      "Webhook delivered: 200 OK -> client notified",
    ],
  },
];
