import { AppState, DEFAULT_CATEGORIES } from '../types';

const DB_NAME = 'CashPilotDB';
const DB_VERSION = 1;
const STORE_STATE = 'app_state';
const STORE_AUTH = 'auth';
const KEY_ROOT = 'root';
const KEY_PIN = 'user_pin';

export const DEFAULT_STATE: AppState = {
  transactions: [],
  loans: [],
  accounts: [
    { id: 'acc_1', name: 'Main Wallet', balance: 0, currency: 'USD' }
  ],
  settings: {
    currency: 'USD',
    darkMode: false,
    categories: DEFAULT_CATEGORIES,
  },
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
      if (!db.objectStoreNames.contains(STORE_AUTH)) {
        db.createObjectStore(STORE_AUTH);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const loadState = async (): Promise<AppState> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const store = tx.objectStore(STORE_STATE);
      const request = store.get(KEY_ROOT);

      request.onsuccess = () => {
        const data = request.result;
        if (!data) {
            // Migration: Check localStorage for old data once
            const legacy = localStorage.getItem('cash_pilot_db_v1');
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy);
                    // Save to IDB immediately
                    saveState(parsed);
                    // Optional: Clear legacy
                    // localStorage.removeItem('cash_pilot_db_v1'); 
                    resolve(mergeDefaults(parsed));
                    return;
                } catch(e) {}
            }
            resolve(DEFAULT_STATE);
        } else {
            resolve(mergeDefaults(data));
        }
      };
      
      request.onerror = () => resolve(DEFAULT_STATE);
    });
  } catch (error) {
    console.error("DB Load Error", error);
    return DEFAULT_STATE;
  }
};

const mergeDefaults = (parsed: any): AppState => {
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : DEFAULT_STATE.transactions,
      loans: Array.isArray(parsed.loans) ? parsed.loans : DEFAULT_STATE.loans,
      accounts: (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) 
        ? parsed.accounts 
        : DEFAULT_STATE.accounts,
      settings: {
        currency: parsed.settings?.currency || DEFAULT_STATE.settings.currency,
        darkMode: parsed.settings?.darkMode ?? DEFAULT_STATE.settings.darkMode,
        categories: {
          income: Array.isArray(parsed.settings?.categories?.income) 
            ? parsed.settings.categories.income 
            : DEFAULT_STATE.settings.categories.income,
          expense: Array.isArray(parsed.settings?.categories?.expense) 
            ? parsed.settings.categories.expense 
            : DEFAULT_STATE.settings.categories.expense,
        }
      }
    };
};

export const saveState = async (state: AppState) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_STATE, 'readwrite');
    const store = tx.objectStore(STORE_STATE);
    store.put(state, KEY_ROOT);
  } catch (e) {
    console.error("Failed to save state to IDB", e);
  }
};

// --- AUTH UTILS ---

export const hasPin = async (): Promise<boolean> => {
    const db = await openDB();
    return new Promise(resolve => {
        const tx = db.transaction(STORE_AUTH, 'readonly');
        const req = tx.objectStore(STORE_AUTH).get(KEY_PIN);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
    });
};

export const verifyPin = async (inputPin: string): Promise<boolean> => {
    const db = await openDB();
    return new Promise(resolve => {
        const tx = db.transaction(STORE_AUTH, 'readonly');
        const req = tx.objectStore(STORE_AUTH).get(KEY_PIN);
        req.onsuccess = () => resolve(req.result === inputPin);
        req.onerror = () => resolve(false);
    });
};

export const setPin = async (pin: string) => {
    const db = await openDB();
    const tx = db.transaction(STORE_AUTH, 'readwrite');
    tx.objectStore(STORE_AUTH).put(pin, KEY_PIN);
};

export const removePin = async () => {
    const db = await openDB();
    const tx = db.transaction(STORE_AUTH, 'readwrite');
    tx.objectStore(STORE_AUTH).delete(KEY_PIN);
};

// --- EXPORT UTILS ---
export const getStorageUsage = async (): Promise<string> => {
    // Estimating IDB size is tricky in all browsers, 
    // but we can estimate the JSON size of the state.
    const state = await loadState();
    const str = JSON.stringify(state);
    const bytes = new Blob([str]).size;
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
};

export const exportData = async () => {
  const state = await loadState();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `cash_pilot_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const importData = async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                
                // Simple validation
                if (!json.transactions || !json.accounts) {
                    throw new Error("Invalid backup file format");
                }

                // Merge with defaults to ensure structure
                const newState = mergeDefaults(json);
                
                // Save to DB
                const db = await openDB();
                const tx = db.transaction(STORE_STATE, 'readwrite');
                const store = tx.objectStore(STORE_STATE);
                const req = store.put(newState, KEY_ROOT);
                
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(new Error("Failed to write to DB"));
            } catch (err) {
                console.error(err);
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};

export const exportCSV = async () => {
  const state = await loadState();
  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Currency', 'Account', 'Notes', 'Related Loan ID'];
  
  const rows = state.transactions.map(t => {
    const acc = state.accounts.find(a => a.id === t.accountId);
    const currency = acc?.currency || state.settings.currency;
    const safeNotes = (t.notes || '').replace(/"/g, '""');
    
    return [
      t.id,
      t.date,
      t.type,
      t.category,
      t.amount,
      currency,
      acc?.name || 'Unknown Account',
      `"${safeNotes}"`,
      t.relatedLoanId || ''
    ].join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows].join('\n'));
  
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", csvContent);
  downloadAnchorNode.setAttribute("download", `cash_pilot_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};