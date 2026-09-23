import type { Edge } from '@xyflow/react';
import type { WorkflowBlueprint } from '@/components/workflow/flow/types';

export const DEFAULT_WORKFLOW_SEEDS: WorkflowBlueprint[] = [
  {
    id: 'wf-news-intelligence',
    name: 'News Intelligence & Executive Briefing',
    description:
      'Connects to target news portal, extracts the top 5 stories from each of 7 supported categories via Browserbase Search & Fetch APIs, synthesizes structured briefings via Gemini, and delivers via email.',
    category: 'News Intelligence',
    targetUrl: 'https://timesofindia.indiatimes.com/',
    status: 'idle',
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: 'news-1',
        type: 'workflowStep',
        position: { x: 50, y: 120 },
        data: {
          stepNumber: 1,
          title: 'Open News Portal',
          category: 'Navigation',
          badge: 'Browser',
          description:
            'Navigates to the target news site and verifies DOM settlement with anti-bot shielding.',
          actionSummary: 'Opening target news portal and verifying navigation',
          url: 'https://timesofindia.indiatimes.com/',
          status: 'idle',
          metrics: [{ label: 'Wait Mode', value: 'domcontentloaded' }],
          logLines: ['Target portal navigation initiated'],
          archetype: 'open_url',
        },
      },
      {
        id: 'news-2',
        type: 'workflowStep',
        position: { x: 360, y: 120 },
        data: {
          stepNumber: 2,
          title: 'Extract 7 Categories Info',
          category: 'Search & Fetch',
          badge: 'Browserbase API',
          description:
            'Searches and extracts the top 5 articles from each supported category (AI & Technology, India, World, Business & Economy, Science & Space, Education & Careers, Sports) using Browserbase Search and Fetch APIs.',
          actionSummary:
            'Querying Browserbase Search & Fetch APIs for 5 stories across 7 categories',
          metrics: [
            { label: 'Categories', value: '7 Topics' },
            { label: 'Stories / Category', value: '5' },
            { label: 'Engine', value: 'Browserbase API' },
          ],
          url: 'https://timesofindia.indiatimes.com/',
          status: 'idle',
          logLines: ['Search & Fetch multi-category extraction initialized'],
          archetype: 'news_gather',
        },
      },
      {
        id: 'news-3',
        type: 'workflowStep',
        position: { x: 670, y: 120 },
        data: {
          stepNumber: 3,
          title: 'Summarize with Gemini API',
          category: 'AI Synthesis',
          badge: 'Gemini 2.5',
          description:
            'Synthesizes gathered stories into categorized intelligence briefs with heading, subheading, and concise text bullets.',
          actionSummary: 'Generating executive briefs via Gemini 2.5 Flash',
          url: 'agent://ai/gemini-2.5-flash',
          status: 'idle',
          metrics: [{ label: 'Model', value: 'Gemini 2.5 Flash' }],
          logLines: ['AI summarization pipeline initialized'],
          archetype: 'news_summary',
        },
      },
      {
        id: 'news-4',
        type: 'workflowStep',
        position: { x: 980, y: 120 },
        data: {
          stepNumber: 4,
          title: 'Send Executive Briefing Email',
          category: 'Delivery',
          badge: 'Resend API',
          description:
            'Compiles styled HTML newsletter briefing and dispatches to recipient inbox via Resend.',
          actionSummary: 'Dispatching executive newsletter via Resend',
          url: 'mailto:executive-briefing@agentbrowse.internal',
          status: 'idle',
          metrics: [{ label: 'Delivery', value: 'Resend' }],
          logLines: ['Email dispatch engine initialized'],
          archetype: 'email',
        },
      },
    ],
    edges: [
      {
        id: 'e-news-1-2',
        source: 'news-1',
        target: 'news-2',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      },
      {
        id: 'e-news-2-3',
        source: 'news-2',
        target: 'news-3',
        animated: true,
        style: { stroke: '#71717a', strokeWidth: 2 },
      },
      {
        id: 'e-news-3-4',
        source: 'news-3',
        target: 'news-4',
        animated: true,
        style: { stroke: '#71717a', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'wf-arxiv-research',
    name: 'Arxiv Research & PDF Extraction',
    description:
      'Autonomously searches scientific papers on Arxiv, traverses pagination, resolves PDF links, and exports schema-validated JSON records.',
    category: 'Academic Research',
    targetUrl: 'https://arxiv.org/list/cs.AI/recent',
    status: 'idle',
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: 'arxiv-1',
        type: 'workflowStep',
        position: { x: 50, y: 120 },
        data: {
          stepNumber: 1,
          title: 'Navigate to Arxiv',
          category: 'Navigation',
          badge: 'Browser',
          description: 'Navigates to Arxiv CS.AI recent paper listings.',
          actionSummary: 'Opening https://arxiv.org/list/cs.AI/recent',
          url: 'https://arxiv.org/list/cs.AI/recent',
          status: 'idle',
          metrics: [{ label: 'Protocol', value: 'CDP v128' }],
          logLines: ['Arxiv initialized'],
          archetype: 'open_url',
        },
      },
      {
        id: 'arxiv-2',
        type: 'workflowStep',
        position: { x: 360, y: 120 },
        data: {
          stepNumber: 2,
          title: 'Extract Paper Listings',
          category: 'Data Extraction',
          badge: 'Scraper',
          description:
            'Extracts paper titles, authors, and abstract links from the page.',
          actionSummary: 'Parsing paper metadata table',
          url: 'https://arxiv.org/list/cs.AI/recent',
          status: 'idle',
          metrics: [{ label: 'Items', value: '25 papers' }],
          logLines: ['Parsing entries'],
          archetype: 'extraction',
        },
      },
    ],
    edges: [
      {
        id: 'e-arxiv-1-2',
        source: 'arxiv-1',
        target: 'arxiv-2',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'wf-ecommerce-monitor',
    name: 'GPU & Hardware Price Monitor',
    description:
      'Monitors real-time stock levels, solves bot captchas, navigates multi-retailer inventory tables, and triggers webhook alerts.',
    category: 'Price Intelligence',
    targetUrl: 'https://bestbuy.com/site/computer-cards-components',
    status: 'idle',
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: 'ecom-1',
        type: 'workflowStep',
        position: { x: 50, y: 120 },
        data: {
          stepNumber: 1,
          title: 'Session Initialization',
          category: 'CDP Session',
          badge: 'Browser',
          description:
            'Spawns headless Chrome with custom canvas fingerprinting resistance.',
          actionSummary:
            'Allocating clean proxy pool & spoofing hardware specs',
          url: 'https://bestbuy.com/site/computer-cards-components',
          status: 'idle',
          metrics: [{ label: 'Proxy Latency', value: '32ms' }],
          logLines: ['Proxy session authenticated'],
          archetype: 'open_url',
        },
      },
      {
        id: 'ecom-2',
        type: 'workflowStep',
        position: { x: 360, y: 120 },
        data: {
          stepNumber: 2,
          title: 'Product Search & Filter',
          category: 'DOM Action',
          badge: 'Perception',
          description:
            "Inputs search query 'RTX 4090' and applies stock availability filters.",
          actionSummary: "Clicking 'In Stock Only' checkbox",
          url: 'https://bestbuy.com/site/computer-cards-components',
          status: 'idle',
          metrics: [{ label: 'Items Filtered', value: '128' }],
          logLines: ['Filters dispatched'],
        },
      },
      {
        id: 'ecom-3',
        type: 'workflowStep',
        position: { x: 670, y: 120 },
        data: {
          stepNumber: 3,
          title: 'Extract Price Matrix',
          category: 'Scraper',
          badge: 'Extraction',
          description:
            'Parses SKU prices, calculates discount margin, and flags deals under MSRP.',
          actionSummary: 'Serializing items into discount telemetry array',
          url: 'agent://artifacts/prices.json',
          status: 'idle',
          metrics: [{ label: 'Deals Found', value: '3 SKUs' }],
          logLines: ['Discount engine run'],
        },
      },
    ],
    edges: [
      {
        id: 'ee-1-2',
        source: 'ecom-1',
        target: 'ecom-2',
        animated: true,
        style: { stroke: '#71717a', strokeWidth: 2 },
      },
      {
        id: 'ee-2-3',
        source: 'ecom-2',
        target: 'ecom-3',
        animated: true,
        style: { stroke: '#71717a', strokeWidth: 2 },
      },
    ],
  },
];
