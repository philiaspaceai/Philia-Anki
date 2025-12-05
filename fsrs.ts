
import { State, Rating, Card as AppCard } from './types';

// FSRS-6 Implementation (21 Parameters)
// Reference: https://github.com/open-spaced-repetition/ts-fsrs/blob/master/src/algorithm.ts

export type Card = AppCard;

export class FSRS {
  private w: number[];
  private request_retention: number;
  private maximum_interval: number;
  private decay: number;
  private factor: number;
  private intervalModifier: number;

  constructor(params: { w: number[], requestRetention: number, maximumInterval: number }) {
    this.w = params.w;
    this.request_retention = params.requestRetention;
    this.maximum_interval = params.maximumInterval;
    
    // Calculate Decay and Factor for FSRS-6
    // decay = -w[20]
    // factor = exp(ln(0.9)/decay) - 1
    this.decay = -this.w[20]; 
    this.factor = Math.exp(Math.log(0.9) / this.decay) - 1;
    
    // Calculate Interval Modifier based on Request Retention
    // I(r,s) = (r^(1/decay) - 1) / factor * s
    this.intervalModifier = (Math.pow(this.request_retention, 1 / this.decay) - 1) / this.factor;
  }

  /**
   * Linear Damping
   * @see https://github.com/open-spaced-repetition/fsrs4anki/issues/697
   */
  private linear_damping(delta_d: number, old_d: number): number {
    return (delta_d * (10 - old_d)) / 9;
  }

  /**
   * Mean Reversion
   * w7 * init + (1 - w7) * current
   */
  private mean_reversion(init: number, current: number): number {
    return this.w[7] * init + (1 - this.w[7]) * current;
  }

  private init_difficulty(rating: Rating): number {
    // D0(G) = w[4] - exp((G-1)*w[5]) + 1
    // rating: Again=1, Hard=2, Good=3, Easy=4
    const d = this.w[4] - Math.exp((rating - 1) * this.w[5]) + 1;
    return Math.min(Math.max(d, 1), 10);
  }

  private next_difficulty(d: number, rating: Rating): number {
    // delta_d = -w[6] * (g - 3)
    const delta_d = -this.w[6] * (rating - 3);
    
    // next_d = D + linear_damping(delta_d, D)
    const next_d = d + this.linear_damping(delta_d, d);
    
    // D' = w[7] * D0(4) + (1 - w[7]) * next_d
    // D0(4) is init_difficulty(Rating.Easy) => Rating.Easy is 4
    const new_d = this.mean_reversion(this.init_difficulty(Rating.Easy), next_d);
    
    return Math.min(Math.max(new_d, 1), 10);
  }

  private next_recall_stability(d: number, s: number, r: number, rating: Rating): number {
    const hard_penalty = rating === Rating.Hard ? this.w[15] : 1;
    const easy_bonus = rating === Rating.Easy ? this.w[16] : 1;

    // S'r = S * (1 + exp(w8) * (11-D) * S^-w9 * (exp((1-R)*w10)-1) * hard_penalty * easy_bonus)
    const new_s = s * (1 + 
        Math.exp(this.w[8]) * 
        (11 - d) * 
        Math.pow(s, -this.w[9]) * 
        (Math.exp((1 - r) * this.w[10]) - 1) * 
        hard_penalty * 
        easy_bonus
    );
    
    return Math.min(Math.max(new_s, 0.1), 36500);
  }

  private next_forget_stability(d: number, s: number, r: number): number {
    // S'f = w11 * D^-w12 * ((S+1)^w13 - 1) * exp((1-R)*w14)
    const new_s = this.w[11] * 
        Math.pow(d, -this.w[12]) * 
        (Math.pow(s + 1, this.w[13]) - 1) * 
        Math.exp((1 - r) * this.w[14]);
    
    return Math.min(Math.max(new_s, 0.1), 36500);
  }

  private next_interval(s: number): number {
    // I = S * Modifier
    const newInterval = s * this.intervalModifier;
    // Hard constraint: max interval
    return Math.min(Math.max(1, Math.round(newInterval)), this.maximum_interval);
  }

  private apply_fuzz(interval: number, elapsed_days: number): number {
    if (interval < 2.5) return Math.round(interval);
    
    // Smart Fuzzing (Bucket System)
    const ranges = [
        { start: 2.5, end: 7.0, factor: 0.15 },
        { start: 7.0, end: 20.0, factor: 0.1 },
        { start: 20.0, end: Infinity, factor: 0.05 }
    ];

    let delta = 1.0;
    for (const range of ranges) {
        delta += range.factor * Math.max(Math.min(interval, range.end) - range.start, 0.0);
    }
    
    let min_ivl = Math.max(2, Math.round(interval - delta));
    const max_ivl = Math.min(Math.round(interval + delta), this.maximum_interval);
    
    // Prevent fuzzing from landing on exactly "yesterday" relative to review, but here elapsed_days usually refers to last interval?
    // In ts-fsrs: if (interval > elapsed_days) { min_ivl = Math.max(min_ivl, elapsed_days + 1); }
    if (interval > elapsed_days) {
        min_ivl = Math.max(min_ivl, elapsed_days + 1);
    }
    min_ivl = Math.min(min_ivl, max_ivl);
    
    // Random integer between min_ivl and max_ivl
    return Math.floor(Math.random() * (max_ivl - min_ivl + 1)) + min_ivl;
  }

  public repeat(card: Card, now: Date): Record<Rating, Card> {
    // Clone card to prevent mutation of the input object
    card = { ...card };

    // Hydrate last_review if missing (fallback)
    if (!card.last_review) {
      card.last_review = new Date(now.getTime() - (card.elapsed_days || 0) * 24 * 60 * 60 * 1000);
    }

    // Calculate actual elapsed days
    if (card.state === State.New) {
      card.elapsed_days = 0;
    } else {
      card.elapsed_days = (now.getTime() - card.last_review.getTime()) / (24 * 60 * 60 * 1000);
      card.elapsed_days = Math.max(0, card.elapsed_days);
    }
    
    // Prepare next card base state
    const last_review = now;
    const reps = card.reps + 1;

    // Calculate Retrievability (Current R)
    // R(t,S) = (1 + FACTOR * t / S) ^ DECAY
    let retrievability = 0;
    if (card.state !== State.New && card.s > 0) {
        retrievability = Math.pow(1 + this.factor * card.elapsed_days / card.s, this.decay);
    }

    const schedule: Record<Rating, Card> = {} as Record<Rating, Card>;
    const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

    for (const rating of ratings) {
        let next_s = card.s;
        let next_d = card.d;
        let next_state = card.state;

        // --- STATE TRANSITIONS & PARAMETER UPDATES ---

        if (card.state === State.New) {
            // New Card
            next_state = rating === Rating.Again ? State.Learning : State.Review; // Simplified transition, app handles Learning separately usually
            
            // FSRS-6 Init Stability: S0 = w[G-1]
            next_s = Math.max(this.w[rating - 1], 0.1);
            
            // FSRS-6 Init Difficulty: D0(G) = w[4] - exp((G-1)*w[5]) + 1
            next_d = this.init_difficulty(rating);

        } else if (card.state === State.Learning || card.state === State.Relearning) {
            // In Learning/Relearning Phase (Manual Steps)
            // If we are calling FSRS here, it usually means graduation (Easy or Steps Finished)
            
            next_state = rating === Rating.Again ? State.Relearning : State.Review;
            
            // If graduating from Learning, we treat it as New initialization for Stability logic
            // But if it was Relearning, we might want to preserve some context?
            // Standard FSRS often resets S/D on graduation from Learning if treated as New.
            // But if we have valid S/D from previous reviews, we should update them?
            // Implementation Decision: If S is 0 (New), Init. If S > 0, Update?
            // Philia Anki Logic: We pass State.New or State.Review into repeat based on context in StudyPage.
            // If StudyPage passes State.New (Graduation), we enter the block above.
            // If StudyPage passes State.Review (Lapsed Graduation), we enter the block below.
            // If we are here, it means StudyPage passed State.Learning/Relearning which implies we are PREVIEWING step intervals?
            // Actually, for simple Manual Steps, FSRS math isn't used until Graduation.
            // So we'll assume standard update logic if forced.
            next_s = card.s;
            next_d = card.d;

        } else if (card.state === State.Review) {
            // Review Card
            if (rating === Rating.Again) {
                // Lapse
                next_state = State.Relearning;
                
                // D' calculation
                const delta_d = -this.w[6] * (rating - 3);
                const next_d_unclamped = card.d + this.linear_damping(delta_d, card.d);
                const init_d_easy = this.init_difficulty(Rating.Easy);
                next_d = this.mean_reversion(init_d_easy, next_d_unclamped);
                next_d = Math.min(Math.max(next_d, 1), 10);

                // S_forget
                const s_forget = this.next_forget_stability(card.d, card.s, retrievability);
                
                // Short-term stability protection (FSRS-6 specific for Lapses)
                // min(S_forget, S / exp(w17 * w18))
                // Note: w17/w18 are part of the 21 param set for this purpose
                const s_short_term = card.s / Math.exp(this.w[17] * this.w[18]);
                
                next_s = Math.min(s_forget, s_short_term);
                next_s = Math.max(next_s, 0.1);

            } else {
                // Recall (Hard/Good/Easy)
                next_state = State.Review;
                
                next_d = this.next_difficulty(card.d, rating);
                next_s = this.next_recall_stability(card.d, card.s, retrievability, rating);
            }
        }

        // --- INTERVAL CALCULATION ---
        let fuzzedInterval = 0;
        
        if (next_state === State.Review) {
            const rawInterval = this.next_interval(next_s);
            fuzzedInterval = this.apply_fuzz(rawInterval, card.elapsed_days || 0);
        } else {
            // For Learning/Relearning, interval is usually 0 (or handled by steps)
            // FSRS returns 0 here, relying on manual scheduler to set step interval
            fuzzedInterval = 0;
        }

        const due = new Date(now.getTime() + fuzzedInterval * 24 * 60 * 60 * 1000);
        
        schedule[rating] = {
            ...card,
            due: due,
            scheduled_days: fuzzedInterval,
            state: next_state,
            s: parseFloat(next_s.toFixed(8)),
            d: parseFloat(next_d.toFixed(8)),
            reps: reps,
            lapses: rating === Rating.Again && card.state === State.Review ? card.lapses + 1 : card.lapses,
            last_review: last_review,
            elapsed_days: card.elapsed_days // preserve calculated elapsed
        };
    }

    return schedule;
  }
}
