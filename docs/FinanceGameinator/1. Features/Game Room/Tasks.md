
### Link Players with Cognito
- [ ] Decide how to do it

### Player Details

- [ ] Create the player details screen
- [ ] Request player details data
- [ ] Present the player data to the player
- [ ] Create the create game button
	- [x] Create the create game overlay
	- [x] Make the create button open the overlay
	- [ ] Request the server side to create the game
- [ ] Create the endpoint for creating the game
	- [ ] Create the CDK for this new endpoint
	- [ ] Generate a random code for the game
	- [ ] Create the game on the database (Game#RandomCode)
	- [ ] Add the creator player as admin to the game
	- [ ] Add the game to the player partition (player#id Game#id) with the game name
	- [ ] Redirect the player to the game room screen
- [ ] Create the join game button
	- [x] Create the join game overlay
	- [x] Make the join game button open the overlay
	- [ ] Request the server side to join the game
- [ ] Create the endpoint for joining a game 
	- [ ] Find the game by code (Game#Code)
		- [ ] If exists, add the player to the game
		- [ ] If not exists, return an error
	- [ ] Add the player to the game 
		- [ ] Add the money for the player
	- [ ] Add the game to the player partition
	- [ ] Return the game metadata
	- [ ] Redirect the player to the game room

### Game room

#### Screen opened by game created
- [ ]  [[#^4cdf7f|Connect to the socket room]]

#### Screen opened by joined to a game
- [ ]  [[#^4cdf7f|Connect to the socket room]]

#### Connect to the socket room ^4cdf7f

- [ ] Connect to the game room socket room
- [ ] Publish the request to join event 
- [ ] Server add to the player the socket id 
- [ ] Server broadcast player joined
- [ ] Receive its own player joined event 
	- [ ] Popup a joined with success
	- [ ] Change its own icon to connected
- [ ] Other Players receive the joined event
	- [ ] Change the player that joined icon to connected

#### On Game Started
- [ ] Add the game metadata to the players 
- [ ] Publish the Game started event
- [ ] 

#### On Connected


#### On Disconnected
- [ ] Find the player by socket id
- [ ] Broadcast the player disconnected


