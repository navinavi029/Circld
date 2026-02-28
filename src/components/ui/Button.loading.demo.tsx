import { useState } from 'react';
import { Button } from './Button';

/**
 * Demo component to showcase loading state functionality
 * This demonstrates Requirements 14.1-14.5 and 8.5
 */
export const ButtonLoadingDemo = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Loading State Demo</h2>
        <p className="text-gray-600 mb-4">
          Click the button to see the loading state in action
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Interactive Example</h3>
          <Button onClick={handleClick} isLoading={isLoading}>
            {isLoading ? 'Loading...' : 'Click Me'}
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">All Variants with Loading</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" isLoading>
              Primary Loading
            </Button>
            <Button variant="secondary" isLoading>
              Secondary Loading
            </Button>
            <Button variant="outline" isLoading>
              Outline Loading
            </Button>
            <Button variant="ghost" isLoading>
              Ghost Loading
            </Button>
            <Button variant="danger" isLoading>
              Danger Loading
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">All Sizes with Loading</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm" isLoading>
              Small
            </Button>
            <Button size="md" isLoading>
              Medium
            </Button>
            <Button size="lg" isLoading>
              Large
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Loading Without Text</h3>
          <Button isLoading aria-label="Loading" />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Comparison: Normal vs Loading</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Normal State</Button>
            <Button variant="primary" isLoading>
              Loading State
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Notice: Both buttons maintain the same dimensions (Requirement 14.3)
          </p>
        </div>
      </div>
    </div>
  );
};
