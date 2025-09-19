``` ts
import { jumpToPosition } from '~/lib/utils/navigation';

// Somewhere in your code
const result = await jumpToPosition(10, 20);
if (result) {
  console.log('New position:', result.position);
  console.log('Restricted squares:', result.restrictedSquares);
}
```


``` ts
import { useNavigation } from '~/lib/utils/navigation';

function MyComponent() {
  const { jumpToPosition, fetchRestrictedSquares } = useNavigation();
  
  const handleJump = async () => {
    const result = await jumpToPosition(30, 40);
    if (result) {
      // Handle the position update and restricted squares
      updateRestrictedSquares(result.restrictedSquares);
    }
  };
  
  // Or fetch restricted squares separately
  const handleFetchSquares = async (position: Point) => {
    const squares = await fetchRestrictedSquares(position);
    if (squares) {
      updateRestrictedSquares(squares);
    }
  };
  
  // ...
}
```