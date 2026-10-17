
namespace FinanceGameinator.Games.Domain.Models
{
    public class Game
    {
        public Game(String code, string name, List<Player> players)
        {
            Code = code;
            Name = name;
            Players = players;
        }

        public String Code { get; private set; }
        public String Name { get; private set; }
        public List<Player> Players { get; private set; }

        public Game IncludePlayer(Player player)
        {
            if (!Players.Contains(player)) 
                Players.Add(player);

            return this;
        }
    }
}
