using System.Text.Json.Serialization;

namespace FinanceGameinator.Players.Api.Wires.Out
{
    public class GameWireOut
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        [JsonPropertyName("name")]
        public string Name { get; set; }

        public GameWireOut(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
