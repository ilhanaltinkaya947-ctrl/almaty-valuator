import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f9457d06c4408e33bdf776fea7ae400d@o4510984328249344.ingest.de.sentry.io/4510984393654352",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
});
