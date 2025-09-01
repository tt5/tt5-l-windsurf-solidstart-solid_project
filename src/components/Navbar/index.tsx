import { A } from "@solidjs/router";

export default function Navbar() {
  return (
    <nav>
      <ul style={{
        display: 'flex',
        'list-style': 'none',
        padding: '1rem',
        gap: '1rem',
        'background-color': '#f0f0f0',
        margin: 0
      }}>
      <li><strong>tt5</strong></li>
        <li><A href="/">Home</A></li>
        <li><A href="/about">About</A></li>
        <li><A href="/links">Links</A></li>
        <li><A href="/game">Game</A></li>
      </ul>
    </nav>
  );
}
