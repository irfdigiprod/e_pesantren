/**
 * Chat helper functions - formatting, avatar resolution, etc.
 */

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");

/**
 * Format time for conversation list (relative)
 */
export function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 86400000) {
    return formatTimeLocal(date, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diff < 604800000) {
    return formatDateLocal(date, { weekday: "short" });
  }
  return formatDateLocal(date, { day: "numeric", month: "short" });
}

/**
 * Format time for messages (HH:mm)
 */
export function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  return formatTimeLocal(new Date(dateStr), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format time with locale
 */
export function formatTimeLocal(date, options = {}) {
  return date.toLocaleTimeString("id-ID", {
    ...options,
  });
}

/**
 * Format date with locale
 */
export function formatDateLocal(date, options = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    ...options,
  });
}

/**
 * Get member photo URL with proper path resolution
 */
export function getMemberPhotoUrl(member) {
  if (!member.photo) return null;
  if (member.photo.startsWith("uploads/")) {
    return `${API_URL}/api/${member.photo}`;
  }
  return member.photo.startsWith("http")
    ? member.photo
    : `${API_URL}${member.photo.startsWith("/") ? "" : "/"}${member.photo}`;
}

/**
 * Get member display name
 */
export function getMemberName(member) {
  if (member.name) return member.name;
  if (member.email) return member.email.split("@")[0];
  return "User";
}

/**
 * Get member initials for avatar fallback
 */
export function getMemberInitials(member) {
  const name = getMemberName(member);
  const parts = name.split(/[@\s._-]/).filter(Boolean);
  if (parts.length >= 1) return parts[0].slice(0, 2).toUpperCase();
  return name.charAt(0).toUpperCase();
}

/**
 * Sanitize avatar URLs (fixes localhost/mixed content issues)
 */
export function getSanitizedAvatarUrl(url) {
  if (!url) return "";
  let processedUrl = url;

  // Fix: Handle legacy localhost URLs stored in DB
  if (processedUrl.includes("localhost:") && !import.meta.env.DEV) {
    try {
      const urlObj = new URL(processedUrl);
      processedUrl = urlObj.pathname;
    } catch (e) {
      // invalid url, keep as is
    }
  }

  // Ensure relative paths work with proxy
  if (
    processedUrl.startsWith("/uploads/") ||
    processedUrl.startsWith("uploads/")
  ) {
    if (processedUrl.startsWith("/")) processedUrl = processedUrl.substring(1);
    return `${API_URL}/api/${processedUrl}`;
  }

  // Absolute URLs (external)
  if (processedUrl.startsWith("http")) {
    return processedUrl;
  }

  // Relative URLs
  return `${API_URL}${processedUrl.startsWith("/") ? "" : "/"}${processedUrl}`;
}

/**
 * Get conversation name based on type and participants
 */
export function getConversationName(conv, currentUserId) {
  if (conv.type === "group") return conv.name || "Grup";

  // Find the other participant (not current user)
  const other = conv.participants?.find((p) => {
    const participantId = p.userId || p.id;
    return String(participantId) !== String(currentUserId);
  });

  // If other participant found, return their name
  if (other) {
    if (other.name) return other.name;
    if (other.email) {
      const namePart = other.email.split("@")[0];
      return namePart
        .split(/[._-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }

  // Fallback
  if (conv.name) return conv.name;
  return "Pengguna";
}

/**
 * Get conversation avatar (URL or initials)
 */
export function getConversationAvatar(conv, currentUserId) {
  if (conv.avatarUrl) {
    return getSanitizedAvatarUrl(conv.avatarUrl);
  }

  // Personal chat: try to get other participant's photo
  if (conv.type !== "group" && conv.participants) {
    const other = conv.participants.find((p) => {
      const participantId = p.userId || p.id;
      return String(participantId) !== String(currentUserId);
    });
    if (other?.photo) {
      return getSanitizedAvatarUrl(other.photo);
    }
  }

  // Fallback: Initials
  const name = getConversationName(conv, currentUserId);
  const parts = name.split(/[@\s._-]/).filter(Boolean);
  if (parts.length >= 1) return parts[0].slice(0, 2).toUpperCase();
  return name.charAt(0).toUpperCase();
}

/**
 * Get preview text for conversation list
 */
export function getPreviewText(conv) {
  if (!conv.lastMessage) return "Belum ada pesan";
  if (conv.lastMessage.messageType !== "text") {
    const types = {
      image: "📷 Gambar",
      video: "🎥 Video",
      audio: "🎵 Audio",
      document: "📄 Dokumen",
    };
    return types[conv.lastMessage.messageType] || "📎 Lampiran";
  }
  return conv.lastMessage.content?.substring(0, 50) || "";
}

/**
 * Convert emoji to Apple CDN URL
 */
export function getAppleEmojiUrl(emoji) {
  const codePoints = [];
  for (const char of emoji) {
    codePoints.push(char.codePointAt(0).toString(16));
  }
  const hex = codePoints.join("-");
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.0/img/apple/64/${hex}.png`;
}

/**
 * Parse text and replace emojis with Apple images
 */
export function parseAppleEmojis(text) {
  if (!text) return "";
  return text.replace(/\p{Extended_Pictographic}/gu, (match) => {
    return `<img src="${getAppleEmojiUrl(
      match
    )}" class="apple-emoji-text" loading="lazy" alt="${match}" onerror="this.outerHTML='<span class=\\'native-emoji-fallback\\'>${match}</span>';" />`;
  });
}

/**
 * WhatsApp-style text formatting parser
 */
export function formatWhatsAppText(text) {
  if (!text) return "";

  // Process lines individually to handle blockquotes
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    const trimmedLine = line.trim();
    const isBlockquote = trimmedLine.startsWith(">");

    if (isBlockquote) {
      const content = line.trim().substring(1).trim();
      const escapedContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<span class="wa-blockquote">${escapedContent}</span>`;
    } else {
      return line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  });

  let formatted = processedLines.join("<br>");

  // Convert WhatsApp formatting to HTML
  formatted = formatted.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");
  formatted = formatted.replace(/~([^~]+)~/g, "<del>$1</del>");
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bullet list
  formatted = formatted.replace(
    /^- (.+)$/gm,
    '<span class="wa-list-item">• $1</span>'
  );
  formatted = formatted.replace(/<br>- /g, '<br><span class="wa-list-item">• ');

  // Numbered list
  formatted = formatted.replace(
    /^(\d+)\. (.+)$/gm,
    '<span class="wa-list-item">$1. $2</span>'
  );
  formatted = formatted.replace(
    /<br>(\d+)\. /g,
    '<br><span class="wa-list-item">$1. '
  );

  // Convert URLs to clickable links
  const urlLinkPattern = /https?:\/\/[^\s<>"]+/gi;
  formatted = formatted.replace(urlLinkPattern, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener" class="message-link">${url}</a>`;
  });

  return formatted;
}

/**
 * Extract URLs from text
 */
export function extractUrls(text) {
  if (!text) return [];
  const URL_REGEX =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const matches = text.match(URL_REGEX);
  return matches || [];
}

export { API_URL };
