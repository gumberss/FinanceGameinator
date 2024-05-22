using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FinanceGameinator.Games.Api.Wires.Out
{
    public class GameWireOut
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        public GameWireOut()
        {

        }

        public GameWireOut(Guid id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}
