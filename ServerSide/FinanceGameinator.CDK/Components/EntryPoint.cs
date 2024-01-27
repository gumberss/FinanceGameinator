using Amazon.CDK;
using Constructs;
using FinanceGameinator.CDK.Components.Cross;
using FinanceGameinator.CDK.Components.Modules.Player;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceGameinator.CDK.Components
{
    internal class EntryPoint : Stack
    {
        internal EntryPoint(Construct scope, string id, IStackProps? props = null) : base(scope, id, props)
        {
            var cognitoStack = new CognitoStack(this, scope, props);

            var dynamoDbStack = new DynamoDbStack(this, scope, props);
            var dbTable = dynamoDbStack.RegisterTable();

            var restApiStack = new RestApiStack(this, scope, props);

            var playerStack = new PlayerStack(this, scope, props);
            playerStack.RegisterPlayerStacks(restApiStack, cognitoStack, dbTable);

        }
    }
}
