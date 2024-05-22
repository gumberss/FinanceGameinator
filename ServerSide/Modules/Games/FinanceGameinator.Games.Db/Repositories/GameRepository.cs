using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Games.Db.Adapters;
using FinanceGameinator.Shared.Db.Interfaces.Cross;
using FinanceGameinator.Games.Db.Interfaces.Repositories;
using FinanceGameinator.Games.Domain.Models;

namespace FinanceGameinator.Players.Db.Repositories
{
    public class GameRepository : IGameRepository
    {
        readonly IDynamoDbConnection _dbConnection;

        public GameRepository(IDynamoDbConnection dbConnection)
        {
            _dbConnection = dbConnection;
        }

        public async Task<Result<Game, BusinessException>> FindById(Guid playerId)
            => await GameAdapter.ToGetByIdRequest(playerId)
                .Then(queryRequest => _dbConnection.QueryAsync(queryRequest))
                .Then(response => GameAdapter.ToModel(playerId, response.Items));

        public async Task<Result<GameRegistration, BusinessException>> Register(GameRegistration registrationData)
        {
            var result = await GameAdapter.ToRegistrationRequest(registrationData)
                .Then(putRequest => _dbConnection.PutAsync(putRequest));

            if (result.IsFailure && result.Error.InnerException?.GetType() != typeof(ConditionalCheckFailedException))
            {
                return result.Error;
            }

            return registrationData;
        }

    }
}
