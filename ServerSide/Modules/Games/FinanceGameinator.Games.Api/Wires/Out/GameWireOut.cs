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

        public GameWireOut()
        {

        }

        public GameWireOut(String code, String name)
        {
            Code = code;
            Name = name;
        }
    }
}
