const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { exec } = require("node:child_process");
const { getReadableJSON, getWritableJSON } = require("./utils");

const username = os.userInfo().username;

const forestPath =
  "C:\\Users\\" + username + "\\AppData\\LocalLow\\Endnight\\SonsOfTheForest\\";
let profile;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, "/renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

const collectSavesData = () => {
  if (!fs.existsSync(forestPath + "Saves")) return;
  const profiles = fs.readdirSync(forestPath + "Saves");
  console.log(profiles);
  if (profiles.length == 0) {
    console.log("No profiles found");
    return;
  }
  profile = profiles[0];

  const savePath = forestPath + "Saves\\" + profile + "\\";
  const importantFiles = [
    "GameStateSaveData.json",
    "PlayerStateSaveData.json",
    "SaveData.json",
  ];

  function fixFiles(name = "Singleplayer") {
    if (!fs.existsSync(savePath + name)) return;
    const saveFolders = fs.readdirSync(savePath + name);
    const position = {
      x: -1151.51819,
      y: 138.793945,
      z: -223.8553,
    };
    saveFolders.forEach((saveFolder) => {
      const saveFiles = fs.readdirSync(savePath + name + "\\" + saveFolder);
      saveFiles.sort((a, b) => {
        if (a == importantFiles[0]) return -1;
        if (b == importantFiles[0]) return 1;
        if (a == importantFiles[1]) return -1;
        if (b == importantFiles[1]) return 1;
        if (a == importantFiles[2]) return -1;
        if (b == importantFiles[2]) return 1;
        return 0;
      });
      saveFiles.forEach((saveFile) => {
        if (!importantFiles.includes(saveFile)) return;
        console.log(name + "->" + saveFile);
        const saveData = fs.readFileSync(
          savePath + name + "\\" + saveFolder + "\\" + saveFile,
          "utf8"
        );
        if (importantFiles[0] == saveFile) {
          const defaultData = JSON.parse(saveData);
          const data = getReadableJSON(defaultData.Data.GameState);
          data.IsRobbyDead = false;
          data.IsVirginiaDead = false;

          defaultData.Data.GameState = getWritableJSON(data);
          fs.writeFileSync(
            savePath + name + "\\" + saveFolder + "\\" + saveFile,
            JSON.stringify(defaultData),
            "utf8"
          );
        } else if (importantFiles[1] == saveFile) {
          const defaultData = JSON.parse(saveData);
          const data = getReadableJSON(defaultData.Data.PlayerState);
          const savedPosition = data._entries.find(
            (entry) => entry.Name === "player.position"
          );
          position.x = savedPosition.FloatArrayValue[0];
          position.y = savedPosition.FloatArrayValue[1] + 5;
          position.z = savedPosition.FloatArrayValue[2];
        } else if (importantFiles[2] == saveFile) {
          const defaultData = JSON.parse(saveData);
          const data = getReadableJSON(defaultData.Data.VailWorldSim);
          const robby = data.Actors.find((actor) => actor.TypeId === 9);
          robby.Position = position;
          robby.State = 2;
          robby.StateFlags = 0;
          robby.Stats.Health = 100;
          robby.Stats.Anger = 0;
          robby.Stats.Fear = 0;
          robby.Stats.Hydration = 0;
          robby.Stats.Fullness = 0;
          robby.Stats.Energy = 100;

          const robbyKillStats = data.KillStatsList.find(
            (killStats) => killStats.TypeId === 9
          );
          robbyKillStats.PlayerKilled = 0;

          const virginia = data.Actors.find((actor) => actor.TypeId === 10);
          virginia.Position = position;
          virginia.State = 2;
          virginia.Stats.Health = 120;
          virginia.Stats.Anger = 0;
          virginia.Stats.Fear = 0;
          virginia.Stats.Fullness = 0;
          virginia.Stats.Hydration = 0;
          virginia.Stats.Energy = 100;

          const virginiaKillStats = data.KillStatsList.find(
            (killStats) => killStats.TypeId === 10
          );
          virginiaKillStats.PlayerKilled = 0;

          defaultData.Data.VailWorldSim = getWritableJSON(data);
          fs.writeFileSync(
            savePath + name + "\\" + saveFolder + "\\" + saveFile,
            JSON.stringify(defaultData),
            "utf8"
          );
        }
      });
    });
  }

  try {
    fixFiles("Singleplayer");
  } catch (error) {
    console.log(error);
  }
  try {
    fixFiles("Multiplayer");
  } catch (error) {
    console.log(error);
  }

  console.log("Done");
};

ipcMain.on("openExplorer", (event, args) => {
  exec("explorer " + forestPath);
});

ipcMain.on("getLocation", (event, args) => {
  event.reply("location", forestPath);
});

ipcMain.on("forest-data", (event, args) => {
  try {
    collectSavesData();
  } catch (error) {
    console.log(error);
  }
  event.reply("forest-data-fix");
});
