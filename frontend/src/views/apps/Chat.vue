<template>
  <div class="chat-container">
    <!-- Sidebar - Conversation List -->
    <aside
      :class="[
        'chat-sidebar',
        { 'sidebar-visible': showMobileSidebar || !activeConversation },
      ]"
    >
      <div class="sidebar-header">
        <h2>Pesan</h2>
        <div class="header-buttons">
          <button
            @click="showNewChat = true"
            class="new-chat-btn"
            title="Chat Baru"
          >
            <Icon icon="mdi:message-plus" />
          </button>
          <button
            @click="showNewGroupChat = true"
            class="new-chat-btn"
            title="Grup Baru"
          >
            <Icon icon="mdi:account-group" />
          </button>
        </div>
      </div>

      <div class="search-box">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari percakapan..."
          class="search-input"
        />
      </div>

      <div class="conversation-list">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          :class="[
            'conversation-item',
            { active: activeConversation?.id === conv.id },
          ]"
          @click="
            selectConversation(conv);
            showMobileSidebar = false;
          "
        >
          <div class="conv-avatar">
            <img
              v-if="getConversationAvatar(conv).includes('/')"
              :src="getConversationAvatar(conv)"
              alt="Avatar"
              class="avatar-img"
            />
            <span v-else>{{ getConversationAvatar(conv) }}</span>
          </div>
          <div class="conv-info">
            <div class="conv-header">
              <span class="conv-name">{{ getConversationName(conv) }}</span>
              <span class="conv-time">{{
                formatTime(conv.lastMessageAt)
              }}</span>
            </div>
            <div class="conv-preview">
              <span class="preview-text">{{ getPreviewText(conv) }}</span>
              <span v-if="conv.unreadCount > 0" class="unread-badge">
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="conversations.length === 0" class="empty-state">
          <Icon icon="mdi:chat-outline" class="empty-icon" />
          <p>Belum ada percakapan</p>
        </div>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="chat-main">
      <template v-if="activeConversation">
        <!-- Chat Header -->
        <header class="chat-header">
          <div class="header-info">
            <!-- Mobile Back Button -->
            <button
              class="back-btn"
              @click="
                activeConversation = null;
                showMobileSidebar = true;
              "
              title="Kembali"
            >
              <Icon icon="mdi:arrow-left" />
            </button>
            <div class="header-avatar">
              <img
                v-if="getConversationAvatar(activeConversation).includes('/')"
                :src="getConversationAvatar(activeConversation)"
                alt="Avatar"
                class="avatar-img"
              />
              <span v-else>{{
                getConversationAvatar(activeConversation)
              }}</span>
            </div>
            <div class="header-details">
              <h3>{{ getConversationName(activeConversation) }}</h3>
              <span v-if="typingUsers.length > 0" class="typing-indicator">
                {{ typingUsers.join(", ") }} sedang mengetik...
              </span>
              <!-- For groups, show member count -->
              <span
                v-else-if="activeConversation.type === 'group'"
                class="group-subtitle"
              >
                {{ activeConversation.participants?.length || 0 }} anggota
              </span>
              <!-- For private chats, show online status -->
              <span
                v-else
                :class="[
                  'online-status',
                  { online: getOnlineStatus() === 'Online' },
                ]"
              >
                {{ getOnlineStatus() }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <!-- Info button - later can open group info panel -->
            <button
              class="action-btn"
              title="Info"
              @click="
                activeConversation.type === 'group' ? loadGroupInfo() : null
              "
            >
              <Icon icon="mdi:information-outline" />
            </button>
          </div>
        </header>

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="messages-container"
          @scroll="handleScroll"
          @click="handleBackgroundClick"
          :style="{
            paddingBottom: activeMessageActions.isFixed ? '60px' : '0',
          }"
        >
          <div v-if="loadingMessages" class="loading-messages">
            <Icon icon="mdi:loading" class="spin" />
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'message',
              {
                own: isMessageOwn(message),
                deleted: message.isDeleted,
                'actions-visible':
                  activeMessageActions.messageId === message.id,
              },
            ]"
            :style="
              isMessageOwn(message)
                ? 'align-self: flex-end; flex-direction: row-reverse;'
                : ''
            "
          >
            <div
              :class="[
                'message-content',
                { edited: message.isEdited && !message.isDeleted },
              ]"
            >
              <!-- Sender name for group chats (only for other's messages) -->
              <div
                v-if="
                  activeConversation?.type === 'group' && !isMessageOwn(message)
                "
                class="group-sender-name"
              >
                {{
                  message.senderName ||
                  message.sender?.name ||
                  message.senderEmail ||
                  "Unknown"
                }}
              </div>

              <!-- Deleted message indicator -->
              <p v-if="message.isDeleted" class="message-text deleted-text">
                <Icon icon="mdi:delete" style="margin-right: 4px" />
                Pesan telah dihapus
              </p>

              <!-- Normal content (only show if not deleted) -->
              <template v-else>
                <!-- Signed Indicator -->
                <div v-if="message.isSigned" class="signed-indicator">
                  <Icon
                    icon="solar:pen-new-square-bold-duotone"
                    class="signed-icon"
                  />
                  <span
                    >Signed by
                    {{
                      (message.originalSignerName ||
                        message.sender?.name ||
                        message.senderEmail) ===
                      (currentUser?.name || currentUser?.email)
                        ? "Me"
                        : message.originalSignerName ||
                          message.sender?.name ||
                          message.senderEmail
                    }}</span
                  >
                </div>

                <!-- Forwarded indicator -->
                <div v-if="message.isForwarded" class="forwarded-label">
                  <Icon
                    icon="solar:forward-bold-duotone"
                    class="forward-icon"
                  />
                  <span>Diteruskan</span>
                </div>
                <!-- Reply preview -->
                <div v-if="message.replyTo" class="reply-preview">
                  <span class="reply-author">{{
                    message.replyTo.senderEmail
                  }}</span>
                  <span class="reply-text">{{ message.replyTo.content }}</span>
                </div>

                <!-- Attachments -->
                <div
                  v-if="getMessageAttachments(message).length > 0"
                  class="message-attachments"
                >
                  <!-- Image Grid (WhatsApp style) -->
                  <div
                    v-if="getImageAttachments(message).length > 0"
                    :class="[
                      'image-grid',
                      `grid-${Math.min(
                        getImageAttachments(message).length,
                        4
                      )}`,
                    ]"
                  >
                    <div
                      v-for="(img, index) in getImageAttachments(message).slice(
                        0,
                        4
                      )"
                      :key="img.id || img.fileName"
                      class="grid-image-wrapper"
                      @click="openImageGallery(message, index)"
                    >
                      <img
                        :src="getFileUrl(img)"
                        :alt="img.originalName"
                        class="grid-image"
                      />

                      <!-- HD Badge (Mock) -->
                      <span class="hd-badge">HD</span>

                      <!-- Time badge -->
                      <span class="image-time-badge">
                        {{
                          formatMessageTime(message.createdAt).replace(":", ".")
                        }}
                      </span>

                      <!-- +N overlay for more than 4 images -->
                      <div
                        v-if="
                          index === 3 && getImageAttachments(message).length > 4
                        "
                        class="more-overlay"
                      >
                        <span
                          >+{{ getImageAttachments(message).length - 4 }}</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Non-image attachments -->
                  <div
                    v-for="att in getNonImageAttachments(message)"
                    :key="att.id || att.fileName"
                    :class="['attachment', att.fileType]"
                  >
                    <div
                      v-if="att.fileType === 'video'"
                      class="attachment-video"
                    >
                      <video :src="getFileUrl(att)" controls />
                    </div>
                    <div
                      v-else-if="att.fileType === 'audio'"
                      class="attachment-audio"
                    >
                      <audio :src="getFileUrl(att)" controls />
                    </div>
                    <a
                      v-else
                      :href="getFileUrl(att)"
                      target="_blank"
                      class="attachment-doc"
                      style="color: #1e293b !important"
                    >
                      <Icon icon="mdi:file-document-outline" />
                      <span>{{ att.originalName }}</span>
                    </a>
                  </div>
                </div>

                <!-- Text content -->
                <div v-if="message.content" class="message-text-wrapper">
                  <p
                    class="message-text"
                    v-html="getDisplayContent(message)"
                  ></p>
                  <button
                    v-if="isMessageLong(message)"
                    class="show-more-btn"
                    @click="toggleMessageExpand(message.id)"
                  >
                    {{
                      isMessageExpanded(message.id)
                        ? "Tampilkan lebih sedikit"
                        : "Tampilkan selanjutnya"
                    }}
                  </button>
                </div>
              </template>

              <!-- Link Preview in Message -->
              <div
                v-if="
                  !message.isDeleted &&
                  messageHasUrl(message) &&
                  getMessageLinkPreview(message) &&
                  getMessageLinkPreview(message) !== 'loading'
                "
                class="message-link-preview"
              >
                <a
                  :href="getMessageUrl(message)"
                  target="_blank"
                  rel="noopener"
                >
                  <img
                    v-if="getMessageLinkPreview(message)?.image"
                    :src="getMessageLinkPreview(message).image"
                    @error="$event.target.style.display = 'none'"
                  />
                  <div class="link-preview-content">
                    <h4 class="link-preview-title">
                      {{ getMessageLinkPreview(message)?.title }}
                    </h4>
                    <p
                      v-if="getMessageLinkPreview(message)?.description"
                      class="link-preview-desc"
                    >
                      {{
                        getMessageLinkPreview(message).description.substring(
                          0,
                          80
                        )
                      }}{{
                        getMessageLinkPreview(message).description.length > 80
                          ? "..."
                          : ""
                      }}
                    </p>
                    <span class="link-preview-domain">{{
                      getMessageLinkPreview(message)?.domain
                    }}</span>
                  </div>
                </a>
              </div>

              <!-- Message footer -->
              <div class="message-footer">
                <span class="message-time">{{
                  formatMessageTime(message.createdAt)
                }}</span>
                <span v-if="message.isEdited" class="edited-label">diedit</span>
              </div>

              <!-- Reactions (hide if message is deleted) -->
              <div
                v-if="
                  !message.isDeleted &&
                  Object.keys(message.reactions || {}).length > 0
                "
                class="reactions"
              >
                <button
                  v-for="(users, emoji) in message.reactions"
                  :key="emoji"
                  :class="[
                    'reaction',
                    { own: users.some((u) => u.userId == currentUser?.id) },
                  ]"
                  @click="toggleReaction(message.id, emoji)"
                >
                  <img
                    :src="getAppleEmojiUrl(emoji)"
                    class="apple-emoji-reaction"
                    :alt="emoji"
                    @error="
                      $event.target.style.display = 'none';
                      $event.target.insertAdjacentText('afterend', emoji);
                    "
                  />
                  <span class="reaction-count">{{ users.length }}</span>
                </button>
              </div>
            </div>

            <!-- Message actions (hide if message is deleted or using floating menu) -->
            <div
              v-if="
                !message.isDeleted &&
                (!activeMessageActions.isFixed ||
                  activeMessageActions.messageId !== message.id)
              "
              class="message-actions"
              :style="
                activeMessageActions.messageId === message.id
                  ? activeMessageActions.isFixed
                    ? {
                        position: 'fixed',
                        top: activeMessageActions.topOffset + 'px',
                        left: activeMessageActions.leftOffset + 'px',
                        zIndex: 9999,
                        marginTop: 0,
                      }
                    : { top: activeMessageActions.topOffset + 'px !important' }
                  : {}
              "
              @click.stop
            >
              <button
                @click="showEmojiPicker(message)"
                title="Reaction"
                class="action-btn-sm"
              >
                <Icon icon="solar:emoji-funny-circle-line-duotone" />
              </button>
              <button
                @click="replyToMessage(message)"
                title="Balas"
                class="action-btn-sm"
              >
                <Icon icon="solar:reply-line-duotone" />
              </button>
              <button
                @click="startForwardMessage(message)"
                title="Teruskan"
                class="action-btn-sm"
              >
                <Icon icon="solar:forward-line-duotone" />
              </button>
              <!-- Edit/Delete only for own messages -->
              <template v-if="isMessageOwn(message)">
                <button
                  @click="startEditMessage(message)"
                  title="Edit"
                  class="action-btn-sm edit-btn"
                >
                  <Icon icon="solar:pen-2-line-duotone" />
                </button>
                <button
                  @click="confirmDeleteMessage(message)"
                  title="Delete"
                  class="action-btn-sm delete-btn"
                >
                  <Icon icon="solar:trash-bin-trash-line-duotone" />
                </button>
              </template>
            </div>

            <!-- Emoji picker moved to centered modal below -->
          </div>
        </div>

        <!-- Scroll to bottom button -->
        <Transition name="fade">
          <button
            v-if="showScrollBottomBtn"
            class="scroll-bottom-btn"
            @click="scrollToBottom"
            title="Scroll ke bawah"
          >
            <Icon icon="solar:alt-arrow-down-line-duotone" />
          </button>
        </Transition>

        <!-- Message Input -->
        <footer class="chat-input">
          <!-- Reply indicator -->
          <div v-if="replyTo" class="reply-indicator">
            <div class="reply-content">
              <span>Membalas {{ replyTo.senderEmail }}</span>
              <p>{{ replyTo.content }}</p>
            </div>
            <button @click="replyTo = null">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <!-- Attachment preview -->
          <div v-if="attachments.length > 0" class="attachments-preview">
            <div
              v-for="(file, index) in attachments"
              :key="index"
              class="preview-item"
            >
              <img
                v-if="file.preview"
                :src="file.preview"
                class="preview-image"
              />
              <span v-else class="preview-name">{{ file.file.name }}</span>
              <button @click="removeAttachment(index)">
                <Icon icon="mdi:close" />
              </button>
            </div>
          </div>

          <!-- Link Preview Card -->
          <div
            v-if="linkPreview || linkPreviewLoading"
            class="link-preview-input"
          >
            <div v-if="linkPreviewLoading" class="link-preview-loading">
              <Icon icon="mdi:loading" class="spin" />
              <span>Memuat preview...</span>
            </div>
            <div v-else-if="linkPreview" class="link-preview-card">
              <img
                v-if="linkPreview.image"
                :src="linkPreview.image"
                class="link-preview-image"
                @error="$event.target.style.display = 'none'"
              />
              <div class="link-preview-content">
                <h4 class="link-preview-title">{{ linkPreview.title }}</h4>
                <p v-if="linkPreview.description" class="link-preview-desc">
                  {{ linkPreview.description.substring(0, 100)
                  }}{{ linkPreview.description.length > 100 ? "..." : "" }}
                </p>
                <span class="link-preview-domain">{{
                  linkPreview.domain
                }}</span>
              </div>
              <button class="link-preview-close" @click="clearLinkPreview">
                <Icon icon="mdi:close" />
              </button>
            </div>
          </div>

          <!-- Locked Message -->
          <div v-if="isChatLocked" class="chat-locked-message">
            <Icon icon="mdi:lock" />
            <span
              >Grup ini dikunci. Hanya admin yang dapat mengirim pesan.</span
            >
          </div>

          <!-- Input area -->
          <div v-else class="input-row">
            <!-- Attachment Menu Wrapper -->
            <div
              class="attach-menu-wrapper"
              v-click-outside="() => (showAttachMenu = false)"
            >
              <button
                @click="showAttachMenu = !showAttachMenu"
                class="attach-btn"
                :class="{ 'menu-active': showAttachMenu }"
              >
                <Icon :icon="showAttachMenu ? 'mdi:close' : 'mdi:plus'" />
              </button>

              <!-- WhatsApp Style Popup Menu -->
              <transition name="pop-up">
                <div v-if="showAttachMenu" class="attach-menu-popup">
                  <div class="attach-grid">
                    <button
                      class="attach-item"
                      @click="handleAttachment('doc')"
                    >
                      <div class="attach-icon doc-icon">
                        <Icon icon="mdi:file-document" />
                      </div>
                      <span>Dokumen</span>
                    </button>

                    <button
                      class="attach-item"
                      @click="handleAttachment('media')"
                    >
                      <div class="attach-icon media-icon">
                        <Icon icon="mdi:image" />
                      </div>
                      <span>Foto & Video</span>
                    </button>

                    <button
                      class="attach-item"
                      @click="handleAttachment('camera')"
                    >
                      <div class="attach-icon camera-icon">
                        <Icon icon="mdi:camera" />
                      </div>
                      <span>Kamera</span>
                    </button>

                    <button
                      class="attach-item"
                      @click="handleAttachment('signature')"
                    >
                      <div
                        class="attach-icon sign-icon"
                        :class="{ active: isSigned }"
                      >
                        <Icon icon="solar:pen-new-square-bold-duotone" />
                      </div>
                      <span>{{
                        isSigned ? "Hapus Tanda Tangan" : "Tanda Tangan"
                      }}</span>
                    </button>

                    <!-- Placeholders for future features -->
                    <button
                      class="attach-item"
                      @click="handleAttachment('audio')"
                    >
                      <div class="attach-icon audio-icon">
                        <Icon icon="mdi:headphones" />
                      </div>
                      <span>Audio</span>
                    </button>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Hidden Inputs with Specific Types -->
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              multiple
              style="display: none"
            />
            <input
              type="file"
              ref="fileInputDoc"
              @change="handleFileSelect"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              style="display: none"
            />
            <input
              type="file"
              ref="fileInputMedia"
              @change="handleFileSelect"
              multiple
              accept="image/*,video/*"
              style="display: none"
            />
            <input
              type="file"
              ref="fileInputCamera"
              @change="handleFileSelect"
              accept="image/*"
              capture="environment"
              style="display: none"
            />
            <input
              type="file"
              ref="fileInputAudio"
              @change="handleFileSelect"
              multiple
              accept="audio/*"
              style="display: none"
            />
            <div class="input-wrapper">
              <!-- Formatting Toolbar -->
              <div v-if="editor" class="format-toolbar">
                <button
                  type="button"
                  @click="editor.chain().focus().toggleBold().run()"
                  :class="{ active: editor.isActive('bold') }"
                  class="format-btn"
                  title="Bold (Ctrl+B)"
                >
                  <Icon icon="mdi:format-bold" />
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleItalic().run()"
                  :class="{ active: editor.isActive('italic') }"
                  class="format-btn"
                  title="Italic (Ctrl+I)"
                >
                  <Icon icon="mdi:format-italic" />
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleStrike().run()"
                  :class="{ active: editor.isActive('strike') }"
                  class="format-btn"
                  title="Strikethrough"
                >
                  <Icon icon="mdi:format-strikethrough" />
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleCode().run()"
                  :class="{ active: editor.isActive('code') }"
                  class="format-btn"
                  title="Code (Ctrl+E)"
                >
                  <Icon icon="mdi:code-tags" />
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleBulletList().run()"
                  :class="{ active: editor.isActive('bulletList') }"
                  class="format-btn"
                  title="Bullet List"
                >
                  <Icon icon="mdi:format-list-bulleted" />
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleOrderedList().run()"
                  :class="{ active: editor.isActive('orderedList') }"
                  class="format-btn"
                  title="Numbered List"
                >
                  <Icon icon="mdi:format-list-numbered" />
                </button>
                <button
                  type="button"
                  @click="toggleQuote"
                  :class="{ active: editor.isActive('blockquote') }"
                  class="format-btn"
                  title="Quote"
                >
                  <Icon icon="mdi:format-quote-close" />
                </button>
              </div>
              <EditorContent
                :editor="editor"
                class="message-input-editable"
                @keydown="handleEditorKeydown"
              />
            </div>
            <!-- Emoji button for message input -->
            <button
              @click.stop="toggleInputEmojiPicker"
              class="emoji-input-btn"
              :title="showInputEmojiPicker ? 'Keyboard' : 'Emoji'"
            >
              <Icon
                :icon="
                  showInputEmojiPicker
                    ? 'solar:keyboard-line-duotone'
                    : 'solar:emoji-funny-circle-line-duotone'
                "
              />
            </button>
            <button @click="sendMessage" :disabled="!canSend" class="send-btn">
              <Icon icon="solar:plain-bold-duotone" />
            </button>
          </div>

          <!-- Static Emoji Keyboard (Appears below input like keyboard) -->
          <div v-show="showInputEmojiPicker" class="emoji-keyboard-area">
            <!-- 1. Top Bar: Search, Type Toggle, Backspace -->
            <div class="emoji-picker-topbar">
              <button class="icon-btn search-emoji-btn">
                <Icon icon="solar:magnifer-line-duotone" />
              </button>

              <div class="emoji-type-tabs">
                <!-- Emoji Tab -->
                <button class="type-tab active">
                  <Icon icon="solar:emoji-funny-circle-line-duotone" />
                </button>
                <!-- GIF Tab -->
                <button class="type-tab disabled" title="GIF">
                  <Icon icon="solar:clapperboard-play-line-duotone" />
                </button>
                <!-- Sticker Tab -->
                <button class="type-tab disabled" title="Sticker">
                  <Icon icon="solar:sticker-circle-line-duotone" />
                </button>
              </div>

              <button class="backspace-btn-top" @click="handleBackspace">
                <Icon icon="solar:backspace-line-duotone" />
              </button>
            </div>

            <!-- 2. Grid -->
            <div
              class="emoji-grid"
              ref="emojiGridRef"
              @scroll="handleEmojiScroll"
            >
              <div
                v-for="(emojis, category) in emojiCategories"
                :key="category"
                :id="getCategoryId(category)"
                :data-category="category"
                class="emoji-category-section"
              >
                <div class="emoji-category-label">
                  {{ category.split(" ")[1] || category.split(" ")[0] }}
                </div>
                <div class="emoji-list-content">
                  <button
                    v-for="emoji in emojis"
                    :key="emoji"
                    @click="insertEmojiToInput(emoji)"
                    class="emoji-grid-btn"
                  >
                    <img
                      :src="getAppleEmojiUrl(emoji)"
                      class="apple-emoji"
                      loading="lazy"
                      :alt="emoji"
                      @error="
                        $event.target.replaceWith(
                          document.createTextNode(emoji)
                        )
                      "
                    />
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. Bottom Footer: Categories -->
            <div class="emoji-picker-footer">
              <div class="emoji-categories-tabs">
                <button
                  v-for="(emojis, category) in emojiCategories"
                  :key="category"
                  class="category-tab"
                  :class="{ active: selectedEmojiCategory === category }"
                  @click="scrollToCategory(category)"
                  :title="category"
                >
                  <!-- Explicitly define icons using v-if to force bundler detection -->
                  <Icon
                    v-if="category.includes('Smileys')"
                    icon="solar:emoji-funny-circle-line-duotone"
                  />
                  <Icon
                    v-else-if="category.includes('Hearts')"
                    icon="solar:heart-line-duotone"
                  />
                  <Icon
                    v-else-if="category.includes('Gestures')"
                    icon="solar:hand-stars-line-duotone"
                  />
                  <Icon
                    v-else-if="category.includes('Activities')"
                    icon="solar:football-line-duotone"
                  />
                  <Icon
                    v-else-if="category.includes('Animals')"
                    icon="mdi:paw"
                  />
                  <Icon
                    v-else-if="category.includes('Food')"
                    icon="solar:cup-line-duotone"
                  />
                  <Icon
                    v-else-if="category.includes('Travel')"
                    icon="mdi:rocket-launch-outline"
                  />
                  <Icon
                    v-else-if="category.includes('Objects')"
                    icon="mdi:laptop"
                  />
                  <Icon
                    v-else-if="category.includes('Flags')"
                    icon="mdi:flag-variant-outline"
                  />
                  <Icon v-else icon="solar:circle-line-duotone" />
                </button>
              </div>
            </div>
          </div>
        </footer>
      </template>

      <!-- Empty state -->
      <div v-else class="empty-chat">
        <Icon icon="solar:chat-round-dots-line-duotone" class="empty-icon" />
        <h3>Pilih percakapan</h3>
        <p>Pilih percakapan dari daftar atau mulai percakapan baru</p>
      </div>
    </main>

    <!-- New Chat Modal -->
    <div
      v-if="showNewChat"
      class="modal-overlay"
      @click.self="showNewChat = false"
    >
      <div class="modal new-chat-modal">
        <div class="modal-header">
          <h3>Percakapan Baru</h3>
          <button @click="showNewChat = false" class="modal-close-btn">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <!-- Search Input -->
        <div class="user-search-box">
          <Icon icon="mdi:magnify" class="search-icon" />
          <input
            v-model="userSearchQuery"
            type="text"
            placeholder="Cari pengguna..."
            class="user-search-input"
          />
        </div>

        <!-- User List -->
        <div class="user-list">
          <div
            v-for="user in filteredAvailableUsers"
            :key="user.id"
            :class="['user-item', { selected: newChatUserId === user.id }]"
            @click="selectUser(user)"
          >
            <div class="user-avatar">
              {{ user.email.charAt(0).toUpperCase() }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.name || user.email }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <Icon
              v-if="newChatUserId === user.id"
              icon="mdi:check-circle"
              class="selected-icon"
            />
          </div>
          <div v-if="filteredAvailableUsers.length === 0" class="no-users">
            <p>Tidak ada pengguna ditemukan</p>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="showNewChat = false" class="btn-cancel">Batal</button>
          <button
            @click="createNewConversation"
            :disabled="!newChatUserId"
            class="btn-primary"
          >
            Mulai Chat
          </button>
        </div>
      </div>
    </div>

    <!-- New Group Chat Modal -->
    <div
      v-if="showNewGroupChat"
      class="modal-overlay"
      @click.self="showNewGroupChat = false"
    >
      <div class="modal new-chat-modal">
        <div class="modal-header">
          <h3>Grup Baru</h3>
          <button @click="showNewGroupChat = false" class="modal-close-btn">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <!-- Group Name Input -->
        <div class="group-name-input-wrapper">
          <Icon icon="mdi:account-group" class="group-icon" />
          <input
            v-model="newGroupName"
            type="text"
            placeholder="Nama Grup"
            class="group-name-input"
          />
        </div>

        <!-- Selected Members Preview -->
        <div
          v-if="selectedGroupMembers.length > 0"
          class="selected-members-preview"
        >
          <span class="selected-label"
            >{{ selectedGroupMembers.length }} anggota dipilih</span
          >
          <div class="selected-avatars">
            <div
              v-for="member in selectedGroupMembers.slice(0, 5)"
              :key="member.id"
              class="mini-avatar"
              :title="member.name || member.email"
            >
              {{ (member.name || member.email).charAt(0).toUpperCase() }}
            </div>
            <span v-if="selectedGroupMembers.length > 5" class="more-count">
              +{{ selectedGroupMembers.length - 5 }}
            </span>
          </div>
        </div>

        <!-- Search Input -->
        <div class="user-search-box">
          <Icon icon="mdi:magnify" class="search-icon" />
          <input
            v-model="groupSearchQuery"
            type="text"
            placeholder="Cari anggota..."
            class="user-search-input"
          />
        </div>

        <!-- User List (Multi-select) -->
        <div class="user-list">
          <div
            v-for="user in filteredGroupUsers"
            :key="user.id"
            :class="['user-item', { selected: isGroupMemberSelected(user) }]"
            @click="toggleGroupMember(user)"
          >
            <div class="user-avatar">
              {{ (user.name || user.email).charAt(0).toUpperCase() }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.name || user.email }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <Icon
              v-if="isGroupMemberSelected(user)"
              icon="mdi:check-circle"
              class="selected-icon"
            />
          </div>
          <div v-if="filteredGroupUsers.length === 0" class="no-users">
            <p>Tidak ada pengguna ditemukan</p>
          </div>
        </div>

        <!-- Invite Mode Option -->
        <div class="invite-mode-option">
          <label class="checkbox-label">
            <input type="checkbox" v-model="useInviteMode" />
            <span class="checkbox-text">
              <Icon icon="mdi:email-send" class="checkbox-icon" />
              Kirim undangan ke anggota (harus menerima dulu)
            </span>
          </label>
        </div>

        <div class="modal-actions">
          <button @click="showNewGroupChat = false" class="btn-cancel">
            Batal
          </button>
          <button
            @click="createNewGroup"
            :disabled="!newGroupName.trim() || selectedGroupMembers.length < 1"
            class="btn-primary"
          >
            Buat Grup
          </button>
        </div>
      </div>
    </div>

    <!-- Centered Emoji Picker Modal -->
    <Teleport to="body">
      <div
        v-if="emojiPickerMessage && !showFullEmojiPicker"
        class="reaction-modal-overlay"
        @click.self="emojiPickerMessage = null"
      >
        <div class="reaction-modal">
          <div class="reaction-modal-header">
            <span>Pilih Reaction</span>
            <button
              @click="emojiPickerMessage = null"
              class="reaction-modal-close"
            >
              <Icon icon="mdi:close" />
            </button>
          </div>
          <div class="reaction-emoji-grid">
            <button
              v-for="emoji in commonEmojis"
              :key="emoji"
              @click="addReaction(emojiPickerMessage.id, emoji)"
              class="reaction-emoji-btn"
            >
              <img
                :src="getAppleEmojiUrl(emoji)"
                class="apple-emoji"
                loading="lazy"
                :alt="emoji"
              />
            </button>
            <!-- + Button to open full picker -->
            <button
              @click="openFullEmojiPicker"
              class="reaction-emoji-btn emoji-more"
              title="Emoji lainnya"
            >
              <Icon icon="mdi:plus-circle-outline" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Full Emoji Picker Panel (WhatsApp-style keyboard) -->
    <transition name="slide-up">
      <div v-if="showFullEmojiPicker" class="full-emoji-picker">
        <div class="emoji-picker-header">
          <span class="emoji-picker-title">Pilih Emoji</span>
          <button @click="closeFullEmojiPicker" class="emoji-picker-close">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="emoji-categories-tabs">
          <button
            v-for="(emojis, category) in emojiCategories"
            :key="category"
            class="category-tab"
            :class="{ active: selectedEmojiCategory === category }"
            @click="selectedEmojiCategory = category"
          >
            <img
              :src="getAppleEmojiUrl(category.split(' ')[0])"
              class="apple-emoji-tab"
              :alt="category"
            />
          </button>
        </div>
        <div class="emoji-grid">
          <button
            v-for="emoji in emojiCategories[selectedEmojiCategory]"
            :key="emoji"
            @click="addReactionFromFullPicker(emoji)"
            class="emoji-grid-btn"
          >
            <img
              :src="getAppleEmojiUrl(emoji)"
              class="apple-emoji"
              :alt="emoji"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </transition>

    <!-- Edit Message Modal -->
    <div v-if="editingMessage" class="modal-overlay" @click="cancelEdit">
      <div class="modal" @click.stop>
        <h3>Edit Pesan</h3>
        <textarea
          v-model="editingContent"
          class="edit-textarea"
          placeholder="Edit pesan..."
          rows="3"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelEdit">Batal</button>
          <button class="btn-primary" @click="saveEditMessage">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirmMessage"
      class="modal-overlay"
      @click="cancelDelete"
    >
      <div class="modal" @click.stop>
        <h3>Hapus Pesan?</h3>
        <p>Pesan ini akan dihapus dan tidak dapat dikembalikan.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete">Batal</button>
          <button class="btn-danger" @click="deleteMessage">Hapus</button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Popup - Teleported to body to avoid layout issues -->
    <!-- Image Lightbox Popup (White Theme) -->
    <Teleport to="body">
      <div
        v-if="lightboxImage"
        class="lightbox-container"
        @keydown.escape="closeImage"
        @keydown.left="prevImage"
        @keydown.right="nextImage"
        tabindex="0"
        ref="lightboxRef"
      >
        <!-- Top Bar -->
        <div class="lightbox-header" @click.stop>
          <div class="sender-info">
            <div class="sender-avatar">
              <div class="sender-initial">
                {{
                  (
                    (lightboxMessage?.senderId === currentUser?.id
                      ? currentUser?.name || currentUser?.email
                      : lightboxMessage?.sender?.name ||
                        lightboxMessage?.sender?.email ||
                        activeConversation?.participants?.find(
                          (p) => p.userId === lightboxMessage?.senderId
                        )?.name ||
                        activeConversation?.participants?.find(
                          (p) => p.userId === lightboxMessage?.senderId
                        )?.email ||
                        "?"
                    )
                      .split(/[@\s]/)
                      .filter(Boolean)[0]
                      ?.slice(0, 2) || "?"
                  ).toUpperCase()
                }}
              </div>
            </div>
            <div class="sender-text">
              <div class="sender-name">
                {{
                  lightboxMessage?.senderId === currentUser?.id
                    ? "Anda"
                    : lightboxMessage?.sender?.name ||
                      lightboxMessage?.sender?.email?.split("@")[0] ||
                      activeConversation?.participants?.find(
                        (p) => p.userId === lightboxMessage?.senderId
                      )?.name ||
                      activeConversation?.participants
                        ?.find((p) => p.userId === lightboxMessage?.senderId)
                        ?.email?.split("@")[0] ||
                      "Pengguna"
                }}
              </div>
              <div class="sender-date">
                {{
                  lightboxMessage
                    ? formatDateLocal(new Date(lightboxMessage.createdAt), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""
                }}
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button
              class="action-btn desktop-only"
              title="Zoom In"
              @click="zoomIn"
            >
              <Icon icon="mdi:magnify-plus-outline" />
            </button>
            <button
              class="action-btn desktop-only"
              title="Zoom Out"
              @click="zoomOut"
            >
              <Icon icon="mdi:magnify-minus-outline" />
            </button>
            <button class="action-btn" title="Balas" @click="replyToImage">
              <Icon icon="mdi:reply" />
            </button>
            <button
              class="action-btn"
              :class="{ starred: isImageStarred }"
              title="Tandai"
              @click="toggleStarImage"
            >
              <Icon :icon="isImageStarred ? 'mdi:star' : 'mdi:star-outline'" />
            </button>
            <button
              class="action-btn desktop-only"
              title="Teruskan"
              @click="forwardImage"
            >
              <Icon icon="mdi:share-outline" />
            </button>
            <a
              :href="getFileUrl(lightboxImage)"
              download
              class="action-btn"
              title="Unduh"
            >
              <Icon icon="mdi:download" />
            </a>
            <button
              class="action-btn close-btn"
              @click="closeImage"
              title="Tutup"
            >
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>

        <!-- Main Stage -->
        <div class="lightbox-stage" @click.stop>
          <button
            v-if="galleryImages.length > 1 && galleryIndex > 0"
            class="stage-nav nav-prev"
            @click.stop="prevImage"
          >
            <Icon icon="mdi:chevron-left" />
          </button>

          <!-- Horizontal Scroll Gallery -->
          <div
            ref="scrollGalleryRef"
            class="scroll-gallery"
            @scroll="onGalleryScroll"
          >
            <div
              v-for="(img, idx) in galleryImages"
              :key="img.id || idx"
              class="scroll-gallery-item"
            >
              <img
                :src="getFileUrl(img)"
                :alt="img.originalName"
                class="main-image"
              />
            </div>
          </div>

          <button
            v-if="
              galleryImages.length > 1 &&
              galleryIndex < galleryImages.length - 1
            "
            class="stage-nav nav-next"
            @click.stop="nextImage"
          >
            <Icon icon="mdi:chevron-right" />
          </button>
        </div>

        <!-- Bottom Thumbnails -->
        <div
          class="lightbox-thumbnails"
          v-if="galleryImages.length > 1"
          @click.stop
        >
          <div class="thumbnails-track">
            <div
              v-for="(img, idx) in galleryImages"
              :key="img.id || idx"
              :class="['thumbnail-item', { active: idx === galleryIndex }]"
              @click="scrollToImage(idx)"
            >
              <img :src="getFileUrl(img)" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Forward Image Dialog -->
    <Teleport to="body">
      <div
        v-if="showForwardDialog"
        class="forward-dialog-overlay"
        @click="cancelForward"
      >
        <div class="forward-dialog" @click.stop>
          <!-- Header -->
          <div class="forward-dialog-header">
            <button class="forward-close-btn" @click="cancelForward">
              <Icon icon="mdi:close" />
            </button>
            <h3>Teruskan pesan ke</h3>
          </div>

          <!-- Search -->
          <div class="forward-search-wrapper">
            <Icon icon="mdi:magnify" class="forward-search-icon" />
            <input
              v-model="forwardSearchQuery"
              type="text"
              placeholder="Cari nama atau nomor"
              class="forward-search-input"
            />
          </div>

          <!-- Conversation List -->
          <div class="forward-dialog-body">
            <p class="forward-section-label">Chat terbaru & Kontak</p>
            <div class="forward-conversation-list">
              <label
                v-for="item in filteredForwardList"
                :key="item.id"
                class="forward-conversation-item"
              >
                <input
                  type="checkbox"
                  :value="item.id"
                  v-model="selectedForwardIds"
                  class="forward-checkbox"
                />
                <div class="forward-conv-avatar">
                  {{ item.avatar }}
                </div>
                <div class="forward-conv-info">
                  <span class="forward-conv-name">{{ item.name }}</span>
                  <!-- Show members for group chats -->
                  <span
                    class="forward-conv-members"
                    v-if="
                      item.type === 'conversation' && item.data.type === 'group'
                    "
                  >
                    {{
                      item.data.participants
                        ?.map((p) => p.email?.split("@")[0])
                        .slice(0, 3)
                        .join(", ")
                    }}...
                  </span>
                  <!-- Identify as New Contact -->
                  <span
                    class="forward-conv-members"
                    v-if="item.type === 'user'"
                  >
                    Kontak Baru
                  </span>
                </div>
              </label>
            </div>
          </div>

          <!-- Footer with Preview & Caption -->
          <div
            v-if="selectedForwardIds.length > 0"
            class="forward-dialog-footer"
          >
            <div class="forward-preview">
              <img
                v-if="dialogPreviewImage"
                :src="getFileUrl(dialogPreviewImage)"
                class="forward-preview-img"
              />
            </div>
            <input
              v-model="forwardCaption"
              type="text"
              placeholder="Tambah pesan..."
              class="forward-caption-input"
              @keypress.enter="sendForward"
            />
            <button class="forward-send-btn" @click="sendForward">
              <Icon icon="mdi:send" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Global Floating Mobile Actions Menu (Fixed Position) -->
    <Teleport to="body">
      <div
        v-if="activeMessageActions.messageId && activeMessageActions.isFixed"
        class="floating-mobile-actions"
        :style="{
          top: activeMessageActions.topOffset + 'px',
        }"
        @click.stop
      >
        <div class="floating-actions-content">
          <button
            @click="
              withMessage(activeMessageActions.messageId, showEmojiPicker)
            "
            title="Reaction"
            class="action-btn-float"
          >
            <Icon icon="solar:emoji-funny-circle-line-duotone" />
          </button>
          <button
            @click="withMessage(activeMessageActions.messageId, replyToMessage)"
            title="Balas"
            class="action-btn-float"
          >
            <Icon icon="solar:reply-line-duotone" />
          </button>
          <button
            @click="
              withMessage(activeMessageActions.messageId, startForwardMessage)
            "
            title="Teruskan"
            class="action-btn-float"
          >
            <Icon icon="solar:forward-line-duotone" />
          </button>
          <template v-if="isMessageOwner(activeMessageActions.messageId)">
            <button
              @click="
                withMessage(activeMessageActions.messageId, startEditMessage)
              "
              title="Edit"
              class="action-btn-float edit-btn"
            >
              <Icon icon="solar:pen-2-line-duotone" />
            </button>
            <button
              @click="
                withMessage(
                  activeMessageActions.messageId,
                  confirmDeleteMessage
                )
              "
              title="Delete"
              class="action-btn-float delete-btn"
            >
              <Icon icon="solar:trash-bin-trash-line-duotone" />
            </button>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
  <!-- Group Info Panel (RESTORED) -->
  <Teleport to="body">
    <div
      v-if="showGroupInfo"
      class="group-info-overlay"
      @click.self="showGroupInfo = false"
    >
      <div class="group-info-panel">
        <div class="panel-header">
          <h3>Info Grup</h3>
          <button @click="showGroupInfo = false" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>

        <div class="panel-content">
          <!-- Group Header -->
          <div class="group-header-info">
            <div class="group-avatar-large relative-container">
              <img
                v-if="getConversationAvatar(activeConversation).includes('/')"
                :src="getConversationAvatar(activeConversation)"
                class="group-avatar-img"
              />
              <div v-else class="group-avatar-fallback">
                {{ getConversationAvatar(activeConversation) }}
              </div>

              <!-- Avatar Upload Button (Admin Only) -->
              <button
                v-if="currentUserIsAdmin"
                class="avatar-upload-btn"
                title="Ganti Foto Grup"
                @click="triggerAvatarUpload"
              >
                <Icon icon="solar:camera-add-line-duotone" />
              </button>
              <input
                type="file"
                ref="fileInputGroupAvatar"
                style="display: none"
                accept="image/*"
                @change="handleGroupAvatarSelect"
              />
            </div>

            <div v-if="editingGroupName" class="group-name-edit">
              <input
                v-model="editGroupNameValue"
                type="text"
                class="group-name-input"
                @keypress.enter="saveGroupName"
              />
              <button class="save-btn" @click="saveGroupName">
                <Icon icon="solar:check-circle-line-duotone" />
              </button>
              <button class="cancel-btn" @click="editingGroupName = false">
                <Icon icon="solar:close-circle-line-duotone" />
              </button>
            </div>
            <div v-else class="group-name-display">
              <h2>{{ activeConversation?.name }}</h2>
              <button
                v-if="currentUserIsAdmin"
                class="edit-name-btn"
                @click="startEditGroupName"
              >
                <Icon icon="solar:pen-new-square-line-duotone" />
              </button>
            </div>
            <span class="member-count">
              {{ activeConversation?.participants?.length }} anggota
            </span>
          </div>

          <!-- Admin Actions -->
          <div v-if="currentUserIsAdmin" class="admin-actions">
            <button
              class="control-btn"
              :class="{ active: isGroupLocked }"
              @click="toggleGroupLock"
            >
              <Icon
                :icon="
                  isGroupLocked
                    ? 'solar:lock-keyhole-line-duotone'
                    : 'solar:lock-keyhole-unlocked-line-duotone'
                "
              />
              <span>{{
                isGroupLocked ? "Buka Kunci Grup" : "Kunci Grup"
              }}</span>
            </button>
            <button class="control-btn" @click="showAddMemberModal = true">
              <Icon icon="solar:user-plus-line-duotone" />
              <span>Tambah Anggota</span>
            </button>
            <button class="control-btn danger" @click="confirmDeleteGroup">
              <Icon icon="solar:trash-bin-trash-line-duotone" />
              <span>Hapus Grup</span>
            </button>
          </div>

          <!-- Locked Indicator -->
          <div v-if="isGroupLocked" class="locked-indicator">
            <Icon icon="solar:lock-keyhole-line-duotone" />
            <span>Grup terkunci - Hanya admin yang dapat mengirim pesan</span>
          </div>

          <!-- Members List -->
          <div class="group-members-section">
            <h4>Anggota</h4>
            <div class="members-list">
              <div
                v-for="member in activeConversation?.participants"
                :key="member.userId"
                class="member-item"
              >
                <div class="member-avatar">
                  <img
                    v-if="getMemberPhotoUrl(member)"
                    :src="getMemberPhotoUrl(member)"
                    alt="Member"
                    style="
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                      border-radius: 50%;
                    "
                  />
                  <span v-else>{{ getMemberInitials(member) }}</span>
                </div>
                <div class="member-info">
                  <span class="member-name">{{ getMemberName(member) }}</span>
                  <span v-if="member.role === 'admin'" class="admin-badge"
                    >Admin</span
                  >
                  <span v-if="member.status === 'invited'" class="badge-invited"
                    >Diundang</span
                  >
                </div>
                <div
                  v-if="currentUserIsAdmin && member.userId !== currentUser?.id"
                  class="member-actions"
                >
                  <button
                    class="member-action-btn"
                    @click="toggleMemberRole(member)"
                    :title="
                      member.role === 'admin'
                        ? 'Jadikan Member'
                        : 'Jadikan Admin'
                    "
                  >
                    <Icon
                      :icon="
                        member.role === 'admin'
                          ? 'solar:user-id-line-duotone'
                          : 'solar:shield-user-line-duotone'
                      "
                    />
                  </button>
                  <button
                    class="member-action-btn danger"
                    @click="removeMember(member.userId)"
                    title="Keluarkan"
                  >
                    <Icon icon="solar:user-cross-line-duotone" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <button class="leave-group-btn" @click="confirmLeaveGroup">
              <Icon icon="solar:logout-2-line-duotone" />
              <span>Keluar dari Grup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Add Member Modal (RESTORED) -->
  <Teleport to="body">
    <div
      v-if="showAddMemberModal"
      class="add-member-overlay"
      @click.self="showAddMemberModal = false"
    >
      <div class="modal-content add-member-modal">
        <div class="modal-header">
          <h3>Tambah Anggota</h3>
          <button @click="showAddMemberModal = false" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="modal-body">
          <div class="search-box">
            <Icon icon="solar:magnifer-line-duotone" class="search-icon" />
            <input
              v-model="addMemberSearch"
              type="text"
              placeholder="Cari pengguna..."
              @input="searchUsersToAdd"
              class="search-input"
            />
          </div>
          <div class="add-member-results">
            <div
              v-for="user in addMemberResults"
              :key="user.id"
              class="add-member-item"
              @click="addMember(user.id)"
            >
              <div class="member-avatar">
                {{ user.email?.charAt(0).toUpperCase() }}
              </div>
              <span>{{ user.email }}</span>
              <Icon icon="solar:add-circle-line-duotone" class="add-icon" />
            </div>
            <p
              v-if="addMemberResults.length === 0 && addMemberSearch"
              class="no-results"
            >
              Tidak ada pengguna ditemukan
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Custom Alert Modal -->
  <Teleport to="body">
    <div
      v-if="showAlertModal"
      class="alert-overlay"
      @click.self="showAlertModal = false"
    >
      <div class="modal-content modal-alert">
        <div class="modal-header">
          <h3>Pemberitahuan</h3>
          <button @click="showAlertModal = false" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="modal-body p-4">
          <p>{{ alertMessage }}</p>
        </div>
        <div class="modal-actions" style="margin-top: 1rem">
          <button class="btn-primary" @click="showAlertModal = false">
            OK
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Custom Confirm Modal -->
  <Teleport to="body">
    <div
      v-if="showConfirmModal"
      class="confirm-overlay"
      @click.self="handleConfirm(false)"
    >
      <div class="modal-content modal-confirm">
        <div class="modal-header">
          <h3>Konfirmasi</h3>
          <button @click="handleConfirm(false)" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="modal-body p-4">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-actions" style="margin-top: 1rem">
          <button class="btn-cancel" @click="handleConfirm(false)">
            Batal
          </button>
          <button class="btn-primary" @click="handleConfirm(true)">Ya</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Notification Modal -->
  <Teleport to="body">
    <div
      v-if="showNotificationsModal"
      class="alert-overlay"
      style="z-index: 2500"
      @click.self="showNotificationsModal = false"
    >
      <div class="modal-content notification-modal">
        <div class="modal-header">
          <h3>Notifikasi</h3>
          <button @click="showNotificationsModal = false" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="modal-body p-0">
          <div v-if="notifications.length === 0" class="empty-state p-4">
            <p style="text-align: center; color: #64748b">
              Tidak ada notifikasi
            </p>
          </div>
          <div v-else class="notification-list">
            <div
              v-for="notif in notifications"
              :key="notif.id"
              :class="['notification-item', { unread: !notif.isRead }]"
              @click="!notif.isRead && markNotificationAsRead(notif.id)"
            >
              <div class="notif-icon">
                <Icon
                  v-if="notif.type === 'group_invite'"
                  icon="mdi:account-group-outline"
                />
                <Icon
                  v-else-if="notif.type === 'group_removed'"
                  icon="mdi:account-remove-outline"
                />
                <Icon v-else icon="mdi:bell-outline" />
              </div>
              <div class="notif-content">
                <p class="notif-title">{{ notif.title }}</p>
                <p class="notif-message">{{ notif.message }}</p>
                <span class="notif-time">{{
                  formatTime(notif.createdAt)
                }}</span>

                <div v-if="notif.type === 'group_invite'" class="notif-actions">
                  <button
                    class="btn-small btn-primary"
                    @click.stop="respondToInvitation(notif.id, 'accept')"
                  >
                    Terima
                  </button>
                  <button
                    class="btn-small btn-danger"
                    @click.stop="respondToInvitation(notif.id, 'reject')"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { chatApi, uploadApi, usersApi, utilsApi } from "../../services/api.js";
import wsClient from "../../services/websocket.js";

// Listen for profile updates
onMounted(() => {
  const unsubProfileUpdate = wsClient.on("user_profile_updated", (userData) => {
    // Update active conversation if participant exists
    if (activeConversation.value && activeConversation.value.participants) {
      const p = activeConversation.value.participants.find(
        (p) => p.userId === userData.id
      );
      if (p) {
        if (userData.photo) p.photo = userData.photo;
        if (userData.name) p.name = userData.name;
        // Force reactivity for deep changes if needed
        activeConversation.value = { ...activeConversation.value };
      }
    }

    // Update conversation list
    if (conversations.value) {
      conversations.value.forEach((conv) => {
        if (conv.participants) {
          const p = conv.participants.find((p) => p.userId === userData.id);
          if (p) {
            if (userData.photo) p.photo = userData.photo;
            if (userData.name) p.name = userData.name;
          }
        }
      });
      // Force refresh conversation list? usually deep watch handles it or key update
    }
  });

  const unsubConvUpdate = wsClient.on("conversation_updated", (data) => {
    if (
      activeConversation.value &&
      activeConversation.value.id === data.conversationId
    ) {
      if (data.isLocked !== undefined) {
        activeConversation.value.isLocked = data.isLocked;
      }
      if (data.name) activeConversation.value.name = data.name;
    }

    if (conversations.value) {
      const conv = conversations.value.find(
        (c) => c.id === data.conversationId
      );
      if (conv) {
        if (data.isLocked !== undefined) conv.isLocked = data.isLocked;
        if (data.name) conv.name = data.name;
      }
    }
  });

  onUnmounted(() => {
    if (unsubProfileUpdate) unsubProfileUpdate();
    if (unsubConvUpdate) unsubConvUpdate();
  });
});

// Tiptap Editor
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

// Custom directive for clicking outside logic
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function (event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
};

// ===================================
// NOTIFICATIONS LOGIC
// ===================================
const notifications = ref([]);
const showNotificationsModal = ref(false);

const unreadNotificationsCount = computed(() => {
  return notifications.value.filter((n) => !n.isRead).length;
});

const fetchNotifications = async () => {
  try {
    const response = await fetch(`${API_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      notifications.value = data.data;
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  }
};

const respondToInvitation = async (notificationId, action) => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/${notificationId}/respond`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ action }),
      }
    );
    const data = await response.json();
    if (data.success) {
      showAlert("Berhasil memproses undangan");
      fetchNotifications();
      if (action === "accept") {
        loadConversations();
      }
    } else {
      showAlert(data.message || "Gagal memproses undangan");
    }
  } catch (error) {
    console.error("Respond invitation error:", error);
    showAlert("Terjadi kesalahan");
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const notif = notifications.value.find((n) => n.id === notificationId);
    if (notif) notif.isRead = true;
  } catch (error) {
    console.error("Mark read error:", error);
  }
};

// ===================================
// STATE DEFINITIONS
// ===================================

const route = useRoute();

// State
const conversations = ref([]);
const activeConversation = ref(null);
const messages = ref([]);
const messageText = ref("");
const isSigned = ref(false);
const searchQuery = ref("");
const loadingMessages = ref(false);
const showNewChat = ref(false);
const newChatUserId = ref("");
const userSearchQuery = ref("");
const availableUsers = ref([]);
const currentUser = ref(null);
const onlineUsers = ref([]);
const typingUsers = ref([]);
const replyTo = ref(null);
const attachments = ref([]);
const emojiPickerMessage = ref(null);
const showFullEmojiPicker = ref(false);
const showAttachMenu = ref(false); // Widget menu attachment
const fileInput = ref(null); // Keep as generic fallback or legacy
const fileInputDoc = ref(null);
const fileInputMedia = ref(null);
const fileInputCamera = ref(null);

const fileInputAudio = ref(null);
const fileInputGroupAvatar = ref(null); // Avatar Upload Input
const selectedEmojiCategory = ref("😀 Smileys");
const emojiGridRef = ref(null);
const messageInputRef = ref(null);

// Group Info Panel State
const showGroupInfo = ref(false);
const editingGroupName = ref(false);
const editGroupNameValue = ref("");
const groupMembers = ref([]);
const isGroupAdmin = ref(false);
const isGroupLocked = ref(false);
const showAddMemberModal = ref(false);
const addMemberSearch = ref("");
const addMemberResults = ref([]);

// Alert & Confirm Modal State
const showAlertModal = ref(false);
const alertMessage = ref("");
const showConfirmModal = ref(false);
const confirmMessage = ref("");
const confirmCallback = ref(null);

// Helper functions for custom modals
function showAlert(message) {
  alertMessage.value = message;
  showAlertModal.value = true;
}

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.value = message;
    confirmCallback.value = resolve;
    showConfirmModal.value = true;
  });
}

function handleConfirm(result) {
  if (confirmCallback.value) {
    confirmCallback.value(result);
    // Don't nullify callback immediately if we want to handle it safely,
    // but typically it's fine.
    confirmCallback.value = null;
  }
  showConfirmModal.value = false;
  // If result is true, the promise resolves to true
}

// Computed: Chat Locked State
const isChatLocked = computed(() => {
  if (activeConversation.value?.type !== "group") return false;

  // Locked if:
  // 1. Conversation has isLocked=true
  // 2. Current user is NOT an admin
  const isLocked = activeConversation.value.isLocked;
  // Use existing isGroupAdmin ref if it's reliable, or re-compute
  // isGroupAdmin is updated in loadGroupInfo, but we need it always up to date.
  // Better to compute it here safely.
  const myRole = activeConversation.value.participants?.find(
    (p) => p.userId === currentUser.value?.id
  )?.role;

  return isLocked && myRole !== "admin";
});

// Tiptap Editor instance
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: "Ketik pesan...",
    }),
  ],
  content: "",
  editorProps: {
    // Handle paste: strip HTML styles but keep basic formatting
    handlePaste: (view, event) => {
      const text = event.clipboardData?.getData("text/plain");
      if (text) {
        // Insert plain text only (preserves WhatsApp format markers like *bold*)
        const { tr } = view.state;
        tr.insertText(text);
        view.dispatch(tr);
        return true; // Prevent default paste
      }
      return false;
    },
  },
  onUpdate: () => {
    syncMessageText();
    handleTyping();
    handleMessageInputChange();
  },
});

// Helper to generate safe ID for categories
const getCategoryId = (cat) => `cat-${cat.replace(/[\s\W]+/g, "_")}`;

// Scroll to specific category
const scrollToCategory = (category) => {
  // Update UI active state immediately
  selectedEmojiCategory.value = category;

  if (emojiGridRef.value) {
    const id = getCategoryId(category);
    const el = document.getElementById(id);
    if (el) {
      // Scroll grid to element position
      emojiGridRef.value.scrollTo({
        top: el.offsetTop,
        behavior: "smooth",
      });
    }
  }
};

// Helper to convert emoji to Apple CDN URL
const getAppleEmojiUrl = (emoji) => {
  const codePoints = [];
  for (const char of emoji) {
    codePoints.push(char.codePointAt(0).toString(16));
  }
  const hex = codePoints.join("-");
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.0/img/apple/64/${hex}.png`;
};

// Parse text and replace emojis with Apple images
const parseAppleEmojis = (text) => {
  if (!text) return "";
  // Match emojis using Unicode property escapes
  // Extended_Pictographic covers most emojis, but we filter out simple digits/text
  return text.replace(/\p{Extended_Pictographic}/gu, (match) => {
    // Use onerror to fallback to native emoji with same size styling
    return `<img src="${getAppleEmojiUrl(
      match
    )}" class="apple-emoji-text" loading="lazy" alt="${match}" onerror="this.outerHTML='<span class=\\'native-emoji-fallback\\'>${match}</span>';" />`;
  });
};

// Handle scroll event to update active category (ScrollSpy)
const handleEmojiScroll = (e) => {
  if (!emojiGridRef.value) return;

  const container = e.target;
  const scrollTop = container.scrollTop;
  const categoryElements = container.querySelectorAll(
    ".emoji-category-section"
  );

  // Find the active section based on scroll position - Range Check
  const triggerOffset = 50;

  for (const el of categoryElements) {
    const top = el.offsetTop;
    const height = el.offsetHeight;

    // Check if the trigger point is INSIDE this section
    if (
      scrollTop + triggerOffset >= top &&
      scrollTop + triggerOffset < top + height
    ) {
      const currentCat = el.getAttribute("data-category");
      if (currentCat && selectedEmojiCategory.value !== currentCat) {
        selectedEmojiCategory.value = currentCat;
      }
      break;
    }
  }
};

const showInputEmojiPicker = ref(false);
// Track which message's actions are showing and at what Y position
const activeMessageActions = ref({ messageId: null, topOffset: 0 });
const editingMessage = ref(null);
const editingContent = ref("");
const deleteConfirmMessage = ref(null);
const showMobileSidebar = ref(true);
const lightboxImage = ref(null); // For image popup/lightbox
const expandedMessages = ref(new Set()); // Track expanded long messages
const MESSAGE_TRUNCATE_LENGTH = 500; // Characters before truncating

// Link Preview state
const linkPreview = ref(null);
const linkPreviewLoading = ref(false);
const linkPreviewCache = ref(new Map()); // Cache previews to avoid re-fetching
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

const messagesContainer = ref(null);
const scrollGalleryRef = ref(null);

// Group chat state (new - does not affect existing functionality)
const showNewGroupChat = ref(false);
const newGroupName = ref("");
const selectedGroupMembers = ref([]);
const groupSearchQuery = ref("");
const loadingGroupMembers = ref(false);
const useInviteMode = ref(false); // true = kirim undangan, false = langsung masuk

// Quick reaction emojis
const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Extended emoji categories for full picker
// Attachment Menu Handler
function handleAttachment(type) {
  showAttachMenu.value = false;

  if (type === "signature") {
    isSigned.value = !isSigned.value;
    return;
  }

  // Use specific input for each type to ensure correct behavior (especially on mobile)
  nextTick(() => {
    switch (type) {
      case "media":
        if (fileInputMedia.value) fileInputMedia.value.click();
        break;
      case "doc":
        if (fileInputDoc.value) fileInputDoc.value.click();
        break;
      case "camera":
        if (fileInputCamera.value) fileInputCamera.value.click();
        break;
      case "audio":
        if (fileInputAudio.value) fileInputAudio.value.click();
        break;
      default:
        // Fallback
        if (fileInput.value) fileInput.value.click();
    }
  });
}

// Emoji picker (existing code)

const emojiCategories = {
  "😀 Smileys": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🤧",
    "🥵",
    "🥶",
    "🥴",
    "😵",
    "🤯",
    "🤠",
    "🥳",
    "🥸",
    "😎",
    "🤓",
    "🧐",
    "😕",
    "😟",
    "🙁",
    "😮",
    "😯",
    "😲",
    "😳",
    "🥺",
    "😦",
    "😧",
    "😨",
    "😰",
    "😥",
    "😢",
    "😭",
    "😱",
    "😖",
    "😣",
    "😞",
    "😓",
    "😩",
    "😫",
    "🥱",
    "😤",
    "😡",
    "😠",
    "🤬",
    "😈",
    "👿",
    "💀",
    "☠️",
    "💩",
    "🤡",
    "👹",
    "👺",
    "👻",
    "👽",
    "👾",
    "🤖",
  ],
  "❤️ Hearts": [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
  ],
  "👋 Gestures": [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "💪",
  ],
  "🎉 Activities": [
    "🎉",
    "🎊",
    "🎈",
    "🎂",
    "🎁",
    "🎄",
    "🎃",
    "🔥",
    "✨",
    "🌟",
    "⭐",
    "💫",
    "🎯",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "⚽",
    "🏀",
    "🎮",
    "🎲",
    "🎵",
    "🎶",
    "🎤",
    "🎧",
    "🎬",
    "📸",
    "📷",
  ],
  "🐶 Animals": [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🙈",
    "🙉",
    "🙊",
    "🐔",
    "🐧",
    "🐦",
    "🦅",
    "🦆",
    "🦉",
    "🐴",
    "🦄",
    "🐝",
    "🐛",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🦗",
    "🕷️",
  ],
  "🍔 Food": [
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🫐",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🍆",
    "🥑",
    "🥦",
    "🥬",
    "🌽",
    "🥕",
    "🧄",
    "🧅",
    "🥔",
    "🍠",
    "🥐",
    "🍞",
    "🥖",
    "🥨",
    "🧀",
    "🥚",
    "🍳",
    "🧈",
    "🥞",
    "🧇",
    "🥓",
    "🥩",
    "🍗",
    "🍖",
    "🦴",
    "🌭",
    "🍔",
    "🍟",
    "🍕",
    "🌮",
    "🌯",
    "🥙",
    "🧆",
    "🥚",
    "🍜",
    "🍝",
    "🍛",
    "🍣",
    "🍱",
    "🥟",
    "🦐",
    "🦞",
    "🦀",
    "🦑",
    "🦪",
    "🍦",
    "🍧",
    "🍨",
    "🍩",
    "🍪",
    "🎂",
    "🍰",
    "🧁",
    "🥧",
    "🍫",
    "🍬",
    "🍭",
    "🍮",
    "🍯",
    "☕",
    "🍵",
    "🧃",
    "🥛",
    "🍺",
    "🍻",
    "🥂",
    "🍷",
  ],
  "📦 Objects": [
    "📱",
    "💻",
    "🖥️",
    "🖨️",
    "⌨️",
    "🖱️",
    "💾",
    "💿",
    "📀",
    "📷",
    "📸",
    "📹",
    "🎥",
    "📞",
    "☎️",
    "📺",
    "📻",
    "🎙️",
    "🎚️",
    "🎛️",
    "⏱️",
    "⏲️",
    "⏰",
    "🕰️",
    "📡",
    "🔋",
    "🔌",
    "💡",
    "🔦",
    "🕯️",
    "🪔",
    "🧯",
    "💸",
    "💵",
    "💴",
    "💶",
    "💷",
    "💰",
    "💳",
    "💎",
    "⚖️",
    "🧰",
    "🔧",
    "🔨",
    "⚒️",
    "🛠️",
    "⛏️",
    "🔩",
    "⚙️",
    "🗜️",
    "⚗️",
    "🔬",
    "🔭",
    "📡",
  ],
};

// Computed
const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value;
  const query = searchQuery.value.toLowerCase();
  return conversations.value.filter((conv) => {
    const name = getConversationName(conv).toLowerCase();
    return name.includes(query);
  });
});

const canSend = computed(() => {
  return messageText.value.trim() || attachments.value.length > 0;
});

// Filter available users by search query (exclude current user)
const filteredAvailableUsers = computed(() => {
  let users = availableUsers.value.filter(
    (u) => u.id !== currentUser.value?.id
  );
  if (!userSearchQuery.value) return users;
  const query = userSearchQuery.value.toLowerCase();
  return users.filter((user) => {
    const name = (user.name || "").toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(query) || email.includes(query);
  });
});

// Methods

// Group Lock & Admin Logic

const currentUserIsAdmin = computed(() => {
  if (!currentUser.value || !activeConversation.value) return false;

  // Check participants list
  if (activeConversation.value.participants) {
    const me = activeConversation.value.participants.find(
      (p) => String(p.userId) === String(currentUser.value.id)
    );
    return me?.role === "admin";
  }
  return false;
});

function isMessageOwn(message) {
  if (!currentUser.value || !message) return false;
  return String(message.senderId) == String(currentUser.value.id);
}

function getMemberPhotoUrl(member) {
  if (!member.photo) return null;
  if (member.photo.startsWith("uploads/")) {
    return `${API_URL}/api/${member.photo}`;
  }
  return member.photo.startsWith("http")
    ? member.photo
    : `${API_URL}${member.photo.startsWith("/") ? "" : "/"}${member.photo}`;
}

function getMemberName(member) {
  if (member.name) return member.name;
  if (member.email) return member.email.split("@")[0];
  return "User";
}

function getMemberInitials(member) {
  const name = getMemberName(member);
  const parts = name.split(/[@\s._-]/).filter(Boolean);
  if (parts.length >= 1) return parts[0].slice(0, 2).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function getConversationName(conv) {
  if (conv.type === "group") return conv.name || "Grup";

  // Find the other participant (not current user)
  const currentUserId = currentUser.value?.id;
  const other = conv.participants?.find((p) => {
    const participantId = p.userId || p.id;
    return String(participantId) !== String(currentUserId);
  });

  // If other participant found, return their name
  if (other) {
    if (other.name) return other.name;
    if (other.email) {
      const namePart = other.email.split("@")[0];
      // Capitalize first letter of each word
      return namePart
        .split(/[._-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }

  // Fallback: If participants are missing (e.g. temp chat or sync issue),
  // use the conversation name if available.
  if (conv.name) return conv.name;

  return "Pengguna";
}

function getConversationAvatar(conv) {
  if (conv.avatarUrl) {
    if (conv.avatarUrl.startsWith("uploads/")) {
      return `${API_URL}/api/${conv.avatarUrl}`;
    }
    return conv.avatarUrl.startsWith("http")
      ? conv.avatarUrl
      : `${API_URL}${conv.avatarUrl.startsWith("/") ? "" : "/"}${
          conv.avatarUrl
        }`;
  }

  // Personal chat: try to get other participant's photo
  if (conv.type !== "group" && conv.participants) {
    const currentUserId = currentUser.value?.id;
    const other = conv.participants.find((p) => {
      const participantId = p.userId || p.id;
      return String(participantId) !== String(currentUserId);
    });
    if (other?.photo) {
      if (other.photo.startsWith("uploads/")) {
        return `${API_URL}/api/${other.photo}`;
      }
      return other.photo.startsWith("http")
        ? other.photo
        : `${API_URL}${other.photo.startsWith("/") ? "" : "/"}${other.photo}`;
    }
  }

  const name = getConversationName(conv);
  // Get first 2 characters like Sidebar does
  const parts = name.split(/[@\s._-]/).filter(Boolean);
  if (parts.length >= 1) return parts[0].slice(0, 2).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function getPreviewText(conv) {
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

// Helper to format time (database already stores Jakarta time)
function formatTimeLocal(date, options = {}) {
  return date.toLocaleTimeString("id-ID", {
    ...options,
  });
}

function formatDateLocal(date, options = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    ...options,
  });
}

function formatTime(dateStr) {
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

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  return formatTimeLocal(new Date(dateStr), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper functions for image attachments
function getImageAttachments(message) {
  const attachments = getMessageAttachments(message);
  return attachments.filter((att) => att.fileType === "image");
}

function getNonImageAttachments(message) {
  const attachments = getMessageAttachments(message);
  return attachments.filter((att) => att.fileType !== "image");
}

// Image gallery/lightbox functions
const galleryImages = ref([]);
const galleryIndex = ref(0);
const lightboxMessage = ref(null);

function openImageGallery(message, index) {
  galleryImages.value = getImageAttachments(message);
  galleryIndex.value = index;
  lightboxImage.value = galleryImages.value[index];
  lightboxMessage.value = message;

  // Scroll to the selected image after DOM updates
  nextTick(() => {
    if (scrollGalleryRef.value) {
      const itemWidth = scrollGalleryRef.value.offsetWidth;
      scrollGalleryRef.value.scrollTo({
        left: index * itemWidth,
        behavior: "instant", // No animation for initial position
      });
    }
  });
}

function openImage(attachment) {
  galleryImages.value = [attachment];
  galleryIndex.value = 0;
  lightboxImage.value = attachment;
}

function closeImage() {
  lightboxImage.value = null;
  lightboxMessage.value = null;
  galleryImages.value = [];
  galleryIndex.value = 0;
  zoomLevel.value = 1; // Reset zoom
}

// Lightbox action buttons
const zoomLevel = ref(1);

// Load starred from localStorage
const loadStarredFromStorage = () => {
  try {
    const stored = localStorage.getItem("starredImages");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};
const starredImages = ref(loadStarredFromStorage());

const isImageStarred = computed(() => {
  if (!lightboxImage.value) return false;
  return starredImages.value.has(
    lightboxImage.value.id || lightboxImage.value.fileName
  );
});

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3);
  applyZoom();
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.5);
  applyZoom();
}

function applyZoom() {
  const images = document.querySelectorAll(".scroll-gallery-item .main-image");
  images.forEach((img) => {
    img.style.transform = `scale(${zoomLevel.value})`;
    img.style.transition = "transform 0.2s ease";
  });
}

function replyToImage() {
  if (!lightboxMessage.value) return;

  // Set reply to the message containing this image
  replyTo.value = lightboxMessage.value;
  closeImage();

  // Focus on input
  nextTick(() => {
    const textarea = document.querySelector(".message-input");
    if (textarea) textarea.focus();
  });
}

function toggleStarImage() {
  if (!lightboxImage.value) return;
  const imageId = lightboxImage.value.id || lightboxImage.value.fileName;

  const newSet = new Set(starredImages.value);
  if (newSet.has(imageId)) {
    newSet.delete(imageId);
  } else {
    newSet.add(imageId);
  }
  starredImages.value = newSet;

  // Save to localStorage for persistence
  localStorage.setItem("starredImages", JSON.stringify([...newSet]));
}

// Forward dialog state
const showForwardDialog = ref(false);
const forwardingImage = ref(null);
const forwardSearchQuery = ref("");
const selectedForwardIds = ref([]); // Changed from selectedForwardConvIds
const forwardCaption = ref("");
const forwardUsers = ref([]);

// Start forwarding any message (from message actions)
const forwardingMessage = ref(null);

const dialogPreviewImage = computed(() => {
  if (forwardingImage.value) return forwardingImage.value;
  if (forwardingMessage.value?.attachments) {
    return forwardingMessage.value.attachments.find((a) =>
      a.mimeType?.startsWith("image/")
    );
  }
  return null;
});

const filteredForwardList = computed(() => {
  const query = forwardSearchQuery.value.toLowerCase().trim();
  const result = [];

  // Add existing conversations first
  const existingConvs = conversations.value.filter(
    (c) => c.id !== activeConversation.value?.id
  );

  // Map conversations to unified format
  existingConvs.forEach((conv) => {
    if (query && !getConversationName(conv).toLowerCase().includes(query))
      return;
    result.push({
      id: `c_${conv.id}`,
      originalId: conv.id,
      type: "conversation",
      name: getConversationName(conv),
      avatar: getConversationAvatar(conv), // helper returns int/char
      data: conv,
    });
  });

  // If we have a query, also search in all users
  if (query && forwardUsers.value.length > 0) {
    const existingUserIds = new Set();

    // Collect user IDs already in private conversations
    conversations.value.forEach((conv) => {
      if (conv.type === "private" && conv.participants) {
        conv.participants.forEach((p) => {
          if (p.id !== currentUser.value?.id) {
            existingUserIds.add(p.id);
          }
        });
      }
    });

    forwardUsers.value.forEach((user) => {
      // Skip current user
      if (user.id === currentUser.value?.id) return;

      // Skip if user already has a conversation (already added above)
      if (existingUserIds.has(user.id)) return;

      const name = user.name || user.email;
      if (name.toLowerCase().includes(query)) {
        result.push({
          id: `u_${user.id}`,
          originalId: user.id,
          type: "user",
          name: name,
          avatar: name.charAt(0).toUpperCase(),
          data: user,
        });
      }
    });
  }

  return result;
});

async function loadForwardUsers() {
  if (forwardUsers.value.length > 0) return; // Already loaded
  try {
    const res = await usersApi.getAll();
    if (res.success || Array.isArray(res)) {
      forwardUsers.value = res.data || res;
    }
  } catch (e) {
    console.error("Failed to load users for forward", e);
  }
}

function forwardImage() {
  if (!lightboxImage.value || !lightboxMessage.value) return;
  loadForwardUsers();
  forwardingMessage.value = lightboxMessage.value;
  forwardingImage.value = lightboxImage.value;
  forwardSearchQuery.value = "";
  selectedForwardIds.value = [];
  forwardCaption.value = "";
  showForwardDialog.value = true;
  closeImage();
}

function startForwardMessage(message) {
  loadForwardUsers();
  forwardingMessage.value = message;
  forwardingImage.value = null; // Don't restrict, forward full message
  forwardSearchQuery.value = "";
  selectedForwardIds.value = [];
  forwardCaption.value = "";
  showForwardDialog.value = true;
}

async function sendForward() {
  if (!forwardingMessage.value || selectedForwardIds.value.length === 0) return;

  try {
    const targetConversationIds = [];
    const targetUserIds = [];

    // Parse selected IDs
    selectedForwardIds.value.forEach((id) => {
      if (id.startsWith("c_")) {
        targetConversationIds.push(parseInt(id.substring(2)));
      } else if (id.startsWith("u_")) {
        targetUserIds.push(parseInt(id.substring(2)));
      }
    });

    const payload = {
      messageId: forwardingMessage.value.id,
      targetConversationIds:
        targetConversationIds.length > 0 ? targetConversationIds : undefined,
      targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
      caption: forwardCaption.value || undefined,
    };

    // If forwarding specific image (from lightbox), allow passing attachmentId
    // But currently backend needs updated validator to accept attachmentId
    // Assuming backend is updated:
    if (forwardingImage.value) {
      payload.attachmentId = forwardingImage.value.id;
    }

    // Use backend API to forward message with attachments
    const result = await chatApi.forwardMessage(payload);

    if (!result.success) {
      throw new Error(result.message || "Failed to forward");
    }

    // Close dialog and reset state
    showForwardDialog.value = false;
    forwardingMessage.value = null;
    forwardingImage.value = null;
    selectedForwardIds.value = [];
    forwardCaption.value = "";

    // Reload conversations to get updated lastMessageAt
    await loadConversations();

    // Switch to first forwarded conversation if multiple
    if (result.data && result.data.length > 0) {
      const targetConvId = result.data[0].conversationId;
      const targetConv = conversations.value.find((c) => c.id === targetConvId);
      if (targetConv) {
        selectConversation(targetConv);
      }
    }
  } catch (e) {
    console.error("Failed to forward message:", e);
    showAlert("Gagal meneruskan pesan: " + (e.message || "Unknown error"));
  }
}

function cancelForward() {
  showForwardDialog.value = false;
  forwardingMessage.value = null;
  forwardingImage.value = null;
  selectedForwardIds.value = [];
  forwardCaption.value = "";
}

// ============================================
// GROUP CHAT FUNCTIONS (NEW - Does not affect existing functionality)
// ============================================

// Computed: Filter users for group member selection
const filteredGroupUsers = computed(() => {
  const query = groupSearchQuery.value.toLowerCase().trim();
  return availableUsers.value.filter((user) => {
    // Exclude current user
    if (user.id === currentUser.value?.id) return false;
    // Filter by search query
    if (query) {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    }
    return true;
  });
});

// Check if a user is selected as group member
function isGroupMemberSelected(user) {
  return selectedGroupMembers.value.some((m) => m.id === user.id);
}

// Toggle user selection for group
function toggleGroupMember(user) {
  const index = selectedGroupMembers.value.findIndex((m) => m.id === user.id);
  if (index >= 0) {
    selectedGroupMembers.value.splice(index, 1);
  } else {
    selectedGroupMembers.value.push(user);
  }
}

// Create new group
async function createNewGroup() {
  if (!newGroupName.value.trim() || selectedGroupMembers.value.length < 1)
    return;

  try {
    const participantIds = selectedGroupMembers.value.map((m) => m.id);

    const res = await chatApi.createConversation({
      type: "group",
      name: newGroupName.value.trim(),
      participantIds,
      inviteMode: useInviteMode.value ? "invite" : "direct",
    });

    if (res.success && res.data) {
      // Reload conversations to show the new group
      await loadConversations();

      // Find and select the new conversation
      const newConv = conversations.value.find((c) => c.id === res.data.id);
      if (newConv) {
        selectConversation(newConv);
      }

      // Reset and close modal
      showNewGroupChat.value = false;
      newGroupName.value = "";
      selectedGroupMembers.value = [];
      groupSearchQuery.value = "";
      useInviteMode.value = false;
    } else {
      showAlert("Gagal membuat grup: " + (res.message || "Unknown error"));
    }
  } catch (e) {
    console.error("Failed to create group:", e);
    showAlert("Gagal membuat grup: " + (e.message || "Unknown error"));
  }
}

// Handle message tap to show actions at tap position (for mobile)
// Handle message tap to show actions at tap position (for mobile)
function handleMessageTap(event, messageId) {
  // Get tap position relative to the message element
  const messageEl = event.currentTarget;
  const rect = messageEl.getBoundingClientRect();

  // Robustly find Y coordinate (handling click vs touch events)
  let clientY = event.clientY;
  if (!clientY && event.changedTouches && event.changedTouches.length > 0) {
    clientY = event.changedTouches[0].clientY;
  }
  if (!clientY && event.touches && event.touches.length > 0) {
    clientY = event.touches[0].clientY;
  }
  // Fallback to center if coordinate missing
  if (!clientY) {
    clientY = rect.top + rect.height / 2;
  }

  const tapY = clientY;
  const relativeY = tapY - rect.top;

  // Offset by -50px so it appears ABOVE the finger
  // (Buttons are ~32px high + padding)

  // Use global client coordinates for fixed positioning on mobile
  const fixedTop = clientY - 50;

  // Toggle: if already showing for this message, hide it
  if (activeMessageActions.value.messageId === messageId) {
    activeMessageActions.value = {
      messageId: null,
      topOffset: 0,
      leftOffset: 0,
      isFixed: false,
    };
  } else {
    // Check if we are on mobile (window width < 1024)
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      activeMessageActions.value = {
        messageId,
        topOffset: fixedTop,
        leftOffset: 0, // Ignored, centered via CSS
        isFixed: true,
      };
    } else {
      // On desktop/tablet, rely on hover storage or relative
      activeMessageActions.value = {
        messageId,
        topOffset: 0,
        leftOffset: 0,
        isFixed: false,
      };
    }
  }
}

// Hide message actions when clicking elsewhere
function hideMessageActions() {
  activeMessageActions.value = {
    messageId: null,
    topOffset: 0,
    leftOffset: 0,
    isFixed: false,
  };
}

// Helpers for floating menu
const withMessage = (messageId, fn) => {
  const msg = messages.value.find((m) => m.id === messageId);
  if (msg) {
    fn(msg);
  }
  // Close menu after action
  hideMessageActions();
};

const isMessageOwner = (messageId) => {
  const msg = messages.value.find((m) => m.id === messageId);
  return msg && msg.senderId === currentUser.value?.id;
};

// ============================================
// END GROUP CHAT FUNCTIONS
// ============================================

function nextImage() {
  if (galleryIndex.value < galleryImages.value.length - 1) {
    scrollToImage(galleryIndex.value + 1);
  }
}

function prevImage() {
  if (galleryIndex.value > 0) {
    scrollToImage(galleryIndex.value - 1);
  }
}

function scrollToImage(index) {
  if (!scrollGalleryRef.value) return;
  galleryIndex.value = index;
  lightboxImage.value = galleryImages.value[index];

  const gallery = scrollGalleryRef.value;
  const itemWidth = gallery.offsetWidth;
  gallery.scrollTo({
    left: index * itemWidth,
    behavior: "smooth",
  });
}

// Debounced scroll handler for gallery
let scrollTimeout = null;
function onGalleryScroll() {
  // Debounce to only update index after scrolling stops
  if (scrollTimeout) clearTimeout(scrollTimeout);

  scrollTimeout = setTimeout(() => {
    if (!scrollGalleryRef.value) return;
    const gallery = scrollGalleryRef.value;
    const itemWidth = gallery.offsetWidth;
    const scrollLeft = gallery.scrollLeft;
    const newIndex = Math.round(scrollLeft / itemWidth);

    if (
      newIndex !== galleryIndex.value &&
      newIndex >= 0 &&
      newIndex < galleryImages.value.length
    ) {
      galleryIndex.value = newIndex;
      lightboxImage.value = galleryImages.value[newIndex];
    }
  }, 100); // Wait 100ms after scroll stops
}

// WhatsApp-style text formatting parser
function formatWhatsAppText(text) {
  if (!text) return "";

  // Process lines individually to handle blockquotes
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    // Check if line starts with > (blockquote)
    const trimmedLine = line.trim();
    const isBlockquote = trimmedLine.startsWith(">");

    if (isBlockquote) {
      const content = line.trim().substring(1).trim();
      // Escape content, then wrap in blockquote
      const escapedContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<span class="wa-blockquote">${escapedContent}</span>`;
    } else {
      // Escape normally
      return line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  });

  let formatted = processedLines.join("<br>");

  // Convert WhatsApp formatting to HTML
  // Bold: *text* -> <strong>text</strong>
  formatted = formatted.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");

  // Italic: _text_ -> <em>text</em>
  formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Strikethrough: ~text~ -> <del>text</del>
  formatted = formatted.replace(/~([^~]+)~/g, "<del>$1</del>");

  // Code: `text` -> <code>text</code>
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bullet list: - item at start of line
  formatted = formatted.replace(
    /^- (.+)$/gm,
    '<span class="wa-list-item">• $1</span>'
  );
  formatted = formatted.replace(/<br>- /g, '<br><span class="wa-list-item">• ');

  // Numbered list: 1. item at start of line
  formatted = formatted.replace(
    /^(\d+)\. (.+)$/gm,
    '<span class="wa-list-item">$1. $2</span>'
  );
  formatted = formatted.replace(
    /<br>(\d+)\. /g,
    '<br><span class="wa-list-item">$1. '
  );

  // Convert URLs to clickable links (after escaping, so we use escaped URL pattern)
  const urlLinkPattern = /https?:\/\/[^\s<>"]+/gi;
  formatted = formatted.replace(urlLinkPattern, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener" class="message-link">${url}</a>`;
  });

  return formatted;
}

// Message truncation helpers
function isMessageLong(message) {
  return message.content && message.content.length > MESSAGE_TRUNCATE_LENGTH;
}

function isMessageExpanded(messageId) {
  return expandedMessages.value.has(messageId);
}

function toggleMessageExpand(messageId) {
  if (expandedMessages.value.has(messageId)) {
    expandedMessages.value.delete(messageId);
  } else {
    expandedMessages.value.add(messageId);
  }
  // Trigger reactivity
  expandedMessages.value = new Set(expandedMessages.value);
}

function getDisplayContent(message) {
  if (!message.content) return "";
  if (isMessageExpanded(message.id) || !isMessageLong(message)) {
    return parseAppleEmojis(formatWhatsAppText(message.content));
  }
  // Truncate and add ellipsis
  const truncated =
    message.content.substring(0, MESSAGE_TRUNCATE_LENGTH) + "...";
  return parseAppleEmojis(formatWhatsAppText(truncated));
}

// Link Preview functions
function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  return matches || [];
}

let linkPreviewTimeout = null;
async function fetchLinkPreview(url) {
  if (!url) {
    linkPreview.value = null;
    return;
  }

  // Check cache first
  if (linkPreviewCache.value.has(url)) {
    linkPreview.value = linkPreviewCache.value.get(url);
    return;
  }

  linkPreviewLoading.value = true;
  try {
    const response = await utilsApi.getLinkPreview(url);
    if (response.success && response.data) {
      linkPreview.value = response.data;
      linkPreviewCache.value.set(url, response.data);
    }
  } catch (error) {
    console.error("[Chat] Failed to fetch link preview:", error);
    linkPreview.value = null;
  } finally {
    linkPreviewLoading.value = false;
  }
}

function clearLinkPreview() {
  linkPreview.value = null;
}

// Message-specific link preview cache (keyed by message ID)
const messageLinkPreviews = ref(new Map());

// Get link preview for a message (auto-fetches if not cached)
function getMessageLinkPreview(message) {
  if (!message.content) return null;
  const urls = extractUrls(message.content);
  if (urls.length === 0) return null;

  const url = urls[0];

  // Check message-specific cache
  if (messageLinkPreviews.value.has(message.id)) {
    return messageLinkPreviews.value.get(message.id);
  }

  // Check global URL cache
  if (linkPreviewCache.value.has(url)) {
    const preview = linkPreviewCache.value.get(url);
    messageLinkPreviews.value.set(message.id, preview);
    return preview;
  }

  // Trigger fetch (don't block render)
  fetchMessageLinkPreview(message.id, url);
  return null;
}

// Fetch preview for a specific message
async function fetchMessageLinkPreview(messageId, url) {
  if (messageLinkPreviews.value.has(messageId)) return;

  // Mark as fetching (to prevent duplicate fetches)
  messageLinkPreviews.value.set(messageId, "loading");

  try {
    const response = await utilsApi.getLinkPreview(url);
    if (response.success && response.data) {
      linkPreviewCache.value.set(url, response.data);
      messageLinkPreviews.value.set(messageId, response.data);
      // Trigger reactivity
      messageLinkPreviews.value = new Map(messageLinkPreviews.value);
    } else {
      messageLinkPreviews.value.delete(messageId);
    }
  } catch (error) {
    console.error("[Chat] Failed to fetch message link preview:", error);
    messageLinkPreviews.value.delete(messageId);
  }
}

// Check if message has a URL
function messageHasUrl(message) {
  if (!message.content) return false;
  return extractUrls(message.content).length > 0;
}

// Get first URL from message
function getMessageUrl(message) {
  if (!message.content) return null;
  const urls = extractUrls(message.content);
  return urls.length > 0 ? urls[0] : null;
}

// Watch for URL in message input and auto-fetch preview
function handleMessageInputChange() {
  if (linkPreviewTimeout) {
    clearTimeout(linkPreviewTimeout);
  }

  const urls = extractUrls(messageText.value);
  if (urls.length > 0) {
    // Debounce the preview fetch
    linkPreviewTimeout = setTimeout(() => {
      fetchLinkPreview(urls[0]);
    }, 500);
  } else {
    linkPreview.value = null;
  }
}
function getOnlineStatus() {
  if (!activeConversation.value) return "";
  const other = activeConversation.value.participants?.find(
    (p) => String(p.userId) !== String(currentUser.value?.id)
  );
  if (other) {
    // Check if ID exists in onlineUsers array safely (handle string/number mismatch)
    const isOnline = onlineUsers.value.some(
      (id) => String(id) === String(other.userId)
    );
    return isOnline ? "Online" : "Offline";
  }
  return "Offline";
}

// Helper to get attachments from message (handles both property names)
function getMessageAttachments(message) {
  // Check for attachments (from REST API or WebSocket broadcast)
  if (message.attachments && message.attachments.length > 0) {
    return message.attachments;
  }
  // Fallback to attachmentFiles (from client-side before normalization)
  if (message.attachmentFiles && message.attachmentFiles.length > 0) {
    return message.attachmentFiles;
  }
  return [];
}

function getFileUrl(att) {
  if (!att) return "";
  // If attachment has url property and it's a full URL, use it
  if (att.url && att.url.startsWith("http")) {
    return att.url;
  }
  // Otherwise use uploadApi to construct URL
  return uploadApi.getFileUrl(att.fileType, att.fileName);
}

// Select user for new conversation
function selectUser(user) {
  newChatUserId.value = user.id;
}

async function selectConversation(conv) {
  // Clean up previous temp conversation if switching away
  if (
    activeConversation.value &&
    activeConversation.value.isTemp &&
    activeConversation.value.id !== conv.id
  ) {
    conversations.value = conversations.value.filter(
      (c) => c.id !== activeConversation.value.id
    );
  }

  activeConversation.value = conv;
  messages.value = [];
  loadingMessages.value = true;

  // On mobile, switch to chat view (hide sidebar)
  showMobileSidebar.value = false;

  // Clear unread count immediately in UI
  conv.unreadCount = 0;

  // If temp conversation, don't fetch messages
  if (conv.isTemp) {
    loadingMessages.value = false;
    return;
  }

  try {
    const res = await chatApi.getMessages(conv.id);
    messages.value = res.data || [];

    // Mark as read via REST API and WebSocket
    if (messages.value.length > 0) {
      const lastMsg = messages.value[messages.value.length - 1];
      // Use REST API for reliability
      await chatApi.markAsRead(conv.id, lastMsg.id);
      // Also send via WebSocket for realtime sync
      wsClient.sendRead(conv.id, lastMsg.id);

      // Notify TopBar to sync notification badge
      window.dispatchEvent(new CustomEvent("chat-messages-read"));
    }

    await nextTick();
    scrollToBottom();
  } catch (e) {
    console.error("Failed to load messages:", e);
  } finally {
    loadingMessages.value = false;
  }
}

const showScrollBottomBtn = ref(false);

function handleScroll() {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // Show button if we are more than 300px away from the bottom
  // Using Math.abs to handle potential floating point differences
  const distance = Math.abs(scrollHeight - clientHeight - scrollTop);
  showScrollBottomBtn.value = distance > 300;
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    showScrollBottomBtn.value = false;
  }
}

async function sendMessage() {
  if (!canSend.value || !activeConversation.value) return;

  // Handle temporary conversation persistence
  if (
    activeConversation.value.isTemp ||
    activeConversation.value.id.toString().startsWith("new_")
  ) {
    try {
      const res = await chatApi.createConversation({
        type: "private",
        participantIds: [activeConversation.value.tempUserId],
      });

      // Update local conversation with real one
      const realConv = res.data;
      const tempIndex = conversations.value.findIndex(
        (c) => c.id === activeConversation.value.id
      );

      // Robust merge: if backend returns incomplete data (e.g. missing participants),
      // preserve the local participants/name which are already correct.
      if (!realConv.participants || realConv.participants.length === 0) {
        console.warn(
          "Backend returned incomplete conversation, preserving local participants"
        );
        realConv.participants = activeConversation.value.participants;
        // Also preserve name/avatar if they are missing in realConv but present locally
        if (!realConv.name) realConv.name = activeConversation.value.name;
        if (!realConv.avatarUrl)
          realConv.avatarUrl = activeConversation.value.avatarUrl;
      }

      if (tempIndex !== -1) {
        conversations.value[tempIndex] = realConv;
      }

      // Update active conversation reference
      activeConversation.value = realConv;
      messages.value = []; // Reset messages (should be empty anyway)
    } catch (e) {
      console.error("Failed to create real conversation:", e);
      return; // Stop sending if creation failed
    }
  }

  // Handle temporary conversation persistence
  // ... (previous logic)

  const content = messageText.value.trim();
  const uploadedFiles = [];

  // Upload attachments first and collect file info
  for (const att of attachments.value) {
    try {
      const res = await uploadApi.upload(att.file);
      if (res.success && res.data) {
        uploadedFiles.push(res.data); // Contains fileName, fileType, filePath, etc.
      }
    } catch (e) {
      console.error("Upload failed:", e);
    }
  }

  // Determine message type
  let messageType = "text";
  if (uploadedFiles.length > 0 && !content) {
    const firstFile = uploadedFiles[0];
    messageType = firstFile.fileType || "document";
  } else if (uploadedFiles.length > 0) {
    messageType = "mixed";
  }

  // Send via WebSocket with file info
  // At this point activeConversation.value.id is REAL
  wsClient.sendMessage(activeConversation.value.id, content, {
    messageType,
    replyToId: replyTo.value?.id,
    attachmentFiles: uploadedFiles, // Pass file info instead of IDs
    isSigned: isSigned.value,
  });

  // Clear input
  messageText.value = "";
  if (editor.value) {
    editor.value.commands.clearContent();
  }
  attachments.value = [];
  replyTo.value = null;
  linkPreview.value = null;
  showInputEmojiPicker.value = false; // Close keyboard/emoji picker
  // Don't reset isSigned to allow continuous signing if desired
  // isSigned.value = false;
}

let typingTimeout = null;
function handleTyping() {
  if (
    !activeConversation.value ||
    activeConversation.value.isTemp ||
    activeConversation.value.id.toString().startsWith("new_")
  )
    return;

  wsClient.sendTyping(activeConversation.value.id, true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    wsClient.sendTyping(activeConversation.value.id, false);
  }, 2000);
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  files.forEach((file) => {
    const item = { file, preview: null };
    if (file.type.startsWith("image/")) {
      item.preview = URL.createObjectURL(file);
    }
    attachments.value.push(item);
  });
  e.target.value = "";
}

function removeAttachment(index) {
  const att = attachments.value[index];
  if (att.preview) URL.revokeObjectURL(att.preview);
  attachments.value.splice(index, 1);
}

function replyToMessage(msg) {
  replyTo.value = msg;
}

function showEmojiPicker(msg) {
  emojiPickerMessage.value = msg;
}

// Check if message is near the top of container (first 3 messages)
function isMessageNearTop(messageId) {
  const index = messages.value.findIndex((m) => m.id === messageId);
  return index >= 0 && index < 3;
}

function addReaction(messageId, emoji) {
  const msg = messages.value.find((m) => m.id === messageId);
  // Don't allow reactions on deleted messages
  if (msg?.isDeleted) {
    emojiPickerMessage.value = null;
    return;
  }

  // Remove existing reaction from this user first (replace behavior)
  if (msg?.reactions) {
    for (const existingEmoji of Object.keys(msg.reactions)) {
      const users = msg.reactions[existingEmoji] || [];
      if (users.some((u) => u.userId === currentUser.value?.id)) {
        // Found existing reaction from this user, remove it
        wsClient.sendReaction(messageId, existingEmoji, "remove");
        break;
      }
    }
  }

  // Add new reaction
  wsClient.sendReaction(messageId, emoji, "add");
  emojiPickerMessage.value = null;
}

// Full emoji picker functions
function openFullEmojiPicker() {
  showFullEmojiPicker.value = true;
}

function closeFullEmojiPicker() {
  showFullEmojiPicker.value = false;
  showInputEmojiPicker.value = false;
  emojiPickerMessage.value = null;
}

function addReactionFromFullPicker(emoji) {
  // Check if this is for message input or for reaction
  if (showInputEmojiPicker.value) {
    insertEmojiToInput(emoji);
    return;
  }
  if (emojiPickerMessage.value) {
    addReaction(emojiPickerMessage.value.id, emoji);
  }
  closeFullEmojiPicker();
}

// Input emoji picker functions
function toggleInputEmojiPicker() {
  showInputEmojiPicker.value = !showInputEmojiPicker.value;
  // showFullEmojiPicker.value = showInputEmojiPicker.value; // Decoupled
  emojiPickerMessage.value = null; // Clear reaction picker state
}

function insertEmojiToInput(emoji) {
  if (!editor.value) return;

  // Focus the editor and insert emoji at cursor
  editor.value.chain().focus().insertContent(emoji).run();
  // Don't close picker - allow multiple emoji insertions
}

// Sync is now handled by Tiptap onUpdate callback
// Convert Tiptap HTML to WhatsApp-style markdown
function syncMessageText() {
  if (!editor.value) return;

  // Get HTML and convert to WhatsApp markdown
  let html = editor.value.getHTML();

  // Process nested tags iteratively (innermost first)
  let prevHtml;
  do {
    prevHtml = html;

    // Convert HTML tags to WhatsApp markdown (innermost tags first)
    // <strong> or <b> -> *text*
    html = html.replace(/<strong>([^<]*)<\/strong>/gi, "*$1*");
    html = html.replace(/<b>([^<]*)<\/b>/gi, "*$1*");

    // <em> or <i> -> _text_
    html = html.replace(/<em>([^<]*)<\/em>/gi, "_$1_");
    html = html.replace(/<i>([^<]*)<\/i>/gi, "_$1_");

    // <s> or <strike> or <del> -> ~text~
    html = html.replace(/<s>([^<]*)<\/s>/gi, "~$1~");
    html = html.replace(/<strike>([^<]*)<\/strike>/gi, "~$1~");
    html = html.replace(/<del>([^<]*)<\/del>/gi, "~$1~");

    // <code> -> `text`
    html = html.replace(/<code>([^<]*)<\/code>/gi, "`$1`");
  } while (html !== prevHtml);

  // Handle blockquote -> > text (handles multi-line blockquotes)
  html = html.replace(
    /<blockquote>([\s\S]*?)<\/blockquote>/gi,
    (match, content) => {
      // Process each paragraph inside blockquote
      return content
        .replace(/<p>([^<]*)<\/p>/gi, "> $1\n")
        .replace(/<br\s*\/?>/gi, "\n> ");
    }
  );

  // Handle bullet lists -> - item
  html = html.replace(/<ul>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content
      .replace(/<li><p>([^<]*)<\/p><\/li>/gi, "- $1\n")
      .replace(/<li>([^<]*)<\/li>/gi, "- $1\n");
  });

  // Handle ordered lists -> 1. item
  let listCounter = 0;
  html = html.replace(/<ol>([\s\S]*?)<\/ol>/gi, (match, content) => {
    listCounter = 0;
    return content
      .replace(
        /<li><p>([^<]*)<\/p><\/li>/gi,
        (m, text) => `${++listCounter}. ${text}\n`
      )
      .replace(
        /<li>([^<]*)<\/li>/gi,
        (m, text) => `${++listCounter}. ${text}\n`
      );
  });

  // Remove remaining HTML tags
  html = html.replace(/<p>/gi, "");
  html = html.replace(/<\/p>/gi, "\n");
  html = html.replace(/<br\s*\/?>/gi, "\n");
  html = html.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  html = html.replace(/&amp;/g, "&");
  html = html.replace(/&lt;/g, "<");
  html = html.replace(/&gt;/g, ">");
  html = html.replace(/&quot;/g, '"');
  html = html.replace(/&#039;/g, "'");
  html = html.replace(/&nbsp;/g, " ");

  // Trim trailing newlines
  messageText.value = html.trim();
}

// Handle input changes - handled by Tiptap onUpdate
function handleInputChange() {
  syncMessageText();
  handleTyping();
  handleMessageInputChange();
}

// Toggle quote by manually inserting/removing > at start of current line
function toggleQuote() {
  if (!editor.value) return;

  // Get current selection position
  const { from } = editor.value.state.selection;
  const { $from } = editor.value.state.selection;

  // Get the text content of current paragraph
  const node = $from.parent;
  const text = node.textContent || "";

  // Calculate the start of current paragraph by subtracting textOffset from cursor
  // textOffset is the position within the current text node
  const paragraphContentStart = from - $from.textOffset;

  if (text.startsWith("> ")) {
    // Remove the > prefix
    editor.value
      .chain()
      .focus()
      .setTextSelection({
        from: paragraphContentStart,
        to: paragraphContentStart + 2,
      })
      .deleteSelection()
      .run();
  } else {
    // Insert > at start of paragraph
    editor.value
      .chain()
      .focus()
      .setTextSelection(paragraphContentStart)
      .insertContent("> ")
      .run();
  }
}

// Handle editor keydown: Enter behavior depends on context
function handleEditorKeydown(e) {
  if (e.key === "Enter") {
    if (e.altKey || e.shiftKey) {
      // Alt+Enter or Shift+Enter: allow Tiptap to handle new line
      return;
    }

    // Check if we're inside a list - allow Enter to continue list
    if (editor.value) {
      const isInList =
        editor.value.isActive("bulletList") ||
        editor.value.isActive("orderedList");

      if (isInList) {
        // Allow Tiptap to handle Enter (continue list)
        return;
      }
    }

    // Not in list: send message
    e.preventDefault();
    sendMessage();
  }
}

// Handle paste - Tiptap handles paste automatically with proper formatting
function handlePaste(e) {
  // Tiptap handles paste natively, no custom handling needed
}

// Remove last character - Tiptap handles backspace automatically
function handleBackspace() {
  // Tiptap handles backspace natively
  // This function is kept for emoji keyboard backspace button
  if (!editor.value) return;
  editor.value.commands.deleteRange({
    from: editor.value.state.selection.from - 1,
    to: editor.value.state.selection.from,
  });
}

function handleBackgroundClick() {
  hideMessageActions();
  showInputEmojiPicker.value = false;
}

// ============================================
// GROUP MANAGEMENT FUNCTIONS
// ============================================

// Load group info and open panel
function loadGroupInfo() {
  if (!activeConversation.value || activeConversation.value.type !== "group")
    return;

  // Check if current user is admin
  const currentParticipant = activeConversation.value.participants?.find(
    (p) => String(p.userId) === String(currentUser.value?.id)
  );

  isGroupAdmin.value = currentParticipant?.role === "admin";
  isGroupLocked.value = activeConversation.value.isLocked || false;
  editGroupNameValue.value = activeConversation.value.name || "";
  showGroupInfo.value = true;
}

// Avatar Management
function triggerAvatarUpload() {
  fileInputGroupAvatar.value?.click();
}

async function handleGroupAvatarSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  // 1. Upload file
  const formData = new FormData();
  formData.append("file", file);

  try {
    const uploadResponse = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errData.message || "Upload failed");
    }

    const uploadResult = await uploadResponse.json();
    const avatarUrl = uploadResult.data.url;

    // 2. Update Group Avatar URL
    const updateResponse = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarUrl }),
      }
    );

    if (updateResponse.ok) {
      activeConversation.value.avatarUrl = avatarUrl;
    }
  } catch (error) {
    console.error("Avatar update error:", error);
    alert(`Gagal mengupdate foto grup: ${error.message}`);
  } finally {
    if (fileInputGroupAvatar.value) fileInputGroupAvatar.value.value = "";
  }
}

// Load group info and open panel

// Start editing group name
function startEditGroupName() {
  editGroupNameValue.value = activeConversation.value?.name || "";
  editingGroupName.value = true;
}

// Save group name
async function saveGroupName() {
  if (!activeConversation.value || !editGroupNameValue.value.trim()) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editGroupNameValue.value.trim() }),
      }
    );

    if (response.ok) {
      activeConversation.value.name = editGroupNameValue.value.trim();
      editingGroupName.value = false;
    }
  } catch (error) {
    console.error("Save group name error:", error);
  }
}

// Toggle group lock
async function toggleGroupLock() {
  if (!activeConversation.value) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLocked: !isGroupLocked.value }),
      }
    );

    if (response.ok) {
      isGroupLocked.value = !isGroupLocked.value;
      activeConversation.value.isLocked = isGroupLocked.value;
    }
  } catch (error) {
    console.error("Toggle lock error:", error);
  }
}

// Search users to add as members
async function searchUsersToAdd() {
  if (!addMemberSearch.value.trim()) {
    addMemberResults.value = [];
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/users?search=${encodeURIComponent(
        addMemberSearch.value
      )}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Filter out users already in the group
      const existingIds =
        activeConversation.value?.participants?.map((p) => p.userId) || [];
      addMemberResults.value = (data.data || []).filter(
        (u) => !existingIds.includes(u.id)
      );
    }
  } catch (error) {
    console.error("Search users error:", error);
  }
}

// Add member to group
async function addMember(userId) {
  if (!activeConversation.value) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: [userId] }),
      }
    );

    if (response.ok) {
      // Refresh conversation to get updated participants
      await refreshConversation();
      addMemberSearch.value = "";
      addMemberResults.value = [];
      showAddMemberModal.value = false;
    }
  } catch (error) {
    console.error("Add member error:", error);
  }
}

// Remove member from group
async function removeMember(userId) {
  if (!activeConversation.value) return;
  const confirmed = await showConfirm("Keluarkan anggota ini dari grup?");
  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}/participants/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      await refreshConversation();
    }
  } catch (error) {
    console.error("Remove member error:", error);
  }
}

// Toggle member role (admin/member)
async function toggleMemberRole(member) {
  if (!activeConversation.value) return;

  const newRole = member.role === "admin" ? "member" : "admin";

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}/members/${member.userId}/role`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      }
    );

    if (response.ok) {
      member.role = newRole;
    }
  } catch (error) {
    console.error("Toggle role error:", error);
  }
}

// Confirm leave group
async function confirmLeaveGroup() {
  if (!activeConversation.value) return;
  const confirmed = await showConfirm("Keluar dari grup ini?");
  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}/leave`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      showGroupInfo.value = false;
      activeConversation.value = null;
      await loadConversations();
    }
  } catch (error) {
    console.error("Leave group error:", error);
  }
}

// Confirm delete group
async function confirmDeleteGroup() {
  if (!activeConversation.value) return;
  const confirmed = await showConfirm(
    "Hapus grup ini? Semua pesan akan hilang."
  );
  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      showGroupInfo.value = false;
      activeConversation.value = null;
      await loadConversations();
    }
  } catch (error) {
    console.error("Delete group error:", error);
  }
}

// Refresh current conversation data
async function refreshConversation() {
  if (!activeConversation.value) return;

  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${activeConversation.value.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      activeConversation.value = { ...activeConversation.value, ...data.data };
    }
  } catch (error) {
    console.error("Refresh conversation error:", error);
  }
}

// Edit/Delete message functions
function startEditMessage(msg) {
  editingMessage.value = msg;
  editingContent.value = msg.content || "";
}

function cancelEdit() {
  editingMessage.value = null;
  editingContent.value = "";
}

async function saveEditMessage() {
  if (!editingMessage.value || !editingContent.value.trim()) return;

  try {
    const res = await chatApi.editMessage(
      editingMessage.value.id,
      editingContent.value.trim()
    );
    if (res.success) {
      // Update message in local state
      const msgIndex = messages.value.findIndex(
        (m) => m.id === editingMessage.value.id
      );
      if (msgIndex !== -1) {
        messages.value[msgIndex].content = editingContent.value.trim();
        messages.value[msgIndex].isEdited = true;
      }
    }
  } catch (e) {
    console.error("Edit message failed:", e);
  } finally {
    cancelEdit();
  }
}

function confirmDeleteMessage(msg) {
  deleteConfirmMessage.value = msg;
}

function cancelDelete() {
  deleteConfirmMessage.value = null;
}

async function deleteMessage() {
  if (!deleteConfirmMessage.value) return;

  try {
    const res = await chatApi.deleteMessage(deleteConfirmMessage.value.id);
    if (res.success) {
      // Remove message from local state or mark as deleted
      const msgIndex = messages.value.findIndex(
        (m) => m.id === deleteConfirmMessage.value.id
      );
      if (msgIndex !== -1) {
        messages.value[msgIndex].isDeleted = true;
        messages.value[msgIndex].content = "Pesan ini telah dihapus";
        messages.value[msgIndex].reactions = {}; // Clear reactions for deleted message
      }
    }
  } catch (e) {
    console.error("Delete message failed:", e);
  } finally {
    cancelDelete();
  }
}

function toggleReaction(messageId, emoji) {
  const msg = messages.value.find((m) => m.id === messageId);
  // Don't allow reactions on deleted messages
  if (msg?.isDeleted) return;
  const users = msg?.reactions?.[emoji] || [];
  const hasOwn = users.some((u) => u.userId === currentUser.value?.id);
  wsClient.sendReaction(messageId, emoji, hasOwn ? "remove" : "add");
}

async function createNewConversation() {
  if (!newChatUserId.value) return;

  const user = availableUsers.value.find(
    (u) => u.id === parseInt(newChatUserId.value)
  );
  if (!user) return;

  // Check if conversation already exists
  const existingConv = conversations.value.find((c) => {
    if (c.type !== "private") return false;
    const other = c.participants?.find(
      (p) => p.userId !== currentUser.value?.id
    );
    return other?.userId === user.id;
  });

  if (existingConv) {
    selectConversation(existingConv);
    showNewChat.value = false;
    newChatUserId.value = "";
    return;
  }

  // Create temporary conversation locally
  const tempConv = {
    id: `new_${Date.now()}`,
    type: "private",
    name: user.name,
    avatarUrl: user.avatarUrl,
    participants: [
      {
        userId: currentUser.value.id,
        name: currentUser.value.name,
        email: currentUser.value.email,
      },
      {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemp: true,
    tempUserId: user.id,
  };

  conversations.value.unshift(tempConv);
  selectConversation(tempConv);
  showNewChat.value = false;
  newChatUserId.value = "";
}

async function loadConversations() {
  try {
    const res = await chatApi.getConversations();
    conversations.value = res.data || [];
  } catch (e) {
    console.error("Failed to load conversations:", e);
  }
}

async function loadAvailableUsers() {
  try {
    const res = await usersApi.getAll();
    availableUsers.value = res.data || [];
  } catch (e) {
    console.error("Failed to load users:", e);
  }
}

const notificationSound = new Audio("/sounds/notification.mp3");
notificationSound.preload = "auto";
notificationSound.volume = 0.5;

// Initialize audio on first user interaction to bypass autoplay restrictions
let audioInitialized = false;
function initializeAudio() {
  if (!audioInitialized) {
    notificationSound
      .play()
      .then(() => {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        audioInitialized = true;
      })
      .catch(() => {
        // Audio not yet initialized (waiting for user interaction)
      });
  }
}
// Try to init on first click/keypress
document.addEventListener("click", initializeAudio, { once: true });
document.addEventListener("keydown", initializeAudio, { once: true });

function setupWebSocketListeners() {
  wsClient.on("new_message", (data) => {
    // Check if conversation exists in our list
    const existingConv = conversations.value.find(
      (c) => c.id === data.conversationId
    );

    // Play notification sound if message is not from me
    if (data.senderId !== currentUser.value?.id) {
      // Reset and play
      notificationSound.currentTime = 0;
      notificationSound
        .play()
        .catch((e) => console.error("Error playing sound:", e));
    }

    if (activeConversation.value?.id === data.conversationId) {
      // Active conversation - add message and mark as read
      messages.value.push(data);
      nextTick(scrollToBottom);
      wsClient.sendRead(data.conversationId, data.id);
    } else if (existingConv) {
      // Non-active conversation - increment unread count locally
      existingConv.unreadCount = (existingConv.unreadCount || 0) + 1;
      // Update last message preview
      existingConv.lastMessage = data;
      existingConv.lastMessageAt = data.createdAt;
    }

    // If conversation doesn't exist in our list, reload to get it
    if (!existingConv) {
      loadConversations();
    } else {
      // Just re-sort conversations to move updated one to top
      conversations.value.sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return new Date(bTime) - new Date(aTime);
      });
    }
  });

  // Handle new conversation created by another user
  wsClient.on("new_conversation", (data) => {
    // Reload conversation list to show the new conversation
    loadConversations();
  });

  wsClient.on("user_typing", (data) => {
    if (activeConversation.value?.id === data.conversationId) {
      if (data.isTyping && !typingUsers.value.includes(data.userEmail)) {
        typingUsers.value.push(data.userEmail);
      } else if (!data.isTyping) {
        typingUsers.value = typingUsers.value.filter(
          (u) => u !== data.userEmail
        );
      }
    }
  });

  wsClient.on("reaction_added", (data) => {
    const msg = messages.value.find((m) => m.id === data.messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[data.emoji]) msg.reactions[data.emoji] = [];
      msg.reactions[data.emoji].push({
        userId: data.userId,
        userEmail: data.userEmail,
      });
    }
  });

  wsClient.on("reaction_removed", (data) => {
    const msg = messages.value.find((m) => m.id === data.messageId);
    if (msg?.reactions?.[data.emoji]) {
      msg.reactions[data.emoji] = msg.reactions[data.emoji].filter(
        (u) => u.userId !== data.userId
      );
      if (msg.reactions[data.emoji].length === 0)
        delete msg.reactions[data.emoji];
    }
  });

  wsClient.on("online_users", (data) => {
    onlineUsers.value = (data.users || []).map((id) => Number(id));
  });

  wsClient.on("user_online", (data) => {
    const userId = Number(data.userId);
    if (!onlineUsers.value.includes(userId)) {
      onlineUsers.value.push(userId);
    }
  });

  wsClient.on("user_offline", (data) => {
    const userId = Number(data.userId);
    onlineUsers.value = onlineUsers.value.filter((id) => id !== userId);
  });

  // Listen for connected event to request online users
  wsClient.on("connected", () => {
    wsClient.send("get_online_users", {});
  });

  // If already connected, request online users immediately
  if (wsClient.isConnected) {
    wsClient.send("get_online_users", {});
  }

  // Handle message deletion (real-time update for other users)
  wsClient.on("message_deleted", (data) => {
    if (activeConversation.value?.id === data.conversationId) {
      const msgIndex = messages.value.findIndex((m) => m.id === data.messageId);
      if (msgIndex !== -1) {
        messages.value[msgIndex].isDeleted = true;
        messages.value[msgIndex].content = "";
        messages.value[msgIndex].attachments = [];
        messages.value[msgIndex].reactions = {}; // Clear reactions for deleted message
      }
    }
  });

  // Handle new notifications
  wsClient.on("new_notification", (data) => {
    notifications.value.unshift(data.data);

    // Play sound
    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => {});
  });

  // Handle group updates (kick, join, role change)
  wsClient.on("group_updated", (data) => {
    // Handle both { data: {...} } and direct payload
    const payload = data?.data || data;
    if (!payload) return;

    // Reload conversation list to reflect changes
    loadConversations();

    // If we are currently viewing this conversation
    if (activeConversation.value?.id === payload.conversationId) {
      // Refresh details
      refreshConversation();

      // If member left (and it is me)
      if (
        payload.type === "member_left" &&
        payload.userId === currentUser.value?.id
      ) {
        activeConversation.value = null;
        showGroupInfo.value = false;
        showMobileSidebar.value = true;
        showAlert("Anda telah dikeluarkan dari grup");
      }
    }
  });
}

// Lifecycle
onMounted(async () => {
  // Load current user from API for accurate ID
  try {
    const { authApi } = await import("../../services/api.js");
    const res = await authApi.getCurrentUser();
    if (res?.data) {
      currentUser.value = res.data;
      // Also update localStorage for consistency
      localStorage.setItem("user", JSON.stringify(res.data));
    }
  } catch (e) {
    // Fallback to localStorage
    const userData = localStorage.getItem("user");
    if (userData) currentUser.value = JSON.parse(userData);
  }

  const token = localStorage.getItem("token");
  if (token) {
    wsClient.connect(token);
    setupWebSocketListeners();
  }

  await loadConversations();
  await loadAvailableUsers();
  await fetchNotifications();

  // Check for deep link to specific conversation via ?conv= query param
  const convId = route.query.conv;
  if (convId) {
    const targetConv = conversations.value.find(
      (c) => c.id === parseInt(convId)
    );
    if (targetConv) {
      selectConversation(targetConv);
    }
  }
});

// Watch for route query changes (when already on chat page)
watch(
  () => route.query,
  async (newQuery) => {
    const convId = newQuery.conv;
    if (convId && conversations.value.length > 0) {
      const targetConv = conversations.value.find(
        (c) => c.id === parseInt(convId)
      );
      if (targetConv && targetConv.id !== activeConversation.value?.id) {
        selectConversation(targetConv);
      }
    }
  },
  { deep: true }
);

onUnmounted(() => {
  clearTimeout(typingTimeout);
  attachments.value.forEach((att) => {
    if (att.preview) URL.revokeObjectURL(att.preview);
  });
});
</script>

<style scoped>
/* ============================================
   LIGHT THEME CHAT STYLES - Responsive Design
   ============================================ */

.chat-container {
  display: flex;
  height: calc(100vh - 5rem - 2rem);
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* ============================================
   SIDEBAR STYLES
   ============================================ */
.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  background: white;
  flex-shrink: 0;
  transition: transform 0.3s ease, width 0.3s ease;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.new-chat-btn {
  padding: 0.5rem;
  border-radius: 50%;
  background: #602515;
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-btn:hover {
  background: #7e3c2f;
}

/* Header buttons container */
.header-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Group creation modal styles */
.group-name-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.group-icon {
  font-size: 2rem;
  color: #602515;
}

.group-name-input {
  flex: 1;
  border: none;
  border-bottom: 2px solid #602515;
  padding: 0.5rem;
  font-size: 1rem;
  background: transparent;
}

.group-name-input:focus {
  outline: none;
}

.group-name-input::placeholder {
  color: #94a3b8;
}

.selected-members-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.selected-label {
  font-size: 0.875rem;
  color: #64748b;
}

.selected-avatars {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.more-count {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 0.25rem;
}

.user-item.selected {
  background: #fef3c7;
}

.search-box {
  position: relative;
  padding: 0.75rem 1rem;
}

.search-icon {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  color: #1e293b;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #602515;
  background: white;
}

.search-input::placeholder {
  color: #94a3b8;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.conversation-item:hover {
  background: #fef3c7;
}

/* Only apply hover on devices with mouse pointer (not touch) */
@media (hover: none) {
  .conversation-item:hover {
    background: transparent;
  }
}

.conversation-item.active {
  background: #fcd34d;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  font-size: 1rem;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.conv-name {
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.conv-time {
  font-size: 0.75rem;
  color: #64748b;
  flex-shrink: 0;
}

.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-text {
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  background: #602515;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  font-weight: 500;
}

/* ============================================
   MAIN CHAT AREA
   ============================================ */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  min-width: 0;
  position: relative;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.header-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Mobile Back Button */
.back-btn {
  display: none;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  color: #602515;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
}

.header-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.typing-indicator {
  font-size: 0.75rem;
  color: #f8ae19;
  font-style: italic;
}

.online-status {
  font-size: 0.75rem;
  color: #64748b;
}

.online-status.online {
  color: #22c55e;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #602515;
}

/* ============================================
   MESSAGES AREA
   ============================================ */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f1f5f9;
}

.message {
  display: flex;
  gap: 0.5rem;
  max-width: 70%;
  position: relative;
}

.message.own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  max-width: 100%;
}

.message.own .message-content {
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  border: none;
}

/* Group sender name in messages */
.group-sender-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #602515;
  margin-bottom: 0.25rem;
  text-transform: capitalize;
}

.message.own .message-content .message-text {
  color: white;
}

.message.own .message-content .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-text {
  color: #1e293b;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: anywhere;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.message-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.message-time {
  font-size: 0.7rem;
  color: #94a3b8;
}

.edited-label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-style: italic;
}

.message.own .edited-label {
  color: rgba(255, 255, 255, 0.6);
}

/* Reply preview */
.reply-preview {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid #f8ae19;
  background: rgba(248, 174, 25, 0.1);
  border-radius: 4px;
  font-size: 0.8rem;
}

.reply-author {
  color: #602515;
  display: block;
  font-weight: 500;
}

.reply-text {
  color: #64748b;
}

.message.own .reply-preview {
  background: rgba(255, 255, 255, 0.1);
  border-left-color: rgba(255, 255, 255, 0.5);
}

.message.own .reply-author {
  color: rgba(255, 255, 255, 0.9);
}

.message.own .reply-text {
  color: rgba(255, 255, 255, 0.7);
}

/* Attachments */
.message-attachments {
  margin-bottom: 0.5rem;
}

.attachment-image {
  max-width: 200px;
  border-radius: 8px;
  cursor: pointer;
}

.attachment-video video,
.attachment-audio audio {
  max-width: 250px;
}

/* Reactions */
.reactions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.reaction {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.reaction.own {
  border-color: #602515;
  background: #fef3c7;
}

.reaction:hover {
  background: #fcd34d;
}

/* Message actions */
.message-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
  align-items: center;
}

.message:hover .message-actions {
  opacity: 1;
}

.message-actions button,
.action-btn-sm {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
}

.message-actions button:hover,
.action-btn-sm:hover {
  background: #f1f5f9;
  color: #602515;
  border-color: #602515;
}

/* ============================================
   CHAT INPUT AREA
   ============================================ */
.chat-input {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.reply-indicator {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 3px solid #f8ae19;
}

.reply-content span {
  color: #602515;
  font-size: 0.75rem;
  font-weight: 500;
}

.reply-content p {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.reply-indicator button {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
}

.reply-indicator button:hover {
  color: #602515;
}

.attachments-preview {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  overflow-x: auto;
  background: #f8fafc;
  border-radius: 8px;
}

.preview-item {
  position: relative;
  padding: 0.25rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.preview-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.preview-name {
  font-size: 0.75rem;
  color: #1e293b;
  padding: 0.5rem;
}

.preview-item button {
  position: absolute;
  top: -4px;
  right: -4px;
  padding: 0.125rem;
  background: #ef4444;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.attach-btn {
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.attach-btn:hover {
  background: #f1f5f9;
  color: #602515;
}

.input-wrapper {
  flex: 1;
}

.input-wrapper textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #1e293b;
  resize: none;
  max-height: 120px;
  font-size: 0.875rem;
}

.input-wrapper textarea:focus {
  outline: none;
  border-color: #602515;
  background: white;
}

.input-wrapper textarea::placeholder {
  color: #94a3b8;
}

/* Contenteditable message input - Tiptap Editor */
.message-input-editable {
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  border-radius: 0 0 24px 24px;
  border: 1px solid #e2e8f0;
  border-top: none;
  background: #f8fafc;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Tiptap editor content area */
.message-input-editable :deep(.ProseMirror) {
  padding: 0.75rem 1rem;
  min-height: 40px;
  max-height: 100px;
  color: #1e293b;
  font-size: 0.875rem;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  outline: none;
}

.message-input-editable :deep(.ProseMirror:focus) {
  outline: none;
}

.message-input-editable:focus-within {
  border-color: #602515;
  background: white;
}

/* Tiptap placeholder */
.message-input-editable
  :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #94a3b8;
  pointer-events: none;
  float: left;
  height: 0;
}

/* Tiptap list styling in editor */
.message-input-editable :deep(.ProseMirror ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0.25rem 0;
}

.message-input-editable :deep(.ProseMirror ol) {
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 0.25rem 0;
}

.message-input-editable :deep(.ProseMirror li) {
  margin: 0.125rem 0;
}

.message-input-editable :deep(.ProseMirror li p) {
  margin: 0;
}

/* Tiptap blockquote styling in editor */
.message-input-editable :deep(.ProseMirror blockquote) {
  border-left: 3px solid #602515;
  padding-left: 0.75rem;
  margin: 0.25rem 0;
  color: #64748b;
  font-style: italic;
}

/* Formatting Toolbar */
.format-toolbar {
  display: flex;
  gap: 2px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  background: #f8fafc;
  border-radius: 24px 24px 0 0;
  overflow-x: auto;
  flex-shrink: 0;
}

.format-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
}

.format-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.format-btn.active {
  background: #602515;
  color: white;
}

/* Mobile responsive format toolbar */
@media (max-width: 480px) {
  .format-toolbar {
    gap: 1px;
    padding: 3px 6px;
  }

  .format-btn {
    width: 24px;
    height: 24px;
    min-width: 24px;
    font-size: 0.875rem;
  }
}

.send-btn {
  padding: 0.75rem;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}

.send-btn:hover {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Emoji button in input area */
.emoji-input-btn {
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  font-size: 1.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-input-btn:hover {
  background: #f1f5f9;
  color: #602515;
}

/* ============================================
   MODAL STYLES
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-weight: 600;
}

/* New Chat Modal specific styles */
.new-chat-modal {
  width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.user-search-box {
  position: relative;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.user-search-box .search-icon {
  position: absolute;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.user-search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.875rem;
  color: #1e293b;
}

.user-search-input:focus {
  outline: none;
  border-color: #602515;
  background: white;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding: 0.5rem 0;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:hover {
  background: #f8fafc;
}

.user-item.selected {
  background: #fef3c7;
}

.user-item .user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-icon {
  color: #602515;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.no-users {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.no-users p {
  margin: 0;
}

.new-chat-modal .modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Invite Mode Checkbox */
.invite-mode-option {
  padding: 0.75rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.invite-mode-option .checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #475569;
}

.invite-mode-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #602515;
  cursor: pointer;
}

.invite-mode-option .checkbox-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.invite-mode-option .checkbox-icon {
  color: #602515;
  font-size: 1rem;
}

.modal p {
  color: #64748b;
  margin-bottom: 1rem;
}

.user-select {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #1e293b;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.user-select:focus {
  outline: none;
  border-color: #602515;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* ============================================
   CENTERED REACTION MODAL
   ============================================ */
.reaction-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.reaction-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 320px;
  overflow: hidden;
}

.reaction-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.reaction-modal-header span {
  font-weight: 600;
  color: #1e293b;
}

.reaction-modal-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reaction-modal-close:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.reaction-emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 1.25rem;
}

.reaction-emoji-btn {
  width: 100%;
  aspect-ratio: 1;
  font-size: 1.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.reaction-emoji-btn:hover {
  background: #fef3c7;
  border-color: #f8ae19;
  transform: scale(1.1);
}

.reaction-emoji-btn:active {
  transform: scale(0.95);
}

.reaction-emoji-btn.emoji-more {
  font-size: 1.5rem;
  color: #602515;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f8ae19;
}

.btn-cancel,
.btn-primary,
.btn-danger {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-primary {
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.edit-textarea {
  width: 100%;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #1e293b;
  font-size: 0.875rem;
  resize: vertical;
  margin-bottom: 1rem;
}

.edit-textarea:focus {
  outline: none;
  border-color: #602515;
}

/* ============================================
   EMOJI PICKER
   ============================================ */
/* Inline emoji picker - absolute positioned above message */
.inline-emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e8f0;
  margin-bottom: 0.25rem;
  max-width: 280px;
  z-index: 50;
}

.message.own .inline-emoji-picker {
  left: auto;
  right: 0;
}

/* Show picker below message for top messages */
.inline-emoji-picker.picker-below {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: 0.25rem;
}

/* Click-outside overlay for emoji picker */
.emoji-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}

.emoji-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.emoji-btn:hover {
  background: #fef3c7;
}

/* + Button in quick picker */
.emoji-more-btn {
  font-size: 1.25rem;
  color: #602515;
}

.emoji-more-btn:hover {
  background: #fef3c7;
  color: #7e3c2f;
}

/* Full Emoji Picker Panel (WhatsApp-style keyboard) */
.full-emoji-picker {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.emoji-picker-title {
  font-weight: 600;
  color: #1e293b;
}

.emoji-picker-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-picker-close:hover {
  color: #602515;
}

.emoji-categories-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  flex-shrink: 0;
}

.category-tab {
  padding: 0.5rem 0.75rem;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.category-tab.active {
  background: #602515;
  box-shadow: 0 2px 4px rgba(96, 37, 21, 0.2);
}

.category-tab:hover:not(.active) {
  background: #e2e8f0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 0.25rem;
  padding: 0.75rem;
  overflow-y: auto;
  flex: 1;
}

.emoji-grid-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-grid-btn:hover {
  background: #fef3c7;
}

/* Slide up animation for full picker */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* ============================================
   EMPTY STATES
   ============================================ */
.empty-state,
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-chat h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.loading-messages {
  display: flex;
  justify-content: center;
  padding: 1rem;
  color: #602515;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Edit/Delete buttons */
.edit-btn:hover {
  color: #602515;
}

.delete-btn:hover {
  color: #ef4444;
}

/* Deleted message style */
.message.deleted .message-content {
  background: #f1f5f9;
  opacity: 0.7;
}

.deleted-text {
  color: #94a3b8 !important;
  font-style: italic;
  display: flex;
  align-items: center;
}

/* ============================================
   RESPONSIVE DESIGN - Mobile First
   ============================================ */

/* Mobile & Tablet: < 1024px - Stacked layout */
@media (max-width: 1023px) {
  .chat-container {
    flex-direction: column;
  }

  .chat-sidebar {
    position: absolute;
    inset: 0;
    width: 100%;
    z-index: 20;
    transform: translateX(-100%);
  }

  .chat-sidebar.sidebar-visible {
    transform: translateX(0);
  }

  .chat-main {
    position: absolute;
    inset: 0;
    width: 100%;
  }

  .back-btn {
    display: flex;
  }

  /* Global Floating Mobile Actions */
  .floating-mobile-actions {
    position: fixed;
    background: white;
    border-radius: 9999px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 6px;
    z-index: 99999;

    /* Stable centering */
    left: 0;
    right: 0;
    margin: 0 auto;
    width: max-content;

    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: bottom center;
  }

  /* Force hide embedded message actions on mobile to prevent duplication */
  @media (max-width: 1023px) {
    .message .message-actions {
      display: none !important;
    }
  }

  .floating-actions-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-btn-float {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #475569;
    font-size: 1.25rem;
    transition: all 0.2s;
  }

  .action-btn-float:active {
    background: #f1f5f9;
    transform: scale(0.95);
  }

  .action-btn-float.edit-btn {
    color: #3b82f6;
  }
  .action-btn-float.delete-btn {
    color: #ef4444;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Make message bubbles wider and centered on mobile */
  .message {
    max-width: 90%;
    width: 90%;
    align-self: center !important;
  }

  .message.own {
    align-self: center !important;
  }

  .message-content {
    padding: 0.875rem 1rem;
    width: 100%;
  }

  .message-text {
    font-size: 0.9375rem;
    line-height: 1.6;
  }

  /* Make action buttons absolute positioned on mobile */
  .message-actions {
    position: absolute;
    top: -32px;
    right: 0;
    background: white;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 0.25rem;
    opacity: 0;
    pointer-events: none;
  }

  .message:hover .message-actions,
  .message:active .message-actions {
    opacity: 1;
    pointer-events: auto;
  }

  /* For touch devices - show actions on tap via JS class */
  .message:focus-within .message-actions,
  .message.actions-visible .message-actions {
    opacity: 1;
    pointer-events: auto;
    z-index: 10;
  }

  .modal {
    margin: 1rem;
    min-width: auto;
    width: calc(100% - 2rem);
  }

  .emoji-picker {
    bottom: 80px;
    width: calc(100% - 2rem);
    justify-content: space-around;
  }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .chat-sidebar {
    width: 320px;
  }

  .back-btn {
    display: none;
  }

  .message {
    max-width: 70%;
  }
}

/* Large Desktop: >= 1280px */
@media (min-width: 1280px) {
  .chat-sidebar {
    width: 360px;
  }

  .message {
    max-width: 60%;
  }
}

/* Scrollbar styling */
.conversation-list::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.conversation-list::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.conversation-list::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.conversation-item.active {
  background: var(--bg-primary, #f8fafc);
}
.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}
.conv-name {
  font-weight: 500;
  color: var(--text-primary, #334155);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-time {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
}
.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preview-text {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unread-badge {
  background: #602515;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
} /* Main chat area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #f8fafc);
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-secondary, #ffffff);
}
.header-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
}
.header-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #334155);
}
.typing-indicator {
  font-size: 0.75rem;
  color: #602515;
  font-style: italic;
}
.online-status {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
}
.online-status.online {
  color: #22c55e;
  font-weight: 500;
}
.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}
.action-btn:hover {
  background: var(--bg-primary, #f8fafc);
  color: var(--text-primary, #334155);
} /*
Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.message {
  display: flex;
  gap: 0.5rem;
  max-width: 70%;
}
.message.own {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.message-content {
  padding: 0.75rem 1rem;
  border-radius: 16px;
  background: var(--bg-secondary, #ffffff);
}
.message.own .message-content {
  background: #fffaf2;
  color: #1e293b;
  border: 1px solid #e2e8f0;
}
.message.own .message-text {
  color: #1e293b !important;
}
.message.own .message-time {
  color: rgba(0, 0, 0, 0.6) !important;
}
.message.own .forwarded-label {
  color: #64748b !important;
}
.message.own .forward-icon {
  color: #64748b !important;
}
.message.own .tick-icon {
  color: #602515; /* Custom brown color for ticks */
}
.message-text {
  color: var(--text-primary, #334155);
  word-wrap: break-word;
}
.message-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.message-time {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.6);
}
.edited-label {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
}
.reply-preview {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid #602515;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.8rem;
}
.reply-author {
  color: #602515;
  display: block;
  font-weight: 500;
}
.reply-text {
  color: rgba(0, 0, 0, 0.7);
}
.message-attachments {
  margin-bottom: 0.5rem;
}
.attachment-image {
  max-width: 200px;
  border-radius: 8px;
  cursor: pointer;
}
.attachment-video video,
.attachment-audio audio {
  max-width: 250px;
}

.reactions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.reaction {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.875rem;
}
.reaction.own {
  border-color: #602515;
}
.message-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.message:hover .message-actions {
  opacity: 1;
}
.message-actions button {
  padding: 0.25rem;
  background: var(--bg-secondary, #ffffff);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
} /* Chat input */
.chat-input {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-secondary, #ffffff);
}
.forwarded-label {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 0.75rem;
  font-style: italic;
  margin-bottom: 4px;
}
.signed-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #602515;
  font-weight: 600;
  margin-bottom: 4px;
  background: rgba(96, 37, 21, 0.08); /* Transparent brown */
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}
.signed-icon {
  font-size: 1rem;
}
.forward-icon {
  margin-right: 4px;
  font-size: 1rem;
  color: #64748b;
}
.reply-indicator {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--bg-primary, #f8fafc);
  border-radius: 8px;
  border-left: 3px solid #602515;
}
.reply-content span {
  color: #602515;
  font-size: 0.75rem;
}
.reply-content p {
  color: var(--text-secondary, #64748b);
  font-size: 0.875rem;
  margin: 0;
}
.attachments-preview {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  overflow-x: auto;
}
.preview-item {
  position: relative;
  padding: 0.25rem;
  background: var(--bg-primary, #f8fafc);
  border-radius: 8px;
}
.preview-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}
.preview-name {
  font-size: 0.75rem;
  color: var(--text-primary, #334155);
  padding: 0.5rem;
}
.preview-item button {
  position: absolute;
  top: -4px;
  right: -4px;
  padding: 0.125rem;
  background: #ff4757;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
}
.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.attach-btn {
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}
.attach-btn:hover {
  background: var(--bg-primary, #f8fafc);
}
.input-wrapper {
  flex: 1;
}
.input-wrapper textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 24px;
  border: none;
  background: var(--bg-primary, #f8fafc);
  color: var(--text-primary, #334155);
  resize: none;
  max-height: 120px;
}
.send-btn {
  padding: 0.75rem;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
} /*
Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--bg-secondary, #ffffff);
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 300px;
}
.modal h3 {
  margin-bottom: 1rem;
  color: var(--text-primary, #334155);
}
.user-select {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-primary, #f8fafc);
  color: var(--text-primary, #334155);
  margin-bottom: 1rem;
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.btn-cancel,
.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
.btn-cancel {
  background: transparent;
  color: var(--text-secondary, #64748b);
}
.btn-primary {
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  color: #ffffff;
  color: white;
}
.btn-primary:disabled {
  opacity: 0.5;
} /* Emoji picker */
.emoji-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 101;
}
.emoji-picker {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--bg-secondary, #ffffff);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.emoji-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}
.emoji-btn:hover {
  background: var(--bg-primary, #f8fafc);
} /* Empty states */
.empty-state,
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #64748b);
  text-align: center;
  padding: 2rem;
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
.loading-messages {
  display: flex;
  justify-content: center;
  padding: 1rem;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
} /* Edit/Delete buttons */
.edit-btn:hover {
  color: #602515;
}
.delete-btn:hover {
  color: #f56565;
} /* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--bg-secondary, #ffffff);
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 320px;
  max-width: 500px;
}
.modal h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary, #334155);
}
.modal p {
  color: var(--text-secondary, #64748b);
  margin-bottom: 1rem;
}
.edit-textarea {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-primary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  color: var(--text-primary, #334155);
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 1rem;
}
.edit-textarea:focus {
  outline: none;
  border-color: #602515;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
} /*
Image Grid (WhatsApp style) */
.image-grid {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 320px;
  width: 100%;
}
.image-grid.grid-1 {
  grid-template-columns: 1fr;
  max-height: 320px;
}
.image-grid.grid-2 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto;
}
.image-grid.grid-3 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.image-grid.grid-3 .grid-image-wrapper:last-child {
  grid-column: 1 / -1;
  aspect-ratio: 2 / 1;
}
.image-grid.grid-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid-image-wrapper {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  background: #f0f0f0;
  min-height: 150px;
}
.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s, filter 0.2s;
  display: block;
}
.grid-image:hover {
  filter: brightness(0.95);
}
.more-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 400;
  backdrop-filter: blur(2px);
}
/* HD Badge */
.hd-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 2;
  line-height: 1;
} /* Image time badge */
.image-time-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7));
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  z-index: 2;
} /* Image Lightbox - White Theme */
.lightbox-container {
  position: fixed;
  inset: 0;
  background-color: #ffffff; /* White background */
  z-index: 9999;
  display: flex;
  flex-direction: column;
  outline: none;
} /* Header */
.lightbox-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}
.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sender-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(96, 37, 21, 0.2);
}
.sender-initial {
  font-size: 1.2rem;
  color: #ffffff;
  font-weight: 600;
}
.sender-text {
  display: flex;
  flex-direction: column;
}
.sender-name {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}
.sender-date {
  font-size: 0.8rem;
  color: #666;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  color: #54656f; /* WhatsApp gray */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}
.action-btn:hover {
  background-color: #f0f2f5;
}
.action-btn.starred {
  color: #f59e0b;
}
/* Main Stage */
.lightbox-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #ffffff;
  overflow: hidden;
}
.image-wrapper {
  max-width: 80%;
  max-height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Horizontal Scroll Gallery with Scroll Snap */
.scroll-gallery {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  height: 100%;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.scroll-gallery::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.scroll-gallery-item {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  scroll-snap-align: center;
  scroll-snap-stop: always; /* Prevent skipping during fast swipe */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.scroll-gallery-item .main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.main-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
} /* Navigation Arrows */
.stage-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f0f2f5;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #54656f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}
.stage-nav:hover {
  background-color: #e9edef;
  transform: translateY(-50%) scale(1.05);
}
.nav-prev {
  left: 24px;
}
.nav-next {
  right: 24px;
} /* Bottom Thumbnails */
.lightbox-thumbnails {
  height: 80px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}
.thumbnails-track {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
  max-width: 90%;
} /* Hide scrollbar */
.thumbnails-track::-webkit-scrollbar {
  height: 4px;
}
.thumbnails-track::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
.thumbnail-item {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0.6;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumbnail-item:hover {
  opacity: 0.8;
}
.thumbnail-item.active {
  opacity: 1;
  border-color: #00a884; /* WhatsApp Green */
} /* Grid rounded corners - first image top corners, last image bottom corners
*/
.image-grid.grid-1 .grid-image-wrapper {
  border-radius: 12px;
}
.image-grid.grid-2 .grid-image-wrapper:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}
.image-grid.grid-2 .grid-image-wrapper:last-child {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}
.image-grid.grid-3 .grid-image-wrapper:first-child,
.image-grid.grid-4 .grid-image-wrapper:first-child {
  border-top-left-radius: 12px;
}
.image-grid.grid-3 .grid-image-wrapper:nth-child(2),
.image-grid.grid-4 .grid-image-wrapper:nth-child(2) {
  border-top-right-radius: 12px;
}
.image-grid.grid-3 .grid-image-wrapper:nth-child(3) {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.image-grid.grid-4 .grid-image-wrapper:nth-child(3) {
  border-bottom-left-radius: 12px;
}
.image-grid.grid-4 .grid-image-wrapper:nth-child(4) {
  border-bottom-right-radius: 12px;
} /* Grid hover effect */
.grid-image-wrapper:hover .grid-image {
  filter: brightness(0.92);
}

/* Responsive Design */
@media (max-width: 768px) {
  /* Chat Interface */
  .chat-main {
    position: fixed;
    top: 64px; /* Height of TopBar */
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 50;
    background: #ffffff;
  }

  /* Sidebar Mobile Logic */
  .chat-sidebar {
    position: fixed;
    top: 64px; /* Height of TopBar */
    bottom: 0;
    width: 100%;
    z-index: 60; /* Above chat-main */
    background: #ffffff;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chat-sidebar.sidebar-visible {
    transform: translateX(0);
  }

  .message {
    max-width: 98%; /* Much wider bubbles on mobile for better readability */
  }

  .message-content {
    padding: 0.875rem 1rem; /* Slightly more padding on mobile */
  }

  .messages-container {
    padding: 0.75rem; /* Less padding to maximize message width */
  }

  /* Image Grid Responsive */
  .image-grid {
    max-width: 100%;
    width: 100%;
  }

  .grid-image-wrapper {
    min-height: 100px;
  }

  .image-grid.grid-1 {
    max-height: 200px;
  }

  .image-grid.grid-1 .grid-image-wrapper {
    max-height: 200px;
    min-height: auto;
  }

  .more-overlay {
    font-size: 2rem;
  }

  .hd-badge {
    font-size: 0.55rem;
    padding: 2px 4px;
  }

  .image-time-badge {
    font-size: 0.6rem;
    padding: 2px 4px;
  }

  /* Lightbox */
  .lightbox-header {
    padding: 0 0.5rem;
    height: 56px;
  }

  .desktop-only {
    display: none !important;
  }

  .sender-avatar {
    width: 32px;
    height: 32px;
  }

  .sender-initial {
    font-size: 0.8rem;
  }

  .sender-name {
    font-size: 0.9rem;
  }

  .sender-date {
    font-size: 0.75rem;
  }

  .image-wrapper {
    max-width: 100%; /* maximize image width */
    max-height: 70%;
  }

  .stage-nav {
    width: 36px;
    height: 36px;
    font-size: 1.4rem;
    background-color: rgba(240, 242, 245, 0.8);
  }

  .nav-prev {
    left: 4px; /* Closer to edge */
  }

  .nav-next {
    right: 4px; /* Closer to edge */
  }

  .lightbox-thumbnails {
    height: 70px;
  }

  .thumbnail-item {
    width: 40px;
    height: 40px;
  }

  /* Link Preview Responsive */
  .link-preview-input {
    margin-bottom: 6px;
    padding: 0 8px;
  }

  .link-preview-card {
    flex-direction: column;
  }

  .link-preview-image {
    width: 100%;
    height: 120px;
  }

  .link-preview-content {
    padding: 8px 10px;
  }

  .link-preview-title {
    font-size: 0.8rem;
  }

  .link-preview-desc {
    font-size: 0.7rem;
    -webkit-line-clamp: 2;
  }

  .link-preview-close {
    top: 8px;
    right: 8px;
  }

  /* Message Link Preview Responsive */
  .message-link-preview {
    margin-top: 6px;
  }

  .message-link-preview img {
    max-height: 100px;
  }

  .message-link-preview .link-preview-content {
    padding: 6px 8px;
  }

  .message-link-preview .link-preview-title {
    font-size: 0.75rem;
  }

  .message-link-preview .link-preview-desc {
    font-size: 0.65rem;
    -webkit-line-clamp: 2;
  }

  .message-link-preview .link-preview-domain {
    font-size: 0.6rem;
  }
}

/* WhatsApp-style Blockquote - using :deep() for v-html content */
.message-text :deep(.wa-blockquote) {
  display: block;
  border-left: 4px solid #00a884;
  padding: 6px 8px;
  margin: 4px 0;
  color: #667781;
  background: rgba(0, 168, 132, 0.08);
  border-radius: 4px;
}

.message.own .message-text :deep(.wa-blockquote) {
  border-left-color: #602515;
  color: #602515;
  background: rgba(96, 37, 21, 0.1);
}

/* Text formatting in messages */
.message-text :deep(strong),
.message-text :deep(b) {
  font-weight: 700;
}

.message-text :deep(em),
.message-text :deep(i) {
  font-style: italic;
}

.message-text :deep(del),
.message-text :deep(s) {
  text-decoration: line-through;
}

.message-text :deep(code) {
  font-family: "SF Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo,
    monospace;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.9em;
}

.message.own .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

/* Message Text Wrapper for truncation */
.message-text-wrapper {
  display: flex;
  flex-direction: column;
}

/* Show More Button */
.show-more-btn {
  background: transparent;
  border: none;
  color: #00a884;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  text-align: left;
  transition: color 0.2s;
}

.show-more-btn:hover {
  color: #008567;
  text-decoration: underline;
}

.message.own .show-more-btn {
  color: #00a884;
}

.message.own .show-more-btn:hover {
  color: #008567;
  text-decoration: underline;
}

/* Link Preview Styles */
.link-preview-input {
  margin-bottom: 8px;
  padding: 0 12px;
}

.link-preview-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  color: #64748b;
  font-size: 0.875rem;
}

.link-preview-card {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.link-preview-image {
  width: 100px;
  height: 80px;
  object-fit: cover;
  flex-shrink: 0;
}

.link-preview-content {
  flex: 1;
  padding: 10px 12px;
  min-width: 0;
}

.link-preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-preview-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-preview-domain {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: lowercase;
}

.link-preview-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.link-preview-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* Link preview in message */
.message-link-preview {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  max-width: 100%;
}

.message-link-preview a {
  display: block;
  text-decoration: none;
  color: inherit;
}

.message-link-preview img {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  display: block;
}

.message-link-preview .link-preview-content {
  padding: 8px 10px;
}

.message-link-preview .link-preview-title {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-link-preview .link-preview-desc {
  font-size: 0.7rem;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-link-preview .link-preview-domain {
  font-size: 0.65rem;
  color: #94a3b8;
}

.message.own .message-link-preview {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
}

.message.own .link-preview-title {
  color: #1e293b;
}

.message.own .link-preview-desc {
  color: #64748b;
}

.message.own .link-preview-domain {
  color: #94a3b8;
}

/* Clickable links in messages */
.message-text :deep(.message-link) {
  color: #00a884;
  text-decoration: none;
  word-break: break-all;
}

.message-text :deep(.message-link:hover) {
  text-decoration: underline;
}

.message.own .message-text :deep(.message-link) {
  color: #00a884;
}

.message.own .message-text :deep(.message-link:hover) {
  color: #00a884;
  text-decoration: underline;
}

/* Forward Dialog */
.forward-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.forward-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.forward-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.forward-dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 500;
}

.forward-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #54656f;
  padding: 8px;
  display: flex;
  margin-right: 1rem;
}

/* Search */
.forward-search-wrapper {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.forward-search-icon {
  color: #54656f;
  font-size: 1.25rem;
  margin-right: 0.75rem;
}

.forward-search-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  outline: none;
  background: white;
}

.forward-search-input:focus {
  border-color: #602515;
  box-shadow: 0 0 0 2px rgba(96, 37, 21, 0.2);
}

.forward-dialog-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
  max-height: 50vh;
}

.forward-section-label {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: #602515;
  font-weight: 500;
}

.forward-conversation-list {
  display: flex;
  flex-direction: column;
}

.forward-conversation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.forward-conversation-item:hover {
  background: #f0f2f5;
}

.forward-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  accent-color: #602515;
  cursor: pointer;
  flex-shrink: 0;
}

.forward-conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.forward-conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.forward-conv-name {
  font-size: 1rem;
  color: #111b21;
  font-weight: 400;
}

.forward-conv-members {
  font-size: 0.8rem;
  color: #8696a0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer with Preview */
.forward-dialog-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f0f2f5;
  border-top: 1px solid #e2e8f0;
}

.forward-preview {
  flex-shrink: 0;
}

.forward-preview-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
}

.forward-caption-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: #3b4a54;
  outline: none;
  padding: 0.5rem 0;
}

.forward-caption-input::placeholder {
  color: #8696a0;
}

.forward-send-btn {
  background: #602515;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.forward-send-btn:hover {
  background: #4a1d10;
}
.scroll-bottom-btn {
  position: absolute;
  bottom: 120px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 20;
  transition: all 0.2s;
}

.scroll-bottom-btn:hover {
  background: #f8fafc;
  color: #602515;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* ============================================
   ATTACHMENT MENU STYLES
   ============================================ */
.attach-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.attach-menu-popup {
  position: absolute;
  bottom: 60px;
  left: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
  padding: 16px;
  width: 320px;
  max-width: 90vw;
  z-index: 1000;
  border: 1px solid #f0f0f0;
  transform-origin: bottom left;
}

.attach-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  row-gap: 20px;
}

.attach-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #1e293b;
}

.attach-item span {
  font-size: 12px;
  font-weight: 500;
  color: #54656f;
  text-align: center;
}

/* Circular Icons */
.attach-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s;
}

.attach-item:hover .attach-icon {
  transform: scale(1.05);
}

/* WhatsApp-like Colors */
.doc-icon {
  background: linear-gradient(135deg, #7f66ff, #512da8); /* Violet */
}

.camera-icon {
  background: linear-gradient(135deg, #ff5252, #d50000); /* Red */
}

.media-icon {
  background: linear-gradient(135deg, #e91e63, #c2185b); /* Pink */
}

.sign-icon {
  background: linear-gradient(135deg, #602515, #3e1f15); /* Brown brand color */
}
.sign-icon.active {
  outline: 3px solid #ffd700;
  outline-offset: 2px;
}

.audio-icon {
  background: linear-gradient(135deg, #ff9800, #f57c00); /* Orange */
}

/* Transition */
.pop-up-enter-active,
.pop-up-leave-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.pop-up-enter-from,
.pop-up-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .attach-menu-popup {
    bottom: 70px; /* Above footer */
    left: 10px;
  }
}

/* ============================================
   EMOJI KEYBOARD (Static Footer)
   ============================================ */
.emoji-keyboard-area {
  height: 280px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

/* Top Bar */
.emoji-picker-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f8fafc;
}

.emoji-type-tabs {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}

.type-tab {
  padding: 4px 16px;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.type-tab.active {
  background: #cbd5e1;
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-emoji-btn,
.backspace-btn-top {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

/* Grid */
/* Grid */
/* Grid */
.emoji-grid {
  flex: 1;
  padding: 0 8px 8px; /* Remove top padding */
  display: block; /* Force block to override upstream grid */
  overflow-y: auto;
  align-content: flex-start; /* Kept but irrelevant for block */
  background: #ffffff;
  position: relative; /* Ensure offsetTop is relative to this container */
}

.emoji-category-section {
  padding-bottom: 8px;
  display: block;
}

.emoji-list-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  gap: 2px;
}

.emoji-category-label {
  grid-column: 1 / -1;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 8px 0 4px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 6px 0;
  z-index: 1;
}

.emoji-grid-btn {
  font-size: 2rem; /* Larger emojis */
  padding: 4px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.emoji-grid-btn:hover {
  background: #f1f5f9;
}

/* Footer */
.emoji-picker-footer {
  display: flex;
  justify-content: center;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
  padding: 4px 0;
}

.emoji-categories-tabs {
  display: flex;
  overflow-x: auto;
  gap: 4px;
  justify-content: center;
}
.emoji-categories-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  padding: 8px 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  color: #cbd5e1; /* Inactive grey */
  border-bottom: 3px solid transparent;
  border-radius: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.category-tab:hover {
  background: transparent;
}

.category-tab.active {
  color: #602515; /* Brown Theme */
  border-bottom-color: #602515;
  background: transparent !important;
  box-shadow: none !important;
}

.apple-emoji {
  width: 32px;
  height: 32px;
  object-fit: contain;
  vertical-align: middle;
  pointer-events: none;
}

/* Scale Apple Emojis in Text (v-html content needs deep selector) */
:deep(.apple-emoji-text) {
  width: 22px !important;
  height: 22px !important;
  object-fit: contain;
  vertical-align: -4px;
  margin: 0 1px;
  display: inline-block;
}

/* Native emoji fallback - same size as Apple emoji */
:deep(.native-emoji-fallback) {
  font-size: 20px;
  line-height: 22px;
  vertical-align: -4px;
  margin: 0 1px;
  display: inline-block;
}

/* Apple Emoji in Reactions (displayed on messages) */
.apple-emoji-reaction {
  width: 18px;
  height: 18px;
  object-fit: contain;
  vertical-align: middle;
  pointer-events: none;
}

.reaction-count {
  margin-left: 4px;
  font-size: 0.75rem;
  color: #64748b;
}

.reaction.own .reaction-count {
  color: #602515;
}

/* Apple Emoji in Category Tabs */
.apple-emoji-tab {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
  pointer-events: none;
}

/* ============================================
   GROUP INFO PANEL STYLES
   ============================================ */
.group-info-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.add-member-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2100;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.alert-overlay,
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 3000; /* Highest priority */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.modal-alert,
.modal-confirm {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 350px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.modal-alert .modal-header,
.modal-confirm .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-alert .modal-header h3,
.modal-confirm .modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-alert .modal-body,
.modal-confirm .modal-body {
  padding: 1.5rem;
  color: #334155;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-alert .modal-actions,
.modal-confirm .modal-actions {
  padding: 1rem;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 0 !important; /* Override inline style if any */
}

.group-info-panel {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.group-info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.group-info-header .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  color: #64748b;
}

.group-info-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.group-info-main {
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.relative-container {
  position: relative;
  width: fit-content;
  margin: 0 auto 1rem;
}

.group-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #86340b, #c2662b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  object-fit: cover;
}

.group-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.group-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.avatar-upload-btn:hover {
  background: #f8fafc;
  color: #0ea5e9;
}

.group-name-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.group-name-display h2 {
  margin: 0;
  font-size: 1.25rem;
}

.edit-name-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
}

.group-name-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.group-name-input {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  width: 200px;
}

.group-name-edit .save-btn,
.group-name-edit .cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.25rem;
}

.group-name-edit .save-btn {
  color: #16a34a;
}

.group-name-edit .cancel-btn {
  color: #dc2626;
}

.member-count {
  color: #64748b;
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
}

/* Admin Controls */
.group-admin-controls {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #334155;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #f1f5f9;
}

.control-btn.danger {
  color: #dc2626;
}

.control-btn.danger:hover {
  background: #fee2e2;
}

/* Locked Indicator */
.locked-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

/* Members Section */
.group-members-section {
  padding: 1rem;
}

.group-members-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
}

.member-item:hover {
  background: #f8fafc;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #86340b, #c2662b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
}

.admin-badge {
  font-size: 0.75rem;
  color: #16a34a;
  background: #dcfce7;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.member-actions {
  display: flex;
  gap: 0.25rem;
}

.member-action-btn {
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  color: #64748b;
  border-radius: 4px;
  transition: all 0.2s;
}

.member-action-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.member-action-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Leave Group Button */
.group-footer-actions {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.leave-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: 1px solid #dc2626;
  border-radius: 8px;
  color: #dc2626;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.leave-btn:hover {
  background: #dc2626;
  color: white;
}

/* Add Member Modal */
.add-member-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 350px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.add-member-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.add-member-header .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
}

.add-member-header h3 {
  margin: 0;
  font-size: 1rem;
}

.add-member-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #64748b;
}

.add-member-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
}

.add-member-results {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.add-member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.add-member-item:hover {
  background: #f1f5f9;
}

.add-member-results .no-results {
  text-align: center;
  color: #64748b;
  padding: 1rem;
  font-size: 0.875rem;
}

.chat-locked-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.9375rem;
  border-radius: 12px;
  background-image: repeating-linear-gradient(
    45deg,
    #f8fafc,
    #f8fafc 10px,
    #f1f5f9 10px,
    #f1f5f9 20px
  );
}

.chat-locked-message .iconify {
  font-size: 1.25rem;
  color: #94a3b8;
}
/* Group Info Panel styling */
.group-info-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.group-info-panel {
  background: white;
  width: 100%;
  max-width: 400px;
  height: auto;
  max-height: 85vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modal-pop 0.2s ease-out;
}

@keyframes modal-pop {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.panel-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.panel-header .close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  transition: background 0.2s;
}

.panel-header .close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.group-header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(to bottom, #f8fafc, white);
}

.group-header-info h2 {
  margin: 0.5rem 0 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.group-header-info .member-count {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.admin-actions {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Control Buttons */
.control-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.control-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.control-btn.active {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.control-btn.danger {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

.control-btn.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* Panel Footer */
.panel-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.leave-group-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-group-btn:hover {
  background: #ef4444;
  color: white;
}

/* Avatar Upload Button in Group Info */
.group-avatar-large.relative-container {
  position: relative;
  display: inline-block;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0; /* Align with bottom edge */
  right: 0; /* Align with right edge */
  background: white;
  border: 2px solid white; /* Create a gap effect */
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  z-index: 10;
}

.avatar-upload-btn:hover {
  background: #f1f5f9;
  color: #0ea5e9;
  transform: scale(1.1);
}

.avatar-upload-btn .iconify {
  font-size: 1.25rem; /* Ensure icon is well-sized inside 32px button */
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.group-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Notification Styles */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 9999px;
  min-width: 16px;
  text-align: center;
}

.notification-modal {
  width: 380px !important;
  max-width: 90vw;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8fafc;
}

.notification-item.unread {
  background-color: #f0f9ff;
  position: relative;
}

.notification-item.unread::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #3b82f6;
}

.notif-icon {
  margin-right: 12px;
  font-size: 24px;
  color: #64748b;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 0.9rem;
}

.notif-message {
  margin: 0 0 4px 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.notif-time {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
}

.notif-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.8rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-small.btn-primary {
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-small.btn-primary:hover {
  background-color: #2563eb;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.4);
}

.btn-small.btn-danger {
  background-color: #ef4444;
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.btn-small.btn-danger:hover {
  background-color: #dc2626;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.4);
}

.badge-invited {
  font-size: 0.7rem;
  color: #d97706;
  background-color: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 0.5rem;
  font-weight: 600;
}
</style>

<style>
/* Global fix for attachment document layout */
.messages-container .message .attachment-doc {
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05) !important;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 4px;
  transition: background 0.2s;
  max-width: 100%;
}

.messages-container .message .attachment-doc:hover {
  background: rgba(0, 0, 0, 0.1) !important;
}

.messages-container .message .attachment-doc span {
  font-size: 0.9rem;
  font-weight: 500;
  word-break: break-all;
  flex: 1;
}

.messages-container .message.own .attachment-doc {
  background: rgba(255, 255, 255, 0.2) !important;
}

.messages-container .message.own .attachment-doc:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}
</style>
