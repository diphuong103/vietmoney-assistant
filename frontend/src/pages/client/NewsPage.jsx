import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import { useLocation } from 'react-router-dom';

import Navbar from '../../components/layout/Navbar';
import articleApi from '../../api/articleApi';
import mediaApi from '../../api/mediaApi';

import toast from 'react-hot-toast';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/* ═══════════════════════════════════════
   MODULE-LEVEL CACHE
   Tồn tại xuyên suốt mọi lần mount/unmount kể cả StrictMode.
   _viewedIds: articleId đã tính view (không tính lại)
   _fetchCache: Promise đang chạy hoặc data đã fetch (tránh double fetch)
═══════════════════════════════════════ */
const _viewedIds = new Set();
const _fetchCache = new Map(); // articleId → { promise, data }

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */

const CATEGORY_PALETTE = {
  GENERAL: { accent: '#6B7280', bg: 'rgba(107,114,128,.15)', text: '#6B7280', label: 'General' },
  TRAVEL: { accent: '#0D9488', bg: 'rgba(13,148,136,.15)', text: '#0D9488', label: 'Travel' },
  FOOD: { accent: '#F59E0B', bg: 'rgba(245,158,11,.15)', text: '#F59E0B', label: 'Food' },
  BUDGET: { accent: '#3B82F6', bg: 'rgba(59,130,246,.15)', text: '#3B82F6', label: 'Budget' },
  SCAM_ALERT: { accent: '#EF4444', bg: 'rgba(239,68,68,.15)', text: '#EF4444', label: 'Scam Alert' },
  TRANSPORT: { accent: '#8B5CF6', bg: 'rgba(139,92,246,.15)', text: '#8B5CF6', label: 'Transport' },
  HOTEL: { accent: '#10B981', bg: 'rgba(16,185,129,.15)', text: '#10B981', label: 'Hotel' },
  TIPS: { accent: '#EC4899', bg: 'rgba(236,72,153,.15)', text: '#EC4899', label: 'Tips' },
};

const STATUS_PALETTE = {
  PENDING: { accent: '#F59E0B', bg: 'rgba(245,158,11,.15)', text: '#F59E0B', label: 'Đang xử lý', icon: '⏳' },
  APPROVED: { accent: '#10B981', bg: 'rgba(16,185,129,.15)', text: '#10B981', label: 'Đã duyệt', icon: '✅' },
  REJECTED: { accent: '#EF4444', bg: 'rgba(239,68,68,.15)', text: '#EF4444', label: 'Bị từ chối', icon: '❌' },
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_PALETTE).map(([key, val]) => ({
  value: key,
  label: val.label,
  accent: val.accent,
}));

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

let _bid = 0;
const uid = () => `b${++_bid}`;
const mkText = (content = '') => ({ id: uid(), type: 'text', content });
const mkMedia = () => ({ id: uid(), type: 'media', items: [] });

const getCat = (raw = '') => CATEGORY_PALETTE[raw?.toUpperCase()?.trim()] || CATEGORY_PALETTE.GENERAL;
const getStatus = (raw) => (raw ? STATUS_PALETTE[raw.toUpperCase()] || null : null);

function initials(name = '') {
  const p = name.trim().split(/\s+/);
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}

.np-root{
  min-height:100vh;
  background:#0a0a0a;
  color:#fff;
  font-family:'Be Vietnam Pro',system-ui,sans-serif;
}

.np-wrap{
  width:100%;
  max-width:760px;
  margin:auto;
  padding:24px 16px 60px;
}

/* ── TABS ── */
.np-tabs{
  display:flex;
  gap:8px;
  margin-bottom:24px;
  background:#141414;
  padding:6px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.07);
  overflow-x:auto;
  scrollbar-width:none;
}
.np-tabs::-webkit-scrollbar{display:none;}
.np-tab{
  flex:1;
  min-width:90px;
  padding:10px;
  border:none;
  border-radius:10px;
  cursor:pointer;
  background:transparent;
  color:#666;
  font-size:13px;
  font-weight:600;
  font-family:inherit;
  transition:all .2s;
  white-space:nowrap;
}
.np-tab.active{
  background:#0D9488;
  color:#fff;
  box-shadow:0 4px 12px rgba(13,148,136,.35);
}
.np-tab:not(.active):hover{ background:#1f1f1f; color:#ccc; }

/* ── SEARCH BAR ── */
.np-search-bar{
  display:flex;
  gap:10px;
  margin-bottom:20px;
  align-items:center;
}
.np-search-input{
  flex:1;
  padding:11px 16px;
  background:#141414;
  border:1px solid rgba(255,255,255,.1);
  border-radius:12px;
  color:#fff;
  font-size:14px;
  font-family:inherit;
  outline:none;
  transition:border-color .2s;
}
.np-search-input:focus{ border-color:#0D9488; }
.np-search-input::placeholder{ color:#555; }
.np-search-btn{
  padding:11px 20px;
  background:#0D9488;
  border:none;
  border-radius:12px;
  color:#fff;
  font-size:14px;
  font-weight:700;
  font-family:inherit;
  cursor:pointer;
  transition:background .2s;
}
.np-search-btn:hover{ background:#0f766e; }

/* ── CATEGORY FILTER BAR ── */
.np-filter-bar{
  display:flex;
  gap:8px;
  margin-bottom:18px;
  flex-wrap:wrap;
}
.np-filter-chip{
  padding:6px 14px;
  border-radius:20px;
  border:1px solid rgba(255,255,255,.1);
  cursor:pointer;
  background:transparent;
  color:#777;
  font-size:12px;
  font-weight:700;
  font-family:inherit;
  transition:all .2s;
}
.np-filter-chip.active{
  border-color:var(--cat-accent);
  color:var(--cat-accent);
  background:var(--cat-bg);
}
.np-filter-chip:hover:not(.active){ color:#ccc; border-color:rgba(255,255,255,.2); }

/* ── EDITOR ── */
.np-editor{
  background:#141414;
  border-radius:20px;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.08);
}

.np-title-input{
  width:100%;
  padding:22px 24px 12px;
  border:none;
  outline:none;
  background:transparent;
  color:#fff;
  font-size:26px;
  font-weight:800;
  font-family:inherit;
  resize:none;
  min-height:70px;
  line-height:1.3;
}
.np-title-input::placeholder{ color:#333; }

.np-cat-row{
  padding:0 24px 16px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.np-cat-chip{
  padding:6px 14px;
  border-radius:20px;
  border:none;
  cursor:pointer;
  font-size:12px;
  font-weight:700;
  font-family:inherit;
  background:#1e1e1e;
  color:#777;
  border:1px solid transparent;
  transition:all .2s;
}
.np-cat-chip:hover{ color:#ccc; border-color:rgba(255,255,255,.1); }
.np-cat-chip.selected{
  border-color:var(--cat-accent);
  color:var(--cat-accent);
  background:var(--cat-bg);
}

.np-divider{
  height:1px;
  background:rgba(255,255,255,.06);
  margin:0 24px;
}

.np-block{ padding:16px 24px; }

.np-block-wrap{
  position:relative;
  margin-bottom:16px;
}
.np-block-remove{
  position:absolute;
  top:8px; right:8px;
  width:26px; height:26px;
  border:none; border-radius:50%;
  cursor:pointer;
  background:rgba(239,68,68,.15);
  color:#EF4444;
  font-size:12px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
  z-index:2;
  transition:background .2s;
}
.np-block-remove:hover{ background:rgba(239,68,68,.4); }

.np-textarea{
  width:100%;
  min-height:120px;
  border:1px solid rgba(255,255,255,.07);
  outline:none;
  resize:vertical;
  background:#1a1a1a;
  border-radius:14px;
  padding:16px;
  color:#e5e5e5;
  font-size:15px;
  line-height:1.85;
  font-family:inherit;
  transition:border-color .2s;
}
.np-textarea:focus{ border-color:rgba(13,148,136,.5); }
.np-textarea::placeholder{ color:#444; }

.np-media-box{
  border:1.5px dashed rgba(255,255,255,.1);
  border-radius:16px;
  padding:20px;
  transition:border-color .2s;
}
.np-media-box:hover{ border-color:rgba(255,255,255,.2); }

.np-media-actions{ display:flex; gap:10px; margin-bottom:16px; }

.np-btn{
  padding:9px 16px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:10px;
  cursor:pointer;
  background:#1e1e1e;
  color:#ccc;
  font-size:13px;
  font-weight:600;
  font-family:inherit;
  transition:all .2s;
}
.np-btn:hover{ background:#2a2a2a; color:#fff; border-color:rgba(255,255,255,.2); }
.np-btn:disabled{ opacity:.5; cursor:not-allowed; }

.np-publish{
  background:#0D9488;
  color:#fff;
  border-color:#0D9488;
  margin-left:auto;
}
.np-publish:hover{ background:#0f766e; border-color:#0f766e; }

.np-media-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:12px;
}
.np-media-item{
  position:relative;
  background:#111;
  border-radius:14px;
  overflow:hidden;
}
.np-media-item img,.np-media-item video{
  width:100%; height:200px; object-fit:cover; display:block;
}
.np-remove{
  position:absolute;
  top:8px; right:8px;
  width:28px; height:28px;
  border:none; border-radius:50%;
  cursor:pointer;
  background:rgba(0,0,0,.75);
  color:#fff;
  font-size:12px;
  display:flex; align-items:center; justify-content:center;
  transition:background .2s;
}
.np-remove:hover{ background:rgba(239,68,68,.9); }
.np-caption{
  width:100%; border:none; outline:none;
  background:#1a1a1a; color:#bbb;
  padding:10px 12px;
  font-size:12px; font-family:inherit;
  border-top:1px solid rgba(255,255,255,.05);
}

.np-editor-actions{
  padding:16px 24px 20px;
  display:flex;
  gap:10px;
  align-items:center;
  border-top:1px solid rgba(255,255,255,.06);
}

/* ── FEED ── */
.np-feed{ display:flex; flex-direction:column; gap:16px; }

.np-card{
  background:#141414;
  border-radius:20px;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.07);
  transition:border-color .25s, transform .2s;
}
.np-card:hover{
  border-color:rgba(255,255,255,.14);
  transform:translateY(-1px);
}

.np-card-header{
  padding:18px 20px 14px;
  display:flex;
  align-items:center;
  gap:12px;
}
.np-avatar{
  width:42px; height:42px;
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:14px;
  flex-shrink:0;
}
.np-author-name{ font-size:14px; font-weight:700; }
.np-author-meta{
  display:flex; align-items:center; gap:8px; margin-top:2px;
}

.np-badge{
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 10px;
  border-radius:20px;
  font-size:11px; font-weight:700;
  letter-spacing:.3px;
}
.np-status-badge{
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 10px;
  border-radius:20px;
  font-size:11px; font-weight:700;
}

.np-card-body{ padding:0 20px 16px; }
.np-card-title{
  font-size:21px; font-weight:800; line-height:1.3;
  margin-bottom:10px; color:#f0f0f0;
}
.np-card-content{
  color:#888; line-height:1.8; font-size:14px;
  display:-webkit-box;
  -webkit-line-clamp:4;
  -webkit-box-orient:vertical;
  overflow:hidden;
}

.np-rejection{
  margin-top:12px;
  padding:12px 14px;
  background:rgba(239,68,68,.08);
  border-left:3px solid #EF4444;
  border-radius:0 10px 10px 0;
  font-size:13px;
  color:#f87171;
}
.np-rejection strong{ display:block; margin-bottom:2px; font-size:12px; text-transform:uppercase; letter-spacing:.5px; }

.np-gallery{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:8px;
  margin-top:14px;
}
.np-gallery img,.np-gallery video{
  width:100%; border-radius:12px; display:block;
  max-height:300px; object-fit:cover;
}

.np-card-footer{
  padding:12px 20px;
  border-top:1px solid rgba(255,255,255,.05);
  display:flex;
  gap:8px; align-items:center;
}
.np-action-btn{
  padding:7px 14px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:10px;
  cursor:pointer;
  background:transparent;
  color:#777;
  font-size:13px; font-weight:600;
  font-family:inherit;
  transition:all .2s;
  display:flex; align-items:center; gap:5px;
}
.np-action-btn:hover{ background:#1e1e1e; color:#ccc; }
.np-action-btn.liked{
  color:#EF4444;
  border-color:rgba(239,68,68,.4);
  background:rgba(239,68,68,.1);
}
.np-action-btn.saved{
  color:#F59E0B;
  border-color:rgba(245,158,11,.4);
  background:rgba(245,158,11,.1);
}
@keyframes np-pop{
  0%  { transform:scale(1);   }
  40% { transform:scale(1.3); }
  70% { transform:scale(.9);  }
  100%{ transform:scale(1);   }
}
.np-action-btn.liked .np-btn-icon,
.np-action-btn.saved .np-btn-icon{
  display:inline-block;
  animation:np-pop .35s ease forwards;
}

.np-time{ color:#555; font-size:12px; margin-left:auto; }

/* ── DETAIL MODAL ── */
.np-modal-overlay{
  position:fixed; inset:0;
  background:rgba(0,0,0,.85);
  z-index:1000;
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  backdrop-filter:blur(4px);
}
.np-modal{
  background:#141414;
  border:1px solid rgba(255,255,255,.1);
  border-radius:24px;
  width:100%;
  max-width:680px;
  max-height:88vh;
  overflow-y:auto;
  position:relative;
  scrollbar-width:thin;
  scrollbar-color:#333 transparent;
}
.np-modal-close{
  position:absolute;
  top:16px; right:16px;
  width:34px; height:34px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:50%;
  background:#1e1e1e;
  color:#ccc;
  cursor:pointer;
  font-size:14px;
  display:flex; align-items:center; justify-content:center;
  transition:all .2s;
  z-index:2;
}
.np-modal-close:hover{ background:#2a2a2a; color:#fff; }
.np-modal-body{ padding:24px; }
.np-modal-title{
  font-size:24px; font-weight:800; line-height:1.35;
  margin:16px 0 12px; color:#f0f0f0;
}
.np-modal-content{
  color:#aaa; font-size:15px; line-height:1.8;
  white-space:pre-wrap;
}
.np-modal-meta{
  display:flex; gap:10px; flex-wrap:wrap;
  align-items:center; margin-bottom:12px;
}

/* ── HASHTAG row ── */
.np-hashtag-row{
  display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;
}
.np-hashtag{
  padding:4px 12px;
  background:#1e1e1e;
  border-radius:20px;
  font-size:12px; color:#0D9488;
  cursor:pointer;
  border:1px solid rgba(13,148,136,.2);
  transition:all .2s;
}
.np-hashtag:hover{ background:rgba(13,148,136,.12); }

/* ── RELATED ── */
.np-related-title{
  font-size:14px; font-weight:700; color:#888;
  text-transform:uppercase; letter-spacing:.6px;
  margin:24px 0 12px;
}
.np-related-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:10px;
}
.np-related-card{
  background:#1a1a1a;
  border:1px solid rgba(255,255,255,.06);
  border-radius:14px;
  padding:14px;
  cursor:pointer;
  transition:all .2s;
}
.np-related-card:hover{ border-color:rgba(255,255,255,.14); background:#202020; }
.np-related-card-title{
  font-size:13px; font-weight:700; line-height:1.4;
  color:#e5e5e5; margin-bottom:6px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}

/* ── EMPTY ── */
.np-empty{
  padding:80px 20px;
  text-align:center; color:#555;
}
.np-empty-icon{ font-size:48px; margin-bottom:12px; }
.np-empty-text{ font-size:15px; }

/* ══════════════════════════════════════
   FACEBOOK-STYLE COMMENTS
══════════════════════════════════════ */

.fb-comments-section{
  margin-top:20px;
  border-top:1px solid rgba(255,255,255,.07);
  padding-top:16px;
}

.fb-reactions-bar{
  display:flex;
  gap:4px;
  align-items:center;
  margin-bottom:12px;
  padding-bottom:12px;
  border-bottom:1px solid rgba(255,255,255,.06);
  flex-wrap:wrap;
}

.fb-reaction-total{
  display:flex;
  align-items:center;
  gap:4px;
  font-size:13px;
  color:#666;
  margin-right:auto;
}

.fb-reaction-emoji{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:20px; height:20px;
  border-radius:50%;
  font-size:13px;
  background:#1e1e1e;
}

.fb-action-row{
  display:flex;
  border-bottom:1px solid rgba(255,255,255,.06);
  margin-bottom:16px;
}

.fb-top-action{
  flex:1;
  padding:8px 4px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  font-size:14px;
  font-weight:600;
  color:#777;
  cursor:pointer;
  background:transparent;
  border:none;
  border-radius:8px;
  font-family:inherit;
  transition:background .15s, color .15s;
}
.fb-top-action:hover{ background:#1e1e1e; color:#ccc; }
.fb-top-action.active-like{ color:#4ade80; }
.fb-top-action.active-save{ color:#facc15; }

.fb-comment-sort{
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:14px;
  font-size:13px;
  font-weight:700;
  color:#ccc;
}
.fb-comment-sort select{
  background:#1e1e1e;
  border:1px solid rgba(255,255,255,.1);
  border-radius:8px;
  color:#ccc;
  padding:4px 10px;
  font-size:12px;
  font-family:inherit;
  outline:none;
  cursor:pointer;
}

/* Comment input row */
.fb-input-row{
  display:flex;
  gap:10px;
  align-items:flex-end;
  margin-bottom:20px;
}
.fb-input-avatar{
  width:36px; height:36px;
  border-radius:50%;
  background:#0D9488;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:800;
  flex-shrink:0;
  align-self:flex-end;
}
.fb-input-box{
  flex:1;
  background:#1e1e1e;
  border-radius:20px;
  border:1px solid rgba(255,255,255,.08);
  display:flex;
  align-items:flex-end;
  gap:8px;
  padding:8px 14px;
  transition:border-color .2s;
}
.fb-input-box:focus-within{
  border-color:rgba(13,148,136,.4);
}
.fb-input-textarea{
  flex:1;
  background:transparent;
  border:none;
  outline:none;
  color:#e5e5e5;
  font-size:14px;
  font-family:inherit;
  resize:none;
  min-height:20px;
  max-height:120px;
  line-height:1.5;
  overflow-y:auto;
}
.fb-input-textarea::placeholder{ color:#555; }
.fb-send-btn{
  width:32px; height:32px;
  border-radius:50%;
  border:none;
  background:#0D9488;
  color:#fff;
  font-size:15px;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background .2s, transform .1s;
  flex-shrink:0;
}
.fb-send-btn:hover{ background:#0f766e; }
.fb-send-btn:active{ transform:scale(.92); }
.fb-send-btn:disabled{ background:#333; cursor:not-allowed; }

/* Comment item */
.fb-comment{
  display:flex;
  gap:8px;
  margin-bottom:14px;
  animation:fb-in .2s ease;
}
@keyframes fb-in{
  from{ opacity:0; transform:translateY(6px); }
  to  { opacity:1; transform:none; }
}
.fb-comment-avatar{
  width:34px; height:34px;
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:800;
  flex-shrink:0;
  align-self:flex-start;
}
.fb-comment-body{
  flex:1;
  min-width:0;
}
.fb-comment-bubble{
  background:#1e1e1e;
  border-radius:0 16px 16px 16px;
  padding:10px 14px;
  display:inline-block;
  max-width:100%;
  word-break:break-word;
}
.fb-comment-author{
  font-size:13px;
  font-weight:700;
  color:#e5e5e5;
  margin-bottom:3px;
  display:flex;
  align-items:center;
  gap:6px;
}
.fb-author-tag{
  font-size:10px;
  font-weight:700;
  background:rgba(13,148,136,.2);
  color:#0D9488;
  padding:2px 8px;
  border-radius:10px;
}
.fb-comment-text{
  font-size:14px;
  color:#ccc;
  line-height:1.6;
}
.fb-comment-actions{
  display:flex;
  gap:12px;
  margin-top:5px;
  padding-left:2px;
  align-items:center;
}
.fb-cmt-action{
  font-size:12px;
  font-weight:700;
  color:#666;
  cursor:pointer;
  background:transparent;
  border:none;
  font-family:inherit;
  padding:0;
  transition:color .15s;
}
.fb-cmt-action:hover{ color:#ccc; }
.fb-cmt-action.active{ color:#4ade80; }
.fb-cmt-time{
  font-size:11px;
  color:#444;
}
.fb-cmt-action.delete-btn{ color:#555; }
.fb-cmt-action.delete-btn:hover{ color:#EF4444; }

/* Replies */
.fb-replies{
  margin-top:10px;
  padding-left:0;
}
.fb-show-replies{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:13px;
  font-weight:700;
  color:#0D9488;
  cursor:pointer;
  background:transparent;
  border:none;
  font-family:inherit;
  padding:4px 0;
  margin-top:4px;
  transition:color .15s;
}
.fb-show-replies:hover{ color:#14b8a6; }
.fb-show-replies::before{
  content:'';
  width:24px; height:1px;
  background:#0D9488;
  display:inline-block;
}

/* Reply input */
.fb-reply-input-row{
  display:flex;
  gap:8px;
  align-items:flex-end;
  margin-top:10px;
  padding-left:0;
}
.fb-reply-input{
  flex:1;
  background:#252525;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  display:flex;
  align-items:flex-end;
  gap:8px;
  padding:7px 12px;
  transition:border-color .2s;
}
.fb-reply-input:focus-within{ border-color:rgba(13,148,136,.4); }
.fb-reply-textarea{
  flex:1;
  background:transparent;
  border:none;
  outline:none;
  color:#e5e5e5;
  font-size:13px;
  font-family:inherit;
  resize:none;
  min-height:18px;
  max-height:80px;
  line-height:1.5;
  overflow-y:auto;
}
.fb-reply-textarea::placeholder{ color:#555; }
.fb-reply-send{
  width:26px; height:26px;
  border-radius:50%;
  border:none;
  background:#0D9488;
  color:#fff;
  font-size:13px;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background .2s;
  flex-shrink:0;
}
.fb-reply-send:hover{ background:#0f766e; }
.fb-reply-send:disabled{ background:#333; cursor:not-allowed; }

.fb-load-more{
  width:100%;
  padding:10px;
  background:transparent;
  border:1px solid rgba(255,255,255,.08);
  border-radius:12px;
  color:#666;
  font-size:13px;
  font-weight:600;
  font-family:inherit;
  cursor:pointer;
  transition:all .2s;
  margin-top:8px;
}
.fb-load-more:hover{ background:#1e1e1e; color:#ccc; }

@media(max-width:600px){
  .np-title-input{ font-size:22px; }
  .np-card-title{ font-size:18px; }
  .np-media-grid,.np-gallery{ grid-template-columns:1fr; }
  .np-cat-row{ gap:6px; }
}
`;

/* ═══════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════ */

function CategoryBadge({ category }) {
  const cat = getCat(category);
  return (
    <span className="np-badge" style={{ background: cat.bg, color: cat.text }}>
      {cat.label}
    </span>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const s = getStatus(status);
  if (!s) return null;
  return (
    <span className="np-status-badge" style={{ background: s.bg, color: s.text }}>
      {s.icon} {s.label}
    </span>
  );
}

function TextBlock({ block, onChange }) {
  return (
    <textarea
      className="np-textarea"
      placeholder="Viết nội dung..."
      value={block.content}
      onChange={(e) => onChange(block.id, { content: e.target.value })}
    />
  );
}

function MediaBlock({ block, onChange, onPick, removeMedia }) {
  return (
    <div className="np-media-box">
      <div className="np-media-actions">
        <button className="np-btn" onClick={() => onPick(block.id, false)}>📷 Thêm ảnh</button>
        <button className="np-btn" onClick={() => onPick(block.id, true)}>🎬 Thêm video</button>
      </div>
      {block.items.length > 0 && (
        <div className="np-media-grid">
          {block.items.map((item, idx) => (
            <div className="np-media-item" key={idx}>
              {item.isVideo
                ? <video src={item.preview} controls />
                : <img src={item.preview} alt="" />}
              <button className="np-remove" onClick={() => removeMedia(block.id, idx)}>✕</button>
              <input
                className="np-caption"
                placeholder="Chú thích..."
                value={item.caption}
                onChange={(e) => {
                  const updated = block.items.map((it, i) =>
                    i === idx ? { ...it, caption: e.target.value } : it
                  );
                  onChange(block.id, { items: updated });
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   COMMENT ITEM
═══════════════════════════════════════ */

function CommentItem({ comment, articleId, currentUser, onReplyPosted, onCommentDeleted }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [deleted, setDeleted] = useState(false);
  const replyRef = useRef(null);

  const avatarColor = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'][
    (comment.userId || 0) % 6
  ];

  if (deleted) return null;

  const loadReplies = async () => {
    if (replyLoading) return;
    setReplyLoading(true);
    try {
      const res = await articleApi.getReplies(articleId, comment.id);
      setReplies(res?.data?.data || []);
    } catch (e) {
      console.error('load replies fail', e);
    } finally {
      setReplyLoading(false);
    }
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) loadReplies();
    setShowReplies(!showReplies);
  };

  const handleReply = () => {
    setShowReplyInput(true);
    setTimeout(() => replyRef.current?.focus(), 50);
  };

  const submitReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);

    const optimisticReply = {
      id: `temp-${Date.now()}`,
      content: replyText.trim(),
      username: currentUser || 'Bạn',
      userId: -1,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isAuthor: false,
    };
    setReplies(prev => [...prev, optimisticReply]);
    setShowReplies(true);
    const savedText = replyText.trim();
    setReplyText('');
    setShowReplyInput(false);

    try {
      const res = await articleApi.createComment(articleId, {
        content: savedText,
        parentCommentId: comment.id,
      });
      const newReply = res?.data?.data;
      if (newReply) {
        setReplies(prev => prev.map(r => r.id === optimisticReply.id ? newReply : r));
        onReplyPosted?.();
      }
    } catch (e) {
      console.error('reply fail', e);
      setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
      setReplyText(savedText);
      setShowReplyInput(true);
    } finally {
      setSending(false);
    }
  };

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      await articleApi.likeComment?.(articleId, comment.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
    }
  };

  const handleDelete = async () => {
    setDeleted(true);
    onCommentDeleted?.();
    try {
      await articleApi.deleteComment(articleId, comment.id);
    } catch (e) {
      console.error('delete comment fail', e);
      setDeleted(false);
    }
  };

  const replyCount = comment.replyCount || replies.length || 0;
  const isOwner = currentUser && (comment.username === currentUser || comment.isOwn);

  return (
    <div className="fb-comment">
      <div className="fb-comment-avatar" style={{ background: avatarColor }}>
        {initials(comment.username || 'U')}
      </div>
      <div className="fb-comment-body">
        <div className="fb-comment-bubble">
          <div className="fb-comment-author">
            {comment.username || 'Người dùng'}
            {comment.isAuthor && <span className="fb-author-tag">Tác giả</span>}
          </div>
          <div className="fb-comment-text">{comment.content}</div>
        </div>

        <div className="fb-comment-actions">
          <button
            className={`fb-cmt-action${liked ? ' active' : ''}`}
            onClick={handleLike}
          >
            {liked ? '❤️' : 'Thích'}{likeCount > 0 ? ` ${likeCount}` : ''}
          </button>
          <button className="fb-cmt-action" onClick={handleReply}>Phản hồi</button>
          {isOwner && (
            <button className="fb-cmt-action delete-btn" onClick={handleDelete}>Xóa</button>
          )}
          <span className="fb-cmt-time">{dayjs(comment.createdAt).fromNow()}</span>
          {comment.isEdited && (
            <span className="fb-cmt-time">(đã chỉnh sửa)</span>
          )}
        </div>

        {(replyCount > 0 || replies.length > 0) && (
          <button className="fb-show-replies" onClick={toggleReplies}>
            {showReplies
              ? 'Ẩn phản hồi'
              : replyLoading
                ? 'Đang tải...'
                : `${replyCount} phản hồi`}
          </button>
        )}

        {showReplies && replies.length > 0 && (
          <div className="fb-replies">
            {replies.map(r => (
              <CommentItem
                key={r.id}
                comment={r}
                articleId={articleId}
                currentUser={currentUser}
                onReplyPosted={onReplyPosted}
                onCommentDeleted={onCommentDeleted}
              />
            ))}
          </div>
        )}

        {showReplyInput && (
          <div className="fb-reply-input-row">
            <div className="fb-reply-input">
              <textarea
                ref={replyRef}
                className="fb-reply-textarea"
                placeholder={`Phản hồi ${comment.username || ''}...`}
                value={replyText}
                rows={1}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitReply();
                  }
                  if (e.key === 'Escape') {
                    setShowReplyInput(false);
                    setReplyText('');
                  }
                }}
              />
              <button
                className="fb-reply-send"
                onClick={submitReply}
                disabled={!replyText.trim() || sending}
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COMMENTS SECTION
═══════════════════════════════════════ */

function CommentsSection({
  article,
  liked, saved, likeCount, saveCount, commentCount,
  onLike, onSave, onCommentCountChange,
  likeLoading, saveLoading,
  currentUser,
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef(null);

  const loadComments = useCallback(async (pageNum, append) => {
    try {
      if (!append) setLoading(true);
      const res = await articleApi.getComments(article.id, { page: pageNum, size: 10 });
      const data = res?.data?.data?.content || [];
      const totalPages = res?.data?.data?.totalPages || 1;
      if (append) {
        setComments(prev => [...prev, ...data]);
      } else {
        setComments(data);
      }
      setHasMore(pageNum + 1 < totalPages);
    } catch (e) {
      console.error('load comments fail', e);
    } finally {
      if (!append) setLoading(false);
    }
  }, [article.id]);

  useEffect(() => {
    loadComments(0, false);
  }, [loadComments]);

  const submitComment = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    const text = commentText.trim();

    // Optimistic: hiện ngay, tăng count ngay
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: text,
      username: currentUser || 'Bạn',
      userId: -1,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isAuthor: false,
    };
    setComments(prev => [optimisticComment, ...prev]);
    onCommentCountChange?.(1);
    setCommentText('');

    try {
      const res = await articleApi.createComment(article.id, { content: text });
      const newComment = res?.data?.data;
      if (newComment) {
        setComments(prev => prev.map(c => c.id === optimisticComment.id ? newComment : c));
      }
    } catch (e) {
      console.error('comment fail', e);
      // Rollback
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      onCommentCountChange?.(-1);
      setCommentText(text);
    } finally {
      setSending(false);
    }
  };

  const handleCommentDeleted = () => {
    onCommentCountChange?.(-1);
  };

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadComments(nextPage, true);
  }, [page, loadComments]);

  return (
    <div className="fb-comments-section">
      <div className="fb-reactions-bar">
        <div className="fb-reaction-total">
          {likeCount > 0 && (
            <>
              <span className="fb-reaction-emoji">❤️</span>
              <span>{likeCount}</span>
            </>
          )}
        </div>
        <span style={{ fontSize: 13, color: '#555' }}>
          {commentCount} bình luận
        </span>
        <span style={{ fontSize: 13, color: '#555' }}>
          · {saveCount || 0} lượt lưu
        </span>
      </div>

      <div className="fb-action-row">
        <button
          className={`fb-top-action${liked ? ' active-like' : ''}`}
          onClick={onLike}
          disabled={likeLoading}
        >
          <span
            key={`lk-${liked}`}
            style={{
              display: 'inline-block',
              animation: liked ? 'np-pop .35s ease forwards' : 'none',
            }}
          >
            {liked ? '❤️' : '🤍'}
          </span>
          {liked ? 'Đã thích' : 'Thích'}
        </button>

        <button
          className={`fb-top-action${saved ? ' active-save' : ''}`}
          onClick={onSave}
          disabled={saveLoading}
        >
          🔖 {saved ? 'Đã lưu' : 'Lưu bài'}
        </button>

        <button className="fb-top-action" onClick={() => inputRef.current?.focus()}>
          💬 Bình luận
        </button>
      </div>

      <div className="fb-input-row">
        <div className="fb-input-avatar">Me</div>
        <div className="fb-input-box">
          <textarea
            ref={inputRef}
            className="fb-input-textarea"
            placeholder="Viết bình luận..."
            value={commentText}
            rows={1}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
            }}
          />
          <button
            className="fb-send-btn"
            onClick={submitComment}
            disabled={!commentText.trim() || sending}
          >
            ➤
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#555', fontSize: 13, padding: '16px 0' }}>
          Đang tải bình luận...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#444', fontSize: 13, padding: '16px 0' }}>
          Hãy là người đầu tiên bình luận 💬
        </div>
      ) : (
        <>
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              articleId={article.id}
              currentUser={currentUser}
              onReplyPosted={() => onCommentCountChange?.(1)}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
          {hasMore && (
            <button className="fb-load-more" onClick={loadMore}>
              Xem thêm bình luận ↓
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
  ArticleDetail
═══════════════════════════════════════ */

function ArticleDetailModal({
  articleId,
  counts,             // { liked, saved, likeCount, saveCount, commentCount, viewCount, likeLoading, saveLoading }
  cachedArticle,      // article data đã fetch trước đó — nếu có thì không fetch lại
  onClose,
  onHashtagClick,
  onLike,
  onSave,
  onCommentCountChange,
  onArticleFetched,   // (articleId, articleData) => void
  currentUser,
}) {
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!articleId) return;

    let cancelled = false;

    // Nếu đã có React-state cache từ parent → dùng luôn, không fetch, không tăng view
    if (cachedArticle) {
      setArticle(cachedArticle);
      setLoading(false);
      articleApi
        .getRelated(articleId, { page: 0, size: 4 })
        .then(r => { if (!cancelled) setRelated(r?.data?.data?.content || []); })
        .catch(() => { });
      return () => { cancelled = true; };
    }

    // Kiểm tra module-level fetch cache (giải quyết StrictMode double-invoke)
    const cached = _fetchCache.get(articleId);
    if (cached?.data) {
      // Đã fetch xong trước đó (kể cả nếu StrictMode lần 1 đã chạy xong)
      setArticle(cached.data);
      setLoading(false);
      articleApi
        .getRelated(articleId, { page: 0, size: 4 })
        .then(r => { if (!cancelled) setRelated(r?.data?.data?.content || []); })
        .catch(() => { });
      return () => { cancelled = true; };
    }

    setArticle(null);
    setRelated([]);
    setLoading(true);

    // Nếu đang có in-flight promise (StrictMode lần 2) → dùng chung promise đó
    let promise = cached?.promise;
    if (!promise) {
      promise = articleApi.getById(articleId)
        .then(res => res?.data?.data || res?.data || null)
        .catch(e => { console.error('detail fetch failed', e); return null; });
      _fetchCache.set(articleId, { promise, data: null });
    }

    promise.then(a => {
      if (cancelled) return;
      setArticle(a);
      setLoading(false);

      if (a) {
        // Lưu data vào module cache và đánh dấu viewed
        _fetchCache.set(articleId, { promise, data: a });
        _viewedIds.add(articleId);
        onArticleFetched?.(articleId, a); // lưu vào React state của parent
      } else {
        setLoading(false);
      }

      articleApi
        .getRelated(articleId, { page: 0, size: 4 })
        .then(r => { if (!cancelled) setRelated(r?.data?.data?.content || []); })
        .catch(() => { });
    });

    return () => { cancelled = true; };
  }, [articleId, cachedArticle]); // eslint-disable-line

  const handleCommentCountChange = (delta) => {
    onCommentCountChange?.(articleId, delta);
  };

  if (!articleId) return null;

  const cat = getCat(article?.category);
  const c = counts || {};

  return (
    <div className="np-modal-overlay" onClick={onClose}>
      <div className="np-modal" onClick={e => e.stopPropagation()}>
        <button className="np-modal-close" onClick={onClose}>✕</button>

        {loading ? (
          <div className="np-empty" style={{ padding: 60 }}>
            <div className="np-empty-text">Đang tải...</div>
          </div>
        ) : !article ? (
          <div className="np-empty" style={{ padding: 60 }}>
            <div className="np-empty-text">Không tìm thấy bài viết</div>
          </div>
        ) : (
          <div className="np-modal-body">
            {/* META */}
            <div className="np-modal-meta">
              <div className="np-avatar" style={{ background: cat.accent, width: 36, height: 36, fontSize: 12 }}>
                {initials(article.authorName || 'VM')}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{article.authorName || 'VietMoney'}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{dayjs(article.createdAt).fromNow()}</div>
              </div>
              <CategoryBadge category={article.category} />
              {article.location && (
                <span style={{ fontSize: 12, color: '#666' }}>📍 {article.location}</span>
              )}
              {/* View count: ưu tiên từ counts (đã được +1 sau getById), fallback article */}
              <span style={{ fontSize: 12, color: '#555', marginLeft: 'auto' }}>
                👁 {c.viewCount ?? article.viewCount ?? 0}
              </span>
            </div>

            {/* TITLE */}
            <h2 className="np-modal-title">{article.title}</h2>

            {/* CONTENT */}
            <p className="np-modal-content">{article.content}</p>

            {/* HASHTAGS */}
            {article.hashtags?.length > 0 && (
              <div className="np-hashtag-row">
                {article.hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="np-hashtag"
                    onClick={() => { onHashtagClick?.(h.name || h); onClose(); }}
                  >
                    #{h.name || h}
                  </span>
                ))}
              </div>
            )}

            {/* MEDIA */}
            {article.mediaList?.length > 0 && (
              <div className="np-gallery" style={{ marginTop: 16 }}>
                {article.mediaList.map((m, i) =>
                  m.mediaType === 'VIDEO'
                    ? <video key={i} src={m.mediaUrl} controls />
                    : <img key={i} src={m.mediaUrl} alt={m.caption || ''} />
                )}
              </div>
            )}

            {/* REJECT */}
            {article.status === 'REJECTED' && article.rejectionReason && (
              <div className="np-rejection" style={{ marginTop: 16 }}>
                <strong>Lý do từ chối</strong>
                {article.rejectionReason}
              </div>
            )}

            {/* COMMENTS */}
            <CommentsSection
              article={article}
              liked={c.liked}
              saved={c.saved}
              likeCount={c.likeCount ?? article.likeCount ?? 0}
              saveCount={c.saveCount ?? article.saveCount ?? 0}
              commentCount={c.commentCount ?? article.commentCount ?? 0}
              onLike={() => onLike?.(articleId)}
              onSave={() => onSave?.(articleId)}
              onCommentCountChange={handleCommentCountChange}
              likeLoading={c.likeLoading}
              saveLoading={c.saveLoading}
              currentUser={currentUser}
            />

            {/* RELATED */}
            {related.length > 0 && (
              <>
                <div className="np-related-title">Bài viết liên quan</div>
                <div className="np-related-grid">
                  {related.map(r => (
                    <div key={r.id} className="np-related-card" onClick={onClose}>
                      <CategoryBadge category={r.category} />
                      <div className="np-related-card-title" style={{ marginTop: 8 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                        {dayjs(r.createdAt).fromNow()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ARTICLE CARD
   - Đọc liked/saved/counts từ parent (single source of truth)
═══════════════════════════════════════ */

const ArticleCard = memo(function ArticleCard({
  article,
  showStatus = false,
  onOpenDetail,
  onHashtagClick,
  onLike,
  onSave,
  counts,
}) {
  const cat = getCat(article.category);
  const c = counts || {
    liked: false, saved: false,
    likeCount: article.likeCount ?? 0,
    saveCount: article.saveCount ?? 0,
    commentCount: article.commentCount ?? 0,
    viewCount: article.viewCount ?? 0,
    likeLoading: false, saveLoading: false,
  };

  const handleLike = (e) => {
    e.stopPropagation();
    onLike?.(article.id);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onSave?.(article.id);
  };

  return (
    <article
      className="np-card"
      onClick={() => onOpenDetail?.(article.id)}
      style={{ cursor: 'pointer' }}
    >
      <div className="np-card-header" style={{ position: 'relative' }}>
        <div className="np-avatar" style={{ background: cat.accent }}>
          {initials(article.authorName || 'VM')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="np-author-name">{article.authorName || 'VietMoney'}</div>
          <div className="np-author-meta">
            <CategoryBadge category={article.category} />
            {showStatus && <StatusBadge status={article.status} />}
          </div>
        </div>
        {article.location && (
          <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto', paddingLeft: 8, flexShrink: 0 }}>
            📍 {article.location}
          </span>
        )}
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 12, color: '#888',
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(0,0,0,.35)', padding: '4px 8px',
          borderRadius: 999, backdropFilter: 'blur(6px)', pointerEvents: 'none',
        }}>
          👁 {c.viewCount}
        </div>
      </div>

      <div className="np-card-body">
        <h2 className="np-card-title">{article.title}</h2>
        <p className="np-card-content">{article.content}</p>

        {article.status === 'REJECTED' && article.rejectionReason && (
          <div className="np-rejection">
            <strong>Lý do từ chối</strong>
            {article.rejectionReason}
          </div>
        )}

        {article.hashtags?.length > 0 && (
          <div className="np-hashtag-row" style={{ marginTop: 12 }}>
            {article.hashtags.slice(0, 4).map((h, i) => (
              <span key={i} className="np-hashtag"
                onClick={e => { e.stopPropagation(); onHashtagClick?.(h.name || h); }}>
                #{h.name || h}
              </span>
            ))}
          </div>
        )}

        {article.mediaList?.length > 0 && (
          <div className="np-gallery">
            {article.mediaList.map((m, i) =>
              m.mediaType === 'VIDEO'
                ? <video key={i} src={m.mediaUrl} controls onClick={e => e.stopPropagation()} />
                : <img key={i} src={m.mediaUrl} alt={m.caption || ''} />
            )}
          </div>
        )}
      </div>

      <div className="np-card-footer">
        {/* Like: không disabled — hoạt động ngay ngay cả khi chưa sync status */}
        <button
          className={`np-action-btn${c.liked ? ' liked' : ''}`}
          onClick={handleLike}
          disabled={c.likeLoading}
        >
          <span className="np-btn-icon" key={`like-${c.liked}`}>{c.liked ? '♥' : '♡'}</span>
          {c.likeCount}
        </button>

        <button
          className={`np-action-btn${c.saved ? ' saved' : ''}`}
          onClick={handleSave}
          disabled={c.saveLoading}
        >
          <span className="np-btn-icon" key={`save-${c.saved}`}>🔖</span>
          {c.saveCount}
        </button>

        <button
          className="np-action-btn"
          onClick={e => { e.stopPropagation(); onOpenDetail?.(article.id); }}
          style={{ fontSize: 12 }}
        >
          💬 {c.commentCount}
        </button>

        <span className="np-time">{dayjs(article.createdAt).fromNow()}</span>
      </div>
    </article>
  );
});

/* ═══════════════════════════════════════
   ARTICLE EDITOR
═══════════════════════════════════════ */

function ArticleEditor({ onSubmit, submitting }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [blocks, setBlocks] = useState([mkText()]);

  const fileRef = useRef(null);
  const activeRef = useRef(null);
  const isVideoRef = useRef(false);

  const updateBlock = useCallback((id, patch) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const removeBlock = useCallback((id) => {
    setBlocks(prev => {
      const next = prev.filter(b => b.id !== id);
      return next.length > 0 ? next : [mkText()];
    });
  }, []);

  const removeMedia = useCallback((blockId, idx) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const items = [...b.items];
      URL.revokeObjectURL(items[idx].preview);
      items.splice(idx, 1);
      return { ...b, items };
    }));
  }, []);

  const pickFiles = (id, isVideo) => {
    activeRef.current = id;
    isVideoRef.current = isVideo;
    if (fileRef.current) {
      fileRef.current.accept = isVideo ? 'video/*' : 'image/*';
      fileRef.current.value = '';
      fileRef.current.click();
    }
  };

  const handleFiles = e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      caption: '',
    }));
    setBlocks(prev => prev.map(b =>
      b.id === activeRef.current
        ? { ...b, items: [...(b.items || []), ...mapped] }
        : b
    ));
  };

  const publish = async () => {
    if (submitting) return;

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề', {
        duration: 3000,
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(242,61,110,0.3)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        iconTheme: {
          primary: '#f23d6e',
          secondary: '#fff',
        },
      });
      return;
    }

    const textContent = blocks
        .filter(b => b.type === 'text')
        .map(b => b.content?.trim())
        .filter(Boolean)
        .join('\n\n');

    if (!textContent.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết', {
        duration: 3000,
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(242,61,110,0.3)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        iconTheme: {
          primary: '#f23d6e',
          secondary: '#fff',
        },
      });
      return;
    }

    try {
      const mediaItems = blocks.flatMap(b =>
          b.type === 'media' ? b.items : []
      );

      let uploaded = [];

      if (mediaItems.length > 0) {
        uploaded = await mediaApi.uploadMultipleMedia(
            mediaItems.map(m => m.file)
        );
      }

      const media = Array.isArray(uploaded)
          ? uploaded.map((u, i) => ({
            mediaUrl: u.mediaUrl || u.url || u.data?.url || '',
            mediaType: mediaItems[i]?.isVideo ? 'VIDEO' : 'IMAGE',
            fileSize: u.fileSize || u.size || null,
            mimeType: u.mimeType || u.contentType || null,
          }))
          : [];

      const payload = {
        title: title.trim(),
        content: textContent.trim(),
        category: category || 'GENERAL',
        visibility: 'PUBLIC',
        status: 'PENDING',
        location: '',
        hashtags: [],
        media: media.filter(m => m.mediaUrl),
      };

      await onSubmit(payload);

      setTitle('');
      setCategory('GENERAL');
      setBlocks([mkText()]);
    } catch (error) {
      console.error('Publish article failed:', error.response?.data || error);
      alert(error.response?.data?.message || 'Đăng bài thất bại');
    }
  };

  useEffect(() => {
    return () => {
      blocks.forEach(b => {
        if (b.type === 'media') b.items.forEach(item => URL.revokeObjectURL(item.preview));
      });
    };
  }, []); // eslint-disable-line

  return (
    <div className="np-editor">
      <textarea
        className="np-title-input"
        placeholder="Tiêu đề bài viết..."
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <div className="np-cat-row">
        {CATEGORY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`np-cat-chip${category === opt.value ? ' selected' : ''}`}
            style={{ '--cat-accent': opt.accent, '--cat-bg': getCat(opt.value).bg }}
            onClick={() => setCategory(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="np-divider" />
      <div className="np-block">
        {blocks.map(block => (
          <div key={block.id} className="np-block-wrap">
            {blocks.length > 1 && (
              <button className="np-block-remove" onClick={() => removeBlock(block.id)} title="Xoá block này">✕</button>
            )}
            {block.type === 'text'
              ? <TextBlock block={block} onChange={updateBlock} />
              : <MediaBlock block={block} onChange={updateBlock} onPick={pickFiles} removeMedia={removeMedia} />
            }
          </div>
        ))}
      </div>
      <div className="np-editor-actions">
        <button className="np-btn" onClick={() => setBlocks(p => [...p, mkText()])}>+ Văn bản</button>
        <button className="np-btn" onClick={() => setBlocks(p => [...p, mkMedia()])}>+ Media</button>
        <button className="np-btn np-publish" disabled={submitting} onClick={publish}>
          {submitting ? 'Đang upload và đăng...' : '🚀 Đăng bài'}
        </button>
      </div>
      <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
    </div>
  );
}

/* ═══════════════════════════════════════
   MY ARTICLES TAB
═══════════════════════════════════════ */

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: '⏳ Đang xử lý' },
  { value: 'APPROVED', label: '✅ Đã duyệt' },
  { value: 'REJECTED', label: '❌ Bị từ chối' },
];

function MyArticles({ onOpenDetail, onHashtagClick, articleStates, onLike, onSave }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await articleApi.getMyPosts({ status: statusFilter || undefined, page: 0, size: 20 });
      const data = res?.data?.data?.content || [];
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('load fail', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => {
          const s = getStatus(f.value);
          const active = statusFilter === f.value;
          return (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} style={{
              padding: '7px 16px',
              border: `1px solid ${active ? (s?.accent || '#0D9488') : 'rgba(255,255,255,.1)'}`,
              borderRadius: 20, cursor: 'pointer',
              background: active ? (s?.bg || 'rgba(13,148,136,.15)') : 'transparent',
              color: active ? (s?.text || '#0D9488') : '#666',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all .2s',
            }}>
              {f.label}
            </button>
          );
        })}
      </div>
      {!loading && (
        <div style={{ marginBottom: 16, fontSize: 13, color: '#555' }}>
          {statusFilter
            ? `${articles.length} bài ${STATUS_FILTERS.find(f => f.value === statusFilter)?.label?.toLowerCase()}`
            : `${articles.length} bài viết`}
        </div>
      )}
      {loading ? (
        <div className="np-empty"><div className="np-empty-text">Đang tải...</div></div>
      ) : articles.length === 0 ? (
        <div className="np-empty">
          <div className="np-empty-icon">
            {statusFilter === 'PENDING' ? '⏳' : statusFilter === 'APPROVED' ? '✅' : statusFilter === 'REJECTED' ? '❌' : '📝'}
          </div>
          <div className="np-empty-text">
            {statusFilter === 'PENDING' ? 'Không có bài đang chờ duyệt'
              : statusFilter === 'APPROVED' ? 'Không có bài đã duyệt'
                : statusFilter === 'REJECTED' ? 'Không có bài bị từ chối'
                  : 'Chưa có bài viết nào'}
          </div>
        </div>
      ) : (
        <div className="np-feed">
          {articles.map(a => (
            <ArticleCard
              key={a.id}
              article={a}
              showStatus
              counts={articleStates[a.id]}
              onOpenDetail={onOpenDetail}
              onHashtagClick={onHashtagClick}
              onLike={onLike}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   SAVED ARTICLES TAB
═══════════════════════════════════════ */

function SavedArticles({ onOpenDetail, onHashtagClick, articleStates, onLike, onSave }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await articleApi.getSaved({ page: 0, size: 20 });
        const raw = res?.data?.data?.content || [];
        setArticles(raw.map(s => s.article || s));
      } catch (e) {
        console.error('saved fail', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Ẩn ngay khi user bỏ lưu (không cần reload)
  const visibleArticles = articles.filter(a => {
    const s = articleStates[a.id];
    if (s && s.saved === false) return false;
    return true;
  });

  return loading ? (
    <div className="np-empty"><div className="np-empty-text">Đang tải...</div></div>
  ) : visibleArticles.length === 0 ? (
    <div className="np-empty">
      <div className="np-empty-icon">🔖</div>
      <div className="np-empty-text">Chưa lưu bài viết nào</div>
    </div>
  ) : (
    <div className="np-feed">
      {visibleArticles.map(a => (
        <ArticleCard
          key={a.id}
          article={a}
          counts={articleStates[a.id] || {
            liked: false, saved: true,
            likeCount: a.likeCount ?? 0,
            saveCount: a.saveCount ?? 0,
            commentCount: a.commentCount ?? 0,
            viewCount: a.viewCount ?? 0,
          }}
          onOpenDetail={onOpenDetail}
          onHashtagClick={onHashtagClick}
          onLike={onLike}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   TRENDING TAB
═══════════════════════════════════════ */

function TrendingFeed({ onOpenDetail, onHashtagClick, articleStates, onLike, onSave }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await articleApi.getTrending({ page: 0, size: 20 });
        const data = res?.data?.data?.content || [];
        setArticles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('trending fail', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return loading ? (
    <div className="np-empty"><div className="np-empty-text">Đang tải...</div></div>
  ) : articles.length === 0 ? (
    <div className="np-empty">
      <div className="np-empty-icon">🔥</div>
      <div className="np-empty-text">Không có bài trending</div>
    </div>
  ) : (
    <div className="np-feed">
      {articles.map((a, i) => (
        <div key={a.id} style={{ position: 'relative' }}>
          {i < 3 && (
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 2,
              background: i === 0 ? '#F59E0B' : i === 1 ? '#6B7280' : '#CD7F32',
              color: '#000', fontWeight: 800, fontSize: 11,
              padding: '3px 10px', borderRadius: 20,
            }}>
              #{i + 1} 🔥
            </div>
          )}
          <ArticleCard
            article={a}
            counts={articleStates[a.id]}
            onOpenDetail={onOpenDetail}
            onHashtagClick={onHashtagClick}
            onLike={onLike}
            onSave={onSave}
          />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   SEARCH TAB
═══════════════════════════════════════ */

function SearchTab({ initialKeyword = '', onOpenDetail, onHashtagClick, articleStates, onLike, onSave }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [input, setInput] = useState(initialKeyword);
  const [category, setCategory] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (kw, cat) => {
    if (!kw.trim() && !cat) return;
    setLoading(true);
    setSearched(true);
    try {
      let res;
      if (cat && !kw.trim()) {
        res = await articleApi.getByCategory(cat, { page: 0, size: 20 });
      } else if (kw.trim()) {
        res = await articleApi.search(kw.trim(), { page: 0, size: 20 });
      }
      const data = res?.data?.data?.content || [];
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('search fail', e);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialKeyword) doSearch(initialKeyword, '');
  }, [initialKeyword, doSearch]);

  const handleSubmit = () => {
    setKeyword(input);
    doSearch(input, category);
  };

  const handleCatFilter = (cat) => {
    setCategory(cat);
    doSearch(input, cat);
  };

  return (
    <div>
      <div className="np-search-bar">
        <input
          className="np-search-input"
          placeholder="🔍 Tìm kiếm bài viết, hashtag, địa điểm..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button className="np-search-btn" onClick={handleSubmit}>Tìm</button>
      </div>
      <div className="np-filter-bar">
        <button
          className={`np-filter-chip${!category ? ' active' : ''}`}
          style={{ '--cat-accent': '#0D9488', '--cat-bg': 'rgba(13,148,136,.15)' }}
          onClick={() => handleCatFilter('')}
        >
          Tất cả
        </button>
        {CATEGORY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`np-filter-chip${category === opt.value ? ' active' : ''}`}
            style={{ '--cat-accent': opt.accent, '--cat-bg': getCat(opt.value).bg }}
            onClick={() => handleCatFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="np-empty"><div className="np-empty-text">Đang tìm kiếm...</div></div>
      ) : !searched ? (
        <div className="np-empty">
          <div className="np-empty-icon">🔍</div>
          <div className="np-empty-text">Nhập từ khóa để tìm kiếm</div>
        </div>
      ) : articles.length === 0 ? (
        <div className="np-empty">
          <div className="np-empty-icon">😕</div>
          <div className="np-empty-text">Không tìm thấy kết quả</div>
        </div>
      ) : (
        <div className="np-feed">
          {articles.map(a => (
            <ArticleCard
              key={a.id}
              article={a}
              counts={articleStates[a.id]}
              onOpenDetail={onOpenDetail}
              onHashtagClick={h => { setInput('#' + h); doSearch('#' + h, ''); }}
              onLike={onLike}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE — NewsPage

   articleStates = single source of truth cho tất cả interaction states
   Shape: {
     [articleId]: {
       liked, saved,
       likeCount, saveCount, commentCount, viewCount,
       likeLoading, saveLoading,
     }
   }

   FIX SAVE COUNT:
   - handleSave chỉ update saveCount từ server nếu server trả về số thực
   - Không dùng `?? undefined` — nếu server không trả về saveCount thì giữ giá trị optimistic

   FIX INSTANT:
   - Optimistic update xảy ra TRƯỚC khi gọi API
   - Nếu API lỗi → rollback
   - statusReady đã bỏ → button không bị disabled khi chờ sync
═══════════════════════════════════════ */

export default function NewsPage() {
  const [tab, setTab] = useState('feed');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [articleStates, setArticleStates] = useState({});
  // Cache article data sau khi fetch — tránh re-fetch & double view khi mở lại
  const [articleCache, setArticleCache] = useState({});

  // Deep-link: khi navigate từ notification với state.openArticleId
  const location = useLocation();
  useEffect(() => {
    const aid = location.state?.openArticleId;
    if (aid) {
      setDetailId(aid);
      // Clear state để không mở lại khi re-render
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Helper: merge patch vào articleStates[id]
  const patchState = useCallback((id, patch) => {
    setArticleStates(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  // Init state từ article data — không ghi đè state hiện tại nếu đã có
  const initStateFromArticle = useCallback((a) => {
    setArticleStates(prev => {
      if (prev[a.id]) return prev;
      return {
        ...prev,
        [a.id]: {
          liked: a.liked ?? false,
          saved: a.saved ?? false,
          likeCount: a.likeCount ?? 0,
          saveCount: a.saveCount ?? 0,
          commentCount: a.commentCount ?? 0,
          viewCount: a.viewCount ?? 0,
          likeLoading: false,
          saveLoading: false,
        },
      };
    });
  }, []);

  // Load feed
  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await articleApi.getFeed({ page: 0, size: 20 });
      const data = res?.data?.data?.content || res?.data?.data || [];
      const list = Array.isArray(data) ? data : [];
      setArticles(list);
      list.forEach(a => initStateFromArticle(a));
      // Sync like/save status từ server trong background
      list.forEach(a => fetchStatusFor(a.id));
    } catch (e) {
      console.error('load fail', e);
    } finally {
      setLoading(false);
    }
  }, [initStateFromArticle]); // eslint-disable-line

  // Fetch status (like/save) cho 1 article — chỉ cập nhật liked/saved, giữ nguyên counts
  const fetchStatusFor = useCallback(async (articleId) => {
    try {
      const res = await articleApi.getStatus(articleId);
      const d = res?.data?.data;
      if (!d) return;
      setArticleStates(prev => {
        const existing = prev[articleId] || {};
        return {
          ...prev,
          [articleId]: {
            ...existing,
            liked: d.liked ?? existing.liked ?? false,
            saved: d.saved ?? existing.saved ?? false,
            // Chỉ cập nhật likeCount từ server nếu server trả về số >= 0
            ...(typeof d.likeCount === 'number' ? { likeCount: d.likeCount } : {}),
          },
        };
      });
    } catch {
      // bỏ qua lỗi, giữ nguyên state hiện tại
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  /* ── HANDLE LIKE ──
     Fix: chỉ update likeCount từ server khi server trả về số thực
  */
  const handleLike = useCallback(async (articleId) => {
    const prev = articleStates[articleId] || {};
    if (prev.likeLoading) return;

    const wasLiked = prev.liked ?? false;
    const prevLikeCount = prev.likeCount ?? 0;

    // Optimistic: cập nhật ngay
    patchState(articleId, {
      liked: !wasLiked,
      likeCount: Math.max(0, prevLikeCount + (wasLiked ? -1 : 1)),
      likeLoading: true,
    });

    try {
      const res = await articleApi.like(articleId);
      const d = res?.data?.data;

      setArticleStates(prev => {
        const s = prev[articleId] || {};
        return {
          ...prev,
          [articleId]: {
            ...s,
            liked: d?.liked ?? !wasLiked,
            // Chỉ dùng server likeCount nếu trả về số thực, không dùng undefined/null
            likeCount: (typeof d?.likeCount === 'number') ? d.likeCount : s.likeCount,
            likeLoading: false,
          },
        };
      });
    } catch {
      // Rollback
      patchState(articleId, {
        liked: wasLiked,
        likeCount: prevLikeCount,
        likeLoading: false,
      });
    }
  }, [articleStates, patchState]);

  /* ── HANDLE SAVE ──
     Fix chính: không dùng `d.saveCount ?? undefined`
     → Nếu server không trả về saveCount thì dùng giá trị optimistic đã tính
  */
  const handleSave = useCallback(async (articleId) => {
    const prev = articleStates[articleId] || {};
    if (prev.saveLoading) return;

    const wasSaved = prev.saved ?? false;
    const prevSaveCount = prev.saveCount ?? 0;

    // Optimistic: cập nhật ngay
    patchState(articleId, {
      saved: !wasSaved,
      saveCount: Math.max(0, prevSaveCount + (wasSaved ? -1 : 1)),
      saveLoading: true,
    });

    try {
      const res = await articleApi.save(articleId);
      const d = res?.data?.data;

      setArticleStates(prev => {
        const s = prev[articleId] || {};
        return {
          ...prev,
          [articleId]: {
            ...s,
            saved: d?.saved ?? !wasSaved,
            // KEY FIX: chỉ dùng saveCount từ server nếu là số thực
            saveCount: (typeof d?.saveCount === 'number') ? d.saveCount : s.saveCount,
            saveLoading: false,
          },
        };
      });
    } catch {
      // Rollback
      patchState(articleId, {
        saved: wasSaved,
        saveCount: prevSaveCount,
        saveLoading: false,
      });
    }
  }, [articleStates, patchState]);

  /* ── HANDLE COMMENT COUNT CHANGE ── */
  const handleCommentCountChange = useCallback((articleId, delta) => {
    setArticleStates(prev => {
      const s = prev[articleId] || {};
      return {
        ...prev,
        [articleId]: {
          ...s,
          commentCount: Math.max(0, (s.commentCount ?? 0) + delta),
        },
      };
    });
  }, []);

  /* ── OPEN DETAIL ──
     Fix view count: gọi fetchStatusFor trước để init state,
     viewCount sẽ được update sau khi getById gọi xong trong modal
  */
  const handleOpenDetail = useCallback((articleId) => {
    if (!articleStates[articleId]) {
      patchState(articleId, {
        liked: false, saved: false,
        likeCount: 0, saveCount: 0, commentCount: 0, viewCount: 0,
        likeLoading: false, saveLoading: false,
      });
      fetchStatusFor(articleId);
    }
    setDetailId(articleId);
  }, [articleStates, patchState, fetchStatusFor]);

  // Lưu article data vào cache sau khi modal fetch xong
  const handleArticleFetched = useCallback((articleId, articleData) => {
    setArticleCache(prev => ({ ...prev, [articleId]: articleData }));
    if (typeof articleData.viewCount === 'number') {
      setArticleStates(prev => {
        const s = prev[articleId] || {};
        return { ...prev, [articleId]: { ...s, viewCount: articleData.viewCount } };
      });
    }
  }, []);

  const handleHashtagClick = (tag) => {
    setSearchKeyword(tag);
    setTab('search');
  };

  const handleSubmit = async (payload) => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const requestBody = {
        title: payload.title?.trim() || '',
        content: payload.content?.trim() || '',
        category: payload.category || 'GENERAL',
        visibility: payload.visibility || 'PUBLIC',
        status: payload.status || 'PENDING',
        location: payload.location || '',
        hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
        media: Array.isArray(payload.media) ? payload.media : [],
      };

      console.log('Create article payload:', requestBody);

      const res = await articleApi.create(requestBody);
      const createdArticle = res?.data?.data;

      if (createdArticle) {
        setArticles(prev => [createdArticle, ...prev]);

        setArticleStates(prev => ({
          ...prev,
          [createdArticle.id]: {
            liked: false,
            saved: false,
            likeCount: createdArticle.likeCount ?? 0,
            saveCount: createdArticle.saveCount ?? 0,
            commentCount: createdArticle.commentCount ?? 0,
            viewCount: createdArticle.viewCount ?? 0,
            likeLoading: false,
            saveLoading: false,
          },
        }));
      }

      setTab('my');
    } catch (error) {
      console.warn('Create/update budget rejected:', e.response?.data);
      alert(error.response?.data?.message || 'Đăng bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const TABS = [
    { key: 'feed', label: '📰 Feed' },
    { key: 'trending', label: '🔥 Trending' },
    { key: 'write', label: '✍️ Viết bài' },
    { key: 'my', label: '📋 Của tôi' },
    { key: 'saved', label: '🔖 Đã lưu' },
    { key: 'search', label: '🔍 Tìm kiếm' },
  ];

  return (
    <div className="np-root">
      <style>{CSS}</style>

      <Navbar
        title={<>Viet<span style={{ color: '#0D9488' }}>Money</span></>}
        subtitle="News"
      />

      <div className="np-wrap">
        <div className="np-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`np-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'write' && (
          <ArticleEditor onSubmit={handleSubmit} submitting={submitting} />
        )}

        {tab === 'feed' && (
          <div className="np-feed">
            {loading ? (
              <div className="np-empty"><div className="np-empty-text">Đang tải...</div></div>
            ) : articles.length === 0 ? (
              <div className="np-empty">
                <div className="np-empty-icon">🗞️</div>
                <div className="np-empty-text">Chưa có bài viết nào</div>
              </div>
            ) : (
              articles.map(a => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  counts={articleStates[a.id]}
                  onOpenDetail={handleOpenDetail}
                  onHashtagClick={handleHashtagClick}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              ))
            )}
          </div>
        )}

        {tab === 'trending' && (
          <TrendingFeed
            articleStates={articleStates}
            onOpenDetail={handleOpenDetail}
            onHashtagClick={handleHashtagClick}
            onLike={handleLike}
            onSave={handleSave}
          />
        )}

        {tab === 'my' && (
          <MyArticles
            articleStates={articleStates}
            onOpenDetail={handleOpenDetail}
            onHashtagClick={handleHashtagClick}
            onLike={handleLike}
            onSave={handleSave}
          />
        )}

        {tab === 'saved' && (
          <SavedArticles
            articleStates={articleStates}
            onOpenDetail={handleOpenDetail}
            onHashtagClick={handleHashtagClick}
            onLike={handleLike}
            onSave={handleSave}
          />
        )}

        {tab === 'search' && (
          <SearchTab
            key={searchKeyword}
            initialKeyword={searchKeyword}
            articleStates={articleStates}
            onOpenDetail={handleOpenDetail}
            onHashtagClick={handleHashtagClick}
            onLike={handleLike}
            onSave={handleSave}
          />
        )}
      </div>

      {detailId && (
        <ArticleDetailModal
          articleId={detailId}
          counts={articleStates[detailId]}
          cachedArticle={articleCache[detailId] || null}
          onClose={() => setDetailId(null)}
          onHashtagClick={handleHashtagClick}
          onLike={handleLike}
          onSave={handleSave}
          onCommentCountChange={handleCommentCountChange}
          onArticleFetched={handleArticleFetched}
        />
      )}
    </div>
  );
}