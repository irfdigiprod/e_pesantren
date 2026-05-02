# Graph Report - e_pesantren  (2026-05-02)

## Corpus Check
- 264 files · ~278,422 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 554 nodes · 426 edges · 22 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `WebSocketClient` - 15 edges
2. `alert()` - 12 edges
3. `showStatus()` - 6 edges
4. `exportTahfidzReportToExcel()` - 6 edges
5. `closeNotificationPopup()` - 5 edges
6. `fetchUsers()` - 5 edges
7. `showStatus()` - 5 edges
8. `submit()` - 5 edges
9. `showStatus()` - 5 edges
10. `request()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `exportToExcel()` --calls--> `alert()`  [INFERRED]
  frontend/src/views/apps/RecapAttendance.vue → frontend/src/views/apps/clinic/Rooms.vue
- `handleDownloadPdf()` --calls--> `alert()`  [INFERRED]
  frontend/src/views/apps/academic/ReportCardPrint.vue → frontend/src/views/apps/clinic/Rooms.vue
- `respondToInvitation()` --calls--> `alert()`  [INFERRED]
  frontend/src/components/layout/TopBar.vue → frontend/src/views/apps/clinic/Rooms.vue
- `if()` --calls--> `showStatus()`  [INFERRED]
  frontend/src/views/settings/SalarySettings.vue → frontend/src/views/apps/academic/ReportCardPrint.vue
- `if()` --calls--> `showStatus()`  [INFERRED]
  frontend/src/views/settings/AcademicSettings.vue → frontend/src/views/apps/academic/ReportCardPrint.vue

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (13): alert(), exportTahfidzReportToExcel(), getExamCode(), getPageRange(), getPredicate(), respondToInvitation(), handlePhotoSelect(), exportToExcel() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (12): closeMenu(), closeNotificationPopup(), goProfile(), goSettings(), goToChat(), goToConversation(), goToNotificationDetail(), goToNotifications() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (8): closeModal(), fetchUsers(), getPhotoUrl(), handleDelete(), onImportSuccess(), openEditModal(), saveUser(), showStatus()

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (10): fitReportToA4(), handleDownloadPdf(), handlePrint(), loadData(), loadFilters(), selectStudent(), showStatus(), if() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (9): sendPushNotification(), broadcastToConversation(), broadcastToUser(), handleNewMessage(), handleReaction(), handleRead(), handleTyping(), createNotification() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (1): WebSocketClient

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (9): formatDateLocal(), formatMessageTime(), formatTime(), formatTimeLocal(), getConversationAvatar(), getConversationName(), getMemberInitials(), getMemberName() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (9): closeModal(), executeDelete(), getSchedulesForDay(), minsToTime(), onDrop(), onDropOnSchedule(), showStatus(), submitForm() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (4): confirmDeleteClaim(), exportToExcel(), fetchRecap(), togglePermissionType()

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (4): fetchPermissions(), removeFile(), showStatus(), submit()

### Community 10 - "Community 10"
Cohesion: 0.26
Nodes (7): fetchReports(), buildHeaders(), getToken(), parseResponse(), removeToken(), request(), uploadFile()

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (5): main(), authMiddleware(), authenticateWebSocket(), generateToken(), verifyToken()

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (3): closeModal(), saveAssignment(), showStatus()

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (3): executeAction(), showStatus(), updateStatus()

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (5): closeModal(), confirmCancel(), deleteItem(), fetchData(), submitForm()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): closeModal(), confirmCancel(), deleteItem(), fetchData(), submitForm()

### Community 16 - "Community 16"
Cohesion: 0.43
Nodes (4): checkRateLimit(), clearLoginAttempts(), getRateLimitKey(), recordLoginAttempt()

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (3): requestPermission(), subscribeToPush(), urlBase64ToUint8Array()

### Community 18 - "Community 18"
Cohesion: 0.6
Nodes (4): findChromePath(), generatePdfFromHtml(), generatePdfFromUrl(), getBrowser()

### Community 19 - "Community 19"
Cohesion: 0.6
Nodes (3): loadStudents(), saveAll(), showStatus()

### Community 20 - "Community 20"
Cohesion: 0.6
Nodes (3): calculateGrade(), getArabicGrade(), getSetting()

### Community 21 - "Community 21"
Cohesion: 0.6
Nodes (3): deg2rad(), getDistanceFromLatLonInMeters(), validateLocation()

## Knowledge Gaps
- **Thin community `Community 5`** (17 nodes): `websocket.js`, `getWsUrl()`, `WebSocketClient`, `.connect()`, `.constructor()`, `.disconnect()`, `.emit()`, `.flushMessageQueue()`, `.handleMessage()`, `.on()`, `.scheduleReconnect()`, `.send()`, `.sendMessage()`, `.sendReaction()`, `.sendRead()`, `.sendTyping()`, `.setupEventListeners()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `alert()` connect `Community 0` to `Community 8`, `Community 3`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `respondToInvitation()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `handlePhotoSelect()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `alert()` (e.g. with `respondToInvitation()` and `handlePhotoSelect()`) actually correct?**
  _`alert()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `showStatus()` (e.g. with `if()` and `if()`) actually correct?**
  _`showStatus()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `exportTahfidzReportToExcel()` (e.g. with `exportToExcel()` and `getUkjScore()`) actually correct?**
  _`exportTahfidzReportToExcel()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._