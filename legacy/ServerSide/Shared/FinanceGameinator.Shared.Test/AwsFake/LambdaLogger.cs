using Amazon.Lambda.Core;

namespace FinanceGameinator.Shared.Test.AwsFake
{
    public class LambdaLogger : ILambdaLogger
    {
        List<String> logs = new();

        public void Log(string message)
        {
            logs.Add(message);
            Console.WriteLine(message);
        }

        public void LogLine(string message)
        {
            logs.Add(message);
            Console.WriteLine(message);
        }

        public List<String> GetLogs() => logs;

    }
}
