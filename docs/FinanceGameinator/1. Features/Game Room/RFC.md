#GameRoom

This RFC contemplates two main points, the creation of the user rooms and the game room.
The initial iteration of this feature is designed with simplicity in mind.

## User Rooms

 The user rooms' primary objective is to empower the players with essential functionalities: viewing and managing their games comprehensively. This includes seamlessly joining existing games to continue their progress, initiating new games, inviting friends to join and participating in one game created by another player.

<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/70cea15a-834e-4d8f-8965-09a942f62897"/>

This screen is divided into three main sections, each of which will be discussed in detail below. Rather than delving into the intricacies of how the database will behave within these sections at this moment, a comprehensive explanation will be provided in the [[Execution Planning]] document.

### Player Games

This section serves as a hub for players, presenting a list of all the games in which they are currently involved or have created. Players will have the capability to seamlessly join games they are already a part of. Additionally, for games created by the players, the interface will allow them to exclude.

When a player decides to join a game from the presented list, they will be redirected to the Game Room, as present below:

<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/bf327e7b-351c-4702-a931-430293e6f64e"/>

The details about the Game Room will be provided in the [[#Game Room]] session.

### Create Game

When players choose to create a new game, an overlay screen will prompt them to enter a name for the new game. The primary objective is to offer a straightforward method for players to easily identify and locate this game at a later time. Additionally, the input provided by the players will undergo simple validation checks. After clicking the create button on the overlay screen, the creation request will be sent to the REST API, and the game will be stored in the database.

<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/4db29b4d-f633-481f-99b9-a93c0e77793b"/>

When players create a game, they automatically become the admin, granting them the ability to manage the game. Other players can join and participate in the game but do not have the authority to exclude or initiate the game. Once the game is created, players within the [[#Game Room]] will have visibility of the unique game room code, which can be shared with others. Using this code, additional players can  [[#Join the Game Room]], as detailed in the next section.

### Join the Game Room

When a player creates a game, others can join the game room by entering the provided game code through an overlay screen initiated by clicking the 'Join a game' button. This allows players to join as regular participants in a room administered by the player who created the game.

<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/56ece639-45e1-409a-a83a-81c76ba92bb5"/>


## Game Room

The game room feature enables players to assemble, organize, and invite others to join. Within the room, participants can view the list of all players, their connection status, and the admin has the authority to arrange the sequence of players in the game. Once all players are connected, the admin will be able to start the game. 

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/b05fbf1a-bf0b-43bd-a65d-9eac0c2f7d07"/>

The most challenging aspect of this screen lies in socket management, as the server must broadcast updates to all connected players whenever a new player joins or leaves. Additionally, events such as the admin reordering players or initiating the game trigger broadcasts to ensure all players are promptly informed of these changes.

All the details regarding the functioning of the socket and the interactions between DynamoDB and the socket will be explained in the [[Execution Planning]].

## Out of scope

Expanding on our previous discussion, this RFC centers on crafting a simple screen with essential features for players. Consequently, more intricate functionalities, like the [[Real-time User Room]], will not be included in this initial version. While real-time functionality for the Game Room is crucial at this stage, the development of Real-time User Room can be considered for future iterations.

Another functionality that will be deferred for the current phase is the removal of players from the game room. This feature will not be developed at this time, as other players can only join the room if they receive the shared code. The design ensures that unwelcome players cannot easily access the room. If for some reason it happened, the player can just create another room. Furthermore, in the future, we have the option to introduce an additional layer of security to the game room by implementing a password feature. This enhancement would provide an extra level of protection and control over access to the game room.
