LooseMachineJS
==============

A simple, easy to use JavaScript library for creating powerfool "loose" state machines with complete freedom. A multiple LooseMachine.Action can be handled by a LooseMachine.Director which acts as a semaphore between them (entering one action/machine will force leave the other active one). If you're looking for a standard FSM implementation take a look at the awesome https://github.com/jakesgordon/javascript-state-machine

Basic Usage
-----------

```
<script src="LooseMachine.js"></script>
<script>
    var my3StepAction = new LooseMachine.Action("test");
    my3StepAction.setDefaultState("state1");
    my3StepAction.addState( (new LooseMachine.ActionState("state1"))
        .onEnter(function(actionState) {
            console.log("ActionState onEnter:  "+actionState.getAction().getId()+"/"+actionState.getId());
            actionState.getAction().getState("state2").enter(); // Automatically avance to next state
        })
    );
    my3StepAction.addState( (new LooseMachine.ActionState("state2"))
        .onEnter(function(actionState) {
            console.log("ActionState onEnter:  "+actionState.getAction().getId()+"/"+actionState.getId());
            actionState.getAction().getState("state2").enter(); // Automatically avance to next state
        })
    );
    my3StepAction.addState( (new LooseMachine.ActionState("state3"))
        .onEnter(function(actionState) {
            console.log("ActionState onEnter:  "+actionState.getAction().getId()+"/"+actionState.getId());
            alert("### COMPLETED! ###");
            actionState.getAction().leave(); // Leave the action, it will be automatically reseted
        })
    );
    my3StepAction.enter(); // Run it
</script>
```

Or, if you prefer a fluent interface:

```
<script src="LooseMachine.js"></script>
<script>
    var my3StepAction = (new LooseMachine.Action("test", {defaultState:"state1"}))
            .addState( (new LooseMachine.ActionState("state1"))
                .onEnter(function(actionState) {
                    console.log("ActionState onEnter:  "+actionState.getAction().getId()+"/"+actionState.getId());
                    actionState.getAction().getState("state2").enter(); // Automatically avance to next state
                })
            ).addState( (new LooseMachine.ActionState("state2"))
                .onEnter(function(actionState) {
                    console.log("ActionState onEnter:  "+actionState.getAction().getId()+"/"+actionState.getId());
                    actionState.getAction().getState("state2").enter(); // Automatically avance to next state
                })
            ).addState( (new LooseMachine.ActionState("state3"))
                .onEnter(function(actionState) {
                    console.log("ActionState onEnter:  "+actionState.getAction().getId()+"/"+actionState.getId());
                    alert("### COMPLETED! ###");
                    actionState.getAction().leave(); // Leave the action, it will be automatically reseted
                })
            );
    my3StepAction.enter(); // Run it
</script>
```

Advanced Usage
--------------

Take a look at *demo_persistent.html* and *demo_director.html* for advanced examples of persistent states & multiple actions (machines) working simultaneously.

Supported events
----------------
#### LooseMachine.Action
- `onEnter( action )`  Entering an action (running the machine)
- `onLeave( action )`  Leaving an action (stopping the machine, it will be resetted)

#### LooseMachine.ActionState
- `onEnter( actionState, isResume )`  Entering an action state (isResume will be true if the state is being resumed)
- `onLeave( actionState )`  Leaving an action state

#### LooseMachine.Director
- `onEnter( action )`  Entering an action
- `onLeave( action )`  Leaving an action
- `onEnterState( actionState )`  Entering an action state 
- `onLeaveState( actionState )`  Leaving an action state
