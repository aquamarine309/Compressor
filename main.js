function parseToCurrentVersion(save) {
  let player = GameSaveSerializer.deserialize(save.trim());
  if (!player) return null;
  player = deepmergeAll([Player, player]);
  player = migrations.patchPreReality(player);
  player = migrations.patchPostReality(player);
  return GameSaveSerializer.serialize(clearPlayer(player, Player));
}


function clearPlayer(data, def) {
  if (data instanceof Decimal) {
    if (data.eq(def)) return;
    if (data.lt(1)) return Decimal.round(data.times(1e8)).div(1e8);
    if (data.lt(9e15)) return Decimal.round(data.times(1e4)).div(1e4);
    return Decimal.fromMantissaExponent(clearPlayer(data.mantissa, null), data.exponent);
  }
  
  if (data === def) return;
  switch(typeof data) {
    case "number":
      if (Number.isInteger(data)) return data;
      return clearPlayer(new Decimal(data)).toNumber();
    case "object":
      if (Object.prototype.toString.call(data) !== "[object Object]") return data;
      const newObject = {};
      for (const property in data) {
        if (data[property] === void 0) continue;
        const cleared = clearPlayer(data[property], def?.[property]);
        if (cleared !== void 0 && cleared !== null && (typeof cleared !== "object" || Object.keys(cleared).length !== 0)) {
          newObject[property] = cleared;
        }
      }
      return newObject;
    default: 
      return data === def ? void 0 : data;
  }
}

const app = new Vue({
  el: "#app",
  data() {
    return {
      text: ""
    }
  },
  computed: {
    output() {
      return parseToCurrentVersion(this.text);
    }
  },
  methods: {
    copy() {
      copyToClipboard(this.output);
    }
  }
});