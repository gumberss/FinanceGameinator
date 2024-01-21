## General Architecture

To enable players to access their games, a request will be sent to the REST API outlined below. It's important to note that following step five, the flow will simply return the data obtained by the lambda function to the player:

<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/85e9b2d4-869a-4a9d-94bd-2e539b22c026"/>

The flow for all player actions within this screen will follow a similar pattern. Each action initiates from the app, traverses through the REST API, undergoes token validation by Cognito. Upon successful validation, the request is then redirected to the appropriate Lambda function responsible for handling the specific player-requested action. Subsequently, the Lambda function executes queries to DynamoDB to fulfill the requested action.

## Database Architecture

Once Game Room is consider part of the main flow of the game, even it is the start point of the game, the main idea is to take out the advantages of the AWS DynamoDB replication, being part of the single table of the game.

The primary concept involves partitioning the database based on the game ID. This approach groups all data related to each game together, simplifying the retrieval process during gameplay. To implement this, the game ID will serve as the partition key in the database. Additionally, the sort key can function as a data identifier, streamlining the retrieval of specific items from the database. The table below illustrates a simplified representation of the database table structure. 

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/a44759c8-8df4-40be-b6cb-1c7af3611c03"/>

Building upon the earlier illustration, the structured database allows for specific queries to efficiently retrieve data. For instance:

- Given a game, retrieve all information about it.
- Given a game, fetch the configuration details of the game.
- Given a game, obtain the list of players associated with it.

This design optimizes the database for targeted queries, enhancing the speed and precision of data retrieval based on different game-related parameters.

On the flip side, for the player rooms screen, it is crucial to provide information about the games that a particular player is currently a part of to provide the visibility functionality for the players about their active game engagements, facilitating a seamless and personalized user experience. 

The challenge arises from DynamoDB's requirement for queries to include the partition key, adding complexity to the process. However, we can overcome with some strategies:

### Global Secondary Index

A strategic solution involves leveraging the Global Secondary Index (GSI). The GSI is an additional index that you can create on a table. Unlike the primary key, which is used for the main table, a GSI allows you to query the data in the table using an alternate key, known as the index key. This provides more flexibility in querying the data, as you're not limited to the structure of the primary key.

By employing the GSI, we gain the flexibility to select a different partition and sort key to align with the specific query pattern required for the player room screen. In this scenario, the Primary Key (PK) for the GSI can be set as the original table's sort key, while the Sort Key (SK) can correspond to the original table's partition key. This strategic arrangement enables us to query data by providing only the sort key of the original table, as illustrated in the image below:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/eb59b8bf-ffe9-49de-b6ee-db8675b36d0e"/>

For the player room screen, we can efficiently retrieve the games in which a player is involved by querying the Global Secondary Index using the player name as the partition key and the sort key starting with 'Game#'. This targeted query allows us to obtain a list of games in which the player is actively participating.

If down the line the creation of a player screen is needed, we can take advantage of the DynamoDB replication, not only for the games but for all the data that have the player as the sort key. The image below illustrate the main idea:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/84856fbd-3ba6-40b7-bcd1-102628d983b6"/>

An important observation is that the player general data has both the partition and the sort key set to the same value. This design allows the system to access player data from both the index and the main table. In the event that a player screen is developed in the future, a straightforward query using the player id as the partition key in the index will retrieve all relevant data associated with that player.



## Possible solutions
### Database Architecture 
### Player as partition key

Utilizing the player name as the partition key allows the database to consolidate all data related to a specific player in a single location. This design ensures easy retrieval of all information associated with a particular player. Beyond obtaining a list of games a player is part of, this strategy makes possible the retrieval of any information related to that player, as all data is conveniently grouped together in the database. The image below presents a example of how the table can designed:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/809537d3-151d-4bd1-833d-fa7a10a27a77"/>

To have more control, you can consider using the game ID as the sort key, allowing for better organization and specificity within the data:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/39e5975a-281a-44a1-ad0c-5b41e88e4cfa"/>

If a user screen is proposed down the line, it can be seamlessly created with additional data elements such as badges, player levels, and a comprehensive list of games the player is part of. This design allows for the retrieval of all relevant data in a single request to the database, achieved by querying with the partition key (player#id).

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/e09e3ad2-5dd2-4d83-9a6f-c442269492ab"/>

One disadvantage with this approach is that we won't fully leverage the advantages of DynamoDB replication. For each game creation, both the game#id partition and the Player#id partition need to be created, with game#id serving as the sort key in the latter. This introduces some more writes and management in terms of data creation.


### user validation
#### Anonymous user
#### No user validation
#### Validation through Cognito
##### Using Cognito screen
##### Create the Screens
### Server-Side Architecture
#### Using EC2
#### Using Lambda
### Client-Side Architecture
