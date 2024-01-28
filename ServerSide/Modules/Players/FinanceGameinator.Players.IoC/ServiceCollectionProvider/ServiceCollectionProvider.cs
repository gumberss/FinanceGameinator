using FinanceGameinator.Players.Db.Cross;
using FinanceGameinator.Players.Db.Interfaces.Cross;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Db.Repositories;
using FinanceGameinator.Players.UseCases.Interfaces.UseCases;
using FinanceGameinator.Players.UseCases.UseCases;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceGameinator.Players.IoC.ServiceCollectionProvider
{
    public class ServiceCollectionProvider
    {
        private ServiceCollection _serviceCollection;

        public ServiceCollection ServiceCollection => _serviceCollection;

        public ServiceCollectionProvider()
        {
            _serviceCollection = new ServiceCollection();
            ConfigureServices();
        }

        private void ConfigureServices()
        {
            _serviceCollection.AddTransient<IPlayerRepository, PlayersRepository>();
            _serviceCollection.AddTransient<IDynamoDbConnection, DynamoDbConnection>();
            _serviceCollection.AddTransient<IPlayerUseCase, PlayerUseCase>();
        }
    }
}
