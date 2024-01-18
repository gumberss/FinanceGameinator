#GameRoom

This RFC contemplates two main points, the creation of the user rooms and the game room.
The initial iteration of this feature is designed with simplicity in mind.

## User Rooms

 The user rooms' primary objective is to empower the players with essential functionalities: viewing and managing their games comprehensively. This includes seamlessly joining existing games to continue their progress, initiating new games, inviting friends to join and participating in one game created by another player.

<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/70cea15a-834e-4d8f-8965-09a942f62897"/>

This screen is divided into three main sections, each of which will be discussed in detail below. Rather than delving into the intricacies of how the database will behave within these sections at this moment, a comprehensive explanation will be provided in the [[#Game Room]] section later in this document.

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







Once this is consider part of the main flow of the game, even it is the start point of the game, the main idea is to take out the advantages of the AWS DynamoDB replication, being part of the single table of the game.


## Out of scope

Building upon our earlier discussion, this RFC is focused on the creation of a straightforward screen that encapsulates essential features for players. As such, we will not be incorporating more intricate functionalities, such as the [[Real-time User Room]], at this stage. Integrating real-time features would necessitate active socket communication within this screen, introducing a level of complexity that we currently wish to avoid.
