import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SkyCollector } from "@/components/sky-collector/game";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <SkyCollector />
  </StrictMode>,
);
