type LogLevel = "info" | "warn" | "error";

const writeLog = (level: LogLevel, event: string, payload: Record<string, any>) => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  console.log(entry);
};

export const logInfo = (event: string, payload: Record<string, any> = {}) =>
  writeLog("info", event, payload);

export const logWarn = (event: string, payload: Record<string, any> = {}) =>
  writeLog("warn", event, payload);

export const logError = (event: string, payload: Record<string, any> = {}) =>
  writeLog("error", event, payload);
