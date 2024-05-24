using Amazon.DynamoDBv2.Model;
using CleanHandling;
using FinanceGameinator.Games.Domain.Models;
using System.Net;

namespace FinanceGameinator.Games.Db.Adapters
{
    internal class GameAdapter
    {
        private static readonly String PREFIX = "Game#";
        private static readonly String SK_COLL = "SK";
        private static readonly String PK_COLL = "PK";
        private static readonly String tableName = "FinanceGameinatorTable";

        internal static Result<QueryRequest, BusinessException> ToGetByIdRequest(String code)
            => new QueryRequest
            {
                TableName = tableName,
                KeyConditionExpression = $"{PK_COLL} = :pk",
                ExpressionAttributeValues = new Dictionary<String, AttributeValue>
                {
                    { ":pk", new AttributeValue { S = $"{PREFIX}{code}" } }
                }
            };

        internal static Result<Game, BusinessException> ToModel(String code, List<Dictionary<String, AttributeValue>> rows)
        {
            var pk = $"{PREFIX}{code}";

            var metadata = rows.Find(row => row[PK_COLL].S == pk && row[SK_COLL].S == pk);

            if (metadata is null)
            {
                return new BusinessException(HttpStatusCode.NotFound, $"Not found a game metadata with the PK {pk}");
            }

            return new Game(code, metadata["Name"].S);
        }

        internal static Result<PutItemRequest, BusinessException> ToRegistrationRequest(GameRegistration registrationData)
            => new PutItemRequest
            {
                TableName = tableName,
                Item = new Dictionary<string, AttributeValue>()
                {
                    { PK_COLL, new AttributeValue { S = $"{PREFIX}{registrationData.Code}" }},
                    { SK_COLL, new AttributeValue { S = $"{PREFIX}{registrationData.Code}" }},
                    { "Name", new AttributeValue { S = registrationData.Name }},
                    //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/LowLevelDotNetItemCRUD.html
                },
                ConditionExpression = "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    { "#pk", PK_COLL },
                    { "#sk", SK_COLL }
                }
            };


    }
}
