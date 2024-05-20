using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Players.Db.Interfaces.Cross;

namespace FinanceGameinator.Players.Db.Cross
{
    public class DynamoDbConnection : IDynamoDbConnection
    {
        private static AmazonDynamoDBClient _dbClient => new AmazonDynamoDBClient();

        public Task<Result<QueryResponse, BusinessException>> QueryAsync(QueryRequest request, CancellationToken cancellationToken = default)
             => Result.Try(_dbClient.QueryAsync(request, cancellationToken));

        public Task<Result<PutItemResponse, BusinessException>> PutAsync(PutItemRequest request, CancellationToken cancellationToken = default)
             => Result.Try(_dbClient.PutItemAsync(request, cancellationToken));



    }
}
