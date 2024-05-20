using System.Text.Json.Serialization;

namespace FinanceGameinator.Players.Api.Wires.In
{
    internal class PlayerRegistrationWire
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public String Name { get; set; }
    }
}
