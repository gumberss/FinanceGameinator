using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceGameinator.Games.Domain.Models
{
    public class Game
    {
        public Game(Guid id, string name)
        {
            Id = id;
            Name = name;
        }

        public Guid Id { get; set; }
        public String Name { get; set; }


    }
}
