using CleanHandling;
using FinanceGameinator.Players.Db.Adapters;
using FinanceGameinator.Players.Db.Interfaces.Cross;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Domain.Models;

namespace FinanceGameinator.Players.Db.Repositories
{
    public class PlayersRepository : IPlayerRepository
    {
        readonly IDynamoDbConnection _dbConnection;

        public PlayersRepository(IDynamoDbConnection dbConnection)
        {
            _dbConnection = dbConnection;
        }

        public async Task<Result<Player, BusinessException>> QueryPlayer(Guid playerId)
            => await PlayerAdapter.ToGetPlayerByIdRequest(playerId)
                .Then(queryRequest => _dbConnection.QueryAsync(queryRequest))
                .Then(response => PlayerAdapter.ToPlayer(playerId, response.Items));
    }
}
