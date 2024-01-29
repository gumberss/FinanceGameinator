namespace FinanceGameinator.Players.Domain.Models
{
    public class Player
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public List<Game> Games { get; private set; }

        public Player(Guid id, string name, List<Game> games)
        {
            Id = id;
            Name = name;
            Games = games;
        }
    }
}
