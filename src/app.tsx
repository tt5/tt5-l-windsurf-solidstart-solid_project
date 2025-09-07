import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { AuthProvider } from "./contexts/auth";
import { DevTools } from "./components/DevTools/DevTools";

export default () => (
  <Router root={props => (
    <MetaProvider>
      <AuthProvider>
        <Suspense>
          {props.children}
          <DevTools />
        </Suspense>
      </AuthProvider>
    </MetaProvider>
  )}>
    <FileRoutes />
  </Router>
);