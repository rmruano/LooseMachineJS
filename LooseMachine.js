/* jshint nonew:true, curly:true, unused:vars, noarg:true, forin:true, noempty:true, eqeqeq:true, strict:true, undef:true, bitwise:true, browser:true */

/**
 * @author https://github.com/rmruano
 * @license https://github.com/rmruano/LooseMachineJs/blob/master/LICENSE
 */
var LooseMachine = LooseMachine || {};

/**
 * Small helper to extend an object options.
 */
LooseMachine.extendOptions = function( defaults, newOptions ) {
    "use strict";
    var option,options = {};
    // Append defaults
    if (typeof defaults==="object") {
        for(option in defaults) {
            if (defaults.hasOwnProperty(option)) {
                options[option] = defaults[option];
            }
        }
    }
    // Overwrite defaults
    if (typeof newOptions==="object") {
        for(option in newOptions) {
            if (newOptions.hasOwnProperty(option)) {
                options[option] = newOptions[option];
            }
        }
    }
    // Return extended options
    return options;
};

/**
 * Listens for enter/leave events for registered actions & action states and keeps
 * them synchronized while tracking the current action shown
 */
LooseMachine.Director = function() {
    "use strict";
    var debug = false;
    var currentAction = false;
    var onLeaveCallback = function (action) {}; /* Placeholder for listener: Receives an Action object */
    var onEnterCallback = function (action) {}; /* Placeholder for listener: Receives an Action object */
    var onLeaveStateCallback = function (actionState) {}; /* Placeholder for listener: Receives an ActionState object */
    var onEnterStateCallback = function (actionState) {}; /* Placeholder for listener: Receives an ActionState object */
    this.leaveCurrentAction = function () {
        if (currentAction) {currentAction.leave();}
    };
    this.getCurrentAction = function () {
        return currentAction;
    };
    this.log = function (msg) {
        if (debug && typeof window.console === "object") {
            if (typeof msg === "string") {window.console.log("ActionDirector (" + new Date().toISOString() + "): " + msg);}
            else if (typeof msg === "object") {window.console.dir(msg);}
        }
    };
    this.enter = function (action) {
        this.log("ACTION enter " + action.getId());
        if (currentAction === action) {return;} // Not changed
        this.leaveCurrentAction();
        currentAction = action;
        onEnterCallback(action);
    };
    this.leave = function (action) {
        this.log("ACTION leave " + action.getId());
        currentAction = false;
        onLeaveCallback(action);
    };
    this.enterState = function (actionState) {
        this.log("Action STATE enter " + actionState.getAction().getId() + "/" + actionState.getId());
        onEnterStateCallback(actionState);
    };
    this.leaveState = function (actionState) {
        this.log("Ation STATE leave " + actionState.getAction().getId() + "/" + actionState.getId());
        onLeaveStateCallback(actionState);
    };
    this.onEnter = function (callback) {
        if (typeof callback === "function") {onEnterCallback = callback;}
        return this;
    };
    this.onLeave = function (callback) {
        if (typeof callback === "function") {onLeaveCallback = callback;}
        return this;
    };
    this.onEnterState = function (callback) {
        if (typeof callback === "function") {onEnterStateCallback = callback;}
        return this;
    };
    this.onLeaveState = function (callback) {
        if (typeof callback === "function") {onLeaveStateCallback = callback;}
        return this;
    };
    this.enableDebug = function () {
        debug = true;
        return this;
    };
};

/**
 * Define the multiple actions that can be performed (1st level)
 */
LooseMachine.Action = function(id, options) {
    "use strict";
    // Private vars
    var currentState = false; /* current state */
    var active = false; /* is active? */
    var states = {}; /* Action states */
    var onEnterCallback = function (action) {}; /* Placeholder for listener: Receives an Action object */
    var onLeaveCallback = function (action) {}; /* Placeholder for listener: Receives an Action object */
    var enterCounter = 0; /* Number of enters */
    var leaveCounter = 0; /* Number of leaves */
    var director = false; /* Placeholder for an action director */
    var handlers = {}; /* Storage for custom handlers (methods) */
    var data = {}; /* Custom action data to enable handlers to store temporary, action-wide data */
    // Options
    if ((options === undefined || options === null)) {options = false;}
    options = LooseMachine.extendOptions({
        "defaultState": "default" // Default action state name
    }, options);
    // Public methods
    this.isActive = function () {
        return active;
    };
    this.getId = function () {
        return id;
    };
    this.getOption = function (option) {
        return options.hasOwnProperty(option) ? options[option] : null;
    };
    this.setOption = function (optionId, optionValue) {
        options[optionId] = optionValue;
        return this;
    };
    this.isCurrentState = function (state) {
        return this.getCurrentState() === this.getState(state);
    };
    this.getDefaultState = function () {
        var stateId;
        if (states.hasOwnProperty(options.defaultState)) {return states[options.defaultState];} // Return the default state if present
        // No default found, iterate the object properties to find one
        stateId = Object.keys(states)[0]; // First element
        if (states.hasOwnProperty(stateId)) {
            return states[stateId];
        }
        throw Error("Unable to determine the default state");
    };
    this.getCurrentState = function () {
        if (currentState) {return currentState;}
        return this.getDefaultState(); // Not found, return the default one
    };
    this.setCurrentState = function (state, doNotEnterFlag) {
        if (state === undefined) {throw Error("Invalid state provided");}
        if (doNotEnterFlag === undefined) {doNotEnterFlag = false;}
        if (state && typeof state === "string") {
            state = this.getState(state); // If it's not an ActionState object, get it from it's id
            if (state === null) {throw Error("Invalid state provided");}
        }
        if (currentState === state) {return false;} // Already set
        if (currentState) {currentState.leave();} // Leave old state
        currentState = state;
        // An actual state
        if (state) {
            if(!(state instanceof LooseMachine.ActionState)) {throw Error("Invalid state provided");}
            if (!doNotEnterFlag) {currentState.enter();} // Enter current state
        }
        return this;
    };
    this.enter = function () {
        if (active) {return false;}
        active = true;
        enterCounter++;
        //console.log("action enter "+id);
        if (director) {director.enter(this);}
        onEnterCallback(this); // Trigger event
        if (this.getCurrentState()) {this.getCurrentState().enter();} // Enter current state if any
        return true;
    };
    this.leave = function () {
        if (!active) {return false;}
        active = false;
        leaveCounter++;
        if (this.getCurrentState() && !this.getCurrentState().getOption("persist")) {this.getCurrentState().leave();} // Leave current state if any and its not persistent
        //console.log("action leave "+id);
        onLeaveCallback(this); // Trigger event
        if (director) {director.leave(this);}
        return true;
    };
    this.onEnter = function (callback) {
        if (typeof callback === "function") {onEnterCallback = callback;}
        return this;
    };
    this.onLeave = function (callback) {
        if (typeof callback === "function") {onLeaveCallback = callback;}
        return this;
    };
    this.addState = function (state) {
        if (typeof id !== "string") {throw Error("Invalid id provided");}
        if (state === undefined || !(state instanceof LooseMachine.ActionState)) {throw Error("Invalid state provided");}
        state.setAction(this);
        /* Attach a reference to this action */
        states[state.getId()] = state;
        return this;
    };
    this.getState = function (id) {
        if (id === undefined) {return this.getCurrentState();} // Not id provided, return current
        if (id instanceof LooseMachine.ActionState) {return id;} // Already an ActionState
        if (typeof id !== "string") {throw Error("Invalid id provided");}
        if (!states.hasOwnProperty(id)) {return null;}
        return states[id];
    };
    this.setDirector = function (actionDirector) {
        if (actionDirector === undefined || !(actionDirector instanceof LooseMachine.Director)) {throw Error("Invalid director provided");}
        director = actionDirector;
        return this;
    };
    this.getDirector = function () {
        return director;
    };
    this.addHandler = function (handlerId, callback) {
        if (typeof handlerId !== "string" || typeof callback !== "function") {throw Error("Invalid or non-present handlerId or callback");}
        handlers[handlerId] = callback;
        return this;
    };
    this.runHandler = function (handlerId, parameter) {
        if (parameter === undefined) {parameter = null;}
        if (typeof handlers[handlerId] === "function") {return handlers[handlerId](this, parameter);}
        return null;
    };
    this.runHandlerIfActive = function (handlerId, parameter) {
        if (parameter === undefined) {parameter = null;}
        if (this.isActive() && typeof handlers[handlerId] === "function") {return this.runHandler(handlerId, parameter);}
        return null;
    };
    this.setData = function (id, dataToStore) {
        data[id] = dataToStore;
    };
    this.getData = function (id) {
        if (id === undefined) {
            return data;
        } else {
            return data.hasOwnProperty(id) ? null : data[id];
        }
    };
    this.enterCount = function () {
        return enterCounter;
    };
    this.leaveCount = function () {
        return leaveCounter;
    };
};

/**
 * Define the states of each action that can be performed (2nd level)
 */
LooseMachine.ActionState = function(id, options) {
    "use strict";
    // Private vars
    var active = false; /* is active? */
    var onEnterCallback = function (actionState, isResume) {}; /* Placeholder for listener: Receives an ActionState object */
    var onLeaveCallback = function (actionState) {}; /* Placeholder for listener: Receives an ActionState object */
    var enterCounter = 0;/* Number of enters */
    var leaveCounter = 0;/* Number of leaves */
    var actionObject = false;/* Must be provided through this.setAction */
    var handlers = {}; /* Storage for custom handlers (methods) */
    var data = {}; /* Custom action data to enable handlers to store temporary, actionstate-wide data */
    // Id
    if (id === undefined) {id = "default";}
    // Options
    if ((options === undefined || options === null)) {options = false;}
    options = LooseMachine.extendOptions({
        "persist": false /* Persist flag: when true, the state is kept even if the action is hidden, when false, the state is hidden if the action is hidden */
    }, options);
    // Public methods
    this.isActive = function () {
        return active;
    };
    this.getId = function () {
        return id;
    };
    this.setAction = function (action) {
        if (action === undefined || !(action instanceof LooseMachine.Action)) {throw new Error("Invalid actionObject provided");}
        actionObject = action;
    };
    this.getAction = function () {
        return actionObject;
    };
    this.getOption = function (option) {
        return options.hasOwnProperty(option) ? options[option] : null;
    };
    this.setOption = function (optionId, optionValue) {
        options[optionId] = optionValue;
        return this;
    };
    this.enter = function () {
        var isResume = false;
        if (active) {isResume = true;}
        active = true;
        enterCounter++;
        actionObject.setCurrentState(this, true);
        if (!actionObject.isActive) {actionObject.enter();} // In case it's not active already
        if (this.getAction().getDirector()) {this.getAction().getDirector().enterState(this);}
        //console.log("state enter "+actionObject.getId()+"/"+id);
        onEnterCallback(this, isResume); // Trigger event
        return true;
    };
    this.leave = function () {
        if (!active) {return false;}
        active = false;
        leaveCounter++;
        //console.log("state leave "+actionObject.getId()+"/"+id);
        if (actionObject.getCurrentState() === this) {actionObject.setCurrentState(false, true);} // No current state (because we're hiding this state)
        onLeaveCallback(this); // Trigger event
        if (this.getAction().getDirector()) {this.getAction().getDirector().leaveState(this);}
        return true;
    };
    this.onEnter = function (callback) {
        if (typeof callback === "function") {onEnterCallback = callback;}
        return this;
    };
    this.onLeave = function (callback) {
        if (typeof callback === "function") {onLeaveCallback = callback;}
        return this;
    };
    this.addHandler = function (handlerId, callback) {
        if (typeof handlerId !== "string" || typeof callback !== "function") {throw Error("Invalid or non-present handlerId or callback");}
        handlers[handlerId] = callback;
        return this;
    };
    this.runHandler = function (handlerId, parameter, actionState) {
        if (actionState===undefined || !(actionState instanceof LooseMachine.ActionState)) {
            actionState = this;
        }
        if (parameter === undefined) {parameter = null;}
        if (typeof handlers[handlerId] === "function") {return handlers[handlerId](actionState, parameter);}
        return null;
    };
    this.runHandlerAs = function (actionState, handlerId, parameter) {
        if (parameter === undefined) {parameter = null;}
        if (typeof actionState === "undefined" || !(actionState instanceof LooseMachine.ActionState)) {throw new Error("Invalid actionState provided");}
        return this.runHandler(handlerId, parameter, actionState);
    };
    this.runHandlerIfActive = function (handlerId, parameter) {
        if (parameter === undefined) {parameter = undefined;}
        if (this.isActive() && typeof handlers[handlerId] === "function") {return this.runHandler(handlerId, parameter);}
        return null;
    };
    this.setData = function (id, dataToStore) {
        data[id] = dataToStore;
    };
    this.getData = function (id) {
        if (id === undefined) {
            return data;
        } else {
            return (data.hasOwnProperty(id) ? data[id]:null);
        }
    };
    this.enterCount = function () {
        return enterCounter;
    };
    this.leaveCount = function () {
        return leaveCounter;
    };
};