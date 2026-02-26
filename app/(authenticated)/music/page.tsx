
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBands, getEvents } from "./actions"
import { AddBandDialog } from "./components/AddBandDialog"
import { AddEventDialog } from "./components/AddEventDialog"
import { BandsList } from "./components/BandsList"
import { EventsList } from "./components/EventsList"
import { ImportMusicButton } from "./components/ImportMusicButton"

export const dynamic = 'force-dynamic'

export default async function MusicPage() {
    const bands = await getBands()
    const events = await getEvents()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary font-oswald uppercase">Programmation Musicale</h2>
                    <p className="text-muted-foreground">
                        Planifiez les concerts, suivez les cachets et gérez les factures des artistes.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <ImportMusicButton csvContent={`SUIVIE GROUPE,,,,,
ven. 20 sept. 2024,ICAUNA LATINA,TRUE,ESP,,150
sam. 21 sept. 2024,BASHTEK,FALSE,,,300
sam. 28 sept. 2024,KARAOKE,TRUE,ESP,,300
ven. 4 oct. 2024,LE DOC,TRUE,ESP,,300
sam. 5 oct. 2024,LEC &THE SIXTIES,TRUE,ESP,,300
ven. 11 oct. 2024,Jef Trio,FALSE,,Pas de Fact,
sam. 12 oct. 2024,CANYON,TRUE,ESP,,700
ven. 18 oct. 2024,KARAOKE,TRUE,ESP,,300
sam. 19 oct. 2024,YASSIN DERBOUKA,TRUE,,À envoyer ,300
ven. 25 oct. 2024,ZKEYM,TRUE,ESP,,300
sam. 26 oct. 2024,BLUES MILLENIUM,FALSE,Annulé,,300
ven. 1 nov. 2024,Icons Latina,TRUE,,Pas de Fact,0
sam. 2 nov. 2024,HEELS ACOUSTIC,TRUE,ESP,,300
ven. 8 nov. 2024,MR PINK,TRUE,ESP,,300
sam. 9 nov. 2024,Herby Music,TRUE,ESP,,300
ven. 15 nov. 2024,RAOUL VOLFONY,TRUE,ESP,,300
sam. 16 nov. 2024,KARAOKE,TRUE,ESP,,300
ven. 22 nov. 2024,BRS,TRUE,ESP,,3OO
sam. 23 nov. 2024,REGGEA BLASTER,TRUE,VIR,Asso Soley Vybz,350
ven. 29 nov. 2024,Bsarthek,FALSE,,,300
sam. 30 nov. 2024,SHAKIN MATE,TRUE,ESP,,375
ven. 6 déc. 2024,WOOD SOUL,TRUE,ESP,,300
sam. 7 déc. 2024,THE ESSONIANS,TRUE,ESP,,300
ven. 13 déc. 2024,Ozam,TRUE,ESP,,300
sam. 14 déc. 2024,KARAOKE,TRUE,ESP,,300
ven. 20 déc. 2024,Icona Latina,TRUE,,Pas de Fact,0
sam. 21 déc. 2024,TERRAIN VAGUE,TRUE,VIR,Asso Terrain Vague,300
ven. 10 janv. 2025,WILD,TRUE,ESP,,300
sam. 11 janv. 2025,TADAAM,FALSE,,A,
sam. 18 janv. 2025,Hydra's Project,TRUE,ESP,,300
ven. 24 janv. 2025,Karaoke,TRUE,Malade,Pas de Fact,0
sam. 25 janv. 2025,Oshala,TRUE,ESP,,400
ven. 31 janv. 2025,Tribute of Jhonny,TRUE,ESP,,300
sam. 1 févr. 2025,Dj Laurent Dormecy,TRUE,VIR,Laurent Scury,300
ven. 7 févr. 2025,Mikawell,TRUE,ESP,,300
sam. 8 févr. 2025,Broken Feet,TRUE,ESP,,300
ven. 14 févr. 2025,Heels Acoustique,TRUE,ESP,,300
sam. 15 févr. 2025,Keep Fonzy Cool,TRUE,ESP,,300
ven. 21 févr. 2025,Icona Latina,TRUE,,Pas de Fact,0
sam. 22 févr. 2025,Karaoke,TRUE,ESP,,300
ven. 28 févr. 2025,Keffaz,TRUE,ESP,,400
sam. 1 mars 2025,Blak-D,TRUE,ESP,,300
ven. 7 mars 2025,Icona Latina,TRUE,,Pas de Fact,0
sam. 8 mars 2025,Mr Hardearly,TRUE,ESP,,450
ven. 14 mars 2025,Sing.B,TRUE,VIR,Agence N,300
sam. 15 mars 2025,Les petits fils de Jeannine,TRUE,ESP,,300
ven. 21 mars 2025,Karaoke,TRUE,ESP,,300
sam. 22 mars 2025,Les Mutins,TRUE,VIR,Asso Ca Va Barder Mutins,300
ven. 28 mars 2025,Mr Pink,TRUE,ESP,,300
sam. 29 mars 2025,Frenchy Party,TRUE,ESP,,200
ven. 4 avr. 2025,Gentlemoon,TRUE,ESP,,300
sam. 5 avr. 2025,Norrac,FALSE,ESP,,300
ven. 11 avr. 2025,Berny's Troy,TRUE,VIR,Berny And Friend,300
sam. 12 avr. 2025,Canyon,TRUE,ESP,,700
ven. 18 avr. 2025,Icona Latina,TRUE,,Pas de Fact,0
sam. 19 avr. 2025,Karaoke,TRUE,ESP,,300
ven. 25 avr. 2025,Adrien Marco,TRUE,Vir,Le Triton,"185,41"
sam. 26 avr. 2025,Kamel et les peacemaker,TRUE,ESP,,
ven. 2 mai 2025,Discochic Dormercy DJ,TRUE,ESP,,300
sam. 3 mai 2025,Ratman,TRUE,,Annulé,
ven. 9 mai 2025,Kissé,TRUE,VIR,Compagnie l’Oiseau Monde,200
sam. 10 mai 2025,Raoul vol font,TRUE,ESP,,300
ven. 16 mai 2025,PMA ET LEXA PAS TOUT SEUL,TRUE,ESP,,300
sam. 17 mai 2025,Harold,TRUE,ESP,,400
ven. 30 mai 2025,KARAOKE,TRUE,ESP,,300
sam. 31 mai 2025,Le doc,TRUE,ESP,,300
sam. 7 juin 2025,Smokin,TRUE,VIR,Intermittent GIP,
sam. 14 juin 2025,Afrokan,TRUE,ESP,,400
lun. 16 juin 2025,DJ Fred,TRUE,ESP,,200
ven. 20 juin 2025,The mo’s,TRUE,ESP,,300
sam. 21 juin 2025,Gary,FALSE,,,
ven. 27 juin 2025,KARAOKE,TRUE,ESP,,300
sam. 28 juin 2025,Soul player,TRUE,ESP,,300
ven. 4 juil. 2025,Ozam,TRUE,ESP,,400
sam. 5 juil. 2025,Icona,TRUE,,Pas de Fact,0
ven. 11 juil. 2025,Martin boyer,TRUE,ESP,,
sam. 12 juil. 2025,Bsarthek,FALSE,,,
ven. 18 juil. 2025,Sarah ziegler,TRUE,Esp,,300
sam. 19 juil. 2025,KARAOKE,TRUE,ESP,,300
ven. 25 juil. 2025,Sing B,TRUE,VIR,Intermittent GIP,
sam. 2 août 2025,Bakin Road,TRUE,,Reçu A transférer,
sam. 9 août 2025,Blues Sweetness,TRUE,ESP,,
ven. 12 sept. 2025,Karaoke,TRUE,ESP,,
sam. 13 sept. 2025,Gafy ember,TRUE,ESP,Uniquement le contratMail envoyer ,300
sam. 20 sept. 2025,Une touche d’optimisme,TRUE,VIR,Intermittent GIP,
ven. 26 sept. 2025,Anna Song,TRUE,ESP,,300
sam. 27 sept. 2025,Discochic,TRUE,VIR,Laurent Scuri,300
ven. 3 oct. 2025,Alfonz Band,TRUE,ESP,,300
sam. 4 oct. 2025,Canyon,TRUE,ESP,,700
ven. 10 oct. 2025,Oshala,TRUE,ESP,,400
sam. 18 oct. 2025,Karaoke,TRUE,ESP,,300
ven. 24 oct. 2025,Harold & Willy,FALSE,,,
sam. 25 oct. 2025,Shakin Mate,TRUE,ESP,,300
ven. 31 oct. 2025,SING B DJ Fred,TRUE,Vir,,
sam. 1 nov. 2025,One Shot,TRUE,ESP,,300
ven. 7 nov. 2025,Mister Leu,FALSE,,,
sam. 8 nov. 2025,Herby Music,TRUE,ESP,,300
mar. 11 nov. 2025,Toines,TRUE,,,
sam. 15 nov. 2025,Black D,TRUE,ESP,,300
sam. 29 nov. 2025,The Mobs,FALSE,,,
,,FALSE,,,`} />
                    <AddBandDialog />
                    <AddEventDialog bands={bands} />
                </div>
            </div>

            <Tabs defaultValue="events" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="events">Agenda & Concerts</TabsTrigger>
                    <TabsTrigger value="bands">Artistes & Groupes</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4">
                    <EventsList initialEvents={events} />
                </TabsContent>

                <TabsContent value="bands" className="space-y-4">
                    <BandsList initialBands={bands} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
