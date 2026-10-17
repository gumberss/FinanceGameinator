namespace FinanceGameinator.Players.Domain.Models
{
    public class PlayerRegistration
    {
        public Guid Id { get; set; }

        public String Name { get; set; }

        public PlayerRegistration(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
