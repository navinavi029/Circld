import { useEffect } from 'react';

/**
 * Custom hook to set the document title dynamically
 * @param title - The page title to set
 * @param appName - Optional app name to append (defaults to "Circl'd")
 */
export function usePageTitle(title: string, appName: string = "Circl'd") {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${appName}` : appName;

    return () => {
      document.title = previousTitle;
    };
  }, [title, appName]);
}
