module.exports = {
  root: true,
  env: { 
    node: true,
    es2020: true
  },
  extends: [
    "eslint:recommended"
  ],
  parserOptions: { 
    ecmaVersion: "latest", 
    sourceType: "module" 
  },
  rules: {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-undef": "error"
  }
}; 