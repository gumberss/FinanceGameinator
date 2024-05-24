using System.Text.Json.Serialization;

namespace FinanceGameinator.Games.Api.Wires.In
{
    public class GameRegistrationWire
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        public GameRegistrationWire()
        {
                
        }

        public GameRegistrationWire(string name)
        {
            Name = name;
        }
    }
}
