import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';

const STATIC_NEWS = [
  {
    img: '🌅',
    tag: 'Travel', tagColor: null,
    title: 'Top 5 Hidden Gems in Da Nang You Must Visit',
    excerpt: 'Da Nang offers much more than just beaches. Discover secret pagodas, local markets, and stunning viewpoints that most tourists never find.',
    author: { initial: 'A', name: 'Admin', time: '2h ago', gradient: null },
    likes: 142,
  },
  {
    img: '💸', imgBg: 'linear-gradient(135deg,#1a2535,#0d1525)',
    tag: 'Money', tagColor: 'var(--blue)', tagBg: 'rgba(61,143,242,0.1)',
    title: 'VND Exchange Rate Forecast — July 2025',
    excerpt: "Analysts predict a slight strengthening of the Vietnamese Dong against USD next quarter. Here's what travelers should know before their trip.",
    author: { initial: 'M', name: 'Mai', time: '5h ago', gradient: 'linear-gradient(135deg,var(--blue),var(--accent2))' },
    likes: 87,
  },
  {
    img: '🍜', imgBg: 'linear-gradient(135deg,#201505,#100800)',
    tag: 'Food', tagColor: 'var(--gold)', tagBg: 'rgba(242,196,61,0.1)',
    title: 'Best Street Food Under ₫50,000 in Hội An',
    excerpt: 'From Cao Lầu to White Rose dumplings — a budget traveler\'s guide to eating like a local without breaking the bank.',
    author: { initial: 'L', name: 'Lan', time: '1d ago', gradient: 'linear-gradient(135deg,var(--gold),var(--accent3))' },
    likes: 213,
  },
];

export default function NewsPage() {
  const [postText, setPostText] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [likes, setLikes] = useState(STATIC_NEWS.map(n => n.likes));

  const submitPost = () => {
    if (!postText.trim()) return;
    setUserPosts(prev => [{ text: postText, time: 'Just now' }, ...prev]);
    setPostText('');
  };

  const toggleLike = (idx) => {
    setLikes(prev => prev.map((l, i) => i === idx ? l + 1 : l));
  };

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
              <div className="post-name">Traveler</div>
              <div className="post-time">Share your experience...</div>
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
              <button className="attach-btn">📷 Photo</button>
              <button className="attach-btn">🎬 Video</button>
            </div>
            <button className="post-submit" onClick={submitPost}>Post</button>
          </div>
        </div>

        {/* User Posts */}
        {userPosts.map((p, i) => (
          <div className="news-card-item" key={i}>
            <div className="news-body">
              <span className="news-tag">You</span>
              <div className="news-title" style={{ fontSize: 14, fontWeight: 400 }}>{p.text}</div>
              <div className="news-footer">
                <div className="news-author">
                  <div className="news-author-dot">T</div>
                  <span>Traveler · {p.time}</span>
                </div>
                <div className="news-like">❤️ 0</div>
              </div>
            </div>
          </div>
        ))}

        {/* Static News */}
        {STATIC_NEWS.map((n, i) => (
          <div className="news-card-item" key={i}>
            <div className="news-img" style={n.imgBg ? { background: n.imgBg } : {}}>{n.img}</div>
            <div className="news-body">
              <span
                className="news-tag"
                style={n.tagColor ? { color: n.tagColor, background: n.tagBg } : {}}
              >{n.tag}</span>
              <div className="news-title">{n.title}</div>
              <div className="news-excerpt">{n.excerpt}</div>
              <div className="news-footer">
                <div className="news-author">
                  <div
                    className="news-author-dot"
                    style={n.author.gradient ? { background: n.author.gradient } : {}}
                  >{n.author.initial}</div>
                  <span>{n.author.name} · {n.author.time}</span>
                </div>
                <div className="news-like" onClick={() => toggleLike(i)} style={{ cursor: 'pointer' }}>
                  ❤️ {likes[i]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}
