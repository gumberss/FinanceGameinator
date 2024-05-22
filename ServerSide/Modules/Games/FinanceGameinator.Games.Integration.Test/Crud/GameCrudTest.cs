using Amazon.Lambda.APIGatewayEvents;
using FinanceGameinator.Games.Api.Ports;
using FinanceGameinator.Games.Api.Wires.In;
using FinanceGameinator.Games.Api.Wires.Out;
using FinanceGameinator.Shared.Test.AwsFake;
using FluentAssertions;
using System.Text.Json;

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
        [Trait("Player Registration", "New insertion")]
        public void Should_insert_a_new_player()
        {
            var playerId = Guid.NewGuid();
            var playerName = "John";

            var wire = new GameRegistrationWire
            {
                Id = playerId,
                Name = playerName
            };

            var response = _server.Register(new APIGatewayProxyRequest()
            {
                Body = JsonSerializer.Serialize(wire),
            }, new LambdaContext())
            .Result;

            response.StatusCode.Should().Be(200);
            JsonSerializer.Deserialize<GameRegistrationWire>(response.Body)
                .Should().BeEquivalentTo(wire);


            var pathParams = new Dictionary<String, String>
            {
                { "id", playerId.ToString() }
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
                .BeEquivalentTo(new GameWireOut(playerId, playerName));
        }

        [Fact]
        [Trait("Player Registration", "Idempotency")]
        public void Should_not_register_the_player_twice()
        {
            var playerId = Guid.NewGuid();
            var playerName = "John";

            var wire = new GameRegistrationWire
            {
                Id = playerId,
                Name = playerName
            };

            var response = _server.Register(new APIGatewayProxyRequest()
            {
                Body = JsonSerializer.Serialize(wire),
            }, new LambdaContext())
            .Result;

            response.StatusCode.Should().Be(200);
            JsonSerializer.Deserialize<GameRegistrationWire>(response.Body)
                .Should().BeEquivalentTo(wire);

            wire.Name = "Banana";

            var secondResponse = _server.Register(new APIGatewayProxyRequest()
            {
                Body = JsonSerializer.Serialize(wire),
            }, new LambdaContext())
            .Result;

            secondResponse.StatusCode.Should().Be(200);

            var pathParams = new Dictionary<String, String>
            {
                { "id", playerId.ToString() }
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
                .BeEquivalentTo(new GameWireOut(playerId, playerName));
        }
    }
}
