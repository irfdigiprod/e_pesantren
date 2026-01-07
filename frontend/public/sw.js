// Service Worker for Web Push Notifications

self.addEventListener("push", function (event) {
  if (event.data) {
    const payload = event.data.json();

    // Customize notification options
    const options = {
      body: payload.body,
      icon: payload.icon || "/iconku.svg",
      badge: payload.badge || "/iconku.svg",
      data: payload.data || {},
      vibrate: [100, 50, 100],
      actions: [
        {
          action: "open",
          title: "Buka",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then(function (clientList) {
        // Build URL to open
        let url = "/";
        if (event.notification.data && event.notification.data.url) {
          url = event.notification.data.url;
        }

        // Check if window is already open
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }

        // If not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
