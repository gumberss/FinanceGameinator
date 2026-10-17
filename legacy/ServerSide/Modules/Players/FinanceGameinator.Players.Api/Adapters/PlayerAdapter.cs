using FinanceGameinator.Players.Api.Wires.Out;
using FinanceGameinator.Players.Domain.Models;

namespace FinanceGameinator.Players.Api.Adapters
{
    public class PlayerAdapter
    {
        internal static PlayerWireOut ToWire(Player player)
            => new(player.Id, player.Name, player.Games.Select(GameAdapter.ToWire).ToList());
    }
}
