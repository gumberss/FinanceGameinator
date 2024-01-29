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

        private Function RegisterFunctions(RestApiStack restApiStack, CognitoStack cognitoStack, Table dbTable)
        {
            var userDataLambda = new Function(Stack, "FinanceGameinatorPlayerData", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                //assembly::Namespace.of.it::Function
                Handler = "FinanceGameinator.Players.Api::FinanceGameinator.Players.Api.Ports.HttpServer::Get",
                Code = Code.FromAsset("Modules/Players/FinanceGameinator.Players.Api/bin/Release/net6.0/publish/linux-x64"),
                //MemorySize = 256\bin\Release\net6.0\publish\linux-x64
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


