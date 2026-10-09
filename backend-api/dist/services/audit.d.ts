import type { Prisma } from "@prisma/client";
export declare function logAudit(params: {
    actorId?: string;
    companyId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
}): Promise<void>;
export declare function getAuditLogsPage(params?: any): Promise<{
    data: ({
        actor: {
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        companyId: string | null;
        actorId: string | null;
        action: string;
        entityType: string;
        entityId: string | null;
        beforeJson: Prisma.JsonValue | null;
        afterJson: Prisma.JsonValue | null;
    })[];
    total: number;
    page: number;
    limit: number;
    offset: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
//# sourceMappingURL=audit.d.ts.map