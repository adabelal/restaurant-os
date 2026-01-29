
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RHLoading() {
    return (
        <main className="flex min-h-screen flex-col bg-gray-50/30">
            <div className="w-full bg-white border-b px-8 py-12 md:px-12 md:py-16">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Skeleton className="h-10 w-48 mb-2" />
                        <Skeleton className="h-6 w-96" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>

            <div className="flex-1 px-8 py-12 md:px-12 max-w-6xl mx-auto w-full">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden border-slate-200 bg-white">
                            <div className="h-2 w-full bg-slate-100" />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div>
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="border-t pt-4 mt-4 flex justify-between">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}
