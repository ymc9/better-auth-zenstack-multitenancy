import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enhance } from '@zenstackhq/runtime';
import { NextRequestHandler } from '@zenstackhq/server/next';
import { headers } from 'next/headers';

async function getPrisma() {
    const reqHeaders = await headers();
    const sessionResult = await auth.api.getSession({
        headers: reqHeaders,
    });

    if (!sessionResult) {
        // anonymous user, create enhanced client without user context
        return enhance(prisma);
    }

    let organizationId: string | undefined = undefined;
    let organizationRole: string | undefined = undefined;
    const { session } = sessionResult;

    if (session.activeOrganizationId) {
        // if there's an active orgId, get the role of the user in the org
        organizationId = session.activeOrganizationId;
        const org = await auth.api.getFullOrganization({ headers: reqHeaders });
        if (org?.members) {
            const myMember = org.members.find(
                (m) => m.userId === session.userId
            );
            organizationRole = myMember?.role;
        }
    }

    // create enhanced client with user context
    const userContext = {
        userId: session.userId,
        organizationId,
        organizationRole,
    };
    return enhance(prisma, { user: userContext });
}

const handler = NextRequestHandler({ getPrisma, useAppDir: true });

export {
    handler as DELETE,
    handler as GET,
    handler as PATCH,
    handler as POST,
    handler as PUT,
};
