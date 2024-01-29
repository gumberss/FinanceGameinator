using Amazon.DynamoDBv2.Model;
using CleanHandling;

namespace FinanceGameinator.Players.Db.Interfaces.Cross
{
    public interface IDynamoDbConnection
    {
        Task<Result<QueryResponse, BusinessException>> QueryAsync(QueryRequest request, CancellationToken cancellationToken = default);
    }
}
