
export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto p-8 pt-16 space-y-8 text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl font-bold border-b pb-4">Politique de Confidentialité</h1>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Introduction</h2>
                <p>
                    Bienvenue sur <strong>Restaurant-OS</strong>. Nous attachons une importance capitale à la protection de vos données personnelles.
                    Cette politique explique comment nous traitons vos informations dans le cadre de l'utilisation de notre plateforme de gestion.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">2. Données bancaires via Open Banking</h2>
                <p>
                    Notre application utilise les services d'<strong>Enable Banking</strong> pour accéder à vos informations de compte bancaire en mode lecture seule.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Accès sécurisé :</strong> L'accès est strictement limité à la consultation de l'historique des transactions.</li>
                    <li><strong>Pas de contrôle de fonds :</strong> Ni Restaurant-OS ni Enable Banking ne peuvent effectuer de transferts, de paiements ou modifier vos soldes.</li>
                    <li><strong>Confidentialité :</strong> Vos identifiants bancaires ne sont jamais stockés par Restaurant-OS. La connexion s'effectue directement via l'interface sécurisée de votre banque.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">3. Utilisation des données</h2>
                <p>
                    Les données collectées sont utilisées exclusivement pour :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>La gestion financière et comptable de votre restaurant.</li>
                    <li>L'automatisation du suivi de trésorerie.</li>
                    <li>La réconciliation des factures fournisseurs.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">4. Sécurité</h2>
                <p>
                    Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou destruction.
                    L'ensemble des communications avec les services bancaires est chiffré selon les standards industriels les plus élevés.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">5. Contact</h2>
                <p>
                    Pour toute question concernant cette politique, vous pouvez nous contacter à : <br />
                    <strong>Email :</strong> a.belal@siwa-bleury.fr
                </p>
            </section>

            <footer className="pt-8 text-sm text-gray-500 italic border-t">
                Dernière mise à jour : 26 Février 2026
            </footer>
        </div>
    )
}
