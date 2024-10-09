// content.js

function addPopover(anchor, message, title) {

  // Extract additional metadata
  const contributors = message.author
    ? message.author
        .map((author) => {
          const given = author.given ? author.given : "";
          const family = author.family ? author.family : "";
          return `${given} ${family}`.trim();
        })
        .join(", ")
    : "Unknown";

  const publicationDate = message["published-print"]
    ? message["published-print"]["date-parts"][0].join("-")
    : message["published-online"]
    ? message["published-online"]["date-parts"][0].join("-")
    : "Unknown";

  const journal =
    message["container-title"] && message["container-title"].length > 0
      ? message["container-title"][0]
      : "Unknown";

  const license =
    message.license && message.license.length > 0
      ? message.license[0].URL
      : "Unknown";

  // Create a pop-over element
  const popover = document.createElement("div");
  popover.className = "doi-popover";
  popover.innerHTML = `
  <div class="popover-content">
    <strong>${title}</strong><br />
    <em>${journal}</em><br />
    Contributors: ${contributors}<br />
    Published: ${publicationDate}<br />
    License: <a href="${license}" target="_blank">${license}</a>
  </div>
`;

  // Initially hide the pop-over
  popover.style.display = "none";

  // Set ARIA role on the pop-over
  popover.setAttribute("role", "tooltip");
  popover.setAttribute("aria-hidden", "true");

  // Append the pop-over to the body
  document.body.appendChild(popover);

  // Function to show the pop-over
  function showPopover() {

    // Position the pop-over relative to the anchor
    const rect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    let top = rect.bottom + window.scrollY + 5;
    let left = rect.left + window.scrollX;

    // Adjust if pop-over goes beyond the viewport
    if (left + popoverRect.width > window.innerWidth) {
      left = window.innerWidth - popoverRect.width - 10; // 10px margin
    }

    if (top + popoverRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - popoverRect.height - 5; // Show above the anchor
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.display = "block";
    popover.setAttribute("aria-hidden", "false");
  }

  // Function to hide the pop-over
  function hidePopover() {
    popover.style.display = "none";
    popover.setAttribute("aria-hidden", "true");
  }

  // Flag to track whether the mouse is over the anchor or pop-over
  let isMouseOver = false;

  // Event listeners for the anchor
  anchor.addEventListener("mouseenter", () => {
    isMouseOver = true;
    showPopover();
  });

  anchor.addEventListener("mouseleave", () => {
    isMouseOver = false;
    // Delay hiding to see if mouse enters the pop-over
    setTimeout(() => {
      if (!isMouseOver) hidePopover();
    }, 200);
  });

  // Event listeners for the pop-over
  popover.addEventListener("mouseenter", () => {
    isMouseOver = true;
    showPopover();
  });

  popover.addEventListener("mouseleave", () => {
    isMouseOver = false;
    hidePopover();
  });

  // Event listeners for keyboard focus
  anchor.addEventListener("focus", () => {
    isMouseOver = true;
    showPopover();
  });

  anchor.addEventListener("blur", () => {
    isMouseOver = false;
    hidePopover();
  });
}

async function enhanceDOILinks(highlightEnabled) {

  // Regular expression to match DOI links (http/s dx/doi.org)
  const doiRegex =
    /(?:https?:\/\/)?(?:dx\.)?doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/g;

  // Get all anchor tags
  const anchors = document.querySelectorAll("a[href]");

  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");
    let match = doiRegex.exec(href);
    doiRegex.lastIndex = 0; // Reset regex index

    if (match) {
      const doi = match[1];

      try {
      
        // Fetch title from Crossref API
        const response = await fetch(
          `https://api.crossref.org/works/${encodeURIComponent(doi)}`
        );
        const data = await response.json();

        const title = data.message.title[0];

        // Create a screen reader-only link
        const srLink = document.createElement("a");
        srLink.href = href;
        srLink.textContent = title;
        srLink.className = "sr-only";

        // Modify the original link
        anchor.setAttribute("aria-hidden", "true");
        anchor.setAttribute("tabindex", "-1");

        // Insert the screen reader link before the original link
        anchor.parentNode.insertBefore(srLink, anchor);

        // Apply visual highlight if enabled
        if (highlightEnabled) {
          anchor.classList.add("doi-highlight");
        }

        // Add pop-over functionality
        // addPopover(anchor, data.message, title);
      } catch (error) {
        console.error(`Error fetching data for DOI ${doi}:`, error);
      }
    }
  }
}

// Check if the extension is enabled
chrome.storage.sync.get(["enabled", "highlight"], (result) => {
  if (result.enabled !== false) {
    const highlightEnabled = result.highlight === true;
    enhanceDOILinks(highlightEnabled);
  }
});
