using Amazon.DynamoDBv2.Model;
using CleanHandling;

namespace FinanceGameinator.Shared.Db.Interfaces.Cross
{
    public interface IDynamoDbConnection
    {
        Task<Result<QueryResponse, BusinessException>> QueryAsync(QueryRequest request, CancellationToken cancellationToken = default);
        Task<Result<PutItemResponse, BusinessException>> PutAsync(PutItemRequest request, CancellationToken cancellationToken = default);
    }
}
