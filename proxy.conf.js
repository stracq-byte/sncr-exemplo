const PROXY_CONFIG = {
  "/api": {
    target: "https://sncr-api.hmg.apps.anvisa.gov.br",
    secure: true,
    changeOrigin: true,
    autoRewrite: true,
    logLevel: "debug"
  }
};

module.exports = PROXY_CONFIG;