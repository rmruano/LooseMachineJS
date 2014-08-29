/**
 * @author https://github.com/rmruano
 * @license https://github.com/rmruano/LooseMachineJs/blob/master/LICENSE
 */

var LooseMachine = LooseMachine || {};

LooseMachine.extendOptions = function( defaults, newOptions ) {
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
    var debug = false;
    var currentAction = false;
    var onLeave = function (action) {
    };
    /* Placeholder for listener: Receives an Action object */
    var onEnter = function (action) {
    };
    /* Placeholder for listener: Receives an Action object */
    var onLeaveState = function (actionState) {
    };
    /* Placeholder for listener: Receives an ActionState object */
    var onEnterState = function (actionState) {
    };
    /* Placeholder for listener: Receives an ActionState object */
    this.leaveCurrentAction = function () {
        if (currentAction) currentAction.leave();
    };
    this.getCurrentAction = function () {
        return currentAction;
    };
    this.log = function (msg) {
        if (debug && typeof console === "object") {
            if (typeof msg === "string") console.log("ActionDirector (" + new Date().toISOString() + "): " + msg);
            else if (typeof msg === "object") console.dir(msg);
        }
    };
    this.enter = function (action) {
        this.log("ACTION enter " + action.getId());
        if (currentAction == action) return; // Not changed
        this.leaveCurrentAction();
        currentAction = action;
        onEnter(action);
    };
    this.leave = function (action) {
        this.log("ACTION leave " + action.getId());
        currentAction = false;
        onLeave(action);
    };
    this.enterState = function (actionState) {
        this.log("Action STATE enter " + actionState.getAction().getId() + "/" + actionState.getId());
        onEnterState(actionState);
    };
    this.leaveState = function (actionState) {
        this.log("Ation STATE leave " + actionState.getAction().getId() + "/" + actionState.getId());
        onLeaveState(actionState);
    };
    this.onEnter = function (callback) {
        if (typeof callback == "function") onEnter = callback;
        return this;
    };
    this.onLeave = function (callback) {
        if (typeof callback == "function") onLeave = callback;
        return this;
    };
    this.onEnterState = function (callback) {
        if (typeof callback == "function") onEnterState = callback;
        return this;
    };
    this.onLeaveState = function (callback) {
        if (typeof callback == "function") onLeaveState = callback;
        return this;
    };
    this.enableDebug = function () {
        debug = true;
        return this;
    };
}

/**
 * Define the multiple actions that can be performed (1st level)
 */
LooseMachine.Action = function(id, options) {
    // Private vars
    var currentState = false; /* current state */
    var active = false; /* is active? */
    var states = {}; /* Action states */
    var onEnter = function (action) {}; /* Placeholder for listener: Receives an Action object */
    var onLeave = function (action) {}; /* Placeholder for listener: Receives an Action object */
    var enterCounter = 0; /* Number of enters */
    var leaveCounter = 0; /* Number of leaves */
    var director = false; /* Placeholder for an action director */
    var handlers = {}; /* Storage for custom handlers (methods) */
    var data = {}; /* Custom action data to enable handlers to store temporary, action-wide data */
    // Options
    if ((typeof options == "undefined" || options == null)) options = false;
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
        if (this.getCurrentState() == this.getState(state)) return true;
        return false;
    };
    this.getDefaultState = function () {
        if (typeof states[options["defaultState"]] != "undefined") return states[options["defaultState"]]; // Return the default state if present
        // No default fouund, iterate the object properties to find one
        for (var stateId in states) return states[stateId]; // Return first found, careful, could be anyone!
        return false;
    };
    this.getCurrentState = function () {
        if (currentState) return currentState;
        return this.getDefaultState(); // Not found, return the default one
    };
    this.setCurrentState = function (state, doNotEnterFlag) {
        if (typeof state == "undefined") throw Error("Invalid state provided");
        if (typeof doNotEnterFlag == "undefined") doNotEnterFlag = false;
        if (state && typeof state == "string") {
            state = this.getState(state); // If it's not an ActionState object, get it from it's id
            if (state == null) throw Error("Invalid state provided");
        }
        if (currentState == state) return false; // Already set
        if (currentState) currentState.leave(); // Leave old state
        // Empty new state
        if (!state) {
            currentState = false;
            return this;
        }
        // An actual state
        if (!(state instanceof LooseMachine.ActionState)) throw Error("Invalid state provided");
        currentState = state;
        if (!doNotEnterFlag) currentState.enter(); // Enter current state
        return this;
    };
    this.enter = function () {
        if (active) return false;
        active = true;
        enterCounter++;
        //console.log("action enter "+id);
        if (director) director.enter(this);
        onEnter(this); // Trigger event
        if (this.getCurrentState()) this.getCurrentState().enter(); // Enter current state if any
        return true;
    };
    this.leave = function () {
        if (!active) return false;
        active = false;
        leaveCounter++;
        if (this.getCurrentState() && !this.getCurrentState().getOption("persist")) this.getCurrentState().leave(); // Leave current state if any and its not persistent
        //console.log("action leave "+id);
        onLeave(this); // Trigger event
        if (director) director.leave(this);
        return true;
    };
    this.onEnter = function (callback) {
        if (typeof callback == "function") onEnter = callback;
        return this;
    };
    this.onLeave = function (callback) {
        if (typeof callback == "function") onLeave = callback;
        return this;
    };
    this.addState = function (state) {
        if (typeof id != "string") throw Error("Invalid id provided");
        if (typeof state == "undefined" || !(state instanceof LooseMachine.ActionState)) throw Error("Invalid state provided");
        state.setAction(this);
        /* Attach a reference to this action */
        states[state.getId()] = state;
        return this;
    };
    this.getState = function (id) {
        if (typeof id == "undefined") return this.getCurrentState(); // Not id provided, return current
        if (id instanceof LooseMachine.ActionState) return id; // Already an ActionState
        if (typeof id != "string") throw Error("Invalid id provided");
        if (typeof states[id] == "undefined") return null;
        return states[id];
    };
    this.setDirector = function (actionDirector) {
        if (typeof actionDirector == "undefined" || !(actionDirector instanceof LooseMachine.Director)) throw Error("Invalid director provided");
        director = actionDirector;
        return this;
    };
    this.getDirector = function () {
        return director;
    };
    this.addHandler = function (handlerId, callback) {
        if (typeof handlerId != "string" || typeof callback != "function") throw Error("Invalid or non-present handlerId or callback");
        handlers[handlerId] = callback;
        return this;
    };
    this.runHandler = function (handlerId, parameter) {
        if (parameter === undefined) parameter = undefined;
        if (typeof handlers[handlerId] == "function") return handlers[handlerId](this, parameter);
        return null;
    };
    this.runHandlerIfActive = function (handlerId, parameter) {
        if (parameter === undefined) parameter = undefined;
        if (this.isActive() && typeof handlers[handlerId] == "function") return this.runHandler(handlerId, parameter);
        return null;
    };
    this.setData = function (id, dataToStore) {
        data[id] = dataToStore;
    };
    this.getData = function (id) {
        if (id === undefined) {
            return data;
        } else {
            return (typeof data[id] == "undefined" ? null : data[id]);
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
    // Private vars
    var active = false; /* is active? */
    var onEnter = function (actionState) {}; /* Placeholder for listener: Receives an ActionState object */
    var onLeave = function (actionState) {}; /* Placeholder for listener: Receives an ActionState object */
    var enterCounter = 0;/* Number of enters */
    var leaveCounter = 0;/* Number of leaves */
    var actionObject = false;/* Must be provided through this.setAction */
    var handlers = {};/* Storage for custom handlers (methods) */
    var data = {};/* Custom action data to enable handlers to store temporary, actionstate-wide data */
    // Id
    if (typeof id == "undefined") id = "default";
    // Options
    if ((typeof options == "undefined" || options == null)) options = false;
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
        if (typeof action == "undefined" || !(action instanceof LooseMachine.Action)) throw new Error("Invalid actionObject provided");
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
        if (active) isResume = true;
        //debugger;
        /*if (active) {
            actionObject.enter(); // In case is a persistent state, reenter the action
            return false;
        }*/
        active = true;
        enterCounter++;
        actionObject.setCurrentState(this, true);
        if (!actionObject.isActive) {actionObject.enter();} // In case it's not active already
        if (this.getAction().getDirector()) this.getAction().getDirector().enterState(this);
        //console.log("state enter "+actionObject.getId()+"/"+id);
        onEnter(this, isResume); // Trigger event
        return true;
    };
    this.leave = function () {
        if (!active) return false;
        active = false;
        leaveCounter++;
        //console.log("state leave "+actionObject.getId()+"/"+id);
        if (actionObject.getCurrentState() == this) actionObject.setCurrentState(false, true); // No current state (because we're hiding this state)
        onLeave(this); // Trigger event
        if (this.getAction().getDirector()) this.getAction().getDirector().leaveState(this);
        return true;
    };
    this.onEnter = function (callback, isResume) {
        if (typeof callback == "function") onEnter = callback;
        return this;
    };
    this.onLeave = function (callback) {
        if (typeof callback == "function") onLeave = callback;
        return this;
    };
    this.addHandler = function (handlerId, callback) {
        if (typeof handlerId != "string" || typeof callback != "function") throw Error("Invalid or non-present handlerId or callback");
        handlers[handlerId] = callback;
        return this;
    };
    this.runHandler = function (handlerId, parameter, actionState) {
        if (typeof actionState == "object" && actionState instanceof LooseMachine.ActionState) {
            /* Another actionState was provided, let it work!. In some scenarios it
             could be interesting letting the handler thinking it's part of another state */
        } else actionState = this;
        if (parameter === undefined) parameter = undefined;
        if (typeof handlers[handlerId] == "function") return handlers[handlerId](actionState, parameter);
        return null;
    };
    this.runHandlerAs = function (actionState, handlerId, parameter) {
        if (parameter === undefined) parameter = undefined;
        if (typeof actionState === "undefined" || !(actionState instanceof LooseMachine.ActionState)) throw new Error("Invalid actionState provided");
        return this.runHandler(handlerId, parameter, actionState);
    };
    this.runHandlerIfActive = function (handlerId, parameter) {
        if (parameter === undefined) parameter = undefined;
        if (this.isActive() && typeof handlers[handlerId] == "function") return this.runHandler(handlerId, parameter);
        return null;
    };
    this.setData = function (id, dataToStore) {
        data[id] = dataToStore;
    };
    this.getData = function (id) {
        if (id === undefined) {
            return data;
        } else {
            return (typeof data[id] == "undefined" ? null : data[id]);
        }
    };
    this.enterCount = function () {
        return enterCounter;
    };
    this.leaveCount = function () {
        return leaveCounter;
    };
};