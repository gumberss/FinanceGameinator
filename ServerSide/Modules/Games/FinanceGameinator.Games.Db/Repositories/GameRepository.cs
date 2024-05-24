using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Games.Db.Adapters;
using FinanceGameinator.Shared.Db.Interfaces.Cross;
using FinanceGameinator.Games.Db.Interfaces.Repositories;
using FinanceGameinator.Games.Domain.Models;

namespace FinanceGameinator.Games.Db.Repositories
{
    public class GameRepository : IGameRepository
    {
        readonly IDynamoDbConnection _dbConnection;

        public GameRepository(IDynamoDbConnection dbConnection)
        {
            _dbConnection = dbConnection;
        }

        public async Task<Result<Game, BusinessException>> FindById(String gameCode)
            => await GameAdapter.ToGetByIdRequest(gameCode)
                .Then(queryRequest => _dbConnection.QueryAsync(queryRequest))
                .Then(response => GameAdapter.ToModel(gameCode, response.Items));

        public async Task<Result<GameRegistration, BusinessException>> Register(GameRegistration registrationData)
            =>  await GameAdapter.ToRegistrationRequest(registrationData)
                .Then(putRequest => _dbConnection.PutAsync(putRequest))
                .Then(_ => registrationData);

    }
}
