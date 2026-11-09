import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../models/api';

function readUser() {
  try {
    return JSON.parse(window.localStorage.getItem('noko-user') || 'null');
  } catch {
    return null;
  }
}

export default function useChannelController() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(readUser);
  const [section, setSection] = useState('Home');
  const [category, setCategory] = useState('All Videos');
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('noko-saved') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [comments, setComments] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/posts');
      setPosts(data.posts);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const visiblePosts = useMemo(() => {
    let result = posts;
    if (section === 'Liked') result = result.filter((post) => post.liked);
    if (section === 'Saved') result = result.filter((post) => savedIds.includes(post.id));
    if (category !== 'All Videos' && section === 'Home') result = result.filter((post) => post.category === category);
    if (search.trim()) result = result.filter((post) => post.title.toLowerCase().includes(search.trim().toLowerCase()));
    return result;
  }, [posts, section, category, savedIds, search]);

  const signIn = useCallback(async (values, mode) => {
    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
    const { data } = await api.post(endpoint, values);
    window.localStorage.setItem('noko-token', data.token);
    window.localStorage.setItem('noko-user', JSON.stringify(data.user));
    setUser(data.user);
    await loadPosts();
    notify(`Welcome${mode === 'register' ? '' : ' back'}, ${data.user.name.split(' ')[0]}!`);
  }, [loadPosts, notify]);

  const signOut = useCallback(() => {
    window.localStorage.removeItem('noko-token');
    window.localStorage.removeItem('noko-user');
    setUser(null);
    loadPosts();
    notify('You have signed out.');
  }, [loadPosts, notify]);

  const updateProfile = useCallback(async (values) => {
    const { data } = await api.patch('/auth/profile', values);
    window.localStorage.setItem('noko-user', JSON.stringify(data.user));
    setUser(data.user);
    notify('Your profile has been updated.');
    return data.user;
  }, [notify]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await api.patch('/auth/password', { currentPassword, newPassword });
    notify('Your password has been changed.');
  }, [notify]);

  const loadNotifications = useCallback(async () => {
    const { data } = await api.get('/notifications');
    return data;
  }, []);

  const markNotificationsRead = useCallback(async () => {
    const { data } = await api.patch('/notifications/read');
    return data;
  }, []);

  const toggleLike = useCallback(async (post) => {
    if (!user) throw new Error('Sign in to like videos.');
    const { data } = await api.post(`/posts/${post.id}/like`);
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, liked: data.liked, likes: data.likes }
      : item));
  }, [user]);

  const toggleSave = useCallback((post) => {
    const next = savedIds.includes(post.id) ? savedIds.filter((id) => id !== post.id) : [...savedIds, post.id];
    setSavedIds(next);
    window.localStorage.setItem('noko-saved', JSON.stringify(next));
    notify(next.includes(post.id) ? 'Added to your saved videos.' : 'Removed from saved videos.');
  }, [savedIds, notify]);

  const refreshDashboard = useCallback(async () => {
    if (user?.role !== 'creator') return;
    const { data } = await api.get('/posts/dashboard');
    setDashboard(data);
  }, [user]);

  const openComments = useCallback(async (post) => {
    setActivePost(post);
    setComments([]);
    try {
      const { data } = await api.post(`/posts/${post.id}/view`);
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, views: data.views }
        : item));
      setActivePost((current) => current?.id === post.id
        ? { ...current, views: data.views }
        : current);
    } catch (requestError) {
      notify(getErrorMessage(requestError));
    }
    try {
      const { data } = await api.get(`/posts/${post.id}/comments`);
      setComments(data.comments);
    } catch (requestError) {
      notify(getErrorMessage(requestError));
    }
  }, [notify]);

  const addComment = useCallback(async (postId, content, parentComment = null) => {
    if (!user) throw new Error('Sign in to join the conversation.');
    const { data } = await api.post(`/posts/${postId}/comments`, { content, parentComment });
    setComments((current) => [...current, data.comment]);
    setPosts((current) => current.map((post) => post.id === postId
      ? { ...post, comments: post.comments + (parentComment ? 0 : 1) }
      : post));
    setActivePost((current) => current?.id === postId && !parentComment
      ? { ...current, comments: current.comments + 1 }
      : current);
  }, [user]);

  const deleteComment = useCallback(async (commentId) => {
    await api.delete(`/posts/comments/${commentId}`);
    const removed = comments.find((comment) => comment._id === commentId);
    setComments((current) => current.filter((comment) =>
      comment._id !== commentId && String(comment.parentComment) !== commentId
    ));
    if (removed && !removed.parentComment && activePost) {
      setPosts((current) => current.map((post) => post.id === activePost.id
        ? { ...post, comments: Math.max(0, post.comments - 1) }
        : post));
      setActivePost((current) => current?.id === activePost.id
        ? { ...current, comments: Math.max(0, current.comments - 1) }
        : current);
    }
    notify('Comment deleted.');
    await refreshDashboard();
  }, [activePost, comments, notify, refreshDashboard]);

  const createPost = useCallback(async (values) => {
    const { data } = await api.post('/posts', values);
    setPosts((current) => [data.post, ...current]);
    await refreshDashboard();
    notify('Your video is live.');
  }, [notify, refreshDashboard]);

  const deletePost = useCallback(async (postId) => {
    await api.delete(`/posts/${postId}`);
    setPosts((current) => current.filter((post) => post.id !== postId));
    if (activePost?.id === postId) setActivePost(null);
    await refreshDashboard();
    notify('Video deleted.');
  }, [activePost, notify, refreshDashboard]);

  return {
    posts, visiblePosts, user, section, setSection, category, setCategory, search, setSearch,
    savedIds, loading, error, toast, comments, activePost, setActivePost, dashboard,
    loadPosts, signIn, signOut, updateProfile, changePassword, loadNotifications, markNotificationsRead, toggleLike, toggleSave, openComments, addComment,
    deleteComment, refreshDashboard, createPost, deletePost, notify
  };
}
