using Microsoft.Extensions.Logging;

namespace FinanceGameinator.Shared.Logger
{
    public class LambdaLogger : ILogger
    {
        public void SetupLogger(bool isDevelopment, ILoggingBuilder logging)
        {
            if (logging == null)
            {
                throw new ArgumentNullException(nameof(logging));
            }

            var loggerOptions = new LambdaLoggerOptions
            {
                IncludeCategory = true,
                IncludeLogLevel = true,
                IncludeNewline = true,
                IncludeEventId = true,
                IncludeException = true
            };

            logging.AddLambdaLogger(loggerOptions);

            logging.SetMinimumLevel(LogLevel.Debug);

            if (isDevelopment)
            {
                logging.AddConsole();
            }
        }
    }
}
