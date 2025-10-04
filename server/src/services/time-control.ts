export type TimeControlOptions = {
  mode: 'bullet' | 'blitz' | 'rapid' | 'classical';
  minutes: number; // minutes per player
  incrementSeconds?: number; // Fischer increment
  delaySeconds?: number; // Delay amount
  delayMode?: 'none' | 'fischer' | 'bronstein' | 'simple';
};

export type ServerClockState = {
  whiteMs: number;
  blackMs: number;
  active: 'white' | 'black';
  lastStamp: number; // epoch ms when the active side started counting
  incrementSeconds: number;
  delaySeconds: number;
  delayMode: 'none' | 'fischer' | 'bronstein' | 'simple';
};

export function createInitialClock(opts: TimeControlOptions): ServerClockState {
  const baseMs = Math.max(0, Math.floor(opts.minutes * 60_000));
  return {
    whiteMs: baseMs,
    blackMs: baseMs,
    active: 'white',
    lastStamp: Date.now(),
    incrementSeconds: Math.max(0, Math.floor(opts.incrementSeconds ?? 0)),
    delaySeconds: Math.max(0, Math.floor(opts.delaySeconds ?? 0)),
    delayMode: opts.delayMode ?? 'none',
  };
}

export function onMoveComplete(state: ServerClockState): ServerClockState {
  const now = Date.now();
  const elapsed = Math.max(0, now - state.lastStamp);

  // Apply delay/bronstein
  let deducted = elapsed;
  if (state.delayMode === 'simple' && state.delaySeconds > 0) {
    deducted = Math.max(0, elapsed - state.delaySeconds * 1000);
  } else if (state.delayMode === 'bronstein' && state.delaySeconds > 0) {
    deducted = Math.max(0, Math.min(elapsed, state.delaySeconds * 1000));
  }

  if (state.active === 'white') {
    state.whiteMs = Math.max(0, state.whiteMs - deducted);
    // Fischer increment
    if (state.incrementSeconds > 0) state.whiteMs += state.incrementSeconds * 1000;
    state.active = 'black';
  } else {
    state.blackMs = Math.max(0, state.blackMs - deducted);
    if (state.incrementSeconds > 0) state.blackMs += state.incrementSeconds * 1000;
    state.active = 'white';
  }

  state.lastStamp = now;
  return state;
}

export function getRemaining(state: ServerClockState): { whiteMs: number; blackMs: number } {
  const now = Date.now();
  const elapsed = Math.max(0, now - state.lastStamp);

  const apply = (base: number, active: boolean) => {
    if (!active) return base;
    let deduction = elapsed;
    if (state.delayMode === 'simple' && state.delaySeconds > 0) {
      deduction = Math.max(0, elapsed - state.delaySeconds * 1000);
    } else if (state.delayMode === 'bronstein' && state.delaySeconds > 0) {
      deduction = Math.max(0, Math.min(elapsed, state.delaySeconds * 1000));
    }
    return Math.max(0, base - deduction);
  };

  return {
    whiteMs: apply(state.whiteMs, state.active === 'white'),
    blackMs: apply(state.blackMs, state.active === 'black'),
  };
}
