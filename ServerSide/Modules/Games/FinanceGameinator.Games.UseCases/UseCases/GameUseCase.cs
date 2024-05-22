using CleanHandling;
using FinanceGameinator.Games.Db.Interfaces.Repositories;
using FinanceGameinator.Games.Domain.Models;
using FinanceGameinator.Games.UseCases.Interfaces;

namespace FinanceGameinator.Games.UseCases.UseCases
{
    public class GameUseCase : IGameUseCase
    {
        readonly IGameRepository _gameRepository;

        public GameUseCase(IGameRepository gameRepository)
        {
            _gameRepository = gameRepository;
        }

        public Task<Result<Game, BusinessException>> Find(Guid playerId)
            => _gameRepository.FindById(playerId);

        public Task<Result<GameRegistration, BusinessException>> Create(GameRegistration registrationData)
            => _gameRepository.Register(registrationData);
    }
}
