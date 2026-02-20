# Task Manager Example

A simple task management application demonstrating array operations and higher-order functions.

## Files

- `logic.mimo` - Task manipulation functions
- `main.mimo` - Main application

## logic.mimo

```mimo
import "array" as array

export function add_task(tasks, title)
    set new_task {
        id: + call len(tasks) 1,
        title: title,
        completed: false
    }
    return [...tasks, new_task]
end

export function toggle_task(tasks, id)
    return call array.map(tasks, function(t)
        if = t.id id
            set new_completed not t.completed
            return {
                id: t.id,
                title: t.title,
                completed: new_completed
            }
        else
            return t
        end
    end)
end

export function get_pending(tasks)
    return call array.filter(tasks, function(t)
        set is_done t.completed
        return not is_done
    end)
end
```

## main.mimo

```mimo
import "./logic.mimo" as logic

show "--- Mimo Task Manager ---"

// Initialize demo tasks
let tasks []

show "Adding demo tasks..."
set tasks call logic.add_task(tasks, "Learn Mimo")
set tasks call logic.add_task(tasks, "Write Examples")
set tasks call logic.add_task(tasks, "Take over the world")

show `Total tasks: ${call len(tasks)}`

// Mark first as done
set tasks call logic.toggle_task(tasks, 1)

// Show all tasks
show "--- All Tasks ---"
for t in tasks
    if t.completed
        show `[x] ${t.id}: ${t.title}`
    else
        show `[ ] ${t.id}: ${t.title}`
    end
end

// Show pending count
set pending call logic.get_pending(tasks)
set pending_count call len(pending)
show ""
show `Pending: ${pending_count} tasks`

show ""
show "Done!"
```

## Output

```
--- Mimo Task Manager ---
Adding demo tasks...
Total tasks: 3
--- All Tasks ---
[x] 1: Learn Mimo
[ ] 2: Write Examples
[ ] 3: Take over the world

Pending: 2 tasks

Done!
```

## Concepts Demonstrated

- **Array spread**: `[...tasks, new_task]`
- **Higher-order functions**: `array.map`, `array.filter`
- **Anonymous functions**: `function(t) ... end`
- **Object construction**: `{ id: ..., title: ..., completed: ... }`
- **Template literals**: `` `Pending: ${count} tasks` ``
