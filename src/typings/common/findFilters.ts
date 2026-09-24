import { ITransaction } from '@typings/core/transaction';

export interface IFindFiltersOptions {
  date?: ITransaction['date'];
  expense?: ITransaction['expense'];
  income?: ITransaction['income'];
  category?: ITransaction['category'];
  note?: ITransaction['note'];
}
