/**********************************************/
/* Globals, Constants, and Enums */
/**********************************************/

let NXBT_CONTROLLER_INDEX = false;
let CONTROLLER_INDEX = false;
let CONTROLLER_CONNECTED = false;
let STATE = false;

// HTML SECTIONS
let HTML_CONTROLLER_SELECTION = document.getElementById("controller-selection");
let HTML_LOADER = document.getElementById("loader");
let HTML_LOADER_TEXT = document.getElementById("loader-text");
let HTML_CONTROLLER_CONFIG = document.getElementById("controller-config");
let HTML_MACRO_TEXT = document.getElementById("macro-text");
let HTML_STATUS_INDICATOR = document.getElementById("status-indicator");
let HTML_STATUS_INDICATOR_LIGHT = document.getElementById("status-indicator-light");
let HTML_STATUS_INDICATOR_TEXT = document.getElementById("status-indicator-text");
let HTML_KEYBOARD_MAP = document.getElementById("keyboard-map");
let HTML_CONTROLLER_MAP = document.getElementById("controller-map");
let HTML_ERROR_DISPLAY = document.getElementById("error-display");
let HTML_CONTROLLER_SESSIONS = document.getElementById("controller-sessions");
let HTML_CONTROLLER_SESSIONS_CONTAINER = document.getElementById("controller-session-container");
let HTML_SPECIAL_NOTICE = document.getElementById("special-notice");
let HTML_MACRO_ACTION = document.getElementById("macro-action");
let HTML_MACRO_DESTINATION = document.getElementById("macro-destination");
let HTML_AMOUNT_OF_LAG = document.getElementById("amount-of-lag");
let HTML_MAP_MACRO_BUTTON = document.getElementById("map-macro-button");
let HTML_LEFT_STICK_SCALAR = document.getElementById("left-stick-scalar")

const ControllerState = {
    INITIALIZING: "initializing",
    CONNECTING: "connecting",
    RECONNECTING: "reconnecting",
    CONNECTED: "connected",
    CRASHED: "crashed",
}

const InputDevice = {
    KEYBOARD: "keyboard",
    GAMEPAD: "gamepad"
}
let INPUT_DEVICE = InputDevice.KEYBOARD;

const ControllerType = {
    PRO_CONTROLLER: "pro_controller",
    JOYCON_L: "joycon_l",
    JOYCON_R: "joycon_r"
}

const KEYMAP = {
    // Left Stick
    'e': "LS_UP",
    's': "LS_LEFT",
    'f': "LS_RIGHT",
    'd': "LS_DOWN",
    'g': "LS_PRESS",
    // Right Stick
    ',': "RS_UP",
    'n': "RS_LEFT",
    '.': "RS_RIGHT",
    'm': "RS_DOWN",
    'h': "RS_PRESS",
    // Dpad
    'c': "DPAD_UP",
    'z': "DPAD_LEFT",
    'v': "DPAD_RIGHT",
    'x': "DPAD_DOWN",
    // Home & Capture
    'p': "HOME",
    'q': "CAPTURE",
    // Plus & Minus
    'y': "PLUS",
    't': "MINUS",
    // A B X Y
    'l': "A",
    'k': "B",
    'i': "X",
    'j': "Y",
    // L & ZL
    'w': "L",
    'r': "ZL",
    // R & ZR
    'u': "ZR",
    'o': "R",
}
let STICK_PINNED = false;
let MASH_A = false;
let QUEUED_MACRO = null;
let QUEUED_MACRO_TIMEOUT = 0;
const CAMERA_NORTH_MACRO = `
Y 0.1s
1.65s
R_STICK_PRESS 0.1s
0.1s
R_STICK_PRESS 0.1s
0.1s
R_STICK@+040+000 0.1s
R_STICK@-040+000 0.1s
B 0.1s
`
const CAMERA_NORTH_MACRO_TIMEOUT = 2450;

const LEFT_STICK = [
    "LS_UP",
    "LS_LEFT",
    "LS_RIGHT",
    "LS_DOWN",
]
const RIGHT_STICK = [
    "RS_UP",
    "RS_LEFT",
    "RS_RIGHT",
    "RS_DOWN",
]

let INPUT_PACKET = {
    // Sticks
    "L_STICK": {
        "PRESSED": false,
        "X_VALUE": 0,
        "Y_VALUE": 0,
        // Keyboard position calculation values
        "LS_UP": false,
        "LS_LEFT": false,
        "LS_RIGHT": false,
        "LS_DOWN": false
    },
    "R_STICK": {
        "PRESSED": false,
        "X_VALUE": 0,
        "Y_VALUE": 0,
        // Keyboard position calculation values
        "RS_UP": false,
        "RS_LEFT": false,
        "RS_RIGHT": false,
        "RS_DOWN": false
    },
    // Dpad
    "DPAD_UP": false,
    "DPAD_LEFT": false,
    "DPAD_RIGHT": false,
    "DPAD_DOWN": false,
    // Triggers
    "L": false,
    "ZL": false,
    "R": false,
    "ZR": false,
    // Joy-Con Specific Buttons
    "JCL_SR": false,
    "JCL_SL": false,
    "JCR_SR": false,
    "JCR_SL": false,
    // Meta buttons
    "PLUS": false,
    "MINUS": false,
    "HOME": false,
    "CAPTURE": false,
    // Buttons
    "Y": false,
    "X": false,
    "B": false,
    "A": false
}
let INPUT_PACKET_OLD = JSON.parse(JSON.stringify(INPUT_PACKET));
let INPUT_PACKET_BLANK = JSON.parse(JSON.stringify(INPUT_PACKET));

let PRO_CONTROLLER_DISPLAY = {
    // Sticks
    "L_STICK": {
        "STICK": true,
        "ELEMENT": document.getElementById("pc_ls"),
        "MAX_X": 23,
        "MIN_X": 15.5,
        "DIFF_X": 7.5,
        "MAX_Y": 29,
        "MIN_Y": 18,
        "DIFF_Y": 11
    },
    "R_STICK": {
        "STICK": true,
        "ELEMENT": document.getElementById("pc_rs"),
        "MAX_X": 63.5,
        "MIN_X": 56,
        "DIFF_X": 7.5,
        "MAX_Y": 50,
        "MIN_Y": 38.125,
        "DIFF_Y": 11.875,
    },
    // Dpad
    "DPAD_UP": document.getElementById("pc_du"),
    "DPAD_LEFT": document.getElementById("pc_dl"),
    "DPAD_RIGHT": document.getElementById("pc_dr"),
    "DPAD_DOWN": document.getElementById("pc_dd"),
    // Triggers
    "L": document.getElementById("pc_l"),
    "ZL": document.getElementById("pc_zl"),
    "R": document.getElementById("pc_r"),
    "ZR": document.getElementById("pc_zr"),
    // Meta buttons
    "PLUS": document.getElementById("pc_p"),
    "MINUS": document.getElementById("pc_m"),
    "HOME": document.getElementById("pc_h"),
    "CAPTURE": document.getElementById("pc_c"),
    // Buttons
    "Y": document.getElementById("pc_y"),
    "X": document.getElementById("pc_x"),
    "B": document.getElementById("pc_b"),
    "A": document.getElementById("pc_a")
}

/**********************************************/
/* Socket.IO Functionality */
/**********************************************/

let socket = io();

// Request to the state at 1Hz
socket.emit('state');
let stateInterval = setInterval(function() {
    socket.emit('state');
}, 1000);

socket.on('state', function(state) {
    STATE = state;
});

socket.on('connect', function() {
    console.log("Connected");
});

checkForLoadInterval = false;
socket.on('create_pro_controller', function(index) {
    NXBT_CONTROLLER_INDEX = index;
    checkForLoadInterval = setInterval(checkForLoad, 1000);
});

socket.on('error', function(errorMessage) {
    displayError(errorMessage);
});

/**********************************************/
/* Listeners and Startup Functionality */
/**********************************************/

// Startup Functions
window.onload = function() {
    // Run the Loader animation
    setInterval(updateLoader, 85);
    // // Print out the latency of setTimeout
    // measureTimeoutLatency.start(120, 60);

    createProController();
}

// Keydown listener
function globalKeydownHandler(evt) {
    if (INPUT_DEVICE !== InputDevice.KEYBOARD) {
        return
    }

    evt = evt || window.event;
    // Prevent scrolling on keypress
    //if([32, 37, 38, 39, 40].indexOf(evt.keyCode) > -1) {
    //    evt.preventDefault();
    //}

    if (Object.keys(KEYMAP).indexOf(evt.key) > -1) {
        control = KEYMAP[evt.key];
        if (LEFT_STICK.indexOf(control) > -1) {
            INPUT_PACKET["L_STICK"][control] = true;
        } else if (RIGHT_STICK.indexOf(control) > -1) {
            if (!STICK_PINNED) {
                INPUT_PACKET["R_STICK"][control] = true;
            }
        } else if (control == "LS_PRESS") {
            INPUT_PACKET["L_STICK"]["PRESSED"] = true;
        } else if (control == "RS_PRESS") {
            INPUT_PACKET["R_STICK"]["PRESSED"] = true;
        } else {
            INPUT_PACKET[control] = true;
        }
    }

    if (evt.key == '!' && evt.ctrlKey) {
        setStickPinned(!STICK_PINNED);
        if (STICK_PINNED) {
            HTML_SPECIAL_NOTICE.innerHTML = "Pinning Right Stick";
        } else {
            HTML_SPECIAL_NOTICE.innerHTML = "Right Stick no longer pinned";
        }
    } else if (evt.key == ';') {
        MASH_A = !MASH_A;
        if (MASH_A) {
            HTML_SPECIAL_NOTICE.innerHTML = "Mashing A";
        } else {
            INPUT_PACKET["A"] = false;
            HTML_SPECIAL_NOTICE.innerHTML = "No longer mashing A";
        }
    } else if (evt.key == '@' && evt.ctrlKey) {
        QUEUED_MACRO = CAMERA_NORTH_MACRO;
        QUEUED_MACRO_TIMEOUT = CAMERA_NORTH_MACRO_TIMEOUT;
        HTML_SPECIAL_NOTICE.innerHTML = "Performing camera north macro";
    }
}
document.onkeydown = globalKeydownHandler;

function setStickPinned(bool) {
    STICK_PINNED = bool;
    INPUT_PACKET["R_STICK"]["RS_DOWN"] = STICK_PINNED;
    INPUT_PACKET["R_STICK"]["RS_UP"] = false;
    INPUT_PACKET["R_STICK"]["RS_LEFT"] = false;
    INPUT_PACKET["R_STICK"]["RS_RIGHT"] = false;
}

// Keyup listener
function globalKeyupHandler(evt) {
    if (INPUT_DEVICE !== InputDevice.KEYBOARD) {
        return
    }

    evt = evt || window.event;
    
    if (Object.keys(KEYMAP).indexOf(evt.key) > -1) {
        control = KEYMAP[evt.key];
        if (LEFT_STICK.indexOf(control) > -1) {
            INPUT_PACKET["L_STICK"][control] = false;
        } else if (RIGHT_STICK.indexOf(control) > -1) {
            if (!STICK_PINNED) {
                INPUT_PACKET["R_STICK"][control] = false;
            }
        } else if (control == "LS_PRESS") {
            INPUT_PACKET["L_STICK"]["PRESSED"] = false;
        } else if (control == "RS_PRESS") {
            INPUT_PACKET["R_STICK"]["PRESSED"] = false;
        } else {
            INPUT_PACKET[control] = false;
        }
    }
}
document.onkeyup = globalKeyupHandler;

function disableKeyHandlers() {
    document.onkeydown = false;
    document.onkeyup = false;
}

function enableKeyHandlers() {
    document.onkeydown = globalKeydownHandler;
    document.onkeyup = globalKeyupHandler;
}

window.addEventListener("gamepadconnected", function(evt) {
    gamepadIndex = evt.gamepad.index;
    gamepadID = evt.gamepad.id;
    console.log("Gamepad connected with ID:", gamepadID);

    inputs = document.getElementById("input-device");

    input = document.createElement("option");
    input.innerHTML = gamepadID;
    input.setAttribute("value", "gamepad");
    input.setAttribute("index", gamepadIndex);
    input.id = gamepadID;

    inputs.appendChild(input);
});

window.addEventListener("gamepaddisconnected", function(evt) {
    INPUT_DEVICE = InputDevice.KEYBOARD;

    HTML_CONTROLLER_MAP.classList.add('hidden');
    HTML_KEYBOARD_MAP.classList.remove('hidden');

    CONTROLLER_INDEX = false;
    gamepadInput = document.getElementById(evt.gamepad.id);
    gamepadInput.remove();
});

/**********************************************/
/* UI, Input Monitoring, Gamepad Functionality */
/**********************************************/

function displayOtherSessions() {
    controllerIndices = Object.keys(STATE);
    // If there aren't any controller sessions
    if (controllerIndices.length < 1) {
        HTML_CONTROLLER_SESSIONS.classList.add("hidden");
        return;
    // If the only controller session is the current one
    } else if (controllerIndices.length === 1 && 
            Number(controllerIndices[0]) === NXBT_CONTROLLER_INDEX) {
        HTML_CONTROLLER_SESSIONS.classList.add("hidden");
        return;
    }

    HTML_CONTROLLER_SESSIONS.classList.remove('hidden');
    HTML_CONTROLLER_SESSIONS_CONTAINER.innerHTML = ""
    for (let i = 0; i < controllerIndices.length; i++) {
        sessionIndex = controllerIndices[i];
        if (sessionIndex === NXBT_CONTROLLER_INDEX) {
            continue
        }

        let session = document.createElement("div")
        session.classList.add("controller-session");
        let sessionTitle = document.createElement("h1");
        sessionTitle.innerHTML = "Session #" + sessionIndex;
        let sessionEnd = document.createElement("button");
        sessionEnd.innerHTML = "END";
        sessionEnd.onclick = function() {
            socket.emit('shutdown', Number(sessionIndex));
        }

        session.appendChild(sessionTitle);
        session.appendChild(sessionEnd);

        HTML_CONTROLLER_SESSIONS_CONTAINER.appendChild(session);
    }
}
// Set a first quick call to make sure results appear
// on page load, if available. The timeout is necessary
// due to the time it takes for the initial State to load.
setTimeout(displayOtherSessions, 250);
setInterval(displayOtherSessions, 2000);

function displayError(errorText) {
    let errorContainer = document.createElement('div');
    errorContainer.classList.add('error');

    let errorHeader = document.createElement('h1');
    errorHeader.innerHTML = "ERROR";

    let errorMessage = document.createElement('p');
    errorMessage.innerHTML = errorText;

    errorContainer.appendChild(errorHeader);
    errorContainer.appendChild(errorMessage);
    HTML_ERROR_DISPLAY.appendChild(errorContainer);

    setTimeout(function() {
        errorContainer.remove();
    }, 10000);
}

function createProController() {
    HTML_CONTROLLER_SELECTION.classList.add('hidden');
    HTML_LOADER.classList.remove('hidden');

    socket.emit('create_pro_controller');
}

function shutdownController() {
    if (STATE[NXBT_CONTROLLER_INDEX]) {
        socket.emit('shutdown', NXBT_CONTROLLER_INDEX);
    }
}

function recreateProController() {
    socket.emit('create_pro_controller');
}

function restartController() {
    shutdownController();
    setTimeout(recreateProController, 2000);
}

function checkForLoad() {
    if (STATE[NXBT_CONTROLLER_INDEX]) {
        controller_state = STATE[NXBT_CONTROLLER_INDEX].state
        HTML_LOADER_TEXT.innerHTML = controller_state;

        if (controller_state === ControllerState.CONNECTED) {
            // Show the connected message for 1 second
            setTimeout(function() {
                clearInterval(checkForLoadInterval);
                HTML_LOADER.classList.add('hidden');
                HTML_CONTROLLER_CONFIG.classList.remove('hidden');
                HTML_STATUS_INDICATOR.classList.remove('hidden');
                setInterval(updateStatusIndicator, 1000);
                eventLoop();
            }, 1000);

            HTML_SPECIAL_NOTICE.innerHTML = "Right Stick is unpinned";
            updateMapMacroButton();
        }
    }
}

function updateStatusIndicator() {
    if (STATE[NXBT_CONTROLLER_INDEX]) {
        controller_state = STATE[NXBT_CONTROLLER_INDEX].state;
        if (controller_state === ControllerState.CONNECTED) {
            changeStatusIndicatorState("indicator-green", "CONNECTED");
        } else if (controller_state === ControllerState.CONNECTING) {
            changeStatusIndicatorState("indicator-yellow", "CONNECTING");
        } else if (controller_state === ControllerState.RECONNECTING) {
            changeStatusIndicatorState("indicator-yellow", "RECONNECTING");
        } else if (controller_state === ControllerState.CRASHED) {
            changeStatusIndicatorState("indicator-red", "CRASHED");
        }
    } else {
        changeStatusIndicatorState("indicator-red", "NO INPUT");
    }
}

function changeStatusIndicatorState(className, text) {
    HTML_STATUS_INDICATOR_LIGHT.className = "";
    HTML_STATUS_INDICATOR_LIGHT.classList.add(className);
    HTML_STATUS_INDICATOR_TEXT.innerHTML = text;
}

function changeInput(evt) {
    inputType = evt.target.value

    if (inputType === InputDevice.KEYBOARD) {
        INPUT_DEVICE = InputDevice.KEYBOARD;

        document.onkeydown = globalKeydownHandler;
        document.onkeyup = globalKeyupHandler;

        HTML_CONTROLLER_MAP.classList.add('hidden');
        HTML_KEYBOARD_MAP.classList.remove('hidden');

        CONTROLLER_INDEX = false;
    } else if (inputType == InputDevice.GAMEPAD) {
        INPUT_DEVICE = InputDevice.GAMEPAD;

        document.onkeydown = false;
        document.onkeyup = false;

        HTML_KEYBOARD_MAP.classList.add('hidden');
        HTML_CONTROLLER_MAP.classList.remove('hidden');

        selectedGamepad = evt.target.children[evt.target.selectedIndex]
        CONTROLLER_INDEX = selectedGamepad.getAttribute("index");
    }
}

function changeFrequency(evt) {
    let newFrequency = evt.target.value;
    
    if (newFrequency === "RAF") {
        useRAF = true;
    } else {
        newFrequency = Number(newFrequency);
        if (!isNaN(newFrequency)) {
            useRAF = false;
            frequency = (1/newFrequency) * 1000;
        } else {
            console.log("New frequency is not a number");
        }
    }
}

function updateMapMacroButton() {
    action = Number(HTML_MACRO_ACTION.value);
    destination = Number(HTML_MACRO_DESTINATION.value);
    amountOfLag = Number(HTML_AMOUNT_OF_LAG.value);

    mapMacroStr = "";
    if (action == 0) {
        mapMacroStr = "estimate lag";
    } else {
        if (action == 1) {
            mapMacroStr += "Fly to ";
        } else if (action == 2) {
            mapMacroStr += "plant flag at ";
        }
        mapMacroStr += HTML_MACRO_DESTINATION[destination].innerText;
        mapMacroStr += " with "
        mapMacroStr += amountOfLag;
        mapMacroStr += " lag";
    }
    HTML_MAP_MACRO_BUTTON.innerHTML = "Press to " + mapMacroStr;
}
const coordinates = [
    [2311, -4755],
    [2577, -4583],
    [2458, -4379],
    [2422, -4111],
    [2390, -3638],
    [2325, -3786],
    [2619, -3821],
    [2068, -3841],
    [2742, -3839],
    [1844, -3935],
    [1520, -3839],
    [1337, -3822],
];
function performMapMacro() {
    action = Number(HTML_MACRO_ACTION.value);
    destination = Number(HTML_MACRO_DESTINATION.value);
    amountOfLag = Number(HTML_AMOUNT_OF_LAG.value);

    mapMacro = `
Y 0.1s
1.65s
R_STICK_PRESS 0.1s
0.1s
R_STICK_PRESS 0.1s
0.1s
ZL 0.1s
L_STICK@-100-100 7.5s
`;
    timeout = 9750;
    if (action == 0) {
        mapMacro += `
0.5s
L_STICK@+050+000 6.8s
0.5s
R_STICK_PRESS 0.1s
0.1s
R_STICK_PRESS 0.1s
0.9s
L_STICK@+050+000 0.2s
0.8s
L_STICK@+050+000 0.2s
0.8s
L_STICK@+050+000 0.2s
0.8s
L_STICK@+050+000 0.2s
0.8s
L_STICK@+050+000 0.2s
0.8s
L_STICK@+050+000 0.2s
0.8s
L_STICK@+050+000 0.2s
0.8s
R_STICK_PRESS 0.1s
0.1s
R_STICK_PRESS 0.1s
0.1s
B 0.1s
`;
        timeout += 16100;
    } else {
        x = coordinates[destination][0]/5000;
        y = 1 + coordinates[destination][1]/5000;
        xSec = Math.round(6.8*35.3/(35.3-amountOfLag)*x*20)/20;
        ySec = Math.round(7.8*35.3/(35.3-amountOfLag)*y*20)/20;
        mapMacro += "0.1s\n";
        mapMacro += "L_STICK@+050+000 ";
        mapMacro += xSec;
        mapMacro += "s\n";
        mapMacro += "L_STICK@+000+050 ";
        mapMacro += ySec;
        mapMacro += "s\n";
        mapMacro += `
0.5s
A 0.1s
0.5s
DPAD_UP 0.1s
0.1s
DPAD_UP 0.1s
`;
        timeout += 100 + Math.round(xSec*1000) + Math.round(ySec*1000) + 1400;
        if (action == 1) {
            mapMacro += "0.1s\n";
            mapMacro += "DPAD_UP 0.1s\n";
            timeout += 200;
        }
        mapMacro += "A 0.1s\n";
        timeout += 100;
        if (action == 1) {
            mapMacro += "0.9s\n";
            mapMacro += "A 0.1s\n";
            timeout += 1000;
        }
        mapMacro += "0.5s\n";
        mapMacro += "B 0.1s\n";
        timeout += 600;
        if (action == 1) {
            mapMacro += "0.5s\n";
            mapMacro += "B 0.1s\n";
            timeout += 600;
        }
        timeout += 100;
    }
    QUEUED_MACRO = mapMacro;
    QUEUED_MACRO_TIMEOUT = timeout;
    HTML_SPECIAL_NOTICE.innerHTML = "Performing macro " +
        HTML_MAP_MACRO_BUTTON.innerHTML.substring(9);
}

const LOADER_ANIMATION_FRAMES = [0,1,2,3,3,2,1,0];
let loaderFrame = 1;
let highlightedBlock = false;
function updateLoader() {
    loaderBlocks = document.getElementById("loader-blocks").children;

    if (highlightedBlock === false) {
        highlightedBlock = loaderBlocks[0];
    }
    highlightedBlock.classList.remove("loader-block-highlight");
    highlightedBlock = loaderBlocks[LOADER_ANIMATION_FRAMES[loaderFrame]];
    highlightedBlock.classList.add("loader-block-highlight");

    loaderFrame += 1;
    if (loaderFrame >= LOADER_ANIMATION_FRAMES.length) {
        loaderFrame = 0;
    }
}

function updateGamepadInput() {
    let gp = navigator.getGamepads()[CONTROLLER_INDEX];
    INPUT_PACKET["L_STICK"]["X_VALUE"] = gp.axes[0] * 100;
    INPUT_PACKET["L_STICK"]["Y_VALUE"] = gp.axes[1] * -100;
    INPUT_PACKET["L_STICK"]["PRESSED"] = gp["buttons"][10]["pressed"];

    INPUT_PACKET["R_STICK"]["X_VALUE"] = gp.axes[2] * 100;
    INPUT_PACKET["R_STICK"]["Y_VALUE"] = gp.axes[3] * -100;
    INPUT_PACKET["R_STICK"]["PRESSED"] = gp["buttons"][11]["pressed"];

    INPUT_PACKET["DPAD_UP"] = gp["buttons"][12]["pressed"];
    INPUT_PACKET["DPAD_DOWN"] = gp["buttons"][13]["pressed"];
    INPUT_PACKET["DPAD_LEFT"] = gp["buttons"][14]["pressed"];
    INPUT_PACKET["DPAD_RIGHT"] = gp["buttons"][15]["pressed"];

    if (gp["buttons"][16]) {
        INPUT_PACKET["HOME"] = gp["buttons"][16]["pressed"];
    }

    if (gp["buttons"][17]) {
        INPUT_PACKET["CAPTURE"] = gp["buttons"][17]["pressed"];
    }

    INPUT_PACKET["B"] = gp["buttons"][0]["pressed"];
    INPUT_PACKET["A"] = gp["buttons"][1]["pressed"];
    INPUT_PACKET["Y"] = gp["buttons"][2]["pressed"];
    INPUT_PACKET["X"] = gp["buttons"][3]["pressed"];

    INPUT_PACKET["L"] = gp["buttons"][4]["pressed"];
    INPUT_PACKET["R"] = gp["buttons"][5]["pressed"];
    INPUT_PACKET["ZL"] = gp["buttons"][6]["pressed"];
    INPUT_PACKET["ZR"] = gp["buttons"][7]["pressed"];

    INPUT_PACKET["PLUS"] = gp["buttons"][8]["pressed"];
    INPUT_PACKET["MINUS"] = gp["buttons"][9]["pressed"];
}

function updateGamepadDisplay() {
    controls = Object.keys(INPUT_PACKET);
    for (let i = 0; i < controls.length; i++) {
        controlState = INPUT_PACKET[controls[i]];
        control = PRO_CONTROLLER_DISPLAY[controls[i]];

        if (!control) {
            continue;
        }

        if (control.STICK) {
            xRatio = (controlState["X_VALUE"] + 100)/200;
            yRatio = (controlState["Y_VALUE"] + 100)/200;
            xPos = control["MIN_X"] + (xRatio * control["DIFF_X"]);
            yPos = control["MAX_Y"] - (yRatio * control["DIFF_Y"]);
            control["ELEMENT"].style.left = xPos + "%";
            control["ELEMENT"].style.top = yPos + "%";
        } else {
            if (controlState) {
                control.classList.remove('hidden');
            } else {
                control.classList.add('hidden');
            }
        }
    }
}

let timeOld = false;
let frequency = (1/120) * 1000;
let useRAF = true;
let mashAThisFrame = false;
function eventLoop() {
     leftStickScalar = Number(HTML_LEFT_STICK_SCALAR.value);
     if (leftStickScalar <= 1 || leftStickScalar >= 100 || isNaN(leftStickScalar)) {
        leftStickScalar = 100;
     }

    // Update x/y ratio for the sticks based on
    // pressed buttons if we're using a keyboard
    if (INPUT_DEVICE == InputDevice.KEYBOARD) {
        // Calculating left x/y stick values
        lXValue = 0
        lYValue = 0
        if (INPUT_PACKET["L_STICK"]["LS_LEFT"]) {
            lXValue -= leftStickScalar
        }
        if (INPUT_PACKET["L_STICK"]["LS_RIGHT"]) {
            lXValue += leftStickScalar
        }
        if (INPUT_PACKET["L_STICK"]["LS_UP"]) {
            lYValue += leftStickScalar
        }
        if (INPUT_PACKET["L_STICK"]["LS_DOWN"]) {
            lYValue -= leftStickScalar
        }
        INPUT_PACKET["L_STICK"]["X_VALUE"] = lXValue
        INPUT_PACKET["L_STICK"]["Y_VALUE"] = lYValue

        // Calculating right x/y stick values
        rXValue = 0
        rYValue = 0
        if (INPUT_PACKET["R_STICK"]["RS_LEFT"]) {
            rXValue -= 100
        }
        if (INPUT_PACKET["R_STICK"]["RS_RIGHT"]) {
            rXValue += 100
        }
        if (INPUT_PACKET["R_STICK"]["RS_UP"]) {
            rYValue += 100
        }
        if (INPUT_PACKET["R_STICK"]["RS_DOWN"]) {
            rYValue -= 100
        }
        INPUT_PACKET["R_STICK"]["X_VALUE"] = rXValue
        INPUT_PACKET["R_STICK"]["Y_VALUE"] = rYValue

        if (MASH_A) {
            mashAThisFrame = !mashAThisFrame;
            INPUT_PACKET["A"] = mashAThisFrame;
        } else {
            mashAThisFrame = false;
        }
    } else if (INPUT_DEVICE == InputDevice.GAMEPAD) {
        updateGamepadInput();
    }

    if (QUEUED_MACRO) {
        INPUT_PACKET = JSON.parse(JSON.stringify(INPUT_PACKET_BLANK));
    }

    // Only send packet if it's not a duplicate of previous.
    // We can do this since NXBT will hold the previously sent value
    // until we send it a new one.
    if (JSON.stringify(INPUT_PACKET) !== JSON.stringify(INPUT_PACKET_OLD)) {
        socket.emit('input', JSON.stringify([NXBT_CONTROLLER_INDEX, INPUT_PACKET]));
        INPUT_PACKET_OLD = JSON.parse(JSON.stringify(INPUT_PACKET));
    }

    if (QUEUED_MACRO) {
        sendQueuedMacro();
        setTimeout(function() {
            setStickPinned(STICK_PINNED);
            if (STICK_PINNED) {
                HTML_SPECIAL_NOTICE.innerHTML = "Macro done; resuming pinning Right Stick";
            } else {
                HTML_SPECIAL_NOTICE.innerHTML = "Macro done; Right Stick is not pinned";
            }
        }, QUEUED_MACRO_TIMEOUT);
        QUEUED_MACRO = null;
    }

    updateGamepadDisplay()

    if (useRAF) {
        requestAnimationFrame(eventLoop);
    } else {
        if (!timeOld) {
            timeOld = performance.now();
        }
        timeNew = performance.now();
        delta = timeNew - timeOld;
        diff = delta - frequency;
    
        if (diff > 0) {
            setTimeout(eventLoop, frequency - diff);
        } else {
            setTimeout(eventLoop, frequency);
        }
        timeOld = timeNew;
    }
}

function sendMacro() {
    let macro = HTML_MACRO_TEXT.value.toUpperCase();
    socket.emit('macro', JSON.stringify([NXBT_CONTROLLER_INDEX, macro]));
}

function sendQueuedMacro() {
    socket.emit('macro', JSON.stringify([NXBT_CONTROLLER_INDEX, QUEUED_MACRO]));
}

/**********************************************/
/* Debug Functionality */
/**********************************************/

const measureTimeoutLatency = {
    debug: false,
    count: 0,
    maxCount: 0,
    deltaSum: 0,
    diffSum: 0,
    timeOld: false,
    rawFrequency: false,
    frequency: false,

    start: function(frequency, iterations) {
        this.rawFrequency = frequency;
        this.frequency = (1/frequency)*1000;
        this.maxCount = iterations;
        this.timeOld = performance.now();
        this.loop(this);
    },

    loop: function(context) {
        timeNew = performance.now();
        delta = timeNew - context.timeOld;
        diff = delta - context.frequency;

        if (context.debug) {
            console.log(diff);
        }

        context.deltaSum += Math.abs(delta);
        context.diffSum += Math.abs(diff);
        context.count += 1

        if (context.count >= context.maxCount) {
            avgDelta = context.deltaSum/context.count;
            avgDiff = context.diffSum/context.count;

            console.log("Average Time setTimeout Delta (ms):", avgDelta);
            console.log("Average Difference between Delta and Frequency (ms):", avgDiff);
        } else {
            if (diff > 0) {
                setTimeout(function(){context.loop(context);}, context.frequency - diff);
            } else {
                setTimeout(function(){context.loop(context);}, context.frequency);
            }
            context.timeOld = timeNew;
        } 
    }
}
