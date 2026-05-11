import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import articleApi from '../../api/articleApi';
import mediaApi from '../../api/mediaApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/* ─── Category palette ─── */
const CATEGORY_PALETTE = {
  travel:  { accent: '#0D9488', bg: 'rgba(13,148,136,.12)', text: '#0D9488', label: 'Travel' },
  finance: { accent: '#3B82F6', bg: 'rgba(59,130,246,.12)', text: '#3B82F6', label: 'Finance' },
  culture: { accent: '#8B5CF6', bg: 'rgba(139,92,246,.12)', text: '#8B5CF6', label: 'Culture' },
  food:    { accent: '#F59E0B', bg: 'rgba(245,158,11,.12)', text: '#F59E0B', label: 'Food' },
  news:    { accent: '#EF4444', bg: 'rgba(239,68,68,.12)',  text: '#EF4444', label: 'News' },
  tips:    { accent: '#EC4899', bg: 'rgba(236,72,153,.12)', text: '#EC4899', label: 'Tips' },
  general: { accent: '#6B7280', bg: 'rgba(107,114,128,.12)',text: '#6B7280', label: 'General' },
};
function getCat(raw = '') {
  return CATEGORY_PALETTE[raw.toLowerCase().trim()] || CATEGORY_PALETTE.general;
}

/* ─── Helpers ─── */
let _bid = 0;
const uid     = () => `b${++_bid}`;
const mkText  = (c = '') => ({ id: uid(), type: 'text',  content: c });
const mkMedia = ()       => ({ id: uid(), type: 'media', file: null, preview: null, isVideo: false, caption: '' });
const isLocal = (a)      => String(a.id).startsWith('local');
function initials(name = '') {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.np-root {
  width: 100%;
  min-height: 100vh;
  background: var(--color-background-tertiary, #0f0f0f);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  overflow-x: hidden;
}

/* ── Sticky tab bar ── */
.np-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 max(16px, calc((100vw - 1400px) / 2));
  background: var(--color-background-primary, #1a1a1a);
  border-bottom: 1px solid var(--color-border-tertiary, rgba(255,255,255,.08));
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(12px);
}
.np-tab {
  position: relative;
  padding: 16px 24px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .02em;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary, rgba(255,255,255,.45));
  font-family: inherit;
  transition: color .2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.np-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--color-text-primary, #fff);
  transform: scaleX(0);
  transition: transform .25s cubic-bezier(.4,0,.2,1);
}
.np-tab.active { color: var(--color-text-primary, #fff); }
.np-tab.active::after { transform: scaleX(1); }
.np-notif {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 99px;
  background: #EF4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

/* ── Feed layout ── */
.np-feed-wrap {
  width: 100%;
  min-height: calc(100vh - 120px);
  padding: clamp(12px, 2vw, 32px);
  display: flex;
  justify-content: center;
}

.np-feed-col {
  width: 100%;
  max-width: min(100%, 920px);
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2vw, 28px);
}

/* new banner */
.np-new-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 13px 20px;
  border-radius: 14px;
  border: 1px solid rgba(59,130,246,.35);
  background: rgba(59,130,246,.08);
  color: #3B82F6;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  transition: background .2s, border-color .2s;
}
.np-new-banner:hover {
  background: rgba(59,130,246,.14);
  border-color: rgba(59,130,246,.5);
}

/* ── Article card ── */
.np-card {
  background: var(--color-background-primary, #1c1c1c);
  border: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
  border-radius: 20px;
  overflow: hidden;
  transition: border-color .25s, transform .25s, box-shadow .25s;
}
.np-card:hover {
  border-color: var(--color-border-secondary, rgba(255,255,255,.15));
  transform: translateY(-3px);
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}

.np-card-accent { height: 3px; width: 100%; flex-shrink: 0; }

.np-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 12px;
}
.np-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  color: #fff;
  letter-spacing: -0.5px;
}
.np-card-meta { flex: 1; min-width: 0; }
.np-card-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.np-card-time {
  font-size: 11.5px;
  color: var(--color-text-secondary, rgba(255,255,255,.4));
  margin-top: 2px;
}
.np-cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 99px;
  letter-spacing: .04em;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* hero */
.np-hero-wrap {
  width: 100%;
  overflow: hidden;
  border-top: 1px solid var(--color-border-tertiary, rgba(255,255,255,.06));
  border-bottom: 1px solid var(--color-border-tertiary, rgba(255,255,255,.06));
  position: relative;
}
.np-hero,
.np-hero-wrap video {
  width: 100%;
  height: auto;
  max-height: min(70vh, 720px);
  object-fit: contain;
  display: block;
  transition: none;
  background: #000;
}
.np-card:hover .np-hero {
  transform: none;
}
.np-hero-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 16px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,.65));
  font-size: 11px;
  color: rgba(255,255,255,.75);
  font-style: italic;
}

/* body */
.np-card-body { padding: 18px 20px 14px; }
.np-card-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 19px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  line-height: 1.4;
  margin-bottom: 10px;
  letter-spacing: -.01em;
}
.np-card-excerpt {
  font-size: 14px;
  color: var(--color-text-secondary, rgba(255,255,255,.5));
  line-height: 1.8;
}
.np-card-excerpt.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.np-read-more {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-info, #3B82F6);
  padding: 6px 0 0;
  font-family: inherit;
  display: block;
  transition: opacity .15s;
}
.np-read-more:hover { opacity: .75; }

/* extra media */
.np-media-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.np-media-row > div {
  border-radius: 12px;
  overflow: hidden;
  flex: 1;
  min-width: 120px;
}
.np-media-row img,
.np-media-row video {
  width: 100%;
  height: auto;
  max-height: 420px;
  object-fit: contain;
  display: block;
  background: #000;
}

/* divider */
.np-divider {
  height: 1px;
  background: var(--color-border-tertiary, rgba(255,255,255,.07));
  margin: 0 20px;
}

/* footer */
.np-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 10px;
}
.np-card-footer-left {
  font-size: 12px;
  color: var(--color-text-secondary, rgba(255,255,255,.35));
}
.np-card-actions { display: flex; gap: 8px; }
.np-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border-tertiary, rgba(255,255,255,.1));
  background: transparent;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-secondary, rgba(255,255,255,.5));
  font-family: inherit;
  transition: all .2s;
}
.np-act-btn:hover {
  border-color: var(--color-border-secondary, rgba(255,255,255,.22));
  background: rgba(255,255,255,.05);
  color: var(--color-text-primary, #fff);
}
.np-act-btn.liked {
  border-color: rgba(239,68,68,.4);
  background: rgba(239,68,68,.1);
  color: #EF4444;
}
.np-act-btn.saved {
  border-color: rgba(59,130,246,.4);
  background: rgba(59,130,246,.1);
  color: #3B82F6;
}
.np-act-btn:disabled { opacity: .3; cursor: not-allowed; }

/* ── Pending card ── */
.np-pending {
  background: var(--color-background-primary, #1c1c1c);
  border: 1px solid rgba(245,158,11,.3);
  border-radius: 20px;
  overflow: hidden;
}
.np-pending-stripe {
  height: 3px;
  background: repeating-linear-gradient(90deg,#F59E0B 0,#F59E0B 8px,transparent 8px,transparent 14px);
}
.np-pending-inner { padding: 18px 20px 20px; }
.np-pending-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.np-pending-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 99px;
  background: rgba(245,158,11,.12);
  color: #F59E0B;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.np-pending-time {
  font-size: 11.5px;
  color: var(--color-text-secondary, rgba(255,255,255,.4));
}
.np-pending-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin-bottom: 8px;
}
.np-pending-text {
  font-size: 13.5px;
  color: var(--color-text-secondary, rgba(255,255,255,.5));
  line-height: 1.75;
}
.np-pending-note {
  margin-top: 12px;
  font-size: 11px;
  color: var(--color-text-secondary, rgba(255,255,255,.3));
  font-style: italic;
}

/* ── Loading / empty ── */
.np-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--color-text-secondary, rgba(255,255,255,.4));
  font-size: 14px;
}
.np-spin {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,.12);
  border-top-color: rgba(255,255,255,.5);
  border-radius: 50%;
  animation: npspin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes npspin { to { transform: rotate(360deg); } }

.np-empty {
  text-align: center;
  padding: 80px 20px;
}
.np-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .4; }
.np-empty-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin-bottom: 8px;
}
.np-empty-sub {
  font-size: 13.5px;
  color: var(--color-text-secondary, rgba(255,255,255,.4));
  line-height: 1.7;
}
.np-empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 22px;
  border-radius: 12px;
  border: 1px solid var(--color-border-secondary, rgba(255,255,255,.15));
  background: rgba(255,255,255,.05);
  color: var(--color-text-primary, #fff);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}
.np-empty-btn:hover {
  background: rgba(255,255,255,.1);
  border-color: rgba(255,255,255,.25);
}

/* ═══════════════════════════════════════════════════════
   EDITOR
═══════════════════════════════════════════════════════ */
.np-editor-wrap {
  width: 100%;
  min-height: calc(100vh - 120px);
  padding: clamp(12px, 2vw, 32px);
  display: flex;
  justify-content: center;
}

.np-editor-col {
  width: 100%;
  max-width: min(100%, 1100px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.np-editor-card {
  background: var(--color-background-primary, #1c1c1c);
  border: 1px solid var(--color-border-tertiary, rgba(255,255,255,.08));
  border-radius: 24px;
  overflow: hidden;
}

/* step indicator */
.np-editor-steps {
  display: flex;
  gap: 0;
  padding: 0 28px;
  border-bottom: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
  background: rgba(255,255,255,.02);
}
.np-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px 14px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(255,255,255,.3));
  letter-spacing: .02em;
}
.np-step + .np-step {
  padding-left: 20px;
  border-left: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
}
.np-step.active { color: var(--color-text-primary, #fff); }
.np-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: background .2s, color .2s;
}
.np-step.active .np-step-num {
  background: var(--color-text-primary, #fff);
  color: var(--color-background-primary, #1c1c1c);
  border-color: transparent;
}

/* headline section */
.np-editor-headline-sec {
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
}
.np-editor-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--color-text-secondary, rgba(255,255,255,.3));
  margin-bottom: 10px;
}
.np-editor-headline {
  width: 100%;
  border: none;
  background: transparent;
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary, #fff);
  outline: none;
  resize: none;
  line-height: 1.3;
  overflow: hidden;
}
.np-editor-headline::placeholder {
  color: var(--color-border-secondary, rgba(255,255,255,.15));
}

/* category selector */
.np-cat-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 28px;
  border-bottom: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
  background: rgba(255,255,255,.02);
  align-items: center;
}
.np-cat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--color-text-secondary, rgba(255,255,255,.3));
  margin-right: 4px;
}
.np-cat-btn {
  padding: 5px 14px;
  border-radius: 99px;
  border: 1.5px solid transparent;
  background: rgba(255,255,255,.05);
  color: var(--color-text-secondary, rgba(255,255,255,.45));
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .18s;
  text-transform: capitalize;
}
.np-cat-btn:hover {
  background: rgba(255,255,255,.08);
  color: var(--color-text-primary, #fff);
}
.np-cat-btn.sel {
  border-color: currentColor;
}

/* blocks area */
.np-blocks-area { padding: 4px 28px 12px; }

.np-block-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}
.np-block-handle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 10px;
  flex-shrink: 0;
}
.np-handle-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--color-border-tertiary, rgba(255,255,255,.08));
  background: rgba(255,255,255,.03);
  color: var(--color-text-secondary, rgba(255,255,255,.35));
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all .15s;
}
.np-handle-btn:hover {
  background: rgba(255,255,255,.08);
  color: var(--color-text-primary, #fff);
  border-color: rgba(255,255,255,.15);
}
.np-handle-btn.del:hover {
  background: rgba(239,68,68,.1);
  border-color: rgba(239,68,68,.35);
  color: #EF4444;
}

.np-text-block {
  flex: 1;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.8;
  background: transparent;
  color: var(--color-text-primary, #fff);
  resize: none;
  outline: none;
  font-family: inherit;
  min-height: 80px;
  overflow: hidden;
  transition: border-color .15s, background .15s;
}
.np-text-block:focus {
  border-color: var(--color-border-secondary, rgba(255,255,255,.12));
  background: rgba(255,255,255,.03);
}
.np-text-block::placeholder {
  color: var(--color-border-secondary, rgba(255,255,255,.15));
}

/* media block */
.np-media-blk {
  flex: 1;
  border: 1.5px dashed var(--color-border-secondary, rgba(255,255,255,.12));
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255,255,255,.02);
  transition: border-color .2s;
}
.np-media-blk:hover { border-color: rgba(255,255,255,.2); }
.np-media-zones { display: flex; }
.np-media-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  padding: 28px 16px;
  color: var(--color-text-secondary, rgba(255,255,255,.4));
  transition: background .2s, color .2s;
  background: none;
  border: none;
  font-family: inherit;
}
.np-media-zone:hover {
  background: rgba(255,255,255,.04);
  color: var(--color-text-primary, #fff);
}
.np-media-zone + .np-media-zone {
  border-left: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
}
.np-mz-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.05);
  margin-bottom: 4px;
}
.np-mz-label { font-size: 13px; font-weight: 600; }
.np-mz-hint { font-size: 11px; opacity: .5; }

.np-media-preview { position: relative; }
.np-media-preview img,
.np-media-preview video {
  width: 100%;
  height: auto;
  max-height: min(70vh, 720px);
  object-fit: contain;
  display: block;
  background: #000;
}
.np-media-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
}
.np-overlay-btn {
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,.9);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.np-overlay-btn:hover { background: rgba(0,0,0,.85); }
.np-caption-row {
  padding: 10px 14px;
  border-top: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
}
.np-caption-in {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 12.5px;
  color: var(--color-text-secondary, rgba(255,255,255,.45));
  font-style: italic;
  outline: none;
  font-family: inherit;
}
.np-caption-in::placeholder { color: rgba(255,255,255,.18); }

/* insert divider */
.np-insert-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  opacity: 0;
  transition: opacity .2s;
}
.np-block-row:hover + .np-insert-row,
.np-insert-row:hover { opacity: 1; }
.np-insert-line { flex: 1; height: 1px; background: var(--color-border-tertiary, rgba(255,255,255,.07)); }
.np-insert-text-btn, .np-insert-media-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-border-secondary, rgba(255,255,255,.1));
  background: rgba(255,255,255,.04);
  color: var(--color-text-secondary, rgba(255,255,255,.4));
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  transition: all .15s;
}
.np-insert-text-btn:hover, .np-insert-media-btn:hover {
  background: rgba(255,255,255,.08);
  color: var(--color-text-primary, #fff);
  border-color: rgba(255,255,255,.2);
}

/* upload progress */
.np-upload-progress {
  margin: 8px 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.2);
}
.np-upload-text {
  font-size: 12px;
  color: #3B82F6;
  font-weight: 500;
  margin-bottom: 8px;
}
.np-upload-bar {
  height: 3px;
  background: rgba(59,130,246,.2);
  border-radius: 99px;
  overflow: hidden;
}
.np-upload-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 99px;
  transition: width .3s;
}

/* toolbar */
.np-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 16px 28px 18px;
  border-top: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
  background: rgba(255,255,255,.02);
}
.np-tbtn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border-secondary, rgba(255,255,255,.1));
  background: rgba(255,255,255,.04);
  color: var(--color-text-secondary, rgba(255,255,255,.5));
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all .18s;
  white-space: nowrap;
}
.np-tbtn:hover {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.18);
  color: var(--color-text-primary, #fff);
}
.np-tbtn:disabled { opacity: .3; cursor: not-allowed; }

.np-publish-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0D9488, #059669);
  color: #fff;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity .18s, transform .18s, box-shadow .18s;
  white-space: nowrap;
  letter-spacing: .01em;
  box-shadow: 0 4px 20px rgba(13,148,136,.35);
}
.np-publish-btn:hover:not(:disabled) {
  opacity: .9;
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(13,148,136,.45);
}
.np-publish-btn:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }

/* tips */
.np-editor-tips {
  padding: 16px 22px;
  border-radius: 16px;
  background: var(--color-background-primary, #1c1c1c);
  border: 1px solid var(--color-border-tertiary, rgba(255,255,255,.07));
  font-size: 12.5px;
  color: var(--color-text-secondary, rgba(255,255,255,.4));
  line-height: 1.75;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.np-tips-icon {
  font-size: 18px;
  opacity: .6;
  margin-top: 1px;
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .np-editor-headline { font-size: 22px; }
}
@media (max-width: 680px) {
  .np-root {
    overflow-x: hidden;
  }

  .np-feed-wrap,
  .np-editor-wrap {
    padding: 10px;
  }

  .np-feed-col,
  .np-editor-col {
    max-width: 100%;
  }

  .np-card,
  .np-pending,
  .np-editor-card {
    border-radius: 16px;
  }

  .np-card-title {
    font-size: clamp(18px, 5vw, 24px);
    line-height: 1.35;
  }

  .np-card-body,
  .np-card-header,
  .np-card-footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .np-hero,
  .np-hero-wrap video {
    max-height: 50vh;
  }

  .np-media-row {
    flex-direction: column;
  }

  .np-media-row > div {
    width: 100%;
  }
}

@media (min-width: 1600px) {
  .np-feed-col {
    max-width: 1100px;
  }

  .np-editor-col {
    max-width: 1300px;
  }

  .np-card-title {
    font-size: 24px;
  }

  .np-card-excerpt {
    font-size: 16px;
  }
}

.np-card,
.np-pending,
.np-editor-card {
  width: 100%;
}

@media (max-width: 480px) {
  .np-tab { padding: 14px 16px; font-size: 12px; }
  .np-step { padding: 12px 12px 12px 0; font-size: 11px; }
  .np-step + .np-step { padding-left: 12px; }
}
`;

/* ─── TextBlock ─── */
function TextBlock({ block, onChange, placeholder }) {
  const ref = useRef(null);
  const resize = () => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  };
  return (
    <textarea
      ref={ref}
      className="np-text-block"
      placeholder={placeholder}
      defaultValue={block.content}
      rows={3}
      onChange={e => { onChange(block.id, { content: e.target.value }); resize(); }}
      onInput={resize}
    />
  );
}

/* ─── MediaBlock ─── */
function MediaBlock({ block, onChange, onFileClick }) {
  return (
    <div className="np-media-blk">
      {block.preview ? (
        <div className="np-media-preview">
          {block.isVideo
            ? <video src={block.preview} controls />
            : <img src={block.preview} alt="" />}
          <div className="np-media-overlay">
            <button className="np-overlay-btn" onClick={() => onFileClick(block.id, false)}>Replace image</button>
            <button className="np-overlay-btn" onClick={() => onFileClick(block.id, true)}>Replace video</button>
          </div>
        </div>
      ) : (
        <div className="np-media-zones">
          <button className="np-media-zone" onClick={() => onFileClick(block.id, false)}>
            <div className="np-mz-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
            </div>
            <span className="np-mz-label">Add image</span>
            <span className="np-mz-hint">JPG · PNG · GIF · WEBP</span>
          </button>
          <button className="np-media-zone" onClick={() => onFileClick(block.id, true)}>
            <div className="np-mz-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 8-6 4 6 4V8z"/>
                <rect x="2" y="6" width="14" height="12" rx="2"/>
              </svg>
            </div>
            <span className="np-mz-label">Add video</span>
            <span className="np-mz-hint">MP4 · MOV · WEBM</span>
          </button>
        </div>
      )}
      <div className="np-caption-row">
        <input
          className="np-caption-in"
          type="text"
          placeholder="Write a caption for this media…"
          value={block.caption}
          onChange={e => onChange(block.id, { caption: e.target.value })}
        />
      </div>
    </div>
  );
}

/* ─── ArticleEditor ─── */
const CATEGORIES = ['general', 'travel', 'finance', 'culture', 'food', 'news', 'tips'];

function ArticleEditor({ onSubmit, submitting }) {
  const [title, setTitle]     = useState('');
  const [category, setCategory] = useState('general');
  const [blocks, setBlocks]   = useState([mkText()]);
  const [progress, setProgress] = useState(0);
  const fileRef   = useRef(null);
  const activeRef = useRef(null);
  const vidRef    = useRef(false);

  const upd  = useCallback((id, p) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...p } : b)), []);
  const del  = useCallback((id)    => setBlocks(prev => { const n = prev.filter(b => b.id !== id); return n.length ? n : [mkText()]; }), []);
  const moveUp = useCallback((id)  => setBlocks(prev => {
    const i = prev.findIndex(b => b.id === id);
    if (i <= 0) return prev;
    const n = [...prev]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n;
  }), []);

  const insertAfter = (afterIdx, type) => setBlocks(prev => {
    const n = [...prev];
    n.splice(afterIdx + 1, 0, type === 'media' ? mkMedia() : mkText());
    return n;
  });

  const fileClick = (id, isVid) => {
    activeRef.current = id;
    vidRef.current    = isVid;
    if (fileRef.current) {
      fileRef.current.accept = isVid ? 'video/*' : 'image/*';
      fileRef.current.value  = '';
      fileRef.current.click();
    }
  };

  const fileChange = e => {
    const file = e.target.files?.[0];
    if (!file || !activeRef.current) return;
    if (file.size > 50 * 1024 * 1024) { alert('File vượt quá 50 MB'); return; }
    upd(activeRef.current, { file, preview: URL.createObjectURL(file), isVideo: file.type.startsWith('video/') });
  };

  const submit = async () => {
    const text  = blocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n').trim();
    const hasT  = title.trim();
    const hasB  = blocks.some(b => b.type === 'text' ? b.content.trim() : b.file);
    if (!hasT && !hasB) return;
    if (submitting) return;

    const mediaBlocks = blocks.filter(b => b.type === 'media' && b.file);
    let uploaded = [];
    if (mediaBlocks.length > 0) {
      uploaded = await mediaApi.uploadMultipleMedia(mediaBlocks.map(b => b.file), setProgress);
    }

    const media = uploaded.map((u, i) => ({
      mediaUrl:  u.url,
      mediaType: mediaBlocks[i].isVideo ? 'VIDEO' : 'IMAGE',
      fileSize:  u.fileSize,
      mimeType:  u.mimeType,
      caption:   mediaBlocks[i].caption || '',
    }));

    let mi = 0;
    const blocksData = blocks.map(b => {
      if (b.type === 'text') return { type: 'text', content: b.content };
      const u = uploaded[mi]; const mb = mediaBlocks[mi]; mi++;
      return { type: 'media', caption: b.caption, mediaUrl: u?.url, mediaType: mb?.isVideo ? 'VIDEO' : 'IMAGE' };
    });

    await onSubmit({
      title:     title.trim() || text.substring(0, 80) || 'Article',
      content:   text,
      category:  category.toUpperCase(),
      media,
      blocksData,
    });
    setTitle(''); setBlocks([mkText()]); setProgress(0); setCategory('general');
  };

  const hasContent = title.trim() || blocks.some(b => b.type === 'text' ? b.content.trim() : b.file);
  const hasMedia   = blocks.some(b => b.type === 'media' && b.file);

  return (
    <div className="np-editor-wrap">
      <div className="np-editor-col">
        <div className="np-editor-card">
          {/* steps */}
          <div className="np-editor-steps">
            <div className={`np-step${title.trim() ? ' active' : ''}`}>
              <span className="np-step-num">1</span>
              Headline
            </div>
            <div className={`np-step${blocks.some(b => b.type==='text' ? b.content.trim() : b.file) ? ' active' : ''}`}>
              <span className="np-step-num">2</span>
              Content
            </div>
            <div className={`np-step${hasMedia ? ' active' : ''}`}>
              <span className="np-step-num">3</span>
              Media
            </div>
          </div>

          {/* headline */}
          <div className="np-editor-headline-sec">
            <div className="np-editor-label">Article headline</div>
            <textarea
              className="np-editor-headline"
              placeholder="What is your story about?"
              value={title}
              rows={1}
              disabled={submitting}
              onChange={e => {
                setTitle(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* category */}
          <div className="np-cat-selector">
            <span className="np-cat-label">Category</span>
            {CATEGORIES.map(c => {
              const cat = getCat(c);
              return (
                <button
                  key={c}
                  className={`np-cat-btn${category === c ? ' sel' : ''}`}
                  style={category === c ? { color: cat.accent } : {}}
                  onClick={() => setCategory(c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              );
            })}
          </div>

          {/* blocks */}
          <div className="np-blocks-area">
            {blocks.map((block, i) => (
              <div key={block.id}>
                <div className="np-block-row">
                  {block.type === 'text'
                    ? <TextBlock block={block} onChange={upd} placeholder={i === 0 ? 'Write your story here. Mix text, images and videos freely…' : 'Continue writing…'} />
                    : <MediaBlock block={block} onChange={upd} onFileClick={fileClick} />
                  }
                  <div className="np-block-handle">
                    {i > 0 && (
                      <button className="np-handle-btn" title="Move up" onClick={() => moveUp(block.id)}>
                        ↑
                      </button>
                    )}
                    <button className="np-handle-btn del" title="Remove" onClick={() => del(block.id)}>
                      ✕
                    </button>
                  </div>
                </div>

                {i < blocks.length - 1 && (
                  <div className="np-insert-row">
                    <div className="np-insert-line" />
                    <button className="np-insert-text-btn" onClick={() => insertAfter(i, 'text')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
                      Text
                    </button>
                    <button className="np-insert-media-btn" onClick={() => insertAfter(i, 'media')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      Media
                    </button>
                    <div className="np-insert-line" />
                  </div>
                )}
              </div>
            ))}

            {progress > 0 && progress < 100 && (
              <div className="np-upload-progress">
                <div className="np-upload-text">Uploading files… {progress}%</div>
                <div className="np-upload-bar">
                  <div className="np-upload-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* toolbar */}
          <div className="np-editor-toolbar">
            <button className="np-tbtn" onClick={() => setBlocks(p => [...p, mkText()])} disabled={submitting}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
              Add text block
            </button>
            <button className="np-tbtn" onClick={() => setBlocks(p => [...p, mkMedia()])} disabled={submitting}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              Add image / video
            </button>
            <button
              className="np-publish-btn"
              onClick={submit}
              disabled={submitting || !hasContent}
            >
              {submitting ? (
                <>
                  <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'npspin .7s linear infinite' }} />
                  Publishing…
                </>
              ) : (
                <>
                  Publish article
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 14 0M14 6l6 6-6 6"/></svg>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="np-editor-tips">
          <span className="np-tips-icon">💡</span>
          <span>
            <strong style={{ color: 'var(--color-text-primary, #fff)', fontWeight: 600 }}>How to use: </strong>
            Add text and media blocks in any order. Hover between blocks to insert content inline.
            After publishing, your article goes to editorial review before appearing in the public feed.
            Max file size 50 MB per media item.
          </span>
        </div>
      </div>

      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={fileChange} />
    </div>
  );
}

/* ─── PendingCard ─── */
function PendingCard({ post }) {
  return (
    <div className="np-pending">
      <div className="np-pending-stripe" />
      <div className="np-pending-inner">
        <div className="np-pending-row">
          <span className="np-pending-pill">⏳ Under review</span>
          <span className="np-pending-time">Submitted {dayjs(post.submittedAt).fromNow()}</span>
        </div>
        {post.title && <div className="np-pending-title">{post.title}</div>}
        {post.blocksData?.map((b, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            {b.type === 'text' && b.content && <p className="np-pending-text">{b.content}</p>}
            {b.type === 'media' && b.mediaUrl && (
              <div>
                {b.mediaType === 'VIDEO'
                  ? <video src={b.mediaUrl} controls style={{ width: '100%', borderRadius: 10, opacity: .75 }} />
                  : <img src={b.mediaUrl} alt="" style={{ width: '100%', borderRadius: 10, opacity: .75, display: 'block' }} />
                }
                {b.caption && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>{b.caption}</p>}
              </div>
            )}
          </div>
        ))}
        {!post.blocksData && post.text && <p className="np-pending-text">{post.text}</p>}
        <p className="np-pending-note">Your article will appear in the public feed once approved by an editor.</p>
      </div>
    </div>
  );
}

/* ─── ArticleCard ─── */
function ArticleCard({ article, liked, saved, onLike, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const local    = isLocal(article);
  const likeCount = article.likeCount ?? article.likes ?? 0;
  const author   = article.authorName || article.author || 'VietMoney';
  const time     = article.createdAt ? dayjs(article.createdAt).fromNow() : (article.time || '');
  const rawTag   = article.tag || article.category || 'general';
  const cat      = getCat(rawTag);
  const media    = article.mediaList || [];
  const content  = article.content || article.excerpt || '';
  const hero     = media[0];
  const restMedia = media.slice(1);
  const needsExpand = content.length > 220;

  return (
    <article className="np-card">
      <div className="np-card-accent" style={{ background: cat.accent }} />

      <div className="np-card-header">
        <div className="np-card-avatar" style={{ background: cat.accent }}>{initials(author)}</div>
        <div className="np-card-meta">
          <div className="np-card-author">{author}</div>
          {time && <div className="np-card-time">{time}</div>}
        </div>
        <span className="np-cat-pill" style={{ background: cat.bg, color: cat.text }}>
          {cat.label}
        </span>
      </div>

      {hero?.mediaType === 'IMAGE' && (
        <div className="np-hero-wrap">
          <img className="np-hero" src={hero.mediaUrl} alt={article.title || ''} loading="lazy" />
          {hero.caption && <div className="np-hero-caption">{hero.caption}</div>}
        </div>
      )}
      {hero?.mediaType === 'VIDEO' && (
        <div className="np-hero-wrap">
          <video src={hero.mediaUrl} controls style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      <div className="np-card-body">
        {article.title && <h3 className="np-card-title">{article.title}</h3>}
        {content && (
          <>
            <p className={`np-card-excerpt${expanded ? '' : ' clamped'}`}>{content}</p>
            {needsExpand && (
              <button className="np-read-more" onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
          </>
        )}
        {restMedia.length > 0 && (
          <div className="np-media-row">
            {restMedia.map((m, i) => (
              <div key={m.id || i}>
                {m.mediaType === 'VIDEO'
                  ? <video src={m.mediaUrl} controls />
                  : <img src={m.mediaUrl} alt="" style={{ borderRadius: 10 }} />
                }
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="np-divider" />

      <div className="np-card-footer">
        <span className="np-card-footer-left">
          {likeCount > 0 ? `${likeCount} like${likeCount !== 1 ? 's' : ''}` : ''}
        </span>
        <div className="np-card-actions">
          <button
            className={`np-act-btn${liked ? ' liked' : ''}`}
            onClick={() => !local && onLike(article)}
            disabled={local}
          >
            {liked ? '♥' : '♡'} {likeCount > 0 ? likeCount : 'Like'}
          </button>
          <button
            className={`np-act-btn${saved ? ' saved' : ''}`}
            onClick={() => !local && onSave(article)}
            disabled={local}
          >
            {saved ? '🔖 Saved' : '📌 Save'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── NewsPage ─── */
export default function NewsPage() {
  const [tab, setTab]                 = useState('feed');
  const [articles, setArticles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [likedIds, setLikedIds]       = useState(new Set());
  const [savedIds, setSavedIds]       = useState(new Set());
  const [newCount, setNewCount]       = useState(0);
  const [queued, setQueued]           = useState([]);
  const articlesRef = useRef([]);

  useEffect(() => { articlesRef.current = articles; }, [articles]);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res  = await articleApi.getFeed({ page: 0, size: 20 });
      const data = res.data?.data?.content ?? res.data?.data ?? [];
      setArticles(Array.isArray(data) ? data : []);
      return data;
    } catch {
      if (!silent) setError('Could not load articles. Please try again.');
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res  = await articleApi.getFeed({ page: 0, size: 5 });
        const data = res.data?.data?.content ?? res.data?.data ?? [];
        if (!Array.isArray(data)) return;
        const cur     = articlesRef.current;
        const newOnes = data.filter(a => !cur.find(x => x.id === a.id));
        if (newOnes.length > 0) {
          setNewCount(n => n + newOnes.length);
          setQueued(prev => [...newOnes, ...prev]);
        }
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const handleLoadNew = () => {
    setArticles(prev => [...queued, ...prev]);
    setQueued([]);
    setNewCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async ({ title, content, category, media, blocksData }) => {
    setSubmitting(true);
    try {
      await articleApi.create({
        title,
        content,
        category:   category || 'GENERAL',
        visibility: 'PUBLIC',
        status:     'PENDING',
        tags:       '',
        media,
      });
      setPendingPosts(prev => [{
        id:          `pnd-${Date.now()}`,
        title,
        text:        content,
        blocksData,
        submittedAt: new Date().toISOString(),
      }, ...prev]);
      setTab('feed');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to publish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (article) => {
    try {
      const res = await articleApi.like(article.id);
      const s   = res.data?.data;
      setLikedIds(prev => {
        const n = new Set(prev);
        s?.liked ? n.add(article.id) : n.delete(article.id);
        return n;
      });
      setArticles(prev =>
        prev.map(a => a.id === article.id ? { ...a, likeCount: s?.likeCount ?? a.likeCount } : a)
      );
    } catch { /* silent */ }
  };

  const handleSave = async (article) => {
    try {
      const res = await articleApi.save(article.id);
      const s   = res.data?.data;
      setSavedIds(prev => {
        const n = new Set(prev);
        s?.saved ? n.add(article.id) : n.delete(article.id);
        return n;
      });
    } catch { /* silent */ }
  };

  return (
    <div className="np-root">
      <style>{CSS}</style>

      <Navbar
        title={<>Viet<span style={{ color: '#0D9488' }}>Money</span></>}
        subtitle="News"
      />

      {/* Tab bar */}
      <div className="np-tabs">
        <button className={`np-tab${tab === 'feed'  ? ' active' : ''}`} onClick={() => setTab('feed')}>
          Feed
          {newCount > 0 && <span className="np-notif">{newCount}</span>}
        </button>
        <button className={`np-tab${tab === 'write' ? ' active' : ''}`} onClick={() => setTab('write')}>
          Write article
        </button>
      </div>

      {/* Feed */}
      {tab === 'feed' && (
        <div className="np-feed-wrap">
          <div className="np-feed-col">
            {newCount > 0 && (
              <button className="np-new-banner" onClick={handleLoadNew}>
                ↑ {newCount} new article{newCount > 1 ? 's' : ''} — tap to load
              </button>
            )}

            {pendingPosts.map(p => <PendingCard key={p.id} post={p} />)}

            {loading && (
              <div className="np-loading">
                <span className="np-spin" />
                Loading articles…
              </div>
            )}

            {error && !loading && (
              <div className="np-empty">
                <div className="np-empty-icon">⚠️</div>
                <div className="np-empty-title">Something went wrong</div>
                <div className="np-empty-sub">{error}</div>
                <button className="np-empty-btn" onClick={() => loadFeed()}>Try again →</button>
              </div>
            )}

            {!loading && !error && articles.map(a => (
              <ArticleCard
                key={a.id}
                article={a}
                liked={likedIds.has(a.id)}
                saved={savedIds.has(a.id)}
                onLike={handleLike}
                onSave={handleSave}
              />
            ))}

            {!loading && !error && articles.length === 0 && pendingPosts.length === 0 && (
              <div className="np-empty">
                <div className="np-empty-icon">📰</div>
                <div className="np-empty-title">No articles yet</div>
                <div className="np-empty-sub">Be the first to share something with the community.</div>
                <button className="np-empty-btn" onClick={() => setTab('write')}>
                  Write an article →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Write */}
      {tab === 'write' && (
        <ArticleEditor onSubmit={handleSubmit} submitting={submitting} />
      )}
    </div>
  );
}