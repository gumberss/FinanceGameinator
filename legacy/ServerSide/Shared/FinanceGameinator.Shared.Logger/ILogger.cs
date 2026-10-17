using Microsoft.Extensions.Logging;

namespace FinanceGameinator.Shared.Logger
{
    public interface ILogger
    {
        void SetupLogger(bool isDevelopment, ILoggingBuilder logging);
    }
}
