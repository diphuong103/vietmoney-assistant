import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import articleApi from '../../api/articleApi';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

const FALLBACK_NEWS = [
  {
    id: 'local-1',
    tag: 'Travel',
    title: 'Top 5 Hidden Gems in Da Nang You Must Visit',
    content: 'Da Nang offers much more than just beaches. Discover secret pagodas, local markets, and stunning viewpoints that most tourists never find.',
    author: { fullName: 'Admin', username: 'admin' },
    likeCount: 142,
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    _fallback: true,
  },
  {
    id: 'local-2',
    tag: 'Money',
    title: 'VND Exchange Rate Forecast — July 2025',
    content: "Analysts predict a slight strengthening of the Vietnamese Dong against USD next quarter. Here's what travelers should know.",
    author: { fullName: 'Mai Linh', username: 'mai' },
    likeCount: 87,
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
    _fallback: true,
  },
  {
    id: 'local-3',
    tag: 'Food',
    title: 'Best Street Food Under ₫50,000 in Hội An',
    content: 'From Cao Lầu to White Rose dumplings — a budget traveler\'s guide to eating like a local without breaking the bank.',
    author: { fullName: 'Lan Anh', username: 'lan' },
    likeCount: 213,
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    _fallback: true,
  },
];

const TAG_COLORS = {
  Travel: { color: '#3DF2C8', bg: 'rgba(61,242,200,0.1)' },
  Money: { color: '#3D8FF2', bg: 'rgba(61,143,242,0.1)' },
  Food: { color: '#F2C43D', bg: 'rgba(242,196,61,0.1)' },
  News: { color: '#C8F23D', bg: 'rgba(200,242,61,0.1)' },
  default: { color: '#C8F23D', bg: 'rgba(200,242,61,0.1)' },
};

function getTagStyle(tag) {
  return TAG_COLORS[tag] || TAG_COLORS.default;
}

function AuthorAvatar({ author, size = 28 }) {
  const name = author?.fullName || author?.username || 'U';
  const initial = name[0].toUpperCase();
  if (author?.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div className="news-author-dot" style={{
      width: size, height: size, fontSize: size * 0.38,
      background: `linear-gradient(135deg, #3D8FF2, #3DF2C8)`,
    }}>
      {initial}
    </div>
  );
}

export default function NewsPage() {
  const { user } = useAuthStore();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});   // id -> bool
  const [savedMap, setSavedMap] = useState({});   // id -> bool
  const [likeCountMap, setLikeCountMap] = useState({});  // id -> number
  const [submitting, setSubmitting] = useState(false);

  // Post box state
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);

  // Load approved articles
  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await articleApi.getAll({ page: 0, size: 30 });
      const data = res.data?.data?.content ?? res.data?.data ?? [];
      const list = data.length > 0 ? data : FALLBACK_NEWS;
      setArticles(list);

      // hydrate like counts
      const counts = {};
      list.forEach(a => { counts[a.id] = a.likeCount ?? 0; });
      setLikeCountMap(counts);

      // fetch status for each article if user is logged in
      if (user && data.length > 0) {
        const statusResults = await Promise.allSettled(
          data.map(a => articleApi.getStatus(a.id))
        );
        const liked = {}, saved = {};
        statusResults.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const s = r.value.data?.data;
            liked[data[i].id] = s?.liked ?? false;
            saved[data[i].id] = s?.saved ?? false;
            counts[data[i].id] = s?.likeCount ?? data[i].likeCount ?? 0;
          }
        });
        setLikedMap(liked);
        setSavedMap(saved);
        setLikeCountMap({ ...counts });
      }
    } catch {
      setArticles(FALLBACK_NEWS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  // --- Image pick ---
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh (JPG, PNG, WEBP...)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 10MB');
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Submit post ---
  const submitPost = async () => {
    if (!postText.trim() && !imageFile) return;
    if (!user) { toast.error('Vui lòng đăng nhập để đăng bài'); return; }
    setSubmitting(true);
    try {
      let mediaUrl = null;
      let thumbnailUrl = null;

      if (imageFile) {
        setUploadingImg(true);
        try {
          const url = await articleApi.uploadToImgBB(imageFile);
          mediaUrl = url;
          thumbnailUrl = url;
        } catch {
          toast.error('Upload ảnh thất bại. Kiểm tra lại IMGBB API Key.');
          setSubmitting(false);
          setUploadingImg(false);
          return;
        }
        setUploadingImg(false);
      }

      const title = postText.trim().slice(0, 120) || 'Shared a photo';
      await articleApi.create({
        title,
        content: postText.trim() || '',
        thumbnailUrl,
        mediaUrl,
        mediaType: imageFile ? 'IMAGE' : null,
        tags: 'User Post',
      });

      toast.success('🎉 Bài viết đã gửi, chờ phê duyệt!', {
        style: { background: '#1a1a2e', color: '#C8F23D', border: '1px solid rgba(200,242,61,0.3)', borderRadius: '12px' },
      });
      setPostText('');
      removeImage();
    } catch {
      // error already handled by axiosClient global toast
    } finally {
      setSubmitting(false);
    }
  };

  // --- Like toggle ---
  const handleLike = async (article) => {
    if (!user) { toast.error('Đăng nhập để thích bài viết'); return; }
    if (article._fallback) return;

    const id = article.id;
    const wasLiked = likedMap[id] ?? false;
    // Optimistic update
    setLikedMap(prev => ({ ...prev, [id]: !wasLiked }));
    setLikeCountMap(prev => ({
      ...prev,
      [id]: (prev[id] ?? 0) + (wasLiked ? -1 : 1),
    }));

    try {
      const res = await articleApi.like(id);
      const s = res.data?.data;
      if (s) {
        setLikedMap(prev => ({ ...prev, [id]: s.liked }));
        setSavedMap(prev => ({ ...prev, [id]: s.saved }));
        setLikeCountMap(prev => ({ ...prev, [id]: s.likeCount }));
      }
    } catch {
      // revert
      setLikedMap(prev => ({ ...prev, [id]: wasLiked }));
      setLikeCountMap(prev => ({
        ...prev,
        [id]: (prev[id] ?? 0) + (wasLiked ? 1 : -1),
      }));
    }
  };

  // --- Save toggle ---
  const handleSave = async (article) => {
    if (!user) { toast.error('Đăng nhập để lưu bài viết'); return; }
    if (article._fallback) return;

    const id = article.id;
    const wasSaved = savedMap[id] ?? false;
    setSavedMap(prev => ({ ...prev, [id]: !wasSaved }));

    try {
      const res = await articleApi.save(id);
      const s = res.data?.data;
      if (s) {
        setLikedMap(prev => ({ ...prev, [id]: s.liked }));
        setSavedMap(prev => ({ ...prev, [id]: s.saved }));
        setLikeCountMap(prev => ({ ...prev, [id]: s.likeCount }));
      }
      if (!wasSaved) {
        toast.success('🔖 Đã lưu bài viết', {
          style: { background: '#1a1a2e', color: '#f2c43d', border: '1px solid rgba(242,196,61,0.3)', borderRadius: '12px' },
        });
      }
    } catch {
      setSavedMap(prev => ({ ...prev, [id]: wasSaved }));
    }
  };

  const userInitial = user?.fullName?.[0] ?? user?.username?.[0] ?? 'U';

  return (
    <div className="page active" id="page-news">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="News"
        actions={
          <button className="icon-btn" onClick={loadArticles} title="Làm mới">
            🔄
          </button>
        }
      />

      <div className="news-feed">
        {/* ── Post Box ── */}
        <div className="news-post-box">
          <div className="post-user">
            <div className="post-avatar">{userInitial.toUpperCase()}</div>
            <div>
              <div className="post-name">
                {user ? (user.fullName || user.username) : 'Khách'}
              </div>
              <div className="post-time">Chia sẻ trải nghiệm của bạn...</div>
            </div>
          </div>

          <textarea
            className="post-textarea"
            placeholder="Bạn đang nghĩ gì? Chia sẻ chuyến đi, mẹo tiết kiệm..."
            rows={3}
            value={postText}
            onChange={e => setPostText(e.target.value)}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="post-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button className="post-image-remove" onClick={removeImage} title="Xoá ảnh">✕</button>
              {uploadingImg && (
                <div className="post-image-uploading">
                  <div className="upload-spinner" />
                  <span>Đang upload...</span>
                </div>
              )}
            </div>
          )}

          <div className="post-actions">
            <div className="post-attach">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImagePick}
              />
              <button
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Photo
              </button>
            </div>
            <button
              className="post-submit"
              onClick={submitPost}
              disabled={submitting || (!postText.trim() && !imageFile)}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? '...' : 'Đăng'}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, animation: 'pulse 1.5s infinite' }}>📰</div>
            <div style={{ fontSize: 13, marginTop: 10 }}>Đang tải bài viết...</div>
          </div>
        )}

        {/* ── Feed ── */}
        {!loading && articles.map((article) => {
          const id = article.id;
          const liked = likedMap[id] ?? false;
          const saved = savedMap[id] ?? false;
          const likeCount = likeCountMap[id] ?? article.likeCount ?? 0;
          const tag = article.tag ?? article.tags ?? 'News';
          const tagStyle = getTagStyle(tag);
          const hasImage = article.thumbnailUrl || article.mediaUrl;
          const isFallback = article._fallback;

          return (
            <div className="news-feed-card" key={id}>
              {/* Header */}
              <div className="news-header-social">
                <AuthorAvatar author={article.author} size={36} />
                <div className="news-header-info">
                  <div className="news-header-name">
                    {article.author?.fullName || article.author?.username || 'User'}
                  </div>
                  <div className="news-header-time">
                    {dayjs(article.createdAt).fromNow()}
                  </div>
                </div>
              </div>

              {/* Body / Content */}
              <div className="news-body-social">
                {article.title !== 'Shared a photo' && (
                  <div className="news-status-text" style={{ fontSize: 14, marginBottom: 4 }}>
                    {article.title}
                  </div>
                )}
                {article.content && (
                  <div className="news-status-text" style={{ fontSize: 14, color: 'var(--muted)' }}>
                    {article.content.length > 200 ? article.content.slice(0, 200) + '... Xem thêm' : article.content}
                  </div>
                )}
              </div>

              {/* Image Gallery */}
              {hasImage ? (
                <div className="news-img-gallery" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 2, background: '#000' }}>
                  {(() => {
                    // split by comma if multiple images supported
                    const urlsStr = article.mediaUrl || article.thumbnailUrl || '';
                    const urls = urlsStr.includes(',') ? urlsStr.split(',').map(s => s.trim()) : [urlsStr];
                    return urls.map((url, idx) => (
                      <div key={idx} className="news-img-social" style={{ flex: '0 0 100%', scrollSnapAlign: 'start', position: 'relative' }}>
                        <img src={url} alt={article.title} loading="lazy" />
                        {urls.length > 1 && (
                          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 12 }}>
                            {idx + 1} / {urls.length}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="news-img news-img-emoji">
                  {tag === 'Travel' ? '🌅' : tag === 'Money' ? '💸' : tag === 'Food' ? '🍜' : '📰'}
                </div>
              )}

              {/* Footer / Actions */}
              <div className="news-footer-social">
                {/* Like */}
                <button
                  className={`news-action-btn${liked ? ' liked' : ''}`}
                  onClick={() => handleLike(article)}
                  title={liked ? 'Bỏ thích' : 'Thích'}
                  disabled={isFallback}
                >
                  <span className="news-btn-icon">{liked ? '💖' : '🤍'}</span>
                  <span>{likeCount}</span>
                </button>
                {/* Save */}
                <button
                  className={`news-action-btn${saved ? ' saved' : ''}`}
                  onClick={() => handleSave(article)}
                  title={saved ? 'Bỏ lưu' : 'Lưu bài'}
                  disabled={isFallback}
                >
                  <span className="news-btn-icon">{saved ? '🔖' : '📑'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {!loading && articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div>Chưa có bài viết nào được duyệt</div>
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
