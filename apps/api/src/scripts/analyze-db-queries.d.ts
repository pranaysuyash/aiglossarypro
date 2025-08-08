declare class DatabaseQueryAnalyzer {
    private readonly slowQueryThreshold;
    private queryResults;
    private tableStats;
    analyze(): Promise<void>;
    private analyzeTableStatistics;
    private analyzeCommonQueries;
    private analyzeQuery;
    private analyzeExecutionPlan;
    private checkMissingIndexes;
    private analyzeConnectionPool;
    private generateReport;
}
export { DatabaseQueryAnalyzer };
