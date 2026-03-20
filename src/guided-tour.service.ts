import {Injectable, signal} from '@angular/core';

// ── Types ──────────────────────────────────────────────────────────

export interface GuidedTourText {
  title: string;
  description?: string;
}

export interface GuidedTourCondition {
  if: {visible?: string; notVisible?: string};
  then?: Partial<GuidedTourStep>;
  else?: Partial<GuidedTourStep>;
}

export interface TypewriterFillEntry {
  /** CSS selector for the input/textarea to fill */
  selector: string;
  /** Text to type into the field */
  text: string;
  /** Delay between characters in ms (default: 35) */
  charDelayMs?: number;
  /** Pause before starting this entry in ms (default: 300) */
  startDelayMs?: number;
}

export interface GuidedTourStep {
  selector: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';

  /** Step behavior — default is 'info' (normal step with buttons) */
  action?: 'info' | 'gate' | 'pauseAndResume' | 'destroyOnClick' | 'typewriterFill';

  /** For gate: selector to wait for after click */
  gateSelector?: string;
  /** For gate: max wait time in ms (default: 8000) */
  gateTimeout?: number;

  /** For pauseAndResume: selector to poll for after click */
  resumeSelector?: string;
  /** For pauseAndResume: max poll time in ms (default: 120000) */
  resumeTimeout?: number;

  /** For typewriterFill: fields to auto-type into */
  typewriterFill?: TypewriterFillEntry[];

  /** Runtime condition — evaluated when step is about to show */
  condition?: GuidedTourCondition;

  /** Bilingual text */
  text?: Partial<Record<string, GuidedTourText>>;

  /** Show popover? (default: true) */
  showPopover?: boolean;
  /** Show specific buttons */
  showButtons?: ('next' | 'prev' | 'close')[];
}

export interface GuidedTourLabels {
  next?: string;
  prev?: string;
  done?: string;
  close?: string;
}

export interface GuidedTourConfig {
  options?: {
    overlayOpacity?: number;
    allowClose?: boolean;
    showProgress?: boolean;
    stagePadding?: number;
    stageRadius?: number;
    /** Language code for step text lookup (default: navigator.language) */
    locale?: string;
    /** Custom button labels (default: English) */
    labels?: GuidedTourLabels;
  };
  steps: GuidedTourStep[];
  mobileSteps?: GuidedTourStep[];
  onComplete?: () => void;
}

// ── Embedded CSS — self-contained, no external SCSS needed ─────────

const TOUR_STYLES = `
.guided-tour-stage{position:fixed;z-index:var(--guided-tour-z-index,10000);box-sizing:border-box;pointer-events:none;transition:top .2s ease,left .2s ease,width .2s ease,height .2s ease}
.guided-tour-active{position:relative!important;z-index:calc(var(--guided-tour-z-index,10000) + 1)!important}
.guided-tour-popover{position:fixed;z-index:calc(var(--guided-tour-z-index,10000) + 2);max-width:var(--guided-tour-max-width,400px);border-radius:var(--guided-tour-radius,16px);padding:24px 24px 20px;font-family:var(--guided-tour-font,inherit);pointer-events:auto;opacity:0;transform:translateY(6px);transition:opacity .2s ease,transform .2s ease;background:var(--guided-tour-bg,radial-gradient(ellipse 500px 300px at 5% 0%,rgba(236,116,4,.06),transparent 60%),linear-gradient(160deg,#1c1c2e 0%,#131320 50%,#0e0e1a 100%));border:1px solid var(--guided-tour-border,rgba(255,255,255,.1));backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 20px 60px rgba(0,0,0,.45),0 4px 16px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.05);color:var(--guided-tour-text,#fff)}
.guided-tour-popover--visible{opacity:1;transform:translateY(0)}
.guided-tour-popover__arrow{position:absolute;width:12px;height:12px;background:var(--guided-tour-arrow-bg,#131320);border:1px solid var(--guided-tour-border,rgba(255,255,255,.1));transform:rotate(45deg)}
.guided-tour-popover__arrow--bottom{top:-7px;border-right:none;border-bottom:none}
.guided-tour-popover__arrow--top{bottom:-7px;border-left:none;border-top:none}
.guided-tour-popover__arrow--right{left:-7px;border-top:none;border-right:none}
.guided-tour-popover__arrow--left{right:-7px;border-bottom:none;border-left:none}
.guided-tour-popover__close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;border:none;background:transparent;color:var(--guided-tour-text-muted,rgba(255,255,255,.3));font-size:18px;font-weight:300;cursor:pointer;display:grid;place-items:center;transition:all .15s ease;line-height:1;padding:0}
.guided-tour-popover__close:hover{background:rgba(255,255,255,.08);color:var(--guided-tour-text-secondary,rgba(255,255,255,.7))}
.guided-tour-popover__title{font-weight:600;font-size:17px;line-height:1.35;letter-spacing:.01em;color:var(--guided-tour-text,#fff);margin:0 0 10px;padding-right:32px}
.guided-tour-popover__progress{color:var(--guided-tour-text-muted,rgba(255,255,255,.35));font-size:11px;font-weight:500;letter-spacing:.03em;margin-bottom:6px}
.guided-tour-popover__description{font-size:14px;line-height:1.7;font-weight:400;color:var(--guided-tour-text-secondary,rgba(255,255,255,.78));margin:0;letter-spacing:.005em}
.guided-tour-popover__footer{margin-top:18px;padding-top:14px;border-top:1px solid var(--guided-tour-divider,rgba(255,255,255,.06));display:flex;align-items:center;justify-content:flex-end;gap:10px}
.guided-tour-popover__btn{height:36px;font-size:13px;font-weight:500;border-radius:8px;padding:0 16px;cursor:pointer;letter-spacing:.01em;transition:all .18s ease;border:none;line-height:36px}
.guided-tour-popover__btn--secondary{border:1px solid var(--guided-tour-border,rgba(255,255,255,.1));background:rgba(255,255,255,.04);color:var(--guided-tour-text-secondary,rgba(255,255,255,.6))}
.guided-tour-popover__btn--secondary:hover{background:rgba(255,255,255,.08);color:var(--guided-tour-text,rgba(255,255,255,.9));border-color:rgba(255,255,255,.18)}
.guided-tour-popover__btn--primary{background:var(--guided-tour-primary,var(--primary-color-500,#ec7404));color:#fff;font-weight:600;box-shadow:0 2px 10px color-mix(in srgb,var(--guided-tour-primary,#ec7404) 25%,transparent)}
.guided-tour-popover__btn--primary:hover{filter:brightness(1.1);box-shadow:0 4px 16px color-mix(in srgb,var(--guided-tour-primary,#ec7404) 35%,transparent);transform:translateY(-1px)}
@media(max-width:600px){.guided-tour-popover{max-width:92vw;padding:20px 18px 16px;border-radius:14px}.guided-tour-popover__title{font-size:16px}}
@media(prefers-reduced-motion:reduce){.guided-tour-stage,.guided-tour-popover,.guided-tour-popover__close,.guided-tour-popover__btn,.guided-tour-active{transition:none!important}}
`;

// ── Service ────────────────────────────────────────────────────────

/**
 * Self-contained guided-tour engine for Angular.
 *
 * Zero external dependencies beyond Angular core.
 * All visuals are injected via an embedded `<style>` block — no SCSS required.
 *
 * ### Theming
 * Override CSS custom properties on `:root` or a parent element:
 * | Property | Default | Purpose |
 * |---|---|---|
 * | `--guided-tour-primary` | `#ec7404` | Accent / primary-button color |
 * | `--guided-tour-bg` | dark glass gradient | Popover background |
 * | `--guided-tour-text` | `#fff` | Title + primary text |
 * | `--guided-tour-text-secondary` | `rgba(255,255,255,.78)` | Description text |
 * | `--guided-tour-text-muted` | `rgba(255,255,255,.35)` | Progress + close icon |
 * | `--guided-tour-border` | `rgba(255,255,255,.1)` | Popover + arrow border |
 * | `--guided-tour-divider` | `rgba(255,255,255,.06)` | Footer divider line |
 * | `--guided-tour-arrow-bg` | `#131320` | Arrow background |
 * | `--guided-tour-z-index` | `10000` | Base z-index (stage) |
 * | `--guided-tour-max-width` | `400px` | Popover max-width |
 * | `--guided-tour-radius` | `16px` | Popover border-radius |
 * | `--guided-tour-font` | `inherit` | Font family |
 *
 * ### Labels
 * Pass `options.labels` to override button text (default: English).
 */
@Injectable({providedIn: 'root'})
export class GuidedTourService {
  /** Whether a tour is currently active */
  readonly active = signal(false);

  // ── DOM elements (created once, reused) ──
  private stage: HTMLDivElement | null = null;
  private popover: HTMLDivElement | null = null;
  private arrow: HTMLDivElement | null = null;
  private stylesInjected = false;

  // ── Tour state ──
  private config: GuidedTourConfig | null = null;
  private steps: GuidedTourStep[] = [];
  private currentIndex = 0;
  private activeElement: HTMLElement | null = null;
  private cleanups: (() => void)[] = [];

  // ── Resume state ──
  private resumeTimer: ReturnType<typeof setTimeout> | null = null;
  private isPausing = false;

  // ── Typewriter state ──
  private typewriterCancelled = false;

  // ── Position watcher (layout-shift guard) ──
  private positionWatchRaf: number | null = null;

  // ── Keyboard handler ref ──
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  // ── Resize handler ──
  private resizeHandler: (() => void) | null = null;

  // ── Document click handler (close on outside click) ──
  private clickHandler: ((e: MouseEvent) => void) | null = null;

  // ────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────

  startTour(input: GuidedTourConfig | string): void {
    if (this.active()) {
      console.warn('[GuidedTour] Tour already running — ignoring new start request');
      return;
    }

    let config: GuidedTourConfig;
    if (typeof input === 'string') {
      try {
        config = JSON.parse(input);
      } catch {
        console.warn('[GuidedTour] Failed to parse tour JSON string');
        return;
      }
    } else {
      config = input;
    }

    if (!config?.steps?.length) {
      console.warn('[GuidedTour] Tour config has no steps');
      return;
    }

    this.config = config;
    this.steps = this.isMobile() && config.mobileSteps?.length ? config.mobileSteps : config.steps;
    this.currentIndex = 0;

    this.injectStyles();
    this.ensureDOM();
    this.active.set(true);
    this.bindGlobalEvents();

    this.showStep(0);
  }

  /** Destroy the tour and clean up all DOM / event listeners */
  destroy(): void {
    this.cleanupStep();
    this.hideOverlay();
    this.hidePopover();
    this.unbindGlobalEvents();
    this.cancelResume();

    const wasActive = this.active();
    this.active.set(false);

    if (wasActive && !this.isPausing && this.config?.onComplete) {
      this.config.onComplete();
    }
    this.isPausing = false;
    this.config = null;
    this.steps = [];
    this.currentIndex = 0;
  }

  // ────────────────────────────────────────────────────────────────
  // Style injection
  // ────────────────────────────────────────────────────────────────

  private injectStyles(): void {
    if (this.stylesInjected) return;
    if (document.getElementById('guided-tour-styles')) {
      this.stylesInjected = true;
      return;
    }
    const style = document.createElement('style');
    style.id = 'guided-tour-styles';
    style.textContent = TOUR_STYLES;
    document.head.appendChild(style);
    this.stylesInjected = true;
  }

  // ────────────────────────────────────────────────────────────────
  // Step lifecycle
  // ────────────────────────────────────────────────────────────────

  private async showStep(index: number): Promise<void> {
    this.cleanupStep();
    if (index < 0 || index >= this.steps.length) {
      this.destroy();
      return;
    }

    this.currentIndex = index;
    let step = {...this.steps[index]};

    // Evaluate condition at runtime
    step = this.evaluateCondition(step);

    const action = step.action ?? 'info';
    const el = await this.waitForElement(step.selector, 5000);
    if (!el) {
      console.warn('[GuidedTour] Step element not found — skipping:', step.selector);
      if (index + 1 < this.steps.length) {
        this.showStep(index + 1);
      } else {
        this.destroy();
      }
      return;
    }

    el.scrollIntoView({behavior: 'smooth', block: 'nearest'});

    // Wait for element rect to stabilise (position + size, e.g. toolbar items loading)
    await this.waitForStableRect(el);

    // Wait one frame for scroll to settle, then highlight + overlay
    requestAnimationFrame(() => {
      this.highlightElement(el);
      this.showOverlay(
        el,
        this.config?.options?.overlayOpacity ?? 0.6,
        this.config?.options?.stagePadding ?? 12,
        this.config?.options?.stageRadius ?? 10
      );

      if (step.showPopover !== false) {
        const locale = this.config?.options?.locale ?? navigator.language ?? 'en';
        const t = step.text?.[locale] ?? step.text?.[locale.split('-')[0]] ?? step.text?.['en'];
        const isLast = index === this.steps.length - 1;
        const isFirst = index === 0;
        this.showPopoverForStep(el, step, t, isFirst, isLast, action);
      }

      // Watch for layout shifts and reposition overlay + popover
      this.startPositionWatcher(el, step);

      // Action-specific behavior
      switch (action) {
        case 'gate':
          this.setupGateAction(el, step);
          break;
        case 'pauseAndResume':
          this.setupPauseAndResumeAction(el, step);
          break;
        case 'destroyOnClick':
          this.setupDestroyOnClickAction(el);
          break;
        case 'typewriterFill':
          this.setupTypewriterFillAction(step);
          break;
        case 'info':
        default:
          break;
      }
    });
  }

  private moveNext(): void {
    if (this.currentIndex + 1 < this.steps.length) {
      this.showStep(this.currentIndex + 1);
    } else {
      this.destroy();
    }
  }

  private movePrev(): void {
    if (this.currentIndex > 0) {
      this.showStep(this.currentIndex - 1);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Action handlers
  // ────────────────────────────────────────────────────────────────

  private setupGateAction(el: HTMLElement, step: GuidedTourStep): void {
    const gateSelector = step.gateSelector;
    if (!gateSelector) {
      console.warn('[GuidedTour] Gate step missing gateSelector — treating as info step');
      return;
    }

    const handler = async () => {
      // Hide overlay immediately on click so user sees navigation happening
      this.hideOverlay();
      this.hidePopover();

      const found = await this.waitForElement(gateSelector, step.gateTimeout ?? 8000);
      if (found) {
        this.moveNext();
      } else {
        console.warn('[GuidedTour] Gate target not found within timeout:', gateSelector);
        this.destroy();
      }
    };

    el.addEventListener('click', handler, {once: true});
    this.cleanups.push(() => el.removeEventListener('click', handler));
  }

  private setupPauseAndResumeAction(el: HTMLElement, step: GuidedTourStep): void {
    const resumeSelector = step.resumeSelector;
    if (!resumeSelector) {
      console.warn('[GuidedTour] pauseAndResume step missing resumeSelector — treating as info step');
      return;
    }

    const handler = () => {
      const remaining = this.steps.slice(this.currentIndex + 1);
      if (remaining.length === 0) {
        this.destroy();
        return;
      }

      this.isPausing = true;
      const savedConfig = this.config;
      const savedOnComplete = this.config?.onComplete;
      this.destroy();

      this.watchAndResume(resumeSelector, step.resumeTimeout ?? 120000, {
        ...savedConfig!,
        steps: remaining,
        onComplete: savedOnComplete
      });
    };

    el.addEventListener('click', handler, {once: true});
    this.cleanups.push(() => el.removeEventListener('click', handler));
  }

  private setupDestroyOnClickAction(el: HTMLElement): void {
    const handler = () => this.destroy();
    el.addEventListener('click', handler, {once: true});
    this.cleanups.push(() => el.removeEventListener('click', handler));
  }

  private setupTypewriterFillAction(step: GuidedTourStep): void {
    if (!step.typewriterFill?.length) {
      console.warn('[GuidedTour] typewriterFill step has no entries — advancing');
      this.moveNext();
      return;
    }

    this.typewriterCancelled = false;
    this.cleanups.push(() => {
      this.typewriterCancelled = true;
    });

    this.runTypewriterSequence(step.typewriterFill).then(() => {
      if (this.typewriterCancelled) return;
      // Brief pause so user sees completed text before advancing
      this.delay(800).then(() => {
        if (this.typewriterCancelled) return;
        this.moveNext();
      });
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Resume polling
  // ────────────────────────────────────────────────────────────────

  private watchAndResume(selector: string, timeoutMs: number, resumeConfig: GuidedTourConfig): void {
    const startTime = Date.now();

    const check = () => {
      const el = document.querySelector(selector);
      if (el) {
        this.cancelResume();
        console.log('[GuidedTour] Resume target found — continuing tour:', selector);
        this.startTour(resumeConfig);
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        console.warn('[GuidedTour] Resume timed out:', selector, timeoutMs);
        this.cancelResume();
        return;
      }

      this.resumeTimer = setTimeout(check, 500);
    };

    this.resumeTimer = setTimeout(check, 800);
  }

  private cancelResume(): void {
    if (this.resumeTimer !== null) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Condition evaluation
  // ────────────────────────────────────────────────────────────────

  private evaluateCondition(step: GuidedTourStep): GuidedTourStep {
    if (!step.condition) return step;

    const cond = step.condition;
    let matches = true;

    if (cond.if.visible) {
      matches = !!document.querySelector(cond.if.visible);
    } else if (cond.if.notVisible) {
      matches = !document.querySelector(cond.if.notVisible);
    }

    const overrides = matches ? cond.then : cond.else;
    if (overrides) {
      const mergedText = step.text && overrides.text ? {...step.text, ...overrides.text} : overrides.text ?? step.text;
      return {...step, ...overrides, text: mergedText, condition: undefined};
    }

    return {...step, condition: undefined};
  }

  // ────────────────────────────────────────────────────────────────
  // DOM creation — overlay uses div + box-shadow for cutout
  // ────────────────────────────────────────────────────────────────

  private ensureDOM(): void {
    if (!this.stage) {
      const el = document.createElement('div');
      el.className = 'guided-tour-stage';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      this.stage = el;
    }

    if (!this.popover) {
      const el = document.createElement('div');
      el.className = 'guided-tour-popover';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false');

      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'guided-tour-popover__arrow';
      el.appendChild(arrowDiv);
      this.arrow = arrowDiv;

      document.body.appendChild(el);
      this.popover = el;
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Overlay — stage div with massive box-shadow creates cutout
  // ────────────────────────────────────────────────────────────────

  private showOverlay(el: HTMLElement, opacity: number, padding: number, radius: number): void {
    if (!this.stage) return;

    const rect = el.getBoundingClientRect();

    // Position the stage div exactly over the target element
    Object.assign(this.stage.style, {
      display: 'block',
      top: rect.top - padding + 'px',
      left: rect.left - padding + 'px',
      width: rect.width + padding * 2 + 'px',
      height: rect.height + padding * 2 + 'px',
      borderRadius: radius + 'px',
      boxShadow: `0 0 0 9999px rgba(0,0,0,${opacity})`
    });
  }

  private hideOverlay(): void {
    if (this.stage) this.stage.style.display = 'none';
  }

  // ────────────────────────────────────────────────────────────────
  // Element highlighting
  // ────────────────────────────────────────────────────────────────

  private highlightElement(el: HTMLElement): void {
    this.unhighlightElement();
    el.classList.add('guided-tour-active');
    this.activeElement = el;
  }

  private unhighlightElement(): void {
    this.activeElement?.classList.remove('guided-tour-active');
    this.activeElement = null;
  }

  // ────────────────────────────────────────────────────────────────
  // Popover
  // ────────────────────────────────────────────────────────────────

  private showPopoverForStep(
    el: HTMLElement,
    step: GuidedTourStep,
    text: GuidedTourText | undefined,
    isFirst: boolean,
    isLast: boolean,
    action: string
  ): void {
    if (!this.popover) return;

    const showButtons = action === 'info';
    const showProgress = this.config?.options?.showProgress && this.steps.length > 1;

    let html = '<button class="guided-tour-popover__close" aria-label="Close">&times;</button>';

    if (text?.title) {
      html += `<div class="guided-tour-popover__title">${this.escapeHtml(text.title)}</div>`;
    }
    if (showProgress) {
      html += `<div class="guided-tour-popover__progress">${this.currentIndex + 1} / ${this.steps.length}</div>`;
    }
    if (text?.description) {
      html += `<div class="guided-tour-popover__description">${this.escapeHtml(text.description)}</div>`;
    }

    if (showButtons) {
      html += '<div class="guided-tour-popover__footer">';
      if (!isFirst) {
        const prevLabel = this.config?.options?.labels?.prev ?? 'Back';
        html += `<button class="guided-tour-popover__btn guided-tour-popover__btn--secondary" data-action="prev">${this.escapeHtml(prevLabel)}</button>`;
      }
      const nextLabel = isLast
        ? this.config?.options?.labels?.done ?? 'Done'
        : this.config?.options?.labels?.next ?? 'Next';
      html += `<button class="guided-tour-popover__btn guided-tour-popover__btn--primary" data-action="${isLast ? 'done' : 'next'}">${this.escapeHtml(nextLabel)}</button>`;
      html += '</div>';
    }

    // Rebuild content (keep arrow)
    this.popover.innerHTML = '';
    if (this.arrow) {
      this.popover.appendChild(this.arrow);
    }

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = html;
    while (contentDiv.firstChild) {
      this.popover.appendChild(contentDiv.firstChild);
    }

    // Bind button clicks
    const closeBtn = this.popover.querySelector('.guided-tour-popover__close') as HTMLElement;
    if (closeBtn) {
      const h = () => this.destroy();
      closeBtn.addEventListener('click', h);
      this.cleanups.push(() => closeBtn.removeEventListener('click', h));
    }

    this.popover.querySelectorAll('[data-action]').forEach((btn) => {
      const actionType = btn.getAttribute('data-action');
      const h = () => {
        if (actionType === 'next' || actionType === 'done') this.moveNext();
        else if (actionType === 'prev') this.movePrev();
      };
      btn.addEventListener('click', h);
      this.cleanups.push(() => btn.removeEventListener('click', h));
    });

    // Show + position
    this.popover.classList.add('guided-tour-popover--visible');
    requestAnimationFrame(() => this.positionPopover(el, step.side ?? 'bottom', step.align ?? 'center'));
  }

  private positionPopover(el: HTMLElement, preferredSide: string, align: string): void {
    if (!this.popover || !this.arrow) return;

    const elRect = el.getBoundingClientRect();
    const popRect = this.popover.getBoundingClientRect();
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const positions: Record<string, {top: number; left: number}> = {
      bottom: {top: elRect.bottom + gap, left: this.calcAlign(elRect, popRect.width, align, vw)},
      top: {top: elRect.top - popRect.height - gap, left: this.calcAlign(elRect, popRect.width, align, vw)},
      right: {top: this.calcAlignVertical(elRect, popRect.height, align, vh), left: elRect.right + gap},
      left: {top: this.calcAlignVertical(elRect, popRect.height, align, vh), left: elRect.left - popRect.width - gap}
    };

    const tryOrder = [
      preferredSide,
      this.oppositeSide(preferredSide),
      ...['bottom', 'top', 'right', 'left'].filter((s) => s !== preferredSide && s !== this.oppositeSide(preferredSide))
    ];
    let chosenSide = preferredSide;
    let pos = positions[preferredSide];

    for (const side of tryOrder) {
      const p = positions[side];
      if (p.top >= 0 && p.left >= 0 && p.top + popRect.height <= vh && p.left + popRect.width <= vw) {
        chosenSide = side;
        pos = p;
        break;
      }
    }

    pos.top = Math.max(8, Math.min(pos.top, vh - popRect.height - 8));
    pos.left = Math.max(8, Math.min(pos.left, vw - popRect.width - 8));

    this.popover.style.top = pos.top + 'px';
    this.popover.style.left = pos.left + 'px';

    this.arrow.className = `guided-tour-popover__arrow guided-tour-popover__arrow--${chosenSide}`;
    this.positionArrow(elRect, pos, popRect, chosenSide);
  }

  private positionArrow(elRect: DOMRect, popPos: {top: number; left: number}, popRect: DOMRect, side: string): void {
    if (!this.arrow) return;
    const elCenterX = elRect.left + elRect.width / 2;
    const elCenterY = elRect.top + elRect.height / 2;

    if (side === 'top' || side === 'bottom') {
      const arrowLeft = Math.max(16, Math.min(elCenterX - popPos.left, popRect.width - 16));
      this.arrow.style.left = arrowLeft + 'px';
      this.arrow.style.top = '';
    } else {
      const arrowTop = Math.max(16, Math.min(elCenterY - popPos.top, popRect.height - 16));
      this.arrow.style.top = arrowTop + 'px';
      this.arrow.style.left = '';
    }
  }

  private calcAlign(elRect: DOMRect, popWidth: number, align: string, vw: number): number {
    switch (align) {
      case 'start':
        return Math.max(8, elRect.left);
      case 'end':
        return Math.min(vw - popWidth - 8, elRect.right - popWidth);
      default:
        return elRect.left + elRect.width / 2 - popWidth / 2;
    }
  }

  private calcAlignVertical(elRect: DOMRect, popHeight: number, align: string, vh: number): number {
    switch (align) {
      case 'start':
        return Math.max(8, elRect.top);
      case 'end':
        return Math.min(vh - popHeight - 8, elRect.bottom - popHeight);
      default:
        return elRect.top + elRect.height / 2 - popHeight / 2;
    }
  }

  private oppositeSide(side: string): string {
    const map: Record<string, string> = {top: 'bottom', bottom: 'top', left: 'right', right: 'left'};
    return map[side] ?? 'bottom';
  }

  private hidePopover(): void {
    this.popover?.classList.remove('guided-tour-popover--visible');
  }

  // ────────────────────────────────────────────────────────────────
  // Global events
  // ────────────────────────────────────────────────────────────────

  private bindGlobalEvents(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.config?.options?.allowClose !== false) {
        this.destroy();
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    // Close tour when clicking outside highlighted element / popover
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      // Clicks inside popover → ignore (buttons handle themselves)
      if (this.popover?.contains(target)) return;
      // Clicks inside highlighted element → ignore (gate/pauseAndResume need them)
      if (this.activeElement?.contains(target)) return;
      // Everything else → treat as "click on dark background" → close
      if (this.config?.options?.allowClose !== false) {
        this.destroy();
      }
    };
    // Use capture phase + slight delay so tour setup clicks don't immediately close
    setTimeout(() => {
      if (this.clickHandler) document.addEventListener('click', this.clickHandler, true);
    }, 100);

    this.resizeHandler = () => {
      if (this.activeElement && this.active()) {
        const step = this.evaluateCondition({...this.steps[this.currentIndex]});
        this.showOverlay(
          this.activeElement,
          this.config?.options?.overlayOpacity ?? 0.6,
          this.config?.options?.stagePadding ?? 12,
          this.config?.options?.stageRadius ?? 10
        );
        if (this.popover?.classList.contains('guided-tour-popover--visible')) {
          this.positionPopover(this.activeElement, step.side ?? 'bottom', step.align ?? 'center');
        }
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  private unbindGlobalEvents(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────

  private cleanupStep(): void {
    this.stopPositionWatcher();
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.unhighlightElement();
  }

  /**
   * Continuously watches the highlighted element's position via rAF.
   * If the rect changes (e.g. toolbar items loading and shifting layout),
   * the overlay and popover are repositioned to match.
   */
  private startPositionWatcher(el: HTMLElement, step: GuidedTourStep): void {
    this.stopPositionWatcher();
    let lastRect = el.getBoundingClientRect();

    const tick = () => {
      const rect = el.getBoundingClientRect();
      if (
        rect.top !== lastRect.top ||
        rect.left !== lastRect.left ||
        rect.width !== lastRect.width ||
        rect.height !== lastRect.height
      ) {
        lastRect = rect;
        this.showOverlay(
          el,
          this.config?.options?.overlayOpacity ?? 0.6,
          this.config?.options?.stagePadding ?? 12,
          this.config?.options?.stageRadius ?? 10
        );
        if (this.popover?.classList.contains('guided-tour-popover--visible')) {
          this.positionPopover(el, step.side ?? 'bottom', step.align ?? 'center');
        }
      }
      this.positionWatchRaf = requestAnimationFrame(tick);
    };

    this.positionWatchRaf = requestAnimationFrame(tick);
  }

  private stopPositionWatcher(): void {
    if (this.positionWatchRaf !== null) {
      cancelAnimationFrame(this.positionWatchRaf);
      this.positionWatchRaf = null;
    }
  }

  private waitForElement(selector: string, timeoutMs: number): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) return resolve(el);
        if (Date.now() - start >= timeoutMs) return resolve(null);
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  /** Polls getBoundingClientRect until position+size stop changing for `stableMs` ms. */
  private waitForStableRect(el: HTMLElement, stableMs = 300, timeoutMs = 3000): Promise<void> {
    return new Promise((resolve) => {
      let lastT = 0,
        lastL = 0,
        lastW = 0,
        lastH = 0,
        stableSince = Date.now();
      const start = Date.now();
      const tick = () => {
        const {top, left, width, height} = el.getBoundingClientRect();
        if (top !== lastT || left !== lastL || width !== lastW || height !== lastH) {
          lastT = top;
          lastL = left;
          lastW = width;
          lastH = height;
          stableSince = Date.now();
        }
        if (Date.now() - stableSince >= stableMs || Date.now() - start >= timeoutMs) {
          return resolve();
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private isMobile(): boolean {
    return window.innerWidth <= 599.98;
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Types text into form fields char-by-char with animation.
   * Dispatches `input` events so Angular reactive forms pick up the values.
   */
  private async runTypewriterSequence(entries: TypewriterFillEntry[]): Promise<void> {
    for (const entry of entries) {
      if (this.typewriterCancelled) return;

      const startDelay = entry.startDelayMs ?? 300;
      await this.delay(startDelay);
      if (this.typewriterCancelled) return;

      const el = document.querySelector(entry.selector) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) continue;

      el.focus();
      el.value = '';
      el.dispatchEvent(new Event('input', {bubbles: true}));

      const charDelay = entry.charDelayMs ?? 35;

      for (let i = 0; i < entry.text.length; i++) {
        if (this.typewriterCancelled) return;
        el.value = entry.text.slice(0, i + 1);
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.scrollTop = el.scrollHeight;
        await this.delay(charDelay);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
