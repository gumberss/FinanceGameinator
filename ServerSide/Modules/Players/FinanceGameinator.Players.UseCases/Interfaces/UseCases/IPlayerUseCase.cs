using CleanHandling;
using FinanceGameinator.Players.Domain.Models;

namespace FinanceGameinator.Players.UseCases.Interfaces.UseCases
{
    public interface IPlayerUseCase
    {
        Task<Result<Player, BusinessException>> FindPlayer(Guid playerId);
    }
}
