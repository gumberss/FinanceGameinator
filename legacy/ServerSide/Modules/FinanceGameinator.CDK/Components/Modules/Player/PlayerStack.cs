using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.Lambda;
using Constructs;
using FinanceGameinator.CDK.Components.Cross;
using FinanceGameinator.CDK.Models;

namespace FinanceGameinator.CDK.Components.Modules.Player
{
    internal class PlayerStack : FinanceGameinatorStack
    {
        internal PlayerStack(Stack stack, Construct scope, IStackProps? props = null) : base(stack, scope, props)
        { }
        internal void RegisterPlayerStacks(RestApiStack restApiStack, CognitoStack cognitoStack, Table dbTable)
        {
            RegisterFunctions(restApiStack, cognitoStack, dbTable);
        }

        private void RegisterFunctions(RestApiStack restApiStack, CognitoStack cognitoStack, Table dbTable)
        {
            var playerResource = RegisterPlayerResource(restApiStack);
            var playerByIdReource = RegisterPlayerByIdResourcer(playerResource);

            RegisterGetPlayers(restApiStack, cognitoStack, playerByIdReource, dbTable);
            RegisterPlayersRegistration(restApiStack, cognitoStack, playerResource, dbTable);
        }

        private Amazon.CDK.AWS.APIGateway.Resource RegisterPlayerByIdResourcer(Amazon.CDK.AWS.APIGateway.Resource playersResource)
            => playersResource.AddResource("{id}", new ResourceOptions { });

        private Amazon.CDK.AWS.APIGateway.Resource RegisterPlayerResource(RestApiStack restApiStack)
            => restApiStack.RestApi.Root
               .AddResource("players", new ResourceOptions { });

        private Function RegisterPlayersRegistration(RestApiStack restApiStack
            , CognitoStack cognitoStack
            , Amazon.CDK.AWS.APIGateway.Resource playerResource
            , Table dbTable)
        {
            var lambda = new Function(Stack, "FinanceGameinatorRegisterPlayer", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                //assembly::Namespace.of.it::Function
                Handler = "FinanceGameinator.Players.Api::FinanceGameinator.Players.Api.Ports.HttpServer::Register",
                Code = Code.FromAsset("Modules/Players/FinanceGameinator.Players.Api/bin/Release/net6.0/publish/linux-x64"),
                Timeout = Duration.Seconds(15)
                //MemorySize = 256
            });

            dbTable.GrantWriteData(lambda);

            playerResource
                .AddResource("register")
                .AddMethod("POST", new LambdaIntegration(lambda, new LambdaIntegrationOptions
                {
                    Proxy = true
                }), cognitoStack.MethodAuthorizer());

            return lambda;
        }

        private Function RegisterGetPlayers(RestApiStack restApiStack
            , CognitoStack cognitoStack
            , Amazon.CDK.AWS.APIGateway.Resource playersByIdResource
            , Table dbTable)
        {
            var userDataLambda = new Function(Stack, "FinanceGameinatorPlayerData", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                //assembly::Namespace.of.it::Function
                Handler = "FinanceGameinator.Players.Api::FinanceGameinator.Players.Api.Ports.HttpServer::Get",
                Code = Code.FromAsset("Modules/Players/FinanceGameinator.Players.Api/bin/Release/net6.0/publish/linux-x64"),
                Timeout = Duration.Seconds(15)
                //MemorySize = 256
            });

            dbTable.GrantReadData(userDataLambda);

            playersByIdResource.AddMethod("GET", new LambdaIntegration(userDataLambda, new LambdaIntegrationOptions
            {
                Proxy = true
            }), cognitoStack.MethodAuthorizer());

            return userDataLambda;
        }
    }
}


