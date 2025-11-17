// Bootstraps the React app. This runs in dev build-time and is compiled during `npm run build`.
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);
