import { auth } from '@/lib/auth';
import { authDb } from '@/lib/db';
import { schema } from '@/zenstack/schema';
import { RPCApiHandler } from '@zenstackhq/server/api';
import { NextRequestHandler } from '@zenstackhq/server/next';
import { headers } from 'next/headers';

async function getClient() {
    const reqHeaders = await headers();
    const sessionResult = await auth.api.getSession({
        headers: reqHeaders,
    });

    if (!sessionResult) {
        // anonymous user, create enhanced client without user context
        return authDb;
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
    return authDb.$setAuth(userContext as any);
}

const handler = NextRequestHandler({
    apiHandler: new RPCApiHandler({ schema }),
    getClient,
    useAppDir: true,
});

export {
    handler as DELETE,
    handler as GET,
    handler as PATCH,
    handler as POST,
    handler as PUT,
};
