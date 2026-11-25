// ==============================================================================
// ReCall AI – Interactive Product Tour Engine (Driver.js)
// ==============================================================================

import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const tourSteps: DriveStep[] = [
  {
    element: '[data-tour="brand"]',
    popover: {
      title: '01 // RECALL PLATFORM',
      description: 'High-density developer memory & knowledge engine. Designed for rapid technical recall, interview prep, and zero-scale cloud architecture.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="how-it-works"]',
    popover: {
      title: '02 // INTERACTIVE TOUR',
      description: 'You clicked this tour! You can re-launch it anytime by clicking "/ how-it-works" or pressing the button. Use Next, Back, or keyboard arrow keys.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="markdown-vault"]',
    popover: {
      title: '03 // GIT-BACKED MARKDOWN VAULT (ZERO-DB)',
      description: 'Zero-DB / Zero-B2 local notes engine! Create, edit, and drop .md files directly into the repository with automated GitHub sync (0.00 Neon CU-hours).',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="job-radar"]',
    popover: {
      title: '04 // AUTONOMOUS TELEGRAM JOB RADAR',
      description: 'Streams real-time developer hiring posts from Telegram. Features an in-memory Eco Mode toggle so your database stays asleep until you hunt for jobs.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="storage"]',
    popover: {
      title: '05 // STORAGE TELEMETRY & DATA SOVEREIGNTY',
      description: 'Inspect live Neon PostgreSQL and Backblaze B2 storage quotas, or export a self-contained offline .zip snapshot containing all your markdown notes.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="ai-tutor"]',
    popover: {
      title: '06 // DUAL-ENGINE AI TUTOR (CTRL+J)',
      description: 'Instant technical mentor powered by Google Gemini 3.5 Flash & Groq. Ask questions, debug code snippets, and practice system design for free.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="knowledge-core"]',
    popover: {
      title: '07 // 3D KNOWLEDGE CORE',
      description: 'Interactive Three.js visualization representing your indexed developer memory graph, skills, and concepts.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="search-bar"]',
    popover: {
      title: '08 // INSTANT RECALL SEARCH',
      description: 'Sub-millisecond filtering across all indexed topics, algorithms, and code solutions with instant real-time search.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="categories"]',
    popover: {
      title: '09 // DOMAIN WORKSPACES',
      description: 'Organize notes by language or concept (Java, React, System Design). Click "+ new category" to create custom rulebooks anytime.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="new-entry"]',
    popover: {
      title: '10 // ADD NEW MEMORY LOG',
      description: 'Add rich technical posts with code snippets, GZIP compression, YouTube video embeds, and PDF document attachments.',
      side: 'top',
      align: 'end',
    },
  },
];

export const startProductTour = () => {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: 'rgba(0, 0, 0, 0.8)',
    stagePadding: 6,
    stageRadius: 3,
    popoverClass: 'recall-tour-popover',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Got It ✓',
    steps: tourSteps,
    onDestroyed: () => {
      try {
        localStorage.setItem('recall_tour_seen', 'true');
      } catch (e) {
        // ignore
      }
    },
  });

  driverObj.drive();
};
