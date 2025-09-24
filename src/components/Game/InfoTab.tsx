import { Component, Show } from 'solid-js';
import styles from './SidePanel.module.css';
import { GameStatus } from '../game/GameStatus';

export interface Notification {
  id: string | number;
  message: string;
  timestamp: number;
  userId?: string;
  count?: number;
}

interface InfoTabProps {
  username: string;
  addedCount: number;
  deletedCount: number;
  totalBasePoints: () => number | null;
  oldestPrimeNotification: Notification | null;
}

const InfoTab: Component<InfoTabProps> = (props) => {
  return (
    <div class={styles.infoTab}>
      <h3>Player: {props.username}</h3>
      <div class={styles.notifications}>
        <h4>Activity Counters</h4>
        <div class={styles.counters}>
          <div class={styles.counter}>
            <span class={`${styles.counterNumber} ${styles.added}`}>{props.addedCount}</span>
            <span class={styles.counterLabel}>Added</span>
          </div>
          <div class={styles.counter}>
            <span class={`${styles.counterNumber} ${styles.deleted}`}>{props.deletedCount}</span>
            <span class={styles.counterLabel}>Removed</span>
          </div>
        </div>
        <div class={styles.tabContent}>
          <h3>Game Information</h3>
          <div class={styles.gameStatusContainer}>
            <GameStatus />
          </div>
          <Show when={props.totalBasePoints() !== null}>
            <p>Total base points: {props.totalBasePoints()}</p>
          </Show>
          
          {/* Oldest Prime Notification */}
          <Show when={props.oldestPrimeNotification}>
            <div class={styles.notificationsSection} style={{ 'margin-top': '1rem' }}>
              <h4>Oldest Prime Notification</h4>
              <div class={styles.notificationItem}>
                <div class={styles.notificationText}>
                  {props.oldestPrimeNotification?.message}
                </div>
                <div class={styles.notificationTime}>
                  {new Date(props.oldestPrimeNotification?.timestamp || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
