using Amazon.DynamoDBv2.Model;
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

        public async Task<Result<Game, BusinessException>> Create(GameRegistration registrationData)
            => await CreateRetryable(registrationData, new Random())
            .Then(async game =>
            {
                var result = await _gameRepository.IncludePlayer(registrationData);

                if (result.IsFailure
                && result.Error.InnerException?.GetType() != typeof(ConditionalCheckFailedException))
                    return Result.FromError<Game>(result.Error);

                return Result.From(game.IncludePlayer(result.Value));
            });

        private async Task<Result<Game, BusinessException>> CreateRetryable(GameRegistration registrationData, Random random, int retryTimes = 3)
            => await Result.From(_gameService.GenerateCode(random))
            .Then(code => Result.From(registrationData.SetCode(code)))
            .Then(async data =>
            {
                var result = await _gameRepository.Register(data);

                if (result.IsFailure
                && result.Error.InnerException?.GetType() == typeof(ConditionalCheckFailedException)
                && retryTimes > 0)
                {
                    return await CreateRetryable(registrationData, random, --retryTimes);
                }

                return result;
            });
    }
}
