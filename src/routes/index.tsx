import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import styles from "./index.module.css";

export default function Home() {
  return (
    <div class={styles.container}>
      <Title>Welcome to the Game</Title>
      <h1 class={styles.title}>Welcome to the Game</h1>
      
      <div class={styles.links}>
        <A href="/login" class={styles.link}>
          Login
        </A>
        <A href="/register" class={styles.link}>
          Create Account
        </A>
        <A href="/game" class={styles.link}>
          Enter Game
        </A>
        <A href="/api/admin/performance" class={styles.link}>
          Performance Metrics
        </A>
      </div>
    </div>
  );
}
