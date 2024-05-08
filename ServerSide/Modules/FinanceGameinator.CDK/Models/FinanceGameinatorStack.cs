using Amazon.CDK;
using Constructs;

namespace FinanceGameinator.CDK.Models
{
    internal class FinanceGameinatorStack
    {
        protected Stack Stack { get; }
        private Construct Scope { get; }
        private IStackProps? Props { get; }

        internal FinanceGameinatorStack(Stack stack, Construct scope, IStackProps? props = null)
        {
            Stack = stack;
            Scope = scope;
            Props = props;
        }
    }
}
