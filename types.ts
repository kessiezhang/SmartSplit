export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptData {
  storeName?: string;
  date?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  isBirthday: boolean;
}

// Map of Item ID -> Array of User IDs who claimed it
export type ItemClaims = Record<string, string[]>;

// Map of Item ID -> { UserID: Amount }
export type CustomSplits = Record<string, Record<string, number>>;

export interface BillState {
  step: 'LANDING' | 'PARSING' | 'SPLIT' | 'SUMMARY' | 'HISTORY';
  receipt: ReceiptData | null;
  imagePreview: string | null;
  users: User[];
  claims: ItemClaims;
  customSplits: CustomSplits;
  tipPercentage: number;
  history: SavedBill[];
}

export interface SavedBill {
  id: string;
  date: string;
  storeName: string;
  total: number;
  attendees: string[];
}

export interface CalculationResult {
  userId: string;
  subtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
  items: { name: string; cost: number }[];
}