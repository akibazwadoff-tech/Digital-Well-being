// BlurShield Popup Controller - Manifest V3
document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('masterToggle');
  const statusBadge = document.getElementById('statusBadge');
  const intensityRange = document.getElementById('intensityRange');
  const intensityVal = document.getElementById('intensityVal');
  const effectTypeSelect = document.getElementById('effectTypeSelect');
  const triggerSelect = document.getElementById('triggerSelect');
  
  const logosToggle = document.getElementById('logosToggle');
  const ytThumbToggle = document.getElementById('ytThumbToggle');
  const imagesToggle = document.getElementById('imagesToggle');
  const videoPlayToggle = document.getElementById('videoPlayToggle');
  const videoPauseToggle = document.getElementById('videoPauseToggle');

  const defaultSettings = {
    enabled: true,
    blurIntensity: 25,
    effectType: 'blur',
    unblurTrigger: 'hover',
    blurLogos: true,
    blurYouTubeAvatars: true,
    blurYouTubeThumbnails: true,
    blurBrowserImages: true,
    blurGoogleImages: true,
    blurVideosPlaying: true,
    blurVideosPaused: true,
    passwordLockEnabled: false,
    password: ''
  };

  let currentSettings = { ...defaultSettings };

  // Load Saved Settings
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(defaultSettings, (items) => {
      updateUI(items);
    });
  }

  function updateUI(settings) {
    currentSettings = { ...settings };
    masterToggle.checked = settings.enabled;
    statusBadge.textContent = settings.enabled ? '● Active' : '○ Disabled';
    statusBadge.className = settings.enabled ? 'badge-status' : 'badge-status disabled';

    intensityRange.value = settings.blurIntensity;
    intensityVal.textContent = settings.blurIntensity + 'px';

    effectTypeSelect.value = settings.effectType;
    triggerSelect.value = settings.unblurTrigger;

    if (logosToggle) logosToggle.checked = settings.blurLogos;
    ytThumbToggle.checked = settings.blurYouTubeThumbnails;
    imagesToggle.checked = settings.blurBrowserImages;
    videoPlayToggle.checked = settings.blurVideosPlaying;
    videoPauseToggle.checked = settings.blurVideosPaused;
  }

  function saveAndNotify() {
    const newSettings = {
      enabled: masterToggle.checked,
      blurIntensity: parseInt(intensityRange.value, 10),
      effectType: effectTypeSelect.value,
      unblurTrigger: triggerSelect.value,
      blurLogos: logosToggle ? logosToggle.checked : true,
      blurYouTubeAvatars: logosToggle ? logosToggle.checked : true,
      blurYouTubeThumbnails: ytThumbToggle.checked,
      blurBrowserImages: imagesToggle.checked,
      blurGoogleImages: imagesToggle.checked,
      blurVideosPlaying: videoPlayToggle.checked,
      blurVideosPaused: videoPauseToggle.checked
    };

    // Password Lock Enforcement when turning off
    if (!masterToggle.checked && currentSettings.passwordLockEnabled && currentSettings.password) {
      const inputPin = prompt('🔒 BlurShield Password Lock Active

Enter password or PIN to turn off shield:');
      if (inputPin !== currentSettings.password) {
        alert('❌ Incorrect Password / PIN. BlurShield remains ACTIVE.');
        masterToggle.checked = true;
        return;
      }
    }

    intensityVal.textContent = newSettings.blurIntensity + 'px';
    statusBadge.textContent = newSettings.enabled ? '● Active' : '○ Disabled';
    statusBadge.className = newSettings.enabled ? 'badge-status' : 'badge-status disabled';

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(newSettings, () => {
        // Broadcast to active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'SETTINGS_UPDATED',
              settings: newSettings
            }).catch(() => {});
          }
        });
      });
    }
  }

  // Bind Event Listeners
  [masterToggle, logosToggle, ytThumbToggle, imagesToggle, videoPlayToggle, videoPauseToggle].forEach(el => {
    if (el) el.addEventListener('change', saveAndNotify);
  });

  intensityRange.addEventListener('input', saveAndNotify);
  effectTypeSelect.addEventListener('change', saveAndNotify);
  triggerSelect.addEventListener('change', saveAndNotify);
});
