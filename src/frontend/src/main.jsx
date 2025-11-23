// Bootstraps the React app. This runs in dev build-time and is compiled during `npm run build`.
import ReactDOM from "react-dom/client";
import { MantineProvider } from '@mantine/core';
import App from "./App";
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <MantineProvider>
    <App />
  </MantineProvider>
);
