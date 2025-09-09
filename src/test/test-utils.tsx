import { render as solidRender, renderHook as solidRenderHook } from '@solidjs/testing-library';
import { Component, JSX, Show, createSignal, onMount } from 'solid-js';
import { Router } from '@solidjs/router';

/**
 * Client-side only wrapper to avoid SSR issues
 */
const ClientOnly: Component<{ children: JSX.Element }> = (props) => {
  const [mounted, setMounted] = createSignal(false);
  
  onMount(() => {
    setMounted(true);
  });

  return <Show when={mounted()}>{props.children}</Show>;
};

type ProviderProps = {
  children: JSX.Element;
};

/**
 * Creates a test provider with Router and client-side only rendering
 */
const createTestProviders = () => {
  return function Providers({ children }: ProviderProps) {
    return (
      <Router>
        <ClientOnly>
          {children}
        </ClientOnly>
      </Router>
    );
  };
};

type RenderOptions = {
  wrapper?: Component<{ children: JSX.Element }>;
  renderOptions?: Parameters<typeof solidRender>[1];
};

/**
 * Custom render function that wraps components with necessary providers
 */
export function render(
  ui: () => JSX.Element,
  { wrapper: Wrapper = createTestProviders(), ...options }: RenderOptions = {}
) {
  return solidRender(() => <Wrapper>{ui()}</Wrapper>, {
    // Default options
    hydrate: false, // Disable hydration for tests
    ...options.renderOptions
  });
}

/**
 * Custom renderHook function for testing hooks
 */
export function renderHook<T, P>(
  hook: (props: P) => T,
  options: Omit<RenderOptions, 'wrapper'> = {}
) {
  return solidRenderHook<T, P>(hook, {
    wrapper: createTestProviders(),
    ...options
  });
}

// Re-export everything from @solidjs/testing-library
export * from '@solidjs/testing-library';
