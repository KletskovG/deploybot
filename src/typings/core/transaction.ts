export interface ITransaction {
    id: string;
    // '2026-02-03'
    date: string;
    expense: number;
    category?: string | null;
    note?: string | null;
    timestamp: string;
}
