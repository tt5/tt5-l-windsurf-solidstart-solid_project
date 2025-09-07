import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

export default () => (
  <>
    <Title>Welcome to Your App</Title>
    <h1>Welcome to Your App</h1>
    <A href="/login">Login</A>
    <A href="/register">Register</A>
    <A href="/game">Game</A>
  </>
);
