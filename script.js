const obs = new OBSWebSocket();
let scoreValA = 0, scoreValB = 0;
let logoFileA = "", logoFileB = "";

function writeLog(msg) {
    const log = document.getElementById('debug-log');
    if (log) {
        log.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}<br>` + log.innerHTML;
    }
}

async function connectOBS() {
    try {
        await obs.connect("ws://127.0.0.1:4455");
        document.getElementById('status-text').innerText = "Status: Connected";
        document.getElementById('status-text').style.color = "#00c05a";
        writeLog("Connected to OBS");
    } catch (e) {
        document.getElementById('status-text').innerText = "Status: Disconnected";
        document.getElementById('status-text').style.color = "#ff3b30";
    }
}

function handleLogo(input, team) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('preview' + team).innerHTML = `<img src="${e.target.result}">`;
            if (team === 'A') logoFileA = file.name; else logoFileB = file.name;
            writeLog(`Loaded Logo ${team}: ${file.name}`);
            syncToOBS();
        };
        reader.readAsDataURL(file);
    }
}

function updateScore(team, amt) {
    if (team === 'A') {
        scoreValA = Math.max(0, scoreValA + amt);
        document.getElementById('scoreA').innerText = scoreValA;
    } else {
        scoreValB = Math.max(0, scoreValB + amt);
        document.getElementById('scoreB').innerText = scoreValB;
    }
    syncToOBS();
}

async function syncToOBS() {
    try {
        let folder = document.getElementById('basePath').value.replace(/\\/g, '/');
        if (folder && !folder.endsWith('/')) folder += '/';

        const settings = {
            'TeamA_Name': document.getElementById('nameA').value,
            'TeamB_Name': document.getElementById('nameB').value,
            'TeamA_Score': scoreValA.toString(),
            'TeamB_Score': scoreValB.toString(),
            'Round_Text': document.getElementById('round').value,
            'BestOf_Text': document.getElementById('bestOf').value,
            'Game_Text': document.getElementById('game').value,
            'Text1_Info': document.getElementById('text1').value,
            'Text2_Info': document.getElementById('text2').value,
            'Text3_Info': document.getElementById('text3').value,
            'Text4_Info': document.getElementById('text4').value
        };

        for (const [name, val] of Object.entries(settings)) {
            await obs.call('SetInputSettings', { inputName: name, inputSettings: { text: val } });
        }

        if (folder && logoFileA) {
            await obs.call('SetInputSettings', { inputName: 'TeamA_Logo', inputSettings: { file: folder + logoFileA } });
        }
        if (folder && logoFileB) {
            await obs.call('SetInputSettings', { inputName: 'TeamB_Logo', inputSettings: { file: folder + logoFileB } });
        }
    } catch (e) {
        console.error("OBS Sync Error:", e);
    }
}

function swapSides() {
    let nA = document.getElementById('nameA'), nB = document.getElementById('nameB');
    let tempName = nA.value; nA.value = nB.value; nB.value = tempName;

    [scoreValA, scoreValB] = [scoreValB, scoreValA];
    document.getElementById('scoreA').innerText = scoreValA;
    document.getElementById('scoreB').innerText = scoreValB;

    let pA = document.getElementById('previewA'), pB = document.getElementById('previewB');
    let tempHTML = pA.innerHTML; pA.innerHTML = pB.innerHTML; pB.innerHTML = tempHTML;
    let tempFile = logoFileA; logoFileA = logoFileB; logoFileB = tempFile;

    writeLog("Swapped Teams and Logos");
    syncToOBS();
}

function resetAll() {
    if (!confirm("Reset ข้อมูล?")) return;
    scoreValA = 0; scoreValB = 0;
    document.getElementById('scoreA').innerText = "0";
    document.getElementById('scoreB').innerText = "0";
    document.getElementById('round').value = "Round ?";
    document.getElementById('bestOf').value = "Best of 3";
    document.getElementById('game').value = "Game 1";
    writeLog("Reset all scores and info");
    syncToOBS();
}

function savePath() {
    localStorage.setItem('savedPath', document.getElementById('basePath').value);
}

window.onload = () => {
    const path = localStorage.getItem('savedPath');
    if (path) document.getElementById('basePath').value = path;
    connectOBS();
};