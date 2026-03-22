// Unit tests for game logic: collection, rarity data, score
// Run: node --test src/game/score.test.js

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Mock localStorage (Node.js has no DOM) ──
const _store = {};
global.localStorage = {
  getItem: (k) => _store[k] ?? null,
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};

function clearStore() {
  for (const k of Object.keys(_store)) delete _store[k];
}

// Imports after mock setup — score.js calls localStorage only inside functions,
// not at module init time, so mock is ready before any test runs.
import {
  addToCollection, getCatCount, getCollectionCount, COLLECTION_MAX,
  saveBestScore, getBestScore,
} from './score.js';
import { CAT_RARITY } from './stages.js';

// ── Cat rarity ──

describe('CAT_RARITY', () => {
  test('common cats are common', () => {
    assert.equal(CAT_RARITY['korean'], 'common');
    assert.equal(CAT_RARITY['russian'], 'common');
    assert.equal(CAT_RARITY['ragdoll'], 'common');
    assert.equal(CAT_RARITY['bengal'], 'common');
    assert.equal(CAT_RARITY['bombay'], 'common');
  });

  test('S1-S7 cats are rare', () => {
    assert.equal(CAT_RARITY['scottish'], 'rare');
    assert.equal(CAT_RARITY['persian'], 'rare');
    assert.equal(CAT_RARITY['munchkin'], 'rare');
    assert.equal(CAT_RARITY['siamese'], 'rare');
    assert.equal(CAT_RARITY['norwegian'], 'rare');
  });

  test('S8-S15 cats are epic', () => {
    assert.equal(CAT_RARITY['himalayan'], 'epic');
    assert.equal(CAT_RARITY['mainecoon'], 'epic');
    assert.equal(CAT_RARITY['savannah'], 'epic');
    assert.equal(CAT_RARITY['toyger'], 'epic');
  });

  test('S16-S20 cats are legendary', () => {
    assert.equal(CAT_RARITY['ocicat'], 'legendary');
    assert.equal(CAT_RARITY['singapura'], 'legendary');
    assert.equal(CAT_RARITY['sphynx'], 'legendary');
    assert.equal(CAT_RARITY['nebelung'], 'legendary');
  });
});

// ── Collection ──

describe('addToCollection / getCatCount / getCollectionCount', () => {
  beforeEach(clearStore);

  test('new cat starts at count 0', () => {
    assert.equal(getCatCount('scottish'), 0);
  });

  test('addToCollection increments count', () => {
    addToCollection('scottish');
    assert.equal(getCatCount('scottish'), 1);
  });

  test('adding up to COLLECTION_MAX works', () => {
    for (let i = 0; i < COLLECTION_MAX; i++) addToCollection('persian');
    assert.equal(getCatCount('persian'), COLLECTION_MAX);
  });

  test('adding beyond COLLECTION_MAX is blocked (returns null)', () => {
    for (let i = 0; i < COLLECTION_MAX; i++) addToCollection('munchkin');
    const result = addToCollection('munchkin');
    assert.equal(result, null);
    assert.equal(getCatCount('munchkin'), COLLECTION_MAX); // no overflow
  });

  test('getCollectionCount counts only fully collected cats', () => {
    assert.equal(getCollectionCount(100), 0);

    // Partially collected — should NOT count
    addToCollection('siamese');
    assert.equal(getCollectionCount(100), 0);

    // Fully collected — should count
    for (let i = 1; i < COLLECTION_MAX; i++) addToCollection('siamese');
    assert.equal(getCollectionCount(100), 1);
  });
});

// ── Best score ──

describe('saveBestScore / getBestScore', () => {
  beforeEach(clearStore);

  test('no score saved → 0', () => {
    assert.equal(getBestScore(1), 0);
  });

  test('save score → returns it', () => {
    saveBestScore(1, 1500);
    assert.equal(getBestScore(1), 1500);
  });

  test('higher score replaces lower', () => {
    saveBestScore(1, 1000);
    saveBestScore(1, 2000);
    assert.equal(getBestScore(1), 2000);
  });

  test('lower score does not replace higher', () => {
    saveBestScore(1, 2000);
    saveBestScore(1, 500);
    assert.equal(getBestScore(1), 2000);
  });
});
