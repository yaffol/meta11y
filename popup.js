// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const enableExtensionToggle = document.getElementById("enableExtension");
  const enableHighlightToggle = document.getElementById("enableHighlight");

  // Load the saved settings
  chrome.storage.sync.get(["enabled", "highlight"], (result) => {
    enableExtensionToggle.checked = result.enabled !== false;
    enableHighlightToggle.checked = result.highlight === true;

    // Remove the no-transitions class after rendering
    requestAnimationFrame(() => {
      body.classList.remove("no-transitions");
    });
  });

  // Listen for changes to the enable toggle
  enableExtensionToggle.addEventListener("change", () => {
    const isEnabled = enableExtensionToggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving enabled state:", chrome.runtime.lastError);
      } else {
        reloadCurrentTab();
      }
    });
  });

  // Listen for changes to the highlight toggle
  enableHighlightToggle.addEventListener("change", () => {
    const isHighlightEnabled = enableHighlightToggle.checked;
    chrome.storage.sync.set({ highlight: isHighlightEnabled  }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving enabled state:", chrome.runtime.lastError);
      } else {
        reloadCurrentTab();
      }
    });
  });

  function reloadCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  }
});
