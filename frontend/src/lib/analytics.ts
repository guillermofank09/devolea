const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initAnalytics(): void {
  if (!GA_ID) return;

  window.dataLayer = window.dataLayer || [];
  // Must use `arguments` (not rest params) — GA4 dataLayer requires IArguments, not Array
  window.gtag = function gtag() { window.dataLayer.push(arguments); } as typeof window.gtag;
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string, title?: string): void {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
  });
}
