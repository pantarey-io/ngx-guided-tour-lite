# @pantarey.io/ngx-guided-tour-lite

A lightweight, dependency-free guided tour library for Angular — made for onboarding flows and feature tours.

Used in production at **[pantarey.io](https://pantarey.io)**.

- **Zero dependencies** — only `@angular/core` as peer dependency
- **JSON-driven tours** — define tours as JSON objects or pass a JSON string directly; store tours in a database, load them from an API, or keep them in static files
- **Embedded CSS** — works out of the box, no extra stylesheets to import
- **Fully themeable** — 12 CSS custom properties to match any brand
- **Mobile-ready** — responsive positioning with separate `mobileSteps` for small screens
- **Multi-language** — built-in locale resolution with per-step translations
- **Smart positioning** — auto-repositions when elements move or resize (e.g. accordion, animation)
- **Interactive steps** — gate steps (wait for click → wait for target), typewriter fill, pause & resume
- **Glass-morphism design** — dark, modern popover with blur, gradients, and smooth transitions

## Installation

```bash
npm install @pantarey.io/ngx-guided-tour-lite
```

## Quick Start

```ts
import { GuidedTourService } from '@pantarey.io/ngx-guided-tour-lite';

@Component({ ... })
export class MyComponent {
  private tour = inject(GuidedTourService);

  startTour() {
    this.tour.startTour({
      options: {
        overlayOpacity: 0.6,
        showProgress: true,
      },
      steps: [
        {
          selector: '#step-1',
          side: 'bottom',
          text: {
            en: { title: 'Welcome', description: 'This is the first step.' },
            de: { title: 'Willkommen', description: 'Das ist der erste Schritt.' },
          },
        },
        {
          selector: '#step-2',
          side: 'right',
          text: {
            en: { title: 'Next Feature', description: 'Here is another feature.' },
          },
        },
      ],
      onComplete: () => console.log('Tour finished!'),
    });
  }
}
```

## API

### `GuidedTourService`

Provided in root — just inject it.

| Method | Description |
|---|---|
| `startTour(config)` | Start a tour. Accepts `GuidedTourConfig` object or JSON string. |
| `destroy()` | Stop the tour and clean up. |
| `active` | `Signal<boolean>` — whether a tour is currently running. |

### `GuidedTourConfig`

```ts
interface GuidedTourConfig {
  options?: {
    overlayOpacity?: number;   // Default: 0.6
    allowClose?: boolean;      // Default: true (Escape + click outside)
    showProgress?: boolean;    // Default: false ("1 / 5" counter)
    stagePadding?: number;     // Default: 12
    stageRadius?: number;      // Default: 10
    locale?: string;           // Default: navigator.language
    labels?: GuidedTourLabels; // Default: English
  };
  steps: GuidedTourStep[];
  mobileSteps?: GuidedTourStep[];  // Used when viewport ≤ 600px
  onComplete?: () => void;
}
```

### `GuidedTourStep`

```ts
interface GuidedTourStep {
  selector: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  action?: 'info' | 'gate' | 'pauseAndResume' | 'destroyOnClick' | 'typewriterFill';
  text?: Partial<Record<string, GuidedTourText>>;
  showPopover?: boolean;
  // ... see source for full type
}
```

### Step Actions

| Action | Behavior |
|---|---|
| `info` (default) | Normal step with Next/Back buttons |
| `gate` | Waits for user to click the highlighted element, then waits for `gateSelector` to appear before advancing |
| `pauseAndResume` | Pauses tour on click, polls for `resumeSelector`, then resumes remaining steps |
| `destroyOnClick` | Ends the tour when user clicks the highlighted element |
| `typewriterFill` | Types text into form fields char-by-char, then auto-advances |

### Labels

Override button text for any language:

```ts
{
  options: {
    labels: {
      prev: 'Zurück',
      next: 'Weiter',
      done: 'Fertig',
      close: 'Schließen',
    },
  },
}
```

## Theming

Override CSS custom properties to match your brand:

```css
:root {
  --guided-tour-primary: #3b82f6;        /* Accent color */
  --guided-tour-bg: #1a1a2e;             /* Popover background */
  --guided-tour-text: #fff;              /* Primary text */
  --guided-tour-text-secondary: rgba(255,255,255,.78);
  --guided-tour-text-muted: rgba(255,255,255,.35);
  --guided-tour-border: rgba(255,255,255,.1);
  --guided-tour-divider: rgba(255,255,255,.06);
  --guided-tour-arrow-bg: #1a1a2e;
  --guided-tour-z-index: 10000;
  --guided-tour-max-width: 400px;
  --guided-tour-radius: 16px;
  --guided-tour-font: inherit;
}
```

## Compatibility

- Angular 19+ (uses `signal` from `@angular/core`)
- Works with standalone components and NgModules
- No zone.js dependency

## Used by

<a href="https://pantarey.io">
  <strong>pantarey.io</strong> — Digital workspace for process automation, data management, and AI
</a>

## License

MIT — [Pantarey GmbH](https://pantarey.io)
