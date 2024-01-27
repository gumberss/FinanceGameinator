using Amazon.CDK;
using Amazon.CDK.AWS.DynamoDB;
using DynamoDb = Amazon.CDK.AWS.DynamoDB;
using Constructs;
using FinanceGameinator.CDK.Models;

namespace FinanceGameinator.CDK.Components.Cross
{
    internal class DynamoDbStack : FinanceGameinatorStack
    {
        internal DynamoDbStack(Stack stack,  Construct scope, IStackProps? props = null) : base(stack, scope, props)
        { }

        internal Table RegisterTable()
            => new Table(Stack, "FinanceGameinatorTable", new TableProps
            {
                PartitionKey = new DynamoDb.Attribute { Name = "PK", Type = AttributeType.STRING },
                SortKey = new DynamoDb.Attribute { Name = "SK", Type = AttributeType.STRING },
                BillingMode = BillingMode.PROVISIONED,
                ReadCapacity = 10,
                WriteCapacity = 10,
            });

    }
}


