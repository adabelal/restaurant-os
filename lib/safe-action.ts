import { getServerSession } from "next-auth";

type ActionContext = {
    user: {
        id: string;
        role: string;
    };
};

type SafeActionHandler<TInput, TOutput> = (
    input: TInput,
    context: ActionContext
) => Promise<TOutput>;

const allowedRoles = ["STAFF", "MANAGER", "ADMIN"];

export async function safeAction<TInput, TOutput>(
    input: TInput,
    handler: SafeActionHandler<TInput, TOutput>
): Promise<TOutput | { error: string }> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { error: "Non authentifié" };
        }

        const { role, id } = session.user as any;

        if (!allowedRoles.includes(role || "USER")) {
            return { error: "Permission refusée : Rôle insuffisant" };
        }

        return await handler(input, { user: { id: id || "unknown", role: role || "USER" } });
    } catch (error: any) {
        console.error("Erreur safeAction:", error);
        return { error: error.message || "Erreur interne du serveur" };
    }
}
