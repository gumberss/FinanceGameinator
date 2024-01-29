using Microsoft.Extensions.Logging;

namespace FinanceGameinator.Players.IoC.Logger
{
    public interface ILogger
    {
        void SetupLogger(bool isDevelopment, ILoggingBuilder logging);
    }
}
