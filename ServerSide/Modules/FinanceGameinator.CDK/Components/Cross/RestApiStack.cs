using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Lambda;
using Constructs;
using FinanceGameinator.CDK.Models;

namespace FinanceGameinator.CDK.Components.Cross
{
    internal class RestApiStack : FinanceGameinatorStack
    {
        public LambdaRestApi RestApi { get; }

        internal RestApiStack(Stack stack, Construct scope, IStackProps? props = null) : base(stack, scope, props)
        {
            var notFoundPathLambda = new Function(Stack, "FinanceGameinatorDefaultLambdaFunction", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                //assembly::Namespace.of.it.ClassName::Function
                Handler = "FinanceGameinator.Cross.Api::FinanceGameinator.Cross.Api.Ports.HttpServer::Get",
                Code = Code.FromAsset("Modules/Players/FinanceGameinator.Players.Api/bin/Release/net6.0")
            });

            RestApi = new LambdaRestApi(Stack, "FinanceGameinatorRestApi", new LambdaRestApiProps
            {
                Handler = notFoundPathLambda,
                Proxy = false
            });
        }

    }
}
