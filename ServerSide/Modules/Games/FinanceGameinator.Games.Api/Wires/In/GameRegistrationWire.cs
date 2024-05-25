using System.Text.Json.Serialization;

namespace FinanceGameinator.Games.Api.Wires.In
{
    public class GameRegistrationWire
    {
        [JsonPropertyName("gameName")]
        public string GameName { get; set; }

        [JsonPropertyName("playerId")]
        public Guid PlayerId { get; set; }

        [JsonPropertyName("playerName")]
        public String PlayerName { get; set; }

        public GameRegistrationWire()
        {
                
        }

        public GameRegistrationWire(Guid playerId, String playerName, string name)
        {
            PlayerName = playerName;
            PlayerId = playerId;
            GameName = name;
        }
    }
}
