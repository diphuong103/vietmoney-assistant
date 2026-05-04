import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/layout/Navbar';
import articleApi from '../../api/articleApi';
import { uploadToImgBB } from '../../services/imgbbService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Fallback static data khi chưa có bài viết từ backend
const FALLBACK_NEWS = [
  {
    id: 'local-1',
    img: '🌅',
    tag: 'Travel',
    title: 'Top 5 Hidden Gems in Da Nang You Must Visit',
    excerpt: 'Da Nang offers much more than just beaches. Discover secret pagodas, local markets, and stunning viewpoints that most tourists never find.',
    author: 'Admin', time: '2h ago', likes: 142,
  },
  {
    id: 'local-2',
    img: '💸', imgBg: 'linear-gradient(135deg,#1a2535,#0d1525)',
    tag: 'Money', tagColor: 'var(--blue)', tagBg: 'rgba(61,143,242,0.1)',
    title: 'VND Exchange Rate Forecast — July 2025',
    excerpt: "Analysts predict a slight strengthening of the Vietnamese Dong against USD next quarter. Here's what travelers should know.",
    author: 'Mai', time: '5h ago', likes: 87,
  },
  {
    id: 'local-3',
    img: '🍜', imgBg: 'linear-gradient(135deg,#201505,#100800)',
    tag: 'Food', tagColor: 'var(--gold)', tagBg: 'rgba(242,196,61,0.1)',
    title: 'Best Street Food Under ₫50,000 in Hội An',
    excerpt: 'From Cao Lầu to White Rose dumplings — a budget traveler\'s guide to eating like a local without breaking the bank.',
    author: 'Lan', time: '1d ago', likes: 213,
  },
];

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await articleApi.getAll({ page: 0, size: 20 });
        const data = res.data?.data?.content ?? res.data?.data ?? [];
        setArticles(data.length > 0 ? data : FALLBACK_NEWS);
      } catch {
        setArticles(FALLBACK_NEWS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const submitPost = async () => {
    if (!postText.trim() && !file) return;
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (file) {
        const resMedia = await uploadToImgBB(file, file.name || 'news.jpg');
        mediaUrl = resMedia.imageUrl;
        mediaType = 'IMAGE';
      }

      await articleApi.create({
        title: postText.substring(0, 100) || 'Status update',
        content: postText.trim(),
        category: 'User Post',
        mediaUrl,
        mediaType
      });
      setUserPosts(prev => [{ text: postText, time: 'Vừa xong', pending: true, mediaUrl, mediaType }, ...prev]);
      setPostText('');
      setFile(null);
      setFilePreview(null);
      alert('Bài viết đã gửi, đang chờ quản trị viên phê duyệt!');
    } catch {
      setUserPosts(prev => [{ text: postText, time: 'Vừa xong', pending: true }, ...prev]);
      setPostText('');
      setFile(null);
      setFilePreview(null);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleLike = async (article) => {
    try {
      await articleApi.like(article.id);
      setLikedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(article.id)) newSet.delete(article.id);
        else newSet.add(article.id);
        return newSet;
      });
    } catch {
      // silent — toast auto
    }
  };

  const handleSave = async (article) => {
    if (savedIds.has(article.id)) return;
    try {
      await articleApi.save(article.id);
      setSavedIds(prev => new Set(prev).add(article.id));
    } catch {
      // silent
    }
  };

  const getArticleEmoji = (a) => a.img ?? a.imageUrl ?? '📰';
  const getArticleTag = (a) => a.tag ?? a.category ?? 'News';

  return (
    <div className="page active" id="page-news">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="News"
        actions={<button className="icon-btn">🔍</button>}
      />
      <div style={{ height: 8 }} />

      <div className="news-feed">
        {/* Post Box */}
        <div className="news-post-box">
          <div className="post-user">
            <div className="post-avatar">T</div>
            <div>
              <div className="post-name">Share your experience</div>
              <div className="post-time">Viết gì đó về chuyến đi...</div>
            </div>
          </div>
          <textarea
            className="post-textarea"
            placeholder="What's happening on your trip?"
            rows={3}
            value={postText}
            onChange={e => setPostText(e.target.value)}
          />
          <div className="post-actions">
            <div className="post-attach">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
              <button className="attach-btn" onClick={() => fileInputRef.current.click()}>📷 Tải ảnh lên</button>
            </div>
            <button className="post-submit" onClick={submitPost}>Post</button>
          </div>
          {filePreview && (
            <div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
              <img src={filePreview} style={{ maxHeight: 150, borderRadius: 8 }} alt="preview" />
              <button onClick={() => { setFile(null); setFilePreview(null); }} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24 }}>×</button>
            </div>
          )}
        </div>

        {/* User Posts */}
        {userPosts.map((p, i) => (
          <div className="news-card-item" key={'u-' + i}>
            {p.mediaUrl && (
              <div className="news-img" style={{ padding: 0 }}>
                {p.mediaType === 'VIDEO' ? (
                  <video src={p.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                ) : (
                  <img src={p.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="media" />
                )}
              </div>
            )}
            <div className="news-body">
              <span className="news-tag" style={{ background: 'var(--accent)', color: '#fff' }}>
                {p.pending ? 'Chờ duyệt' : 'You'}
              </span>
              <div className="news-title" style={{ fontSize: 14, fontWeight: 400 }}>{p.text}</div>
              <div className="news-footer">
                <div className="news-author">
                  <div className="news-author-dot">T</div>
                  <span>You · {p.time}</span>
                </div>
                <div className="news-like">❤️ 0</div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
            <div style={{ fontSize: 24, animation: 'pulse 1.5s infinite' }}>📰</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải bài viết...</div>
          </div>
        )}

        {/* Articles */}
        {!loading && articles.map((n) => {
          const isBackend = !!n.createdAt;
          return (
            <div className="news-card-item" key={n.id}>
              <div className="news-img"
                style={n.imgBg && !n.mediaUrl ? { background: n.imgBg } : { padding: n.mediaUrl ? 0 : undefined }}
              >
                {n.mediaUrl ? (
                  n.mediaType === 'VIDEO' ? (
                    <video src={n.mediaUrl.startsWith('http') ? n.mediaUrl : `http://localhost:8080${n.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                  ) : (
                    <img src={n.mediaUrl.startsWith('http') ? n.mediaUrl : `http://localhost:8080${n.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="media" />
                  )
                ) : (
                  typeof getArticleEmoji(n) === 'string' && getArticleEmoji(n).length <= 4
                    ? getArticleEmoji(n)
                    : '📰'
                )}
              </div>
              <div className="news-body">
                <span
                  className="news-tag"
                  style={n.tagColor ? { color: n.tagColor, background: n.tagBg } : {}}
                >
                  {getArticleTag(n)}
                </span>
                <div className="news-title">{n.title}</div>
                <div className="news-excerpt">{n.excerpt ?? n.content?.slice(0, 120)}</div>
                <div className="news-footer">
                  <div className="news-author">
                    <div className="news-author-dot" style={n.author?.gradient ? { background: n.author.gradient } : {}}>
                      {(isBackend ? n.authorName?.[0] : n.author?.initial ?? n.author?.[0]) ?? 'A'}
                    </div>
                    <span>
                      {isBackend
                        ? `${n.authorName ?? 'User'} · ${dayjs(n.createdAt).fromNow()}`
                        : `${n.author?.name ?? n.author ?? 'Admin'} · ${n.author?.time ?? n.time ?? ''}`
                      }
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div
                      className="news-like"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleLike(n)}
                    >
                      {likedIds.has(n.id) ? '💖' : '❤️'} {(n.likeCount ?? n.likes ?? 0) + (likedIds.has(n.id) ? 1 : 0)}
                    </div>
                    <div
                      className="news-like"
                      style={{ cursor: 'pointer', opacity: savedIds.has(n.id) ? 1 : 0.6 }}
                      onClick={() => handleSave(n)}
                    >
                      {savedIds.has(n.id) ? '🔖 Đã lưu' : '📌 Lưu'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}
