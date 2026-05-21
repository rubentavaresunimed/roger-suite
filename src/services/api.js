const API_BASE_URL = import.meta.env.VITE_API_URL || "http://10.117.2.137:3001/api";

export function getToken() {
  return localStorage.getItem("roger_token");
}

export function setToken(token) {
  localStorage.setItem("roger_token", token);
}

export function clearToken() {
  localStorage.removeItem("roger_token");
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro na comunicação com o servidor");
  }

  return data;
}

export const api = {
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request("/auth/me"),

  getDashboardSummary: () => request("/dashboard/summary"),

  listMyModules: () => request("/module-access/my"),

  accessMyModule: (slug) =>
    request(`/module-access/my/${slug}/access`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listModuleAccessUsers: () => request("/module-access/users"),

  getUserModuleAccess: (userId) => request(`/module-access/users/${userId}`),

  saveUserModuleAccess: (userId, modules) =>
    request(`/module-access/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ modules }),
    }),

  listUsers: () => request("/users"),

  createUser: (payload) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUser: (id, payload) =>
    request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  resetPassword: (id, password = "123456") =>
    request(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  listProfiles: () => request("/profiles"),

  createProfile: (payload) =>
    request("/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProfile: (id, payload) =>
    request(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listSystems: () => request("/systems"),

  createSystem: (payload) =>
    request("/systems", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateSystem: (id, payload) =>
    request(`/systems/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  createResource: (systemId, payload) =>
    request(`/systems/${systemId}/resources`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateResource: (id, payload) =>
    request(`/systems/resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listLogs: () => request("/logs"),

  getCostaDashboard: () => request("/costa/dashboard"),

  revalidateCostaScripts: (atendimento) =>
    request(`/costa/atendimentos/${atendimento}/revalidar`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listPermissionCatalog: () => request("/permissions/catalog"),

  getProfilePermissions: (profileId) => request(`/permissions/profiles/${profileId}`),

  saveProfilePermissions: (profileId, permissions) =>
    request(`/permissions/profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),

  getUserEffectivePermissions: (userId) => request(`/permissions/users/${userId}`),

  saveUserExceptions: (userId, exceptions) =>
    request(`/permissions/users/${userId}/exceptions`, {
      method: "PUT",
      body: JSON.stringify({ exceptions }),
    }),
};
