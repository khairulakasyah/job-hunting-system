import { toast } from 'sonner'

const MOTIVATIONAL_QUOTES = [
  'Keep pushing forward! Every application brings you closer.',
  'Consistency is key. You\'re building momentum!',
  'Your dream job is out there. Keep going!',
  'Small steps every day lead to big results.',
  'You\'re doing great — stay focused and positive!',
  'Every "no" brings you one step closer to a "yes".',
  'Progress, not perfection. You\'ve got this!',
  'The right opportunity is waiting for you.',
  'Stay persistent. Your future self will thank you.',
  'You\'re investing in yourself — and it will pay off.',
  'Believe in the process. Great things take time.',
  'One application at a time. You\'re making progress!',
  'Your determination is inspiring. Keep at it!',
  'Success is the sum of small efforts repeated daily.',
  'You\'re qualified, you\'re capable, and you\'re prepared.',
  'Every update brings you closer to the finish line.',
  'Stay organized, stay focused, stay motivated!',
  'The best time to apply was yesterday. The next best is now.',
  'You\'re not just applying — you\'re building your future.',
  'Keep showing up. Your breakthrough is coming.',
]

let lastIndex = -1

export function motivate() {
  let index: number
  do {
    index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  } while (index === lastIndex && MOTIVATIONAL_QUOTES.length > 1)
  lastIndex = index

  toast.success(MOTIVATIONAL_QUOTES[index], {
    duration: 3000,
    position: 'bottom-right',
  })
}
