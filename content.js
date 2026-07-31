// Aegis Visual Safety Guard - Chrome Extension Content Script
// Injects physical backdrop-filter blur masks directly on top of DOM elements
(function() {
  console.log("🛡️ [Aegis] Content script active on target DOM");
  let blurRadius = 15;

  // Injects DOM blur overlays
  window.AegisInjectBlurMasks = function(detections) {
    // Remove existing masks
    document.querySelectorAll('.aegis-dom-blur-mask').forEach(el => el.remove());

    detections.forEach((det) => {
      const [ymin, xmin, ymax, xmax] = det.box_2d;
      const mask = document.createElement('div');
      mask.className = 'aegis-dom-blur-mask';

      mask.style.position = 'fixed';
      mask.style.top = (ymin / 10) + 'vh';
      mask.style.left = (xmin / 10) + 'vw';
      mask.style.width = ((xmax - xmin) / 10) + 'vw';
      mask.style.height = ((ymax - ymin) / 10) + 'vh';
      mask.style.backdropFilter = `blur(${blurRadius}px)`;
      mask.style.webkitBackdropFilter = `blur(${blurRadius}px)`;
      mask.style.backgroundColor = 'rgba(0, 0, 0, 0.35)';
      mask.style.border = '2px solid #00FF66';
      mask.style.borderRadius = '4px';
      mask.style.boxShadow = '0 0 12px rgba(0, 255, 102, 0.5)';
      mask.style.zIndex = '9999999';
      mask.style.pointerEvents = 'none';

      // Badge
      const badge = document.createElement('div');
      badge.textContent = `🛡️ [BLURRED] ${det.label.toUpperCase()}`;
      badge.style.position = 'absolute';
      badge.style.top = '-20px';
      badge.style.left = '0';
      badge.style.background = '#00FF66';
      badge.style.color = '#000';
      badge.style.fontSize = '9px';
      badge.style.fontWeight = 'bold';
      badge.style.fontFamily = 'monospace';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '3px';

      mask.appendChild(badge);
      document.body.appendChild(mask);
    });
  };

  // Listen for blur radius slider messages from popup
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'UPDATE_BLUR_RADIUS') {
      blurRadius = request.blurRadius;
      document.querySelectorAll('.aegis-dom-blur-mask').forEach(m => {
        m.style.backdropFilter = `blur(${blurRadius}px)`;
        m.style.webkitBackdropFilter = `blur(${blurRadius}px)`;
      });
    }
  });
})();