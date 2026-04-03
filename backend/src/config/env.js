import dotenv from 'dotenv';
import path from 'path';

const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '..', '.env'),
];

for (const envPath of envCandidates) {
    dotenv.config({ path: envPath, override: false });
}

const requiredProductionVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'FRONTEND_URL',
    'CORS_ORIGIN',
];

const invalidProductionValues = new Map([
    ['JWT_SECRET', ['replace-with-a-long-random-secret', 'your_jwt_secret']],
    ['SESSION_SECRET', ['replace-with-a-long-random-session-secret', 'your_session_secret']],
]);

const googleOauthVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
const googlePlaceholderValues = new Map([
    ['GOOGLE_CLIENT_ID', ['replace-me', 'YOUR_GOOGLE_CLIENT_ID']],
    ['GOOGLE_CLIENT_SECRET', ['replace-me', 'YOUR_GOOGLE_CLIENT_SECRET']],
    ['GOOGLE_CALLBACK_URL', ['http://localhost:5000/api/auth/google/callback', '/api/auth/google/callback']],
]);

const hasDatabaseConfig =
    Boolean(process.env.DATABASE_URL) ||
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].every((key) => Boolean(process.env[key]));

if (process.env.NODE_ENV === 'production') {
    const missingVars = requiredProductionVars.filter((key) => !process.env[key]);
    const invalidVars = Array.from(invalidProductionValues.entries())
        .filter(([key, blockedValues]) => process.env[key] && blockedValues.includes(process.env[key]))
        .map(([key]) => key);
    const providedGoogleVars = googleOauthVars.filter((key) => {
        const value = process.env[key];
        const placeholderValues = googlePlaceholderValues.get(key) || [];

        return Boolean(value) && !placeholderValues.includes(value);
    });

    if (providedGoogleVars.length > 0 && providedGoogleVars.length !== googleOauthVars.length) {
        missingVars.push('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_CALLBACK_URL must be configured together');
    }

    if (!hasDatabaseConfig) {
        missingVars.push('DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD');
    }

    if (missingVars.length > 0 || invalidVars.length > 0) {
        const validationErrors = [
            ...missingVars,
            ...invalidVars.map((key) => `${key} has a placeholder value`),
        ];

        throw new Error(`Invalid production environment configuration: ${validationErrors.join(', ')}`);
    }
}
