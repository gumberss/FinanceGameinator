using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Net;

namespace FinanceGameinator.Cross.Api.Ports
{
    internal class HttpServer
    {
        public APIGatewayProxyResponse Get(APIGatewayProxyRequest request, ILambdaContext context)
        {
            var response = new APIGatewayProxyResponse
            {
                StatusCode = (int)HttpStatusCode.NotFound,
                Body = "Page Not found",
                Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
            };

            return response;
        }
    }
}
