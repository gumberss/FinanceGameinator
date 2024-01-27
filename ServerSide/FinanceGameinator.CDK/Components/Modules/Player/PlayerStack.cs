using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK;
using Constructs;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.APIGateway;
using FinanceGameinator.CDK.Models;
using FinanceGameinator.CDK.Components.Cross;

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

        private Function RegisterFunctions(RestApiStack restApiStack, CognitoStack cognitoStack, Table dbTable)
        {
            var userDataLambda = new Function(Stack, "FinanceGameinatorPlayerData", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                //assembly::Namespace.of.it::Function
                Handler = "FinanceGameinator.Players.Api::FinanceGameinator.Players.Api.Ports.HttpServer::Get",
                Code = Code.FromAsset("FinanceGameinator.Players.Api/bin/Release/net6.0")
            });

            dbTable.GrantReadData(userDataLambda);

            var playersResource = restApiStack.RestApi.Root
                .AddResource("players", new ResourceOptions { });

            var playersById = playersResource.AddResource("{id}", new ResourceOptions { });

            playersById.AddMethod("GET", new LambdaIntegration(userDataLambda, new LambdaIntegrationOptions
            {
                Proxy = true
            }), cognitoStack.MethodAuthorizer());

            return userDataLambda;
        }
    }
}


