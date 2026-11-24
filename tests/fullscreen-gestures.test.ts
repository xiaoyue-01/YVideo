import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeBrightnessLevel,
  computeSeekTargetTime,
  computeVolumeLevel,
  getVisualGestureMetrics,
} from '../components/player/hooks/desktop/fullscreen-gesture-utils';

const projectRoot = process.cwd();

test('fullscreen gesture coordinate mapping handles normal and rotated modes', () => {
  const rect = { left: 0, top: 0, width: 1000, height: 500 };

  const normalLeftSwipeUp = getVisualGestureMetrics(
    { clientX: 200, clientY: 300 },
    { clientX: 205, clientY: 150 },
    rect,
    false
  );
  assert.equal(normalLeftSwipeUp.isLeftHalf, true);
  assert.equal(normalLeftSwipeUp.visualDy, 150);

  const normalRightSwipeDown = getVisualGestureMetrics(
    { clientX: 800, clientY: 150 },
    { clientX: 800, clientY: 300 },
    rect,
    false
  );
  assert.equal(normalRightSwipeDown.isLeftHalf, false);
  assert.equal(normalRightSwipeDown.visualDy, -150);

  // Rotated 90deg clockwise (iOS forced landscape): visual left->right is physical top->bottom
  const rotatedSeekRight = getVisualGestureMetrics(
    { clientX: 250, clientY: 100 },
    { clientX: 250, clientY: 400 },
    { left: 0, top: 0, width: 500, height: 1000 },
    true
  );
  assert.equal(rotatedSeekRight.visualDx, 300);
  assert.equal(rotatedSeekRight.isLeftHalf, true);
});

test('fullscreen gesture calculations clamp seek, brightness, and volume', () => {
  assert.equal(computeSeekTargetTime(100, 600, 500, 1000), 160);
  assert.equal(computeSeekTargetTime(10, 600, -500, 1000), 0);
  assert.equal(computeSeekTargetTime(590, 600, 500, 1000), 600);

  assert.ok(computeBrightnessLevel(1.0, 300, 500) > 1.0);
  assert.equal(computeBrightnessLevel(1.4, 500, 500), 1.5);
  assert.equal(computeBrightnessLevel(0.3, -500, 500), 0.2);

  assert.equal(computeVolumeLevel(0.5, 300, 500), 1);
  assert.equal(computeVolumeLevel(0.2, -300, 500), 0);
});

test('history and favorites triggers are fixed in top-right navbar without floating hook', () => {
  const historySidebar = readFileSync(
    join(projectRoot, 'components/history/WatchHistorySidebar.tsx'),
    'utf8'
  );
  const favoritesSidebar = readFileSync(
    join(projectRoot, 'components/favorites/FavoritesSidebar.tsx'),
    'utf8'
  );
  const navbar = readFileSync(join(projectRoot, 'components/layout/Navbar.tsx'), 'utf8');
  const playerNavbar = readFileSync(
    join(projectRoot, 'components/player/PlayerNavbar.tsx'),
    'utf8'
  );

  assert.doesNotMatch(historySidebar, /useFloatingButtonPosition/);
  assert.doesNotMatch(favoritesSidebar, /useFloatingButtonPosition/);
  assert.match(navbar, /<WatchHistorySidebar/);
  assert.match(navbar, /<FavoritesSidebar/);
  assert.match(playerNavbar, /<WatchHistorySidebar/);
  assert.match(playerNavbar, /<FavoritesSidebar/);
});
