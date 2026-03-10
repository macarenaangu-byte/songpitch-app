import { useState, useCallback, useRef } from 'react';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Reusable pagination hook for Supabase queries.
 *
 * @param {Function} fetchFn - async (from, to) => { data: [], count: number }
 * @param {number} pageSize - items per page (default 20)
 * @returns {{ items, setItems, loading, loadingMore, hasMore, totalCount, loadInitial, loadMore }}
 */
export function usePagination(fetchFn, pageSize = DEFAULT_PAGE_SIZE) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchRef.current(0, pageSize - 1);
      setItems(data || []);
      setTotalCount(count || 0);
      setHasMore((data || []).length >= pageSize);
    } catch (err) {
      console.error('Pagination load error:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = items.length;
      const to = from + pageSize - 1;
      const { data } = await fetchRef.current(from, to);
      const newItems = data || [];
      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length >= pageSize);
      setTotalCount(prev => Math.max(prev, items.length + newItems.length));
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [items.length, loadingMore, hasMore, pageSize]);

  return { items, setItems, loading, loadingMore, hasMore, totalCount, loadInitial, loadMore };
}
