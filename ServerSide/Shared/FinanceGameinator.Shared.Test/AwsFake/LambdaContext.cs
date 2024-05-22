using Amazon.Lambda.Core;

namespace FinanceGameinator.Shared.Test.AwsFake
{
    public class LambdaContext : ILambdaContext
    {
        public string AwsRequestId => throw new NotImplementedException();

        public IClientContext ClientContext => throw new NotImplementedException();

        public string FunctionName => throw new NotImplementedException();

        public string FunctionVersion => throw new NotImplementedException();

        public ICognitoIdentity Identity => throw new NotImplementedException();

        public string InvokedFunctionArn => throw new NotImplementedException();

        public ILambdaLogger Logger => new LambdaLogger();

        public string LogGroupName => throw new NotImplementedException();

        public string LogStreamName => throw new NotImplementedException();

        public int MemoryLimitInMB => throw new NotImplementedException();

        public TimeSpan RemainingTime => throw new NotImplementedException();
    }
}
