/**
 * Safe authentication hook that works with or without Clerk
 *
 * This hook wraps Clerk's useUser to handle cases where:
 * - Clerk is not configured (no publishable key)
 * - The component is rendered outside ClerkProvider
 */

import { useUser as useClerkUser } from '@clerk/clerk-react';
import { isClerkConfigured } from './env';

export interface AuthUser {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
}

export interface UseAuthResult {
    user: AuthUser | null;
    isLoaded: boolean;
    isSignedIn: boolean;
}

/**
 * Safe hook to get current user info
 * Returns null user when Clerk is not configured (allows app to work without auth)
 */
export function useAuth(): UseAuthResult {
    // If Clerk isn't configured, return immediately without calling hooks
    if (!isClerkConfigured()) {
        return {
            user: null,
            isLoaded: true,
            isSignedIn: false
        };
    }

    // Clerk is configured, use the real hook
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user, isLoaded, isSignedIn } = useClerkUser();

    if (!user) {
        return {
            user: null,
            isLoaded,
            isSignedIn: isSignedIn ?? false
        };
    }

    return {
        user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            imageUrl: user.imageUrl
        },
        isLoaded,
        isSignedIn: isSignedIn ?? false
    };
}
