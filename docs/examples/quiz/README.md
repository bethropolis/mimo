# Quiz Example

A simple quiz application demonstrating modules and data structures.

## Files

- `data.mimo` - Quiz questions data
- `engine.mimo` - Quiz logic functions
- `main.mimo` - Main quiz application

## data.mimo

```mimo
export const QUESTIONS [
    {
        q: "What is the result of '+ 2 3' in Mimo?",
        a: "5",
        options: ["1", "5", "6", "23"]
    },
    {
        q: "Which keyword is used for block-scoped variables?",
        a: "let",
        options: ["set", "let", "const", "var"]
    },
    {
        q: "Is Mimo dynamically typed?",
        a: "yes",
        options: ["yes", "no"]
    }
]
```

## engine.mimo

```mimo
import array from "array"

export function check_answer(question, user_answer)
    return = question.a user_answer
end

export function get_score_percentage(correct, total)
    return * (/ correct total) 100
end
```

## main.mimo

```mimo
import data from "./data.mimo"
import engine from "./engine.mimo"

show "--- Mimo Programming Quiz ---"
show `Starting quiz with ${call len(data.QUESTIONS)} questions.`

let score 0

for q in data.QUESTIONS
    show ""
    show `Question: ${q.q}`
    // Display options
    show `  A) ${q.options[0]}`
    show `  B) ${q.options[1]}`
    if > call len(q.options) 2
        show `  C) ${q.options[2]}`
    end
    if > call len(q.options) 3
        show `  D) ${q.options[3]}`
    end
    
    // Simulate an answer
    set simulated_choice q.a
    show `Your answer: ${simulated_choice}`
    
    if call engine.check_answer(q, simulated_choice)
        show "Correct!"
        set score + score 1
    else
        show `Wrong! The correct answer was: ${q.a}`
    end
end

show ""
show "--- Quiz Results ---"
show `Score: ${score} / ${call len(data.QUESTIONS)}`
set percent call engine.get_score_percentage(score, call len(data.QUESTIONS))
show `Grade: ${percent}%`

if = percent 100
    show "Perfect Score!"
else
    if >= percent 70
        show "Well done!"
    else
        show "Keep practicing!"
    end
end
```

## Output

```
--- Mimo Programming Quiz ---
Starting quiz with 3 questions.

Question: What is the result of '+ 2 3' in Mimo?
  A) 1
  B) 5
  C) 6
  D) 23
Your answer: 5
Correct!

--- Quiz Results ---
Score: 3 / 3
Grade: 100%
Perfect Score!
```
