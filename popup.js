const slider = document.getElementById('blur-radius-slider');
const blurVal = document.getElementById('blur-val');

slider.addEventListener('input', (e) => {
  const val = e.target.value;
  blurVal.textContent = `${val}px`;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'UPDATE_BLUR_RADIUS',
        blurRadius: val
      });
    }
  });
});