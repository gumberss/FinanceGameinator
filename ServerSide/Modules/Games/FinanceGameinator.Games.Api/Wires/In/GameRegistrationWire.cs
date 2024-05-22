using System.Text.Json.Serialization;

namespace FinanceGameinator.Games.Api.Wires.In
{
    public class GameRegistrationWire
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        public GameRegistrationWire()
        {

        }

        public GameRegistrationWire(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
