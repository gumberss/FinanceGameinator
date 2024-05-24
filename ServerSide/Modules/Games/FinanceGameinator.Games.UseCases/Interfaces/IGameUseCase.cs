using CleanHandling;
using FinanceGameinator.Games.Domain.Models;

namespace FinanceGameinator.Games.UseCases.Interfaces
{
    public interface IGameUseCase
    {
        public Task<Result<Game, BusinessException>> Find(String code);

        public Task<Result<GameRegistration, BusinessException>> Create(GameRegistration registrationData);
    }
}
