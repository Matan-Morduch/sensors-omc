interface HasTimestamp {
  timestamp: Date;
}

export function findEarliestAndLatest<T extends HasTimestamp>(
  objects: T[]
): { earliest: Date | null; latest: Date | null } {
  return objects.reduce<{
    earliest: Date | null;
    latest: Date | null;
  }>(
    (acc, obj) => {
      if (!acc.earliest || obj.timestamp < acc.earliest) {
        acc.earliest = obj.timestamp;
      }
      if (!acc.latest || obj.timestamp > acc.latest) {
        acc.latest = obj.timestamp;
      }
      return acc;
    },
    { earliest: null, latest: null }
  );
}
