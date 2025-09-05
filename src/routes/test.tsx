import { Title } from "@solidjs/meta";
import { onMount } from 'solid-js';

export default function TestPage() {
  onMount(() => {
    console.log('TestPage - Mounted');
  });

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#e0f7fa',
      border: '3px solid #00bcd4',
      borderRadius: '8px',
      margin: '40px auto',
      maxWidth: '600px',
      textAlign: 'center',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <Title>Test Page</Title>
      <div>Test Page Rendered Successfully!</div>
      <div style={{ marginTop: '20px', fontSize: '16px' }}>
        Current Time: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
