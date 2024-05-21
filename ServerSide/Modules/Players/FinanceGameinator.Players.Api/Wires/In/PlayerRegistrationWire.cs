using System.Text.Json.Serialization;

namespace FinanceGameinator.Players.Api.Wires.In
{
    public class PlayerRegistrationWire
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public String Name { get; set; }

        public PlayerRegistrationWire()
        {
            
        }
        public PlayerRegistrationWire(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
