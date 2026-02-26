
export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto p-8 pt-16 space-y-8 text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl font-bold border-b pb-4">Conditions Générales d'Utilisation</h1>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Objet</h2>
                <p>
                    Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet d'encadrer l'accès et l'utilisation de la plateforme <strong>Restaurant-OS</strong>,
                    conçue pour la gestion interne des établissements de restauration.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">2. Accès aux services bancaires</h2>
                <p>
                    L'utilisateur peut choisir de lier son compte bancaire professionnel à l'application.
                    Cette fonctionnalité est fournie via l'infrastructure technique d'<strong>Enable Banking</strong>.
                </p>
                <p>
                    En utilisant ce service, l'utilisateur accepte que Restaurant-OS accède aux données de transaction en temps réel pour faciliter la gestion de l'entreprise.
                    L'accès est fourni conformément aux réglementations sur les services de paiement (DSP2).
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">3. Responsabilité</h2>
                <p>
                    Restaurant-OS s'engage à fournir un service sécurisé. Toutefois, l'utilisateur est responsable de la conservation de ses accès personnels (identifiants, mots de passe).
                    En aucun cas Restaurant-OS ne pourra être tenu responsable des pertes liées à une mauvaise utilisation des accès de l'utilisateur.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">4. Propriété intellectuelle</h2>
                <p>
                    L'ensemble des éléments constituant l'application Restaurant-OS est la propriété exclusive de son éditeur.
                    Toute reproduction non autorisée est strictement interdite.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">5. Modifications</h2>
                <p>
                    Nous nous réservons le droit de modifier ces conditions à tout moment pour nous adapter aux évolutions législatives ou techniques.
                </p>
            </section>

            <footer className="pt-8 text-sm text-gray-500 italic border-t">
                Dernière mise à jour : 26 Février 2026
            </footer>
        </div>
    )
}
