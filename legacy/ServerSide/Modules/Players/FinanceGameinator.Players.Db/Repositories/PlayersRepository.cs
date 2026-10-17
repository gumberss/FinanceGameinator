using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Players.Db.Adapters;
using FinanceGameinator.Shared.Db.Interfaces.Cross;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Domain.Models;
using Microsoft.Extensions.Logging;

namespace FinanceGameinator.Players.Db.Repositories
{
    public class PlayersRepository : IPlayerRepository
    {
        readonly IDynamoDbConnection _dbConnection;

        public PlayersRepository(ILogger<PlayersRepository> logger, IDynamoDbConnection dbConnection)
        {
            _dbConnection = dbConnection;
        }

        public async Task<Result<Player, BusinessException>> QueryPlayer(Guid playerId)
            => await PlayerAdapter.ToGetPlayerByIdRequest(playerId)
                .Then(queryRequest => _dbConnection.QueryAsync(queryRequest))
                .Then(response => PlayerAdapter.ToPlayer(playerId, response.Items));

        public async Task<Result<PlayerRegistration, BusinessException>> Register(PlayerRegistration registrationData)
        {
            var result = await PlayerAdapter.ToPlayerRegistrationRequest(registrationData)
                .Then(putRequest => _dbConnection.PutAsync(putRequest));

            if (result.IsFailure && result.Error.InnerException?.GetType() != typeof(ConditionalCheckFailedException))
            {
                return result.Error;
            }

            return registrationData;
        }

    }
}
