
When a user logs in he can has not yet joined the game. To join the game he has to click the join game button. 

When a user clicks the leave game button he leaves the game.

When a user logs out he leaves the game.

When a user has not joined the game he can not add a base point. But he can move around. His starting point is the (0,0) point (top left corner of the viewport).

When a user joint the game he starts at his home starting point.

The home starting point is the point he gets assigned when he joins the game.

The home starting point is asigned the following way:
It is the point (-3, -2) away from the oldest base point (game_created_at_ms).
At the home starting point a new base point is created (for the user) with the special timestamp (game_created_at_ms) of the oldest prime timestamp minus one millisecond.
The oldest base point ((3,2) away from the home base point) is deleted.