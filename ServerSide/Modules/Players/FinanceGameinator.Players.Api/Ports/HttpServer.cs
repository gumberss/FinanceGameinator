﻿using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using CleanHandling;
using FinanceGameinator.Players.Api.Adapters;
using FinanceGameinator.Players.Api.Wires.In;
using FinanceGameinator.Players.Domain.Models;
using FinanceGameinator.Players.IoC.ServiceCollectionProvider;
using FinanceGameinator.Players.UseCases.Interfaces.UseCases;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Logger = FinanceGameinator.Shared.Logger;

namespace FinanceGameinator.Players.Api.Ports
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
                try
                {
                    var service = serviceProvider.GetService<IPlayerUseCase>();

                    var result = await service!.Find(playerId);
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

                    var wireOut = PlayerAdapter.ToWire(result.Value);

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

        public async Task<APIGatewayProxyResponse> Register(APIGatewayProxyRequest request, ILambdaContext context)
        {
            context.Logger.Log(request.Body);
            
            var playerResult =
                await Result.Try(() => JsonSerializer.Deserialize<PlayerRegistrationWire>(request.Body))
                .When(playerData => playerData != null
                    , playerData => new PlayerRegistration(playerData!.Id, playerData.Name)
                    , _ => Result.FromError<PlayerRegistration>(new BusinessException(HttpStatusCode.BadRequest, "The body don't seems correct")));

            if (playerResult.IsFailure)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)playerResult.Error.Code,
                    Body = playerResult.Error.Message,
                    Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                };
            }

            using (ServiceProvider serviceProvider = _serviceCollection.BuildServiceProvider())
            {
                try
                {
                    var service = serviceProvider.GetService<IPlayerUseCase>();

                    context.Logger.Log(playerResult.Value.Id.ToString());
                    context.Logger.Log(playerResult.Value.Name.ToString());

                    var result = await service!.Register(playerResult.Value);
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

                    var wireOut = new PlayerRegistrationWire(result.Value.Id, result.Value.Name);

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
