using CleanHandling;
using FinanceGameinator.Players.Domain.Models;

namespace FinanceGameinator.Players.Db.Interfaces.Repositories
{
    public interface IPlayerRepository
    {
        Task<Result<Player, BusinessException>> QueryPlayer(Guid playerId);
    }
}
