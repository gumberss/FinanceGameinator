using CleanHandling;
using FinanceGameinator.Games.Domain.Models;

namespace FinanceGameinator.Games.Db.Interfaces.Repositories
{
    public interface IGameRepository
    {
        Task<Result<Game, BusinessException>> FindById(String code);
        Task<Result<Player, BusinessException>> IncludePlayer(GameRegistration registrationData);
        Task<Result<Game, BusinessException>> Register(GameRegistration registrationData);
    }
}
