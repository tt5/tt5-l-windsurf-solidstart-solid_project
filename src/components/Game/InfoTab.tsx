import { Component, Show } from 'solid-js';
import styles from './SidePanel.module.css';
import { GameStatus } from '../game/GameStatus';

type Notification = {
  id: string | number;
  message: string;
  timestamp: number;
  userId?: string;
  count?: number;
};

type InfoTabProps = {
  username: string;
  addedCount: number;
  deletedCount: number;
  totalBasePoints: () => number | null;
  oldestPrimeNotification: Notification | null;
};

const Counter: Component<{ value: number; label: string; type: 'added' | 'deleted' }> = (props) => (
  <div class={styles.counter}>
    <span class={`${styles.counterNumber} ${styles[props.type]}`}>
      {props.value}
    </span>
    <span class={styles.counterLabel}>{props.label}</span>
  </div>
);

const NotificationItem: Component<{ notification: Notification }> = (props) => (
  <div class={styles.notificationItem}>
    <div class={styles.notificationText}>{props.notification.message}</div>
    <div class={styles.notificationTime}>
      {new Date(props.notification.timestamp).toLocaleString()}
    </div>
  </div>
);

const InfoTab: Component<InfoTabProps> = (props) => (
  <div class={styles.infoTab}>
    <h3>Player: {props.username}</h3>
    
    <div class={styles.counters}>
      <Counter value={props.addedCount} label="Added" type="added" />
      <Counter value={props.deletedCount} label="Removed" type="deleted" />
    </div>

    <div class={styles.gameStatusContainer}>
      <GameStatus />
    </div>

    <Show when={props.totalBasePoints() !== null}>
      <p>Total base points: {props.totalBasePoints()}</p>
    </Show>

    <Show when={props.oldestPrimeNotification}>
      <div class={styles.notificationsSection}>
        <h4>Oldest Prime</h4>
        <NotificationItem notification={props.oldestPrimeNotification!} />
      </div>
    </Show>
  </div>
);

export default InfoTab;
