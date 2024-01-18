
To enable players to access their games, a request will be sent to the REST API outlined below. It's important to note that following step five, the flow will simply return the data obtained by the lambda function to the player:
<img src="https://github.com/gumberss/FinanceControlinator/assets/38296002/85e9b2d4-869a-4a9d-94bd-2e539b22c026"/>

The flow for all player actions within this screen will follow a similar pattern. Each action initiates from the app, traverses through the REST API, undergoes token validation by Cognito. Upon successful validation, the request is then redirected to the appropriate Lambda function responsible for handling the specific player-requested action. Subsequently, the Lambda function executes queries to DynamoDB to fulfill the requested action.


## Possible solutions
### user validation
#### Anonymous user
#### No user validation
#### Validation through Cognito
### Server-Side Architecture
#### Using EC2
#### Using Lambda
### Client-Side Architecture
