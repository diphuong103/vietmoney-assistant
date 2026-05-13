import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';

import Navbar from '../../components/layout/Navbar';
import articleApi from '../../api/articleApi';
import mediaApi from '../../api/mediaApi';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */

const CATEGORY_PALETTE = {
  GENERAL: {
    accent: '#6B7280',
    bg: 'rgba(107,114,128,.15)',
    text: '#6B7280',
    label: 'General',
  },

  TRAVEL: {
    accent: '#0D9488',
    bg: 'rgba(13,148,136,.15)',
    text: '#0D9488',
    label: 'Travel',
  },

  FOOD: {
    accent: '#F59E0B',
    bg: 'rgba(245,158,11,.15)',
    text: '#F59E0B',
    label: 'Food',
  },

  BUDGET: {
    accent: '#3B82F6',
    bg: 'rgba(59,130,246,.15)',
    text: '#3B82F6',
    label: 'Budget',
  },

  SCAM_ALERT: {
    accent: '#EF4444',
    bg: 'rgba(239,68,68,.15)',
    text: '#EF4444',
    label: 'Scam Alert',
  },

  TRANSPORT: {
    accent: '#8B5CF6',
    bg: 'rgba(139,92,246,.15)',
    text: '#8B5CF6',
    label: 'Transport',
  },

  HOTEL: {
    accent: '#10B981',
    bg: 'rgba(16,185,129,.15)',
    text: '#10B981',
    label: 'Hotel',
  },

  TIPS: {
    accent: '#EC4899',
    bg: 'rgba(236,72,153,.15)',
    text: '#EC4899',
    label: 'Tips',
  },
};

const STATUS_PALETTE = {
  PENDING:  { accent: '#F59E0B', bg: 'rgba(245,158,11,.15)',  text: '#F59E0B', label: 'Đang xử lý', icon: '⏳' },
  APPROVED: { accent: '#10B981', bg: 'rgba(16,185,129,.15)',  text: '#10B981', label: 'Đã duyệt',   icon: '✅' },
  REJECTED: { accent: '#EF4444', bg: 'rgba(239,68,68,.15)',   text: '#EF4444', label: 'Bị từ chối', icon: '❌' },
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
const uid     = () => `b${++_bid}`;
const mkText  = (content = '') => ({ id: uid(), type: 'text', content });
const mkMedia = ()             => ({ id: uid(), type: 'media', items: [] });

const getCat = (raw = '') =>
  CATEGORY_PALETTE[raw?.toUpperCase()?.trim()] ||
  CATEGORY_PALETTE.GENERAL;
const getStatus = (raw)      => (raw ? STATUS_PALETTE[raw.toUpperCase()] || null : null);

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
}
.np-tab{
  flex:1;
  padding:10px;
  border:none;
  border-radius:10px;
  cursor:pointer;
  background:transparent;
  color:#666;
  font-size:14px;
  font-weight:600;
  font-family:inherit;
  transition:all .2s;
}
.np-tab.active{
  background:#0D9488;
  color:#fff;
  box-shadow:0 4px 12px rgba(13,148,136,.35);
}
.np-tab:not(.active):hover{ background:#1f1f1f; color:#ccc; }

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

/* Category selector */
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
  border-color: var(--cat-accent);
  color: var(--cat-accent);
  background: var(--cat-bg);
}

.np-divider{
  height:1px;
  background:rgba(255,255,255,.06);
  margin:0 24px;
}

/* Blocks */
.np-block{ padding:16px 24px; }

/* FIX 2: block wrapper for remove button */
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

/* Badges */
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

/* Rejection reason */
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
.np-action-btn.liked{ color:#EF4444; border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.07); }
.np-action-btn.saved{ color:#F59E0B; border-color:rgba(245,158,11,.3); background:rgba(245,158,11,.07); }

.np-time{ color:#555; font-size:12px; margin-left:auto; }

.np-empty{
  padding:80px 20px;
  text-align:center; color:#555;
}
.np-empty-icon{ font-size:48px; margin-bottom:12px; }
.np-empty-text{ font-size:15px; }

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

// FIX 1: StatusBadge giờ an toàn với undefined/null
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

// FIX 2: Caption onChange không còn mutate object gốc
function MediaBlock({ block, onChange, onPick, removeMedia }) {
  return (
    <div className="np-media-box">
      <div className="np-media-actions">
        <button className="np-btn" onClick={() => onPick(block.id, false)}>
          📷 Thêm ảnh
        </button>
        <button className="np-btn" onClick={() => onPick(block.id, true)}>
          🎬 Thêm video
        </button>
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
                  // Tạo object mới hoàn toàn thay vì mutate
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
   ARTICLE CARD
═══════════════════════════════════════ */

const ArticleCard = memo(function ArticleCard({ article, showStatus = false }) {
  const cat = getCat(article.category);

  return (
    <article className="np-card">
      <div className="np-card-header">
        <div className="np-avatar" style={{ background: cat.accent }}>
          {initials(article.authorName || 'VM')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="np-author-name">{article.authorName || 'VietMoney'}</div>
          <div className="np-author-meta">
            <CategoryBadge category={article.category} />
            {/* FIX 1: chỉ render StatusBadge khi showStatus=true */}
            {showStatus && <StatusBadge status={article.status} />}
          </div>
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

        {article.mediaList?.length > 0 && (
          <div className="np-gallery">
            {article.mediaList.map((m, i) =>
              m.mediaType === 'VIDEO'
                ? <video key={i} src={m.mediaUrl} controls />
                : <img key={i} src={m.mediaUrl} alt={m.caption || ''} />
            )}
          </div>
        )}
      </div>

      <div className="np-card-footer">
        <button className="np-action-btn">
          ♥ {article.likeCount || 0}
        </button>
        <button className="np-action-btn">
          🔖 {article.saveCount || 0}
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
  const [title,    setTitle]    = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [blocks,   setBlocks]   = useState([mkText()]);

  const fileRef    = useRef(null);
  const activeRef  = useRef(null);
  const isVideoRef = useRef(false);

  const updateBlock = useCallback((id, patch) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
  }, []);

  // FIX 2: hàm xoá block
  const removeBlock = useCallback((id) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length > 0 ? next : [mkText()];
    });
  }, []);

  const removeMedia = useCallback((blockId, idx) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const items = [...b.items];
      URL.revokeObjectURL(items[idx].preview);
      items.splice(idx, 1);
      return { ...b, items };
    }));
  }, []);

  const pickFiles = (id, isVideo) => {
    activeRef.current  = id;
    isVideoRef.current = isVideo;
    if (fileRef.current) {
      fileRef.current.accept = isVideo ? 'video/*' : 'image/*';
      fileRef.current.value  = '';
      fileRef.current.click();
    }
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      caption: '',
    }));
    setBlocks((prev) => prev.map((b) =>
      b.id === activeRef.current
        ? { ...b, items: [...(b.items || []), ...mapped] }
        : b
    ));
  };

  const publish = async () => {
    if (!title.trim()) return alert('Vui lòng nhập tiêu đề');
    try {
      const textContent = blocks
        .filter((b) => b.type === 'text')
        .map((b) => b.content)
        .join('\n\n');

      const mediaItems = blocks.flatMap((b) => b.type === 'media' ? b.items : []);

      let uploaded = [];
      if (mediaItems.length > 0) {
        uploaded = await mediaApi.uploadMultipleMedia(mediaItems.map((m) => m.file));
      }

      const media = uploaded.map((u, i) => ({
        mediaUrl:  u.url,
        mediaType: mediaItems[i].isVideo ? 'VIDEO' : 'IMAGE',
        fileSize:  u.fileSize,
        mimeType:  u.mimeType,
        caption:   mediaItems[i].caption,
      }));

      await onSubmit({ title, content: textContent, category: category.toUpperCase(), media });

      setTitle('');
      setCategory('GENERAL');
      setBlocks([mkText()]);
    } catch {
      alert('Đăng bài thất bại');
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      blocks.forEach((b) => {
        if (b.type === 'media') b.items.forEach((item) => URL.revokeObjectURL(item.preview));
      });
    };
  }, []); // eslint-disable-line

  const cat = getCat(category);

  return (
    <div className="np-editor">
      <textarea
        className="np-title-input"
        placeholder="Tiêu đề bài viết..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Category picker */}
      <div className="np-cat-row">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`np-cat-chip${category === opt.value ? ' selected' : ''}`}
            style={{
              '--cat-accent': opt.accent,
              '--cat-bg': getCat(opt.value).bg,
            }}
            onClick={() => setCategory(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="np-divider" />

      {/* Blocks — FIX 2: mỗi block có nút ✕ để xoá */}
      <div className="np-block">
        {blocks.map((block) => (
          <div key={block.id} className="np-block-wrap">
            {blocks.length > 1 && (
              <button
                className="np-block-remove"
                onClick={() => removeBlock(block.id)}
                title="Xoá block này"
              >
                ✕
              </button>
            )}
            {block.type === 'text'
              ? <TextBlock block={block} onChange={updateBlock} />
              : <MediaBlock block={block} onChange={updateBlock} onPick={pickFiles} removeMedia={removeMedia} />
            }
          </div>
        ))}
      </div>

      <div className="np-editor-actions">
        <button className="np-btn" onClick={() => setBlocks((p) => [...p, mkText()])}>
          + Văn bản
        </button>
        <button className="np-btn" onClick={() => setBlocks((p) => [...p, mkMedia()])}>
          + Media
        </button>
        <button className="np-btn np-publish" disabled={submitting} onClick={publish}>
          {submitting ? 'Đang đăng...' : '🚀 Đăng bài'}
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
  { value: '',         label: 'Tất cả'       },
  { value: 'PENDING',  label: '⏳ Đang xử lý' },
  { value: 'APPROVED', label: '✅ Đã duyệt'   },
  { value: 'REJECTED', label: '❌ Bị từ chối' },
];

function MyArticles() {
  const [statusFilter, setStatusFilter] = useState('');
  const [articles,     setArticles]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // FIX 3: dùng đúng tên hàm getMyPosts (không phải getMyArticles)
      const res  = await articleApi.getMyPosts({ status: statusFilter, page: 0, size: 20 });
      const data = res?.data?.data?.content || res?.data?.data || [];
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      // FIX 3: catch phải có tham số để dùng
      console.error('load fail', e?.response?.status, e?.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => {
          const s      = getStatus(f.value);
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: '7px 16px',
                border: `1px solid ${active ? (s?.accent || '#0D9488') : 'rgba(255,255,255,.1)'}`,
                borderRadius: 20,
                cursor: 'pointer',
                background: active ? (s?.bg || 'rgba(13,148,136,.15)') : 'transparent',
                color: active ? (s?.text || '#0D9488') : '#666',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all .2s',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="np-empty"><div className="np-empty-text">Đang tải...</div></div>
      ) : articles.length === 0 ? (
        <div className="np-empty">
          <div className="np-empty-icon">📝</div>
          <div className="np-empty-text">Chưa có bài viết nào</div>
        </div>
      ) : (
        <div className="np-feed">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} showStatus />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */

export default function NewsPage() {
  const [tab,        setTab]        = useState('feed');
  const [articles,   setArticles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await articleApi.getFeed({ page: 0, size: 20 });
      const data = res?.data?.data?.content || res?.data?.data || [];
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      // FIX 3: catch có tham số
      console.error('load fail', e?.response?.status, e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await articleApi.create({ ...payload, visibility: 'PUBLIC', status: 'PENDING' });
      setTab('feed');
      await loadFeed();
    } finally {
      setSubmitting(false);
    }
  };

  const TABS = [
    { key: 'feed',  label: '📰 Feed'        },
    { key: 'write', label: '✍️ Viết bài'    },
    { key: 'my',    label: '📋 Bài của tôi' },
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
          {TABS.map((t) => (
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
              articles.map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </div>
        )}

        {tab === 'my' && <MyArticles />}
      </div>
    </div>
  );
}