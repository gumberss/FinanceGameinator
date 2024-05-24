using Amazon.Lambda.APIGatewayEvents;
using FinanceGameinator.Games.Api.Ports;
using FinanceGameinator.Games.Api.Wires.In;
using FinanceGameinator.Games.Api.Wires.Out;
using FinanceGameinator.Games.Db.Repositories;
using FinanceGameinator.Games.Domain.Interfaces.Services;
using FinanceGameinator.Games.Domain.Models;
using FinanceGameinator.Games.Domain.Services;
using FinanceGameinator.Games.IoC.ServiceCollectionProvider;
using FinanceGameinator.Shared.Db.Cross;
using FinanceGameinator.Shared.Test.AwsFake;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Text.Json;
using Logger = FinanceGameinator.Shared.Logger;

namespace FinanceGameinator.Games.Integration.Test.Crud
{
    public class GameCrudTest
    {
        private readonly HttpServer _server;

        public GameCrudTest()
        {
            _server = new HttpServer();
        }

        [Fact]
        [Trait("Game", "Registration")]
        public void Should_insert_a_new_game()
        {
            var gameName = "Game 1";

            var wire = new GameRegistrationWire
            {
                Name = gameName
            };

            var response = _server.Register(new APIGatewayProxyRequest()
            {
                Body = JsonSerializer.Serialize(wire),
            }, new LambdaContext())
            .Result;

            response.StatusCode.Should().Be(200);
            var game = JsonSerializer.Deserialize<GameWireOut>(response.Body);

            game.Should().NotBeNull().And.BeEquivalentTo(wire);

            var pathParams = new Dictionary<String, String>
            {
                { "code", game!.Code }
            };

            var getResponse = _server
            .Get(new APIGatewayProxyRequest()
            {
                PathParameters = pathParams
            }, new LambdaContext())
            .Result;

            getResponse.StatusCode.Should().Be(200);

            JsonSerializer.Deserialize<GameWireOut>(getResponse.Body)
                .Should()
                .BeEquivalentTo(game);
        }

        [Fact]
        [Trait("Game", "Registration")]
        public void Should_handle_code_Exceptions()
        {
            var gameName = "Game 1";

            var wire = new GameRegistrationWire(gameName);

            var code = new GameService().GenerateCode(new Random());
            var secondCode = new GameService().GenerateCode(new Random());

            var result = new GameRepository(new DynamoDbConnection())
                .Register(new GameRegistration(gameName)
                .SetCode(code))
                .Result;

            result.IsSuccess.Should().BeTrue();
            result.Value.Code.Should().Be(code);
            
            var firstTime = true;

            var gameServiceMoq = new Mock<IGameService>();
            gameServiceMoq.Setup(x => x.GenerateCode(It.IsAny<Random>()))
                .Returns(() =>
                {
                    if (!firstTime) return secondCode;

                    firstTime = false;
                    return code;
                });

            var provider = new ServiceCollectionProvider(new Logger.LambdaLogger());
            provider.ServiceCollection.AddTransient((a) => gameServiceMoq.Object);

            var server = new HttpServer(provider);

            var response = server.Register(new APIGatewayProxyRequest()
            {
                Body = JsonSerializer.Serialize(wire),
            }, new LambdaContext())
            .Result;

            response.StatusCode.Should().Be(200);
            var game = JsonSerializer.Deserialize<GameWireOut>(response.Body);

            game.Should().NotBeNull();
            game.Code.Should().Be(secondCode);
        }
    }
}
