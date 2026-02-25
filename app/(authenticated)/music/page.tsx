
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBands, getEvents } from "./actions"
import { AddBandDialog } from "./components/AddBandDialog"
import { AddEventDialog } from "./components/AddEventDialog"
import { BandsList } from "./components/BandsList"
import { EventsList } from "./components/EventsList"

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
