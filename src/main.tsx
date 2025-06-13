import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WelcomePage from "./Components/WelcomePage.tsx";
import Whiteboard from "./Components/Whiteboard.tsx";
import { UserProvider } from "./UserContext.tsx";
import "./App.scss";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <WelcomePage /> },
  { path: "whiteboard/:whiteboardId", element: <Whiteboard /> }
]);

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  </UserProvider>
);
