using CleanHandling;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Domain.Models;
using FinanceGameinator.Players.UseCases.Interfaces.UseCases;

namespace FinanceGameinator.Players.UseCases.UseCases
{
    public class PlayerUseCase : IPlayerUseCase
    {
        readonly IPlayerRepository _playerRepository;

        public PlayerUseCase(IPlayerRepository playerRepository)
        {
            _playerRepository = playerRepository;
        }

        public Task<Result<Player, BusinessException>> FindPlayer(Guid playerId)
            => _playerRepository.QueryPlayer(playerId);
    }
}
