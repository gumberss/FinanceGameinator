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

### Player as partition key

Utilizing the player name as the partition key allows the database to consolidate all data related to a specific player in a single location. This design ensures easy retrieval of all information associated with a particular player. Beyond obtaining a list of games a player is part of, this strategy makes possible the retrieval of any information related to that player, as all data is conveniently grouped together in the database by using the same partition. The image below presents a example of how the table can designed:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/809537d3-151d-4bd1-833d-fa7a10a27a77"/>

To have more control, you can consider using the game ID as the sort key, allowing for better organization and specificity within the data:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/39e5975a-281a-44a1-ad0c-5b41e88e4cfa"/>

One trade-off with this solution is that the denormalization of game information, specifically adding the game name to the player partition key, requires the system to manually replicate the information. Whenever a player joins a game, the system must not only add the player to the game but also undertake an additional step of updating the player partition by adding the game information, in this case, the game name. And not only it, but if the game metadata that was replicated to the player partition is changed, the system must change the data for every player in the game, updating the data in each player partition This choice involves investing more write operations to optimize for reduced read operations.

To address the challenge of data replication, the system can opt for replicating the data using DynamoDB Streams. While the trade-off persists, replicating the data asynchronously through DynamoDB Streams allows the system to manage the process more effectively.

A final overview of how the table will work will be described in the image below:

<img src="https://github.com/gumberss/PurchaseListinator/assets/38296002/3ef6176b-4154-4c18-bfa2-04719ad140ce"/>

s. The primary advantage lies in the efficient retrieval of games associated with a player. By querying only one partition key (player#id) and utilizing a sort key beginning with games#, the system significantly reduces costs by minimizing the read capacity unit (RCU) expenditure required for data retrieval.

Another notable advantage of this approach is the ability to consolidate all player-related data within the same partition, eliminating the inclusion of extraneous data unrelated to the player's activities, such as data pertaining to the player during gameplay. This consolidation ensures that all player-related information is stored in a cohesive manner, free from out-of-context data.

 

## Possible solutions
### Database Architecture 

#### Global Secondary Index

A strategic solution involves leveraging the Global Secondary Index (GSI). The GSI is an additional index that you can create on a table. Unlike the primary key, which is used for the main table, a GSI allows you to query the data in the table using an alternate key, known as the index key. This provides more flexibility in querying the data, as you're not limited to the structure of the primary key.

By employing the GSI, we gain the flexibility to select a different partition and sort key to align with the specific query pattern required for the player room screen. In this scenario, the Primary Key (PK) for the GSI can be set as the original table's sort key, while the Sort Key (SK) can correspond to the original table's partition key. This strategic arrangement enables us to query data by providing only the sort key of the original table, as illustrated in the image below:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/eb59b8bf-ffe9-49de-b6ee-db8675b36d0e"/>

For the player room screen, we can efficiently retrieve the games in which a player is involved by querying the Global Secondary Index using the player name as the partition key and the sort key starting with 'Game#'. This targeted query allows us to obtain a list of games in which the player is actively participating.

If down the line the creation of a player screen is needed, we can take advantage of the DynamoDB replication, not only for the games but for all the data that have the player as the sort key. The image below illustrate the main idea:

<img src="https://github.com/gumberss/FinanceGameinator/assets/38296002/84856fbd-3ba6-40b7-bcd1-102628d983b6"/>

An important observation is that the player general data has both the partition and the sort key set to the same value. This design allows the system to access player data from both the index and the main table. In the event that a player screen is developed in the future, a straightforward query using the player id as the partition key in the index will retrieve all relevant data associated with that player.

The trade-off with this approach is that the combination of the Player#id as the partition key and the Game#id as the sort key doesn't provide the information about the game itself. This means that details such as the game name or other information specific to the game are not included in this particular database row, focusing solely on the player's data within the game.

There are two potential approaches to address this trade-off:

1. Retrieve the games ids for a particular player and, before presenting them on the screen, hydrate the game IDs with the corresponding game data.
2. Denormalize the game data, wherein the database replicates the game name for every player in the game. This would involve duplicating game information for each player, allowing for direct access to game details within each player's data row.

##### Hydrate game Ids

Given that player rooms persistently appear whenever the app is opened and the associated game data remains relatively stable, the usage pattern aligns with 'write once and read many'. Consequently, hydrating the data each time the screen is accessed may not be an optimal pattern, as it could result in consuming a significant number of Read Capacity Units (RCU).

##### Denormalization

Denormalization on the other hand can indeed take advantage of the RCU, because the data, for example the game name, will be write for each player, consuming more Write Capacity Unit (WCU) and less RCU, because the data is replicated for each player and it won't need to be hydrated, once the pattern is 'write once and read many' it would fit better.

##### Disadvantages

Denormalizing the game data within the player information could potentially compromise the intended meaning of the row. The row retrievable by the Partition Key (PK) as Game#id and the Sort Key (SK) as Player#id is designed to represent player-specific data within a game, rather than holding information meant for use outside of the game, such as in player rooms. 

Moreover, this pattern could potentially multiply for any additional information requiring retrieval by player#id, presenting challenges for long-term sustainability. For instance, if future requirements include displaying in player rooms the total number of players in a game or other game-related information, these details would also need to be replicated to the player registries and those data are not part of the player information for the game. This pattern potentially will be replicated for every entity in the future, that's why it's better to find the best solution possible at this moment.

While this drawback could potentially be mitigated by leveraging DynamoDB Accelerator (DAX), it does come with an increased cost to the solution. This is because the DAX cluster maintains an in-memory cache of the data when queried.

#### Other possible solutions 

All the other possible solutions considered for this architecture were described in the [[Decision Matrix]] 


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

### References

[Many to Many Relation in DynamoDB](https://kaushiknp.medium.com/many-to-many-relation-in-dynamodb-8e948ed38d8d)

[Best practices for managing many-to-many relationships](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-adjacency-graphs.html)

[How to handle many to many in DynamoDB](https://stackoverflow.com/questions/48537284/how-to-handle-many-to-many-in-dynamodb)

[Dynamodb single table structure for Many to many relation](https://stackoverflow.com/questions/65763721/dynamodb-single-table-structure-for-many-to-many-relation)