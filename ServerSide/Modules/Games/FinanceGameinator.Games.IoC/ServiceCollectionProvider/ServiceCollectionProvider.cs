using FinanceGameinator.Games.Db.Interfaces.Repositories;
using FinanceGameinator.Games.Db.Repositories;
using FinanceGameinator.Games.Domain.Interfaces.Services;
using FinanceGameinator.Games.Domain.Services;
using FinanceGameinator.Games.UseCases.Interfaces;
using FinanceGameinator.Games.UseCases.UseCases;
using FinanceGameinator.Shared.Db.Cross;
using FinanceGameinator.Shared.Db.Interfaces.Cross;
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
            _services.AddTransient<IGameUseCase, GameUseCase>();
            _services.AddTransient<IGameService, GameService>();
            _services.AddTransient<IGameRepository, GameRepository>();
            _services.AddSingleton<IDynamoDbConnection, DynamoDbConnection>();
            

            _services.AddLogging(logging => _logger.SetupLogger(false, logging));
        }
    }
}
