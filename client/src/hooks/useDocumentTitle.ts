import { useEffect } from 'react';

export default function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | Simple Bank` : 'Simple Bank';
  }, [pageTitle]);
}
