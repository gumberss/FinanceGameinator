using Amazon;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Shared.Db.Interfaces.Cross;

namespace FinanceGameinator.Shared.Db.Cross
{
    public class DynamoDbConnection : IDynamoDbConnection
    {
        private readonly AmazonDynamoDBConfig _config;

        public DynamoDbConnection(AmazonDynamoDBConfig? config = null)
        {
            _config = config ?? new AmazonDynamoDBConfig
            {
                ServiceURL = "http://localhost:8000",
                UseHttp = true,
                AuthenticationRegion = "us-east-1"
            };
        }

        private AmazonDynamoDBClient _dbClient => new(_config);

        public Task<Result<QueryResponse, BusinessException>> QueryAsync(QueryRequest request, CancellationToken cancellationToken = default)
             => Result.Try(_dbClient.QueryAsync(request, cancellationToken));

        public Task<Result<PutItemResponse, BusinessException>> PutAsync(PutItemRequest request, CancellationToken cancellationToken = default)
             => Result.Try(_dbClient.PutItemAsync(request, cancellationToken));
    }
}
