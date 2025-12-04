/**
 * OpenPulse Analytics Tracker
 * Lightweight, privacy-friendly tracking script
 * < 4KB minified
 */
(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    BATCH_SIZE: 10,
    BATCH_TIMEOUT: 5000, // 5 seconds
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second base delay
    COLLECTOR_URL: window.OPENPULSE_COLLECTOR_URL || "/api/collect",
  };

  // State
  let eventQueue = [];
  let batchTimer = null;
  let sessionId = null;
  let lastActivity = Date.now();

  // Get project ID from script tag
  function getProjectId() {
    const script = document.currentScript || document.querySelector('script[data-project]');
    return script?.getAttribute("data-project") || null;
  }

  // Generate or retrieve session ID
  function getSessionId() {
    if (sessionId) return sessionId;

    // Try localStorage first
    const stored = localStorage.getItem("_op_session");
    const storedData = stored ? JSON.parse(stored) : null;

    if (storedData && Date.now() - storedData.lastActivity < CONFIG.SESSION_TIMEOUT) {
      sessionId = storedData.sessionId;
      lastActivity = storedData.lastActivity;
      return sessionId;
    }

    // Generate new session ID
    sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    lastActivity = Date.now();
    localStorage.setItem("_op_session", JSON.stringify({ sessionId, lastActivity }));

    // Also set cookie for server-side access
    document.cookie = `_op_session=${sessionId}; path=/; max-age=${CONFIG.SESSION_TIMEOUT / 1000}`;

    return sessionId;
  }

  // Check if session expired
  function isSessionExpired() {
    const now = Date.now();
    if (now - lastActivity > CONFIG.SESSION_TIMEOUT) {
      sessionId = null;
      localStorage.removeItem("_op_session");
      return true;
    }
    lastActivity = now;
    return false;
  }

  // Collect page data
  function collectPageData() {
    return {
      url: window.location.href,
      referrer: document.referrer || undefined,
      title: document.title || undefined,
      userAgent: navigator.userAgent,
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Respect Do Not Track
  function shouldTrack() {
    if (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes") {
      return false;
    }
    return true;
  }

  // Send events to collector
  async function sendEvents(events, attempt = 0) {
    if (!shouldTrack()) return;

    try {
      const response = await fetch(CONFIG.COLLECTOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(events),
        keepalive: true, // Important for page unload
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Success - clear queue
      eventQueue = eventQueue.filter((e) => !events.includes(e));
    } catch (error) {
      // Retry logic with exponential backoff
      if (attempt < CONFIG.RETRY_ATTEMPTS) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        setTimeout(() => sendEvents(events, attempt + 1), delay);
      } else {
        // Failed after retries - keep in queue for next batch
        console.warn("OpenPulse: Failed to send events after retries");
      }
    }
  }

  // Process event queue
  function processQueue() {
    if (eventQueue.length === 0) return;

    // Clear timer
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }

    // Send batch
    const batch = eventQueue.splice(0, CONFIG.BATCH_SIZE);
    sendEvents(batch);

    // Schedule next batch if queue not empty
    if (eventQueue.length > 0) {
      scheduleBatch();
    }
  }

  // Schedule batch send
  function scheduleBatch() {
    if (batchTimer) return;

    batchTimer = setTimeout(() => {
      processQueue();
    }, CONFIG.BATCH_TIMEOUT);
  }

  // Track pageview
  function trackPageview() {
    if (!shouldTrack()) return;

    const projectId = getProjectId();
    if (!projectId) {
      console.warn("OpenPulse: Project ID not found");
      return;
    }

    // Check session
    if (isSessionExpired()) {
      getSessionId(); // Create new session
    } else {
      getSessionId(); // Update activity
    }

    const pageData = collectPageData();

    const event = {
      projectId,
      sessionId: getSessionId(),
      url: pageData.url,
      referrer: pageData.referrer,
      title: pageData.title,
      userAgent: pageData.userAgent,
      screenWidth: pageData.screenWidth,
      screenHeight: pageData.screenHeight,
      timezone: pageData.timezone,
    };

    eventQueue.push(event);

    // Update session activity
    lastActivity = Date.now();
    const stored = localStorage.getItem("_op_session");
    if (stored) {
      const storedData = JSON.parse(stored);
      storedData.lastActivity = lastActivity;
      localStorage.setItem("_op_session", JSON.stringify(storedData));
    }

    // Schedule batch send
    if (eventQueue.length >= CONFIG.BATCH_SIZE) {
      processQueue();
    } else {
      scheduleBatch();
    }
  }

  // Handle SPA navigation (History API)
  function handleSPANavigation() {
    let lastUrl = window.location.href;

    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(trackPageview, 0);
      }
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(trackPageview, 0);
      }
    };

    // Listen for popstate
    window.addEventListener("popstate", () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        trackPageview();
      }
    });
  }

  // Handle page visibility (don't track when hidden)
  function handleVisibilityChange() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Page became visible - check session
        if (isSessionExpired()) {
          getSessionId();
        }
      }
    });
  }

  // Send remaining events on page unload
  function handlePageUnload() {
    // Use sendBeacon for reliability
    if (eventQueue.length > 0 && navigator.sendBeacon) {
      const events = eventQueue.splice(0);
      const blob = new Blob([JSON.stringify(events)], { type: "application/json" });
      navigator.sendBeacon(CONFIG.COLLECTOR_URL, blob);
    } else {
      // Fallback to sync fetch (may be cancelled)
      if (eventQueue.length > 0) {
        const events = eventQueue.splice(0);
        sendEvents(events);
      }
    }
  }

  // Initialize
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        trackPageview();
        handleSPANavigation();
        handleVisibilityChange();
      });
    } else {
      trackPageview();
      handleSPANavigation();
      handleVisibilityChange();
    }

    // Handle page unload
    window.addEventListener("beforeunload", handlePageUnload);
    window.addEventListener("pagehide", handlePageUnload);
  }

  // Start tracking
  init();

  // Expose API for manual tracking (optional)
  window.OpenPulse = {
    track: trackPageview,
    getSessionId: getSessionId,
  };
})();

