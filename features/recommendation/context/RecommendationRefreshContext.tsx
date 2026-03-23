import React, { createContext, ReactNode, useContext, useState } from 'react';

interface RecommendationRefreshContextValue {
  needsRecommendationRefresh: boolean;
  markRecommendationRefreshNeeded: () => void;
  clearRecommendationRefreshNeeded: () => void;
}

const RecommendationRefreshContext = createContext<RecommendationRefreshContextValue | undefined>(undefined);

export function RecommendationRefreshProvider({ children }: { children: ReactNode }) {
  const [needsRecommendationRefresh, setNeedsRecommendationRefresh] = useState(false);

  return (
    <RecommendationRefreshContext.Provider
      value={{
        needsRecommendationRefresh,
        markRecommendationRefreshNeeded: () => setNeedsRecommendationRefresh(true),
        clearRecommendationRefreshNeeded: () => setNeedsRecommendationRefresh(false),
      }}
    >
      {children}
    </RecommendationRefreshContext.Provider>
  );
}

export function useRecommendationRefresh() {
  const context = useContext(RecommendationRefreshContext);
  if (!context) {
    throw new Error('useRecommendationRefresh must be used within RecommendationRefreshProvider');
  }
  return context;
}
