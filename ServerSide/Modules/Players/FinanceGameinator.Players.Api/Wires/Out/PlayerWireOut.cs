using FinanceGameinator.Players.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FinanceGameinator.Players.Api.Wires.Out
{
    public class PlayerWireOut
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        [JsonPropertyName("name")]
        public string Name { get; set; }
        [JsonPropertyName("games")]
        public List<GameWireOut> Games { get; set; }

        public PlayerWireOut(Guid id, string name, List<GameWireOut> games)
        {
            Id = id;
            Name = name;
            Games = games;
        }
    }
}
