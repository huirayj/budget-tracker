let db;
const bs = 'BudgetStore';

// request for a "budget" database.
const request = indexedDB.open('budgetDB', 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;

  db.createObjectStore(bs, { autoIncrement: true });
};

request.onerror = (e) => console.log("Error", e.target.errorCode);

const checkDatabase = () => {
  // open a transaction with bs
  let transaction = db.transaction([bs], 'readwrite');
  // access your bs object
  const store = transaction.objectStore(bs);
  const getAll = store.getAll();

  // if request was successful
  getAll.onsuccess = () => {
    // if there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((res) => {
          // if returned response is not empty
          if (res.length !== 0) {
            // open another transaction
            transaction = db.transaction([bs], 'readwrite');
            const currentStore = transaction.objectStore(bs);

            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = (e) => {
  db = e.target.result;

  // if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

const saveRecord = (record) => {
  transaction = db.transaction([bs], 'readwrite');
  const store = transaction.objectStore(bs);

  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
