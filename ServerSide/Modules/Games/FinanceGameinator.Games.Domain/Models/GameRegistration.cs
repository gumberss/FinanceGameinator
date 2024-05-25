namespace FinanceGameinator.Games.Domain.Models
{
    public class GameRegistration
    {
        public Guid PlayerId { get; private set; }
        public string PlayerName { get; private set; }

        public String GameName { get; private set; }

        public String? GameCode { get; private set; }

        public GameRegistration(Guid playerId,String playerName, string gameName)
        {
            PlayerName = playerName;
            PlayerId = playerId;
            GameName = gameName;
        }

        public GameRegistration SetCode(String code)
        {
            GameCode = code;
            return this;
        }
    }
}
