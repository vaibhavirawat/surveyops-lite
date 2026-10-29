import { describe, expect, it } from 'vitest';
import { assertValidTransition } from '../src/modules/villages/villages.service';
import { STAGES } from '../src/modules/villages/villages.schema';

// Unit tests: they check one function in isolation, with no database or HTTP involved.
describe('assertValidTransition', () => {
  it('allows moving forward exactly one stage, for every adjacent pair', () => {
    for (let i = 0; i < STAGES.length - 1; i++) {
      expect(() => assertValidTransition(STAGES[i], STAGES[i + 1])).not.toThrow();
    }
  });

  it('rejects skipping a stage and names the correct next stage', () => {
    expect(() => assertValidTransition('not_started', 'parcels_matched')).toThrowError(
      expect.objectContaining({ status: 422, code: 'INVALID_TRANSITION', message: expect.stringContaining('georeferenced') }),
    );
  });

  it('rejects staying on the same stage', () => {
    expect(() => assertValidTransition('georeferenced', 'georeferenced')).toThrowError(
      expect.objectContaining({ status: 422, code: 'INVALID_TRANSITION' }),
    );
  });

  it('requires a note when moving backwards', () => {
    expect(() => assertValidTransition('parcels_matched', 'georeferenced')).toThrowError(
      expect.objectContaining({ status: 422, code: 'NOTE_REQUIRED' }),
    );
  });

  it('allows moving backwards, even several stages, when a note is given', () => {
    expect(() => assertValidTransition('tehsil_merged', 'not_started', 'Whole boundary needs rework')).not.toThrow();
  });
});
