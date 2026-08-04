import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LabsFullRiskGraphApp } from "./LabsFullRiskGraphApp";
import "./msc-risk-graph.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LabsFullRiskGraphApp />
  </StrictMode>
);
