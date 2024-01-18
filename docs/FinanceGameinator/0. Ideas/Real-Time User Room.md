One possible idea for the future would be to make the player know which room have the admin inside, once the game can start only if the admin is inside the room. To do this, we can make the players join in the socket rooms of all they games and make the server inform data about each game when it is updated.



### Using Socket 

One possible idea involves sending the list of already connected players to a new player when they join the room. This way, the new player gets information about the existing participants.

Here's how you might approach this at a conceptual level:

1. **Server-Side Handling:**
    - Maintain a list of connected players on the server for each room.
    - When a new player joins, send them the list of existing players in that room.

1. **Client-Side Handling:**    
    - When a player joins the room, the server sends a message with the list of existing players.
    - The client, upon receiving this message, updates its user interface to display the names or information of the existing players.

1. **Updating the List in Real-Time:**    
    - Whenever a player joins or leaves the room, the server updates the list of connected players.
    - The server can then broadcast this updated list to all players in the room.

This way, each player joining the room is informed about the current state of the room, including the list of players already present.

In a more detailed implementation, you might use unique identifiers for each player, manage player states (e.g., online/offline), and handle various events like player disconnects gracefully to keep the list accurate. 
