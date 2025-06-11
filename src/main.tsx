import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WelcomePage from "./Components/WelcomePage.tsx";
import Whiteboard from "./Components/Whiteboard.tsx";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <WelcomePage /> },
  { path: "Whiteboard", element: <Whiteboard /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
