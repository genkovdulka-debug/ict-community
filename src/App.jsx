import { useState, useEffect, useCallback, useRef } from "react";
import {
  apiLogin, apiSignup,
  apiGetPosts, apiGetPost, apiCreatePost, apiDeletePost,
  apiAddComment, apiDeleteComment,
  apiToggleReaction, apiGetUser,
  apiAdminGetUsers, apiAdminDeletePost, apiAdminDeleteComment,
  apiAdminBanUser, apiAdminUnbanUser, apiAdminDeleteUser,
  apiSendFriendRequest, apiAcceptFriend, apiDeclineFriend,
  apiUnfriend, apiGetFriends, apiGetFriendRequests, apiGetFriendStatus,
  apiGetConversations, apiGetMessages, apiSendMessage, apiMarkRead,
  MEDIA_BASE,
} from "./api";

const REACTIONS = [
  { e: "👍", k: "like" }, { e: "❤️", k: "love" },
  { e: "😂", k: "haha" }, { e: "🔥", k: "fire" },
];
const CATS = ["All", "General", "Learning", "News", "Projects", "Q&A"];

function Avatar({ name = "?", size = 28, onClick }) {
  return (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", background: "#0C447C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600, color: "#B5D4F4", cursor: onClick ? "pointer" : "default", flexShrink: 0, fontFamily: "'Space Mono', monospace" }}>
     {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function Tag({ children, onClick, muted }) {
  return (
    <span onClick={onClick} style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, background: muted ? "#1a1c20" : "#042C53", color: muted ? "#8b90a0" : "#85B7EB", marginRight: 4, cursor: onClick ? "pointer" : "default" }}>
      {children}
    </span>
  );
}

function Notify({ message }) {
  if (!message) return null;
  return <div style={{ position: "fixed", top: 16, right: 16, background: "#0C447C", color: "#B5D4F4", padding: "8px 18px", borderRadius: 8, fontSize: 13, border: "0.5px solid #1a6fd4", zIndex: 999, fontFamily: "'DM Sans', sans-serif" }}>{message}</div>;
}

function Spinner() {
  return <div style={{ textAlign: "center", padding: "2rem", color: "#8b90a0", fontSize: 13 }}>Loading...</div>;
}

function MediaPreview({ mediaUrl, mediaType }) {
  if (!mediaUrl) return null;
  const src = `${MEDIA_BASE}${mediaUrl}`;
  if (mediaType === "image") return <img src={src} alt="post media" style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />;
  if (mediaType === "video") return <video src={src} controls style={{ width: "100%", maxHeight: 400, borderRadius: 8, marginBottom: 10, background: "#000" }} />;
  return null;
}

function PostCard({ post, currentUser, isAdmin, onReact, onOpen, onProfile, onCat, onDelete, onAdminDelete }) {
  return (
    <div style={{ background: "#1a1c20", border: "0.5px solid #2a2e38", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <Avatar name={post.author} size={24} onClick={() => onProfile(post.author)} />
        <span style={{ fontSize: 12, color: "#8b90a0", cursor: "pointer" }} onClick={() => onProfile(post.author)}>{post.author}</span>
        <span style={{ fontSize: 12, color: "#8b90a0" }}>· {new Date(post.created_at).toLocaleDateString()}</span>
        <Tag onClick={() => onCat(post.category)}>{post.category}</Tag>
        {post.tag && <Tag muted>#{post.tag}</Tag>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {currentUser === post.author && <span style={{ fontSize: 12, color: "#8b90a0", cursor: "pointer" }} onClick={() => onDelete(post.id)}>🗑</span>}
          {isAdmin && currentUser !== post.author && <span style={{ fontSize: 11, background: "#3D0000", color: "#FF6B6B", padding: "2px 8px", borderRadius: 20, cursor: "pointer" }} onClick={() => onAdminDelete(post.id)}>Admin Delete</span>}
        </div>
      </div>
      {post.title && post.title !== "(no title)" && <div onClick={() => onOpen(post.id)} style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, cursor: "pointer", color: "#e8eaf0" }} onMouseEnter={e => e.target.style.color = "#378ADD"} onMouseLeave={e => e.target.style.color = "#e8eaf0"}>{post.title}</div>}
      {post.body && <div style={{ fontSize: 13, color: "#8b90a0", lineHeight: 1.6, marginBottom: 10 }}>{post.body}</div>}
      <MediaPreview mediaUrl={post.media_url} mediaType={post.media_type} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {REACTIONS.map(r => (
          <button key={r.k} onClick={() => onReact(post.id, r.k)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif", border: post.myReactions?.[r.k] ? "0.5px solid #378ADD" : "0.5px solid #2a2e38", background: post.myReactions?.[r.k] ? "#042C53" : "#1f2228", color: post.myReactions?.[r.k] ? "#B5D4F4" : "#8b90a0" }}>
            {r.e} {post.reactions?.[r.k] || 0}
          </button>
        ))}
        <button onClick={() => onOpen(post.id)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "0.5px solid #2a2e38", background: "transparent", color: "#8b90a0", fontFamily: "'DM Sans', sans-serif" }}>
          💬 {post.comment_count || 0}
        </button>
      </div>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────
function AdminPanel({ onBack, notify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await apiAdminGetUsers();
    if (Array.isArray(data)) setUsers(data);
    setLoading(false);
  }

  async function banUser(id, username) {
    if (!window.confirm(`Ban user "${username}"? They will not be able to log in.`)) return;
    const data = await apiAdminBanUser(id);
    if (data.error) { notify(data.error); return; }
    notify(`${username} has been banned.`); loadUsers();
  }

  async function unbanUser(id, username) {
    const data = await apiAdminUnbanUser(id);
    if (data.error) { notify(data.error); return; }
    notify(`${username} has been unbanned.`); loadUsers();
  }

  async function deleteUser(id, username) {
    if (!window.confirm(`Permanently delete user "${username}" and ALL their posts and comments?`)) return;
    const data = await apiAdminDeleteUser(id);
    if (data.error) { notify(data.error); return; }
    notify(`${username} has been deleted.`); loadUsers();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
        <span style={{ fontSize: 13, color: "#8b90a0", cursor: "pointer" }} onClick={onBack}>← back to feed</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FF6B6B" }}>🛡 Admin Panel</div>
      </div>

      <div style={{ background: "#1a1c20", border: "0.5px solid #2a2e38", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          <button onClick={() => setTab("users")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: tab === "users" ? "0.5px solid #1a6fd4" : "0.5px solid #2a2e38", background: tab === "users" ? "#1a6fd4" : "#1f2228", color: "#fff" }}>
            👥 Users ({users.length})
          </button>
        </div>

        {loading ? <Spinner /> : (
          <div>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "0.5px solid #2a2e38", flexWrap: "wrap" }}>
                <Avatar name={u.username} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{u.username}</span>
                    {u.role === "admin" && <span style={{ fontSize: 11, background: "#1a6fd4", color: "#fff", padding: "1px 6px", borderRadius: 20 }}>admin</span>}
                    {u.banned ? <span style={{ fontSize: 11, background: "#3D0000", color: "#FF6B6B", padding: "1px 6px", borderRadius: 20 }}>banned</span> : null}
                  </div>
                  <div style={{ fontSize: 11, color: "#8b90a0", marginTop: 2 }}>
                    {u.post_count} posts · {u.comment_count} comments · joined {new Date(u.joined_at).toLocaleDateString()}
                  </div>
                </div>
                {u.role !== "admin" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {u.banned
                      ? <button onClick={() => unbanUser(u.id, u.username)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #1a6fd4", background: "transparent", color: "#378ADD", fontFamily: "'DM Sans', sans-serif" }}>Unban</button>
                      : <button onClick={() => banUser(u.id, u.username)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #FF6B6B", background: "transparent", color: "#FF6B6B", fontFamily: "'DM Sans', sans-serif" }}>Ban</button>
                    }
                    <button onClick={() => deleteUser(u.id, u.username)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #3D0000", background: "#3D0000", color: "#FF6B6B", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendButton({ targetUserId, notify, onMessage }) {
  const [status, setStatus] = useState("none");
  const [requesterId, setRequesterId] = useState(null);
  const myId = parseInt(localStorage.getItem("userId"));

  useEffect(() => { loadStatus(); }, [targetUserId]);

  async function loadStatus() {
    const data = await apiGetFriendStatus(targetUserId);
    setStatus(data.status || "none");
    setRequesterId(data.requester_id);
  }

  async function handleClick() {
    if (status === "none") {
      await apiSendFriendRequest(targetUserId);
      notify("Friend request sent!");
      setStatus("pending");
    } else if (status === "accepted") {
      await apiUnfriend(targetUserId);
      notify("Unfriended.");
      setStatus("none");
    }
  }

  if (status === "pending") {
    if (requesterId === myId) {
      return <div style={{ fontSize: 11, background: "#042C53", color: "#85B7EB", padding: "4px 12px", borderRadius: 20, marginTop: 8, display: "inline-block" }}>⏳ Request Sent</div>;
    }
    return (
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={async () => { await apiAcceptFriend(requesterId); notify("Friend added!"); setStatus("accepted"); }} style={{ background: "#0C447C", color: "#B5D4F4", border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 11 }}>Accept Request</button>
        <button onClick={async () => { await apiDeclineFriend(requesterId); notify("Declined."); setStatus("none"); }} style={{ background: "#2a2e38", color: "#8b90a0", border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 11 }}>Decline</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <button onClick={handleClick} style={{ background: status === "accepted" ? "#2a2e38" : "#0C447C", color: status === "accepted" ? "#8b90a0" : "#B5D4F4", border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 11 }}>
        {status === "accepted" ? "✓ Friends" : "＋ Add Friend"}
      </button>
      {status === "accepted" && (
        <button onClick={() => onMessage({ id: targetUserId })} style={{ background: "#042C53", color: "#85B7EB", border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 11 }}>💬 Message</button>
      )}
    </div>
  );
}

// ── MESSAGES SCREEN ──
function MessagesScreen({ currentUserId, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [friends, setFriends] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadConversations(); loadFriends(); }, []);
  useEffect(() => { if (activeConv) loadMessages(activeConv.id); }, [activeConv]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations() {
    const data = await apiGetConversations();
    if (Array.isArray(data)) setConversations(data);
  }

  async function loadFriends() {
    const data = await apiGetFriends();
    if (Array.isArray(data)) setFriends(data);
  }

  async function loadMessages(userId) {
    await apiMarkRead(userId);
    const data = await apiGetMessages(userId);
    if (Array.isArray(data)) setMessages(data);
  }

  async function sendMessage() {
    if (!input.trim() || !activeConv) return;
    await apiSendMessage(activeConv.id, input);
    setInput("");
    loadMessages(activeConv.id);
    loadConversations();
  }

  function startChat(friend) {
    setActiveConv(friend);
    setShowNewChat(false);
    loadMessages(friend.id);
  }

  return (
    <div>
      <span style={{ fontSize: 13, color: "#8b90a0", cursor: "pointer", display: "block", marginBottom: 12 }} onClick={onBack}>← back to feed</span>
      <div style={{ display: "flex", gap: 12, height: 500 }}>
        {/* Conversations list */}
        <div style={{ width: 200, background: "#1a1c20", borderRadius: 12, border: "0.5px solid #2a2e38", overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, borderBottom: "0.5px solid #2a2e38", color: "#e8eaf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Messages</span>
            <button onClick={() => setShowNewChat(!showNewChat)} style={{ background: "#0C447C", color: "#B5D4F4", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>+ New</button>
          </div>

          {/* New chat - friends list */}
          {showNewChat && (
            <div style={{ borderBottom: "0.5px solid #2a2e38" }}>
              <div style={{ padding: "6px 12px", fontSize: 11, color: "#8b90a0" }}>Start chat with:</div>
              {friends.length === 0 && <div style={{ padding: "6px 12px", fontSize: 11, color: "#8b90a0" }}>No friends yet</div>}
              {friends.map(f => (
                <div key={f.id} onClick={() => startChat(f)} style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "#0d0e11" }}>
                  <Avatar name={f.username} size={24} />
                  <span style={{ fontSize: 12, color: "#e8eaf0" }}>{f.username}</span>
                </div>
              ))}
            </div>
          )}

          {conversations.length === 0 && !showNewChat && (
            <div style={{ padding: 12, fontSize: 12, color: "#8b90a0" }}>No conversations yet. Click + New to start!</div>
          )}
          {conversations.map(c => (
            <div key={c.id} onClick={() => setActiveConv(c)} style={{ padding: "10px 12px", cursor: "pointer", background: activeConv?.id === c.id ? "#042C53" : "transparent", borderBottom: "0.5px solid #2a2e38" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={c.username} size={28} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e8eaf0" }}>{c.username}</div>
                  <div style={{ fontSize: 11, color: "#8b90a0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>{c.last_message || "..."}</div>
                </div>
                {c.unread > 0 && <span style={{ marginLeft: "auto", background: "#378ADD", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.unread}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Chat window */}
        <div style={{ flex: 1, background: "#1a1c20", borderRadius: 12, border: "0.5px solid #2a2e38", display: "flex", flexDirection: "column" }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8b90a0", fontSize: 13 }}>Select a conversation or click + New</div>
          ) : (
            <>
              <div style={{ padding: "10px 12px", borderBottom: "0.5px solid #2a2e38", fontSize: 13, fontWeight: 600, color: "#e8eaf0", display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={activeConv.username} size={24} />
                {activeConv.username}
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.length === 0 && <div style={{ textAlign: "center", color: "#8b90a0", fontSize: 12, marginTop: 20 }}>No messages yet. Say hello! 👋</div>}
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.sender_id === currentUserId ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "70%", padding: "8px 12px", borderRadius: 12, fontSize: 12, background: m.sender_id === currentUserId ? "#042C53" : "#2a2e38", color: m.sender_id === currentUserId ? "#B5D4F4" : "#e8eaf0" }}>
                      {m.body}
                      <div style={{ fontSize: 10, color: "#8b90a0", marginTop: 2 }}>{new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: 12, borderTop: "0.5px solid #2a2e38", display: "flex", gap: 8 }}>
                <input
                  style={{ flex: 1, background: "#0d0e11", border: "0.5px solid #2a2e38", borderRadius: 8, padding: "8px 12px", color: "#e8eaf0", fontSize: 12, outline: "none" }}
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} style={{ background: "#0C447C", color: "#B5D4F4", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FRIEND REQUESTS PANEL ──
function FriendRequestsPanel({ onClose, notify, onMessage }) {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await apiGetFriendRequests();
    const f = await apiGetFriends();
    if (Array.isArray(r)) setRequests(r);
    if (Array.isArray(f)) setFriends(f);
  }

  async function accept(id) {
    await apiAcceptFriend(id);
    notify("Friend request accepted!");
    load();
  }

  async function decline(id) {
    await apiDeclineFriend(id);
    notify("Friend request declined.");
    load();
  }

  async function unfriend(id) {
    await apiUnfriend(id);
    notify("Unfriended.");
    load();
  }

  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 280, height: "100vh", background: "#1a1c20", border: "0.5px solid #2a2e38", zIndex: 100, overflowY: "auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0" }}>👥 Friends</div>
        <span style={{ cursor: "pointer", color: "#8b90a0", fontSize: 18 }} onClick={onClose}>✕</span>
      </div>

      {requests.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#8b90a0", marginBottom: 8 }}>Friend Requests ({requests.length})</div>
          {requests.map(r => (
            <div key={r.id} style={{ background: "#0d0e11", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Avatar name={r.username} size={28} />
                <span style={{ fontSize: 12, color: "#e8eaf0" }}>{r.username}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => accept(r.requester_id)} style={{ flex: 1, background: "#0C447C", color: "#B5D4F4", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 11 }}>Accept</button>
                <button onClick={() => decline(r.requester_id)} style={{ flex: 1, background: "#2a2e38", color: "#8b90a0", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 11 }}>Decline</button>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ fontSize: 12, color: "#8b90a0", marginBottom: 8, marginTop: 8 }}>My Friends ({friends.length})</div>
      {friends.length === 0 && <div style={{ fontSize: 12, color: "#8b90a0" }}>No friends yet</div>}
      {friends.map(f => (
        <div key={f.id} style={{ background: "#0d0e11", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar name={f.username} size={28} />
            <span style={{ fontSize: 12, color: "#e8eaf0" }}>{f.username}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onMessage(f)} style={{ flex: 1, background: "#042C53", color: "#85B7EB", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 11 }}>💬 Message</button>
            <button onClick={() => unfriend(f.id)} style={{ flex: 1, background: "#2a2e38", color: "#8b90a0", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 11 }}>Unfriend</button>
          </div>
        </div>
      ))}
    </div>
  );
}
// ── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState("user");
  const [isSignup, setIsSignup] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCat, setNewCat] = useState("General");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [showFriends, setShowFriends] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notif, setNotif] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("ict_token");
    const username = localStorage.getItem("ict_user");
    const role = localStorage.getItem("ict_role");
    if (token && username) { 
      setCurrentUser(username); 
      setCurrentRole(role || "user"); 
      setCurrentUserId(parseInt(localStorage.getItem("userId")));
      setScreen("feed"); 
    }
  }, []);

  function notify(msg) { setNotif(msg); setTimeout(() => setNotif(""), 2500); }

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetPosts(searchQ, activeCat);
      if (Array.isArray(data)) setPosts(data);
      else notify("Could not load posts. Is the backend running?");
    } catch { notify("Could not connect to backend."); }
    setLoading(false);
  }, [searchQ, activeCat]);

  useEffect(() => { if (screen === "feed") loadPosts(); }, [screen, loadPosts]);

  async function doLogin() {
    if (!loginUser.trim()) { notify("Enter a username"); return; }
    setLoading(true);
    try {
      const data = isSignup ? await apiSignup(loginUser, loginPass) : await apiLogin(loginUser, loginPass);
      if (data.error) { notify(data.error); setLoading(false); return; }
      localStorage.setItem("ict_token", data.token);
      localStorage.setItem("ict_user", data.username);
      localStorage.setItem("ict_role", data.role || "user");
      localStorage.setItem("userId", data.id);
      setCurrentUser(data.username);
      setCurrentUserId(data.id);
      setCurrentRole(data.role || "user");
      notify(isSignup ? `Welcome to ICT, ${data.username}!` : `Welcome back, ${data.username}!`);
      setScreen("feed");
    } catch { notify("Cannot connect to server. Is the backend running?"); }
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem("ict_token"); localStorage.removeItem("ict_user"); localStorage.removeItem("ict_role");
    setCurrentUser(null); setCurrentRole("user"); setLoginUser(""); setLoginPass(""); setScreen("login");
  }

  function handleFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    setMediaFile(file);
    setMediaPreview({ url: URL.createObjectURL(file), type: file.type.startsWith("image") ? "image" : "video" });
  }

  function clearMedia() { setMediaFile(null); setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }

  async function submitPost() {
    if (!mediaFile && !newTitle.trim()) { notify("Add a title, or attach a photo/video"); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", newTitle.trim() || "(no title)");
    formData.append("body", newBody);
    formData.append("tag", newTag);
    formData.append("category", newCat);
    if (mediaFile) formData.append("media", mediaFile);
    const data = await apiCreatePost(formData);
    if (data.error) { notify(data.error); setLoading(false); return; }
    setNewTitle(""); setNewBody(""); setNewTag(""); clearMedia();
    notify("Post published!"); loadPosts(); setLoading(false);
  }

  async function deletePost(id) {
    if (!window.confirm("Delete this post?")) return;
    await apiDeletePost(id); notify("Post deleted."); loadPosts();
  }

  async function adminDeletePost(id) {
    if (!window.confirm("Delete this post as admin?")) return;
    await apiAdminDeletePost(id); notify("Post deleted by admin."); loadPosts();
  }

  async function openPost(id) {
    setLoading(true);
    const data = await apiGetPost(id);
    if (data.error) { notify(data.error); setLoading(false); return; }
    data.myReactions = {};
    setCurrentPost(data); setScreen("post"); setLoading(false);
  }

  async function react(postId, type) {
    await apiToggleReaction(postId, type);
    const updateReact = (prev) => {
      const myR = { ...(prev.myReactions || {}) };
      const reacts = { ...prev.reactions };
      if (myR[type]) { reacts[type]--; delete myR[type]; }
      else { reacts[type] = (reacts[type] || 0) + 1; myR[type] = true; }
      return { ...prev, reactions: reacts, myReactions: myR };
    };
    if (screen === "post" && currentPost?.id === postId) setCurrentPost(updateReact);
    else setPosts(ps => ps.map(p => p.id === postId ? updateReact(p) : p));
  }

  async function submitComment() {
    if (!commentInput.trim()) return;
    const data = await apiAddComment(currentPost.id, commentInput);
    if (data.error) { notify(data.error); return; }
    setCommentInput(""); notify("Comment posted!");
    const updated = await apiGetPost(currentPost.id);
    updated.myReactions = currentPost.myReactions;
    setCurrentPost(updated);
  }

  async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;
    await apiDeleteComment(commentId); notify("Comment deleted.");
    const updated = await apiGetPost(currentPost.id);
    updated.myReactions = currentPost.myReactions;
    setCurrentPost(updated);
  }

  async function adminDeleteComment(commentId) {
    if (!window.confirm("Delete this comment as admin?")) return;
    await apiAdminDeleteComment(commentId); notify("Comment deleted by admin.");
    const updated = await apiGetPost(currentPost.id);
    updated.myReactions = currentPost.myReactions;
    setCurrentPost(updated);
  }

  async function openProfile(username) {
    setLoading(true);
    const data = await apiGetUser(username);
    if (data.error) { notify(data.error); setLoading(false); return; }
    setProfileData(data);
    console.log("Profile data:", data);
    setScreen("profile"); setLoading(false);
  }

  const isAdmin = currentRole === "admin";

  const s = {
    card: { background: "#1a1c20", border: "0.5px solid #2a2e38", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 },
    input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid #2a2e38", background: "#1f2228", fontSize: 13, color: "#e8eaf0", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, outline: "none", boxSizing: "border-box" },
    btnP: { padding: "8px 18px", borderRadius: 8, border: "none", background: "#1a6fd4", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },
    btnS: { padding: "6px 14px", borderRadius: 8, border: "0.5px solid #2a2e38", background: "#1f2228", color: "#e8eaf0", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
    blueBar: { height: 3, background: "#1a6fd4", margin: "-1rem -1.25rem 1rem", borderRadius: "12px 12px 0 0" },
    backLink: { fontSize: 13, color: "#8b90a0", cursor: "pointer", marginBottom: "1rem", display: "inline-block" },
  };

  return (
    <div style={{ background: "#111214", minHeight: "100vh", color: "#e8eaf0" }}>
      <Notify message={notif} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1rem", fontFamily: "'DM Sans', sans-serif" }}>

        {screen !== "login" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#1a1c20", border: "0.5px solid #2a2e38", borderRadius: 8, marginBottom: "1rem" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf0", letterSpacing: 1, fontFamily: "'Space Mono', monospace", cursor: "pointer" }} onClick={() => setScreen("feed")}>
              <span style={{ color: "#1a6fd4" }}>ICT</span> Community
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isAdmin && (
                <button onClick={() => setScreen("admin")} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #FF6B6B", background: "transparent", color: "#FF6B6B", fontFamily: "'DM Sans', sans-serif" }}>
                  🛡 Admin
                </button>
              )}
              {currentUser && (
                <>
                  <button onClick={() => setShowFriends(!showFriends)} style={{ background: "transparent", border: "0.5px solid #2a2e38", color: "#8b90a0", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                    👥 Friends
                  </button>
                  <button onClick={() => setScreen("messages")} style={{ background: "transparent", border: "0.5px solid #2a2e38", color: "#8b90a0", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                    💬 Messages
                  </button>
                </>
              )}
              <Avatar name={currentUser} size={28} onClick={() => openProfile(currentUser)} />
              <span style={{ fontSize: 13, color: "#e8eaf0", cursor: "pointer" }} onClick={() => openProfile(currentUser)}>{currentUser}</span>
              {isAdmin && <span style={{ fontSize: 11, background: "#1a6fd4", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>admin</span>}
              <button style={s.btnS} onClick={logout}>Sign out</button>
            </div>
          </div>
        )}

        {/* LOGIN */}
        {screen === "login" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "90vh" }}>
            <div style={{ ...s.card, maxWidth: 360, width: "100%", padding: "2rem" }}>
              <div style={s.blueBar} />
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Mono', monospace", marginBottom: 4 }}><span style={{ color: "#1a6fd4" }}>ICT</span></div>
              <div style={{ fontSize: 13, color: "#8b90a0", marginBottom: "1.5rem" }}>{isSignup ? "Create your ICT account" : "Sign in to join the conversation"}</div>
              <label style={{ fontSize: 12, color: "#8b90a0", display: "block", marginBottom: 4 }}>Username</label>
              <input style={s.input} value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="your username" onKeyDown={e => e.key === "Enter" && doLogin()} />
              <label style={{ fontSize: 12, color: "#8b90a0", display: "block", marginBottom: 4 }}>Password</label>
              <input style={s.input} type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && doLogin()} />
              <button style={{ ...s.btnP, width: "100%", padding: "10px", opacity: loading ? 0.6 : 1 }} onClick={doLogin} disabled={loading}>
                {loading ? "Please wait..." : isSignup ? "Sign up" : "Sign in"}
              </button>
              <div style={{ fontSize: 12, color: "#8b90a0", marginTop: 12, textAlign: "center" }}>
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <span style={{ color: "#378ADD", cursor: "pointer" }} onClick={() => setIsSignup(v => !v)}>{isSignup ? "Sign in" : "Sign up"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN PANEL */}
        {screen === "admin" && isAdmin && <AdminPanel onBack={() => setScreen("feed")} notify={notify} />}

        {/* FEED */}
        {screen === "feed" && (
          <>
            <input style={{ ...s.input, marginBottom: "0.75rem" }} placeholder="Search posts…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setActiveCat(c)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: activeCat === c ? "0.5px solid #1a6fd4" : "0.5px solid #2a2e38", background: activeCat === c ? "#1a6fd4" : "#1f2228", color: activeCat === c ? "#fff" : "#8b90a0" }}>{c}</button>
              ))}
            </div>
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "#8b90a0" }}>Create a post</div>
              <input style={s.input} placeholder={mediaFile ? "Title (optional)" : "Title"} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <textarea style={{ ...s.input, height: 72, resize: "vertical" }} placeholder="What's on your mind? (optional)" value={newBody} onChange={e => setNewBody(e.target.value)} />
              {!mediaPreview ? (
                <div onClick={() => fileInputRef.current.click()} style={{ border: "1px dashed #2a2e38", borderRadius: 8, padding: "16px", textAlign: "center", cursor: "pointer", marginBottom: 8, color: "#8b90a0", fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#1a6fd4"} onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2e38"}>
                  📷 Click to add a photo or video (No Nudes)
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
                </div>
              ) : (
                <div style={{ position: "relative", marginBottom: 8 }}>
                  {mediaPreview.type === "image" ? <img src={mediaPreview.url} alt="preview" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8 }} /> : <video src={mediaPreview.url} controls style={{ width: "100%", maxHeight: 300, borderRadius: 8, background: "#000" }} />}
                  <button onClick={clearMedia} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ ...s.input, width: 150, marginBottom: 0 }}>
                  {CATS.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ ...s.input, width: 130, marginBottom: 0 }} placeholder="Tag (optional)" value={newTag} onChange={e => setNewTag(e.target.value)} />
                <button style={s.btnP} onClick={submitPost} disabled={loading}>Post</button>
              </div>
            </div>
            {loading ? <Spinner /> : posts.length === 0
              ? <div style={{ color: "#8b90a0", fontSize: 13, textAlign: "center", padding: "2rem 0" }}>No posts found.</div>
              : posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} isAdmin={isAdmin} onReact={react} onOpen={openPost} onProfile={openProfile} onCat={c => setActiveCat(c)} onDelete={deletePost} onAdminDelete={adminDeletePost} />)
            }
          </>
        )}

        {/* POST DETAIL */}
        {screen === "post" && currentPost && (
          <>
            <span style={s.backLink} onClick={() => setScreen("feed")}>← back to feed</span>
            <div style={s.card}>
              <div style={s.blueBar} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Avatar name={currentPost.author} size={24} onClick={() => openProfile(currentPost.author)} />
                <span style={{ fontSize: 12, color: "#8b90a0", cursor: "pointer" }} onClick={() => openProfile(currentPost.author)}>{currentPost.author}</span>
                <span style={{ fontSize: 12, color: "#8b90a0" }}>· {new Date(currentPost.created_at).toLocaleDateString()}</span>
                <Tag>{currentPost.category}</Tag>
                {currentPost.tag && <Tag muted>#{currentPost.tag}</Tag>}
              </div>
              {currentPost.title && currentPost.title !== "(no title)" && <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{currentPost.title}</div>}
              {currentPost.body && <div style={{ fontSize: 13, color: "#8b90a0", lineHeight: 1.7, marginBottom: 12 }}>{currentPost.body}</div>}
              <MediaPreview mediaUrl={currentPost.media_url} mediaType={currentPost.media_type} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {REACTIONS.map(r => (
                  <button key={r.k} onClick={() => react(currentPost.id, r.k)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: currentPost.myReactions?.[r.k] ? "0.5px solid #378ADD" : "0.5px solid #2a2e38", background: currentPost.myReactions?.[r.k] ? "#042C53" : "#1f2228", color: currentPost.myReactions?.[r.k] ? "#B5D4F4" : "#8b90a0", display: "flex", alignItems: "center", gap: 4 }}>
                    {r.e} {currentPost.reactions?.[r.k] || 0}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "#8b90a0" }}>Leave a comment</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...s.input, flex: 1, marginBottom: 0 }} placeholder="Write a comment…" value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment()} />
                <button style={s.btnP} onClick={submitComment}>Reply</button>
              </div>
            </div>
            {loading ? <Spinner /> : !currentPost.comments?.length
              ? <div style={{ color: "#8b90a0", fontSize: 13, textAlign: "center", padding: "2rem 0" }}>No comments yet.</div>
              : <div style={s.card}>
                {currentPost.comments.map((c, i) => (
                  <div key={c.id || i} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: i < currentPost.comments.length - 1 ? "0.5px solid #2a2e38" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#8b90a0", cursor: "pointer" }} onClick={() => openProfile(c.author)}>{c.author} · {new Date(c.created_at).toLocaleDateString()}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {currentUser === c.author && <span style={{ fontSize: 12, color: "#8b90a0", cursor: "pointer" }} onClick={() => deleteComment(c.id)}>🗑</span>}
                        {isAdmin && currentUser !== c.author && <span style={{ fontSize: 11, background: "#3D0000", color: "#FF6B6B", padding: "1px 8px", borderRadius: 20, cursor: "pointer" }} onClick={() => adminDeleteComment(c.id)}>Delete</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#e8eaf0", lineHeight: 1.5, marginTop: 2 }}>{c.body}</div>
                  </div>
                ))}
              </div>
            }
          </>
        )}

        {/* PROFILE */}
        {screen === "messages" && (
          <MessagesScreen 
            currentUserId={currentUserId} 
            onBack={() => setScreen("feed")} 
          />
        )}
        {screen === "profile" && profileData && (
          <>
            <span style={s.backLink} onClick={() => setScreen("feed")}>← back to feed</span>
            <div style={s.card}>
              <div style={s.blueBar} />
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1rem" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#0C447C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#B5D4F4", border: "2px solid #1a6fd4", fontFamily: "'Space Mono', monospace" }}>
                  {profileData.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {profileData.username}
                    {profileData.username === currentUser && <span style={{ fontSize: 11, background: "#042C53", color: "#85B7EB", padding: "2px 8px", borderRadius: 20, fontWeight: 400 }}>you</span>}
                    {profileData.role === "admin" && <span style={{ fontSize: 11, background: "#1a6fd4", color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 400 }}>admin</span>}
                    {profileData.banned && <span style={{ fontSize: 11, background: "#3D0000", color: "#FF6B6B", padding: "2px 8px", borderRadius: 20, fontWeight: 400 }}>banned</span>}
                  </div>
                  {profileData.username !== currentUser && currentUserId && (
                    <FriendButton
                      targetUserId={profileData.id}
                      notify={notify}
                      onMessage={(user) => { setMessageUser(user); setScreen("messages"); }}
                    />
                  )}
                  <div style={{ fontSize: 12, color: "#8b90a0", marginTop: 2 }}>Member since {new Date(profileData.joined_at).toLocaleDateString()}</div>
                  <div style={{ fontSize: 13, color: "#8b90a0", marginTop: 4 }}>{profileData.bio}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                {[["Posts", profileData.post_count], ["Comments", profileData.comment_count], ["Reactions", profileData.reactions_received]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#378ADD", fontFamily: "'Space Mono', monospace" }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#8b90a0", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#8b90a0", margin: "12px 0 6px" }}>Posts by {profileData.username}</div>
            {!profileData.posts?.length
              ? <div style={{ color: "#8b90a0", fontSize: 13, textAlign: "center", padding: "2rem 0" }}>No posts yet.</div>
              : profileData.posts.map(p => (
                <PostCard key={p.id} post={{ ...p, reactions: p.reactions || { like: 0, love: 0, haha: 0, fire: 0 }, myReactions: {} }}
                  currentUser={currentUser} isAdmin={isAdmin} onReact={react} onOpen={openPost}
                  onProfile={openProfile} onCat={c => { setActiveCat(c); setScreen("feed"); }}
                  onDelete={deletePost} onAdminDelete={adminDeletePost}
                />
              ))}
          </>
        )}

        {showFriends && (
          <FriendRequestsPanel 
            onClose={() => setShowFriends(false)} 
            notify={notify}
            onMessage={(user) => { setMessageUser(user); setShowFriends(false); setScreen("messages"); }}
          />
        )}

      </div>
    </div>
  );
}
