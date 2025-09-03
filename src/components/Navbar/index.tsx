import { A } from "@solidjs/router";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav>
      <ul class={styles.nav}>
        <li><strong>tt5</strong></li>
        <li><A href="/">Home</A></li>
        <li><A href="/about">About</A></li>
        <li><A href="/links">Links</A></li>
        <li><A href="/game">Game</A></li>
      </ul>
    </nav>
  );
}
