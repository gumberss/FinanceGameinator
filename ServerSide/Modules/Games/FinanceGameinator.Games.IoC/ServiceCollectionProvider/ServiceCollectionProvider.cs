using FinanceGameinator.Shared.Logger;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceGameinator.Games.IoC.ServiceCollectionProvider
{
    public class ServiceCollectionProvider
    {
        private ServiceCollection _services;
        private ILogger _logger;

        public ServiceCollection ServiceCollection => _services;

        public ServiceCollectionProvider(ILogger logger)
        {
            _services = new ServiceCollection();
            _logger = logger;
            ConfigureServices();
        }

        private void ConfigureServices()
        {
            _services.AddLogging(logging => _logger.SetupLogger(false, logging));
        }
    }
}
