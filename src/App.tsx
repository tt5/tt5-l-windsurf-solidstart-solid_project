import { Suspense } from "solid-js";
import { A, Body, ErrorBoundary, FileRoutes, Head, Html, Meta, Routes, Scripts } from "solid-start";
import Navbar from "./components/Navbar/Navbar";

export default function App() {
  return (
    <Html lang="en">
      <Head>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://unpkg.com/tailwindcss@^2.0.0/dist/tailwind.min.css" rel="stylesheet" />
      </Head>
      <Body class="min-h-screen bg-gray-50">
        <Navbar />
        <main class="container mx-auto px-4 py-8">
          <Suspense>
            <ErrorBoundary>
              <Routes>
                <FileRoutes />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
        <Scripts />
      </Body>
    </Html>
  );
}
