using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Players.Db.Adapters;
using FinanceGameinator.Players.Db.Interfaces.Cross;
using FinanceGameinator.Players.Db.Interfaces.Repositories;
using FinanceGameinator.Players.Domain.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace FinanceGameinator.Players.Db.Repositories
{
    public class PlayersRepository : IPlayerRepository
    {
        readonly IDynamoDbConnection _dbConnection;
        private readonly ILogger<PlayersRepository> _logger;

        public PlayersRepository(ILogger<PlayersRepository> logger, IDynamoDbConnection dbConnection)
        {
            _logger = logger;
            _dbConnection = dbConnection;
        }


        public async Task<Result<Player, BusinessException>> QueryPlayer(Guid playerId)
            => await PlayerAdapter.ToGetPlayerByIdRequest(playerId)
                .Then(queryRequest => _dbConnection.QueryAsync(queryRequest))
                .Then(response => PlayerAdapter.ToPlayer(playerId, response.Items));

        public async Task<Result<PlayerRegistration, BusinessException>> Register(PlayerRegistration registrationData)
        {
            try
            {
                var putRequest = PlayerAdapter.ToPlayerRegistrationRequest(registrationData);

                var result = await _dbConnection.PutAsync(putRequest);

                if (result.IsFailure && result.Error.InnerException?.GetType() != typeof(ConditionalCheckFailedException))
                {
                    return result.Error;
                }

                return registrationData;
            }
            catch (ConditionalCheckFailedException ex)
            {
                return registrationData;
            }
            catch (Exception ex)
            {
                return Result.FromError<PlayerRegistration>(new BusinessException(System.Net.HttpStatusCode.InternalServerError, ex.Message));
            }
        }

    }
}
