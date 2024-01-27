using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK;
using Constructs;
using Amazon.CDK.AWS.Lambda;
using FinanceGameinator.CDK.Models;

namespace FinanceGameinator.CDK.Components.Cross
{
    internal class RestApiStack : FinanceGameinatorStack
    {
        public LambdaRestApi RestApi { get; }

        internal RestApiStack(Stack stack,  Construct scope, IStackProps? props = null) : base(stack, scope, props)
        {
            var notFoundPathLambda = new Function(Stack, "FinanceGameinatorDefaultLambdaFunction", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                //assembly::Namespace.of.it::Function
                Handler = "FinanceGameinator.Players.Api::FinanceGameinator.Players.Api.Modules.Cross::Get",
                Code = Code.FromAsset("FinanceGameinator.Players.Api/bin/Debug/net6.0")
            });

            RestApi = new LambdaRestApi(Stack, "FinanceGameinatorRestApi", new LambdaRestApiProps
            {
                Handler = notFoundPathLambda,
                Proxy = false
            });
        }

    }
}
