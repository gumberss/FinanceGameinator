using Amazon.Lambda.Core;
using FinanceGameinator.Players.Api.Ports;

namespace FinanceGameinator.Players.Integration.Test
{
    class LambdaLogger : ILambdaLogger
    {
        public void Log(string message)
        {
            Console.WriteLine(message);
        }

        public void LogLine(string message)
        {
            Console.WriteLine(message);
        }
    }

    class LambdaContext : ILambdaContext
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

    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {

            try
            {
                new HttpServer()
                .Register(new Amazon.Lambda.APIGatewayEvents.APIGatewayProxyRequest()
                {
                    Body = "{\"name\":\"World\", \"id\": \"d07caa41-5c09-45d0-ac8b-fb82078bc6c9\"}",
                }, new LambdaContext())
                .Wait();

            }
            catch (Exception e)
            {

            }

            var dic = new Dictionary<String, String>();
            dic.Add("id", "d07caa41-5c09-45d0-ac8b-fb82078bc6c9");
            try
            {
                new HttpServer()
                .Get(new Amazon.Lambda.APIGatewayEvents.APIGatewayProxyRequest() { PathParameters = dic }, new LambdaContext())
                .Wait();

            }
            catch (Exception e)
            {

            }
        }
    }
}