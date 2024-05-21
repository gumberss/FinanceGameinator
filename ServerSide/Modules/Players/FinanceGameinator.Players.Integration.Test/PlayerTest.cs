using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using FinanceGameinator.Players.Api.Ports;
using FinanceGameinator.Players.Api.Wires.In;
using FinanceGameinator.Players.Api.Wires.Out;
using FluentAssertions;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace FinanceGameinator.Players.Integration.Test
{
    class LambdaLogger : ILambdaLogger
    {
        public void Log(string message)
        {
            Console.WriteLine(message);
        }

        public void LogLine(string message)
        {
            Console.WriteLine(message);
        }
    }

    class LambdaContext : ILambdaContext
    {
        public string AwsRequestId => throw new NotImplementedException();

        public IClientContext ClientContext => throw new NotImplementedException();

        public string FunctionName => throw new NotImplementedException();

        public string FunctionVersion => throw new NotImplementedException();

        public ICognitoIdentity Identity => throw new NotImplementedException();

        public string InvokedFunctionArn => throw new NotImplementedException();

        public ILambdaLogger Logger => new LambdaLogger();

        public string LogGroupName => throw new NotImplementedException();

        public string LogStreamName => throw new NotImplementedException();

        public int MemoryLimitInMB => throw new NotImplementedException();

        public TimeSpan RemainingTime => throw new NotImplementedException();
    }

    public class PlayerTest
    {
        private readonly HttpServer _server;

        public PlayerTest()
        {
            _server = new HttpServer();
        }

        [Fact]
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