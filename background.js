/**
 * BlurShield Background Service Worker - Manifest V3
 */

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  const defaultSettings = {
    enabled: true,
    blurIntensity: 25,
    effectType: 'blur',
    unblurTrigger: 'hover',
    blurYouTubeThumbnails: true,
    blurYouTubeVideoPlayer: true,
    blurYouTubeAvatars: false,
    blurGoogleImages: true,
    blurBrowserImages: true,
    blurVideosPlaying: true,
    blurVideosPaused: true,
    showBlurBadge: true,
    muteAudioWhenBlurred: false,
    whitelistDomains: ['example.com'],
    customCSSSelectors: []
  };

  chrome.storage.sync.set(defaultSettings, () => {
    console.log('[BlurShield] Extension installed & default settings initialized.');
  });

  // Setup Context Menus
  chrome.contextMenus.create({
    id: "blurshield-toggle",
    title: "🛡️ Toggle BlurShield on this site",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "blurshield-unblur-temp",
    title: "👁️ Temporarily Reveal Media (5s)",
    contexts: ["all"]
  });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === "blurshield-toggle") {
    chrome.storage.sync.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.sync.set({ enabled: newState });
      
      chrome.tabs.sendMessage(tab.id, {
        action: 'TOGGLE_MASTER'
      }).catch(() => {});
    });
  }
});

// Handle Keyboard Commands (Alt+Shift+B)
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-blur") {
    chrome.storage.sync.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.sync.set({ enabled: newState });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'TOGGLE_MASTER'
          }).catch(() => {});
        }
      });
    });
  }
});
