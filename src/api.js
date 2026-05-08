const BASE_URL = "https://ict-backend-production-2aab.up.railway.app/api";
export const MEDIA_BASE = "https://ict-backend-production-2aab.up.railway.app";
function getToken() { return localStorage.getItem("ict_token"); }
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export async function apiSignup(username, password) {
  const res = await fetch(`${BASE_URL}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
  return res.json();
}
export async function apiLogin(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
  return res.json();
}
export async function apiGetPosts(search = "", category = "All") {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category && category !== "All") params.append("category", category);
  const res = await fetch(`${BASE_URL}/posts?${params.toString()}`);
  return res.json();
}
export async function apiGetPost(id) {
  const res = await fetch(`${BASE_URL}/posts/${id}`);
  return res.json();
}
export async function apiCreatePost(formData) {
  const res = await fetch(`${BASE_URL}/posts`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
  return res.json();
}
export async function apiDeletePost(id) {
  const res = await fetch(`${BASE_URL}/posts/${id}`, { method: "DELETE", headers: authHeaders() });
  return res.json();
}
export const apiAddComment = (postId, body, parentId = null, replyTo = null) =>
  fetch(`${BASE_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("ict_token")}` },
    body: JSON.stringify({ post_id: postId, body, parent_id: parentId, reply_to: replyTo })
  }).then(r => r.json());
export async function apiDeleteComment(id) {
  const res = await fetch(`${BASE_URL}/comments/${id}`, { method: "DELETE", headers: authHeaders() });
  return res.json();
}
export async function apiToggleReaction(post_id, type) {
  const res = await fetch(`${BASE_URL}/reactions/toggle`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ post_id, type }) });
  return res.json();
}
export async function apiGetUser(username) {
  const res = await fetch(`${BASE_URL}/users/${username}`);
  return res.json();
}
export async function apiUpdateBio(bio) {
  const res = await fetch(`${BASE_URL}/users/me/bio`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ bio }) });
  return res.json();
}

// ── ADMIN ──
export async function apiAdminGetUsers() {
  const res = await fetch(`${BASE_URL}/admin/users`, { headers: authHeaders() });
  return res.json();
}
export async function apiAdminDeletePost(id) {
  const res = await fetch(`${BASE_URL}/admin/posts/${id}`, { method: "DELETE", headers: authHeaders() });
  return res.json();
}
export async function apiAdminDeleteComment(id) {
  const res = await fetch(`${BASE_URL}/admin/comments/${id}`, { method: "DELETE", headers: authHeaders() });
  return res.json();
}
export async function apiAdminBanUser(id) {
  const res = await fetch(`${BASE_URL}/admin/ban/${id}`, { method: "POST", headers: authHeaders() });
  return res.json();
}
export async function apiAdminUnbanUser(id) {
  const res = await fetch(`${BASE_URL}/admin/unban/${id}`, { method: "POST", headers: authHeaders() });
  return res.json();
}
export async function apiAdminDeleteUser(id) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
  return res.json();
}
// ── FRIENDS ──
export const apiSendFriendRequest = (id) =>
  fetch(`${BASE_URL}/friends/request/${id}`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiAcceptFriend = (id) =>
  fetch(`${BASE_URL}/friends/accept/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiDeclineFriend = (id) =>
  fetch(`${BASE_URL}/friends/decline/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiUnfriend = (id) =>
  fetch(`${BASE_URL}/friends/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiGetFriends = () =>
  fetch(`${BASE_URL}/friends/list`, { headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiGetFriendRequests = () =>
  fetch(`${BASE_URL}/friends/requests`, { headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiGetFriendStatus = (id) =>
  fetch(`${BASE_URL}/friends/status/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

// ── MESSAGES ──
export const apiGetConversations = () =>
  fetch(`${BASE_URL}/messages/`, { headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiGetMessages = (id) =>
  fetch(`${BASE_URL}/messages/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());

export const apiSendMessage = (id, body) =>
  fetch(`${BASE_URL}/messages/${id}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("ict_token")}` }, body: JSON.stringify({ body }) }).then(r => r.json());

export const apiMarkRead = (id) =>
  fetch(`${BASE_URL}/messages/read/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("ict_token")}` } }).then(r => r.json());