class ComposableCycle {
  constructor(swapMap, directedCycles) {
    this.swapMap = swapMap;
    for (let targetStickerId in swapMap) {
      let sourceStickerId = swapMap[targetStickerId];
      if (targetStickerId === sourceStickerId) {
        delete swapMap[targetStickerId];
      }
    }
    this.directedCycles = directedCycles;
    this.size = Object.keys(swapMap).length;
  }

  getSketchFromRootStickers(rootStickers) {
    let isVisited = {};
    let orderedStickerSets = [];
    for (let rootSticker of rootStickers) {
      if (!this.swapMap[rootSticker]) {
        continue;
      }
      let curSticker = rootSticker;
      if (this.swapMap[curSticker] && !isVisited[curSticker]) {
        let orderedStickers = [];
        let minSticker = curSticker;
        while (!isVisited[curSticker]) {
          isVisited[curSticker] = true;
          orderedStickers.push(curSticker);
          if (curSticker < minSticker) minSticker = curSticker;
          curSticker = this.swapMap[curSticker];
        }
        let minIndex = orderedStickers.lastIndexOf(minSticker);
        orderedStickers = orderedStickers
          .slice(minIndex)
          .concat(orderedStickers.slice(0, minIndex));
        orderedStickerSets.push(orderedStickers.join("|"));
      }
    }
    orderedStickerSets.sort();
    return orderedStickerSets.join("$");
  }

  inverse() {
    let iSwapMap = {};
    for (let key in this.swapMap) {
      iSwapMap[this.swapMap[key]] = key;
    }
    let iDirectedCycles = this.directedCycles
      .map(
        ({ cycleIndex, period, direction }) =>
          new DirectedCycle(cycleIndex, period, period - direction)
      )
      .reverse();
    return new ComposableCycle(iSwapMap, iDirectedCycles);
  }

  overlaps(composableCycle) {
    for (let key in composableCycle.swapMap) {
      if (this.swapMap[key]) {
        return true;
      }
    }
    return false;
  }
}

ComposableCycle.fromCycle = (cycle) => {
  let composableCycles = [];
  for (let direction = 1; direction < cycle.period; direction++) {
    let swapMap = {};
    for (let collection of cycle.stickerCollections) {
      if (collection.length === 1) continue;
      let increment = (direction * collection.length) / cycle.period;
      for (let index = 0; index < collection.length; index++) {
        let sticker = collection[index];
        swapMap[sticker.id] =
          collection[mod(index - increment, collection.length)].id;
      }
    }
    composableCycles.push(
      new ComposableCycle(swapMap, [
        new DirectedCycle(cycle.index, cycle.period, direction),
      ])
    );
  }
  return composableCycles;
};

ComposableCycle.fromComposableCycles = (composableCycles, metadata) => {
  let swapMap = {};
  let directedCycles = [];
  for (let i = 0; i < composableCycles.length; i++) {
    let composableCycle = composableCycles[i];
    let meta = metadata && metadata[i];
    let newSwapMap = {};
    for (let targetStickerId in swapMap) {
      let sourceStickerId = swapMap[targetStickerId];
      newSwapMap[targetStickerId] = sourceStickerId;
    }
    for (let targetStickerId in composableCycle.swapMap) {
      let sourceStickerId = composableCycle.swapMap[targetStickerId];
      if (swapMap[sourceStickerId]) {
        newSwapMap[targetStickerId] = swapMap[sourceStickerId];
      } else {
        newSwapMap[targetStickerId] = sourceStickerId;
      }
    }
    swapMap = newSwapMap;
    if (!meta) {
      directedCycles = directedCycles.concat(composableCycle.directedCycles);
    } else {
      directedCycles = directedCycles.concat(
        composableCycle.directedCycles.map(
          ({ cycleIndex, period, direction }) =>
            new DirectedCycle(
              cycleIndex,
              period,
              direction,
              meta.sequence,
              meta.subSequence
            )
        )
      );
    }
  }
  return new ComposableCycle(swapMap, directedCycles);
};
