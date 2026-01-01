export interface TransferTokens {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    userId: string;
    organizationId: number;
    ip: string;
}

export function createTransferCodeData(
    session: { access_token: string; refresh_token: string; expires_at?: number },
    userId: string,
    organizationId: number,
    ip: string
): TransferTokens {
    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        userId,
        organizationId,
        ip,
    };
}


