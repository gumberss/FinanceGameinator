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
        [JsonPropertyName("code")]
        public String Code { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("players")]
        public List<PlayerWireOut> Players { get; set; }

        public GameWireOut()
        {

        }

        public GameWireOut(String code, String name, List<PlayerWireOut> players)
        {
            Code = code;
            Name = name;
            Players = players;
        }
    }
}
