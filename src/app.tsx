import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { AuthProvider } from "./contexts/auth";

export default function App() {
  return (
    <Router root={props => (
      <MetaProvider>
        <AuthProvider>
          <Suspense>{props.children}</Suspense>
        </AuthProvider>
      </MetaProvider>
    )}>
      <FileRoutes />
    </Router>
  );
}