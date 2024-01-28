using Amazon.DynamoDBv2.Model;
using FinanceGameinator.Players.Domain.Models;
using CleanHandling;
using System.Net;

namespace FinanceGameinator.Players.Db.Adapters
{
    internal class PlayerAdapter
    {
        private static readonly String PLAYER_PREFIX = "Player#";
        private static readonly String GAME_PREFIX = "Game#";
        private static readonly String SK_COLL = "SK";
        private static readonly String PK_COLL = "PK";
        private static readonly String tableName = "FinanceGameinatorTable";

        internal static Result<QueryRequest, BusinessException> ToGetPlayerByIdRequest(Guid playerId)
            => new QueryRequest
            {
                TableName = tableName,
                KeyConditionExpression = $"{PK_COLL} = :pk",
                ExpressionAttributeValues = new Dictionary<String, AttributeValue>
                {
                    { ":pk", new AttributeValue { S = $"{PK_COLL}{playerId}" } }
                }
            };

        internal static Result<Player, BusinessException> ToPlayer(Guid playerId, List<Dictionary<String, AttributeValue>> rows)
        {
            var pk = $"{PLAYER_PREFIX}{playerId}";

            var playerMetadata = rows.Find(row => row[PK_COLL].S == pk && row[SK_COLL].S == pk);

            if (playerMetadata is null)
            {
                return new BusinessException(HttpStatusCode.NotFound, $"Not found a player metadata with the PK {pk}");
            }

            var games = rows
                .Where(row => row[SK_COLL].S.StartsWith(GAME_PREFIX))
                .Select(GameFrom)
                .ToList();

            return new Player(playerId, playerMetadata["Name"].S, games);
        }

        private static Guid FromKey(AttributeValue attrValue)
            => Guid.Parse(attrValue.S.Replace(GAME_PREFIX, String.Empty));

        private static Game GameFrom(Dictionary<String, AttributeValue> attributes)
         => new Game(FromKey(attributes[SK_COLL]), attributes["Name"].S);
    }
}
