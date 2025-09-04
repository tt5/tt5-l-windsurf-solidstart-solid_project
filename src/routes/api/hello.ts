import { eventHandler } from 'h3';

export default eventHandler((event) => {
  return { message: 'Hello from the API!' };
});
