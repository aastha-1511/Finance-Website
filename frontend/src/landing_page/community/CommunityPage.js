import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import VideoCall from './VideoCall';
import { API_URL } from '../../config';

const socket = io(API_URL, { autoConnect: true });

// ─── Protected Guard ──────────────────────────────────────────────────────
const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
};
const getToken = () => localStorage.getItem('token') || '';

// ─── Sub-components ───────────────────────────────────────────────────────
const Avatar = ({ name, size = 8 }) => {
    const initials = name ? name.slice(0, 2).toUpperCase() : 'U';
    const colours = ['bg-blue-600', 'bg-indigo-600', 'bg-teal-600', 'bg-violet-600', 'bg-rose-600'];
    const col = colours[initials.charCodeAt(0) % colours.length];
    return (
        <div className={`${col} w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
            style={{ width: size * 4, height: size * 4 }}>
            {initials}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────
const CommunityPage = () => {
    const navigate = useNavigate();
    const user = getUser();

    // Redirect if not logged in
    useEffect(() => {
        if (!user) navigate('/login');
    }, []);

    const [activeTab, setActiveTab] = useState('blogs');   // 'blogs' | 'groups'
    const [blogs, setBlogs] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);  // selected group object
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState('');

    const [blogForm, setBlogForm] = useState({ title: '', content: '', tags: '' });
    const [groupForm, setGroupForm] = useState({ name: '', description: '', isPrivate: false });
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [joinCodes, setJoinCodes] = useState({});  // groupId → invite code input

    // Video call state
    const [callRoomId, setCallRoomId] = useState(null);
    const [callRoomInput, setCallRoomInput] = useState('');
    const [showCallPrompt, setShowCallPrompt] = useState(false);

    const startVideoCall = (groupName) => {
        const defaultRoom = groupName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        setCallRoomInput(defaultRoom);
        setShowCallPrompt(true);
    };
    const joinCall = () => {
        if (!callRoomInput.trim()) return;
        setCallRoomId(callRoomInput.trim());
        setShowCallPrompt(false);
    };

    // Invite code bar state
    const [inviteBarCode, setInviteBarCode] = useState('');
    const [inviteBarMsg, setInviteBarMsg] = useState({ text: '', ok: true });
    const joinByCode = async () => {
        if (!inviteBarCode.trim()) return;
        try {
            const { data } = await axios.post('http://localhost:5000/api/community/groups/join-by-code',
                { inviteCode: inviteBarCode.trim() },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setInviteBarMsg({ text: `Joined "${data.name}" successfully!`, ok: true });
            setInviteBarCode('');
            fetchGroups();
            setTimeout(() => setInviteBarMsg({ text: '', ok: true }), 3000);
        } catch (err) {
            setInviteBarMsg({ text: err.response?.data?.message || 'Invalid code', ok: false });
            setTimeout(() => setInviteBarMsg({ text: '', ok: true }), 3000);
        }
    };

    // ── Fetch data ───────────────────────────────────────────────────────────
    const fetchBlogs = async () => {
        try { const { data } = await axios.get('http://localhost:5000/api/community/blogs'); setBlogs(data); }
        catch { }
    };

    const fetchGroups = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/community/groups', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setGroups(data);
        } catch { }
    };

    useEffect(() => {
        fetchBlogs();
        fetchGroups();
    }, []);

    // ── Socket setup ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeGroup) return;
        socket.emit('join_group', activeGroup._id);

        const handler = (msg) => setChatMessages(prev => [...prev, msg]);
        socket.on('receive_message', handler);
        return () => socket.off('receive_message', handler);
    }, [activeGroup]);

    // Load message history when a group is selected
    const openGroup = async (group) => {
        setChatMessages([]);
        setActiveGroup(group);
        try {
            const { data } = await axios.get(`http://localhost:5000/api/community/groups/${group._id}/messages`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setChatMessages(data);
        } catch { }
    };

    // ── Actions ──────────────────────────────────────────────────────────────
    const handlePostBlog = async (e) => {
        e.preventDefault(); setIsPosting(true);
        try {
            await axios.post('http://localhost:5000/api/community/blogs', {
                title: blogForm.title, content: blogForm.content,
                tags: blogForm.tags.split(',').map(t => t.trim()).filter(Boolean)
            }, { headers: { Authorization: `Bearer ${getToken()}` } });
            setBlogForm({ title: '', content: '', tags: '' });
            setShowBlogForm(false);
            fetchBlogs();
        } catch (err) { alert(err.response?.data?.message || 'Failed to post'); }
        finally { setIsPosting(false); }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault(); setIsPosting(true);
        try {
            const { data } = await axios.post('http://localhost:5000/api/community/groups', groupForm, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setGroups(prev => [data, ...prev]);
            setGroupForm({ name: '', description: '', isPrivate: false });
            setShowGroupForm(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed to create group'); }
        finally { setIsPosting(false); }
    };

    const handleJoinGroup = async (groupId) => {
        const group = groups.find(g => g._id === groupId);
        const inviteCode = group?.isPrivate ? (joinCodes[groupId] || '').trim() : undefined;
        if (group?.isPrivate && !inviteCode) {
            alert('This is a private group. Enter the invite code to join.');
            return;
        }
        try {
            const { data } = await axios.post(`http://localhost:5000/api/community/groups/${groupId}/join`,
                { inviteCode }, { headers: { Authorization: `Bearer ${getToken()}` } });
            setGroups(prev => prev.map(g => g._id === groupId ? data : g));
        } catch (err) { alert(err.response?.data?.message || 'Failed to join'); }
    };

    const handleLeaveGroup = async (groupId) => {
        if (!window.confirm('Leave this group?')) return;
        try {
            await axios.post(`http://localhost:5000/api/community/groups/${groupId}/leave`, {},
                { headers: { Authorization: `Bearer ${getToken()}` } });
            setGroups(prev => prev.map(g => g._id === groupId
                ? { ...g, members: g.members.filter(m => (m._id || m) !== user._id) } : g));
            if (activeGroup?._id === groupId) setActiveGroup(null);
        } catch (err) { alert(err.response?.data?.message || 'Failed to leave'); }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !activeGroup) return;
        const msgData = {
            groupId: activeGroup._id,
            user: user.name || user.email,
            text: message.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        socket.emit('send_message', msgData);
        setMessage('');
    };

    const isMember = (group) => {
        if (!user || !group.members) return false;
        return group.members.some(m => (m._id || m) === user._id);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Native WebRTC Video Call */}
            {callRoomId && (
                <VideoCall
                    socket={socket}
                    roomId={callRoomId}
                    userName={user.name || user.email}
                    onClose={() => setCallRoomId(null)}
                />
            )}

            {/* Room code prompt modal */}
            {showCallPrompt && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700' }}>📹 Start Video Call</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>Share this room code with the person you want to call. Both must enter the same code.</p>
                        <input
                            value={callRoomInput}
                            onChange={e => setCallRoomInput(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }}
                            placeholder="Room code…"
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowCallPrompt(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button onClick={joinCall} style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Join / Start Call</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Connect with fellow investors, share insights, form groups</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Avatar name={user.name} size={9} />
                        <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 pt-6">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
                    {['blogs', 'groups'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${activeTab === tab
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab === 'blogs' ? 'Knowledge Blogs' : 'Groups & Chat'}
                        </button>
                    ))}
                </div>

                {/* ════════════════════ BLOGS TAB ═════════════════════════════════ */}
                {activeTab === 'blogs' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Articles &amp; Market Insights</h2>
                            <button
                                onClick={() => setShowBlogForm(!showBlogForm)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                            >
                                {showBlogForm ? 'Cancel' : 'Write Article'}
                            </button>
                        </div>

                        {/* Blog form */}
                        {showBlogForm && (
                            <form onSubmit={handlePostBlog} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
                                <input
                                    type="text" required placeholder="Article title"
                                    value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <input
                                    type="text" placeholder="Tags (comma separated)"
                                    value={blogForm.tags} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <textarea
                                    required rows="5" placeholder="Share your analysis or insights..."
                                    value={blogForm.content} onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                />
                                <div className="flex justify-end">
                                    <button type="submit" disabled={isPosting}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-lg text-sm transition-colors">
                                        {isPosting ? 'Publishing...' : 'Publish'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Blog list */}
                        <div className="space-y-5 pb-12">
                            {blogs.map(blog => (
                                <article key={blog._id} className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{blog.title}</h3>
                                        <span className="text-xs text-gray-400 flex-shrink-0 mt-1">{new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Avatar name={blog.author?.name} size={7} />
                                        <span className="text-sm text-gray-600 font-medium">{blog.author?.name || 'Unknown'}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-5">{blog.content}</p>
                                    {blog.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {blog.tags.map((tag, i) => (
                                                <span key={i} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            ))}
                            {blogs.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    <div className="text-5xl mb-4 font-light text-gray-300">—</div>
                                    <p className="font-medium text-gray-500">No articles yet</p>
                                    <p className="text-sm mt-1">Be the first to share market insights</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════════════ GROUPS TAB ════════════════════════════════ */}
                {activeTab === 'groups' && (
                    <div className="flex gap-6 pb-12" style={{ height: 'calc(100vh - 260px)' }}>

                        {/* Left: group list */}
                        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Discussion Groups</h2>
                                <button
                                    onClick={() => setShowGroupForm(!showGroupForm)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    {showGroupForm ? 'Cancel' : '+ New Group'}
                                </button>
                            </div>

                            {/* ── Got a code? invite bar ── */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-xs font-semibold text-amber-800 mb-2">🔑 Got an invite code?</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text" placeholder="Enter code to join private group"
                                        value={inviteBarCode}
                                        onChange={e => setInviteBarCode(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && joinByCode()}
                                        className="flex-1 px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                                    />
                                    <button onClick={joinByCode}
                                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                        Join
                                    </button>
                                </div>
                                {inviteBarMsg.text && (
                                    <p className={`text-xs mt-1.5 font-medium ${inviteBarMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
                                        {inviteBarMsg.text}
                                    </p>
                                )}
                            </div>

                            {/* Create group form */}
                            {showGroupForm && (
                                <form onSubmit={handleCreateGroup} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                                    <input
                                        type="text" required placeholder="Group name"
                                        value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <input
                                        type="text" placeholder="Short description (optional)"
                                        value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input type="checkbox" checked={groupForm.isPrivate}
                                            onChange={e => setGroupForm({ ...groupForm, isPrivate: e.target.checked })} />
                                        <span>🔒 Private group (invite code required to join)</span>
                                    </label>
                                    <button type="submit" disabled={isPosting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                                        {isPosting ? 'Creating...' : 'Create Group'}
                                    </button>
                                </form>
                            )}

                            {/* Group cards */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {groups.map(group => (
                                    <div
                                        key={group._id}
                                        onClick={() => isMember(group) && openGroup(group)}
                                        className={`bg-white border rounded-xl p-4 transition-all cursor-pointer ${activeGroup?._id === group._id
                                            ? 'border-blue-400 shadow-md ring-1 ring-blue-400'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            } ${!isMember(group) ? 'opacity-70 cursor-default' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                {group.isPrivate && <span title="Private">🔒</span>}
                                                <span className="font-semibold text-sm text-gray-900">{group.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{group.members?.length || 0} members</span>
                                        </div>
                                        {group.description && (
                                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{group.description}</p>
                                        )}
                                        {/* Show invite code only to creator of private group */}
                                        {group.isPrivate && group.creator?._id === user._id && (
                                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 mb-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <span className="text-xs text-indigo-600 font-medium">Invite:</span>
                                                <code className="text-xs font-mono text-indigo-800 select-all">{group.inviteCode}</code>
                                            </div>
                                        )}
                                        {/* Invite code input for non-members of private groups */}
                                        {group.isPrivate && !isMember(group) && (
                                            <input
                                                type="text" placeholder="Enter invite code"
                                                value={joinCodes[group._id] || ''}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => setJoinCodes(c => ({ ...c, [group._id]: e.target.value }))}
                                                className="w-full mb-2 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                            />
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">by {group.creator?.name || 'Unknown'}</span>
                                            <div className="flex items-center gap-1">
                                                {!isMember(group) ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleJoinGroup(group._id); }}
                                                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-lg border border-blue-200 transition-colors"
                                                    >
                                                        Join
                                                    </button>
                                                ) : (
                                                    <>
                                                        <span className="text-xs text-green-600 font-medium">Member</span>
                                                        {group.creator?._id !== user._id && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleLeaveGroup(group._id); }}
                                                                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-2 py-1 rounded-lg border border-red-200 transition-colors ml-1"
                                                            >
                                                                Leave
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {groups.length === 0 && (
                                    <div className="text-center py-10 text-sm text-gray-400">
                                        No groups yet. Create one to start a discussion.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: chat area */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                            {!activeGroup ? (
                                <div className="flex-1 flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <p className="font-medium text-gray-500">Select a group to start chatting</p>
                                        <p className="text-sm mt-1 text-gray-400">Join a group first if you haven't already</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat header */}
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{activeGroup.name}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{activeGroup.members?.length || 0} members</p>
                                        </div>
                                        <button
                                            onClick={() => startVideoCall(activeGroup.name)}
                                            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Video Call
                                        </button>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/40">
                                        {chatMessages.map((msg, idx) => {
                                            const isOwn = msg.user === (user.name || user.email);
                                            return (
                                                <div key={idx} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                    <Avatar name={msg.user} size={7} />
                                                    <div className={`max-w-sm ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                                        <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                            <span className="text-xs font-semibold text-gray-700">{msg.user}</span>
                                                            <span className="text-xs text-gray-400">{msg.time}</span>
                                                        </div>
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn
                                                            ? 'bg-blue-600 text-white rounded-br-none'
                                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {chatMessages.length === 0 && (
                                            <div className="text-center py-8 text-sm text-gray-400">No messages yet. Say hello!</div>
                                        )}
                                    </div>

                                    {/* Input */}
                                    <form onSubmit={sendMessage} className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
                                        <input
                                            type="text" placeholder="Type a message..."
                                            value={message} onChange={e => setMessage(e.target.value)}
                                            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPage;
