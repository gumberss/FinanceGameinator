using Amazon.Lambda.APIGatewayEvents;
using FinanceGameinator.Players.Api.Ports;
using FinanceGameinator.Players.Api.Wires.In;
using FinanceGameinator.Players.Api.Wires.Out;
using FinanceGameinator.Shared.Test.AwsFake;
using FluentAssertions;
using System.Text.Json;

namespace FinanceGameinator.Players.Integration.Test
{
    public class PlayerTest
    {
        private readonly HttpServer _server;

        public PlayerTest()
        {
            _server = new HttpServer();
        }

        [Fact]
        [Trait("Player Registration", "New insertion")]
        public void Should_insert_a_new_player()
        {
            var playerId = Guid.NewGuid();
            var playerName = "John";

            var wire = new PlayerRegistrationWire
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
            JsonSerializer.Deserialize<PlayerRegistrationWire>(response.Body)
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

            JsonSerializer.Deserialize<PlayerWireOut>(getResponse.Body)
                .Should()
                .BeEquivalentTo(new PlayerWireOut(playerId, playerName, new List<GameWireOut>()));
        }

        [Fact]
        [Trait("Player Registration", "Idempotency")]
        public void Should_not_register_the_player_twice()
        {
            var playerId = Guid.NewGuid();
            var playerName = "John";

            var wire = new PlayerRegistrationWire
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
            JsonSerializer.Deserialize<PlayerRegistrationWire>(response.Body)
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

            JsonSerializer.Deserialize<PlayerWireOut>(getResponse.Body)
                .Should()
                .BeEquivalentTo(new PlayerWireOut(playerId, playerName, new List<GameWireOut>()));
        }
    }
}