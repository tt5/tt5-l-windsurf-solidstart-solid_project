import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

export default () => (
  <>
    <Title>Welcome</Title>
    <h1>Welcome</h1>
    <A href="/login">Login</A>
    <A href="/register">Register</A>
    <A href="/game">Game</A>
  </>
);
