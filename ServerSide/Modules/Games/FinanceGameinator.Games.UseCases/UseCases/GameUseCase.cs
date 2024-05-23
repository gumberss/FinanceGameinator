using CleanHandling;
using FinanceGameinator.Games.Db.Interfaces.Repositories;
using FinanceGameinator.Games.Domain.Interfaces.Services;
using FinanceGameinator.Games.Domain.Models;
using FinanceGameinator.Games.UseCases.Interfaces;

namespace FinanceGameinator.Games.UseCases.UseCases
{
    public class GameUseCase : IGameUseCase
    {
        readonly IGameRepository _gameRepository;
        readonly IGameService _gameService;

        public GameUseCase(
            IGameService gameService,
            IGameRepository gameRepository)
        {
            _gameRepository = gameRepository;
            _gameService = gameService;
        }

        public Task<Result<Game, BusinessException>> Find(String code)
            => _gameRepository.FindById(code);

        public async Task<Result<GameRegistration, BusinessException>> Create(GameRegistration registrationData)
            => await Result.From(_gameService.GenerateCode(new Random()))
                .Then(code => Result.From(registrationData.SetCode(code)))
                .Then(data => _gameRepository.Register(data));
    }
}
