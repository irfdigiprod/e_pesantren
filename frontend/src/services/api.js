// src/services/api.js
// Centralized API service for Pesantren Management System

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Get auth token from localStorage
 */
function getToken() {
  return localStorage.getItem("token") || "";
}

/**
 * Set auth token to localStorage
 */
function setToken(token) {
  localStorage.setItem("token", token);
}

/**
 * Remove auth token from localStorage
 */
function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/**
 * Build headers with optional auth token
 */
function buildHeaders(includeAuth = true, contentType = "application/json") {
  const headers = {
    Accept: "application/json",
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Parse response safely (handles HTML error pages)
 */
async function parseResponse(res) {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  if (
    contentType.includes("application/json") ||
    contentType.includes("text/json")
  ) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  const text = await res.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    const stripped = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { errors: stripped || res.statusText || `HTTP ${res.status}` };
  }
}

/**
 * Make API request
 */
async function request(endpoint, options = {}) {
  const {
    method = "GET",
    body = null,
    includeAuth = true,
    contentType = "application/json",
  } = options;

  const config = {
    method,
    headers: buildHeaders(includeAuth, contentType),
  };

  if (body && method !== "GET") {
    if (body instanceof FormData) {
      config.body = body;
      // Remove Content-Type if present to let browser set boundary
      if (config.headers["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
    } else {
      config.body = JSON.stringify(body);
    }
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, config);
    const data = await parseResponse(res);

    if (!res.ok) {
      console.error(
        "[API Error]",
        res.status,
        url,
        JSON.stringify(data, null, 2)
      );

      let errorMsg =
        data?.message || data?.errors || res.statusText || `HTTP ${res.status}`;

      if (data?.error?.issues) {
        errorMsg =
          "Validation: " + data.error.issues.map((i) => i.message).join(", ");
      } else if (
        data?.error?.name === "ZodError" &&
        typeof data.error.message === "string"
      ) {
        try {
          const issues = JSON.parse(data.error.message);
          if (Array.isArray(issues)) {
            errorMsg = "Validasi: " + issues.map((i) => i.message).join(", ");
          } else {
            errorMsg = "Validasi: " + data.error.message;
          }
        } catch (e) {
          errorMsg = "Validasi: " + data.error.message;
        }
      }

      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error("Tidak dapat terhubung ke server");
    }
    throw err;
  }
}

/**
 * Upload file using FormData
 */
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${BASE_URL}/api/uploads`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    const data = await parseResponse(res);

    if (!res.ok) {
      const errorMsg =
        data?.errors || data?.message || res.statusText || `HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error("Tidak dapat terhubung ke server");
    }
    throw err;
  }
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(email, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: { email, password },
      includeAuth: false,
    });

    if (data?.data?.token) {
      setToken(data.data.token);
    }

    return data;
  },

  async register(email, password, role = "admin") {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: { email, password, role },
      includeAuth: false,
    });

    if (data?.data?.token) {
      setToken(data.data.token);
    }

    return data;
  },

  async getCurrentUser() {
    return request("/api/auth/me");
  },

  async logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      removeToken();
    }
  },
};

// ============================================
// USERS API
// ============================================

export const usersApi = {
  async getAll() {
    return request("/api/auth/users");
  },

  async getCurrent() {
    return request("/api/users/current");
  },
};

// ============================================
// STUDENTS API
// ============================================

export const studentsApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/students?${query}` : "/api/students";
    return request(endpoint);
  },

  async getById(id) {
    return request(`/api/students/${id}`);
  },

  async create(data) {
    return request("/api/students", {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/api/students/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async delete(id) {
    return request(`/api/students/${id}`, {
      method: "DELETE",
    });
  },

  async getParents(studentId) {
    return request(`/api/students/${studentId}/parents`);
  },

  async linkParent(studentId, parentId, isPrimary = false) {
    return request(`/api/students/${studentId}/parents`, {
      method: "POST",
      body: { parentId, isPrimary },
    });
  },

  async unlinkParent(studentId, parentId) {
    return request(`/api/students/${studentId}/parents/${parentId}`, {
      method: "DELETE",
    });
  },

  async previewImportExcel(formData) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/students/import/preview`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Preview failed");
    }
    return data;
  },

  async importExcel(formData) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/students/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Import failed");
    }
    return data;
  },
};

// ============================================
// PARENTS API
// ============================================

export const parentsApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/parents?${query}` : "/api/parents";
    return request(endpoint);
  },

  async getById(id) {
    return request(`/api/parents/${id}`);
  },

  async create(data) {
    return request("/api/parents", {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/api/parents/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async delete(id) {
    return request(`/api/parents/${id}`, {
      method: "DELETE",
    });
  },

  async getChildren(parentId) {
    return request(`/api/parents/${parentId}/children`);
  },
};

// ============================================
// TEACHERS API
// ============================================

export const teachersApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/teachers?${query}` : "/api/teachers";
    return request(endpoint);
  },

  async getById(id) {
    return request(`/api/teachers/${id}`);
  },

  async create(data) {
    return request("/api/teachers", {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/api/teachers/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async delete(id) {
    return request(`/api/teachers/${id}`, {
      method: "DELETE",
    });
  },

  async importPreview(formData) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/teachers/import/preview`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Preview failed");
    }
    return data;
  },

  async import(formData) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/teachers/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Import failed");
    }
    return data;
  },
};

// ============================================
// QURAN MEMORIZATION API
// ============================================

export const quranApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/quran/memorizations?${query}`
      : "/api/quran/memorizations";
    return request(endpoint);
  },

  async getByStudent(studentId) {
    return request(`/api/quran/memorizations/student/${studentId}`);
  },

  async create(data) {
    return request("/api/quran/memorizations", { method: "POST", body: data });
  },

  async update(id, data) {
    return request(`/api/quran/memorizations/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async delete(id) {
    return request(`/api/quran/memorizations/${id}`, { method: "DELETE" });
  },
};

// ============================================
// ATTENDANCE API
// ============================================

export const attendanceApi = {
  // Student attendance
  async getStudentAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/attendance/students?${query}`
      : "/api/attendance/students";
    return request(endpoint);
  },

  async createStudentAttendance(data) {
    return request("/api/attendance/students", { method: "POST", body: data });
  },

  // Teacher attendance
  async getTeacherAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/attendance/teachers?${query}`
      : "/api/attendance/teachers";
    return request(endpoint);
  },

  async teacherCheckIn(data) {
    return request("/api/attendance/teachers/check-in", {
      method: "POST",
      body: data,
    });
  },

  async teacherCheckOut(data) {
    return request("/api/attendance/teachers/check-out", {
      method: "POST",
      body: data,
    });
  },

  async teacherClaim(data) {
    return request("/api/attendance/teachers/claim", {
      method: "POST",
      body: data,
    });
  },

  async getRecap(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/attendance/teachers/recap?${query}`
      : "/api/attendance/teachers/recap";
    return request(endpoint);
  },

  async deleteTeacherAttendance(id) {
    return request(`/api/attendance/teachers/attendances/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// REWARDS & PUNISHMENTS API
// ============================================

export const rewardsApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/rewards?${query}` : "/api/rewards";
    return request(endpoint);
  },

  async getByStudent(studentId) {
    return request(`/api/rewards/student/${studentId}`);
  },

  async create(data) {
    return request("/api/rewards", { method: "POST", body: data });
  },

  async update(id, data) {
    return request(`/api/rewards/${id}`, { method: "PUT", body: data });
  },

  async delete(id) {
    return request(`/api/rewards/${id}`, { method: "DELETE" });
  },
};

// ============================================
// CLINIC API
// ============================================

export const clinicApi = {
  // Medicines
  async getMedicines(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/clinic/medicines?${query}`
      : "/api/clinic/medicines";
    return request(endpoint);
  },
  async createMedicine(data) {
    return request("/api/clinic/medicines", { method: "POST", body: data });
  },
  async updateMedicine(id, data) {
    return request(`/api/clinic/medicines/${id}`, {
      method: "PUT",
      body: data,
    });
  },
  async deleteMedicine(id) {
    return request(`/api/clinic/medicines/${id}`, { method: "DELETE" });
  },

  // Inpatients
  async getInpatients(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/clinic/inpatients?${query}`
      : "/api/clinic/inpatients";
    return request(endpoint);
  },
  async createInpatient(data) {
    return request("/api/clinic/inpatients", { method: "POST", body: data });
  },
  async updateInpatient(id, data) {
    return request(`/api/clinic/inpatients/${id}`, {
      method: "PUT",
      body: data,
    });
  },
  async deleteInpatient(id) {
    return request(`/api/clinic/inpatients/${id}`, { method: "DELETE" });
  },

  // Examinations
  async getExaminations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/api/clinic/examinations?${query}`
      : "/api/clinic/examinations";
    return request(endpoint);
  },
  async createExamination(data) {
    return request("/api/clinic/examinations", { method: "POST", body: data });
  },
  async updateExamination(id, data) {
    return request(`/api/clinic/examinations/${id}`, {
      method: "PUT",
      body: data,
    });
  },
  async deleteExamination(id) {
    return request(`/api/clinic/examinations/${id}`, { method: "DELETE" });
  },
};

// ============================================
// ACADEMIC API
// ============================================

export const academicApi = {
  // Classes
  async getClasses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query ? `/api/academic/classes?${query}` : "/api/academic/classes"
    );
  },
  async createClass(data) {
    return request("/api/academic/classes", { method: "POST", body: data });
  },
  async updateClass(id, data) {
    return request(`/api/academic/classes/${id}`, {
      method: "PUT",
      body: data,
    });
  },
  async deleteClass(id) {
    return request(`/api/academic/classes/${id}`, { method: "DELETE" });
  },
  async getClass(id) {
    return request(`/api/academic/classes/${id}`);
  },
  async assignStudent(classId, studentId, force = false) {
    return request(`/api/academic/classes/${classId}/students`, {
      method: "POST",
      body: { studentId, force },
    });
  },

  // Homeroom Teachers
  async getHomeroomTeachers(classId) {
    return request(`/api/academic/classes/${classId}/homeroom-teachers`);
  },
  async addHomeroomTeacher(classId, teacherId) {
    return request(`/api/academic/classes/${classId}/homeroom-teachers`, {
      method: "POST",
      body: { teacherId },
    });
  },
  async removeHomeroomTeacher(classId, teacherId) {
    return request(
      `/api/academic/classes/${classId}/homeroom-teachers/${teacherId}`,
      {
        method: "DELETE",
      }
    );
  },

  // Subjects
  async getSubjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query ? `/api/academic/subjects?${query}` : "/api/academic/subjects"
    );
  },
  async createSubject(data) {
    return request("/api/academic/subjects", { method: "POST", body: data });
  },
  async updateSubject(id, data) {
    return request(`/api/academic/subjects/${id}`, {
      method: "PUT",
      body: data,
    });
  },
  async deleteSubject(id) {
    return request(`/api/academic/subjects/${id}`, { method: "DELETE" });
  },

  // Schedules
  async getSchedules(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query ? `/api/academic/schedules?${query}` : "/api/academic/schedules"
    );
  },
  async createSchedule(data) {
    return request("/api/academic/schedules", { method: "POST", body: data });
  },
  async updateSchedule(id, data) {
    return request(`/api/academic/schedules/${id}`, {
      method: "PUT",
      body: data,
    });
  },
  async deleteSchedule(id) {
    return request(`/api/academic/schedules/${id}`, { method: "DELETE" });
  },

  // Grades
  async getGrades(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query ? `/api/academic/grades?${query}` : "/api/academic/grades"
    );
  },
  async createGrade(data) {
    return request("/api/academic/grades", { method: "POST", body: data });
  },
  async updateGrade(id, data) {
    return request(`/api/academic/grades/${id}`, { method: "PUT", body: data });
  },
  async deleteGrade(id) {
    return request(`/api/academic/grades/${id}`, { method: "DELETE" });
  },

  // Reports
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query ? `/api/academic/reports?${query}` : "/api/academic/reports"
    );
  },
};

// ============================================
// HALAQAH API
// ============================================

export const halaqahApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/api/halaqah?${query}` : "/api/halaqah");
  },

  async getById(id) {
    return request(`/api/halaqah/${id}`);
  },

  async create(data) {
    return request("/api/halaqah", { method: "POST", body: data });
  },

  async update(id, data) {
    return request(`/api/halaqah/${id}`, { method: "PUT", body: data });
  },

  async delete(id) {
    return request(`/api/halaqah/${id}`, { method: "DELETE" });
  },

  // Members
  async getMembers(halaqahId) {
    return request(`/api/halaqah/${halaqahId}/members`);
  },
  async addMember(halaqahId, studentId, force = false) {
    return request(`/api/halaqah/${halaqahId}/members`, {
      method: "POST",
      body: { studentId, force },
    });
  },
  async removeMember(halaqahId, studentId) {
    return request(`/api/halaqah/${halaqahId}/members/${studentId}`, {
      method: "DELETE",
    });
  },

  // Mentors
  async getMentors(halaqahId) {
    return request(`/api/halaqah/${halaqahId}/mentors`);
  },
  async addMentor(halaqahId, teacherId) {
    return request(`/api/halaqah/${halaqahId}/mentors`, {
      method: "POST",
      body: { teacherId },
    });
  },
  async removeMentor(halaqahId, teacherId) {
    return request(`/api/halaqah/${halaqahId}/mentors/${teacherId}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// ROOMS API
// ============================================

export const roomsApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/api/rooms?${query}` : "/api/rooms");
  },

  async getById(id) {
    return request(`/api/rooms/${id}`);
  },

  async create(data) {
    return request("/api/rooms", { method: "POST", body: data });
  },

  async update(id, data) {
    return request(`/api/rooms/${id}`, { method: "PUT", body: data });
  },

  async delete(id) {
    return request(`/api/rooms/${id}`, { method: "DELETE" });
  },

  // Students
  async getStudents(roomId) {
    return request(`/api/rooms/${roomId}/students`);
  },
  async assignStudent(roomId, studentId, force = false) {
    return request(`/api/rooms/${roomId}/students/${studentId}`, {
      method: "POST",
      body: { force },
    });
  },
  async removeStudent(roomId, studentId) {
    return request(`/api/rooms/${roomId}/students/${studentId}`, {
      method: "DELETE",
    });
  },

  // Supervisors
  async getSupervisors(roomId) {
    return request(`/api/rooms/${roomId}/supervisors`);
  },
  async assignSupervisor(roomId, teacherId) {
    return request(`/api/rooms/${roomId}/supervisors`, {
      method: "POST",
      body: { teacherId },
    });
  },
  async removeSupervisor(roomId, teacherId) {
    return request(`/api/rooms/${roomId}/supervisors/${teacherId}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// DIVISIONS API
// ============================================

export const divisionsApi = {
  async getAll() {
    return request("/api/divisions");
  },

  async getById(id) {
    return request(`/api/divisions/${id}`);
  },

  async create(data) {
    return request("/api/divisions", { method: "POST", body: data });
  },

  async update(id, data) {
    return request(`/api/divisions/${id}`, { method: "PUT", body: data });
  },

  async delete(id) {
    return request(`/api/divisions/${id}`, { method: "DELETE" });
  },

  // Members
  async getMembers(divisionId) {
    return request(`/api/divisions/${divisionId}/members`);
  },

  async addMember(divisionId, teacherId, force = false) {
    return request(`/api/divisions/${divisionId}/members`, {
      method: "POST",
      body: { teacherId, force },
    });
  },

  async removeMember(divisionId, teacherId) {
    return request(`/api/divisions/${divisionId}/members/${teacherId}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// CHAT API
// ============================================

export const chatApi = {
  // Conversations
  async getConversations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query ? `/api/chat/conversations?${query}` : "/api/chat/conversations"
    );
  },

  async getConversation(id) {
    return request(`/api/chat/conversations/${id}`);
  },

  async createConversation(data) {
    return request("/api/chat/conversations", { method: "POST", body: data });
  },

  async addParticipant(conversationId, userId, role = "member") {
    return request(`/api/chat/conversations/${conversationId}/participants`, {
      method: "POST",
      body: { userId, role },
    });
  },

  async removeParticipant(conversationId, userId) {
    return request(
      `/api/chat/conversations/${conversationId}/participants/${userId}`,
      {
        method: "DELETE",
      }
    );
  },

  // Messages
  async getMessages(conversationId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(
      query
        ? `/api/chat/conversations/${conversationId}/messages?${query}`
        : `/api/chat/conversations/${conversationId}/messages`
    );
  },

  async sendMessage(data) {
    return request("/api/chat/messages", { method: "POST", body: data });
  },

  async deleteMessage(id) {
    return request(`/api/chat/messages/${id}`, { method: "DELETE" });
  },

  async editMessage(id, content) {
    return request(`/api/chat/messages/${id}`, {
      method: "PUT",
      body: { content },
    });
  },

  // Reactions
  async addReaction(messageId, emoji) {
    return request(`/api/chat/messages/${messageId}/reactions`, {
      method: "POST",
      body: { emoji },
    });
  },

  async removeReaction(messageId, emoji) {
    return request(
      `/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      {
        method: "DELETE",
      }
    );
  },

  // Read status
  async markAsRead(conversationId, messageId) {
    return request(`/api/chat/conversations/${conversationId}/read`, {
      method: "POST",
      body: { messageId },
    });
  },

  // Forward message
  async forwardMessage(data) {
    // data: { messageId, targetConversationIds, targetUserIds?, caption? }
    return request("/api/chat/messages/forward", {
      method: "POST",
      body: data,
    });
  },

  // Group management
  async getGroupMembers(conversationId) {
    return request(`/api/chat/conversations/${conversationId}/members`);
  },

  async addGroupMember(conversationId, userId) {
    return request(`/api/chat/conversations/${conversationId}/members`, {
      method: "POST",
      body: { userId },
    });
  },

  async removeGroupMember(conversationId, userId) {
    return request(
      `/api/chat/conversations/${conversationId}/members/${userId}`,
      {
        method: "DELETE",
      }
    );
  },

  async updateGroup(conversationId, data) {
    return request(`/api/chat/conversations/${conversationId}`, {
      method: "PUT",
      body: data,
    });
  },
};

// ============================================
// UPLOAD API
// ============================================

export const uploadApi = {
  async upload(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Upload failed");
    }

    return res.json();
  },

  getFileUrl(type, filename) {
    return `${BASE_URL}/api/uploads/${type}/${filename}`;
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
  async check() {
    return request("/api/health", { includeAuth: false });
  },
};

// ============================================
// UTILS API
// ============================================

export const utilsApi = {
  async getLinkPreview(url) {
    return request(`/api/utils/link-preview?url=${encodeURIComponent(url)}`);
  },
};

// Export utilities
export { getToken, setToken, removeToken, BASE_URL };
// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationsApi = {
  async getAll() {
    return request("/api/notifications");
  },

  async markAsRead(id) {
    return request(`/api/notifications/${id}/read`, { method: "POST" });
  },

  async respond(id, action) {
    return request(`/api/notifications/${id}/respond`, {
      method: "POST",
      body: { action },
    });
  },

  async deleteAll() {
    return request("/api/notifications/all", { method: "DELETE" });
  },

  async markAllRead() {
    return request("/api/notifications/read-all", { method: "POST" });
  },
};
// ============================================
// SETTINGS API
// ============================================

export const settingsApi = {
  async getAll(keys = []) {
    const query = keys.length > 0 ? `?keys=${keys.join(",")}` : "";
    return request(`/api/settings${query}`);
  },

  async update(settings) {
    return request("/api/settings", {
      method: "PUT",
      body: { settings },
    });
  },
};

// ============================================
// PERMISSIONS API
// ============================================

export const permissionsApi = {
  async getMyPermissions() {
    // Always returns only current user's permissions (for PermissionList page)
    return request("/api/permissions/mine");
  },

  async getAllPermissions() {
    // Returns all permissions for admin (for PermissionApproval page)
    return request("/api/permissions");
  },

  async submitPermission(data) {
    return request("/api/permissions", {
      method: "POST",
      body: data,
    });
  },

  async updateStatus(id, status, deductSalary = false) {
    return request(`/api/permissions/${id}/status`, {
      method: "POST",
      body: { status, deductSalary },
    });
  },
};

// Export individual utilities
export { uploadFile };
