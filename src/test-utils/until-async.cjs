function until(promiseFactory) {
  return Promise.resolve()
    .then(() => promiseFactory())
    .then(
      (result) => [null, result],
      (error) => [error, null]
    );
}

module.exports = { until };
