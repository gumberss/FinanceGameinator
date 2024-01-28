using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using FinanceGameinator.Players.IoC.ServiceCollectionProvider;
using FinanceGameinator.Players.UseCases.Interfaces.UseCases;
using Microsoft.Extensions.DependencyInjection;
using System.Net;

namespace FinanceGameinator.Players.Api.Ports
{
    internal class HttpServer
    {
        ServiceCollection _serviceCollection;

        public HttpServer()
        {
            _serviceCollection = new ServiceCollectionProvider().ServiceCollection;
        }
        public async Task<APIGatewayProxyResponse> Get(APIGatewayProxyRequest request, ILambdaContext context)
        {
            if (!request.PathParameters.TryGetValue("id", out String? stringId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.OK,
                    Body = "Parameter Id not found",
                    Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                };
            }

            if (!Guid.TryParse(stringId, out Guid playerId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.OK,
                    Body = "Player id is not in the correct pattern",
                    Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                };
            }
            using (ServiceProvider serviceProvider = _serviceCollection.BuildServiceProvider())
            {
                var result = await serviceProvider.GetService<IPlayerUseCase>()!.FindPlayer(playerId);
                if (result.IsFailure)
                {
                    return new APIGatewayProxyResponse
                    {
                        StatusCode = (int)result.Error.Code,
                        Body = result.Error.Message,
                        Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                    };
                }

                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)result.Error.Code,
                    Body = result.Value.Name,
                    Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                };
            }
        }
    }
}
