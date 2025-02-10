import { describe, expect, test } from '@jest/globals';
import { Bookmarks } from 'view/models/BookmarksModel';

describe('Bookmarks Model', () => {
  test('update positions: MUST change target', () => {
    const example = [4, 1, 0], target = [7, 1, 0]
    Bookmarks.updatePositions(example, target)

    expect(target).toEqual([6, 1, 0])
  });

  test('update positions: MUST do not change target', () => {
    const example = [4, 1, 0], target = [2, 1, 0]
    Bookmarks.updatePositions(example, target)

    expect(target).toEqual([2, 1, 0])
  })
});