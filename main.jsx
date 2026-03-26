import React from "react";
import { createRoot } from "react-dom/client";
import App from "./onelinejournal.jsx";

const rootEl = document.getElementById("root");

function showFatal(errorLike) {
  const message =
    errorLike instanceof Error
      ? `${errorLike.name}: ${errorLike.message}`
      : typeof errorLike === "string"
        ? errorLike
        : JSON.stringify(errorLike, null, 2);

  if (!rootEl) return;
  rootEl.innerHTML = "";
  const panel = document.createElement("pre");
  panel.style.whiteSpace = "pre-wrap";
  panel.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  panel.style.fontSize = "13px";
  panel.style.lineHeight = "1.5";
  panel.style.margin = "24px";
  panel.style.padding = "16px";
  panel.style.borderRadius = "10px";
  panel.style.background = "#1b1b1b";
  panel.style.color = "#ffb4b4";
  panel.style.border = "1px solid #5a2a2a";
  panel.textContent = `Runtime error:\n${message}`;
  rootEl.appendChild(panel);
}

window.addEventListener("error", (event) => {
  showFatal(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showFatal(event.reason);
});

if (!rootEl) {
  throw new Error("Missing #root element in index.html");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
