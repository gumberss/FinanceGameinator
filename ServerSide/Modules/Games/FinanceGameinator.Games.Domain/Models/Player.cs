namespace FinanceGameinator.Games.Domain.Models
{
    public class Player
    {
        public Guid Id { get; private set; }
        public String Name { get; private set; }

        public Player(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
