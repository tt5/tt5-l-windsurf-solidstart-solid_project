import { Component, Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '../../contexts/auth';
import Login from './Login';

const ProtectedRoute: Component<{ children: any }> = (props) => {
  const { user } = useAuth();

  return (
    <Show when={user()} fallback={<Navigate href="/" />}>
      {props.children}
    </Show>
  );
};

export default ProtectedRoute;
