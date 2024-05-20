using CleanHandling;
using FinanceGameinator.Players.Db.Adapters;
using FinanceGameinator.Players.Db.Interfaces.Cross;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Domain.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace FinanceGameinator.Players.Db.Repositories
{
    public class PlayersRepository : IPlayerRepository
    {
        readonly IDynamoDbConnection _dbConnection;
        private readonly ILogger<PlayersRepository> _logger;

        public PlayersRepository(ILogger<PlayersRepository> logger, IDynamoDbConnection dbConnection)
        {
            _logger = logger;
            _dbConnection = dbConnection;
        }


        public async Task<Result<Player, BusinessException>> QueryPlayer(Guid playerId)
            => await PlayerAdapter.ToGetPlayerByIdRequest(playerId)
                .Then(queryRequest => _dbConnection.QueryAsync(queryRequest))
                .Then(response => PlayerAdapter.ToPlayer(playerId, response.Items));

        public async Task<Result<PlayerRegistration, BusinessException>> Register(PlayerRegistration registrationData)
            => await PlayerAdapter.ToPlayerRegistrationRequest(registrationData)
                .Then(putRequest => _dbConnection.PutAsync(putRequest))
                .Then(_ => registrationData);

    }
}
