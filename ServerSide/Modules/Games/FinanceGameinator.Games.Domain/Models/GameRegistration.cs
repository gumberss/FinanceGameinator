namespace FinanceGameinator.Games.Domain.Models
{
    public class GameRegistration
    {
        public String Name { get; private set; }

        public String? Code { get; private set; }

        public GameRegistration(string name)
        {
            Name = name;
        }

        public GameRegistration SetCode(String code)
        {
            Code = code;
            return this;
        }
    }
}
