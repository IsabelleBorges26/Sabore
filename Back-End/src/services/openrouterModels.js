const PRIMARY_MODEL = "google/gemma-4-31b-it:free";
const FALLBACK_MODEL = "openrouter/free";
const MODELS = Object.freeze([PRIMARY_MODEL, FALLBACK_MODEL]);

module.exports = { PRIMARY_MODEL, FALLBACK_MODEL, MODELS };
