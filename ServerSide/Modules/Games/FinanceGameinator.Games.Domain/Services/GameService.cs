using FinanceGameinator.Games.Domain.Interfaces.Services;

namespace FinanceGameinator.Games.Domain.Services
{
    public class GameService : IGameService
    {
        String codePossibleChars = "abcdefghijklmnopqrstuvwxyz1234567890";

        int CODE_LENGHT = 8;

        public String GenerateCode(Random random)
            => new string(Enumerable.Range(0, CODE_LENGHT)
                .Select(_ => RandomChar(random))
                .ToArray())
            .ToUpper();

        private char RandomChar(Random random)
            => codePossibleChars[random.Next(codePossibleChars.Length)];
    }
}
