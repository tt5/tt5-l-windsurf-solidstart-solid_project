import { Component } from 'solid-js';

type WelcomeProps = {
  name?: string;
};

const Welcome: Component<WelcomeProps> = (props) => {
  return (
    <div class="welcome">
      <h1>Welcome{props.name ? `, ${props.name}` : ''}!</h1>
      <p>Thank you for visiting our application.</p>
    </div>
  );
};

export default Welcome;
