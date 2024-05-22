using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using CleanHandling;
using FinanceGameinator.Games.Api.Wires.In;
using FinanceGameinator.Games.Domain.Models;
using FinanceGameinator.Games.IoC.ServiceCollectionProvider;
using FinanceGameinator.Games.UseCases.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Logger = FinanceGameinator.Shared.Logger;

namespace FinanceGameinator.Games.Api.Ports
{
    public class HttpServer
    {
        ServiceCollection _serviceCollection;

        public HttpServer()
        {
            _serviceCollection = new ServiceCollectionProvider(new Logger.LambdaLogger()).ServiceCollection;
        }

        public async Task<APIGatewayProxyResponse> Get(APIGatewayProxyRequest request, ILambdaContext context)
        {
            //todo: here
            context.Logger.LogInformation("Handling the 'Get' Request");

            var response = new APIGatewayProxyResponse
            {
                StatusCode = (int)HttpStatusCode.OK,
                Body = "Teste Games",
                Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
            };


            return response;
        }


        public async Task<APIGatewayProxyResponse> Register(APIGatewayProxyRequest request, ILambdaContext context)
        {
            context.Logger.Log(request.Body);

            var gameResult =
                await Result.Try(() => JsonSerializer.Deserialize<GameRegistrationWire>(request.Body))
                .When(gameData => gameData != null
                    , gameData => new GameRegistration(gameData.Id, gameData.Name)
                    , _ => Result.FromError<GameRegistration>(new BusinessException(HttpStatusCode.BadRequest, "The body don't seems correct")));

            if (gameResult.IsFailure)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)gameResult.Error.Code,
                    Body = gameResult.Error.Message,
                    Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                };
            }

            using (ServiceProvider serviceProvider = _serviceCollection.BuildServiceProvider())
            {
                try
                {
                    var service = serviceProvider.GetService<IGameUseCase>();

                    context.Logger.Log(gameResult.Value.Name.ToString());

                    var result = await service!.Create(gameResult.Value);
                    context.Logger.Log("simbora");
                    if (result.IsFailure)
                    {
                        context.Logger.Log(result.Error.ToString());
                        return new APIGatewayProxyResponse
                        {
                            StatusCode = (int)result.Error.Code,
                            Body = result.Error.Message,
                            Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                        };
                    }

                    var wireOut = new GameRegistrationWire(result.Value.Id, result.Value.Name);

                    return new APIGatewayProxyResponse
                    {
                        StatusCode = 200,
                        Body = JsonSerializer.Serialize(wireOut),
                        Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                    };
                }
                catch (Exception ex)
                {
                    context.Logger.Log(ex.ToString());
                    return new APIGatewayProxyResponse
                    {
                        StatusCode = 500,
                        Body = ex.ToString(),
                        Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                    };
                }
            }
        }
    }
}
