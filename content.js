/**
 * BlurShield Content Script - Manifest V3
 * Handles dynamic DOM Mutation Observer, Video state tracking, YouTube thumbnail shielding, and settings sync.
 */

(function() {
  'use strict';

  let currentSettings = {
    enabled: true,
    blurIntensity: 25,
    effectType: 'blur',
    unblurTrigger: 'hover',
    unblurVideoOnHover: false,
    unblurVideoOnClick: false,
    requireAltClickForVideo: true,
    blurYouTubeThumbnails: true,
    blurYouTubeVideoPlayer: true,
    blurYouTubeAvatars: true,
    blurLogos: true,
    blurGoogleImages: true,
    blurBrowserImages: true,
    blurVideosPlaying: true,
    blurVideosPaused: true,
    showBlurBadge: true,
    muteAudioWhenBlurred: false,
    whitelistDomains: [],
    customCSSSelectors: []
  };

  // Check if current hostname is whitelisted
  function isWhitelisted() {
    const host = window.location.hostname;
    return currentSettings.whitelistDomains.some(domain => domain && host.includes(domain.trim()));
  }

  // Apply settings to document body classes & CSS vars
  function applySettingsToDOM() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', applySettingsToDOM);
      return;
    }

    const isEnabled = currentSettings.enabled && !isWhitelisted();
    const classList = document.body.classList;

    // Reset base classes
    classList.toggle('blurshield-enabled', isEnabled);
    
    // FX types
    ['blur', 'pixelate', 'grayscale', 'darken'].forEach(fx => {
      classList.toggle('blurshield-fx-' + fx, isEnabled && currentSettings.effectType === fx);
    });

    // Unblur trigger classes
    classList.toggle('blurshield-unblur-hover', isEnabled && currentSettings.unblurTrigger === 'hover');
    classList.toggle('blurshield-video-unblur-hover', isEnabled && currentSettings.unblurVideoOnHover);

    // Feature specific toggles
    const isYouTube = window.location.hostname.includes('youtube.com');
    const isGoogleImages = window.location.hostname.includes('google.') && window.location.href.includes('tbm=isch');

    classList.toggle('blurshield-yt-thumb-on', isEnabled && isYouTube && currentSettings.blurYouTubeThumbnails);
    classList.toggle('blurshield-yt-avatar-on', isEnabled && isYouTube && (currentSettings.blurYouTubeAvatars || currentSettings.blurLogos));
    classList.toggle('blurshield-logos-on', isEnabled && (currentSettings.blurLogos || currentSettings.blurYouTubeAvatars));
    classList.toggle('blurshield-img-on', isEnabled && (isGoogleImages ? currentSettings.blurGoogleImages : currentSettings.blurBrowserImages));
    classList.toggle('blurshield-video-playing-on', isEnabled && currentSettings.blurVideosPlaying);
    classList.toggle('blurshield-video-paused-on', isEnabled && currentSettings.blurVideosPaused);

    // Set blur pixel amount
    document.documentElement.style.setProperty('--blurshield-amount', currentSettings.blurIntensity + 'px');

    // Scan media elements
    processMediaElements();
  }

  // Process video players and image badges
  function processMediaElements() {
    if (!currentSettings.enabled || isWhitelisted()) return;

    // Process Video tags
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (!video.dataset.blurshieldInit) {
        video.dataset.blurshieldInit = 'true';
        
        // Track pause/play states
        video.addEventListener('pause', () => video.classList.add('blurshield-paused'));
        video.addEventListener('play', () => video.classList.remove('blurshield-paused'));
        video.addEventListener('playing', () => video.classList.remove('blurshield-paused'));
        
        if (video.paused) {
          video.classList.add('blurshield-paused');
        }

        // Click-to-toggle unblur
        if (currentSettings.unblurTrigger === 'click') {
          video.addEventListener('click', (e) => {
            if (e.altKey || e.shiftKey) {
              video.classList.toggle('blurshield-click-unblurred');
            }
          });
        }
      }

      // Handle Audio Mute when blurred option
      if (currentSettings.muteAudioWhenBlurred && currentSettings.blurVideosPlaying && !video.paused) {
        const isHovered = video.matches(':hover');
        const isClickUnblurred = video.classList.contains('blurshield-click-unblurred');
        video.muted = !(isHovered || isClickUnblurred);
      }
    });

    // YouTube Thumbnail badges
    if (currentSettings.showBlurBadge && currentSettings.blurYouTubeThumbnails && window.location.hostname.includes('youtube.com')) {
      const thumbCards = document.querySelectorAll('ytd-thumbnail:not(.blurshield-badged), #thumbnail:not(.blurshield-badged)');
      thumbCards.forEach(card => {
        card.classList.add('blurshield-badged');
        card.classList.add('blurshield-badge-container');
        
        const badge = document.createElement('div');
        badge.className = 'blurshield-badge';
        badge.innerHTML = '🛡️ Blurred';
        card.appendChild(badge);
      });
    }
  }

  // MutationObserver for dynamic YouTube SPA & infinity scroll loading
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      processMediaElements();
    }
  });

  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      applySettingsToDOM();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        applySettingsToDOM();
      });
    }
  }

  // Storage Sync & Message Listeners
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(currentSettings, (items) => {
      currentSettings = Object.assign({}, currentSettings, items);
      applySettingsToDOM();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        for (let key in changes) {
          currentSettings[key] = changes[key].newValue;
        }
        applySettingsToDOM();
      }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'SETTINGS_UPDATED') {
        currentSettings = Object.assign({}, currentSettings, request.settings);
        applySettingsToDOM();
        sendResponse({ status: 'OK' });
      } else if (request.action === 'TOGGLE_MASTER') {
        currentSettings.enabled = !currentSettings.enabled;
        chrome.storage.sync.set({ enabled: currentSettings.enabled });
        applySettingsToDOM();
        sendResponse({ enabled: currentSettings.enabled });
      }
    });
  } else {
    // Web environment fallback
    startObserver();
  }

  startObserver();
})();
