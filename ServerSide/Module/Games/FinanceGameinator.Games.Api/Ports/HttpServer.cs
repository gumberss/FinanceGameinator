using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Net;

namespace FinanceGameinator.Games.Api.Ports
{
    internal class HttpServer
    {
        public APIGatewayProxyResponse Get(APIGatewayProxyRequest request, ILambdaContext context)
        {
            context.Logger.LogInformation("Handling the 'Get' Request");

            var response = new APIGatewayProxyResponse
            {
                StatusCode = (int)HttpStatusCode.OK,
                Body = "Teste Games",
                Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
            };


            return response;
        }
    }
}
