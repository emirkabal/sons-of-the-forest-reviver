const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".loading").style.display = "none";
  document.getElementById("content").style.display = "block";
  console.log("DOM loaded");
  document.getElementById("btn").addEventListener("click", () => {
    console.log("Sending forest-data to main");
    ipcRenderer.send("forest-data", "Hello from renderer");
    document.getElementById("btn").setAttribute("disabled", "true");
  });
  ipcRenderer.send("getLocation");

  ipcRenderer.on("location", (event, args) => {
    document.getElementById("location").textContent = args;
  });

  document.getElementById("location").addEventListener("click", () => {
    ipcRenderer.send("openExplorer");
  });

  ipcRenderer.on("forest-data-fix", (event, args) => {
    console.log("Received forest-data from main");
    document.getElementById("btn").removeAttribute("disabled");
    document.getElementById("notify").style.display = "block";
    setTimeout(() => {
      document.getElementById("notify").style.display = "none";
    }, 3000);
  });
});
