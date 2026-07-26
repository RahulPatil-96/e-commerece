import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import PageMeta from '@/components/PageMeta';

describe('PageMeta', () => {
  it('updates the document title and description', async () => {
    render(
      <HelmetProvider>
        <PageMeta title="Shop" description="Browse our stationery collection" />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toContain('Shop');
    });

    await waitFor(() => {
      expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Browse our stationery collection');
    });
  });
});
