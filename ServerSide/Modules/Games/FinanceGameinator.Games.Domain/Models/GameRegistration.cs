namespace FinanceGameinator.Games.Domain.Models
{
    public class GameRegistration
    {
        public Guid Id { get; set; }
        public String Name { get; set; }

        public GameRegistration(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
