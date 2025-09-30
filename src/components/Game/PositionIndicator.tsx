import { usePlayerPosition } from '~/contexts/PlayerPositionContext';
import styles from './PositionIndicator.module.css';

export default function PositionIndicator() {
  const { position } = usePlayerPosition();
  
  return (
    <div class={styles.positionIndicator}>
      Position: ({position()?.[0] ?? 0}, {position()?.[1] ?? 0})
    </div>
  );
}
