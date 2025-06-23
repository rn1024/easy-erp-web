import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

// 虚拟滚动Hook
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight), items.length - 1);

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // 60fps
    []
  );

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    onScroll,
    offsetY: visibleRange.start * itemHeight,
  };
}

// 防抖搜索Hook
export function useDebounceSearch(searchFn: (query: string) => void, delay: number = 300) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchFn = useRef(debounce(searchFn, delay)).current;

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearchFn(searchQuery);
    }
  }, [searchQuery, debouncedSearchFn]);

  useEffect(() => {
    return () => {
      debouncedSearchFn.cancel();
    };
  }, [debouncedSearchFn]);

  return {
    searchQuery,
    setSearchQuery,
  };
}

// 数据缓存Hook
export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    staleTime?: number; // 数据保持新鲜时间
    cacheTime?: number; // 缓存保持时间
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5分钟
    cacheTime = 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const isStale = useMemo(() => {
    return Date.now() - lastFetch > staleTime;
  }, [lastFetch, staleTime]);

  const fetchData = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastFetch(Date.now());

      // 存储到本地缓存
      localStorage.setItem(
        `cache_${key}`,
        JSON.stringify({
          data: result,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetcher, key, loading]);

  // 从本地缓存加载数据
  useEffect(() => {
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTime) {
          setData(cachedData);
          setLastFetch(timestamp);
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      } catch {
        localStorage.removeItem(`cache_${key}`);
      }
    }
  }, [key, cacheTime]);

  // 自动刷新过期数据
  useEffect(() => {
    if (!data || isStale) {
      fetchData();
    }
  }, [data, isStale, fetchData]);

  // 窗口聚焦时刷新
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, isStale, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isStale,
  };
}

// 分页优化Hook
export function usePaginationOptimization(totalItems: number, pageSize: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const [cachedPages, setCachedPages] = useState<Map<number, any>>(new Map());

  const totalPages = Math.ceil(totalItems / pageSize);

  const prefetchPage = useCallback((page: number) => {
    // 预加载逻辑，可以在这里实现页面预取
    console.log(`Prefetching page ${page}`);
  }, []);

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(page);

      // 预加载相邻页面
      if (page > 1 && !cachedPages.has(page - 1)) {
        prefetchPage(page - 1);
      }
      if (page < totalPages && !cachedPages.has(page + 1)) {
        prefetchPage(page + 1);
      }
    },
    [totalPages, cachedPages, prefetchPage]
  );

  return {
    currentPage,
    totalPages,
    changePage,
    cachedPages,
    setCachedPages,
  };
}

// 性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const endTime = performance.now();
      const duration = endTime - renderStartTime.current;
      setRenderTime(duration);

      // 记录性能数据
      if (duration > 16.67) {
        // 超过60fps阈值
        console.warn(`${componentName} 渲染时间过长: ${duration.toFixed(2)}ms`);
      }

      // 可以发送到性能监控系统
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name: componentName,
          value: Math.round(duration),
        });
      }
    }
  });

  return { renderTime };
}

// 内存优化Hook
export function useMemoryOptimization() {
  const cleanupTasks = useRef<(() => void)[]>([]);

  const addCleanupTask = useCallback((task: () => void) => {
    cleanupTasks.current.push(task);
  }, []);

  useEffect(() => {
    return () => {
      cleanupTasks.current.forEach((task) => task());
      cleanupTasks.current = [];
    };
  }, []);

  return { addCleanupTask };
}

// 图片懒加载Hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imageRef || !('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef, src]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, src]);

  return {
    imageSrc,
    setImageRef,
    isLoaded,
    isInView,
  };
}

// 表格虚拟化Hook（特别适用于大量数据的表格）
export function useVirtualTable<T>(
  data: T[],
  rowHeight: number,
  containerHeight: number,
  columns: any[]
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const visibleRowRange = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight);
    const end = Math.min(start + Math.ceil(containerHeight / rowHeight), data.length - 1);

    return { start: Math.max(0, start - 5), end: Math.min(data.length - 1, end + 5) };
  }, [scrollTop, rowHeight, containerHeight, data.length]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRowRange.start, visibleRowRange.end + 1);
  }, [data, visibleRowRange]);

  const onScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
      setScrollLeft(e.currentTarget.scrollLeft);
    }, 16),
    []
  );

  return {
    visibleData,
    visibleRowRange,
    totalHeight: data.length * rowHeight,
    onScroll,
    scrollLeft,
    offsetY: visibleRowRange.start * rowHeight,
  };
}

// 数据预加载Hook
export function useDataPreloader<T>(
  dataLoader: (params: any) => Promise<T>,
  preloadConditions: any[]
) {
  const preloadedData = useRef<Map<string, T>>(new Map());

  const preloadData = useCallback(
    async (params: any) => {
      const key = JSON.stringify(params);
      if (!preloadedData.current.has(key)) {
        try {
          const data = await dataLoader(params);
          preloadedData.current.set(key, data);
        } catch (error) {
          console.error('Preload failed:', error);
        }
      }
    },
    [dataLoader]
  );

  useEffect(() => {
    preloadConditions.forEach((condition) => {
      preloadData(condition);
    });
  }, [preloadConditions, preloadData]);

  const getPreloadedData = useCallback((params: any) => {
    const key = JSON.stringify(params);
    return preloadedData.current.get(key);
  }, []);

  return { getPreloadedData, preloadData };
}
