import WebApp from "@twa-dev/sdk";

export function hapticLight(): void {
  try {
    WebApp.HapticFeedback.selectionChanged();
  } catch {
    // Ignore outside Telegram
  }
}

export function hapticSuccess(): void {
  try {
    WebApp.HapticFeedback.notificationOccurred("success");
  } catch {
    // Ignore outside Telegram
  }
}

