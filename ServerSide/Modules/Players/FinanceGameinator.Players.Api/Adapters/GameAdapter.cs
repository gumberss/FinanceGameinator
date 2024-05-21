using FinanceGameinator.Players.Api.Wires.Out;
using FinanceGameinator.Players.Domain.Models;

namespace FinanceGameinator.Players.Api.Adapters
{
    internal class GameAdapter
    {
        internal static GameWireOut ToWire(Game game)
            => new(game.Id, game.Name);
    }
}
