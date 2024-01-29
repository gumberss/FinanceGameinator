using CleanHandling;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Domain.Models;
using FinanceGameinator.Players.UseCases.Interfaces.UseCases;
using Microsoft.Extensions.Logging;

namespace FinanceGameinator.Players.UseCases.UseCases
{
    public class PlayerUseCase : IPlayerUseCase
    {
        private readonly ILogger<PlayerUseCase> _logger;
        readonly IPlayerRepository _playerRepository;

        public PlayerUseCase(ILogger<PlayerUseCase> logger,
            IPlayerRepository playerRepository)
        {
            _logger = logger;
            _playerRepository = playerRepository;
        }

        public Task<Result<Player, BusinessException>> FindPlayer(Guid playerId)
        {
            _logger.LogInformation("GANHAMO");
            return _playerRepository.QueryPlayer(playerId);
        }
    }
}
