export interface ITransaction {
    id: string;
    // '2026-02-03'
    date: string;
    expense: number;
    income: number;
    category?: string | null;
    note?: string | null;
    timestamp: string;
}

export interface ITransactionYDB {
    id: Buffer;
    date: Date;
    expense: BigInt;
    income: BigInt;
    category: Buffer | null;
    note: Buffer | null;
    timestamp: BigInt;
}
