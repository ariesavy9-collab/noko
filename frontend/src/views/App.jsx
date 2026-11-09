import React, { useEffect, useState } from 'react';
import {
  FaArrowLeft, FaBell, FaBookmark, FaCheckCircle, FaChevronDown, FaCompass,
  FaEllipsisH, FaEye, FaHeart, FaHome, FaLink, FaLock, FaPaperPlane,
  FaPlay, FaPlus, FaRegCommentDots, FaSearch, FaShareAlt, FaSignOutAlt,
  FaSpinner, FaThumbsUp, FaTrash, FaUser, FaTimes, FaVideo, FaWhatsapp
} from 'react-icons/fa';
import { channel, formatCount, timeAgo } from '../models/channel';
import { getErrorMessage } from '../models/api';
import { avatarOptions, avatarUrl } from '../models/avatars';
import useChannelController from '../controllers/useChannelController';
import './App.css';

const heroImage = 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85';

function brandMark() {
  return <span className="brand-mark" aria-hidden="true">N</span>;
}

function Avatar({ user, className }) {
  if (user?.avatarId) return <img className={className} src={avatarUrl(user.avatarId)} alt="" />;
  return <span className={className}>{user?.name?.slice(0, 1).toUpperCase() || 'N'}</span>;
}

function Header({ user, search, setSearch, onAuth, onSignOut, onDashboard, onEditProfile, onLoadNotifications, onMarkNotificationsRead, onOpenNotification }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return () => { active = false; };
    }
    const refresh = async () => {
      try {
        const data = await onLoadNotifications();
        if (active) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
          setNotificationsError('');
        }
      } catch (error) {
        if (active) setNotificationsError(getErrorMessage(error));
      }
    };
    refresh();
    const intervalId = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user?.id, onLoadNotifications]);
  const toggleNotifications = async () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }
    if (!user) {
      onAuth();
      return;
    }
    setNotificationsOpen(true);
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      await onMarkNotificationsRead();
      const data = await onLoadNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
    } finally {
      setNotificationsLoading(false);
    }
  };
  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Noko Mashaba home">
        {brandMark()}<span>Noko <b>Mashaba</b></span>
      </a>
      <div className={`searchbox ${searchOpen ? 'mobile-search-open' : ''}`} role="search">
        <button type="button" className="search-trigger" onClick={() => setSearchOpen((open) => !open)} aria-label="Search videos"><FaSearch aria-hidden="true" /></button>
        <input aria-label="Search videos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Noko Mashaba's videos..." />
        {search && <button aria-label="Clear search" onClick={() => setSearch('')}><FaTimes /></button>}
      </div>
      <div className="top-actions">
        <button className={`icon-button notification-button ${notificationsOpen ? 'active' : ''} ${unreadCount ? 'has-unread' : ''}`} onClick={toggleNotifications} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'} aria-expanded={notificationsOpen} title="Notifications">
          <FaBell />{unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        {notificationsOpen && <section className="notification-popover" aria-label="Recent notifications">
          <div className="notification-popover-header"><div><strong>Notifications</strong><span>Recent channel activity</span></div><button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><FaTimes /></button></div>
          {notificationsLoading ? <p className="notification-state">Loading activity...</p>
            : notificationsError ? <p className="notification-state notification-error">{notificationsError}</p>
              : notifications.length === 0 ? <p className="notification-state">No recent activity yet.</p>
                : <div className="notification-list">{notifications.map((item) => <button className={`notification-item ${item.readAt ? '' : 'unread'}`} key={item.id} onClick={() => { onOpenNotification(item); setNotificationsOpen(false); }}>
                  <Avatar user={item.actor} className="notification-avatar" />
                  <span className="notification-copy"><strong>{item.actor.name}</strong><span>{item.type === 'like' ? `liked ${item.title}` : item.type === 'reply' ? `replied on ${item.title}` : `commented on ${item.title}`}</span>{item.detail && <small>{item.detail}</small>}<time>{timeAgo(item.createdAt)}</time></span>
                  {item.type === 'like' ? <FaThumbsUp className="notification-kind like-kind" /> : <FaRegCommentDots className="notification-kind" />}
                </button>)}</div>}
        </section>}
        <button className="user-avatar" onClick={() => user ? setMenuOpen((open) => !open) : onAuth()} aria-label={user ? 'Open account menu' : 'Sign in'}>
          {user ? <Avatar user={user} className="user-avatar-image" /> : 'N'}
        </button>
        {menuOpen && <div className="account-menu">
          <strong>{user?.name}</strong><span>{user?.email}</span>
          <button onClick={() => { onEditProfile(); setMenuOpen(false); }}><FaUser /> Edit profile</button>
          {user?.role === 'creator' && <button onClick={() => { onDashboard(); setMenuOpen(false); }}><FaVideo /> Creator dashboard</button>}
          <button onClick={() => { onSignOut(); setMenuOpen(false); }}><FaSignOutAlt /> Sign out</button>
        </div>}
      </div>
    </header>
  );
}

function SideNav({ section, setSection, user, onDashboard }) {
  const items = [
    { name: 'Home', icon: <FaHome /> },
    { name: 'Videos', icon: <FaPlay /> },
    { name: 'Liked', icon: <FaHeart /> },
    { name: 'Saved', icon: <FaBookmark /> },
    { name: 'Share Feed', icon: <FaPaperPlane /> }
  ];
  return (
    <aside className="sidebar">
      <nav aria-label="Main navigation">
        {items.map((item) => <button key={item.name} className={`nav-item ${section === item.name ? 'active' : ''}`} onClick={() => setSection(item.name)}>
          <span>{item.icon}</span>{item.name}
        </button>)}
        {user?.role === 'creator' && <button className={`nav-item ${section === 'Creator dashboard' ? 'active' : ''}`} onClick={onDashboard}>
          <span><FaCompass /></span>Creator dashboard
        </button>}
      </nav>
      <div className="sidebar-signature">
        <div className="signature-name">Noko <b>Mashaba</b></div>
        <span>Watch. Like. Share.</span>
      </div>
    </aside>
  );
}

function MobileNav({ section, setSection, user, onDashboard }) {
  const items = [
    { name: 'Home', icon: <FaHome /> },
    { name: 'Videos', icon: <FaPlay /> },
    { name: 'Liked', icon: <FaHeart /> },
    { name: 'Saved', icon: <FaBookmark /> }
  ];
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    {items.map((item) => <button key={item.name} className={section === item.name ? 'active' : ''} onClick={() => setSection(item.name)}>
      {item.icon}<span>{item.name}</span>
    </button>)}
    {user?.role === 'creator' && <button className={section === 'Creator dashboard' ? 'active' : ''} onClick={onDashboard}><FaCompass /><span>Manage</span></button>}
  </nav>;
}

function VideoCard({ post, onPlay, onLike, onComments, onSave, onShare, saved }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className="video-card">
      <button className="thumbnail-button" onClick={() => onPlay(post)} aria-label={`Play ${post.title}`}>
        <img src={post.thumbnail} alt="" loading="lazy" />
        <span className="play-button"><FaPlay /></span>
        <span className="video-duration">{post.category}</span>
      </button>
      <div className="video-info">
        <div className="video-heading">
          <div>
            <h3>{post.title}</h3>
            <p><FaEye aria-hidden="true" /> {formatCount(post.views)} views · {formatCount(post.likes)} likes · {timeAgo(post.publishedAt)}</p>
          </div>
          <button className="icon-button card-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Video options"><FaEllipsisH /></button>
          {menuOpen && <div className="share-menu card-menu">
            <button onClick={() => { onSave(post); setMenuOpen(false); }}><FaBookmark />{saved ? 'Remove from Saved' : 'Save video'}</button>
            <button onClick={() => { onShare(post); setMenuOpen(false); }}><FaLink />Copy link</button>
            <button onClick={() => { onShare(post, 'whatsapp'); setMenuOpen(false); }}><FaWhatsapp />Share to WhatsApp</button>
          </div>}
        </div>
        <div className="video-actions">
          <button className={`action-button ${post.liked ? 'liked' : ''}`} onClick={() => onLike(post)} aria-label={post.liked ? 'Unlike video' : 'Like video'}>
            <FaThumbsUp /><span>{formatCount(post.likes)}</span>
          </button>
          <button className="action-button" onClick={() => onComments(post)} aria-label={`Read ${post.comments} comments`}>
            <FaRegCommentDots /><span>{formatCount(post.comments)}</span>
          </button>
          <button className="action-button share-action" onClick={() => onShare(post)} aria-label={`Share ${post.title}`}><FaShareAlt /><span>Share</span></button>
          <button className={`icon-button save-button ${saved ? 'saved' : ''}`} onClick={() => onSave(post)} aria-label={saved ? 'Remove from saved' : 'Save video'}><FaBookmark /></button>
        </div>
      </div>
    </article>
  );
}

function AuthModal({ onClose, onSubmit }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit(values, mode);
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="auth-modal modal-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
      {brandMark()}
      <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Join the community'}</h2>
      <p>{mode === 'login' ? 'Sign in to like videos and join the conversation.' : 'Create an account to connect with Noko.'}</p>
      <form onSubmit={submit}>
        {mode === 'register' && <label>Your name<input required minLength="2" maxLength="60" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} autoComplete="name" /></label>}
        <label>Email address<input required type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} autoComplete="email" /></label>
        <label>Password<input required minLength={mode === 'register' ? 8 : undefined} type="password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button wide-button" disabled={busy}>{busy ? <FaSpinner className="spin" /> : <FaLock />}{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <div className="auth-switch">{mode === 'login' ? "New here?" : 'Already part of the community?'}
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? ' Create account' : ' Sign in'}</button>
      </div>
    </section>
  </div>;
}

function VideoModal({ post, comments, user, onClose, onAddComment, onDeleteComment, onRequireAuth }) {
  const [text, setText] = useState('');
  const [replyText, setReplyText] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const roots = comments.filter((comment) => !comment.parentComment);
  const repliesFor = (id) => comments.filter((comment) => String(comment.parentComment) === String(id));
  const submitComment = async (event, parentId = null) => {
    event.preventDefault();
    const content = parentId ? replyText[parentId] : text;
    if (!user) { onRequireAuth(); return; }
    if (!content?.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onAddComment(post.id, content, parentId);
      if (parentId) setReplyText((current) => ({ ...current, [parentId]: '' }));
      else setText('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  const commentAuthorId = (comment) => comment.user?._id || comment.user?.id;
  const mayDelete = (comment) => user && (user.role === 'creator' || user.id === commentAuthorId(comment));
  return <div className="modal-backdrop video-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="video-modal modal-panel" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
      <button className="modal-close video-modal-close" onClick={onClose} aria-label="Close video"><FaTimes /></button>
      <div className="video-player"><iframe src={`https://www.youtube-nocookie.com/embed/${post.videoId}?autoplay=1&rel=0`} title={post.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
      <div className="video-modal-content">
        <h2 id="video-modal-title">{post.title}</h2>
        <p className="video-modal-meta">{post.category} · <FaEye aria-hidden="true" /> {formatCount(post.views)} views · {timeAgo(post.publishedAt)}</p>
        {post.description && <p className="video-description">{post.description}</p>}
        <div className="comments-heading"><h3><FaRegCommentDots aria-hidden="true" /> Comments <span>{post.comments}</span></h3></div>
        <form className="comment-form" onSubmit={(event) => submitComment(event)}>
          {user && <Avatar user={user} className="comment-form-avatar" />}
          <input readOnly={!user} value={text} onChange={(event) => setText(event.target.value)} placeholder={user ? 'Add a comment...' : 'Sign in to comment'} maxLength="1000" onClick={() => !user && onRequireAuth()} onFocus={() => !user && onRequireAuth()} />
          <button className="send-button" disabled={busy || !text.trim()} aria-label="Post comment"><FaPaperPlane /></button>
        </form>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="comment-list">
          {roots.length === 0 && <div className="empty-comments">Be the first to share your thoughts.</div>}
          {roots.map((comment) => <div className="comment-thread" key={comment._id}>
            <div className="comment-row">
              <Avatar user={comment.user} className={`comment-avatar ${comment.user?.role === 'creator' ? 'creator-avatar' : ''}`} />
              <div className="comment-body"><div className="comment-author">{comment.user?.name}{comment.user?.role === 'creator' && <span className="creator-badge">Creator</span>}<small>{timeAgo(comment.createdAt)}</small></div>
                <p>{comment.content}</p>
                {user?.role === 'creator' && <form className="reply-form" onSubmit={(event) => submitComment(event, comment._id)}>
                  <input value={replyText[comment._id] || ''} onChange={(event) => setReplyText((current) => ({ ...current, [comment._id]: event.target.value }))} placeholder="Reply as creator..." maxLength="1000" />
                  <button disabled={busy || !replyText[comment._id]?.trim()} aria-label="Send reply"><FaPaperPlane /></button>
                </form>}
              </div>
              {mayDelete(comment) && <button className="comment-delete" onClick={() => onDeleteComment(comment._id).catch((requestError) => setError(getErrorMessage(requestError)))} aria-label="Delete comment"><FaTrash /></button>}
            </div>
            {repliesFor(comment._id).map((reply) => <div className="comment-row reply-row" key={reply._id}>
              <Avatar user={reply.user} className={`comment-avatar ${reply.user?.role === 'creator' ? 'creator-avatar' : ''}`} />
              <div className="comment-body"><div className="comment-author">{reply.user?.name}{reply.user?.role === 'creator' && <span className="creator-badge">Creator</span>}<small>{timeAgo(reply.createdAt)}</small></div><p>{reply.content}</p></div>
              {mayDelete(reply) && <button className="comment-delete" onClick={() => onDeleteComment(reply._id).catch((requestError) => setError(getErrorMessage(requestError)))} aria-label="Delete reply"><FaTrash /></button>}
            </div>)}
          </div>)}
        </div>
      </div>
    </section>
  </div>;
}

function ProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [avatarId, setAvatarId] = useState(user.avatarId || avatarOptions[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ name, avatarId });
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="profile-modal modal-panel" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button className="modal-close" onClick={onClose} aria-label="Close profile editor"><FaTimes /></button>
      <span className="eyebrow">YOUR ACCOUNT</span><h2 id="profile-title">Customize your profile</h2>
      <p>Choose a display name and an avatar for your comments and channel activity.</p>
      <form onSubmit={submit}>
        <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength="60" /></label>
        <fieldset className="avatar-picker"><legend>Choose an avatar</legend>
          {avatarOptions.map((option) => <button type="button" key={option.id} className={`avatar-option ${avatarId === option.id ? 'selected' : ''}`} onClick={() => setAvatarId(option.id)} aria-label={`Select avatar ${option.id.slice(-1)}`} aria-pressed={avatarId === option.id}>
            <img src={option.src} alt="" />
          </button>)}
        </fieldset>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button wide-button" disabled={busy}>{busy ? <FaSpinner className="spin" /> : <FaCheckCircle />} Save profile</button>
      </form>
    </section>
  </div>;
}

function CreatorDashboard({ posts, dashboard, onCreatePost, onDeletePost, onReply, onDeleteComment, onChangePassword }) {
  const [form, setForm] = useState({ title: '', category: 'Comedy', videoId: '', description: '' });
  const [replyText, setReplyText] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onCreatePost(form);
      setForm({ title: '', category: 'Comedy', videoId: '', description: '' });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (requestError) {
      setPasswordError(getErrorMessage(requestError));
    } finally {
      setPasswordBusy(false);
    }
  };
  const rootComments = (dashboard?.recentComments || []).filter((comment) => !comment.parentComment);
  return <section className="dashboard-page">
    <div className="dashboard-title"><div><span className="eyebrow">CHANNEL MANAGEMENT</span><h1>Creator dashboard</h1><p>Your content, community, all in one place.</p></div><div className="creator-pill"><FaUser /> Creator account</div></div>
    <div className="stats-grid">
      <div className="stat-card"><span>Published videos</span><strong>{dashboard?.stats.videos ?? posts.length}</strong><FaVideo /></div>
      <div className="stat-card"><span>Community likes</span><strong>{formatCount(dashboard?.stats.likes || 0)}</strong><FaHeart /></div>
      <div className="stat-card"><span>Video views</span><strong>{formatCount(dashboard?.stats.views || 0)}</strong><FaEye /></div>
      <div className="stat-card"><span>Comments</span><strong>{formatCount(dashboard?.stats.comments || 0)}</strong><FaRegCommentDots /></div>
    </div>
    <div className="dashboard-columns">
      <section className="dashboard-panel publish-panel">
        <div className="panel-title"><span className="panel-icon"><FaPlus /></span><div><h2>Publish a video</h2><p>Add a YouTube video to your channel.</p></div></div>
        <form className="publish-form" onSubmit={submit}>
          <label>Video title<input required maxLength="120" placeholder="Give your video a title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>YouTube link or video ID<input required placeholder="https://youtu.be/..." value={form.videoId} onChange={(event) => setForm({ ...form, videoId: event.target.value })} /></label>
          <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Comedy</option><option>Anime</option></select></label>
          <label>Description<textarea rows="3" maxLength="2000" placeholder="Tell your audience a little more..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button" disabled={busy}>{busy ? <FaSpinner className="spin" /> : <FaPlus />} Publish video</button>
        </form>
      </section>
      <section className="dashboard-panel content-panel">
        <div className="panel-title"><span className="panel-icon"><FaVideo /></span><div><h2>Your videos</h2><p>Manage your published content.</p></div></div>
        {posts.length ? <div className="manage-list">{posts.map((post) => <div className="manage-video" key={post.id}>
          <img src={post.thumbnail} alt="" /><div className="manage-video-copy"><strong>{post.title}</strong><span><FaEye aria-hidden="true" /> {formatCount(post.views)} views · {formatCount(post.likes)} likes · {post.category}</span></div>
          <button className="delete-video" onClick={() => window.confirm(`Delete "${post.title}"? This will also remove its comments and likes.`) && onDeletePost(post.id)} aria-label={`Delete ${post.title}`}><FaTrash /></button>
        </div>)}</div> : <p className="empty-state">Your videos will appear here.</p>}
      </section>
    </div>
    <section className="dashboard-panel security-panel">
      <div className="panel-title"><span className="panel-icon"><FaLock /></span><div><h2>Account security</h2><p>Change your creator account password.</p></div></div>
      <form className="password-form" onSubmit={changePassword}>
        <label>Current password<input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength="8" maxLength="72" required value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" maxLength="72" required value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
        {passwordError && <div className="form-error" role="alert">{passwordError}</div>}
        <button className="primary-button" disabled={passwordBusy}>{passwordBusy ? <FaSpinner className="spin" /> : <FaLock />} Change password</button>
      </form>
    </section>
    <section className="dashboard-panel moderation-panel">
      <div className="panel-title"><span className="panel-icon"><FaRegCommentDots /></span><div><h2>Community conversations</h2><p>Reply to your audience or remove a comment.</p></div></div>
      {rootComments.length ? <div className="moderation-list">{rootComments.map((comment) => <div className="moderation-item" key={comment._id}>
        <Avatar user={comment.user} className="comment-avatar" />
        <div className="moderation-copy"><div className="comment-author">{comment.user?.name}<small>{comment.post?.title} · {timeAgo(comment.createdAt)}</small></div><p>{comment.content}</p>
          <form className="reply-form" onSubmit={async (event) => { event.preventDefault(); if (!replyText[comment._id]?.trim()) return; try { await onReply(comment.post?._id, replyText[comment._id], comment._id); setReplyText((current) => ({ ...current, [comment._id]: '' })); } catch (requestError) { setError(getErrorMessage(requestError)); } }}>
            <input value={replyText[comment._id] || ''} onChange={(event) => setReplyText((current) => ({ ...current, [comment._id]: event.target.value }))} placeholder="Reply as creator..." maxLength="1000" />
            <button disabled={!replyText[comment._id]?.trim()} aria-label="Send reply"><FaPaperPlane /></button>
          </form>
        </div>
        <button className="comment-delete" onClick={() => onDeleteComment(comment._id).catch((requestError) => setError(getErrorMessage(requestError)))} aria-label="Delete comment"><FaTrash /></button>
      </div>)}</div> : <p className="empty-state">No comments yet. Your community is just getting started.</p>}
    </section>
  </section>;
}

export default function App() {
  const controller = useChannelController();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (controller.section === 'Creator dashboard' && controller.user?.role === 'creator') {
      controller.refreshDashboard().catch((error) => controller.notify(getErrorMessage(error)));
    }
  }, [controller.section, controller.user, controller.refreshDashboard, controller.notify]);

  useEffect(() => {
    const videoId = new URLSearchParams(window.location.search).get('video');
    const post = controller.posts.find((item) => item.videoId === videoId);
    if (post && controller.activePost?.id !== post.id) controller.openComments(post);
  }, [controller.posts, controller.activePost, controller.openComments]);

  const goDashboard = () => controller.setSection('Creator dashboard');
  const openNotification = (item) => {
    const post = controller.posts.find((candidate) => candidate.id === item.postId);
    if (post) controller.openComments(post);
    else controller.notify('That video is no longer available.');
  };
  const sharePost = async (post, method) => {
    if (!controller.user) {
      controller.notify('Sign in before sharing content.');
      setAuthOpen(true);
      return;
    }
    const url = post.videoId ? `${window.location.origin}/?video=${post.videoId}` : `${window.location.origin}/`;
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${url}`)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      controller.notify('Video link copied.');
    } catch {
      setSharingPost({ ...post, url });
    }
  };
  const runLike = async (post) => {
    try {
      await controller.toggleLike(post);
    } catch (error) {
      setActionError(getErrorMessage(error));
      if (!controller.user) setAuthOpen(true);
    }
  };
  const pageTitle = controller.section === 'Liked' ? 'Videos you liked'
    : controller.section === 'Saved' ? 'Saved for later'
      : controller.section === 'Share Feed' ? 'Share the good vibes'
        : controller.section === 'Videos' ? 'All videos' : 'Videos';

  return <div className="app-shell">
    <Header user={controller.user} search={controller.search} setSearch={controller.setSearch} onAuth={() => setAuthOpen(true)} onSignOut={controller.signOut} onDashboard={goDashboard}
      onEditProfile={() => setProfileOpen(true)} onLoadNotifications={controller.loadNotifications} onMarkNotificationsRead={controller.markNotificationsRead} onOpenNotification={openNotification} />
    <SideNav section={controller.section} setSection={controller.setSection} user={controller.user} onDashboard={goDashboard} />
    <main className="main-content">
      {controller.section === 'Creator dashboard' && controller.user?.role === 'creator' ? <CreatorDashboard
        posts={controller.posts}
        dashboard={controller.dashboard}
        onCreatePost={controller.createPost}
        onDeletePost={controller.deletePost}
        onReply={controller.addComment}
        onDeleteComment={controller.deleteComment}
        onChangePassword={controller.changePassword}
      /> : <>
        <section className="channel-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,6,18,.24), rgba(10,6,18,.18)), url("${heroImage}")` }}>
          <div className="hero-copy"><h1>Noko Mashaba</h1><p>WATCH. LIKE. SHARE.</p><span className="hero-underline" /></div>
        </section>
        <section className="channel-profile">
          <div className="channel-avatar">{brandMark()}</div>
          <div className="channel-details"><h2>{channel.name}<FaCheckCircle className="verified-icon" /></h2><p>{channel.tagline}</p></div>
          <button className="primary-button share-channel" onClick={() => sharePost({ title: 'Noko Mashaba channel', videoId: '' })}><FaShareAlt /> Share Channel</button>
          <button className="channel-more icon-button" aria-label="More channel options" onClick={() => controller.notify('You’re viewing Noko Mashaba’s official channel.')}><FaEllipsisH /></button>
        </section>

        <div className="mobile-channel-heading"><button onClick={() => controller.setSection('Home')}><FaArrowLeft /></button><strong>Noko Mashaba</strong><button onClick={() => setAuthOpen(true)}><FaEllipsisH /></button></div>

            {controller.section !== 'Liked' && controller.section !== 'Saved' && <nav className="category-nav" aria-label="Video categories">
              {channel.categories.map((item) => <button key={item} className={controller.category === item ? 'selected' : ''} onClick={() => { controller.setCategory(item); controller.setSection('Home'); }}>
            {item}{item === 'All Videos' && <FaChevronDown className="category-chevron" />}
          </button>)}
        </nav>}

        <section className="video-section">
          <div className="section-heading"><div><span className="eyebrow">{controller.section === 'Home' ? 'THE OFFICIAL CHANNEL' : 'YOUR COLLECTION'}</span><h2>{pageTitle}</h2></div>
            {controller.section !== 'Liked' && controller.section !== 'Saved' && <button className="explore-button" onClick={() => controller.setSection('Videos')}><FaCompass /> Explore all</button>}
          </div>
          {actionError && <div className="inline-notice" role="alert">{actionError}<button onClick={() => setActionError('')} aria-label="Dismiss"><FaTimes /></button></div>}
          {controller.error && <div className="load-error" role="alert"><p>{controller.error}</p><button className="primary-button" onClick={controller.loadPosts}>Try again</button></div>}
          {!controller.error && controller.loading && <div className="loading-state"><FaSpinner className="spin" /> Loading videos...</div>}
          {!controller.error && !controller.loading && controller.visiblePosts.length > 0 && <div className="video-grid">
            {controller.visiblePosts.map((post) => <VideoCard key={post.id} post={post} saved={controller.savedIds.includes(post.id)}
              onPlay={controller.openComments} onLike={runLike} onComments={controller.openComments} onSave={controller.toggleSave} onShare={sharePost} />)}
          </div>}
          {!controller.error && !controller.loading && controller.visiblePosts.length === 0 && <div className="empty-state">
            <span className="empty-icon"><FaVideo /></span><h3>No videos here yet</h3><p>{controller.search ? 'Try another search.' : controller.section === 'Liked' ? 'Videos you like will show up here.' : controller.section === 'Saved' ? 'Save a video to watch it later.' : 'Check back soon for new content.'}</p>
          </div>}
        </section>
      </>}
    </main>
    <MobileNav section={controller.section} setSection={controller.setSection} user={controller.user} onDashboard={goDashboard} />

    {controller.activePost && <VideoModal post={controller.activePost} comments={controller.comments} user={controller.user} onClose={() => controller.setActivePost(null)}
      onAddComment={controller.addComment} onDeleteComment={controller.deleteComment} onRequireAuth={() => setAuthOpen(true)} />}
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSubmit={controller.signIn} />}
    {profileOpen && controller.user && <ProfileModal user={controller.user} onClose={() => setProfileOpen(false)} onSave={controller.updateProfile} />}
    {sharingPost && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSharingPost(null)}><section className="share-fallback modal-panel" role="dialog" aria-modal="true">
      <button className="modal-close" onClick={() => setSharingPost(null)} aria-label="Close"><FaTimes /></button><FaLink className="share-fallback-icon" /><h2>Share this video</h2><p>Copy this link and send it to your friends.</p><input readOnly value={sharingPost.url} onFocus={(event) => event.target.select()} /><button className="primary-button wide-button" onClick={() => { const input = document.querySelector('.share-fallback input'); input?.select(); document.execCommand('copy'); setSharingPost(null); controller.notify('Video link copied.'); }}><FaLink /> Copy link</button>
    </section></div>}
    {controller.toast && <div className="toast-message" role="status">{controller.toast}</div>}
    <button className="mobile-sign-in" onClick={() => controller.user ? controller.signOut() : setAuthOpen(true)} aria-label={controller.user ? 'Sign out' : 'Sign in'}><FaUser /></button>
  </div>;
}
