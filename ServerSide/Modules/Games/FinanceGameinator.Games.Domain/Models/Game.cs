
namespace FinanceGameinator.Games.Domain.Models
{
    public class Game
    {
        public Game(String code, string name)
        {
            Code = code;
            Name = name;
        }

        public String Code { get; set; }
        public String Name { get; set; }


    }
}
