using FinanceGameinator.Players.Db.Cross;
using FinanceGameinator.Players.Db.Interfaces.Cross;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Db.Repositories;
using FinanceGameinator.Players.UseCases.Interfaces.UseCases;
using FinanceGameinator.Players.UseCases.UseCases;
using FinanceGameinator.Shared.Logger;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceGameinator.Players.IoC.ServiceCollectionProvider
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
            _services.AddTransient<IPlayerRepository, PlayersRepository>();
            _services.AddTransient<IDynamoDbConnection, DynamoDbConnection>();
            _services.AddTransient<IPlayerUseCase, PlayerUseCase>();
        }
    }
}
