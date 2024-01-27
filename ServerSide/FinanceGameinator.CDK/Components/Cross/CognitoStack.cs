using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Cognito;
using Constructs;
using FinanceGameinator.CDK.Models;

namespace FinanceGameinator.CDK.Components.Cross
{
    internal class CognitoStack : FinanceGameinatorStack
    {
        private UserPool UserPool { get; }
        private UserPoolDomain UserPoolDomain { get; }
        private UserPoolClient UserPoolClient { get; }
        private CognitoUserPoolsAuthorizer CognitoAuthorizer { get; }

        internal CognitoStack(Stack stack,  Construct scope, IStackProps? props = null) : base(stack, scope, props)
        {
            UserPool = RegisterUserPool();
            UserPoolDomain = RegisterDomain(UserPool);
            UserPoolClient = RegisterAppClient(UserPool);
            CognitoAuthorizer = RegisterCognitoAuthorizer(UserPool);
        }

        internal MethodOptions MethodAuthorizer()
          => new MethodOptions
          {
              Authorizer = CognitoAuthorizer,
              AuthorizationType = AuthorizationType.COGNITO

          };
        private CognitoUserPoolsAuthorizer RegisterCognitoAuthorizer(UserPool userPool)
            => new CognitoUserPoolsAuthorizer(Stack, "FinanceGameinatorCognitoAuthorizer", new CognitoUserPoolsAuthorizerProps
            {
                CognitoUserPools = new[] { userPool },
                IdentitySource = "method.request.header.Authorization"
            });


        private UserPool RegisterUserPool()
        {
            var userPool = new UserPool(Stack, "FinanceGameinatorUserPool", new UserPoolProps()
            {
                SignInAliases = new SignInAliases
                {
                    Email = true
                },
                SelfSignUpEnabled = true,
                AutoVerify = new AutoVerifiedAttrs
                {
                    Email = true
                },
                UserVerification = new UserVerificationConfig
                {
                    EmailSubject = "You need to verify your email",
                    EmailBody = "Thanks for signing up Your verification code is {####}",
                    EmailStyle = VerificationEmailStyle.CODE,
                },
                StandardAttributes = new StandardAttributes()
                {
                    Email = new StandardAttribute()
                    {
                        Required = true
                    }
                },
                CustomAttributes = new Dictionary<string, ICustomAttribute> { },
                PasswordPolicy = new PasswordPolicy
                {
                    MinLength = 8,
                    RequireLowercase = false,
                    RequireUppercase = false,
                    RequireDigits = false,
                    RequireSymbols = false,
                },
                Email = UserPoolEmail.WithCognito(),
                AccountRecovery = AccountRecovery.EMAIL_ONLY,
                RemovalPolicy = RemovalPolicy.DESTROY,

            });

            return userPool;
        }

        private UserPoolDomain RegisterDomain(UserPool userPool)
        {
            return userPool.AddDomain("FinanceGameinatorDomain", new UserPoolDomainOptions
            {
                CognitoDomain = new CognitoDomainOptions
                {
                    DomainPrefix = "finance-gameinator"
                }
            });
        }

        private UserPoolClient RegisterAppClient(UserPool userPool)
        {
            return userPool.AddClient("appClient", new UserPoolClientOptions
            {
                IdTokenValidity = Duration.Hours(6),
                AccessTokenValidity = Duration.Hours(6),
                AuthFlows = new AuthFlow
                {
                    UserPassword = true,
                    UserSrp = true
                }
            });
        }
    }
}
