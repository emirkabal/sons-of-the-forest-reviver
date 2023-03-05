module.exports.getReadableJSON = function (json) {
  return JSON.parse(json.replace(/\\"/g, '"'));
};

module.exports.getWritableJSON = function (json) {
  return JSON.stringify(json);
};
