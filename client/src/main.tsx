import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Include Remix Icon from CDN
const remixIconLink = document.createElement("link");
remixIconLink.rel = "stylesheet";
remixIconLink.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
document.head.appendChild(remixIconLink);

// Include Inter font from Google Fonts
const interFontLink = document.createElement("link");
interFontLink.rel = "stylesheet";
interFontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
document.head.appendChild(interFontLink);

createRoot(document.getElementById("root")!).render(<App />);
