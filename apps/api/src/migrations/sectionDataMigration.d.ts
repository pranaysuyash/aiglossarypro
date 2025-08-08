export declare const STANDARD_SECTIONS: {
    name: string;
    order: number;
}[];
export declare function migrateSectionData(): Promise<{
    success: boolean;
    sectionsCreated: number;
}>;
