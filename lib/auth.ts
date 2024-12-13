import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, bearer, organization } from 'better-auth/plugins';
import { prisma } from './db';
import { reactInvitationEmail } from './email/invitation';
import { resend } from './email/resend';
import { reactResetPasswordEmail } from './email/rest-password';

const from = process.env.BETTER_AUTH_EMAIL || 'delivered@resend.dev';
const to = process.env.TEST_EMAIL || '';

export const auth = betterAuth({
    appName: 'Better Auth Demo',
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),
    emailVerification: {
        async sendVerificationEmail({ user, url }) {
            console.log('Sending verification email to', user.email);
            const res = await resend.emails.send({
                from,
                to: to || user.email,
                subject: 'Verify your email address',
                html: `<a href="${url}">Verify your email address</a>`,
            });
            console.log(res, user.email);
        },
        sendOnSignUp: true,
    },
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            await resend.emails.send({
                from,
                to: user.email,
                subject: 'Reset your password',
                react: reactResetPasswordEmail({
                    username: user.email,
                    resetLink: url,
                }),
            });
        },
    },
    plugins: [
        organization({
            async sendInvitationEmail(data) {
                const res = await resend.emails.send({
                    from,
                    to: data.email,
                    subject: "You've been invited to join an organization",
                    react: reactInvitationEmail({
                        username: data.email,
                        invitedByUsername: data.inviter.user.name,
                        invitedByEmail: data.inviter.user.email,
                        teamName: data.organization.name,
                        inviteLink:
                            process.env.NODE_ENV === 'development'
                                ? `http://localhost:3000/accept-invitation/${data.id}`
                                : `${
                                      process.env.BETTER_AUTH_URL ||
                                      'https://demo.better-auth.com'
                                  }/accept-invitation/${data.id}`,
                    }),
                });
                console.log(res, data.email);
            },
        }),
        bearer(),
        admin(),
        nextCookies(),
    ],
});
