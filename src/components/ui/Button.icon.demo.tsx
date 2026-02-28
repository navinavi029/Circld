import { Button } from './Button';

// Demo icon components
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/**
 * Button Icon Support Demo
 * 
 * This demo showcases the icon support features of the Button component:
 * - Icon-only buttons with square proportions
 * - Leading icon position (icon before text)
 * - Trailing icon position (icon after text)
 * - Icon buttons across all variants
 * - Icon buttons in different sizes
 * - Accessibility with aria-label for icon-only buttons
 */
export function ButtonIconDemo() {
  return (
    <div className="p-8 space-y-12 bg-background dark:bg-gray-900 min-h-screen">
      <div>
        <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-white">
          Icon-Only Buttons (Requirement 13.1, 13.2, 13.3)
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Primary:</span>
            <Button variant="primary" aria-label="Like">
              <HeartIcon />
            </Button>
            <Button variant="primary" size="sm" aria-label="Like small">
              <HeartIcon />
            </Button>
            <Button variant="primary" size="lg" aria-label="Like large">
              <HeartIcon />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Secondary:</span>
            <Button variant="secondary" aria-label="Add">
              <PlusIcon />
            </Button>
            <Button variant="secondary" size="sm" aria-label="Add small">
              <PlusIcon />
            </Button>
            <Button variant="secondary" size="lg" aria-label="Add large">
              <PlusIcon />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Outline:</span>
            <Button variant="outline" aria-label="Next">
              <ArrowRightIcon />
            </Button>
            <Button variant="outline" size="sm" aria-label="Next small">
              <ArrowRightIcon />
            </Button>
            <Button variant="outline" size="lg" aria-label="Next large">
              <ArrowRightIcon />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Ghost:</span>
            <Button variant="ghost" aria-label="More">
              <PlusIcon />
            </Button>
            <Button variant="ghost" size="sm" aria-label="More small">
              <PlusIcon />
            </Button>
            <Button variant="ghost" size="lg" aria-label="More large">
              <PlusIcon />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Danger:</span>
            <Button variant="danger" aria-label="Delete">
              <TrashIcon />
            </Button>
            <Button variant="danger" size="sm" aria-label="Delete small">
              <TrashIcon />
            </Button>
            <Button variant="danger" size="lg" aria-label="Delete large">
              <TrashIcon />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-white">
          Leading Icon Position (Requirement 13.5)
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="primary">
              <HeartIcon />
              Like
            </Button>
            <Button variant="secondary">
              <PlusIcon />
              Add Item
            </Button>
            <Button variant="outline">
              <ArrowRightIcon />
              Continue
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="primary" size="sm">
              <HeartIcon />
              Like
            </Button>
            <Button variant="secondary" size="lg">
              <PlusIcon />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-white">
          Trailing Icon Position (Requirement 13.5)
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="primary" iconPosition="trailing">
              <HeartIcon />
              Like
            </Button>
            <Button variant="secondary" iconPosition="trailing">
              <PlusIcon />
              Add Item
            </Button>
            <Button variant="outline" iconPosition="trailing">
              <ArrowRightIcon />
              Continue
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="primary" size="sm" iconPosition="trailing">
              <HeartIcon />
              Like
            </Button>
            <Button variant="secondary" size="lg" iconPosition="trailing">
              <PlusIcon />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-white">
          Icon Buttons with States
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Loading:</span>
            <Button variant="primary" isLoading aria-label="Loading">
              <HeartIcon />
            </Button>
            <Button variant="secondary" isLoading>
              <PlusIcon />
              Add Item
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary dark:text-gray-400 w-24">Disabled:</span>
            <Button variant="primary" disabled aria-label="Disabled">
              <HeartIcon />
            </Button>
            <Button variant="danger" disabled>
              <TrashIcon />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-white">
          Gap Spacing (Requirement 12.2, 13.4)
        </h2>
        <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
          Consistent gap spacing between icon and text across all sizes
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="primary" size="sm">
              <PlusIcon />
              Small (gap-1.5)
            </Button>
            <Button variant="primary" size="md">
              <PlusIcon />
              Medium (gap-2)
            </Button>
            <Button variant="primary" size="lg">
              <PlusIcon />
              Large (gap-2.5)
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2 text-yellow-900 dark:text-yellow-200">
          Accessibility Note
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Icon-only buttons require an <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">aria-label</code> attribute for accessibility.
          The Button component will log a warning in development mode if an icon-only button lacks this attribute.
        </p>
      </div>
    </div>
  );
}
