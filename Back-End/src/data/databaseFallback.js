const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const FALLBACK_WINDOW_MS = 5 * 60_000;
let databaseUnavailableUntil = 0;
let connectivityCheck = null;

function isDatabaseConnectionError(error) {
    const message = `${error?.code || ""} ${error?.message || ""}`;

    return /P1001|P1002|P1017|Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|connection (?:closed|terminated|timed out)/i.test(message);
}

function getProjectRef() {
    if (process.env.SUPABASE_URL) {
        return new URL(process.env.SUPABASE_URL).hostname.split(".")[0];
    }

    const databaseUrl = new URL(process.env.DATABASE_URL);
    const username = decodeURIComponent(databaseUrl.username);
    const prefix = "postgres.";

    if (!username.startsWith(prefix)) {
        throw new Error("Não foi possível identificar o projeto Supabase pela DATABASE_URL.");
    }

    return username.slice(prefix.length);
}

function getSupabaseConfig() {
    const apiKey = process.env["SUPABASE_SECRET-KEY"] || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey) {
        throw new Error("SUPABASE_SECRET-KEY não foi configurada em Back-End/.env");
    }

    return {
        baseUrl: `https://${getProjectRef()}.supabase.co/rest/v1`,
        apiKey
    };
}

async function supabaseRest(pathname, options = {}) {
    const { baseUrl, apiKey } = getSupabaseConfig();
    const response = await fetch(`${baseUrl}/${pathname}`, {
        ...options,
        headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        },
        signal: options.signal || AbortSignal.timeout(10_000)
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const detail = data?.message || data?.details || `HTTP ${response.status}`;
        throw new Error(`Falha no fallback HTTPS do Supabase: ${detail}`);
    }

    return data;
}

async function withDatabaseFallback(prismaOperation, restOperation, label) {
    if (Date.now() < databaseUnavailableUntil) {
        return restOperation();
    }

    if (connectivityCheck) {
        const databaseAvailable = await connectivityCheck;
        return databaseAvailable ? prismaOperation() : restOperation();
    }

    let finishConnectivityCheck;
    connectivityCheck = new Promise((resolve) => {
        finishConnectivityCheck = resolve;
    });

    try {
        const result = await prismaOperation();
        finishConnectivityCheck(true);
        return result;
    } catch (error) {
        if (!isDatabaseConnectionError(error)) {
            finishConnectivityCheck(true);
            throw error;
        }

        databaseUnavailableUntil = Date.now() + FALLBACK_WINDOW_MS;
        finishConnectivityCheck(false);
        console.warn(`[Banco] PostgreSQL indisponível em ${label}; usando Supabase HTTPS.`);
        return restOperation();
    } finally {
        connectivityCheck = null;
    }
}

module.exports = {
    isDatabaseConnectionError,
    supabaseRest,
    withDatabaseFallback
};
