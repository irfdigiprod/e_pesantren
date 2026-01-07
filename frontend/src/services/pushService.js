import { pushApi } from "./api";

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered");
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push messaging not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log("Already subscribed to push");
      return true; // Already subscribed
    }

    // Get VAPID public key from backend
    const res = await pushApi.getVapidKey();
    if (!res.success || !res.data?.publicKey) {
      console.error("Failed to get VAPID key");
      return false;
    }

    const convertedVapidKey = urlBase64ToUint8Array(res.data.publicKey);

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    console.log("Push subscription successful:", subscription);

    // Send subscription to backend
    const saveRes = await pushApi.subscribe(
      subscription.endpoint,
      subscription.toJSON().keys
    );

    return saveRes.success;
  } catch (error) {
    console.error("Failed to subscribe to push:", error);
    // If permission denied, standard error
    if (Notification.permission === "denied") {
      console.warn("Notification permission denied");
    }
    return false;
  }
}

export async function checkPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    await subscribeToPush();
  }
  return permission;
}
