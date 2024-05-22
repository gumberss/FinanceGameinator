using CleanHandling;
using FinanceGameinator.Games.Domain.Models;

namespace FinanceGameinator.Games.UseCases.Interfaces
{
    public interface IGameUseCase
    {
        public Task<Result<Game, BusinessException>> Find(Guid playerId);

        public Task<Result<GameRegistration, BusinessException>> Create(GameRegistration registrationData);
    }
}
